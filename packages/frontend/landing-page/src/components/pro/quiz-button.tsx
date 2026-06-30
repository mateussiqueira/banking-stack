"use client";

import { useState } from "react";
import { ClipboardCheck, Trophy, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuizModal } from "./quiz-modal";
import { quizzes } from "@/lib/quiz";
import type { QuizResult } from "@/lib/quiz/types";

interface QuizButtonProps {
  lessonId: string;
  lessonNumber: number;
  lessonStatus: "available" | "locked";
  previousResult?: QuizResult;
  onResultSave: (result: QuizResult) => void;
}

export function QuizButton({
  lessonId,
  lessonNumber,
  lessonStatus,
  previousResult,
  onResultSave,
}: QuizButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const quiz = quizzes[lessonId];

  if (!quiz) return null;

  const isLocked = lessonStatus === "locked";
  const hasPreviousResult = previousResult !== undefined;

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => !isLocked && setIsOpen(true)}
        disabled={isLocked}
        className={cn(
          "gap-2",
          hasPreviousResult && previousResult?.passed
            ? "border-nexa-500/30 text-nexa-400 hover:bg-nexa-500/10"
            : hasPreviousResult
              ? "border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              : "border-surface-200 text-surface-400 hover:bg-surface-100"
        )}
      >
        {isLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : hasPreviousResult && previousResult?.passed ? (
          <Trophy className="h-3.5 w-3.5" />
        ) : hasPreviousResult ? (
          <RotateCcw className="h-3.5 w-3.5" />
        ) : (
          <ClipboardCheck className="h-3.5 w-3.5" />
        )}
        {isLocked ? (
          <span>Quiz</span>
        ) : hasPreviousResult ? (
          <span className="flex items-center gap-1.5">
            Quiz
            <Badge
              variant={previousResult?.passed ? "success" : "warning"}
              className="text-[10px] px-1.5 py-0"
            >
              {previousResult?.score}%
            </Badge>
          </span>
        ) : (
          <span>Iniciar Quiz</span>
        )}
      </Button>

      <QuizModal
        quiz={quiz}
        previousResult={previousResult}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={onResultSave}
      />
    </>
  );
}
