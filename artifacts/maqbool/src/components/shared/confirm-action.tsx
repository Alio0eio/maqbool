import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/design-system/alert-dialog";
import { buttonVariants } from "@workspace/design-system/button";
import { cn } from "@workspace/design-system/utils";

interface ConfirmActionProps {
  /** The control that opens the confirmation — rendered via asChild. */
  children: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  /** Destructive actions get the red confirm button. Defaults to true. */
  destructive?: boolean;
}

/** Confirmation step for irreversible actions — names the consequence and
 *  labels the confirm button with the action itself rather than "OK". */
export function ConfirmAction({
  children,
  title,
  description,
  confirmLabel,
  onConfirm,
  destructive = true,
}: ConfirmActionProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(destructive && buttonVariants({ variant: "destructive" }))}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
