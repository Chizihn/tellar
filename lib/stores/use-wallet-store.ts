import { create } from "zustand";
import { toast } from "sonner";
import { getKit } from "@/lib/stellar/wallet";
import { APP_NAME, NATIVE_TOKEN_CONTRACT } from "@/lib/stellar/config";

type WalletStatus = "idle" | "restoring" | "connecting" | "creating" | "connected" | "error";

function errorMessage(err: unknown) {
  return err instanceof Error ? err.message : String(err);
}

interface WalletState {
  status: WalletStatus;
  contractId?: string;
  error?: string;
  restore: () => Promise<void>;
  connectWallet: () => Promise<void>;
  createWallet: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
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

  connectWallet: async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Passkeys require a secure context (HTTPS or localhost).");
      return;
    }

    set({ status: "connecting", error: undefined });
    try {
      // First try to authenticate existing passkey
      const result = await getKit().connectWallet({ prompt: true });
      if (result) {
        set({ status: "connected", contractId: result.contractId, error: undefined });
        toast.success("Wallet connected!");
        return;
      }
      // If no stored candidate, create new
      await get().createWallet();
    } catch (err) {
      const msg = errorMessage(err);
      if (
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("no credentials") ||
        msg.toLowerCase().includes("empty")
      ) {
        await get().createWallet();
      } else {
        set({ status: "error", error: msg });
        toast.error(msg);
      }
    }
  },

  createWallet: async () => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      toast.error("Passkeys require a secure context (HTTPS or localhost).");
      return;
    }

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
