import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";

/** One-shot burst of pieces for the completion screen. */
export function Confetti() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const colors = ["bg-primary", "bg-secondary", "bg-success", "bg-accent-record", "bg-brand-steel-reversed"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-24 flex justify-center">
      {Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 120 + ((i * 53) % 110);
        return (
          <motion.span
            key={i}
            className={cn("absolute w-2 h-3 rounded-sm", colors[i % colors.length])}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 80, opacity: 0, rotate: 300 + i * 20, scale: 0.6 }}
            transition={{ duration: 1.4 + (i % 5) * 0.12, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          />
        );
      })}
    </div>
  );
}
