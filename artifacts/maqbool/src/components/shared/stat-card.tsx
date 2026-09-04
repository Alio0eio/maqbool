import type { ElementType } from "react";
import { CardContent } from "@workspace/design-system/card";
import { cn } from "@workspace/design-system/utils";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ViewfinderCard } from "./viewfinder-card";
import { Waveform } from "./waveform";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ElementType;
  /** Normalized 0-1 series rendered as a sparkline. Delta is derived from
   *  the first/last values so it can never drift from what's shown. */
  trend?: number[];
  helperText?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, trend, helperText, className }: StatCardProps) {
  const hasTrend = trend && trend.length > 1;
  const delta = hasTrend ? trend[trend.length - 1] - trend[0] : 0;
  const direction = delta > 0.001 ? "up" : delta < -0.001 ? "down" : "flat";

  return (
    <ViewfinderCard className={className}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-muted-foreground mb-1.5 truncate">{label}</p>
            <h3 className="text-[30px] font-semibold text-foreground tracking-[-0.02em] leading-none">{value}</h3>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/[0.08] flex items-center justify-center text-primary shrink-0">
            <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
          </div>
        </div>

        {hasTrend ? (
          <>
            <div className="h-8 mt-4">
              <Waveform variant="sparkline" values={trend} barClassName="bg-primary/70" />
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
          helperText && <p className="mt-4 text-[12.5px] text-muted-foreground">{helperText}</p>
        )}
      </CardContent>
    </ViewfinderCard>
  );
}
