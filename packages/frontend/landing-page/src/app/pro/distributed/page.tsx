import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Clock,
  Code2,
  BookOpen,
} from "lucide-react";

const lessons = [
  {
    id: 22,
    title: "Event Sourcing — Logs imutáveis vs State-based",
    duration: "60min",
    status: "locked" as const,
    description:
      "Por que os maiores bancos do mundo utilizam logs imutáveis de eventos em vez de atualizar saldos diretamente.",
  },
  {
    id: 23,
    title: "CQRS — Separando leitura e escrita",
    duration: "55min",
    status: "locked" as const,
    description:
      "Command Query Responsibility Segregation. Projeções otimizadas para consultas financeiras complexas.",
  },
  {
    id: 24,
    title: "Implementação com EventStoreDB ou Kafka",
    duration: "65min",
    status: "locked" as const,
    description:
      "Hands-on com EventStoreDB e Apache Kafka como event stores. Streams, subscriptions e projeções.",
  },
  {
    id: 25,
    title: "Kafka Internals — Partitions, Consumer Groups",
    duration: "60min",
    status: "locked" as const,
    description:
      "Entendendo como Kafka garante throughput massivo. Partições, replicas, consumer groups e rebalancing.",
  },
  {
    id: 26,
    title: "Exactly-Once Semantics com idempotência",
    duration: "50min",
    status: "locked" as const,
    description:
      "Garantindo que uma ordem de pagamento seja entregue exatamente uma vez no ecossistema Pix/SPI.",
  },
  {
    id: 27,
    title: "Schema Registry e Avro/Protobuf",
    duration: "45min",
    status: "locked" as const,
    description:
      "Evolução de schemas sem breaking changes. Schema Registry, compatibilidade backward/forward.",
  },
  {
    id: 28,
    title: "Isolamento Transacional — Read Committed vs Serializable",
    duration: "55min",
    status: "locked" as const,
    description:
      "Níveis de isolamento em bancos relacionais sob concorrência extrema. Snapshot isolation e MVCC.",
  },
  {
    id: 29,
    title: "CockroachDB e banco distribuído",
    duration: "50min",
    status: "locked" as const,
    description:
      "Banco SQL distribuído com consistência forte. Raft consensus e serialização distribuída.",
  },
  {
    id: 30,
    title: "Arquitetura completa — Revisão dos 3 módulos",
    duration: "70min",
    status: "locked" as const,
    description:
      "Juntando Go + Rust + Kafka em uma arquitetura completa de pagamentos. Revisão e boas práticas.",
  },
];

const challenges = [
  {
    id: 6,
    title: "Ledger com Event Sourcing em Rust",
    basedOn: "Novo desafio — Contabilidade imutável",
    milestones: 4,
    status: "locked",
  },
  {
    id: 7,
    title: "Pipeline SPI com Kafka",
    basedOn: "Novo desafio — Processamento distribuído",
    milestones: 3,
    status: "locked",
  },
  {
    id: 8,
    title: "Projeto Final — Sistema Completo de Pagamentos",
    basedOn: "Go + Rust + Kafka integrados",
    milestones: 5,
    status: "locked",
    isFinal: true,
  },
];

export default function DistributedModulePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-body-sm text-surface-400 mb-2">
            <BookOpen className="h-4 w-4" />
            Módulo 3
          </div>
          <h1 className="text-heading-xl font-bold text-neutral-50">
            🌐 Arquitetura de Sistemas{" "}
            <span className="text-purple-400">Distribuídos</span> e Finanças
          </h1>
          <p className="mt-2 text-body-md text-surface-400 max-w-2xl">
            A engenharia por trás do fluxo do dinheiro. Como garantir
            imutabilidade e consistência eventual e forte em sistemas
            transacionais críticos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-surface-100 px-3 py-1 text-xs font-medium text-surface-400">
            9 aulas
          </span>
          <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
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
            <div className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 w-0" />
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
              className={`border-surface-200 bg-surface-50 opacity-60 ${
                challenge.isFinal ? "border-purple-500/30" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-body-sm">
                    {challenge.title}
                  </CardTitle>
                  {challenge.isFinal && (
                    <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                      FINAL
                    </span>
                  )}
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

          {/* Certificação */}
          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <CardHeader>
              <CardTitle className="text-body-sm flex items-center gap-2">
                🏆 Certificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-surface-400 mb-3">
                Ao completar todos os 30 desafios + projeto final:
              </p>
              <ul className="space-y-2 text-xs text-surface-400">
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-purple-400" />
                  Certificado Banking Stack Pro
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-purple-400" />
                  Badge digital para LinkedIn
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-purple-400" />
                  Acesso vitalício a atualizações
                </li>
              </ul>
            </CardContent>
          </Card>

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
                RFC: Financial Transaction Monitoring
              </a>
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
