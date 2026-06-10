import * as React from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  size?: "sm" | "md" | "lg";
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  withBorder?: boolean;
}

const sizeClasses = {
  sm: "py-12 md:py-16",
  md: "py-16 md:py-24",
  lg: "py-20 md:py-32",
};

export function Section({
  className,
  size = "md",
  containerSize,
  withBorder = false,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        sizeClasses[size],
        withBorder && "border-b border-surface-100",
        "relative",
        className
      )}
      {...props}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}

export function SectionHeader({
  title,
  subtitle,
  className,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-2xl mb-12 md:mb-16",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <h2 className="text-heading-xl md:text-display-md font-bold text-neutral-50 mb-4">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body-lg text-surface-400">{subtitle}</p>
      )}
    </div>
  );
}
