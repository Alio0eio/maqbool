import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const EASE_DRAW = [0.65, 0, 0.35, 1] as const;
const EASE_SETTLE = [0.22, 1, 0.36, 1] as const;

interface SplashScreenProps {
  onFinish: () => void;
}

/**
 * One-time brand moment shown on initial load — just the mark drawing
 * itself in, then releasing into the app. Runs once per page load (not per
 * client-side navigation) and collapses to a near-instant fade for
 * prefers-reduced-motion.
 */
export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), reduced ? 150 : 1600);
    return () => clearTimeout(timer);
  }, [reduced]);

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-bg"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: reduced ? 1 : 1.025 }}
          transition={{ duration: reduced ? 0.15 : 0.45, ease: EASE_SETTLE }}
        >
          <motion.svg
            style={{ overflow: "visible" }}
            width={96}
            height={96}
            viewBox="0 0 52 52"
            fill="none"
            initial={{ scale: 0.92 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: reduced ? 0 : 0.6 }}
          >
            {/* Faint full track so the ring reads as a circle from frame one. */}
            <circle cx="26" cy="26" r="21" stroke="var(--color-brand-ink)" strokeWidth={7} opacity={0.08} />
            {/* Starts at 12 o'clock; round caps overlap at the join so the
                circle closes with no seam. */}
            <motion.circle
              cx="26"
              cy="26"
              r="21"
              stroke="var(--color-brand-ink)"
              strokeWidth={7}
              strokeLinecap="round"
              style={{ rotate: -90, transformOrigin: "26px 26px" }}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: reduced ? 0 : 0.75, ease: EASE_DRAW, delay: reduced ? 0 : 0.05 },
                opacity: { duration: 0.2, delay: reduced ? 0 : 0.05 },
              }}
            />
            {/* Ripple released the moment the circle closes. */}
            {!reduced && (
              <motion.circle
                cx="26"
                cy="26"
                r="21"
                stroke="var(--color-brand-steel)"
                strokeWidth={2}
                style={{ transformOrigin: "26px 26px" }}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.35, opacity: [0, 0.5, 0] }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
              />
            )}
            <motion.path
              d="M17 27l6.5 7 11.5-14"
              stroke="var(--color-brand-steel)"
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { duration: reduced ? 0 : 0.45, ease: EASE_SETTLE, delay: reduced ? 0 : 0.85 },
                opacity: { duration: 0.15, delay: reduced ? 0 : 0.85 },
              }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
