"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ExternalLink, History, Loader2 } from "lucide-react";
import { xlmToStroops } from "smart-account-kit";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Plan } from "@/lib/types";
import { useWalletStore } from "@/lib/stores/use-wallet-store";
import { useTransactionStore } from "@/lib/stores/use-transaction-store";
import { getKit } from "@/lib/stellar/wallet";
import { DISPERSE_CONTRACT_ID, NATIVE_TOKEN_CONTRACT } from "@/lib/stellar/config";

function initials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

type SubmitStatus = "idle" | "pending" | "success" | "error";

export function PlanCard({ plan }: { plan: Plan }) {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const { status: walletStatus, contractId } = useWalletStore();
  const { addTransaction, setIsOpen: openHistory } = useTransactionStore();

  async function handleConfirm() {
    if (walletStatus !== "connected" || !contractId) {
      toast.error("Connect your wallet first.");
      return;
    }

    const transfers = plan.payments.filter((p) => !p.isSelf);
    if (transfers.length === 0) {
      toast.error("Nothing to send — every payment in this plan is your own share.");
      return;
    }

    setStatus("pending");
    try {
      const recipients = transfers.map((p) => p.recipientAddress);
      const amounts = transfers.map((p) => xlmToStroops(p.amountXlm));

      const result = await getKit().executeAndSubmit(DISPERSE_CONTRACT_ID, "disperse", [
        contractId,
        NATIVE_TOKEN_CONTRACT,
        recipients,
        amounts,
      ]);

      if (result.success) {
        setStatus("success");
        setTxHash(result.hash);

        // Record in persistent transaction history store
        addTransaction({
          hash: result.hash,
          contractId,
          plan,
          status: "success",
        });

        toast.success("Sent — one transaction, every payment.", {
          action: {
            label: "View",
            onClick: () =>
              window.open(
                `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
                "_blank"
              ),
          },
        });
      } else {
        setStatus("error");
        toast.error(result.error.message || "Transaction failed.");
      }
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Signing failed.");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-heading text-base">
            {plan.payments.length}-way split
          </CardTitle>
          <Badge
            variant={status === "success" ? "default" : "secondary"}
            className={status === "success" ? "bg-emerald-600 hover:bg-emerald-600 text-white" : ""}
          >
            {status === "success" ? "Confirmed" : "Testnet"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.payments.map((p) => (
          <div key={p.recipient} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarFallback className="text-xs">
                  {initials(p.recipientName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{p.recipientName}</span>
              {p.isSelf && (
                <span className="text-xs text-muted-foreground">(kept)</span>
              )}
            </div>
            <div className="text-right font-mono text-sm">
              <div>
                {p.currency} {p.amountLocal.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {p.isSelf ? "not sent" : `${p.amountXlm.toFixed(2)} XLM`}
              </div>
            </div>
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between font-medium">
          <span>Total</span>
          <div className="text-right font-mono text-sm">
            <div>
              {plan.currency} {plan.totalLocal.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {plan.onChainTotalXlm.toFixed(2)} XLM on-chain
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        {status === "success" ? (
          <div className="flex w-full items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1.5"
              onClick={() => openHistory(true)}
            >
              <History className="size-3.5 text-muted-foreground" />
              View in History
            </Button>
            {txHash && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs gap-1.5"
                onClick={() =>
                  window.open(
                    `https://stellar.expert/explorer/testnet/tx/${txHash}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="size-3.5 text-muted-foreground" />
                Explorer
              </Button>
            )}
          </div>
        ) : (
          <>
            <Button variant="outline" className="flex-1" disabled={status === "pending"}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={status === "pending"}
            >
              {status === "pending" && <Loader2 className="size-4 animate-spin" />}
              {status === "pending" ? "Signing…" : "Confirm & sign"}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
