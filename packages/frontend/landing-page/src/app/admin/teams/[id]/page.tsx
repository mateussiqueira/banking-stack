"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/admin/progress-bar";
import { ActivityItem } from "@/components/admin/activity-item";
import { 
  ArrowLeft, 
  Settings, 
  UserPlus, 
  Mail, 
  MoreVertical,
  BookOpen,
  Clock,
  Award
} from "lucide-react";

const mockTeam = {
  id: "1",
  name: "Backend Engineers",
  description: "Core platform development team focusing on API and microservices",
  memberCount: 12,
  completionRate: 78,
  status: "active",
  createdAt: "2024-01-15",
  leads: ["Sarah Chen", "Marcus Johnson"],
};

const mockMembers = [
  { id: "1", name: "Sarah Chen", email: "sarah@bankingstack.com", role: "Team Lead", progress: 92, lastActive: "2 hours ago", status: "active" as const },
  { id: "2", name: "Marcus Johnson", email: "marcus@bankingstack.com", role: "Senior Engineer", progress: 85, lastActive: "1 hour ago", status: "active" as const },
  { id: "3", name: "Elena Rodriguez", email: "elena@bankingstack.com", role: "Engineer", progress: 72, lastActive: "3 hours ago", status: "active" as const },
  { id: "4", name: "David Kim", email: "david@bankingstack.com", role: "Engineer", progress: 68, lastActive: "1 day ago", status: "active" as const },
  { id: "5", name: "Alex Thompson", email: "alex@bankingstack.com", role: "Junior Engineer", progress: 45, lastActive: "2 days ago", status: "active" as const },
];

const mockLearningPaths = [
  { id: "1", name: "Microservices Architecture", progress: 85, modules: 12, completedModules: 10 },
  { id: "2", name: "API Design Best Practices", progress: 70, modules: 8, completedModules: 6 },
  { id: "3", name: "Cloud Native Development", progress: 60, modules: 15, completedModules: 9 },
];

const mockActivities = [
  { id: "1", type: "lesson_completed" as const, title: "Completed: RESTful API Patterns", description: "Sarah Chen finished the module", timestamp: "2 hours ago" },
  { id: "2", type: "quiz_passed" as const, title: "Quiz Passed: Microservices 101", description: "Marcus Johnson scored 95%", timestamp: "4 hours ago" },
  { id: "3", type: "certificate_earned" as const, title: "Certificate Earned", description: "Elena Rodriguez completed Cloud Fundamentals", timestamp: "1 day ago" },
  { id: "4", type: "lesson_started" as const, title: "Started: Event-Driven Architecture", description: "David Kim began the module", timestamp: "2 days ago" },
];

const statusConfig = {
  active: { label: "Active", variant: "success" as const },
  inactive: { label: "Inactive", variant: "secondary" as const },
  archived: { label: "Archived", variant: "outline" as const },
};

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const team = mockTeam;

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/teams")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-heading-lg font-bold text-neutral-50">{team.name}</h1>
                <Badge variant={statusConfig[team.status as keyof typeof statusConfig].variant}>
                  {statusConfig[team.status as keyof typeof statusConfig].label}
                </Badge>
              </div>
              <p className="text-body-md text-surface-text mt-1">{team.description}</p>
              <div className="flex items-center gap-4 mt-3 text-body-sm text-surface-text">
                <span>Created {team.createdAt}</span>
                <span>•</span>
                <span>{team.memberCount} members</span>
                <span>•</span>
                <span>Leads: {team.leads.join(", ")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Mail className="h-4 w-4 mr-2" />
                Message Team
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Members */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-100 cursor-pointer"
                      onClick={() => router.push(`/admin/learners/${member.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-nexa-500/15 flex items-center justify-center text-nexa-500 font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-body-md font-medium text-neutral-50">
                            {member.name}
                          </p>
                          <p className="text-body-sm text-surface-text">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-32">
                          <ProgressBar value={member.progress} showLabel={false} size="sm" />
                          <p className="text-caption text-surface-text mt-1 text-right">
                            {member.progress}%
                          </p>
                        </div>
                        <span className="text-body-sm text-surface-text w-24 text-right">
                          {member.lastActive}
                        </span>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Paths */}
            <Card>
              <CardHeader>
                <CardTitle>Assigned Learning Paths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLearningPaths.map((path) => (
                    <div key={path.id} className="p-4 rounded-lg border border-surface-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-nexa-500/15 p-2">
                            <BookOpen className="h-5 w-5 text-nexa-500" />
                          </div>
                          <div>
                            <p className="text-body-md font-medium text-neutral-50">
                              {path.name}
                            </p>
                            <p className="text-body-sm text-surface-text">
                              {path.completedModules} of {path.modules} modules completed
                            </p>
                          </div>
                        </div>
                      </div>
                      <ProgressBar value={path.progress} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Team Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 rounded-lg bg-surface-100">
                    <p className="text-heading-md font-bold text-nexa-500">78%</p>
                    <p className="text-body-sm text-surface-text">Avg Completion</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface-100">
                    <p className="text-heading-md font-bold text-nexa-500">12</p>
                    <p className="text-body-sm text-surface-text">Total Members</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface-100">
                    <p className="text-heading-md font-bold text-nexa-500">3</p>
                    <p className="text-body-sm text-surface-text">Learning Paths</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-surface-100">
                    <p className="text-heading-md font-bold text-nexa-500">89%</p>
                    <p className="text-body-sm text-surface-text">Engagement</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mockActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="h-4 w-4 mr-2" />
                    View Certificates
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Clock className="h-4 w-4 mr-2" />
                    Activity Log
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Team Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}