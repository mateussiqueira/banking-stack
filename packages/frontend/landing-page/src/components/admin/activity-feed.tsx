import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  type: "course" | "team" | "system";
}

const activities: Activity[] = [
  {
    id: "1",
    user: "Carlos Silva",
    action: "completou o módulo",
    target: "Go — Alta Performance",
    time: "há 5 min",
    type: "course",
  },
  {
    id: "2",
    user: "Ana Santos",
    action: "entrou na equipe",
    target: "Backend Team",
    time: "há 15 min",
    type: "team",
  },
  {
    id: "3",
    user: "Sistema",
    action: "gerou relatório de",
    target: "Progresso Semanal",
    time: "há 1 hora",
    type: "system",
  },
  {
    id: "4",
    user: "Pedro Costa",
    action: "iniciou o curso",
    target: "Rust — Missão Crítica",
    time: "há 2 horas",
    type: "course",
  },
  {
    id: "5",
    user: "Maria Oliveira",
    action: "completou o desafio",
    target: "Concorrência em Go",
    time: "há 3 horas",
    type: "course",
  },
];

const typeColors: Record<Activity["type"], "default" | "info" | "success"> = {
  course: "default",
  team: "info",
  system: "success",
};

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-surface-200 p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-50">
                  <span className="font-medium">{activity.user}</span>{" "}
                  <span className="text-surface-400">{activity.action}</span>{" "}
                  <span className="font-medium text-nexa-400">
                    {activity.target}
                  </span>
                </p>
                <p className="text-xs text-surface-400 mt-1">{activity.time}</p>
              </div>
              <Badge variant={typeColors[activity.type]}>
                {activity.type === "course"
                  ? "Curso"
                  : activity.type === "team"
                  ? "Equipe"
                  : "Sistema"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
