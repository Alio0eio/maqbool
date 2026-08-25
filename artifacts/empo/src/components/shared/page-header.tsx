import type { ReactNode } from "react";
import { cn } from "@workspace/design-system/utils";

interface PageHeaderProps {
  title: string;
  /** Small monospace line above the title. Should carry real derived data
   *  ("12 ACTIVE · UPDATED 2m AGO"), not decoration. */
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  /** Sticky sub-header bar variant, used by workflow pages. */
  sticky?: boolean;
  className?: string;
}

export function PageHeader({ title, eyebrow, description, actions, sticky, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4",
        sticky &&
          "sticky top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-background/95 backdrop-blur-sm border-b border-border",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-accent-record-ink mb-1">
            {eyebrow}
          </p>
        )}
        <h1 className={cn("font-display font-bold text-foreground tracking-tight", sticky ? "text-xl" : "text-2xl")}>
          {title}
        </h1>
        {description && <p className="text-muted-foreground text-sm mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
