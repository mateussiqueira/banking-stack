export interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
  quizScore?: number;
}

export interface ModuleProgress {
  moduleId: string;
  lessons: LessonProgress[];
  completedCount: number;
  totalCount: number;
}

export interface StudentProgress {
  modules: ModuleProgress[];
  totalLessons: number;
  completedLessons: number;
  streak: number;
  lastAccessedAt: string;
}
