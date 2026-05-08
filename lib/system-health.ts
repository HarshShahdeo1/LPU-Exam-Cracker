import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { AnalysisEvent, ChartPoint, SystemHealthSnapshot } from "@/types/system-health";

const AI_PROVIDER = "Groq";
const AI_MODEL = process.env.OPENAI_MODEL ?? "llama-3.3-70b-versatile";

export type AnalysisFailureStage = "validation" | "pdf_parse" | "llm" | "firestore";

export async function safeRecordAnalysisEvent(params: {
  uid: string;
  fileName: string;
  status: "success" | "failure";
  aiProvider: string;
  aiModel: string;
  providerLatencyMs: number | null;
  firebaseWriteMs: number | null;
  totalDurationMs: number | null;
  sourceLength: number;
  reportId?: string | null;
  failureStage?: AnalysisFailureStage | string | null;
  errorMessage?: string | null;
}) {
  try {
    const db = getAdminDb();
    await db.collection("analysisEvents").add({
      ...params,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to record analysis event:", error);
  }
}

function toMs(value: unknown): number | null {
  return typeof value === "number" && isFinite(value) ? Math.round(value) : null;
}

function toIso(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value && typeof value === "object" && "toDate" in value && typeof (value as Timestamp).toDate === "function") {
    return (value as Timestamp).toDate().toISOString();
  }
  return null;
}

function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

function mapEvent(id: string, d: FirebaseFirestore.DocumentData): AnalysisEvent {
  return {
    id,
    status: d.status === "failure" ? "failure" : "success",
    fileName: typeof d.fileName === "string" ? d.fileName : "unknown",
    aiProvider: typeof d.aiProvider === "string" ? d.aiProvider : AI_PROVIDER,
    aiModel: typeof d.aiModel === "string" ? d.aiModel : AI_MODEL,
    providerLatencyMs: toMs(d.providerLatencyMs),
    firebaseWriteMs: toMs(d.firebaseWriteMs),
    totalDurationMs: toMs(d.totalDurationMs),
    sourceLength: typeof d.sourceLength === "number" ? d.sourceLength : 0,
    reportId: typeof d.reportId === "string" ? d.reportId : null,
    failureStage: typeof d.failureStage === "string" ? d.failureStage : null,
    errorMessage: typeof d.errorMessage === "string" ? d.errorMessage : null,
    createdAt: toIso(d.createdAt),
  };
}

function buildChartPoints(events: AnalysisEvent[]): ChartPoint[] {
  // Group by day label (last 7 days)
  const days: Record<string, { success: number; failure: number }> = {};
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    days[label] = { success: 0, failure: 0 };
  }

  for (const event of events) {
    if (!event.createdAt) continue;
    const d = new Date(event.createdAt);
    const label = d.toLocaleDateString("en-IN", { weekday: "short" });
    if (label in days) {
      if (event.status === "success") days[label].success++;
      else days[label].failure++;
    }
  }

  return Object.entries(days).map(([label, counts]) => ({
    label,
    successCount: counts.success,
    failureCount: counts.failure,
    totalCount: counts.success + counts.failure,
  }));
}

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  // Try to fetch from analysisEvents collection; fall back to empty if missing
  let events: AnalysisEvent[] = [];

  try {
    const snap = await getAdminDb()
      .collection("analysisEvents")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    events = snap.docs.map((doc) => mapEvent(doc.id, doc.data()));
  } catch {
    // Collection may not exist yet — return empty snapshot
  }

  const successful = events.filter((e) => e.status === "success");
  const failed = events.filter((e) => e.status === "failure");

  const providerLatencies = successful
    .map((e) => e.providerLatencyMs)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const firebaseLatencies = successful
    .map((e) => e.firebaseWriteMs)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const totalDurations = successful
    .map((e) => e.totalDurationMs)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  const total = events.length;
  const successRate = total > 0 ? (successful.length / total) * 100 : 100;

  return {
    aiProvider: AI_PROVIDER,
    aiModel: AI_MODEL,
    totalTrackedEvents: total,
    successfulAnalyses: successful.length,
    failedUploads: failed.length,
    successRate,
    averageProviderLatencyMs: average(providerLatencies),
    p95ProviderLatencyMs: percentile(providerLatencies, 95),
    averageFirebaseWriteMs: average(firebaseLatencies),
    p95FirebaseWriteMs: percentile(firebaseLatencies, 95),
    averageTotalDurationMs: average(totalDurations),
    latestFailure: failed[0] ?? null,
    recentEvents: events.slice(0, 20),
    chartPoints: buildChartPoints(events),
  };
}
