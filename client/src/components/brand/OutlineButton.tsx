import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type OutlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

export function OutlineButton({ className, children, asChild = false, ...props }: OutlineButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        "inline-flex items-center justify-center px-4 py-2 rounded-full",
        "border border-moss/40 text-moss bg-transparent",
        "text-sm font-medium tracking-tight",
        "hover:bg-moss/5 hover:border-moss/60",
        "transition-colors transition-transform duration-200 ease-out active:scale-[0.98] motion-safe:transform-gpu",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
