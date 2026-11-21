import { Buffer } from "buffer";

/**
 * smart-account-kit's generateChallenge() calls Buffer.from(bytes) assuming
 * a global Buffer. Node has one; browsers (and webpack 5, which doesn't
 * auto-polyfill Node core modules) don't. Import this before anything that
 * touches smart-account-kit.
 */
if (typeof globalThis.Buffer === "undefined") {
  globalThis.Buffer = Buffer;
}
