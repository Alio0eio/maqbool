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
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-surface-subtle/60">
      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-5 text-muted-foreground">
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <h3 className="text-[16px] font-semibold text-foreground mb-1.5 tracking-[-0.01em]">{title}</h3>
      <p className="text-[13.5px] text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
