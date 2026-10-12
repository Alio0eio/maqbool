import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@workspace/design-system/utils";

interface FilterTabsProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
  "aria-label"?: string;
  className?: string;
}

/** Segmented filter whose highlight slides to the selected option. */
export function FilterTabs<T extends string>({ value, onChange, options, className, ...rest }: FilterTabsProps<T>) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn("inline-flex rounded-full bg-muted/80 p-1 max-w-full overflow-x-auto", className)}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`filter-${String(o.value).toLowerCase()}`}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-full px-4 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`filter-pill-${id}`}
                aria-hidden
                className="absolute inset-0 rounded-full bg-background shadow-[0_1px_3px_hsl(var(--foreground)/0.12),0_4px_10px_-4px_hsl(var(--foreground)/0.12)]"
                transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {o.label}
              {o.count !== undefined && (
                <span className={cn("rounded-full px-1.5 text-[11px] font-semibold tabular-nums", active ? "bg-primary/10 text-primary" : "bg-foreground/[0.06]")}>
                  {o.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
