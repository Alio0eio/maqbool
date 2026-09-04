import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** Tracks whether a step index moved forward or backward since the last
 *  render, so step content can slide in the direction of travel — entering
 *  and exiting along the same path, per spatial-consistency. */
export function useStepDirection(index: number): 1 | -1 {
  const prevRef = useRef(index);
  const direction = index >= prevRef.current ? 1 : -1;
  useEffect(() => {
    prevRef.current = index;
  }, [index]);
  return direction;
}

interface StepTransitionProps {
  /** Unique id for the current step — a new value triggers the transition. */
  stepKey: string | number;
  /** 1 to slide in from the right (advancing), -1 from the left (going back). */
  direction: 1 | -1;
  children: ReactNode;
  className?: string;
}

/** Wraps a wizard step's content so moving between steps slides and
 *  cross-fades in the direction of travel instead of hard-cutting. */
export function StepTransition({ stepKey, direction, children, className }: StepTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        initial={{ opacity: 0, x: direction * 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: direction * -24 }}
        transition={{ type: "spring", bounce: 0, duration: 0.32 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
