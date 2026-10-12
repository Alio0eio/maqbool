import { CountUp } from "./count-up";
import { cn } from "@workspace/design-system/utils";

export interface SummaryItem {
  label: string;
  value: number;
  /** Optional formatter, e.g. currency. */
  format?: (n: number) => string;
  hint?: string;
}

/** A row of compact headline numbers that sits under a page header. */
export function SummaryStrip({ items, className }: { items: SummaryItem[]; className?: string }) {
  return (
    <div className={cn("grid gap-3", items.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3", className)}>
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-border/70 bg-white/70 backdrop-blur-sm px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-md"
        >
          <p className="text-[12.5px] font-medium text-muted-foreground">{s.label}</p>
          <p className="text-[26px] font-semibold tracking-[-0.02em] leading-tight mt-0.5">
            <CountUp value={s.value} format={s.format} />
          </p>
          {s.hint && <p className="text-[12px] text-muted-foreground mt-0.5">{s.hint}</p>}
        </div>
      ))}
    </div>
  );
}
