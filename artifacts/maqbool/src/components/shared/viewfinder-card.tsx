import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Card } from "@workspace/design-system/card";
import { cn } from "@workspace/design-system/utils";

const MotionCard = motion.create(Card);

interface ViewfinderCardProps extends HTMLMotionProps<"div"> {
  /** Opt in to the corner-bracket "record" motif — reserved for surfaces that
   *  are actually about the video-interview product (never generic list
   *  cards), so the brand accent keeps its meaning. Default is a plain,
   *  premium hover lift. */
  viewfinder?: boolean;
}

/** Interactive card: a critically-damped spring lift on hover, so it responds
 *  like something physical rather than a CSS timer. Pass `viewfinder` to
 *  layer on the corner-bracket record motif for interview surfaces. */
export const ViewfinderCard = forwardRef<HTMLDivElement, ViewfinderCardProps>(
  ({ className, viewfinder, ...props }, ref) => (
    <MotionCard
      ref={ref}
      className={cn(
        "transition-shadow duration-200 ease-out hover:shadow-md",
        viewfinder && "viewfinder-hover",
        className,
      )}
      whileHover={{ y: -3 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      {...props}
    />
  )
);
ViewfinderCard.displayName = "ViewfinderCard";
