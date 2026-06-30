import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  CheckCircle2,
  Circle,
  Lock,
  Clock,
  Code2,
  ArrowRight,
  BookOpen,
} from "lucide-react";

const lessons = [
  {
    id: 1,
    title: "Introdução a Go para Engenheiros Financeiros",
    duration: "45min",
    status: "available" as const,
    description:
      "Por que Go é a linguagem escolhida para infraestrutura financeira moderna. Setup do ambiente e primeiros programas.",
  },
  {
    id: 2,
    title: "Goroutines — Concorrência Real vs Paralelismo",
    duration: "60min",
    status: "locked" as const,
    description:
      "Como o scheduler do Go gerencia milhares de goroutines. Diferença entre concorrência e paralelismo na prática.",
  },
  {
    id: 3,
    title: "Channels — Comunicação Segura entre Goroutines",
    duration: "50min",
    status: "locked" as const,
    description:
      "Buffered vs unbuffered channels. Padrões Fan-out/Fan-in, Pipeline e Worker Pool para processamento de transações.",
  },
  {
    id: 4,
    title: "Pacote sync — Mutex, RWMutex, WaitGroup",
    duration: "55min",
    status: "locked" as const,
    description:
      "Evitando race conditions com primitivas de sincronização. Quando usar Mutex vs RWMutex em sistemas transacionais.",
  },
  {
    id: 5,
    title: "Context — Cancelamento e Timeout em Go",
    duration: "40min",
    status: "locked" as const,
    description:
      "Gerenciamento de lifecycle de requisições. Cancelamento cascata e timeouts em cadeias de chamadas.",
  },
  {
    id: 6,
    title: "gRPC com Go — Proto definitions e streaming",
    duration: "65min",
    status: "locked" as const,
    description:
      "Substituindo REST por gRPC. Protocol Buffers, streaming unidirecional e bidirecional para dados financeiros.",
  },
  {
    id: 7,
    title: "Otimização do Garbage Collector",
    duration: "50min",
    status: "locked" as const,
    description:
      "GOGC, GOMEMLIMIT, Object pooling com sync.Pool. Minimizando allocations em hot paths transacionais.",
  },
  {
    id: 8,
    title: "Profiling com pprof — CPU, Memory, Goroutines",
    duration: "45min",
    status: "locked" as const,
    description:
      "Identificando gargalos de performance. Flame graphs e análise de memória em produção.",
  },
  {
    id: 9,
    title: "Testes de Carga com k6 em Go",
    duration: "55min",
    status: "locked" as const,
    description:
      "Criando scripts de stress test. Simulando race conditions e validando locks sob pressão.",
  },
  {
    id: 10,
    title: "Go em Produção — Graceful Shutdown, Health Checks",
    duration: "50min",
    status: "locked" as const,
    description:
      "Preparando microsserviços para produção. Graceful shutdown, readiness/liveness probes, observabilidade.",
  },
];

const challenges = [
  {
    id: 1,
    title: "SPI Simulator em Go",
    basedOn: "Reimplementação do Challenge 02",
    milestones: 3,
    status: "available",
  },
  {
    id: 2,
    title: "DICT Simulator em Go",
    basedOn: "Reimplementação do Challenge 03",
    milestones: 3,
    status: "locked",
  },
  {
    id: 3,
    title: "Ledger Contábil em Go",
    basedOn: "Reimplementação do Challenge 01",
    milestones: 3,
    status: "locked",
  },
];

export default function GoModulePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-body-sm text-surface-400 mb-2">
            <BookOpen className="h-4 w-4" />
            Módulo 1
          </div>
          <h1 className="text-heading-xl font-bold text-neutral-50">
            🐹 Concorrência e Alta Performance com{" "}
            <span className="text-cyan-400">Go</span>
          </h1>
          <p className="mt-2 text-body-md text-surface-400 max-w-2xl">
            Go é a linguagem que move a infraestrutura em nuvem moderna. Neste
            módulo, você aprenderá a escalar microsserviços financeiros para
            suportar milhões de requisições.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-400">
            10 aulas
          </span>
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
            3 desafios
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="border-surface-200 bg-surface-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm font-medium text-neutral-50">
              Progresso do Módulo
            </span>
            <span className="text-body-sm text-surface-400">0%</span>
          </div>
          <div className="h-2 rounded-full bg-surface-100">
            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 w-0" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lessons List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-heading-md font-semibold text-neutral-50">
            Aulas
          </h2>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className={`border-surface-200 bg-surface-50 transition-all ${
                  lesson.status === "available"
                    ? "hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/5 cursor-pointer"
                    : "opacity-60"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-surface-200 bg-surface-100 text-sm font-medium text-surface-400">
                      {lesson.id}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-neutral-50">
                          {lesson.title}
                        </h3>
                        {lesson.status === "locked" && (
                          <Lock className="h-3 w-3 text-surface-400" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-surface-400 line-clamp-2">
                        {lesson.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration}
                        </span>
                        {lesson.status === "available" && (
                          <span className="flex items-center gap-1 text-cyan-400">
                            <Play className="h-3 w-3" />
                            Assistir
                          </span>
                        )}
                      </div>
                    </div>
                    {lesson.status === "available" && (
                      <ArrowRight className="h-4 w-4 text-cyan-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Challenges Sidebar */}
        <div className="space-y-4">
          <h2 className="text-heading-md font-semibold text-neutral-50">
            Desafios Práticos
          </h2>
          {challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className={`border-surface-200 bg-surface-50 ${
                challenge.status === "available"
                  ? "border-cyan-500/30"
                  : "opacity-60"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-sm">
                    {challenge.title}
                  </CardTitle>
                  {challenge.status === "locked" && (
                    <Lock className="h-4 w-4 text-surface-400" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-surface-400 mb-3">
                  {challenge.basedOn}
                </p>
                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span>{challenge.milestones} milestones</span>
                  {challenge.status === "available" && (
                    <Button size="sm" variant="secondary">
                      <Code2 className="h-3 w-3" />
                      Iniciar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* RFCs */}
          <Card className="border-surface-200 bg-surface-50">
            <CardHeader>
              <CardTitle className="text-body-sm">RFCs Relacionados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="#"
                className="block text-xs text-nexa-400 hover:text-nexa-300"
              >
                RFC: Credit on top of Pix
              </a>
              <a
                href="#"
                className="block text-xs text-nexa-400 hover:text-nexa-300"
              >
                RFC: Financial Transaction Monitoring
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
