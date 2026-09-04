import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
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
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const wasPlayingRef = useRef(false);
  // Gate pointermove on a ref, not the `dragging` state: state updates are
  // batched, so a pointermove that arrives in the same tick as pointerdown
  // would otherwise still see the pre-update closure and get dropped —
  // exactly the kind of dropped-frame lag direct manipulation can't have.
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!playing || dragging) return;
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
  }, [playing, dragging]);

  const progress = durationSeconds > 0 ? elapsed / durationSeconds : 0;
  const values = Array.from({ length: 48 }, (_, i) => 0.3 + 0.5 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.35)));

  function elapsedFromClientX(clientX: number) {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return elapsed;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return ratio * durationSeconds;
  }

  // Grabbing the handle pauses playback and tracks the pointer 1:1, exactly
  // where it's held — not snapped to the track's center — then resumes if it
  // was playing when released. No momentum/fling: a scrubber is an absolute
  // position, not a thrown object.
  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // A stale/synthetic pointer id can't be captured — the drag still
      // works via the regular bubbling handlers.
    }
    isDraggingRef.current = true;
    wasPlayingRef.current = playing;
    setPlaying(false);
    setDragging(true);
    setElapsed(elapsedFromClientX(e.clientX));
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    setElapsed(elapsedFromClientX(e.clientX));
  }

  function handlePointerUp() {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);
    if (wasPlayingRef.current) setPlaying(true);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={trackRef}
        className="relative h-14 cursor-pointer touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <Waveform variant="scrubber" values={values} progress={progress} />
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 w-px bg-foreground/20"
            style={{ left: `${m.position * 100}%` }}
            title={m.label}
          />
        ))}
        <motion.div
          className="absolute top-1/2 w-3 h-3 rounded-full bg-accent-record border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
          style={{ left: `${progress * 100}%` }}
          animate={{
            scale: dragging ? 1.35 : 1,
            y: "-50%",
            x: "-50%",
          }}
          transition={{ type: "spring", bounce: dragging ? 0 : 0.4, duration: 0.25 }}
        />
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
