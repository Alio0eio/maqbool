import { useEffect, useState, type MouseEvent } from "react";
import { Button } from "@workspace/design-system/button";
import { cn } from "@workspace/design-system/utils";
import { Play, Pause } from "lucide-react";
import { Waveform } from "./waveform";

interface VideoScrubberProps {
  durationSeconds: number;
  /** 0-1 positions along the track, e.g. per-question boundaries. */
  markers?: { position: number; label: string }[];
  className?: string;
}

function formatTime(t: number) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoScrubber({ durationSeconds, markers = [], className }: VideoScrubberProps) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const start = Date.now() - elapsed * 1000;
    const id = setInterval(() => {
      const next = (Date.now() - start) / 1000;
      if (next >= durationSeconds) {
        setElapsed(durationSeconds);
        setPlaying(false);
      } else {
        setElapsed(next);
      }
    }, 100);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const progress = durationSeconds > 0 ? elapsed / durationSeconds : 0;
  const values = Array.from({ length: 48 }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.35)));

  function seek(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setElapsed(ratio * durationSeconds);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative h-14 cursor-pointer" onClick={seek}>
        <Waveform variant="scrubber" values={values} progress={progress} />
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-foreground/20"
            style={{ left: `${m.position * 100}%` }}
            title={m.label}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="w-9 h-9 rounded-full"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {formatTime(elapsed)} / {formatTime(durationSeconds)}
        </span>
      </div>
    </div>
  );
}
