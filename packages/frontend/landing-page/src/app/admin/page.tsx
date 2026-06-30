import {
  Users,
  GraduationCap,
  AlertTriangle,
  UserX,
  TrendingUp,
  Plus,
  Download,
  Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { ActivityFeed } from "@/components/admin/activity-feed";
import { TopPerformers } from "@/components/admin/top-performers";

const stats = [
  {
    title: "Active Learners",
    value: 42,
    change: "+12% vs last month",
    changeType: "positive" as const,
    icon: Users,
    iconColor: "text-nexa-400",
  },
  {
    title: "Completed",
    value: 28,
    change: "+8 este mês",
    changeType: "positive" as const,
    icon: GraduationCap,
    iconColor: "text-emerald-400",
  },
  {
    title: "At Risk",
    value: 5,
    change: "-2 vs last week",
    changeType: "negative" as const,
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  {
    title: "Inactive",
    value: 7,
    change: "Último acesso há 7+ dias",
    changeType: "neutral" as const,
    icon: UserX,
    iconColor: "text-surface-400",
  },
];

const monthlyData = [
  { month: "Jan", value: 65 },
  { month: "Fev", value: 72 },
  { month: "Mar", value: 80 },
  { month: "Abr", value: 85 },
  { month: "Mai", value: 78 },
  { month: "Jun", value: 92 },
];

export default function AdminDashboard() {
  const maxValue = Math.max(...monthlyData.map((d) => d.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-lg font-bold text-neutral-50">
            Dashboard
          </h1>
          <p className="text-body-sm text-surface-400 mt-1">
            Visão geral do Banking Stack Pro
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" />
            Adicionar Equipe
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tendência de Conclusão</CardTitle>
              <div className="flex items-center gap-2 text-sm text-surface-400">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span>+18% este semestre</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((item) => (
                <div
                  key={item.month}
                  className="flex flex-col items-center flex-1"
                >
                  <div
                    className="w-full rounded-t-lg bg-nexa-500/20 hover:bg-nexa-500/30 transition-colors"
                    style={{ height: `${(item.value / maxValue) * 100}%` }}
                  />
                  <span className="text-xs text-surface-400 mt-2">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4" />
                Adicionar Equipe
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4" />
                Exportar Relatório
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4" />
                Enviar Convite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <TopPerformers />
      </div>
    </div>
  );
}
