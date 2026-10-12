import type { CSSProperties } from "react";
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
