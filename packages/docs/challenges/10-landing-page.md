# 10 — Landing Page + Design System

**🇧🇷** Landing Page Institucional com Design System Componentizado  
**🇬🇧** Institutional Landing Page with Component-Based Design System

---

## 🇧🇷 Descrição do Desafio

Criar uma landing page institucional para o Banking Challenges com um design system componentizado, documentado no Storybook. O design system inclui componentes reutilizáveis construídos com Radix UI e estilizados com TailwindCSS.

Requisitos:
- Landing page responsiva com Next.js 14
- Design system com componentes atômicos
- Documentação no Storybook
- Componentes acessíveis (Radix UI)
- Variantes de componentes (CVA)
- Animações e transições
- SEO otimizado

---

## 🇬🇧 Challenge Description

Create an institutional landing page for Banking Challenges with a component-based design system documented in Storybook. The design system includes reusable components built with Radix UI and styled with TailwindCSS.

Requirements:
- Responsive landing page with Next.js 14
- Design system with atomic components
- Storybook documentation
- Accessible components (Radix UI)
- Component variants (CVA)
- Animations and transitions
- SEO optimized

---

## Architecture / Arquitetura

```
landing-page/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # Home page
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── ui/                # Design system components
│   │   │   ├── Button.tsx     # Button with CVA variants
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx     # Radix Dialog
│   │   │   ├── Dropdown.tsx   # Radix Dropdown
│   │   │   └── Tooltip.tsx    # Radix Tooltip
│   │   └── sections/          # Page sections
│   │       ├── Hero.tsx
│   │       ├── Features.tsx
│   │       └── Footer.tsx
│   ├── lib/
│   │   └── design-system/
│   │       ├── colors.ts
│   │       ├── typography.ts
│   │       ├── spacing.ts
│   │       └── tokens.ts
│   └── stories/               # Storybook stories
└── .storybook/
    ├── main.ts
    └── preview.ts
```

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
| **Tailwind Merge** | Class conflict resolution |

## Design Tokens / Tokens de Design

```typescript
// colors.ts
export const colors = {
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    500: '#8b5cf6',
    600: '#7c3aed',
    900: '#4c1d95',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    900: '#171717',
  }
}

// typography.ts
export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  fontSize: {
    'display-lg': ['4rem', { lineHeight: '1.1' }],
    'heading-xl': ['2.25rem', { lineHeight: '1.2' }],
  }
}
```

## How to Run / Como Executar

```bash
# Development
pnpm --filter @banking/landing-page dev

# Storybook
pnpm --filter @banking/landing-page storybook

# Build
pnpm --filter @banking/landing-page build
```

- Landing Page: `http://localhost:3000`
- Storybook: `http://localhost:6006`
