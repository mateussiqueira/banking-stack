"use client";

import { useState } from "react";
import { ClipboardCheck, Trophy, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuizModal } from "./quiz-modal";
import type { Quiz, QuizResult } from "@/lib/quiz/types";

// Quiz imports
import quiz01 from "@/lib/quiz/quizzes/01-introducao-go.json";
import quiz02 from "@/lib/quiz/quizzes/02-goroutines.json";
import quiz03 from "@/lib/quiz/quizzes/03-channels.json";
import quiz04 from "@/lib/quiz/quizzes/04-pacote-sync.json";
import quiz05 from "@/lib/quiz/quizzes/05-context.json";
import quiz06 from "@/lib/quiz/quizzes/06-grpc.json";

const quizMap: Record<string, Quiz> = {
  "01-introducao-go": quiz01 as Quiz,
  "02-goroutines": quiz02 as Quiz,
  "03-channels": quiz03 as Quiz,
  "04-pacote-sync": quiz04 as Quiz,
  "05-context": quiz05 as Quiz,
  "06-grpc": quiz06 as Quiz,
};

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
  const quiz = quizMap[lessonId];

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
