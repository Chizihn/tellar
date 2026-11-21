import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * public/logo.svg is really a PNG wrapped in an <image> tag (not a true
 * vector) — next/image's optimizer 400s on arbitrary SVGs unless
 * `images.dangerouslyAllowSVG` is set, so this renders the PNG directly
 * instead of loosening that config for no benefit.
 */
export function Logo({
  className,
  iconClassName,
  showWordmark = true,
}: {
  className?: string;
  iconClassName?: string;
  showWordmark?: boolean;
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
        <span className="font-heading text-lg font-semibold tracking-tight">
          Tellar
        </span>
      )}
    </span>
  );
}
