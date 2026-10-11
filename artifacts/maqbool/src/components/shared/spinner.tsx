import { cn } from "@workspace/design-system/utils";

/** Loading ring: the arc draws around until the circle closes, then releases. Inherits currentColor. */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={3}
      strokeLinecap="round"
      className={cn("ring-spinner w-4 h-4", className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" opacity={0.2} />
      <circle cx="12" cy="12" r="9" stroke="currentColor" pathLength={100} className="ring-spinner-arc" />
    </svg>
  );
}
