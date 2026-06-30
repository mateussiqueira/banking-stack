export * from "./types";

import quiz01 from "./quizzes/01-introducao-go.json";
import quiz02 from "./quizzes/02-goroutines.json";
import quiz03 from "./quizzes/03-channels.json";
import quiz04 from "./quizzes/04-pacote-sync.json";
import quiz05 from "./quizzes/05-context.json";
import quiz06 from "./quizzes/06-grpc.json";
import type { Quiz } from "./types";

const quizMap: Record<string, Quiz> = {
  "01-introducao-go": quiz01 as Quiz,
  "02-goroutines": quiz02 as Quiz,
  "03-channels": quiz03 as Quiz,
  "04-pacote-sync": quiz04 as Quiz,
  "05-context": quiz05 as Quiz,
  "06-grpc": quiz06 as Quiz,
};

export const quizzes = quizMap;

export function getQuiz(lessonId: string): Quiz | null {
  return quizMap[lessonId] || null;
}
