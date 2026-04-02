import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return <div className={cn("glass-panel rounded-[28px]", className)} {...props} />;
}

