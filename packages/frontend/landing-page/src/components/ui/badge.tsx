import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-nexa-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-nexa-500/15 text-nexa-500 hover:bg-nexa-500/25",
        secondary:
          "border-transparent bg-surface-100 text-surface-400 hover:bg-surface-200",
        destructive:
          "border-transparent bg-red-600/15 text-red-500 hover:bg-red-600/25",
        outline: "text-surface-400 border border-surface-300",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25",
        warning:
          "border-transparent bg-amber-500/15 text-amber-500 hover:bg-amber-500/25",
        info:
          "border-transparent bg-blue-500/15 text-blue-500 hover:bg-blue-500/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
