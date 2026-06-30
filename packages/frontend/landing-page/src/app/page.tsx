import { Hero } from "@/components/layout/hero";
import { Section, SectionHeader } from "@/components/layout/section";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  QrCode,
  Building2,
  UserCheck,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Star,
  ChevronRight,
  Shield,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";

const features = [
  {
    icon: QrCode,
    title: "Pix",
    description:
      "Receba pagamentos via Pix com confirmação instantânea e taxas competitivas.",
    badge: "Popular",
  },
  {
    icon: Building2,
    title: "Open Finance",
    description:
      "Conecte-se a instituições financeiras e acesse dados bancários de forma segura.",
    badge: "Novo",
  },
  {
    icon: UserCheck,
    title: "KYC",
    description:
      "Valide identidades digitalmente com verificação documental e biometrica.",
    badge: "Seguro",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description:
      "Acompanhe métricas, conciliações e relatórios em tempo real.",
    badge: "Tempo Real",
  },
  {
    icon: Shield,
    title: "Anti-Fraude",
    description:
      "Proteção contra fraudes com machine learning e análise comportamental.",
    badge: "ML",
  },
  {
    icon: Zap,
    title: "API Robusta",
    description:
      "Integração simples e documentada com webhooks e SDKs.",
    badge: "Devs",
  },
];

const steps = [
  {
    step: 1,
    icon: Zap,
    title: "Crie sua Conta",
    description:
      "Cadastre-se em menos de 2 minutos. Sem burocracia, sem documentação complexa.",
  },
  {
    step: 2,
    icon: QrCode,
    title: "Integre",
    description:
      "Conecte nossa API ao seu sistema ou use nossos plugins prontos para e-commerce.",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Receba Pagamentos",
    description:
      "Comece a receber pagamentos via Pix com confirmação em tempo real.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    description: "Para começar a testar a plataforma",
    features: [
      "Até 100 transações/mês",
      "Pix básico",
      "Dashboard simples",
      "Suporte por email",
    ],
    cta: "Começar Grátis",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "R$ 97",
    period: "/mês",
    description: "Para negócios em crescimento",
    features: [
      "Até 10.000 transações/mês",
      "Pix + Open Finance",
      "KYC básico",
      "Relatórios avançados",
      "Suporte prioritário",
      "API completa",
    ],
    cta: "Assinar Agora",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Sob Medida",
    description: "Para grandes operações",
    features: [
      "Transações ilimitadas",
      "Todos os produtos",
      "KYC completo",
      "Anti-fraude dedicado",
      "Suporte 24/7",
      "SLA personalizado",
      "Gerente de conta",
    ],
    cta: "Falar com Vendas",
    highlighted: false,
  },
];

const testimonials = [
  {
    name: "Ana Silva",
    role: "CTO, TechFinance",
    content:
      "A Nexa transformou nossos pagamentos. Reduzimos custos em 40% e a integração foi incrivelmente simples.",
    rating: 5,
  },
  {
    name: "Carlos Oliveira",
    role: "CEO, DigitalPay",
    content:
      "O suporte é excepcional. Em menos de 24 horas estávamos com tudo funcionando perfeitamente.",
    rating: 5,
  },
  {
    name: "Mariana Santos",
    role: "Head de Produto, FinTech BR",
    content:
      "A API da Nexa é a melhor do mercado. Documentação clara, webhooks confiáveis e tempo de atividade impecável.",
    rating: 5,
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Card className="glow-card group cursor-default">
      <CardHeader>
        <div className="w-12 h-12 rounded-xl bg-nexa-500/10 flex items-center justify-center mb-2 group-hover:bg-nexa-500/20 transition-colors">
          <Icon className="w-6 h-6 text-nexa-500" />
        </div>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          {badge && <Badge variant="default">{badge}</Badge>}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}) {
  return (
    <Card
      className={`relative flex flex-col ${
        highlighted
          ? "border-nexa-500/50 shadow-nexa-glow scale-105"
          : ""
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="default" className="px-4 py-1 text-sm">
            Mais Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <div className="mt-2">
          <span className="text-display-md font-bold text-neutral-50">
            {price}
          </span>
          {period && (
            <span className="text-body-sm text-surface-400 ml-1">
              {period}
            </span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-nexa-500 shrink-0 mt-0.5" />
              <span className="text-body-sm text-surface-400">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          variant={highlighted ? "primary" : "outline"}
          size="lg"
          className="w-full"
        >
          {cta}
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <Hero />

      {/* Features */}
      <Section id="features" size="lg" withBorder>
        <SectionHeader
          title="Tudo que você precisa para crescer"
          subtitle="Uma plataforma completa com os produtos financeiros mais modernos do mercado."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </Section>

      {/* How It Works */}
      <Section id="how-it-works" size="lg" withBorder>
        <SectionHeader
          title="Como Funciona"
          subtitle="Comece a receber pagamentos em minutos, não em dias."
        />
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => (
            <div key={step.step} className="relative text-center group">
              <div className="w-16 h-16 rounded-2xl bg-nexa-500/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-nexa-500/20 transition-colors">
                <step.icon className="w-8 h-8 text-nexa-500" />
              </div>
              <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 md:block hidden">
                {step.step < 3 && (
                  <ArrowRight className="w-6 h-6 text-surface-300" />
                )}
              </div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-nexa-500 text-black text-sm font-bold mb-4">
                {step.step}
              </div>
              <h3 className="text-heading-md font-semibold text-neutral-50 mb-3">
                {step.title}
              </h3>
              <p className="text-body-md text-surface-400 max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing" size="lg" withBorder>
        <SectionHeader
          title="Preços Simples"
          subtitle="Sem surpresas. Escolha o plano ideal para o seu negócio."
        />
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </Section>

      {/* Testimonials */}
      <Section id="testimonials" size="lg" withBorder>
        <SectionHeader
          title="Quem Usa Recomenda"
          subtitle="O que nossos clientes dizem sobre a Nexa."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="glow-card">
              <CardHeader>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-nexa-500 text-nexa-500"
                    />
                  ))}
                </div>
                <CardDescription className="text-body-md italic">
                  &ldquo;{testimonial.content}&rdquo;
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-nexa-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-nexa-500" />
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-neutral-50">
                      {testimonial.name}
                    </p>
                    <p className="text-caption text-surface-400">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section size="lg">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-nexa-600 via-nexa-500 to-nexa-400 p-8 md:p-16 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Zap className="w-3.5 h-3.5 mr-1.5" />
              Comece Agora
            </Badge>
            <h2 className="text-heading-xl md:text-display-md font-bold text-black mb-4">
              Pronto para Transformar seus Pagamentos?
            </h2>
            <p className="text-body-lg text-black/70 mb-8">
              Junte-se a mais de 50 mil empresas que já confiam na Nexa.
              Comece grátis, sem compromisso.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                className="bg-black text-white hover:bg-black/90 w-full sm:w-auto"
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-black/80 hover:text-black hover:bg-white/10 w-full sm:w-auto"
              >
                Falar com Vendas
              </Button>
            </div>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="bg-surface-50 border-t border-surface-100">
        <Container className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <a href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-nexa-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-black" />
                </div>
                <span className="text-heading-sm font-bold text-neutral-50">
                  Nexa
                </span>
              </a>
              <p className="text-body-sm text-surface-400 mb-4 max-w-xs">
                A plataforma completa de pagamentos para o seu negócio crescer.
              </p>
            </div>
            {[
              {
                title: "Produto",
                links: ["Pix", "Open Finance", "KYC", "Relatórios", "API"],
              },
              {
                title: "Empresa",
                links: ["Sobre", "Blog", "Carreiras", "Contato"],
              },
              {
                title: "Recursos",
                links: ["Documentação", "Status", "Changelog", "FAQ"],
              },
              {
                title: "Legal",
                links: ["Privacidade", "Termos", "Segurança"],
              },
            ].map((group) => (
              <div key={group.title}>
                <h4 className="text-body-sm font-semibold text-neutral-50 mb-3">
                  {group.title}
                </h4>
                <ul className="space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-body-sm text-surface-400 hover:text-nexa-500 transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-surface-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-caption text-surface-400">
              © 2024 Nexa. Todos os direitos reservados.
            </p>
          </div>
        </Container>
      </footer>
    </>
  );
}

// TODO: extract strings to i18n for multi-language support
