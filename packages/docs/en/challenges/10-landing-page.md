# Challenge 10 — Landing Page + Design System

**What is it:** A landing page with a shared design system using Radix UI and Storybook.

**Why it matters:** First impressions matter. A fintech needs to look trustworthy and professional.

## The stack

- **Next.js 14** — React framework with SSR
- **Radix UI** — accessible component primitives
- **Tailwind CSS** — utility-first styling
- **Storybook** — component documentation
- **CVA** — class variance authority for variants

## Design tokens

```typescript
// Colors
const colors = {
  primary: 'bg-blue-600',
  secondary: 'bg-gray-100',
  success: 'bg-green-600',
  error: 'bg-red-600',
}

// Typography
const typography = {
  h1: 'text-4xl font-bold',
  h2: 'text-2xl font-semibold',
  body: 'text-base',
}
```

## Component hierarchy

```
Design System
├── Primitives (Radix)
│   ├── Button
│   ├── Input
│   ├── Dialog
│   └── Toast
├── Composites
│   ├── Card
│   ├── Form
│   └── Table
└── Pages
    ├── Landing
    ├── Dashboard
    └── Settings
```

## What we learned

1. **Radix is excellent** — accessibility out of the box
2. **Storybook saves time** — document once, use everywhere
3. **CVA is simple** — variant management without complexity
4. **Tailwind scales** — utility classes work for design systems
