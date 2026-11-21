import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * public/logo.png is the official Tellar icon mark.
 * On mobile viewports, the wordmark text is hidden by default so only the crisp
 * icon mark displays, keeping the header clean and uncluttered on small screens.
 */
export function Logo({
  className,
  iconClassName,
  showWordmark = true,
  hideWordmarkOnMobile = true,
}: {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
  hideWordmarkOnMobile?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Tellar"
        width={28}
        height={28}
        className={cn("size-7 shrink-0", iconClassName)}
        priority
      />
      {showWordmark && (
        <span
          className={cn(
            "font-heading text-lg font-semibold tracking-tight",
            hideWordmarkOnMobile && "hidden sm:inline"
          )}
        >
          Tellar
        </span>
      )}
    </span>
  );
}
