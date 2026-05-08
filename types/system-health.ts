export type AnalysisEvent = {
  id: string;
  status: "success" | "failure";
  fileName: string;
  aiProvider: string;
  aiModel: string;
  providerLatencyMs: number | null;
  firebaseWriteMs: number | null;
  totalDurationMs: number | null;
  sourceLength: number;
  reportId: string | null;
  failureStage: string | null;
  errorMessage: string | null;
  createdAt: string | null;
};

export type ChartPoint = {
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
  latestFailure: AnalysisEvent | null;
  recentEvents: AnalysisEvent[];
  chartPoints: ChartPoint[];
};
