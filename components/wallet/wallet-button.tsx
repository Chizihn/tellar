"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Fingerprint,
  History,
  Loader2,
  LogOut,
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
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/lib/stores/use-wallet-store";
import { useTransactionStore } from "@/lib/stores/use-transaction-store";

export function WalletButton() {
  const { status, contractId, restore, connectWallet, disconnect } = useWalletStore();
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

  const isBusy = status === "restoring" || status === "connecting" || status === "creating";

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => void connectWallet()}
      disabled={isBusy}
    >
      {isBusy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Fingerprint className="size-3.5" />
      )}
      {status === "creating"
        ? "Creating…"
        : status === "connecting"
        ? "Connecting…"
        : status === "restoring"
        ? "Restoring…"
        : "Connect wallet"}
    </Button>
  );
}
