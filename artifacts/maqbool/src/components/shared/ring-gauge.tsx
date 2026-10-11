import { motion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";
import { CountUp } from "./count-up";

interface RingGaugeProps {
  /** 0-100: how full the ring is. */
  value: number;
  /** Number shown in the middle when it differs from the fill, e.g. 18 (days) on a 30-day target. */
  display?: number;
  label: string;
  /** Text under the number, e.g. "of invitees". */
  caption?: string;
  suffix?: string;
  tone?: string;
  size?: number;
}

/** Circular progress with the number in the middle; the ring sweeps in. */
export function RingGauge({ value, display, label, caption, suffix = "%", tone = "text-secondary", size = 120 }: RingGaugeProps) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${display ?? value}${suffix}`}>
        <svg viewBox="0 0 100 100" className={cn("-rotate-90", tone)} width={size} height={size} aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" strokeWidth="8" className="stroke-muted" />
          <motion.circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - pct / 100) }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[26px] font-semibold tracking-[-0.02em]">
          <CountUp value={display ?? value} />
          <span className="text-[14px] font-medium text-muted-foreground ml-0.5">{suffix}</span>
        </div>
      </div>
      <p className="mt-3 text-[13.5px] font-medium text-foreground">{label}</p>
      {caption && <p className="text-[12px] text-muted-foreground">{caption}</p>}
    </div>
  );
}
