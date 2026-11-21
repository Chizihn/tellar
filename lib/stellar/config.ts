/**
 * Testnet-only constants. See contracts/disperse and the deploy trail in
 * that directory's history for where DISPERSE_CONTRACT_ID came from, and
 * docs/ARCHITECTURE.md for why ACCOUNT_WASM_HASH/WEBAUTHN_VERIFIER_ADDRESS
 * are the current stellar-accounts v0.8.0 testnet deployment.
 */
/**
 * Validated, not just `||`-defaulted: an env var that's blank, missing
 * the `https://` scheme, or otherwise malformed (e.g. a dashboard entry
 * copy-pasted wrong on Vercel) makes the SDK's RPC client throw "Cannot
 * connect to insecure Soroban RPC server" — this falls back to the known-
 * good default for anything that isn't an actual https:// URL, instead of
 * trusting the env var blindly.
 */
function httpsUrlOr(value: string | undefined, fallback: string): string {
  return value && value.startsWith("https://") ? value : fallback;
}

export const RPC_URL = httpsUrlOr(
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
  "https://soroban-testnet.stellar.org"
);
export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || "Test SDF Network ; September 2015";

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
 * Our server-side relayer endpoint (app/api/relayer/route.ts) — fee-sponsors
 * wallet creation and payment submission so users never need their own
 * funded testnet XLM. The fee-paying secret lives in the server-only
 * RELAYER_SECRET env var and never reaches the browser; do NOT reintroduce
 * a deployerSecret/NEXT_PUBLIC_* secret here — see git history on this file
 * for why (a hardcoded secret key was briefly bundled into client JS).
 */
export const RELAYER_URL = "/api/relayer";

