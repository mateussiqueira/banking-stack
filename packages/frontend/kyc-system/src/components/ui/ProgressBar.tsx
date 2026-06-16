import * as RadixProgress from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = Math.round((value / max) * 100);

  return (
    <RadixProgress.Root
      value={pct}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700',
        className
      )}
    >
      <RadixProgress.Indicator
        className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </RadixProgress.Root>
  );
}
