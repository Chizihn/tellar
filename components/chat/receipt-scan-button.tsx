"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Looks for a line like "Total ... 12,000" first, else the largest plain number in the text. */
function extractAmount(text: string): number | null {
  const totalMatch = text.match(/total\D{0,12}([\d,]+(?:\.\d+)?)/i);
  if (totalMatch) return Number(totalMatch[1].replace(/,/g, ""));

  const numbers = Array.from(text.matchAll(/([\d,]{2,}(?:\.\d+)?)/g))
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}

export function ReceiptScanButton({
  onAmountFound,
}: {
  onAmountFound: (amountText: string) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setScanning(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      try {
        const { data } = await worker.recognize(file);
        const amount = extractAmount(data.text);
        if (amount === null) {
          toast.error("Couldn't find an amount on that receipt — try typing it instead.");
          return;
        }
        onAmountFound(`₦${amount.toLocaleString()}`);
        toast.success(`Found ₦${amount.toLocaleString()} on the receipt.`);
      } finally {
        await worker.terminate();
      }
    } catch {
      toast.error("Couldn't read that image.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={scanning}
        onClick={() => inputRef.current?.click()}
        aria-label="Scan a receipt"
      >
        {scanning ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
      </Button>
    </>
  );
}
