import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0, duration: 0.35 } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

/** Wrap a grid/list of cards with `StaggerGroup`, and each card with
 *  `StaggerItem`, so they arrive as a brief cascade on mount instead of
 *  popping in fully rendered all at once. */
export function StaggerGroup({ children, className }: StaggerProps) {
  return (
    <motion.div initial="hidden" animate="show" variants={container} className={className}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerProps) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  );
}
