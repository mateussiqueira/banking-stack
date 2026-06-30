"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Quiz, QuizQuestion, QuizResult } from "@/lib/quiz/types";

interface QuizModalProps {
  quiz: Quiz;
  previousResult?: QuizResult;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (result: QuizResult) => void;
}

export function QuizModal({
  quiz,
  previousResult,
  isOpen,
  onClose,
  onComplete,
}: QuizModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(quiz.questions.length).fill(null)
  );
  const [showResult, setShowResult] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);

  const currentQuestion = quiz.questions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const allAnswered = answers.every((a) => a !== null);
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0);
      setAnswers(new Array(quiz.questions.length).fill(null));
      setShowResult(false);
      setSubmitted(false);
    }
  }, [isOpen, quiz.questions.length]);

  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    setAnimatingIndex(optionIndex);
    setTimeout(() => setAnimatingIndex(null), 200);
    const newAnswers = [...answers];
    newAnswers[currentIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    const score = answers.reduce((acc, answer, i) => {
      if (answer === quiz.questions[i].correctIndex) return acc + 1;
      return acc;
    }, 0);
    const percentage = Math.round((score / quiz.questions.length) * 100);
    const passed = percentage >= quiz.passingScore;

    const result: QuizResult = {
      lessonId: quiz.lessonId,
      score: percentage,
      passed,
      answers: answers as number[],
      completedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      setShowResult(true);
    }, 500);

    onComplete(result);
  }, [answers, quiz, onComplete]);

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setShowResult(false);
    setSubmitted(false);
  };

  if (!isOpen) return null;

  const score = submitted
    ? answers.reduce((acc, answer, i) => {
        if (answer === quiz.questions[i].correctIndex) return acc + 1;
        return acc;
      }, 0)
    : 0;
  const percentage = submitted ? Math.round((score / quiz.questions.length) * 100) : 0;
  const passed = submitted ? percentage >= quiz.passingScore : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 animate-slide-up">
        <Card className="border-surface-200 bg-surface-50 shadow-nexa-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
            <div>
              <h2 className="text-heading-sm font-semibold text-neutral-50">
                Quiz — {quiz.lessonTitle}
              </h2>
              {!showResult && (
                <p className="mt-1 text-body-sm text-surface-400">
                  Questão {currentIndex + 1} de {quiz.questions.length}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {submitted && !showResult && (
                <Badge variant={passed ? "success" : "destructive"}>
                  {percentage}%
                </Badge>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-neutral-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {!showResult && (
            <div className="h-1 bg-surface-100">
              <div
                className="h-full bg-gradient-to-r from-nexa-500 to-nexa-400 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 min-h-[400px] flex flex-col">
            {showResult ? (
              /* Results Screen */
              <div className="flex flex-col items-center justify-center flex-1 text-center space-y-6">
                <div
                  className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full",
                    passed
                      ? "bg-nexa-500/10 text-nexa-400"
                      : "bg-red-500/10 text-red-400"
                  )}
                >
                  {passed ? (
                    <Trophy className="h-10 w-10" />
                  ) : (
                    <XCircle className="h-10 w-10" />
                  )}
                </div>

                <div>
                  <h3 className="text-heading-lg font-bold text-neutral-50">
                    {passed ? "Parabéns!" : "Continue Estudando"}
                  </h3>
                  <p className="mt-2 text-body-md text-surface-400">
                    {passed
                      ? "Você passou no quiz! Seu conhecimento em Go está sólido."
                      : `Você acertou ${score} de ${quiz.questions.length}. Revise o conteúdo e tente novamente.`}
                  </p>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div
                      className={cn(
                        "text-display-md font-bold",
                        passed ? "text-nexa-400" : "text-red-400"
                      )}
                    >
                      {percentage}%
                    </div>
                    <div className="text-caption text-surface-400">Pontuação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-display-md font-bold text-neutral-50">
                      {score}/{quiz.questions.length}
                    </div>
                    <div className="text-caption text-surface-400">Acertos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-display-md font-bold text-surface-400">
                      {quiz.passingScore}%
                    </div>
                    <div className="text-caption text-surface-400">Mínimo</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleRetry}>
                    <RotateCcw className="h-4 w-4" />
                    Tentar Novamente
                  </Button>
                  <Button onClick={onClose}>Fechar</Button>
                </div>
              </div>
            ) : (
              /* Question Screen */
              <div className="flex flex-col flex-1">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="default">Q{currentIndex + 1}</Badge>
                    {submitted && selectedAnswer !== null && (
                      <Badge
                        variant={
                          selectedAnswer === currentQuestion.correctIndex
                            ? "success"
                            : "destructive"
                        }
                      >
                        {selectedAnswer === currentQuestion.correctIndex
                          ? "Correto"
                          : "Incorreto"}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-body-lg font-medium text-neutral-50">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Options */}
                <div className="space-y-3 flex-1">
                  {currentQuestion.options.map((option, i) => {
                    const isSelected = selectedAnswer === i;
                    const isCorrect = i === currentQuestion.correctIndex;
                    const showCorrect = submitted && isCorrect;
                    const showWrong = submitted && isSelected && !isCorrect;

                    return (
                      <button
                        key={i}
                        onClick={() => handleSelect(i)}
                        disabled={submitted}
                        className={cn(
                          "w-full text-left rounded-xl border p-4 transition-all duration-200",
                          "hover:border-nexa-500/50 hover:bg-nexa-500/5",
                          animatingIndex === i && "scale-[0.98]",
                          showCorrect &&
                            "border-nexa-500/50 bg-nexa-500/10",
                          showWrong &&
                            "border-red-500/50 bg-red-500/10",
                          !submitted &&
                            isSelected &&
                            "border-nexa-500 bg-nexa-500/10",
                          !submitted &&
                            !isSelected &&
                            "border-surface-200 bg-surface-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                              showCorrect &&
                                "border-nexa-500 bg-nexa-500 text-black",
                              showWrong &&
                                "border-red-500 bg-red-500 text-white",
                              !submitted &&
                                isSelected &&
                                "border-nexa-500 bg-nexa-500 text-black",
                              !submitted &&
                                !isSelected &&
                                "border-surface-300 bg-surface-200 text-surface-400"
                            )}
                          >
                            {showCorrect ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : showWrong ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              String.fromCharCode(65 + i)
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-body-sm",
                              showCorrect && "text-nexa-400 font-medium",
                              showWrong && "text-red-400",
                              !submitted && isSelected && "text-neutral-50 font-medium",
                              !submitted && !isSelected && "text-surface-500"
                            )}
                          >
                            {option}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation (after submit) */}
                {submitted && (
                  <div className="mt-4 rounded-xl border border-nexa-500/30 bg-nexa-500/5 p-4 animate-fade-in">
                    <p className="text-body-sm text-nexa-300 font-medium mb-1">
                      Explicação
                    </p>
                    <p className="text-body-sm text-surface-400">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Navigation */}
          {!showResult && (
            <div className="flex items-center justify-between border-t border-surface-200 px-6 py-4">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              {/* Question dots */}
              <div className="flex items-center gap-1.5">
                {quiz.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-200",
                      i === currentIndex
                        ? "w-6 bg-nexa-500"
                        : "w-2 bg-surface-300 hover:bg-surface-400",
                      submitted &&
                        answers[i] === quiz.questions[i].correctIndex &&
                        "bg-nexa-500",
                      submitted &&
                        answers[i] !== quiz.questions[i].correctIndex &&
                        "bg-red-500"
                    )}
                  />
                ))}
              </div>

              {submitted ? (
                <Button onClick={() => setShowResult(true)}>
                  Ver Resultado
                </Button>
              ) : currentIndex === quiz.questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={!allAnswered}>
                  Enviar Respostas
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
