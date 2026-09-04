import { cn } from "@workspace/design-system/utils";
import { Waveform } from "./waveform";

/** Loading placeholder shaped like the waveform motif instead of gray blocks. */
export function WaveformSkeleton({ className, bars = 20 }: { className?: string; bars?: number }) {
  return (
    <div className={cn("h-10 w-full", className)}>
      <Waveform variant="loading" bars={bars} />
    </div>
  );
}
