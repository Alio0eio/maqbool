import type { ElementType } from "react";
import { CardContent } from "@workspace/design-system/card";
import { cn } from "@workspace/design-system/utils";
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { ViewfinderCard } from "./viewfinder-card";
import { Sparkline } from "./sparkline";
import { CountUp } from "./count-up";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  /** Normalized 0-1 series rendered as a sparkline. Delta is derived from
   *  the first/last values so it can never drift from what's shown. */
  trend?: number[];
  helperText?: string;
  /** Makes the whole card a link; an arrow appears on hover. */
  href?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, helperText, href, className }: StatCardProps) {
  const hasTrend = trend && trend.length > 1;
  const delta = hasTrend ? trend[trend.length - 1] - trend[0] : 0;
  const direction = delta > 0.001 ? "up" : delta < -0.001 ? "down" : "flat";

  const card = (
    <ViewfinderCard className={cn("group/stat h-full", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground mb-1.5 truncate">{label}</p>
            <h3 className="text-[34px] font-semibold text-foreground tracking-[-0.02em] leading-none">
              {typeof value === "number" ? <CountUp value={value} /> : value}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(222_80%_34%)] flex items-center justify-center text-white shadow-[0_6px_14px_-4px_hsl(var(--primary)/0.5)] shrink-0 transition-transform duration-300 ease-out group-hover/stat:scale-110 group-hover/stat:-rotate-6">
            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
          </div>
        </div>

        {hasTrend ? (
          <>
            <div className="h-10 mt-4">
              <Sparkline values={trend} tone={direction === "down" ? "text-destructive" : "text-secondary"} />
            </div>
            <div
              className={cn(
                "mt-2.5 flex items-center text-[12.5px] font-medium",
                direction === "up" && "text-success",
                direction === "down" && "text-destructive",
                direction === "flat" && "text-muted-foreground"
              )}
            >
              {direction === "up" && <TrendingUp className="w-3 h-3 mr-1" />}
              {direction === "down" && <TrendingDown className="w-3 h-3 mr-1" />}
              <span>
                {direction === "flat" ? "No change" : `${direction === "up" ? "+" : ""}${Math.round(delta * 100)}% this period`}
              </span>
            </div>
          </>
        ) : (
          helperText && (
            <p className="mt-4 flex items-center justify-between gap-2 text-[12.5px] text-muted-foreground">
              <span>{helperText}</span>
              {href && (
                <ArrowUpRight className="w-4 h-4 shrink-0 opacity-0 -translate-x-1 translate-y-1 transition-all duration-200 group-hover/stat:opacity-100 group-hover/stat:translate-x-0 group-hover/stat:translate-y-0 text-primary" />
              )}
            </p>
          )
        )}
      </CardContent>
    </ViewfinderCard>
  );

  return href ? (
    <Link href={href} className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      {card}
    </Link>
  ) : (
    card
  );
}
