import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface SparklineProps {
  /** Normalized 0-1 series. */
  values: number[];
  className?: string;
  /** Tailwind text color class; the line and fill use currentColor. */
  tone?: string;
}

/** Smooth area sparkline: the line draws itself on mount and the last point
 *  pulses like a live reading. */
export function Sparkline({ values, className, tone = "text-secondary" }: SparklineProps) {
  const id = useId();
  const reduce = useReducedMotion();
  const W = 160;
  const H = 40;
  const pad = 4;
  const pts = values.map((v, i) => [
    (i / Math.max(1, values.length - 1)) * W,
    H - pad - Math.max(0, Math.min(1, v)) * (H - pad * 2),
  ]);
  // Catmull-Rom -> cubic bezier for a smooth curve.
  const path = pts.reduce((d, p, i, a) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const p0 = a[i - 2] ?? a[i - 1];
    const p1 = a[i - 1];
    const p2 = p;
    const p3 = a[i + 1] ?? p2;
    const t = 0.18;
    const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    return `${d} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }, "");
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={`w-full h-full overflow-visible ${tone} ${className ?? ""}`} aria-hidden>
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${path} L${W},${H} L0,${H} Z`}
        fill={`url(#${id}-fill)`}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
      {last && (
        <circle cx={last[0]} cy={last[1]} r="2.5" fill="currentColor" className="live-dot-svg" />
      )}
    </svg>
  );
}
