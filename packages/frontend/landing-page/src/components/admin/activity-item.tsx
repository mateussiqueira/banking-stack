"use client";

import { cn } from "@/lib/utils";
import { 
  BookOpen, 
  Award, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  PlayCircle,
  Trophy,
  Video
} from "lucide-react";

interface ActivityItemProps {
  activity: {
    id: string;
    type: "lesson_started" | "lesson_completed" | "quiz_passed" | "certificate_earned" | "comment_added" | "video_watched" | "challenge_completed";
    title: string;
    description?: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  };
  showTimeline?: boolean;
}

const typeConfig = {
  lesson_started: {
    icon: PlayCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/15",
  },
  lesson_completed: {
    icon: CheckCircle,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/15",
  },
  quiz_passed: {
    icon: Trophy,
    color: "text-amber-500",
    bgColor: "bg-amber-500/15",
  },
  certificate_earned: {
    icon: Award,
    color: "text-nexa-500",
    bgColor: "bg-nexa-500/15",
  },
  comment_added: {
    icon: MessageSquare,
    color: "text-purple-500",
    bgColor: "bg-purple-500/15",
  },
  video_watched: {
    icon: Video,
    color: "text-pink-500",
    bgColor: "bg-pink-500/15",
  },
  challenge_completed: {
    icon: BookOpen,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/15",
  },
};

export function ActivityItem({ activity, showTimeline = true }: ActivityItemProps) {
  const config = typeConfig[activity.type];
  const Icon = config.icon;

  return (
    <div className={cn("flex gap-4", showTimeline && "relative pb-6 last:pb-0")}>
      {showTimeline && (
        <div className="absolute left-5 top-10 bottom-0 w-px bg-surface-200" />
      )}
      <div className={cn("flex-shrink-0 rounded-full p-2", config.bgColor)}>
        <Icon className={cn("h-4 w-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-body-md font-medium text-neutral-50 truncate">
            {activity.title}
          </p>
        </div>
        {activity.description && (
          <p className="text-body-sm text-surface-text mt-0.5">
            {activity.description}
          </p>
        )}
        <div className="flex items-center gap-1 mt-1">
          <Clock className="h-3 w-3 text-surface-400" />
          <span className="text-caption text-surface-400">
            {activity.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}