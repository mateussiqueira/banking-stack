import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Performer {
  id: string;
  name: string;
  initials: string;
  score: number;
  modulesCompleted: number;
  streak: number;
}

const performers: Performer[] = [
  {
    id: "1",
    name: "Carlos Silva",
    initials: "CS",
    score: 98,
    modulesCompleted: 12,
    streak: 15,
  },
  {
    id: "2",
    name: "Ana Santos",
    initials: "AS",
    score: 95,
    modulesCompleted: 11,
    streak: 12,
  },
  {
    id: "3",
    name: "Pedro Costa",
    initials: "PC",
    score: 92,
    modulesCompleted: 10,
    streak: 10,
  },
  {
    id: "4",
    name: "Maria Oliveira",
    initials: "MO",
    score: 89,
    modulesCompleted: 9,
    streak: 8,
  },
  {
    id: "5",
    name: "João Pereira",
    initials: "JP",
    score: 87,
    modulesCompleted: 8,
    streak: 7,
  },
];

export function TopPerformers() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performers.map((performer, index) => (
            <div
              key={performer.id}
              className="flex items-center gap-3 rounded-lg border border-surface-200 p-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-nexa-500/20 text-xs font-bold text-nexa-400">
                {index + 1}
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-xs font-medium text-surface-400">
                {performer.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-50 truncate">
                  {performer.name}
                </p>
                <p className="text-xs text-surface-400">
                  {performer.modulesCompleted} módulos · {performer.streak} dias
                  seguidos
                </p>
              </div>
              <Badge variant="success">{performer.score}%</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
