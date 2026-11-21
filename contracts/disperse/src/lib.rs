#![no_std]

use soroban_sdk::{contract, contractimpl, token, Address, Env, Vec};

/// Fans out a single token across many recipients from within one Soroban
/// contract call. Exists because Soroban caps a contract-invoking
/// transaction at exactly one operation — a passkey smart wallet's
/// `execute()` can only target one contract call, so "N payments, one
/// signature, one transaction" has to happen *inside* that one call rather
/// than as N operations in the transaction envelope.
#[contract]
pub struct Disperse;

#[contractimpl]
impl Disperse {
    /// Transfers `amounts[i]` of `token` from `from` to `recipients[i]`, for
    /// every index. All of `from`'s token-transfer authorizations are
    /// collected under this one call, so a single smart-wallet passkey
    /// signature covers every transfer.
    pub fn disperse(env: Env, from: Address, token: Address, recipients: Vec<Address>, amounts: Vec<i128>) {
        if recipients.len() != amounts.len() {
            panic!("recipients and amounts must be the same length");
        }

        from.require_auth();

        let client = token::Client::new(&env, &token);
        for i in 0..recipients.len() {
            let to = recipients.get(i).unwrap();
            let amount = amounts.get(i).unwrap();
            client.transfer(&from, &to, &amount);
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, token::StellarAssetClient};

    #[test]
    fn disperses_to_all_recipients() {
        let env = Env::default();
        env.mock_all_auths();

        let sender = Address::generate(&env);
        let r1 = Address::generate(&env);
        let r2 = Address::generate(&env);

        let token_admin = Address::generate(&env);
        let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
        let token_id = token_contract.address();
        let asset_client = StellarAssetClient::new(&env, &token_id);
        asset_client.mint(&sender, &1_000i128);

        let disperse_id = env.register(Disperse, ());
        let disperse_client = DisperseClient::new(&env, &disperse_id);

        let recipients = Vec::from_array(&env, [r1.clone(), r2.clone()]);
        let amounts = Vec::from_array(&env, [300i128, 400i128]);
        disperse_client.disperse(&sender, &token_id, &recipients, &amounts);

        let token_client = token::Client::new(&env, &token_id);
        assert_eq!(token_client.balance(&r1), 300);
        assert_eq!(token_client.balance(&r2), 400);
        assert_eq!(token_client.balance(&sender), 300);
    }

    #[test]
    #[should_panic(expected = "recipients and amounts must be the same length")]
    fn rejects_mismatched_lengths() {
        let env = Env::default();
        env.mock_all_auths();

        let sender = Address::generate(&env);
        let r1 = Address::generate(&env);
        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin).address();

        let disperse_id = env.register(Disperse, ());
        let disperse_client = DisperseClient::new(&env, &disperse_id);

        let recipients = Vec::from_array(&env, [r1]);
        let amounts = Vec::from_array(&env, [100i128, 200i128]);
        disperse_client.disperse(&sender, &token_id, &recipients, &amounts);
    }
}
