export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  lessonId: string;
  title: string;
  questions: QuizQuestion[];
  passingScore: number;
}

export interface QuizResult {
  lessonId: string;
  score: number;
  passed: boolean;
  answers: number[];
  completedAt: string;
}
