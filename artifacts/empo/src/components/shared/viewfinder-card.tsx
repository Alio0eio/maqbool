import { forwardRef, type ComponentProps } from "react";
import { Card } from "@workspace/design-system/card";
import { cn } from "@workspace/design-system/utils";

/** Card with the corner-bracket hover/focus treatment layered over hover-elevate. */
export const ViewfinderCard = forwardRef<HTMLDivElement, ComponentProps<typeof Card>>(
  ({ className, ...props }, ref) => (
    <Card ref={ref} className={cn("hover-elevate viewfinder-hover transition-shadow", className)} {...props} />
  )
);
ViewfinderCard.displayName = "ViewfinderCard";
