import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motionTime } from "@/lib/motion";

type CollapsibleSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
};

const expandTransition = {
  duration: motionTime(0.3),
  ease: [0.16, 1, 0.3, 1] as const,
};

const contentVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: motionTime(0.25), ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: motionTime(0.15), ease: "easeOut" },
    },
  },
  visible: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: motionTime(0.3), ease: [0.16, 1, 0.3, 1] },
      opacity: { duration: motionTime(0.2), ease: "easeOut", delay: motionTime(0.05) },
    },
  },
};

export function CollapsibleSection({
  title,
  children,
  defaultOpen,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleSectionProps) {
  const reduceMotion = useReducedMotion();

  // Determine initial state based on viewport and defaultOpen prop
  const [isOpen, setIsOpen] = useState(() => {
    // If defaultOpen is explicitly provided, use it
    if (typeof defaultOpen === "boolean") return defaultOpen;
    // Default: closed on mobile (below md breakpoint), open on desktop
    if (typeof window !== "undefined") {
      return window.innerWidth >= 768; // md breakpoint
    }
    return false;
  });

  // Update state on resize to match desktop/mobile behavior
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only auto-adjust if defaultOpen wasn't explicitly provided
    if (typeof defaultOpen === "boolean") return;

    const handleResize = () => {
      const isDesktop = window.innerWidth >= 768;
      setIsOpen(isDesktop);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [defaultOpen]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <div
      className={cn(
        "rounded-[1.5rem] border border-moss/15 bg-cream overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls="collapsible-content"
        className={cn(
          "w-full flex items-center justify-between gap-4",
          "px-5 py-4 md:px-6 md:py-5",
          "bg-cream hover:bg-moss/[0.02]",
          "transition-colors duration-200 ease-out",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-moss/30 focus-visible:ring-inset",
          headerClassName
        )}
      >
        <h3 className="font-heading text-base md:text-lg text-charcoal tracking-tight text-left">
          {title}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={reduceMotion ? { duration: 0 } : expandTransition}
          className={cn(
            "flex-none w-8 h-8 rounded-full",
            "flex items-center justify-center",
            "bg-moss/10 text-moss",
            "transition-colors duration-200",
            isOpen && "bg-moss/20 text-moss"
          )}
        >
          <ChevronDown size={18} strokeWidth={2} />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false} mode="wait">
        {isOpen && (
          <motion.div
            id="collapsible-content"
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            exit="hidden"
            variants={reduceMotion ? undefined : contentVariants}
            className="overflow-hidden"
          >
            <div
              className={cn(
                "px-5 pb-5 md:px-6 md:pb-6",
                "border-t border-moss/10",
                contentClassName
              )}
            >
              <div className="pt-4 md:pt-5">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
