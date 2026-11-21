"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet/wallet-button";
import { ContactsDialog } from "@/components/contacts/contacts-dialog";
import { HistoryDialog } from "@/components/transactions/history-dialog";
import { PlanCard } from "@/components/chat/plan-card";
import { VoiceButton } from "@/components/chat/voice-button";
import { ReceiptScanButton } from "@/components/chat/receipt-scan-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/stores/use-chat-store";

const EXAMPLE_PROMPTS = [
  "split ₦12,000 lunch between me, Chidi, and Ada",
  "send ₦5,000 to Chidi for the Uber",
];

export default function Home() {
  const { messages, isSending, sendMessage } = useChatStore();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSubmit() {
    const text = input.trim();
    if (!text || isSending) return;
    setInput("");
    void sendMessage(text);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/80 px-3 py-2.5 sm:px-4 sm:py-3 backdrop-blur">
        <Logo />
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Badge variant="secondary" className="hidden xs:inline-flex text-[11px]">
            Testnet
          </Badge>
          <HistoryDialog />
          <ContactsDialog />
          <WalletButton />
          <ThemeToggle />
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Logo iconClassName="size-10" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Tell me a payment in plain English. I&apos;ll turn it into an
                itemized plan you approve before anything is signed.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setInput(prompt)}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.plan ? (
                <PlanCard plan={message.plan} />
              ) : (
                <div
                  className={cn(
                    "max-w-sm rounded-2xl px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.text}
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-muted px-4 py-2 text-sm text-muted-foreground">
                Working out the plan&hellip;
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="border-t px-4 py-3">
        <div className="mx-auto flex w-full max-w-2xl items-end gap-2">
          <ReceiptScanButton onAmountFound={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))} />
          <VoiceButton onTranscript={(text) => setInput((prev) => (prev ? `${prev} ${text}` : text))} />
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="split ₦12,000 lunch 3 ways"
            className="min-h-11 resize-none placeholder:truncate"
            rows={1}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!input.trim() || isSending}
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
