import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
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
        "inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-gradient-to-r from-[#A50000] to-[#E14C3C] text-white shadow-[0_18px_40px_rgba(165,0,0,0.28)] hover:-translate-y-0.5"
          : "border border-white/10 bg-white/5 text-white hover:bg-white/10",
        className
      )}
      {...props}
    />
  );
}

