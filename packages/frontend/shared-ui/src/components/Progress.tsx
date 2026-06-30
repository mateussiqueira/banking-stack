import { forwardRef } from "react";
import { cn } from "../lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, max = 100, showLabel = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className="w-full" ref={ref} {...props}>
        {showLabel && (
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary">{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-surface-300",
            className
          )}
        >
          <div
            className="h-full bg-primary-500 transition-all duration-300 ease-in-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
