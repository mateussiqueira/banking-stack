export const typography = {
  display: {
    xl: {
      className: "text-display-xl font-heading font-bold",
      tag: "h1",
    },
    lg: {
      className: "text-display-lg font-heading font-bold",
      tag: "h1",
    },
    md: {
      className: "text-display-md font-heading font-bold",
      tag: "h2",
    },
  },
  heading: {
    xl: {
      className: "text-heading-xl font-heading font-semibold",
      tag: "h2",
    },
    lg: {
      className: "text-heading-lg font-heading font-semibold",
      tag: "h3",
    },
    md: {
      className: "text-heading-md font-heading font-semibold",
      tag: "h4",
    },
    sm: {
      className: "text-heading-sm font-heading font-semibold",
      tag: "h5",
    },
  },
  body: {
    lg: { className: "text-body-lg", tag: "p" },
    md: { className: "text-body-md", tag: "p" },
    sm: { className: "text-body-sm", tag: "p" },
  },
  caption: { className: "text-caption text-surface-subtle", tag: "span" },
  small: { className: "text-body-sm text-surface-text", tag: "small" },
} as const;

export type TypographyVariant =
  | "display-xl"
  | "display-lg"
  | "display-md"
  | "heading-xl"
  | "heading-lg"
  | "heading-md"
  | "heading-sm"
  | "body-lg"
  | "body-md"
  | "body-sm"
  | "caption"
  | "small";

export function getTypographyClass(variant: TypographyVariant): string {
  const [category, ...sizeParts] = variant.split("-");
  const size = sizeParts.join("-") as keyof (typeof typography)[keyof typeof typography];

  if (category === "display") {
    return typography.display[size as keyof typeof typography.display]?.className ?? "";
  }
  if (category === "heading") {
    return typography.heading[size as keyof typeof typography.heading]?.className ?? "";
  }
  if (category === "body") {
    return typography.body[size as keyof typeof typography.body]?.className ?? "";
  }
  if (variant === "caption") return typography.caption.className;
  if (variant === "small") return typography.small.className;
  return "";
}
