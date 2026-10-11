import { forwardRef, type PointerEvent } from "react";
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
  ({ className, viewfinder, onPointerMove, ...props }, ref) => (
    <MotionCard
      ref={ref}
      onPointerMove={(e: PointerEvent<HTMLDivElement>) => {
        // Feeds the cursor-follow spotlight (.spotlight-card in theme.css).
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
        e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
        onPointerMove?.(e);
      }}
      className={cn(
        "spotlight-card transition-[box-shadow,border-color] duration-200 ease-out hover:shadow-lg hover:border-secondary/25",
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
