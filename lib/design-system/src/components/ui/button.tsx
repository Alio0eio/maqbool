import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[13px] font-medium tracking-[-0.01em] transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Solid brand color, reserved for the one primary action on a screen.
        default: 'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-primary/90 active:bg-primary/95',
        destructive: 'bg-destructive text-destructive-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-destructive/90',
        // Hairline border, transparent fill — for secondary actions that sit beside a primary button.
        outline: 'border border-border bg-transparent text-foreground hover:bg-foreground/[0.04] active:bg-foreground/[0.06]',
        // Tonal fill in the brand color — reads as "important, but not THE action."
        secondary: 'bg-primary/[0.08] text-primary hover:bg-primary/[0.13] active:bg-primary/[0.16]',
        ghost: 'text-foreground hover:bg-foreground/[0.045] active:bg-foreground/[0.07]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        sm: 'h-8 rounded-md px-3 text-[12.5px]',
        lg: 'h-11 rounded-[10px] px-6 text-[14.5px]',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
