"use client";

import { LessonProgress, StudentProgress } from "./types";

const STORAGE_KEY = "banking-stack-pro-progress";

export function getLessonProgress(moduleId: string, lessonId: string): LessonProgress | null {
  const progress = getProgress();
  const mod = progress.modules.find(m => m.moduleId === moduleId);
  if (!mod) return null;
  return mod.lessons.find(l => l.lessonId === lessonId) || null;
}

export function getProgress(): StudentProgress {
  if (typeof window === "undefined") {
    return createDefaultProgress();
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return createDefaultProgress();
  }

  return JSON.parse(stored);
}

export function saveLessonProgress(
  moduleId: string,
  lessonId: string,
  quizScore?: number
): StudentProgress {
  const progress = getProgress();

  const moduleIndex = progress.modules.findIndex(
    (m) => m.moduleId === moduleId
  );
  if (moduleIndex === -1) return progress;

  const lessonIndex = progress.modules[moduleIndex].lessons.findIndex(
    (l) => l.lessonId === lessonId
  );
  if (lessonIndex === -1) return progress;

  progress.modules[moduleIndex].lessons[lessonIndex] = {
    lessonId,
    completed: true,
    completedAt: new Date().toISOString(),
    quizScore,
  };

  progress.modules[moduleIndex].completedCount = progress.modules[
    moduleIndex
  ].lessons.filter((l) => l.completed).length;

  progress.completedLessons = progress.modules.reduce(
    (acc, m) => acc + m.completedCount,
    0
  );

  progress.lastAccessedAt = new Date().toISOString();

  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function getModuleProgress(
  moduleId: string
): { completed: number; total: number; percentage: number } {
  const progress = getProgress();
  const module = progress.modules.find((m) => m.moduleId === moduleId);

  if (!module) {
    return { completed: 0, total: 0, percentage: 0 };
  }

  return {
    completed: module.completedCount,
    total: module.totalCount,
    percentage:
      module.totalCount > 0
        ? Math.round((module.completedCount / module.totalCount) * 100)
        : 0,
  };
}

export function getOverallProgress(): {
  completed: number;
  total: number;
  percentage: number;
} {
  const progress = getProgress();
  return {
    completed: progress.completedLessons,
    total: progress.totalLessons,
    percentage:
      progress.totalLessons > 0
        ? Math.round(
            (progress.completedLessons / progress.totalLessons) * 100
          )
        : 0,
  };
}

function createDefaultProgress(): StudentProgress {
  return {
    modules: [
      {
        moduleId: "go",
        lessons: Array.from({ length: 10 }, (_, i) => ({
          lessonId: `lesson-${i + 1}`,
          completed: false,
        })),
        completedCount: 0,
        totalCount: 10,
      },
      {
        moduleId: "rust",
        lessons: Array.from({ length: 11 }, (_, i) => ({
          lessonId: `lesson-${i + 11}`,
          completed: false,
        })),
        completedCount: 0,
        totalCount: 11,
      },
      {
        moduleId: "distributed",
        lessons: Array.from({ length: 9 }, (_, i) => ({
          lessonId: `lesson-${i + 22}`,
          completed: false,
        })),
        completedCount: 0,
        totalCount: 9,
      },
    ],
    totalLessons: 30,
    completedLessons: 0,
    streak: 0,
    lastAccessedAt: new Date().toISOString(),
  };
}
