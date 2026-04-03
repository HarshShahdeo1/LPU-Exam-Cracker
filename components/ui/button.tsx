import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "secondary";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-300",
        "disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4335]/40",
        variant === "primary"
          ? "shadow-lift relative overflow-hidden bg-[linear-gradient(135deg,#761010_0%,#c51e14_38%,#ef4335_100%)] text-white hover:-translate-y-0.5 hover:shadow-[0_35px_80px_rgba(165,0,0,0.34)]"
          : variant === "secondary"
            ? "border border-[#ef4335]/20 bg-[#ef4335]/10 text-[#ffe5de] hover:bg-[#ef4335]/16"
            : "border border-white/10 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}
