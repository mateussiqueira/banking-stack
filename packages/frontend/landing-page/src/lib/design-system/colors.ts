export const colors = {
  primary: {
    lightest: "#eef2ff",
    lighter: "#e0e7ff",
    light: "#c7d2fe",
    mediumLight: "#a5b4fc",
    medium: "#818cf8",
    DEFAULT: "#6366F1",
    dark: "#4f46e5",
    darker: "#4338ca",
    darkest: "#3730a3",
    deep: "#312e81",
    deepest: "#1e1b4b",
  },
  surface: {
    DEFAULT: "#0a0a0a",
    elevated: "#18181b",
    card: "#27272a",
    border: "#3f3f46",
    muted: "#52525b",
    subtle: "#71717a",
    text: "#a1a1aa",
  },
  text: {
    primary: "#fafafa",
    secondary: "#a1a1aa",
    muted: "#71717a",
    inverse: "#0a0a0a",
    onPrimary: "#0a0a0a",
  },
  semantic: {
    success: "#6366F1",
    successBg: "#052e16",
    warning: "#f59e0b",
    warningBg: "#451a03",
    error: "#ef4444",
    errorBg: "#450a0a",
    info: "#3b82f6",
    infoBg: "#172554",
  },
} as const;

export type ColorKey = keyof typeof colors;
