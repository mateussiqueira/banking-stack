"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LearnerTable } from "@/components/admin/learner-table";
import { 
  Users, 
  TrendingUp, 
  Award, 
  Clock,
  Filter,
  Download
} from "lucide-react";

const mockLearners = [
  { id: "1", name: "Sarah Chen", email: "sarah@bankingstack.com", team: "Backend Engineers", progress: 92, lastActive: "2 hours ago", status: "active" as const },
  { id: "2", name: "Marcus Johnson", email: "marcus@bankingstack.com", team: "Backend Engineers", progress: 85, lastActive: "1 hour ago", status: "active" as const },
  { id: "3", name: "Elena Rodriguez", email: "elena@bankingstack.com", team: "Backend Engineers", progress: 72, lastActive: "3 hours ago", status: "active" as const },
  { id: "4", name: "David Kim", email: "david@bankingstack.com", team: "Frontend Team", progress: 68, lastActive: "1 day ago", status: "active" as const },
  { id: "5", name: "Alex Thompson", email: "alex@bankingstack.com", team: "Frontend Team", progress: 45, lastActive: "2 days ago", status: "active" as const },
  { id: "6", name: "Jessica Lee", email: "jessica@bankingstack.com", team: "DevOps Squad", progress: 95, lastActive: "30 minutes ago", status: "active" as const },
  { id: "7", name: "Ryan Martinez", email: "ryan@bankingstack.com", team: "DevOps Squad", progress: 88, lastActive: "4 hours ago", status: "active" as const },
  { id: "8", name: "Amanda Wilson", email: "amanda@bankingstack.com", team: "QA Team", progress: 72, lastActive: "5 hours ago", status: "active" as const },
  { id: "9", name: "Chris Anderson", email: "chris@bankingstack.com", team: "QA Team", progress: 35, lastActive: "1 week ago", status: "inactive" as const },
  { id: "10", name: "Nicole Taylor", email: "nicole@bankingstack.com", team: "Data Engineering", progress: 82, lastActive: "2 hours ago", status: "active" as const },
  { id: "11", name: "Michael Brown", email: "michael@bankingstack.com", team: "Security Team", progress: 91, lastActive: "1 hour ago", status: "active" as const },
  { id: "12", name: "Laura Garcia", email: "laura@bankingstack.com", team: "Security Team", progress: 78, lastActive: "3 hours ago", status: "active" as const },
  { id: "13", name: "Jason White", email: "jason@bankingstack.com", team: "Backend Engineers", progress: 65, lastActive: "2 days ago", status: "active" as const },
  { id: "14", name: "Stephanie Harris", email: "stephanie@bankingstack.com", team: "Frontend Team", progress: 100, lastActive: "1 week ago", status: "completed" as const },
  { id: "15", name: "Daniel Clark", email: "daniel@bankingstack.com", team: "DevOps Squad", progress: 42, lastActive: "3 days ago", status: "inactive" as const },
];

const stats = [
  { label: "Total Learners", value: "15", icon: Users, change: "+3 this month" },
  { label: "Avg Progress", value: "73%", icon: TrendingUp, change: "+8% vs last month" },
  { label: "Certificates Earned", value: "28", icon: Award, change: "12 this week" },
  { label: "Avg Time Active", value: "4.2h", icon: Clock, change: "Daily average" },
];

export default function LearnersPage() {
  const router = useRouter();
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const teams = ["Backend Engineers", "Frontend Team", "DevOps Squad", "QA Team", "Data Engineering", "Security Team"];

  const filteredLearners = mockLearners.filter((learner) => {
    const matchesTeam = teamFilter === "all" || learner.team === teamFilter;
    const matchesStatus = statusFilter === "all" || learner.status === statusFilter;
    return matchesTeam && matchesStatus;
  });

  const handleExport = () => {
    const headers = ["Name", "Email", "Team", "Progress", "Last Active", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredLearners.map((l) =>
        [l.name, l.email, l.team, `${l.progress}%`, l.lastActive, l.status].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learners-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-lg font-bold text-neutral-50">Learners</h1>
            <p className="text-body-md text-surface-text mt-1">
              Manage learners and track their progress across all teams
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-surface-200 bg-surface-50 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm text-surface-text">{stat.label}</p>
                  <p className="text-heading-md font-bold text-neutral-50 mt-1">
                    {stat.value}
                  </p>
                  <p className="text-caption text-nexa-500 mt-1">{stat.change}</p>
                </div>
                <div className="rounded-lg bg-nexa-500/15 p-3">
                  <stat.icon className="h-6 w-6 text-nexa-500" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-surface-400" />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm text-neutral-50 focus:border-nexa-500 focus:outline-none focus:ring-1 focus:ring-nexa-500"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm text-neutral-50 focus:border-nexa-500 focus:outline-none focus:ring-1 focus:ring-nexa-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <span className="text-body-sm text-surface-text">
            {filteredLearners.length} learners
          </span>
        </div>

        {/* Table */}
        <LearnerTable
          learners={filteredLearners}
          onLearnerClick={(learner) => router.push(`/admin/learners/${learner.id}`)}
          onExport={handleExport}
        />
      </div>
    </div>
  );
}