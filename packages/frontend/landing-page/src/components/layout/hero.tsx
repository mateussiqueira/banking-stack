import * as React from "react";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const stats = [
  { value: "R$ 2B+", label: "Processados" },
  { value: "50K+", label: "Empresas" },
  { value: "99.9%", label: "Uptime" },
  { value: "< 1s", label: "Confirmação" },
];

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface via-surface to-surface-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.05),transparent_50%)]" />

      <Container className="relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <Badge variant="default" className="mb-6 text-sm px-4 py-1.5">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Nova plataforma de pagamentos
          </Badge>

          <h1 className="text-display-md sm:text-display-lg lg:text-display-xl font-bold text-neutral-50 mb-6 leading-tight">
            Transforme seus pagamentos com{" "}
            <span className="bg-gradient-to-r from-nexa-400 to-nexa-600 bg-clip-text text-transparent">
              Nexa
            </span>
          </h1>

          <p className="text-body-lg sm:text-heading-sm text-surface-400 max-w-2xl mb-8 leading-relaxed">
            Aceite Pix, gerencie Open Finance, valide identidades e acompanhe
            relatórios em tempo real. Tudo que você precisa para escalar seu
            negócio.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              Começar Grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              Ver Demo
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-3xl">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-xl bg-surface-50/50 border border-surface-200/50"
              >
                <div className="text-heading-lg font-bold text-nexa-500 mb-1">
                  {stat.value}
                </div>
                <div className="text-caption text-surface-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-surface-200 to-transparent" />
    </section>
  );
}

// TODO: add aria-labels and keyboard navigation
