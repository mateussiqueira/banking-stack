export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const typography = {
  h1: { size: '1.875rem', weight: '700', lineHeight: '2.25rem' },
  h2: { size: '1.5rem', weight: '600', lineHeight: '2rem' },
  h3: { size: '1.25rem', weight: '600', lineHeight: '1.75rem' },
  body: { size: '0.875rem', weight: '400', lineHeight: '1.5rem' },
  'body-sm': { size: '0.75rem', weight: '400', lineHeight: '1.25rem' },
  label: { size: '0.75rem', weight: '500', lineHeight: '1rem' },
} as const;

export const borderRadius = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;
