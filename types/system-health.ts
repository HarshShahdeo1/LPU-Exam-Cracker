export type AnalysisStatus = "success" | "failure";

export type AnalysisFailureStage =
  | "validation"
  | "pdf_parse"
  | "llm"
  | "firestore"
  | "response";

export type AnalysisEvent = {
  id: string;
  uid: string;
  fileName: string;
  status: AnalysisStatus;
  aiProvider: string;
  aiModel: string;
  providerLatencyMs: number;
  firebaseWriteMs: number;
  totalDurationMs: number;
  sourceLength: number;
  reportId: string | null;
  failureStage: AnalysisFailureStage | null;
  errorMessage: string | null;
  createdAt: string | null;
};

export type HealthChartPoint = {
  label: string;
  successCount: number;
  failureCount: number;
  totalCount: number;
};

export type SystemHealthSnapshot = {
  aiProvider: string;
  aiModel: string;
  totalTrackedEvents: number;
  successfulAnalyses: number;
  failedUploads: number;
  successRate: number;
  averageProviderLatencyMs: number | null;
  p95ProviderLatencyMs: number | null;
  averageFirebaseWriteMs: number | null;
  p95FirebaseWriteMs: number | null;
  averageTotalDurationMs: number | null;
  recentEvents: AnalysisEvent[];
  latestSuccess: AnalysisEvent | null;
  latestFailure: AnalysisEvent | null;
  chartPoints: HealthChartPoint[];
};
