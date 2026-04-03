import Link from "next/link";

import { GlassPanel } from "@/components/ui/glass-panel";
import { formatReportDate } from "@/lib/utils";
import { AnalysisEvent, SystemHealthSnapshot } from "@/types/system-health";

type SystemHealthDashboardProps = {
  snapshot: SystemHealthSnapshot;
  userEmail: string | null;
};

function formatMilliseconds(value: number | null) {
  if (value === null) {
    return "No data";
  }

  return `${value.toLocaleString("en-IN")} ms`;
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function getEventTone(event: AnalysisEvent) {
  if (event.status === "success") {
    return "border-emerald-400/20 bg-emerald-500/10 text-emerald-100";
  }

  return "border-[#E14C3C]/20 bg-[#A50000]/10 text-[#FFD8D3]";
}

export function SystemHealthDashboard({
  snapshot,
  userEmail
}: SystemHealthDashboardProps) {
  const chartPeak =
    Math.max(...snapshot.chartPoints.map((point) => point.totalCount), 1) || 1;
  const metricCards = [
    {
      label: "Successful Analyses",
      value: snapshot.successfulAnalyses.toString(),
      detail: `${formatPercent(snapshot.successRate)} success rate`
    },
    {
      label: "Failed Uploads",
      value: snapshot.failedUploads.toString(),
      detail: snapshot.latestFailure?.failureStage
        ? `Latest stage: ${snapshot.latestFailure.failureStage}`
        : "No active upload failures"
    },
    {
      label: `${snapshot.aiProvider} Avg`,
      value: formatMilliseconds(snapshot.averageProviderLatencyMs),
      detail: `p95 ${formatMilliseconds(snapshot.p95ProviderLatencyMs)}`
    },
    {
      label: "Firebase Avg",
      value: formatMilliseconds(snapshot.averageFirebaseWriteMs),
      detail: `p95 ${formatMilliseconds(snapshot.p95FirebaseWriteMs)}`
    }
  ];

  return (
    <main className="hero-noise relative min-h-screen overflow-hidden px-6 py-8">
      <div className="spotlight left-[-10rem] top-[-4rem] h-80 w-80 bg-[#7c1116]/26" />
      <div className="spotlight right-[-8rem] top-24 h-80 w-80 bg-[#ef4335]/14" />
      <div className="absolute inset-0 bg-grid opacity-15" />
      <div className="absolute inset-0 bg-grid-fine opacity-10" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="grid gap-6 rounded-[34px] border border-white/10 bg-white/[0.03] px-6 py-6 xl:grid-cols-[1.15fr,0.85fr] xl:items-end">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.26em] text-white/45">System Health</p>
            <div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                Grafana-style operational snapshot
              </h1>
              <p className="mt-2 max-w-3xl text-white/65">
                Hidden observability view for AI inference, Firestore persistence, and upload
                reliability across the analysis pipeline.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-white/55">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Provider: {snapshot.aiProvider}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Model: {snapshot.aiModel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Samples: {snapshot.totalTrackedEvents}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {userEmail ?? "Authenticated admin"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
            {metricCards.map((card) => (
              <GlassPanel key={card.label} className="p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
                <p className="mt-2 text-sm text-white/55">{card.detail}</p>
              </GlassPanel>
            ))}
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
          <GlassPanel className="overflow-hidden p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                  Error Rate Monitor
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Successful analyses vs failed uploads
                </h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                Avg end-to-end: {formatMilliseconds(snapshot.averageTotalDurationMs)}
              </div>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center gap-5 text-xs uppercase tracking-[0.2em] text-white/40">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Success
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ef4335]" />
                  Failure
                </span>
              </div>

              <div className="mt-8 grid grid-cols-7 gap-3">
                {snapshot.chartPoints.map((point) => {
                  const successHeight = Math.max((point.successCount / chartPeak) * 180, point.successCount ? 16 : 4);
                  const failureHeight = Math.max((point.failureCount / chartPeak) * 180, point.failureCount ? 16 : 4);

                  return (
                    <div key={point.label} className="flex flex-col items-center gap-3">
                      <div className="flex h-[220px] w-full items-end justify-center gap-2 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.18))] px-2 py-3">
                        <div
                          className="w-4 rounded-full bg-emerald-400/90 shadow-[0_0_24px_rgba(52,211,153,0.3)]"
                          style={{ height: `${successHeight}px` }}
                          title={`${point.successCount} successful analyses`}
                        />
                        <div
                          className="w-4 rounded-full bg-[#ef4335]/90 shadow-[0_0_24px_rgba(239,67,53,0.26)]"
                          style={{ height: `${failureHeight}px` }}
                          title={`${point.failureCount} failed uploads`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-white">{point.label}</p>
                        <p className="text-xs text-white/45">{point.totalCount} events</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>

          <div className="space-y-6">
            <GlassPanel className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">Latency Radar</p>
              <div className="mt-4 space-y-4">
                {[
                  {
                    label: `${snapshot.aiProvider} response`,
                    average: snapshot.averageProviderLatencyMs,
                    p95: snapshot.p95ProviderLatencyMs
                  },
                  {
                    label: "Firebase write",
                    average: snapshot.averageFirebaseWriteMs,
                    p95: snapshot.p95FirebaseWriteMs
                  }
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[24px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{item.label}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                        p95 {formatMilliseconds(item.p95)}
                      </p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-white">
                      {formatMilliseconds(item.average)}
                    </p>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">Quick Links</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/upload"
                  className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Open upload dashboard
                </Link>
                <Link
                  href="/results"
                  className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Review latest report
                </Link>
              </div>
            </GlassPanel>
          </div>
        </section>

        <GlassPanel className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/45">Recent Events</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Latest analysis outcomes and incidents
              </h2>
            </div>
            {snapshot.latestFailure && (
              <div className="rounded-2xl border border-[#E14C3C]/20 bg-[#A50000]/10 px-4 py-3 text-sm text-[#FFD8D3]">
                Latest failure: {snapshot.latestFailure.failureStage ?? "response"}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4">
            {snapshot.recentEvents.length ? (
              snapshot.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="grid gap-4 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.18))] p-5 lg:grid-cols-[0.8fr,1.2fr,0.9fr,0.8fr]"
                >
                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${getEventTone(event)}`}
                    >
                      {event.status}
                    </span>
                    <p className="mt-4 text-sm text-white/45">{formatReportDate(event.createdAt)}</p>
                    <p className="mt-2 text-base font-medium text-white">{event.fileName}</p>
                  </div>

                  <div className="space-y-2 text-sm text-white/68">
                    <p>
                      <span className="text-white/40">Stage:</span>{" "}
                      {event.failureStage ?? "completed"}
                    </p>
                    <p>
                      <span className="text-white/40">Error:</span>{" "}
                      {event.errorMessage ?? "No errors captured"}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-white/68">
                    <p>
                      <span className="text-white/40">{event.aiProvider}:</span>{" "}
                      {formatMilliseconds(event.providerLatencyMs)}
                    </p>
                    <p>
                      <span className="text-white/40">Firebase:</span>{" "}
                      {formatMilliseconds(event.firebaseWriteMs)}
                    </p>
                    <p>
                      <span className="text-white/40">Total:</span>{" "}
                      {formatMilliseconds(event.totalDurationMs)}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-white/68">
                    <p>
                      <span className="text-white/40">Source chars:</span>{" "}
                      {event.sourceLength.toLocaleString("en-IN")}
                    </p>
                    <p>
                      <span className="text-white/40">Report ID:</span>{" "}
                      {event.reportId ?? "Not created"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[26px] border border-white/10 bg-black/20 p-6 text-white/65">
                No telemetry yet. Run a few syllabus uploads and this hidden dashboard will start
                surfacing pipeline latency, failure rate, and recent incidents.
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </main>
  );
}
