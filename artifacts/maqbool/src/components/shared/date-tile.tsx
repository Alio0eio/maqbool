import { cn } from "@workspace/design-system/utils";

/** Calendar-leaf tile: month over day. Falls back to a dashed "TBD" tile. */
export function DateTile({ iso, className }: { iso?: string | null; className?: string }) {
  const d = iso ? new Date(iso) : null;
  const valid = d && !Number.isNaN(d.getTime());
  return (
    <div
      className={cn(
        "w-[60px] shrink-0 rounded-2xl overflow-hidden text-center border shadow-[0_1px_2px_rgba(16,24,40,0.05)]",
        valid ? "border-border/70 bg-white" : "border-dashed border-border bg-transparent",
        className,
      )}
      aria-hidden
    >
      {valid ? (
        <>
          <div className="bg-gradient-to-br from-primary to-[hsl(222_80%_32%)] text-primary-foreground text-[11px] font-semibold uppercase tracking-wider py-1">
            {d!.toLocaleString([], { month: "short" })}
          </div>
          <div className="text-[22px] font-semibold tracking-[-0.02em] py-1.5 tabular-nums">{d!.getDate()}</div>
        </>
      ) : (
        <div className="py-5 text-[12px] font-medium text-muted-foreground">TBD</div>
      )}
    </div>
  );
}

/** "in 3 days" / "today" / "2 days ago" for an ISO date. */
export function relativeDay(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const days = Math.round((d.getTime() - Date.now()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${-days} days ago`;
}
