# @banking/landing-page — Nexa

**🇧🇷** Landing Page Institucional da Nexa — plataforma completa de pagamentos  
**🇬🇧** Nexa Institutional Landing Page — complete payment platform

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework (App Router) |
| **React 18** | UI library |
| **TypeScript** | Type safety |
| **TailwindCSS** | Utility-first CSS |
| **Radix UI** | Accessible primitives |
| **CVA** | Class Variance Authority |
| **Storybook** | Component documentation |
| **Lucide React** | Icons |

## How to Run

```bash
# Development
pnpm --filter @banking/landing-page dev

# Storybook
pnpm --filter @banking/landing-page storybook

# Build
pnpm --filter @banking/landing-page build

# Tests
pnpm --filter @banking/landing-page test
```

- Landing Page: `http://localhost:3000`
- Storybook: `http://localhost:6006`

## Structure

```
src/
├── app/
│   ├── page.tsx             # Home page
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Design system components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Dialog.tsx
│   │   ├── Dropdown.tsx
│   │   └── Tooltip.tsx
│   └── sections/
│       ├── Hero.tsx
│       ├── Features.tsx
│       └── Footer.tsx
├── lib/design-system/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── tokens.ts
└── stories/                 # Storybook stories
```
