export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  correctAnswerIndex: number;
  explanation: string;
};

export type SubTopic = {
  title: string;
  explanation: string;
};

export type StudyUnit = {
  unitNumber: number;
  unitTitle: string;
  summary: string[];
  highWeightageTopics: string[];
  mcqs: QuizQuestion[];
  // Extended deep-study fields (populated by newer AI responses)
  keyTerms?: Array<{ term: string; definition: string }>;
  formulae?: Array<{ name: string; expression: string; note: string }>;
  subtopics?: SubTopic[];
  examTips?: string[];
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
