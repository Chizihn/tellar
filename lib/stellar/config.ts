/**
 * Testnet-only constants. See contracts/disperse and the deploy trail in
 * that directory's history for where DISPERSE_CONTRACT_ID came from, and
 * docs/ARCHITECTURE.md for why ACCOUNT_WASM_HASH/WEBAUTHN_VERIFIER_ADDRESS
 * are the current stellar-accounts v0.8.0 testnet deployment.
 */
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";

export const ACCOUNT_WASM_HASH =
  "c514d35ea67eaea9bfc1fb3327854c0c06111bc1ddebd4fe217c504c1004b9e1";
export const WEBAUTHN_VERIFIER_ADDRESS =
  "CC7EKIHQP3TN4CARQDND6CEOY2UXLWWC2X5GHTD5NLAT7BG5GPZIOM3F";

/** Testnet native XLM Stellar Asset Contract, derived via `stellar contract id asset --asset native --network testnet`. */
export const NATIVE_TOKEN_CONTRACT =
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/** Our own disperse contract (contracts/disperse) — deployed to testnet, fans out one token to many recipients in a single call. */
export const DISPERSE_CONTRACT_ID =
  "CCD7HLLXEIX73CHTJ3YE3WGJVIUBB4V3X7OVNHAYE463B5HARPEHMVPF";

export const APP_NAME = "Tellar";

/**
 * Dedicated funded deployer account secret for testnet smart account creation.
 * Required by smart-account-kit when auto-submitting deployment transactions via RPC.
 */
export const DEPLOYER_SECRET =
  process.env.NEXT_PUBLIC_DEPLOYER_SECRET ??
  "SCRQQ5X3GYMJWER52YCRH5XVP5LWI5AYB7K26ZE6M7SVEPR6CEUJYBZ6";

