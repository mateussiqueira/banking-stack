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
    id: 11,
    title: "Rust para Engenheiros — Ownership, Borrowing, Lifetimes",
    duration: "60min",
    status: "locked" as const,
    description:
      "Segurança de memória em tempo de compilação. Move vs Copy semantics. Referências mutáveis vs imutáveis.",
  },
  {
    id: 12,
    title: "Enums, Pattern Matching e Error Handling Result<T, E>",
    duration: "50min",
    status: "locked" as const,
    description:
      "Modelando domínios financeiros com enums. Tratamento de erros sem exceptions — o modelo Result.",
  },
  {
    id: 13,
    title: "Traits e Generics — Polimorfismo estático",
    duration: "55min",
    status: "locked" as const,
    description:
      "Traits como interfaces. Monomorfization e zero-cost abstractions para alta performance.",
  },
  {
    id: 14,
    title: "Structs, impl blocks e closures",
    duration: "45min",
    status: "locked" as const,
    description:
      "Organizando código com structs e métodos. Closures e iterators para processamento funcional de dados.",
  },
  {
    id: 15,
    title: "Async/Await em Rust — Futures e executors",
    duration: "60min",
    status: "locked" as const,
    description:
      "O modelo de concorrência do Rust. Futures, executors e o papel do compilador na otimização.",
  },
  {
    id: 16,
    title: "Tokio Runtime — Spawn, Channels, Timer",
    duration: "55min",
    status: "locked" as const,
    description:
      "Construindo runtimes assíncronos de alta performance. Spawn, select!, channels assíncronos.",
  },
  {
    id: 17,
    title: "HTTP com Axum ou Actix-web",
    duration: "50min",
    status: "locked" as const,
    description:
      "Servidores HTTP de alta performance em Rust. Middlewares, extractors e rotas tipadas.",
  },
  {
    id: 18,
    title: "Zero-Copy com serde — Processamento de ISO 8583",
    duration: "65min",
    status: "locked" as const,
    description:
      "Processando payloads financeiros complexos sem alocações. Serde + ZeroCopy para ISO 8583 e FIX Protocol.",
  },
  {
    id: 19,
    title: "WebSockets em Rust para cotações em tempo real",
    duration: "50min",
    status: "locked" as const,
    description:
      "Conexões persistentes massivas para dados de mercado. Broadcast channels e backpressure.",
  },
  {
    id: 20,
    title: "FFI e integração com bibliotecas C",
    duration: "45min",
    status: "locked" as const,
    description:
      "Integrando com sistemas legados via FFI. Unsafe Rust e interopabilidade segura.",
  },
  {
    id: 21,
    title: "Deploy de serviços Rust — Docker, systemd, performance",
    duration: "40min",
    status: "locked" as const,
    description:
      "Containerização, orquestração e otimização de binários Rust para produção.",
  },
];

const challenges = [
  {
    id: 4,
    title: "ISO 8583 Parser em Rust",
    basedOn: "Reimplementação do Challenge 04 (zero-allocation)",
    milestones: 3,
    status: "locked",
  },
  {
    id: 5,
    title: "Order Book Engine em Rust",
    basedOn: "Novo desafio — Matching engine para mercado financeiro",
    milestones: 4,
    status: "locked",
  },
];

export default function RustModulePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-body-sm text-surface-400 mb-2">
            <BookOpen className="h-4 w-4" />
            Módulo 2
          </div>
          <h1 className="text-heading-xl font-bold text-neutral-50">
            🦀 Sistemas de Missão Crítica com{" "}
            <span className="text-orange-400">Rust</span>
          </h1>
          <p className="mt-2 text-body-md text-surface-400 max-w-2xl">
            Quando o Garbage Collector de Go se torna um gargalo e o risco de
            segurança de memória em C++ é inaceitável, o mercado recorre ao
            Rust.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-400">
            11 aulas
          </span>
          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400">
            2 desafios
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
            <div className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 w-0" />
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
                className="border-surface-200 bg-surface-50 opacity-60"
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
                        <Lock className="h-3 w-3 text-surface-400" />
                      </div>
                      <p className="mt-1 text-xs text-surface-400 line-clamp-2">
                        {lesson.description}
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-xs text-surface-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lesson.duration}
                        </span>
                      </div>
                    </div>
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
              className="border-surface-200 bg-surface-50 opacity-60"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-sm">
                    {challenge.title}
                  </CardTitle>
                  <Lock className="h-4 w-4 text-surface-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-surface-400 mb-3">
                  {challenge.basedOn}
                </p>
                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span>{challenge.milestones} milestones</span>
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
                RFC: Data Lake for Fintechs
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
