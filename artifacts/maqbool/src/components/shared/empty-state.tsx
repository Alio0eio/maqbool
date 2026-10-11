import React from "react";
import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = FileQuestion, title, description, action }: EmptyStateProps) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-dashed border-border bg-white/50">
      <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-secondary/[0.08] blur-3xl" />
      <div className="relative mb-5">
        <span aria-hidden className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl" />
        <div className="relative w-14 h-14 rounded-2xl bg-white border border-border/70 shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.35)] flex items-center justify-center text-primary float-slow">
          <Icon className="w-6 h-6" strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="relative text-[16px] font-semibold text-foreground mb-1.5 tracking-[-0.01em]">{title}</h3>
      <p className="relative text-[13.5px] text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div className="relative">{action}</div>}
    </div>
  );
}
