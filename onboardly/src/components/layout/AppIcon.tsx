import Image from "next/image";
import appIcon from "@/app/icon1.png";
import { cn } from "@/lib/utils";

export function AppIcon({ className }: { className?: string }) {
  return (
    <Image
      src={appIcon}
      alt=""
      width={512}
      height={512}
      className={cn("shrink-0 object-contain", className)}
      aria-hidden
    />
  );
}
