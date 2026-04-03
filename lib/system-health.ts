import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAIProviderName, getOpenAIModel } from "@/lib/openai";
import {
  AnalysisEvent,
  AnalysisFailureStage,
  AnalysisStatus,
  HealthChartPoint,
  SystemHealthSnapshot
} from "@/types/system-health";

const ANALYSIS_EVENTS_COLLECTION = "analysisEvents";
const DASHBOARD_SAMPLE_SIZE = 60;
const CHART_DAY_COUNT = 7;

type RecordAnalysisEventInput = {
  uid: string;
  fileName?: string;
  status: AnalysisStatus;
  aiProvider?: string;
  aiModel?: string;
  providerLatencyMs?: number;
  firebaseWriteMs?: number;
  totalDurationMs?: number;
  sourceLength?: number;
  reportId?: string;
  failureStage?: AnalysisFailureStage;
  errorMessage?: string;
};

function isAnalysisFailureStage(value: unknown): value is AnalysisFailureStage {
  return (
    value === "validation" ||
    value === "pdf_parse" ||
    value === "llm" ||
    value === "firestore" ||
    value === "response"
  );
}

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return null;
}

function mapAnalysisEvent(id: string, value: FirebaseFirestore.DocumentData): AnalysisEvent {
  return {
    id,
    uid: value.uid ?? "",
    fileName: value.fileName ?? "Untitled syllabus",
    status: value.status === "failure" ? "failure" : "success",
    aiProvider: value.aiProvider ?? getAIProviderName(),
    aiModel: value.aiModel ?? getOpenAIModel(),
    providerLatencyMs: typeof value.providerLatencyMs === "number" ? value.providerLatencyMs : 0,
    firebaseWriteMs: typeof value.firebaseWriteMs === "number" ? value.firebaseWriteMs : 0,
    totalDurationMs: typeof value.totalDurationMs === "number" ? value.totalDurationMs : 0,
    sourceLength: typeof value.sourceLength === "number" ? value.sourceLength : 0,
    reportId: typeof value.reportId === "string" ? value.reportId : null,
    failureStage: isAnalysisFailureStage(value.failureStage) ? value.failureStage : null,
    errorMessage: typeof value.errorMessage === "string" ? value.errorMessage : null,
    createdAt: serializeTimestamp(value.createdAt)
  };
}

function average(values: number[]) {
  if (!values.length) {
    return null;
  }

  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentile(values: number[], percentileValue: number) {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );

  return sorted[index];
}

function getEventTime(event: AnalysisEvent) {
  return event.createdAt ? new Date(event.createdAt).getTime() : 0;
}

function buildChartPoints(events: AnalysisEvent[]) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    weekday: "short"
  });
  const buckets = new Map<string, HealthChartPoint>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let index = CHART_DAY_COUNT - 1; index >= 0; index -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - index);
    const key = day.toISOString().slice(0, 10);

    buckets.set(key, {
      label: formatter.format(day),
      successCount: 0,
      failureCount: 0,
      totalCount: 0
    });
  }

  for (const event of events) {
    if (!event.createdAt) {
      continue;
    }

    const key = event.createdAt.slice(0, 10);
    const bucket = buckets.get(key);

    if (!bucket) {
      continue;
    }

    bucket.totalCount += 1;

    if (event.status === "success") {
      bucket.successCount += 1;
    } else {
      bucket.failureCount += 1;
    }
  }

  return Array.from(buckets.values());
}

export async function recordAnalysisEvent(input: RecordAnalysisEventInput) {
  await getAdminDb().collection(ANALYSIS_EVENTS_COLLECTION).add({
    uid: input.uid,
    fileName: input.fileName ?? "Untitled syllabus",
    status: input.status,
    aiProvider: input.aiProvider ?? getAIProviderName(),
    aiModel: input.aiModel ?? getOpenAIModel(),
    providerLatencyMs: input.providerLatencyMs ?? 0,
    firebaseWriteMs: input.firebaseWriteMs ?? 0,
    totalDurationMs: input.totalDurationMs ?? 0,
    sourceLength: input.sourceLength ?? 0,
    reportId: input.reportId ?? null,
    failureStage: input.failureStage ?? null,
    errorMessage: input.errorMessage ?? null,
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function safeRecordAnalysisEvent(input: RecordAnalysisEventInput) {
  try {
    await recordAnalysisEvent(input);
  } catch (error) {
    console.error("Failed to record system health event", error);
  }
}

export async function getSystemHealthSnapshot(): Promise<SystemHealthSnapshot> {
  const snapshot = await getAdminDb()
    .collection(ANALYSIS_EVENTS_COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(DASHBOARD_SAMPLE_SIZE)
    .get();

  const recentEvents = snapshot.docs.map((doc) => mapAnalysisEvent(doc.id, doc.data()));
  const successfulEvents = recentEvents.filter((event) => event.status === "success");
  const failedEvents = recentEvents.filter((event) => event.status === "failure");
  const providerLatencies = successfulEvents
    .map((event) => event.providerLatencyMs)
    .filter((value) => value > 0);
  const firebaseLatencies = successfulEvents
    .map((event) => event.firebaseWriteMs)
    .filter((value) => value > 0);
  const totalDurations = recentEvents
    .map((event) => event.totalDurationMs)
    .filter((value) => value > 0);

  return {
    aiProvider: recentEvents[0]?.aiProvider ?? getAIProviderName(),
    aiModel: recentEvents[0]?.aiModel ?? getOpenAIModel(),
    totalTrackedEvents: recentEvents.length,
    successfulAnalyses: successfulEvents.length,
    failedUploads: failedEvents.length,
    successRate: recentEvents.length
      ? Math.round((successfulEvents.length / recentEvents.length) * 100)
      : 0,
    averageProviderLatencyMs: average(providerLatencies),
    p95ProviderLatencyMs: percentile(providerLatencies, 95),
    averageFirebaseWriteMs: average(firebaseLatencies),
    p95FirebaseWriteMs: percentile(firebaseLatencies, 95),
    averageTotalDurationMs: average(totalDurations),
    recentEvents,
    latestSuccess: successfulEvents[0] ?? null,
    latestFailure: failedEvents[0] ?? null,
    chartPoints: buildChartPoints(
      [...recentEvents].sort((left, right) => getEventTime(left) - getEventTime(right))
    )
  };
}

export type { AnalysisFailureStage };
