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
          "app-translucent-header sticky top-0 z-10 -mx-6 md:-mx-8 px-6 md:px-8 py-4 bg-surface-bg/85 backdrop-blur-xl border-b border-border/60",
        className
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[12px] font-medium text-muted-foreground mb-1.5 truncate">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            "font-semibold text-foreground tracking-[-0.02em]",
            sticky ? "text-[19px]" : "text-[26px] leading-[1.15]",
          )}
        >
          {title}
        </h1>
        {description && <p className="text-muted-foreground text-[14px] mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
