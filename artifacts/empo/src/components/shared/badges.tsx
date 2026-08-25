import React from 'react';
import { cn } from '@workspace/design-system/utils';
import { Badge } from '@workspace/design-system/badge';
import { Sparkles } from 'lucide-react';

export function MatchScoreBadge({ score, size = 'md', className }: { score: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  // Determine color based on score
  const isHigh = score >= 80;
  const isMedium = score >= 60 && score < 80;

  const colorClass = isHigh
    ? 'text-[#003120]' // success green
    : isMedium
    ? 'text-yellow-600'
    : 'text-destructive';

  const strokeColor = isHigh ? '#4ac08f' : isMedium ? '#eab308' : '#ba1a1a';

  // sm ~32px, md (default) ~40px (matches the original fixed size), lg ~56px.
  const r = size === 'lg' ? 24 : size === 'sm' ? 14 : 17;
  const strokeWidth = size === 'lg' ? 4 : size === 'sm' ? 2 : 3;
  const sz = (r + strokeWidth) * 2;
  const circumference = 2 * Math.PI * r;
  const progress = (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const fontSize = size === 'lg' ? 'text-base font-bold' : size === 'sm' ? 'text-[9px] font-semibold' : 'text-[10px] font-bold';

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={`match-score-${score}`}>
      <div className="relative flex items-center justify-center shrink-0" style={{ width: sz, height: sz }}>
        <svg width={sz} height={sz} className="-rotate-90 absolute inset-0">
          <circle
            cx={sz / 2}
            cy={sz / 2}
            r={r}
            fill="none"
            className="stroke-muted"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={sz / 2}
            cy={sz / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <span className={cn(fontSize, "tracking-tighter", colorClass)}>
            {score}
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold leading-none">AI Match</span>
      </div>
    </div>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  let variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "subtle" = "subtle";
  let label = status;

  switch (status.toLowerCase()) {
    case 'published':
    case 'active':
    case 'offered':
    case 'hired':
    case 'completed':
    case 'accepted':
      variant = 'success';
      break;
    case 'draft':
    case 'pending':
    case 'reviewing':
      variant = 'warning';
      break;
    case 'closed':
    case 'rejected':
    case 'declined':
    case 'cancelled':
    case 'withdrawn':
      variant = 'destructive';
      break;
    case 'interviewing':
    case 'shortlisted':
    case 'invited':
    case 'in_progress':
      variant = 'default'; // Primary blue
      break;
  }

  // Format label: "in_progress" -> "In Progress"
  label = label.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  return (
    <Badge variant={variant} className={cn("capitalize font-medium tracking-tight", className)}>
      {label}
    </Badge>
  );
}

export function AITag({ className, children = "AI Summary" }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-blue-800 text-[10px] font-semibold tracking-wide uppercase", className)}>
      <Sparkles className="w-3 h-3 text-blue-600" />
      {children}
    </div>
  );
}
