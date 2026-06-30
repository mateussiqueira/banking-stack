"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProgress,
  getOverallProgress,
  getModuleProgress,
} from "@/lib/progress/store";
import type { StudentProgress, ModuleProgress } from "@/lib/progress/types";
import {
  Flame,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

const MODULE_META: Record<
  string,
  { label: string; icon: string; color: string; gradient: string }
> = {
  go: {
    label: "Go — Alta Performance",
    icon: "🐹",
    color: "text-cyan-400",
    gradient: "from-cyan-500/20 to-blue-500/20",
  },
  rust: {
    label: "Rust — Missão Crítica",
    icon: "🦀",
    color: "text-orange-400",
    gradient: "from-orange-500/20 to-red-500/20",
  },
  distributed: {
    label: "Sistemas Distribuídos",
    icon: "🌐",
    color: "text-purple-400",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
};

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-100">
      <div
        className="h-full rounded-full bg-gradient-to-r from-nexa-500 to-nexa-400 transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function ModuleCard({ module }: { module: ModuleProgress }) {
  const meta = MODULE_META[module.moduleId];
  if (!meta) return null;

  const percentage =
    module.totalCount > 0
      ? Math.round((module.completedCount / module.totalCount) * 100)
      : 0;

  return (
    <div
      className={`rounded-xl border border-surface-200 bg-gradient-to-br ${meta.gradient} p-4`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <span className="text-sm font-medium text-neutral-50">
            {meta.label}
          </span>
        </div>
        <span className={`text-xs font-medium ${meta.color}`}>
          {module.completedCount}/{module.totalCount}
        </span>
      </div>
      <ProgressBar percentage={percentage} />
      <p className="mt-2 text-xs text-surface-400">
        {percentage}% completo
      </p>
    </div>
  );
}

export function ProgressCard() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [overall, setOverall] = useState({ completed: 0, total: 30, percentage: 0 });

  useEffect(() => {
    const p = getProgress();
    setProgress(p);
    setOverall(getOverallProgress());
  }, []);

  if (!progress) return null;

  return (
    <Card className="border-surface-200 bg-surface-50">
      <CardHeader>
        <CardTitle className="text-body-md">Meu Progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-lg bg-surface-100 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexa-500/10">
              <TrendingUp className="h-4 w-4 text-nexa-400" />
            </div>
            <div>
              <p className="text-heading-sm font-bold text-neutral-50">
                {overall.percentage}%
              </p>
              <p className="text-xs text-surface-400">Geral</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-surface-100 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-heading-sm font-bold text-neutral-50">
                {overall.completed}/{overall.total}
              </p>
              <p className="text-xs text-surface-400">Aulas</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-surface-100 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
              <Flame className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-heading-sm font-bold text-neutral-50">
                {progress.streak}
              </p>
              <p className="text-xs text-surface-400">Sequência</p>
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-400">Progresso Total</span>
            <span className="font-medium text-nexa-400">
              {overall.percentage}%
            </span>
          </div>
          <ProgressBar percentage={overall.percentage} />
        </div>

        {/* Module cards */}
        <div className="space-y-3">
          {progress.modules.map((mod) => (
            <ModuleCard key={mod.moduleId} module={mod} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
