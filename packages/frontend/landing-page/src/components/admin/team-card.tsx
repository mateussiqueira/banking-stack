"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp } from "lucide-react";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    memberCount: number;
    completionRate: number;
    status: "active" | "inactive" | "archived";
    description?: string;
  };
  onClick?: () => void;
}

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  inactive: { label: "Inactive", variant: "secondary" as const },
  archived: { label: "Archived", variant: "outline" as const },
};

export function TeamCard({ team, onClick }: TeamCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-lg hover:border-nexa-500/30"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          <Badge variant={statusConfig[team.status].variant}>
            {statusConfig[team.status].label}
          </Badge>
        </div>
        {team.description && (
          <p className="text-body-sm text-surface-text mt-1 line-clamp-2">
            {team.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-surface-text">
            <Users className="h-4 w-4" />
            <span className="text-body-sm">{team.memberCount} members</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-nexa-500" />
            <span className="text-body-sm font-medium text-nexa-500">
              {team.completionRate}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}