"use client";

import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
  className?: string;
  color?: "default" | "success" | "warning" | "danger";
}

const sizeConfig = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

const colorConfig = {
  default: "bg-nexa-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export function ProgressBar({
  value,
  max = 100,
  size = "md",
  showLabel = true,
  label,
  className,
  color = "default",
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColor = () => {
    if (color !== "default") return colorConfig[color];
    if (percentage >= 80) return colorConfig.success;
    if (percentage >= 50) return colorConfig.warning;
    return colorConfig.danger;
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-body-sm text-surface-text">
            {label || "Progress"}
          </span>
          <span className="text-body-sm font-medium text-neutral-50">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={cn("w-full bg-surface-200 rounded-full overflow-hidden", sizeConfig[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-300", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}