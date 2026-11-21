"use client";

import { useState } from "react";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  History,
  Receipt,
  Trash2,
} from "lucide-react";
import { truncateAddress } from "smart-account-kit";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTransactionStore } from "@/lib/stores/use-transaction-store";
import { useWalletStore } from "@/lib/stores/use-wallet-store";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function HistoryDialog() {
  const { transactions, isOpen, setIsOpen, clearHistory } =
    useTransactionStore();
  const { contractId } = useWalletStore();
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      toast.success("Transaction hash copied!");
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      toast.error("Failed to copy hash.");
    }
  };

  const totalXlmSent = transactions
    .reduce((sum, tx) => sum + (tx.plan?.onChainTotalXlm || 0), 0)
    .toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            aria-label="Transaction History"
          >
            <History className="size-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">History</span>
            {transactions.length > 0 && (
              <span className="flex size-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                {transactions.length}
              </span>
            )}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="size-4 text-primary" />
                Transaction History
              </DialogTitle>
              <Badge variant="secondary" className="text-[11px]">
                Stellar Testnet
              </Badge>
            </div>
            <DialogDescription>
              Past payments signed and confirmed via your passkey smart account.
            </DialogDescription>
          </DialogHeader>

          {transactions.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-2.5 text-xs">
              <div>
                <span className="text-muted-foreground">Transactions:</span>{" "}
                <span className="font-semibold text-foreground">
                  {transactions.length}
                </span>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Volume:</span>{" "}
                <span className="font-mono font-semibold text-foreground">
                  {totalXlmSent} XLM
                </span>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 px-6">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-12 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-muted">
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="max-w-[260px] text-xs text-muted-foreground">
                When you approve and sign payment plans in chat, your confirmed
                Stellar transactions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {transactions.map((tx) => {
                const transfers =
                  tx.plan?.payments?.filter((p) => !p.isSelf) || [];
                return (
                  <div
                    key={tx.hash}
                    className="space-y-2.5 rounded-xl border bg-card p-3.5 text-xs transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-foreground">
                          {transfers.length}-way transfer
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {timeAgo(tx.createdAt)}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      {transfers.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="size-5">
                              <AvatarFallback className="text-[9px]">
                                {initials(p.recipientName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">
                              {p.recipientName}
                            </span>
                          </div>
                          <div className="font-mono text-right">
                            <span className="font-medium text-foreground">
                              {p.amountXlm.toFixed(2)} XLM
                            </span>
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              ({p.currency} {p.amountLocal.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <span>Tx: {truncateAddress(tx.hash)}</span>
                        <button
                          onClick={() => copyHash(tx.hash)}
                          className="p-0.5 hover:text-foreground transition-colors"
                          title="Copy Tx Hash"
                        >
                          {copiedHash === tx.hash ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 font-mono font-semibold text-foreground">
                        <span>Total:</span>
                        <span>{tx.plan?.onChainTotalXlm.toFixed(2)} XLM</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-normal text-primary hover:underline ml-1"
                        >
                          View <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t bg-muted/20 px-6 py-3 flex items-center justify-between text-xs">
          {transactions.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-7 text-xs text-muted-foreground hover:text-destructive gap-1 px-2"
            >
              <Trash2 className="size-3" />
              Clear history
            </Button>
          ) : (
            <div />
          )}

          {contractId && (
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${contractId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Account Explorer</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

