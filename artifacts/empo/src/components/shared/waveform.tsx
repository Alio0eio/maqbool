import { cn } from "@workspace/design-system/utils";

export type WaveformVariant = "loading" | "sparkline" | "scrubber";

interface WaveformProps {
  /** loading: animated placeholder bars. sparkline: static trend bars from `values`.
   *  scrubber: `values` as a track, with bars up to `progress` shown as "played". */
  variant: WaveformVariant;
  /** Normalized 0-1 heights. Required for sparkline/scrubber, ignored for loading. */
  values?: number[];
  /** Bar count, loading variant only. */
  bars?: number;
  /** 0-1 playhead position, scrubber variant only. */
  progress?: number;
  className?: string;
  barClassName?: string;
}

export function Waveform({ variant, values, bars = 28, progress = 0, className, barClassName }: WaveformProps) {
  const heights =
    variant === "loading"
      ? Array.from({ length: bars }, (_, i) => 20 + ((i * 37) % 60))
      : (values ?? []).map((v) => Math.max(6, Math.min(100, v * 100)));

  const playedCount = variant === "scrubber" ? Math.round(heights.length * progress) : -1;

  return (
    <div className={cn("flex items-end gap-[2px] h-full w-full", className)} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={cn(
            "flex-1 min-w-[2px] rounded-full",
            variant === "loading" && "bg-muted-foreground/25 animate-pulse",
            variant === "sparkline" && "bg-accent-record",
            variant === "scrubber" && (i <= playedCount ? "bg-accent-record" : "bg-muted-foreground/25"),
            barClassName
          )}
          style={{
            height: `${h}%`,
            animationDelay: variant === "loading" ? `${i * 40}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
