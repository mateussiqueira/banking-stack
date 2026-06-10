import * as React from "react";
import { cn } from "@/lib/utils";
import { typography, type TypographyVariant } from "@/lib/design-system/typography";

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
  gradient?: boolean;
}

function createTypographyComponent(
  defaultVariant: TypographyVariant,
  defaultTag?: keyof JSX.IntrinsicElements
) {
  const Component = React.forwardRef<HTMLElement, TypographyProps>(
    ({ className, variant = defaultVariant, as, gradient, children, ...props }, ref) => {
      const Comp = as ?? defaultTag ?? "p";

      const [category, ...sizeParts] = variant.split("-");
      const size = sizeParts.join("-") as string;

      let variantClass = "";
      if (category === "display" && "display" in typography) {
        const sizes = typography.display as Record<string, { className: string }>;
        if (size in sizes) variantClass = sizes[size].className;
      } else if (category === "heading" && "heading" in typography) {
        const sizes = typography.heading as Record<string, { className: string }>;
        if (size in sizes) variantClass = sizes[size].className;
      } else if (category === "body" && "body" in typography) {
        const sizes = typography.body as Record<string, { className: string }>;
        if (size in sizes) variantClass = sizes[size].className;
      } else if (variant === "caption") {
        variantClass = typography.caption.className;
      } else if (variant === "small") {
        variantClass = typography.small.className;
      }

      return (
        <Comp
          ref={ref}
          className={cn(
            variantClass,
            gradient && "bg-gradient-to-r from-nexa-400 to-nexa-600 bg-clip-text text-transparent",
            className
          )}
          {...props}
        >
          {children}
        </Comp>
      );
    }
  );
  Component.displayName = `Typography(${defaultVariant})`;
  return Component;
}

const H1 = createTypographyComponent("display-lg", "h1");
const H2 = createTypographyComponent("display-md", "h2");
const H3 = createTypographyComponent("heading-xl", "h3");
const H4 = createTypographyComponent("heading-lg", "h4");
const H5 = createTypographyComponent("heading-md", "h5");
const H6 = createTypographyComponent("heading-sm", "h6");
const P = createTypographyComponent("body-md", "p");
const Small = createTypographyComponent("small", "small");
const Caption = createTypographyComponent("caption", "span");

export { H1, H2, H3, H4, H5, H6, P, Small, Caption };
export type { TypographyProps };
