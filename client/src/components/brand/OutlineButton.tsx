import React from "react";
import { cn } from "@/lib/utils";

type OutlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function OutlineButton({ className, children, ...props }: OutlineButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-full",
        "border border-moss/40 text-moss bg-transparent",
        "text-sm font-medium tracking-tight",
        "hover:bg-moss/5 hover:border-moss/60",
        "transition-colors duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

