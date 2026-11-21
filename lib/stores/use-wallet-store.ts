import { create } from "zustand";
import { toast } from "sonner";
import { getKit } from "@/lib/stellar/wallet";
import { APP_NAME, NATIVE_TOKEN_CONTRACT } from "@/lib/stellar/config";

type WalletStatus = "idle" | "restoring" | "connecting" | "creating" | "connected" | "error";

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

function requireSecureContext(): boolean {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    toast.error("Passkeys require a secure context (HTTPS or localhost).");
    return false;
  }
  return true;
}

interface WalletState {
  status: WalletStatus;
  contractId?: string;
  error?: string;
  restore: () => Promise<void>;
  /** Connects to an existing passkey only — does not fall back to creating one. */
  connectExisting: () => Promise<void>;
  createWallet: () => Promise<void>;
  requestFunds: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  status: "idle",

  restore: async () => {
    set({ status: "restoring" });
    try {
      const result = await getKit().connectWallet();
      if (result) {
        set({ status: "connected", contractId: result.contractId, error: undefined });
      } else {
        set({ status: "idle" });
      }
    } catch (err) {
      set({ status: "idle", error: errorMessage(err) });
    }
  },

  connectExisting: async () => {
    if (!requireSecureContext()) return;

    set({ status: "connecting", error: undefined });
    try {
      const result = await getKit().connectWallet({ prompt: true });
      if (result) {
        set({ status: "connected", contractId: result.contractId, error: undefined });
        toast.success("Wallet connected!");
      } else {
        set({ status: "idle" });
        toast.error("No existing passkey found for this site — create a new wallet instead.");
      }
    } catch (err) {
      const msg = errorMessage(err);
      set({ status: "idle", error: msg });
      toast.error(msg);
    }
  },

  createWallet: async () => {
    if (!requireSecureContext()) return;

    set({ status: "creating", error: undefined });
    const toastId = toast.loading("Authorizing passkey & deploying smart account on Stellar testnet…");
    try {
      const result = await getKit().createWallet(APP_NAME, "demo-user", {
        // Forces the browser to use this device's own biometric (Face
        // ID / fingerprint / Windows Hello) instead of offering the
        // cross-device "scan this QR with your phone" option — testing
        // on a desktop without a platform authenticator will fail
        // clearly instead of silently expecting a phone scan.
        authenticatorSelection: { authenticatorAttachment: "platform" },
        autoSubmit: true,
        autoFund: true,
        nativeTokenContract: NATIVE_TOKEN_CONTRACT,
      });
      set({ status: "connected", contractId: result.contractId, error: undefined });
      toast.success("Passkey smart account created & connected!", { id: toastId });
    } catch (err) {
      const msg = errorMessage(err);
      set({ status: "error", error: msg });
      toast.error(msg, { id: toastId });
    }
  },

  requestFunds: async () => {
    const toastId = toast.loading("Requesting testnet XLM from Friendbot…");
    try {
      const result = await getKit().fundWallet(NATIVE_TOKEN_CONTRACT);
      if (result.success) {
        toast.success(
          result.amount ? `Funded with ${result.amount} XLM.` : "Funded via Friendbot.",
          { id: toastId }
        );
      } else {
        toast.error(result.error?.message || "Funding failed.", { id: toastId });
      }
    } catch (err) {
      toast.error(errorMessage(err), { id: toastId });
    }
  },

  disconnect: async () => {
    try {
      await getKit().disconnect();
    } catch {
      // ignore
    }
    set({ status: "idle", contractId: undefined, error: undefined });
    toast.info("Wallet disconnected.");
  },
}));
