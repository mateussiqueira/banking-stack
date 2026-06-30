"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TeamCard } from "@/components/admin/team-card";
import { Plus, Search, Filter, Users, TrendingUp, BarChart3 } from "lucide-react";

const mockTeams = [
  {
    id: "1",
    name: "Backend Engineers",
    description: "Core platform development team focusing on API and microservices",
    memberCount: 12,
    completionRate: 78,
    status: "active" as const,
  },
  {
    id: "2",
    name: "Frontend Team",
    description: "UI/UX implementation and client-side development",
    memberCount: 8,
    completionRate: 65,
    status: "active" as const,
  },
  {
    id: "3",
    name: "DevOps Squad",
    description: "Infrastructure, CI/CD, and cloud operations",
    memberCount: 5,
    completionRate: 92,
    status: "active" as const,
  },
  {
    id: "4",
    name: "QA Team",
    description: "Quality assurance and automated testing",
    memberCount: 6,
    completionRate: 45,
    status: "active" as const,
  },
  {
    id: "5",
    name: "Data Engineering",
    description: "Data pipelines, analytics, and machine learning",
    memberCount: 7,
    completionRate: 33,
    status: "inactive" as const,
  },
  {
    id: "6",
    name: "Security Team",
    description: "Application security and compliance",
    memberCount: 4,
    completionRate: 88,
    status: "active" as const,
  },
];

const stats = [
  { label: "Total Teams", value: "6", icon: Users, change: "+2 this month" },
  { label: "Avg Completion", value: "67%", icon: TrendingUp, change: "+5% vs last month" },
  { label: "Active Learners", value: "42", icon: BarChart3, change: "89% engagement" },
];

export default function TeamsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "archived">("all");

  const filteredTeams = mockTeams.filter((team) => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || team.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-heading-lg font-bold text-neutral-50">Teams</h1>
            <p className="text-body-md text-surface-text mt-1">
              Manage your teams and track their learning progress
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-surface-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-body-sm text-neutral-50 focus:border-nexa-500 focus:outline-none focus:ring-1 focus:ring-nexa-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onClick={() => router.push(`/admin/teams/${team.id}`)}
            />
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-surface-400 mx-auto mb-4" />
            <p className="text-body-md text-surface-text">No teams found</p>
            <p className="text-body-sm text-surface-400 mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}