import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";

type MarkTone = "ink" | "reversed";

interface MaqboolMarkProps {
  /** Rendered size in px. Stroke weight is bumped up at small sizes so the
   *  check stays legible down to favicon scale, matching the approved spec. */
  size?: number;
  tone?: MarkTone;
  className?: string;
  style?: CSSProperties;
}

/** The circle-and-check symbol alone — the "o" of the wordmark, and the app
 *  tile / favicon mark on its own. */
export function MaqboolMark({ size = 24, tone = "ink", className, style }: MaqboolMarkProps) {
  const strokeWidth = size >= 40 ? 7 : size >= 28 ? 8 : size >= 18 ? 9.5 : 11;
  const ringColor = tone === "reversed" ? "var(--color-brand-ink-reversed)" : "var(--color-brand-ink)";
  const checkColor = tone === "reversed" ? "var(--color-brand-steel-reversed)" : "var(--color-brand-steel)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 52 52"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx="26" cy="26" r="21" stroke={ringColor} strokeWidth={strokeWidth} />
      <path
        d="M17 27l6.5 7 11.5-14"
        stroke={checkColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface MaqboolWordmarkProps {
  /** Font size in px — the mark and lockup spacing scale proportionally. */
  size?: number;
  tone?: MarkTone;
  className?: string;
}

/** Full lockup: "maqb" + mark + "ol", set in Barlow 500 per the approved
 *  spec. This is the logo — use it wherever the brand needs to be present
 *  (nav, splash, auth hero), never a re-derived "M" tile or the raw mark
 *  next to plain text. */
export function MaqboolWordmark({ size = 20, tone = "ink", className }: MaqboolWordmarkProps) {
  const markSize = Math.round(size * 0.64);
  const textColor = tone === "reversed" ? "var(--color-brand-ink-reversed)" : "var(--color-brand-ink)";

  return (
    <span
      className={cn("inline-flex items-baseline select-none whitespace-nowrap", className)}
      style={{
        fontFamily: "var(--font-wordmark)",
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: textColor,
      }}
    >
      <span>maqb</span>
      <MaqboolMark
        size={markSize}
        tone={tone}
        className="shrink-0"
        style={{ margin: `0 ${size * 0.02}px`, transform: "translateY(0.02em)" }}
      />
      <span>ol</span>
    </span>
  );
}

interface MaqboolRollingLogoProps {
  size?: number;
  expanded: boolean;
  tone?: MarkTone;
}

/** Sidebar lockup that morphs between the lone mark and the full wordmark: as
 *  it expands, "maqb" unrolls on the left and the mark rolls right across it
 *  (one full turn ≈ its own circumference), then "ol" settles in behind it.
 *  Only width/opacity on two short text spans plus transform on the mark are
 *  animated, so it stays cheap beside the rail's own width spring. */
export function MaqboolRollingLogo({ size = 26, expanded, tone = "ink" }: MaqboolRollingLogoProps) {
  const reduced = useReducedMotion();
  const markSize = Math.round(size * 0.64);
  const textColor = tone === "reversed" ? "var(--color-brand-ink-reversed)" : "var(--color-brand-ink)";
  const roll = reduced ? { duration: 0 } : { duration: 0.42, ease: [0.32, 0.72, 0, 1] as const };
  const fade = reduced ? { duration: 0 } : { duration: 0.2, delay: expanded ? 0.18 : 0 };
  const side = (open: boolean) => ({ width: open ? "auto" : 0, opacity: open ? 1 : 0 });

  return (
    <span
      className="inline-flex items-baseline select-none whitespace-nowrap"
      style={{
        fontFamily: "var(--font-wordmark)",
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.03em",
        color: textColor,
      }}
    >
      <motion.span
        aria-hidden
        className="overflow-hidden inline-block"
        initial={false}
        animate={side(expanded)}
        transition={{ width: roll, opacity: fade }}
      >
        maqb
      </motion.span>
      <motion.span
        className="inline-flex shrink-0 will-change-transform"
        initial={false}
        animate={{ rotate: expanded ? 360 : 0, scale: expanded ? 1 : 1.35 }}
        transition={{ rotate: roll, scale: roll }}
        style={{
          transformOrigin: "50% 50%",
          margin: `0 ${size * 0.02}px`,
          translateY: "0.02em",
        }}
      >
        <MaqboolMark size={markSize} tone={tone} />
      </motion.span>
      <motion.span
        aria-hidden
        className="overflow-hidden inline-block"
        initial={false}
        animate={side(expanded)}
        transition={{ width: roll, opacity: fade }}
      >
        ol
      </motion.span>
    </span>
  );
}
