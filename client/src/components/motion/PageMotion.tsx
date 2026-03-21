import type { PropsWithChildren } from "react";
import { motion, useReducedMotion } from "framer-motion";

const pageTransition = {
  duration: 0.28,
  ease: [0.16, 1, 0.3, 1] as const,
};

const sectionTransition = {
  duration: 0.32,
  ease: [0.16, 1, 0.3, 1] as const,
};

export const pageVariants = {
  initial: {
    opacity: 0,
    y: 14,
    filter: "blur(6px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(4px)",
    transition: { duration: 0.18, ease: [0.55, 0, 1, 0.45] as const },
  },
};

export const sectionVariants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  inView: {
    opacity: 1,
    y: 0,
    transition: sectionTransition,
  },
};

export function MotionPage({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : "initial"}
      animate="animate"
      exit="exit"
      variants={reduceMotion ? undefined : pageVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionSection({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : "initial"}
      whileInView={reduceMotion ? undefined : "inView"}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      variants={reduceMotion ? undefined : sectionVariants}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function MotionDiv({
  children,
  className,
  delay = 0,
}: PropsWithChildren<{ className?: string; delay?: number }>) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={reduceMotion ? undefined : { ...sectionTransition, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
