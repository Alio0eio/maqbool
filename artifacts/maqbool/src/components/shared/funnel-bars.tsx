import { Link } from "wouter";
import { motion } from "framer-motion";
import { CountUp } from "./count-up";

interface FunnelBarsProps {
  stages: [string, number][];
  /** Show each stage's conversion from the one before it. */
  showConversion?: boolean;
}

/** Proportional funnel: bar length is the stage's share of the largest stage,
 *  so drop-off between stages is visible at a glance. Rows link to the board. */
export function FunnelBars({ stages, showConversion }: FunnelBarsProps) {
  const max = Math.max(1, ...stages.map(([, n]) => n));
  return (
    <div className="space-y-1.5">
      {stages.map(([stage, count], i) => {
        const prev = i > 0 ? stages[i - 1][1] : null;
        const conv = showConversion && prev ? Math.round((count / prev) * 100) : null;
        return (
          <Link
            key={stage}
            href={`/recruiter/pipeline?stage=${encodeURIComponent(stage)}`}
            className="group/stage flex items-center gap-4 rounded-xl px-3 py-2 hover:bg-foreground/[0.03] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            <span className="w-20 text-[13px] font-medium capitalize text-muted-foreground group-hover/stage:text-foreground transition-colors">
              {stage}
            </span>
            <span className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, (count / max) * 100)}%` }}
                transition={{ duration: 0.9, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
            {showConversion && (
              <span className="w-12 text-right text-[12px] font-medium text-muted-foreground tabular-nums">
                {conv !== null ? `${conv}%` : ""}
              </span>
            )}
            <span className="w-10 text-right text-[15px] font-semibold tabular-nums text-foreground">
              <CountUp value={count} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
