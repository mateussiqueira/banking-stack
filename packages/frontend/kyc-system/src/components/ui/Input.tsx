import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-lg border px-3 py-2 text-sm transition-colors placeholder:text-neutral-400',
            'bg-white dark:bg-neutral-900',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            error
              ? 'border-semantic-error focus:ring-semantic-error focus:border-semantic-error'
              : 'border-neutral-300 dark:border-neutral-700',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-semantic-error">{error}</p>
        )}
        {helpText && !error && (
          <p className="text-xs text-neutral-500">{helpText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
