"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  Droplets,
  ExternalLink,
  Fingerprint,
  History,
  KeyRound,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { truncateAddress } from "smart-account-kit";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/lib/stores/use-wallet-store";
import { useTransactionStore } from "@/lib/stores/use-transaction-store";

function ConnectWalletDialog() {
  const { status, connectExisting, createWallet } = useWalletStore();
  const [open, setOpen] = useState(false);
  const isBusy = status === "connecting" || status === "creating";

  async function handle(action: () => Promise<void>) {
    await action();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={status === "restoring"}>
            {status === "restoring" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Fingerprint className="size-3.5" />
            )}
            {status === "restoring" ? "Restoring…" : "Connect wallet"}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>
            A passkey-backed Soroban smart account on Stellar testnet — no
            seed phrase, no browser extension.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 py-3 text-left"
            disabled={isBusy}
            onClick={() => void handle(connectExisting)}
          >
            {status === "connecting" ? (
              <Loader2 className="size-5 shrink-0 animate-spin" />
            ) : (
              <KeyRound className="size-5 shrink-0" />
            )}
            <span>
              <span className="block font-medium">Connect existing wallet</span>
              <span className="block text-xs text-muted-foreground">
                Use a passkey you already created for Tellar
              </span>
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-auto w-full justify-start gap-3 py-3 text-left"
            disabled={isBusy}
            onClick={() => void handle(createWallet)}
          >
            {status === "creating" ? (
              <Loader2 className="size-5 shrink-0 animate-spin" />
            ) : (
              <Sparkles className="size-5 shrink-0" />
            )}
            <span>
              <span className="block font-medium">Create new wallet</span>
              <span className="block text-xs text-muted-foreground">
                New passkey, deployed and auto-funded with testnet XLM
              </span>
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function WalletButton() {
  const { status, contractId, restore, requestFunds, disconnect } = useWalletStore();
  const { setIsOpen: openHistory } = useTransactionStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    void restore();
  }, [restore]);

  const copyAddress = async () => {
    if (!contractId) return;
    try {
      await navigator.clipboard.writeText(contractId);
      setCopied(true);
      toast.success("Contract address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address.");
    }
  };

  if (status === "connected" && contractId) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "font-mono text-xs gap-1.5 cursor-pointer"
          )}
        >
          <Fingerprint className="size-3.5 text-primary" />
          <span>{truncateAddress(contractId)}</span>
          <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            <div className="font-semibold text-foreground">Passkey Smart Account</div>
            <div className="font-mono text-[11px] truncate mt-0.5">{contractId}</div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            {copied ? (
              <Check className="size-3.5 mr-2 text-emerald-500" />
            ) : (
              <Copy className="size-3.5 mr-2" />
            )}
            Copy Contract ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              window.open(
                `https://stellar.expert/explorer/testnet/contract/${contractId}`,
                "_blank"
              )
            }
            className="cursor-pointer"
          >
            <ExternalLink className="size-3.5 mr-2" />
            View on Stellar.Expert
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => openHistory(true)}
            className="cursor-pointer"
          >
            <History className="size-3.5 mr-2" />
            Transaction History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void requestFunds()} className="cursor-pointer">
            <Droplets className="size-3.5 mr-2" />
            Request testnet funds
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => void disconnect()}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="size-3.5 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return <ConnectWalletDialog />;
}
