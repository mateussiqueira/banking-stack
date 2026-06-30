"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { saveLessonProgress, getLessonProgress } from "@/lib/progress/store";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonCompleteButtonProps {
  moduleId: string;
  lessonId: string;
  onComplete?: () => void;
}

export function LessonCompleteButton({
  moduleId,
  lessonId,
  onComplete,
}: LessonCompleteButtonProps) {
  const [completed, setCompleted] = useState(() => {
    if (typeof window === "undefined") return false;
    const progress = getLessonProgress(moduleId, lessonId);
    return progress?.completed ?? false;
  });
  const [animating, setAnimating] = useState(false);

  const handleClick = () => {
    if (completed) return;

    setAnimating(true);
    saveLessonProgress(moduleId, lessonId);
    setCompleted(true);
    onComplete?.();

    setTimeout(() => setAnimating(false), 600);
  };

  return (
    <Button
      variant={completed ? "secondary" : "primary"}
      size="sm"
      onClick={handleClick}
      disabled={completed}
      className={cn(
        "transition-all duration-300",
        completed && "border-green-500/30 bg-green-500/10 text-green-400",
        animating && "scale-105"
      )}
    >
      {completed ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {completed ? "Concluída" : "Marcar como Concluída"}
    </Button>
  );
}
