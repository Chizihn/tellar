import "./buffer-polyfill";
import { SmartAccountKit, LocalStorageAdapter } from "smart-account-kit";
import {
  ACCOUNT_WASM_HASH,
  APP_NAME,
  NETWORK_PASSPHRASE,
  RELAYER_URL,
  RPC_URL,
  WEBAUTHN_VERIFIER_ADDRESS,
} from "./config";

let kitInstance: SmartAccountKit | null = null;

/**
 * Lazily-constructed singleton — never instantiate at module scope, this
 * file is imported from client components that Next.js also evaluates
 * during SSR, where `localStorage` doesn't exist.
 *
 * Deliberately omits the `webAuthn` config override: the kit's default
 * `@simplewebauthn/browser` implementation is exactly right in a real
 * browser (see docs/ARCHITECTURE.md §4 — that override is a React Native
 * workaround, not needed here).
 */
export function getKit(): SmartAccountKit {
  if (!kitInstance) {
    kitInstance = new SmartAccountKit({
      rpcUrl: RPC_URL,
      networkPassphrase: NETWORK_PASSPHRASE,
      accountWasmHash: ACCOUNT_WASM_HASH,
      webauthnVerifierAddress: WEBAUTHN_VERIFIER_ADDRESS,
      storage: new LocalStorageAdapter(),
      relayerUrl: RELAYER_URL,
      rpName: APP_NAME,
    });
  }
  return kitInstance;
}
