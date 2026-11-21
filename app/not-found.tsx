import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo iconClassName="size-10" />
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          There&apos;s nothing here — Tellar&apos;s only real page is the chat.
        </p>
      </div>
      <Button render={<Link href="/">Back to chat</Link>} />
    </div>
  );
}
