import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Code2,
  Trophy,
  BookOpen,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
  Lock,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    title: "Módulos Completos",
    value: "0/3",
    icon: Code2,
    color: "text-nexa-400",
    bg: "bg-nexa-500/10",
  },
  {
    title: "Desafios Resolvidos",
    value: "0/8",
    icon: Trophy,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    title: "Aulas Assistidas",
    value: "0/30",
    icon: BookOpen,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
  {
    title: "Horas de Estudo",
    value: "0h",
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
];

const modules = [
  {
    id: "go",
    title: "🐹 Go — Concorrência e Alta Performance",
    description:
      "Goroutines, Channels, gRPC, otimização de GC para microsserviços financeiros de alta latência.",
    lessons: 10,
    challenges: 3,
    status: "available" as const,
    href: "/pro/go",
    color: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/30",
    icon: "🐹",
  },
  {
    id: "rust",
    title: "🦀 Rust — Sistemas de Missão Crítica",
    description:
      "Ownership, Borrow Checker, Async Rust com Tokio, Zero-Copy deserialization para ISO 8583.",
    lessons: 11,
    challenges: 2,
    status: "locked" as const,
    href: "/pro/rust",
    color: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-500/30",
    icon: "🦀",
  },
  {
    id: "distributed",
    title: "🌐 Sistemas Distribuídos e Finanças",
    description:
      "Event Sourcing, CQRS, Apache Kafka Exactly-Once, isolamento transacional avançado.",
    lessons: 9,
    challenges: 3,
    status: "locked" as const,
    href: "/pro/distributed",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    icon: "🌐",
  },
];

const milestones = [
  { title: "SPI Simulator em Go", module: "Go", status: "pending" },
  { title: "DICT Simulator em Go", module: "Go", status: "locked" },
  { title: "Ledger Contábil em Go", module: "Go", status: "locked" },
  { title: "ISO 8583 Parser em Rust", module: "Rust", status: "locked" },
  { title: "Order Book Engine em Rust", module: "Rust", status: "locked" },
  { title: "Ledger com Event Sourcing", module: "Distribuídos", status: "locked" },
  { title: "Pipeline SPI com Kafka", module: "Distribuídos", status: "locked" },
  { title: "Projeto Final — Pagamentos", module: "Final", status: "locked" },
];

export default function ProDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-heading-xl font-bold text-neutral-50">
          Banking Stack{" "}
          <span className="gradient-text">Pro</span>
        </h1>
        <p className="mt-2 text-body-md text-surface-400">
          Engenharia de Baixa Latência & FinTech — Go, Rust e Sistemas
          Distribuídos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-surface-200 bg-surface-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm text-surface-400">{stat.title}</p>
                  <p className="text-heading-lg font-bold text-neutral-50">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-heading-md font-semibold text-neutral-50 mb-4">
          Módulos
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {modules.map((mod) => (
            <Link key={mod.id} href={mod.href}>
              <Card
                className={`group cursor-pointer border-surface-200 bg-gradient-to-br ${mod.color} transition-all hover:shadow-lg hover:shadow-nexa-500/5 ${mod.borderColor}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{mod.icon}</span>
                    {mod.status === "locked" && (
                      <Lock className="h-4 w-4 text-surface-400" />
                    )}
                  </div>
                  <CardTitle className="mt-3 text-body-md">
                    {mod.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-body-sm text-surface-400 mb-4">
                    {mod.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-surface-400">
                    <span>{mod.lessons} aulas</span>
                    <span>{mod.challenges} desafios</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-nexa-400 group-hover:text-nexa-300">
                    {mod.status === "locked" ? "Desbloquear" : "Começar"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Milestones Roadmap */}
      <div>
        <h2 className="text-heading-md font-semibold text-neutral-50 mb-4">
          Roadmap de Desafios
        </h2>
        <Card className="border-surface-200 bg-surface-50">
          <CardContent className="p-6">
            <div className="space-y-4">
              {milestones.map((milestone, i) => (
                <div
                  key={milestone.title}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-surface-200 bg-surface-100 text-xs font-medium text-surface-400">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-50">
                      {milestone.title}
                    </p>
                    <p className="text-xs text-surface-400">
                      {milestone.module}
                    </p>
                  </div>
                  {milestone.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : milestone.status === "pending" ? (
                    <Circle className="h-5 w-5 text-nexa-500" />
                  ) : (
                    <Lock className="h-5 w-5 text-surface-400" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-surface-200 bg-surface-50">
          <CardHeader>
            <CardTitle className="text-body-md">Próximo Passo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-surface-400 mb-4">
              Comece pelo Módulo 1 — Aula 01: Introdução a Go para Engenheiros
              Financeiros
            </p>
            <Button size="sm">
              <BookOpen className="h-4 w-4" />
              Assistir Aula
            </Button>
          </CardContent>
        </Card>

        <Card className="border-surface-200 bg-surface-50">
          <CardHeader>
            <CardTitle className="text-body-md">Seu Primeiro Desafio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-body-sm text-surface-400 mb-4">
              Reimplemente o SPI Simulator em Go — desafio #01 do módulo de
              alta performance
            </p>
            <Button size="sm" variant="secondary">
              <Code2 className="h-4 w-4" />
              Iniciar Desafio
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
