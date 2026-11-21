"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo iconClassName="size-10" />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          Nothing was signed or sent — this is a client error, not a failed
          transaction.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
