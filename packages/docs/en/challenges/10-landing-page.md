# 10 — Landing Page + Design System

**🇧🇷** Landing Page com Design System  
**🇬🇧** Landing Page with Design System

---

Fazer uma landing page é fácil. Qualquer um com HTML básico faz uma landing page. Fazer uma landing page com um design system que não quebra quando alguém muda a cor primária — isso é mais difícil.

Eu já vi o cenário: o designer chega e fala "Muda o tom de violeta pra tal tom de azul". Aí você vai lá e descobre que o violeta estava hardcoded em 47 lugares diferentes. Button.tsx, Card.tsx, Hero.tsx, CTA.tsx — cada um com sua própria cor. Você passa a tarde inteira caçando `#8b5cf6` e substituindo por `#2563eb`. E no dia seguinte o designer volta: "Na verdade, era outro azul".

Design system resolve isso. Você define as cores uma vez, num lugar só. Os componentes usam variáveis. Quando muda, muda em tudo.

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

Essa estrutura separa o design system (ui/) das seções de negócio (sections/). O motivo? Você pode reutilizar o `ui/` em outro projeto. O `sections/` é específico dessa landing page. Quando o designer pedir "Faz uma página nova", você reusa os componentes de UI e só cria novas seções.

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

Ter tokens tipados é ótimo, mas o problema é que você ainda precisa fazer o Tailwind enxergar esses tokens. O truque é sincronizar com o `tailwind.config.ts`:

```typescript
// tailwind.config.ts
import { tokens } from './src/lib/tokens';

export default {
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.primary,
        neutral: tokens.colors.neutral,
      },
      spacing: tokens.spacing,
    },
  },
  plugins: [],
};
```

Agora você pode usar `bg-brand-500` ou `text-neutral-800` no Tailwind, e se mudar o token, muda tudo. Mas ainda tem um problema: e se o designer quiser mudar a paleta inteira? Você precisa de um sistema mais flexível.

### Tema dinâmico com CSS variables

```typescript
// lib/theme.ts
export type Theme = 'light' | 'dark' | 'purple' | 'green';

export const themes: Record<Theme, Record<string, string>> = {
  light: {
    '--color-bg': '#ffffff',
    '--color-bg-secondary': '#f5f5f5',
    '--color-text': '#171717',
    '--color-text-secondary': '#737373',
    '--color-primary': '#8b5cf6',
    '--color-primary-hover': '#7c3aed',
    '--color-border': '#e5e5e5',
  },
  dark: {
    '--color-bg': '#171717',
    '--color-bg-secondary': '#262626',
    '--color-text': '#fafafa',
    '--color-text-secondary': '#a3a3a3',
    '--color-primary': '#a78bfa',
    '--color-primary-hover': '#c4b5fd',
    '--color-border': '#404040',
  },
  purple: {
    '--color-bg': '#faf5ff',
    '--color-bg-secondary': '#f3e8ff',
    '--color-text': '#3b0764',
    '--color-text-secondary': '#7e22ce',
    '--color-primary': '#9333ea',
    '--color-primary-hover': '#7e22ce',
    '--color-border': '#e9d5ff',
  },
  green: {
    '--color-bg': '#f0fdf4',
    '--color-bg-secondary': '#dcfce7',
    '--color-text': '#14532d',
    '--color-text-secondary': '#16a34a',
    '--color-primary': '#22c55e',
    '--color-primary-hover': '#16a34a',
    '--color-border': '#bbf7d0',
  },
};

export function applyTheme(theme: Theme) {
  const vars = themes[theme] || themes.light;
  const root = document.documentElement;

  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
}

// Hook pra usar o tema
import { useState, useCallback, useEffect } from 'react';

export function useTheme(defaultTheme: Theme = 'light') {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || defaultTheme;
  });

  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return { theme, changeTheme };
}
```

CSS variables são a melhor forma de fazer tema dinâmico. O navegador aplica as variáveis instantaneamente sem re-renderizar a página. Compara com Context API + styled-components que força re-render de toda a árvore — CSS variable é muito mais performático.

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

O CVA é um dos packages que mais facilitam minha vida. Você define as variantes uma vez e o TypeScript valida se você passou uma variante que existe. Se o designer criar uma nova variante (ex: `danger`), você adiciona no `cva` e pronto — todos os botões ganham a nova variante.

### Button com loading e ícone

```typescript
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant, size, className,
  isLoading, leftIcon, rightIcon,
  children, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ variant, size }),
        isLoading && 'cursor-wait',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="Mr-2 h-4 w-4 animate-spin" />
      ) : leftIcon ? (
        <span className="Mr-2">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && (
        <span className="Ml-2">{rightIcon}</span>
      )}
    </button>
  );
}
```

### Card component

```typescript
// components/ui/Card.tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const cardVariants = cva(
  'rounded-xl border transition-shadow',
  {
    variants: {
      variant: {
        default: 'bg-white border-zinc-200 shadow-sm hover:shadow-md',
        elevated: 'bg-white border-transparent shadow-md hover:shadow-lg',
        outlined: 'bg-transparent border-zinc-300 hover:border-zinc-400',
        ghost: 'bg-transparent border-transparent hover:bg-zinc-50',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({ variant, padding, className, children, ...props }: CardProps) {
  return (
    <div className={cn(cardVariants({ variant, padding }), className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold text-zinc-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-zinc-500', className)} {...props}>
      {children}
    </p>
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
      <DialogPrimitive.Overlay className="Fixed inset-0 bg-black/50 data-[state=open]:animate-in" />
      <DialogPrimitive.Content className={cn(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-xl',
        'w-full max-w-md',
        className
      )}>
        {children}
        <DialogPrimitive.Close className="Absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
          <X className="H-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Title className={cn('text-lg font-semibold', className)}>
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogTrigger({ children, ...props }: DialogPrimitive.DialogTriggerProps) {
  return <DialogPrimitive.Trigger asChild {...props}>{children}</DialogPrimitive.Trigger>;
}
```

### Tooltip

```typescript
// components/ui/Tooltip.tsx
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ children, content, side = 'top' }: {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Content
        side={side}
        className={cn(
          'z-50 rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white shadow-md',
          'animate-in fade-in-0 zoom-in-95'
        )}
      >
        {content}
        <TooltipPrimitive.Arrow className="Fill-zinc-900" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Root>
  );
}
```

### Seções da landing page

#### Hero

```typescript
// components/sections/Hero.tsx
import { Button } from '@/components/ui/Button';
import { ArrowRight, Play } from 'lucide-react';

export function Hero() {
  return (
    <section className="Relative overflow-hidden bg-gradient-to-b from-violet-50 to-white px-6 py-24 sm:py-32">
      <div className="Mx-auto max-w-6xl">
        <div className="Text-center">
          <div className="Mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-sm text-violet-700">
            <span className="H-2 w-2 rounded-full bg-violet-500 animate-pulse" />
            Novo: Open Finance Brasil compatível
          </div>

          <h1 className="Text-4xl font-bold tracking-tight text-zinc-900 sm:text-6xl">
            Banking Stack
            <span className="Block text-violet-600">para desenvolvedores</span>
          </h1>

          <p className="Mx-auto mt-6 max-w-2xl text-lg text-zinc-600">
            A plataforma completa para construir sistemas financeiros no Brasil.
            Pix, boletos, Open Finance, NFS-e — tudo que você precisa, num lugar só.
          </p>

          <div className="Mt-10 flex items-center justify-center gap-4">
            <Button size="Lg" variant="Primary" rightIcon={<ArrowRight className="H-4 w-4" />}>
              Começar agora
            </Button>
            <Button size="Lg" variant="Outline" leftIcon={<Play className="H-4 w-4" />}>
              Ver demo
            </Button>
          </div>
        </div>

        <div className="Mt-16 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          <div className="Aspect-video rounded-xl bg-gradient-to-br from-violet-100 to-zinc-100 flex items-center justify-center">
            <span className="Text-zinc-400">Dashboard Preview</span>
          </div>
        </div>
      </div>
    </section>
  );
}
```

#### Features

```typescript
// components/sections/Features.tsx
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import {
  Zap, Shield, BarChart3, Globe,
  type LucideIcon
} from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: Zap,
    title: 'Performance',
    description: 'Processamento em tempo real com streaming. Consultas otimizadas com índices e cache distribuído.',
    color: 'text-violet-600',
  },
  {
    icon: Shield,
    title: 'Segurança',
    description: 'OAuth 2.0 FAPI, certificados digitais, criptografia de ponta a ponta. Compliance com LGPD e BACEN.',
    color: 'text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    description: 'CSV, PDF, dashboards em tempo real. Streaming de milhões de registros sem sobrecarregar o servidor.',
    color: 'text-blue-600',
  },
  {
    icon: Globe,
    title: 'Open Finance',
    description: 'Simulador completo do Open Finance Brasil. Consentimento, OAuth, dados de contas e transações.',
    color: 'text-amber-600',
  },
];

export function Features() {
  return (
    <section className="Px-6 py-24">
      <div className="Mx-auto max-w-6xl">
        <div className="Text-center mb-16">
          <h2 className="Text-3xl font-bold text-zinc-900 sm:text-4xl">
            Tudo que você precisa pra construir
          </h2>
          <p className="Mt-4 text-lg text-zinc-600">
            Da autenticação ao relatório financeiro, cada componente é pensado pro cenário brasileiro.
          </p>
        </div>

        <div className="Grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} variant="Elevated">
              <CardHeader>
                <feature.icon className={cn('h-10 w-10 mb-2', feature.color)} />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
```

#### CTA (Call to Action)

```typescript
// components/sections/CTA.tsx
import { Button } from '@/components/ui/Button';
import { ArrowRight, Github } from 'lucide-react';

export function CTA() {
  return (
    <section className="Bg-zinc-900 px-6 py-24">
      <div className="Mx-auto max-w-4xl text-center">
        <h2 className="Text-3xl font-bold text-white sm:text-4xl">
          Pronto pra começar?
        </h2>
        <p className="Mt-4 text-lg text-zinc-400">
          Banking Stack é open source. Clone o repositório, rode local, e comece a construir.
        </p>
        <div className="Mt-10 flex items-center justify-center gap-4">
          <Button size="Lg" variant="Primary" rightIcon={<ArrowRight className="H-4 w-4" />}>
            Ver documentação
          </Button>
          <Button size="Lg" variant="Outline" className="Border-zinc-600 text-white hover:bg-zinc-800" leftIcon={<Github className="H-4 w-4" />}>
            GitHub
          </Button>
        </div>
      </div>
    </section>
  );
}
```

#### Layout global

```typescript
// app/layout.tsx
import { TooltipProvider } from '@/components/ui/Tooltip';
import { Header } from '@/components/sections/Header'; // You'd build this too
import { Footer } from '@/components/sections/Footer';
import { cn } from '@/lib/cn';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Banking Stack - Plataforma Financeira para Devs',
  description: 'Construa sistemas financeiros no Brasil com Pix, boletos, Open Finance e NFS-e.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="Pt-BR">
      <body className={cn(inter.className, 'min-h-screen bg-white text-zinc-900 antialiased')}>
        <TooltipProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
```

O layout global com `TooltipProvider` é um detalhe que faz diferença. O Radix Tooltip precisa de um provider no topo da árvore. Colocar em cada página é repetitivo. Colocar no layout resolve de uma vez.

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

### Stories mais ricas

```typescript
// Card.stories.tsx
import { Card, CardHeader, CardTitle, CardDescription } from './Card';

export default {
  title: 'UI/Card',
  component: Card,
  argTypes: {
    variant: { control: 'select', options: ['default', 'elevated', 'outlined', 'ghost'] },
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
  },
};

export const Default = {
  args: {
    children: (
      <CardHeader>
        <CardTitle>Título do Card</CardTitle>
        <CardDescription>Descrição do card com informações adicionais</CardDescription>
      </CardHeader>
    ),
  },
};

export const Elevated = {
  args: {
    variant: 'elevated',
    children: (
      <CardHeader>
        <CardTitle>Card Elevado</CardTitle>
        <CardDescription>Usado em destaque na página</CardDescription>
      </CardHeader>
    ),
  },
};

export const WithCustomClass = {
  args: {
    variant: 'outlined',
    className: 'max-w-sm',
    children: (
      <CardHeader>
        <CardTitle>Card Limitado</CardTitle>
        <CardDescription>Com largura máxima controlada</CardDescription>
      </CardHeader>
    ),
  },
};
```

```typescript
// Dialog.stories.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './Dialog';
import { Button } from './Button';

export default {
  title: 'UI/Dialog',
  component: Dialog,
};

export const Simple = {
  render: () => (
    <Dialog>
      <DialogTrigger>
        <Button variant="Primary">Abrir Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmação</DialogTitle>
        </DialogHeader>
        <p className="Text-sm text-zinc-600">Tem certeza que deseja continuar?</p>
        <div className="Mt-6 flex justify-end gap-3">
          <Button variant="Outline">Cancelar</Button>
          <Button variant="Primary">Confirmar</Button>
        </div>
      </DialogContent>
    </Dialog>
  ),
};
```

### Configuração do Storybook

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/nextjs',
  staticDirs: ['../public'],
};

export default config;
```

O `addon-a11y` é o mais subestimado. Ele escaneia cada componente e aponta problemas de acessibilidade: contraste de cor, labels de ARIA, foco visível. Se você passar o addon-a11y, sua landing page já sai mais acessível que 90% das páginas por aí.

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#171717' },
      ],
    },
  },
};

export default preview;
```

---

## Testes com Vitest + Testing Library

```typescript
// Button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Clique aqui</Button>);
    expect(screen.getByRole('button', { name: /clique aqui/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Clique</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick} disabled>Clique</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows loading spinner', () => {
    render(<Button isLoading>Carregando</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    // O Loader2 do lucide-react renderiza um SVG
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Button variant="Primary">Botão</Button>);
    const button = screen.getByRole('button');

    expect(button.className).toContain('bg-violet-600');

    rerender(<Button variant="Outline">Botão</Button>);
    expect(button.className).toContain('border');
  });
});
```

```typescript
// Card.test.tsx
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
          <CardDescription>Descrição</CardDescription>
        </CardHeader>
      </Card>
    );

    expect(screen.getByText('Título')).toBeInTheDocument();
    expect(screen.getByText('Descrição')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Card variant="Elevated">Conteúdo</Card>);
    const card = screen.getByText('Conteúdo').parentElement!;

    expect(card.className).toContain('shadow-md');

    rerender(<Card variant="Outlined">Conteúdo</Card>);
    expect(card.className).toContain('border-zinc-300');
  });
});
```

Rodando: `pnpm --filter @banking/landing-page test` ou `pnpm vitest`.

---

## Otimizações Next.js

### Imagens com next/image

```typescript
import Image from 'next/image';

export function HeroImage() {
  return (
    <Image
      src="/images/dashboard-preview.png"
      alt="Preview do dashboard do Banking Stack"
      width={1200}
      height={675}
      priority // Carrega antes do resto (acima da dobra)
      className="Rounded-xl"
    />
  );
}
```

Sempre use `next/image` em vez de `<img>` no Next.js. Ele faz otimização automática: WebP, lazy loading, responsive sizes. O `priority` na Hero image garante que ela carrega sem delay — é a primeira coisa que o usuário vê.

### Fonte com next/font

```typescript
// No layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});
```

O `display: 'swap'` mostra texto com fallback até a fonte carregar. Sem FOIT (Flash of Invisible Text). O `variable` permite usar a fonte via CSS variable em qualquer lugar.

### Metadata para SEO

```typescript
// app/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Banking Stack - Plataforma Financeira para Desenvolvedores',
  description: 'Construa sistemas financeiros no Brasil. Pix, boletos, Open Finance, NFS-e e mais.',
  openGraph: {
    title: 'Banking Stack',
    description: 'Plataforma financeira open source para devs brasileiros',
    type: 'website',
    locale: 'pt_BR',
  },
};
```

---

## Por que essa estrutura funciona

1. **Tailwind + CVA** — Você não precisa escrever CSS novo pra cada botão. As variantes são tipadas. O TypeScript te guia: se você escrever `variant="Primery"`, o compilador reclama.

2. **Radix UI** — Acessibilidade sem pensar. Foco, teclado, ARIA attributes. Tudo pronto. Você não precisa lembrar de colocar `role="Dialog"`, `aria-modal`, focus trap — o Radix faz.

3. **Storybook** — O dev de backend consegue ver os componentes sem rodar o app. O designer consegue revisar sem saber React. E o addon-a11y escaneia acessibilidade automaticamente.

4. **cn() helper** — Evita conflito de classes do Tailwind quando você junta classes de props com classes fixas. O `twMerge` resolve conflitos de forma inteligente: se você passar `className="Bg-red-500"` e o componente tiver `bg-blue-500`, o `twMerge` mantém a classe da prop.

5. **Componentes puros** — Cada componente UI não tem estado de negócio. Não sabe de API, de formulário, de nada. É puramente visual. Isso permite reuso em qualquer projeto.

6. **Seções separadas** — O Hero, Features, CTA são específicos dessa landing page. Se você criar outra página, cria novas seções sem mexer nos componentes UI.

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

# Testes
pnpm --filter @banking/landing-page test
# Vitest com coverage
```

---

## Lições aprendidas

1. **Token primeiro, componente depois** — Defina cores, espaçamento, tipografia antes de criar qualquer componente. Se você criar o componente primeiro, vai hardcodar valores e depois terá que refatorar.

2. **CVA é mais que variantes de botão** — Dá pra usar em qualquer componente que tenha variações visuais. Card, Badge, Input, Alert. Tudo com variantes tipadas.

3. **Radix resolve problemas que você nem sabia que tinha** — Focus trap em dialog, gerenciamento de teclado em dropdown, colisão de z-index em tooltip. Coisas que você faria na mão e provavelmente faria errado.

4. **Storybook não é só pra documentar** — É também pra testar visualmente. O addon-interactions permite testar cliques, hover, foco. O addon-a11y escaneia problemas de acessibilidade.

5. **CSS variables > Context API para tema** — Mudar uma variável CSS não causa re-render. Mudar um contexto React causa re-render de toda a árvore. Pra troca de tema, CSS variable é muito mais performático.

6. **Teste de componente não testa o Radix** — Teste seu componente, não a biblioteca. Se você testar que o Dialog abre, está testando o Radix. Teste que seu botão chama `onClick`, que o loading mostra spinner, que o disabled desabilita.

7. **Acessibilidade não é opcional** — Contraste, foco visível, labels, ARIA. O addon-a11y no Storybook te ajuda a não esquecer. A LGPD não exige acessibilidade, mas o bom senso sim.

<Quiz />

<GiscusComments />
