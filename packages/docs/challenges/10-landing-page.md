# 10 — Landing Page + Design System

**🇧🇷** Landing Page com Design System  
**🇬🇧** Landing Page with Design System

---

Fazer uma landing page é fácil. Fazer uma landing page com um design system que não quebra quando alguém muda a cor primária — isso é mais difícil.

Esse desafio é sobre isso: componentes que se vestem sozinhos, documentados no Storybook, com acessibilidade de verdade.

---

## A estrutura

```
landing-page/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home
│   │   └── layout.tsx        # Layout global (Header + Footer)
│   ├── components/
│   │   ├── ui/               # Design system
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Dialog.tsx
│   │   │   └── Tooltip.tsx
│   │   └── sections/         # Seções da página
│   │       ├── Hero.tsx
│   │       ├── Features.tsx
│   │       └── CTA.tsx
│   └── lib/
│       ├── tokens.ts         # Cores, tipografia, spacing
│       └── cn.ts             # classname merge
├── .storybook/
└── tailwind.config.ts
```

---

## O que faz diferença

### Design tokens que funcionam

```typescript
// lib/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      800: '#262626',
      900: '#171717',
    },
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
} as const;
```

### Button com CVA (Class Variance Authority)

```typescript
// components/ui/Button.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-blue-600 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-violet-600 text-white hover:bg-violet-700',
        secondary: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
        outline: 'border border-zinc-300 hover:bg-zinc-50',
        ghost: 'text-zinc-600 hover:bg-zinc-100',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
```

### Dialog com Radix (acessível de verdade)

```typescript
// components/ui/Dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function Dialog({ children, ...props }: DialogPrimitive.DialogProps) {
  return <DialogPrimitive.Root {...props}>{children}</DialogPrimitive.Root>;
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in" />
      <DialogPrimitive.Content className={cn(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl',
        'w-full max-w-md',
        className
      )}>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
```

---

## Storybook

Cada componente tem sua história:

```typescript
// Button.stories.tsx
import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
  },
};

export const Primary = { args: { children: 'Clicar', variant: 'primary' } };
export const Secondary = { args: { children: 'Cancelar', variant: 'secondary' } };
export const Disabled = { args: { children: 'Não pode', disabled: true } };
```

Roda com `pnpm storybook` em `localhost:6006`.

---

## Por que essa estrutura funciona

1. **Tailwind + CVA** — Você não precisa escrever CSS novo pra cada botão. As variantes são tipadas.
2. **Radix UI** — Acessibilidade sem pensar. Foco, teclado, ARIA attributes. Tudo pronto.
3. **Storybook** — O dev de backend consegue ver os componentes sem rodar o app. O designer consegue revisar sem saber React.
4. **cn() helper** — Evita conflito de classes do Tailwind quando você junta classes de props com classes fixas.

```typescript
// lib/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Como rodar

```bash
# Landing page
pnpm --filter @banking/landing-page dev
# http://localhost:3000

# Storybook
pnpm --filter @banking/landing-page storybook
# http://localhost:6006
```