export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
  explanation: string;
};

export type StudyUnit = {
  unitNumber: number;
  unitTitle: string;
  summary: string[];
  highWeightageTopics: string[];
  mcqs: QuizQuestion[];
};

export type StudyReport = {
  courseTitle: string;
  overview: string;
  units: StudyUnit[];
};

export type StoredUserReport = {
  id: string;
  uid: string;
  fileName: string;
  createdAt: string | null;
  sourceExcerpt: string;
  sourceLength: number;
  hasSourceText: boolean;
  report: StudyReport;
};
