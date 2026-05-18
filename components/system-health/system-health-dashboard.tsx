import Link from "next/link";

import { formatReportDate } from "@/lib/utils";
import { AnalysisEvent, SystemHealthSnapshot } from "@/types/system-health";

type SystemHealthDashboardProps = {
  snapshot: SystemHealthSnapshot;
  userEmail: string | null;
};

function formatMilliseconds(value: number | null) {
  if (value === null) return "No data";
  return `${value.toLocaleString("en-IN")} ms`;
}

function formatPercent(value: number) {
  return `${value.toFixed(0)}%`;
}

function StatusBadge({ status }: { status: string }) {
  const isSuccess = status === "success";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
        isSuccess
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isSuccess ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {status}
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  accent
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "green" | "red" | "blue" | "default";
}) {
  const accentMap = {
    green: "border-l-4 border-l-emerald-400",
    red: "border-l-4 border-l-red-400",
    blue: "border-l-4 border-l-[#3d90ec]",
    default: ""
  };

  return (
    <div
      className={`play-card rounded-[24px] p-5 ${accentMap[accent ?? "default"]}`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-[#718093]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[#172233]">{value}</p>
      <p className="mt-1.5 text-sm text-[#5b6678]">{detail}</p>
    </div>
  );
}

export function SystemHealthDashboard({
  snapshot,
  userEmail
}: SystemHealthDashboardProps) {
  const chartPeak =
    Math.max(...snapshot.chartPoints.map((p) => p.totalCount), 1) || 1;

  const displayName = userEmail?.split("@")[0] ?? "Admin";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#f9fafb]">
      <div className="mx-auto flex max-w-[1500px]">
        {/* ── Sidebar ── */}
        <aside className="hidden sticky top-0 h-screen w-[300px] shrink-0 overflow-y-auto scrollbar-thin border-r border-[#e8ebf2] bg-white px-6 py-8 xl:flex xl:flex-col">
          {/* User card */}
          <div className="flex items-center gap-4 rounded-[24px] border border-[#edf0f6] bg-white p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff] text-2xl font-semibold text-[#233142]">
              {userInitial}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <p className="truncate text-lg font-semibold text-[#172233]">
                {displayName}
              </p>
              <p className="text-xs text-[#718093]">Admin</p>
            </div>
          </div>

          {/* Status pill */}
          <div className="mt-6 flex items-center gap-2 rounded-full border border-[#d6dce7] bg-white px-4 py-2.5 text-sm text-[#344255]">
            <span className="h-2 w-2 rounded-full bg-[#2fd400] shadow-[0_0_6px_rgba(47,212,0,0.6)]" />
            System operational
          </div>

          {/* Nav links */}
          <div className="mt-8 space-y-2">
            <Link href="/system-health" className="sidebar-link sidebar-link-active">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#3d90ec]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 12h4l3-8 4 16 3-8h4" />
              </svg>
              <span className="text-base font-medium">System Health</span>
            </Link>
            <Link href="/upload" className="sidebar-link">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#8190a6]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 11.5L12 4l9 7.5" />
                <path d="M6.5 10v9h11v-9" />
              </svg>
              <span className="text-base font-medium">Upload Dashboard</span>
            </Link>
            <Link href="/results" className="sidebar-link">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#8190a6]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 5h12" />
                <path d="M6 10h12" />
                <path d="M6 15h9" />
                <path d="M6 19h7" />
              </svg>
              <span className="text-base font-medium">Latest Report</span>
            </Link>
          </div>

          <div className="mt-auto" />

          {/* Provider info */}
          <div className="rounded-[20px] border border-[#edf0f6] bg-[#f8fafc] p-4 space-y-2 text-xs text-[#718093]">
            <p><span className="font-medium text-[#344255]">Provider:</span> {snapshot.aiProvider}</p>
            <p><span className="font-medium text-[#344255]">Model:</span> {snapshot.aiModel}</p>
            <p><span className="font-medium text-[#344255]">Samples:</span> {snapshot.totalTrackedEvents}</p>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          {/* Sticky nav */}
          <header className="play-nav sticky top-4 z-20 flex items-center justify-between rounded-[24px] px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22000f] text-base font-semibold text-white">
                L
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#172233]">LPU Exam Cracker</p>
                <span className="h-2.5 w-2.5 rounded-full bg-[#2fd400]" />
              </div>
            </div>
            <Link
              href="/upload"
              className="rounded-full border border-[#d6dce7] bg-white px-5 py-2.5 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5"
            >
              ← Dashboard
            </Link>
          </header>

          {/* Page heading */}
          <section className="mt-6 rounded-[32px] border border-[#e8ebf2] bg-white px-6 py-7 sm:px-8">
            <p className="text-lg font-semibold text-[#1f2a3b]">
              Admin view
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[#172233] md:text-4xl">
              System Health & Observability
            </h1>
            <p className="mt-3 text-base text-[#5b6678] max-w-2xl">
              Real-time AI inference latency, Firestore write performance, and upload reliability across the analysis pipeline.
            </p>
          </section>

          {/* Metric cards */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              accent="green"
              label="Successful Analyses"
              value={snapshot.successfulAnalyses.toString()}
              detail={`${formatPercent(snapshot.successRate)} success rate`}
            />
            <MetricCard
              accent="red"
              label="Failed Uploads"
              value={snapshot.failedUploads.toString()}
              detail={
                snapshot.latestFailure?.failureStage
                  ? `Latest: ${snapshot.latestFailure.failureStage}`
                  : "No active failures"
              }
            />
            <MetricCard
              accent="blue"
              label={`${snapshot.aiProvider} Avg`}
              value={formatMilliseconds(snapshot.averageProviderLatencyMs)}
              detail={`p95 ${formatMilliseconds(snapshot.p95ProviderLatencyMs)}`}
            />
            <MetricCard
              accent="default"
              label="Firebase Avg"
              value={formatMilliseconds(snapshot.averageFirebaseWriteMs)}
              detail={`p95 ${formatMilliseconds(snapshot.p95FirebaseWriteMs)}`}
            />
          </section>

          {/* Chart + Latency radar */}
          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            {/* Bar chart */}
            <div className="play-card rounded-[32px] p-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">
                    Error Rate Monitor
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#172233]">
                    Successes vs. Failures
                  </h2>
                </div>
                <div className="rounded-2xl border border-[#e8ebf2] bg-[#f8fafc] px-4 py-2 text-sm text-[#5b6678]">
                  Avg end-to-end:{" "}
                  {formatMilliseconds(snapshot.averageTotalDurationMs)}
                </div>
              </div>

              {/* Legend */}
              <div className="mt-5 flex items-center gap-5 text-xs uppercase tracking-[0.2em] text-[#718093]">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Success
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  Failure
                </span>
              </div>

              {/* Bars */}
              <div className="mt-6 grid grid-cols-7 gap-2">
                {snapshot.chartPoints.map((point) => {
                  const successH = Math.max(
                    (point.successCount / chartPeak) * 160,
                    point.successCount ? 14 : 3
                  );
                  const failureH = Math.max(
                    (point.failureCount / chartPeak) * 160,
                    point.failureCount ? 14 : 3
                  );

                  return (
                    <div
                      key={point.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex h-[190px] w-full items-end justify-center gap-1.5 rounded-[20px] border border-[#e8ebf2] bg-[#f8fafc] px-2 py-3">
                        <div
                          className="w-4 rounded-full bg-emerald-400 shadow-[0_2px_8px_rgba(52,211,153,0.3)] transition-all"
                          style={{ height: `${successH}px` }}
                          title={`${point.successCount} successful`}
                        />
                        <div
                          className="w-4 rounded-full bg-red-400 shadow-[0_2px_8px_rgba(248,113,113,0.3)] transition-all"
                          style={{ height: `${failureH}px` }}
                          title={`${point.failureCount} failed`}
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-[#344255]">
                          {point.label}
                        </p>
                        <p className="text-[10px] text-[#718093]">
                          {point.totalCount}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Latency + Quick links */}
            <div className="space-y-6">
              <div className="play-card rounded-[32px] p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">
                  Latency Radar
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: `${snapshot.aiProvider} response`,
                      avg: snapshot.averageProviderLatencyMs,
                      p95: snapshot.p95ProviderLatencyMs,
                      color: "bg-[#3d90ec]"
                    },
                    {
                      label: "Firebase write",
                      avg: snapshot.averageFirebaseWriteMs,
                      p95: snapshot.p95FirebaseWriteMs,
                      color: "bg-[#dfff57]"
                    }
                  ].map((item) => {
                    const maxMs = 5000;
                    const pct = item.avg
                      ? Math.min((item.avg / maxMs) * 100, 100)
                      : 0;

                    return (
                      <div
                        key={item.label}
                        className="rounded-[20px] border border-[#e8ebf2] bg-[#f8fafc] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[#172233]">
                            {item.label}
                          </p>
                          <p className="text-xs text-[#718093]">
                            p95 {formatMilliseconds(item.p95)}
                          </p>
                        </div>
                        <p className="mt-2 text-xl font-semibold text-[#172233]">
                          {formatMilliseconds(item.avg)}
                        </p>
                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 w-full rounded-full bg-[#e8ebf2]">
                          <div
                            className={`h-1.5 rounded-full ${item.color} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="play-card rounded-[32px] p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">
                  Quick Links
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/upload"
                    className="rounded-full border border-[#d4dae6] bg-white px-5 py-3 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5"
                  >
                    Upload dashboard
                  </Link>
                  <Link
                    href="/results"
                    className="rounded-full bg-[#22000f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    Latest report
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Recent events */}
          <section className="mt-6 play-card rounded-[32px] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">
                  Recent Events
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#172233]">
                  Latest analysis outcomes and incidents
                </h2>
              </div>
              {snapshot.latestFailure && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  Latest failure:{" "}
                  {snapshot.latestFailure.failureStage ?? "response"}
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3">
              {snapshot.recentEvents.length ? (
                snapshot.recentEvents.map((event: AnalysisEvent) => (
                  <div
                    key={event.id}
                    className="grid gap-4 rounded-[24px] border border-[#e8ebf2] bg-[#f8fafc] p-5 lg:grid-cols-[0.8fr,1.2fr,0.9fr,0.8fr]"
                  >
                    <div>
                      <StatusBadge status={event.status} />
                      <p className="mt-3 text-xs text-[#718093]">
                        {formatReportDate(event.createdAt)}
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-[#172233] truncate">
                        {event.fileName}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-sm text-[#5b6678]">
                      <p>
                        <span className="font-medium text-[#344255]">
                          Stage:{" "}
                        </span>
                        {event.failureStage ?? "completed"}
                      </p>
                      <p>
                        <span className="font-medium text-[#344255]">
                          Error:{" "}
                        </span>
                        {event.errorMessage ?? "No errors captured"}
                      </p>
                    </div>

                    <div className="grid gap-1.5 text-sm text-[#5b6678]">
                      <p>
                        <span className="font-medium text-[#344255]">
                          {event.aiProvider}:{" "}
                        </span>
                        {formatMilliseconds(event.providerLatencyMs)}
                      </p>
                      <p>
                        <span className="font-medium text-[#344255]">
                          Firebase:{" "}
                        </span>
                        {formatMilliseconds(event.firebaseWriteMs)}
                      </p>
                      <p>
                        <span className="font-medium text-[#344255]">
                          Total:{" "}
                        </span>
                        {formatMilliseconds(event.totalDurationMs)}
                      </p>
                    </div>

                    <div className="grid gap-1.5 text-sm text-[#5b6678]">
                      <p>
                        <span className="font-medium text-[#344255]">
                          Source chars:{" "}
                        </span>
                        {event.sourceLength.toLocaleString("en-IN")}
                      </p>
                      <p>
                        <span className="font-medium text-[#344255]">
                          Report ID:{" "}
                        </span>
                        <span className="truncate text-xs">
                          {event.reportId ?? "Not created"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-[#e8ebf2] bg-[#f8fafc] p-6 text-sm text-[#718093]">
                  No telemetry yet. Run a few syllabus uploads and this dashboard
                  will start surfacing pipeline latency, failure rate, and recent
                  incidents.
                </div>
              )}
            </div>
          </section>

          <footer className="pb-5 pt-8 text-center text-xs text-[#99a3b5]">
            Provider: {snapshot.aiProvider} · Model: {snapshot.aiModel} ·
            Samples: {snapshot.totalTrackedEvents} · Storage: Firestore
          </footer>
        </div>
      </div>
    </main>
  );
}
