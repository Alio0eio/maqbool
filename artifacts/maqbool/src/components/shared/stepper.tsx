import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";

interface StepperProps {
  steps: readonly { readonly label: string }[];
  /** Zero-based index of the current step. */
  current: number;
  className?: string;
}

/** Wizard progress: completed steps check off, the connector fills as you
 *  advance, and the current step glows. */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol className={cn("flex items-start", className)} aria-label="Progress">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.label} className="flex-1 flex items-start last:flex-none" aria-current={active ? "step" : undefined}>
            <div className="flex flex-col items-center gap-2">
              <motion.span
                animate={active ? { scale: [0.85, 1] } : { scale: 1 }}
                transition={{ type: "spring", bounce: 0.4, duration: 0.45 }}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors duration-300",
                  done && "bg-success text-success-foreground",
                  active && "bg-primary text-primary-foreground shadow-[0_0_0_5px_hsl(var(--primary)/0.12),0_8px_18px_-6px_hsl(var(--primary)/0.6)]",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </motion.span>
              <span className={cn("hidden sm:block text-[12px] font-medium whitespace-nowrap", active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>
                {s.label}
                <span className="sr-only">{done ? " (completed)" : active ? " (current)" : ""}</span>
              </span>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden className="relative flex-1 h-0.5 mt-[17px] mx-3 rounded-full bg-border overflow-hidden">
                <motion.span
                  className="absolute inset-y-0 left-0 bg-success"
                  initial={false}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
