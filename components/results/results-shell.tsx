"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { formatReportDate } from "@/lib/utils";
import { StoredUserReport, StudyUnit } from "@/types/report";
import { SyllabusChat } from "./syllabus-chat";

/* ─── Types ──────────────────────────────────────────────── */
type ResultsShellProps = {
  record: StoredUserReport | null;
  libraryReports: StoredUserReport[];
  userEmail: string | null;
  showSystemHealthLink: boolean;
};

type Tab = "summary" | "deep" | "terms" | "formulae" | "examtips" | "quiz";

type UnitDetail = {
  summary:    string[];
  subtopics:  Array<{ title: string; explanation: string }>;
  keyTerms:   Array<{ term: string; definition: string }>;
  formulae:   Array<{ name: string; expression: string; note: string }>;
  examTips:   string[];
  mcqs:       Array<{ question: string; options: string[]; correctAnswerIndex: number; explanation?: string }>;
};

const TAB_CONFIG: Array<{ id: Tab; label: string; icon: string; always?: boolean }> = [
  { id: "summary",  label: "Summary",    icon: "📋", always: true },
  { id: "deep",     label: "Deep Study", icon: "🔬", always: true },
  { id: "terms",    label: "Key Terms",  icon: "📖" },
  { id: "formulae", label: "Formulae",   icon: "🔢" },
  { id: "examtips", label: "Exam Tips",  icon: "🎯" },
  { id: "quiz",     label: "Quiz",       icon: "✏️", always: true },
];

/* ─── Component ──────────────────────────────────────────── */
export function ResultsShell({
  record,
  libraryReports,
  showSystemHealthLink
}: ResultsShellProps) {
  const [activeUnit, setActiveUnit] = useState(0);
  const [activeTab,  setActiveTab]  = useState<Tab>("summary");
  const [answers,    setAnswers]    = useState<Record<string, number>>({});

  // per-unit deep content (fetched on demand)
  const [unitDetails,  setUnitDetails]  = useState<Record<number, UnitDetail>>({});
  const [loadingUnit,  setLoadingUnit]  = useState<number | null>(null);
  const [detailError,  setDetailError]  = useState<string>("");

  const unit            = record?.report.units[activeUnit];

  // Merge: detail from fetch takes priority, fall back to data baked into the report
  const detail: UnitDetail | null = unitDetails[activeUnit] ?? (
    unit && (unit.summary?.length || unit.subtopics?.length || unit.mcqs?.length)
      ? {
          summary:   unit.summary ?? [],
          subtopics: unit.subtopics ?? [],
          keyTerms:  unit.keyTerms  ?? [],
          formulae:  unit.formulae  ?? [],
          examTips:  unit.examTips  ?? [],
          mcqs:      unit.mcqs      ?? [],
        }
      : null
  );

  const activeQuestions = detail?.mcqs ?? unit?.mcqs ?? [];
  const currentSummary  = detail?.summary ?? unit?.summary ?? [];
  const answeredCount   = activeQuestions.filter((_,i) => answers[`${activeUnit}-${i}`] !== undefined).length;
  const currentScore    = activeQuestions.reduce((score, q, i) => {
    return answers[`${activeUnit}-${i}`] === q.correctAnswerIndex ? score + 1 : score;
  }, 0);

  /* ─── Tab visibility ─────────────────────────────────── */
  function tabVisible(tab: Tab): boolean {
    if (tab === "terms")    return (detail?.keyTerms.length  ?? 0) > 0;
    if (tab === "formulae") return (detail?.formulae.length  ?? 0) > 0;
    if (tab === "examtips") return (detail?.examTips.length  ?? 0) > 0;
    return true;
  }

  /* ─── Unit switch ────────────────────────────────────── */
  function switchUnit(index: number) {
    setActiveUnit(index);
    setActiveTab("summary");
    setAnswers({});
    setDetailError("");
  }

  /* ─── Fetch deep detail on demand ──────────────────── */
  async function fetchUnitDetail(reportId: string, u: StudyUnit) {
    setLoadingUnit(u.unitNumber);
    setDetailError("");
    try {
      const res = await fetch("/api/unit-detail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          unitNumber: u.unitNumber,
          unitTitle:  u.unitTitle,
          summary:    u.summary,
        }),
      });
      const payload = await res.json().catch(() => null) as { detail?: UnitDetail; error?: string } | null;
      if (!res.ok || !payload?.detail) {
        throw new Error(payload?.error ?? "Failed to fetch deep content.");
      }
      setUnitDetails((prev) => ({ ...prev, [activeUnit]: payload.detail as UnitDetail }));
      setActiveTab("deep");
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingUnit(null);
    }
  }

  /* ─── Empty state ─────────────────────────────────────── */
  if (!record) {
    return (
      <main className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-6 py-10">
        <div className="play-card max-w-xl w-full rounded-[32px] p-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#22000f] text-3xl font-bold text-white">📂</div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">No reports yet</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#172233]">Nothing to revise just yet.</h1>
          <p className="mt-4 text-base leading-7 text-[#5b6678]">
            Upload a syllabus PDF first. The results view will fill with deep summaries, key terms, formulae, exam tips and practice MCQs.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/upload" className="rounded-full bg-[#dfff57] px-6 py-3 text-sm font-semibold text-[#22000f] shadow-[0_18px_38px_rgba(177,204,57,0.28)] transition hover:-translate-y-0.5">
              Go to upload dashboard
            </Link>
            {showSystemHealthLink && (
              <Link href="/system-health" className="rounded-full border border-[#d4dae6] bg-white px-6 py-3 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5">
                System status
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  /* ─── Main layout ─────────────────────────────────────── */
  return (
    <main className="min-h-screen bg-[#f9fafb]">
      <div className="mx-auto flex max-w-[1500px]">

        {/* ── Sidebar ──────────────────────────────── */}
        <aside className="hidden min-h-screen w-[280px] shrink-0 border-r border-[#e8ebf2] bg-white px-5 py-8 xl:flex xl:flex-col">
          <Link href="/upload" className="flex items-center gap-2 text-sm font-semibold text-[#344255] hover:text-[#172233] transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            Dashboard
          </Link>

          {/* Course card */}
          <div className="mt-6 rounded-[20px] border border-[#edf0f6] bg-[#f8fafc] p-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#718093]">Course</p>
            <p className="mt-1.5 text-sm font-semibold text-[#172233] leading-snug">{record.report.courseTitle}</p>
            <p className="mt-1 text-xs text-[#748197] truncate">{record.fileName}</p>
          </div>

          {/* Unit list */}
          <div className="mt-6 space-y-1">
            <p className="px-2 text-[10px] uppercase tracking-[0.22em] text-[#718093] mb-2">Units</p>
            {record.report.units.map((u, i) => (
              <button
                key={u.unitNumber}
                onClick={() => switchUnit(i)}
                className={`relative w-full flex items-start gap-3 px-3 py-3 rounded-[16px] text-left transition ${
                  activeUnit === i ? "bg-[#eef3ff] text-[#162233]" : "text-[#516071] hover:bg-[#f3f5f8] hover:text-[#1b2434]"
                }`}
              >
                {activeUnit === i && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-[#dfff57]" />
                )}
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  activeUnit === i ? "bg-[#22000f] text-white" : "bg-[#e8ebf2] text-[#516071]"
                }`}>
                  {u.unitNumber}
                </span>
                <div>
                  <p className="text-xs font-semibold">Unit {u.unitNumber}</p>
                  <p className="mt-0.5 text-[11px] leading-snug opacity-80 line-clamp-2">{u.unitTitle}</p>
                </div>
              </button>
            ))}
          </div>

          {/* High weightage */}
          {unit && (
            <div className="mt-6 rounded-[20px] border border-[#edf0f6] p-4">
              <p className="text-[10px] uppercase tracking-[0.22em] text-[#718093] mb-2">🔥 High Weightage</p>
              <div className="flex flex-wrap gap-1.5">
                {unit.highWeightageTopics.map((t) => (
                  <span key={t} className="rounded-full bg-[#fff4e6] border border-[#ffd6a0] px-2.5 py-1 text-[11px] font-medium text-[#7a4400]">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Library */}
          {libraryReports.length > 0 && (
            <div className="mt-6">
              <p className="px-2 text-[10px] uppercase tracking-[0.22em] text-[#718093] mb-2">Library</p>
              <div className="space-y-1">
                {libraryReports.slice(0, 5).map((rpt) => (
                  <Link key={rpt.id} href={`/results?reportId=${rpt.id}`}
                    className="block rounded-[14px] px-3 py-2 text-xs text-[#516071] hover:bg-[#f3f5f8] hover:text-[#1b2434] transition">
                    <p className="font-semibold truncate">{rpt.report.courseTitle}</p>
                    <p className="mt-0.5 opacity-70">{formatReportDate(rpt.createdAt)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="mt-auto" />
        </aside>

        {/* ── Main ─────────────────────────────────── */}
        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">

          {/* Nav bar */}
          <header className="play-nav sticky top-4 z-20 flex items-center justify-between rounded-[24px] px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22000f] text-base font-semibold text-white">L</div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#172233]">LPU Exam Cracker</p>
                {showSystemHealthLink
                  ? <Link href="/system-health" aria-label="System health" className="h-2.5 w-2.5 rounded-full bg-[#2fd400]" />
                  : <span className="h-2.5 w-2.5 rounded-full bg-[#b8c2d6]" />}
              </div>
            </div>
            <Link href="/upload" className="rounded-full border border-[#d6dce7] bg-white px-5 py-2.5 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5">
              ← Upload new
            </Link>
          </header>

          {/* Course header */}
          <section className="mt-6 play-card rounded-[32px] px-6 py-6 sm:px-8">
            <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">Study Report</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#172233] md:text-4xl">{record.report.courseTitle}</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#5b6678]">{record.report.overview}</p>
            {/* Mobile unit pills */}
            <div className="mt-5 flex flex-wrap gap-2 xl:hidden">
              {record.report.units.map((u, i) => (
                <button key={u.unitNumber} onClick={() => switchUnit(i)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeUnit === i ? "bg-[#22000f] text-white" : "border border-[#d6dce7] bg-white text-[#516071] hover:-translate-y-0.5"
                  }`}>
                  Unit {u.unitNumber}
                </button>
              ))}
            </div>
          </section>

          {/* Unit panel */}
          {unit && (
            <AnimatePresence mode="wait">
              <motion.div key={activeUnit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="mt-6 space-y-5">

                {/* Unit title strip */}
                <div className="play-card rounded-[28px] px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[#718093]">Unit {unit.unitNumber}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#172233]">{unit.unitTitle}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {unit.highWeightageTopics.map((t) => (
                      <span key={t} className="rounded-full bg-[#fff4e6] border border-[#ffd6a0] px-3 py-1.5 text-xs font-semibold text-[#7a4400]">
                        🔥 {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tab bar */}
                <div className="play-card rounded-[24px] px-4 py-3 overflow-x-auto">
                  <div className="flex gap-2 min-w-max">
                    {TAB_CONFIG.filter((t) => t.always || tabVisible(t.id)).map((tab) => (
                      <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                          activeTab === tab.id
                            ? "bg-[#22000f] text-white shadow-[0_6px_18px_rgba(34,0,15,0.18)]"
                            : "border border-[#d6dce7] bg-white text-[#516071] hover:border-[#bbc4d4] hover:text-[#1b2434]"
                        }`}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div key={`${activeUnit}-${activeTab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>

                    {/* ── SUMMARY ─────────────────────────────── */}
                    {activeTab === "summary" && (
                      <div className="space-y-5">
                        <div className="play-card rounded-[32px] px-6 py-7 sm:px-8 space-y-5">
                          <div>
                            <h3 className="text-lg font-semibold text-[#172233]">Unit Overview</h3>
                            <p className="mt-1 text-sm text-[#718093]">5 comprehensive concepts from this unit</p>
                          </div>
                          <ol className="space-y-5">
                            {currentSummary.length > 0 ? (
                              currentSummary.map((point, i) => (
                                <li key={i} className="flex gap-4 rounded-[20px] border border-[#e8ebf2] bg-[#f8fafc] px-5 py-4">
                                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dfff57] text-xs font-bold text-[#22000f]">
                                    {i + 1}
                                  </span>
                                  <p className="text-base leading-7 text-[#344255]">{point}</p>
                                </li>
                              ))
                            ) : (
                              <div className="rounded-[20px] border border-dashed border-[#d6dbe4] bg-[#f8fafc] p-10 text-center">
                                <p className="text-sm text-[#718093]">Unit summary hasn&apos;t been generated yet.</p>
                                <button
                                  onClick={() => fetchUnitDetail(record.id, unit!)}
                                  className="mt-4 text-sm font-semibold text-[#3d90ec] hover:underline"
                                >
                                  Generate Unit {unit?.unitNumber} Study Guide →
                                </button>
                              </div>
                            )}
                          </ol>
                        </div>

                        {/* ── Deep Study CTA ─ */}
                        <div className="play-card rounded-[28px] px-6 py-6 sm:px-8">
                          {detailError && (
                            <div className="mb-4 rounded-[18px] border border-[#ffd6a0] bg-[#fff4e6] px-4 py-3 text-sm text-[#7a4400]">
                              ⚠️ {detailError}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <h3 className="text-base font-semibold text-[#172233]">
                                {detail ? "✅ Deep study content loaded" : "📚 Want topic-by-topic deep study?"}
                              </h3>
                              <p className="mt-1 text-sm text-[#718093]">
                                {detail
                                  ? "Switch to the Deep Study, Key Terms, or Exam Tips tabs above."
                                  : `Click below to generate a detailed, subtopic-level breakdown for Unit ${unit.unitNumber}. The AI analyses just this unit so it stays fast and accurate.`}
                              </p>
                            </div>
                            <button
                              onClick={() => fetchUnitDetail(record.id, unit)}
                              disabled={loadingUnit === unit.unitNumber}
                              className="shrink-0 rounded-full bg-[#dfff57] px-6 py-3 text-sm font-semibold text-[#22000f] shadow-[0_12px_24px_rgba(177,204,57,0.28)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                            >
                              {loadingUnit === unit.unitNumber
                                ? "🔄 Generating deep summary..."
                                : detail
                                  ? "🔄 Refresh deep content"
                                  : "🔬 Get Deep Study for Unit " + unit.unitNumber}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── DEEP STUDY ──────────────────────────── */}
                    {activeTab === "deep" && (
                      <div className="space-y-4">
                        <div className="play-card rounded-[32px] px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-[#172233]">🔬 Deep Study — Topic by Topic</h3>
                            <p className="mt-1 text-sm text-[#718093]">Every subtopic from the syllabus explained in detail</p>
                          </div>
                          {record.id && (
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => fetchUnitDetail(record.id, unit)}
                                disabled={loadingUnit === unit.unitNumber}
                                className="shrink-0 rounded-full border border-[#d4dae6] bg-white px-5 py-2.5 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5 disabled:opacity-60"
                              >
                                {loadingUnit === unit.unitNumber ? "Generating..." : "Refresh ↺"}
                              </button>
                              <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('open-syllabus-chat'))}
                                className="shrink-0 rounded-full bg-[#22000f] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                              >
                                💬 Chat with AI
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Loading state */}
                        {loadingUnit === unit.unitNumber && (
                          <div className="play-card rounded-[28px] px-6 py-10 text-center space-y-3">
                            <div className="mx-auto h-10 w-10 rounded-full border-4 border-[#dfff57] border-t-[#22000f] animate-spin" />
                            <p className="text-sm font-semibold text-[#172233]">Generating deep content for Unit {unit.unitNumber}…</p>
                            <p className="text-xs text-[#718093]">The AI is reading the full syllabus for this unit and writing detailed explanations.</p>
                          </div>
                        )}

                        {/* Content */}
                        {!loadingUnit && detail && detail.subtopics.length > 0 && (
                          detail.subtopics.map((sub, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                              className="play-card rounded-[28px] px-6 py-6 sm:px-8">
                              <div className="flex items-start gap-4">
                                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#22000f] text-sm font-bold text-[#dfff57]">
                                  {i + 1}
                                </span>
                                <div>
                                  <h4 className="text-base font-bold text-[#172233]">{sub.title}</h4>
                                  <p className="mt-3 text-sm leading-[1.85] text-[#5b6678]">{sub.explanation}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}

                        {/* Empty prompt */}
                        {!loadingUnit && (!detail || detail.subtopics.length === 0) && (
                          <div className="play-card rounded-[28px] px-6 py-10 text-center">
                            <p className="text-3xl mb-4">🔬</p>
                            <p className="text-base font-semibold text-[#172233] mb-2">No deep content yet for Unit {unit.unitNumber}</p>
                            <p className="text-sm text-[#718093] mb-6">Click the button to generate topic-by-topic explanations, key terms and exam tips for this unit.</p>
                            <button
                              onClick={() => fetchUnitDetail(record.id, unit)}
                              disabled={loadingUnit === unit.unitNumber}
                              className="rounded-full bg-[#dfff57] px-7 py-3 text-sm font-semibold text-[#22000f] shadow-[0_12px_24px_rgba(177,204,57,0.28)] transition hover:-translate-y-0.5 disabled:opacity-60"
                            >
                              🔬 Generate Deep Study for Unit {unit.unitNumber}
                            </button>
                            {detailError && (
                              <p className="mt-4 text-sm text-red-600">{detailError}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── KEY TERMS ────────────────────────────── */}
                    {activeTab === "terms" && detail && (
                      <div className="space-y-4">
                        <div className="play-card rounded-[32px] px-6 py-5 sm:px-8">
                          <h3 className="text-lg font-semibold text-[#172233]">📖 Key Terms & Definitions</h3>
                          <p className="mt-1 text-sm text-[#718093]">Essential vocabulary for exams and MCQs</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {detail.keyTerms.map((kt, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                              className="play-card rounded-[24px] px-5 py-5">
                              <p className="text-sm font-bold text-[#22000f] uppercase tracking-[0.08em]">{kt.term}</p>
                              <div className="mt-2 h-px bg-[#e8ebf2]" />
                              <p className="mt-2 text-sm leading-6 text-[#5b6678]">{kt.definition}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── FORMULAE ─────────────────────────────── */}
                    {activeTab === "formulae" && detail && (
                      <div className="space-y-4">
                        <div className="play-card rounded-[32px] px-6 py-5 sm:px-8">
                          <h3 className="text-lg font-semibold text-[#172233]">🔢 Formulae & Equations</h3>
                          <p className="mt-1 text-sm text-[#718093]">Must-know mathematical expressions for this unit</p>
                        </div>
                        {detail.formulae.map((f, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="play-card rounded-[28px] px-6 py-6 sm:px-8">
                            <p className="text-xs uppercase tracking-[0.22em] text-[#718093]">{f.name}</p>
                            <div className="mt-3 rounded-[16px] border border-[#e1e6ef] bg-[#f8fafc] px-5 py-4">
                              <p className="font-mono text-xl font-semibold text-[#172233]">{f.expression}</p>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-[#5b6678]">{f.note}</p>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* ── EXAM TIPS ──────────────────────────────── */}
                    {activeTab === "examtips" && detail && (
                      <div className="play-card rounded-[32px] px-6 py-7 sm:px-8 space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[#172233]">🎯 Exam Tips</h3>
                          <p className="mt-1 text-sm text-[#718093]">What the examiner wants — based on ETE patterns for Unit {unit.unitNumber}</p>
                        </div>
                        <ul className="space-y-3">
                          {detail.examTips.map((tip, i) => (
                            <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                              className="flex gap-3 rounded-[20px] border border-[#e1e6ef] bg-[#f8fafc] px-5 py-4">
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dfff57] text-xs font-bold text-[#22000f]">
                                {i + 1}
                              </span>
                              <p className="text-sm leading-6 text-[#344255]">{tip}</p>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* ── QUIZ ──────────────────────────────────── */}
                    {activeTab === "quiz" && (
                      <div className="space-y-5">
                        {/* Score header */}
                        <div className="play-card rounded-[32px] px-6 py-5 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <h3 className="text-lg font-semibold text-[#172233]">✏️ Practice Quiz</h3>
                            <p className="mt-1 text-sm text-[#718093]">{activeQuestions.length} MCQs for Unit {unit.unitNumber} — {answeredCount}/{activeQuestions.length} answered</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="rounded-[16px] border border-[#e8ebf2] bg-[#f8fafc] px-5 py-2.5 text-center">
                              <p className="text-xs text-[#718093]">Score</p>
                              <p className="text-xl font-bold text-[#172233]">{currentScore}<span className="text-sm font-normal text-[#718093]">/{activeQuestions.length}</span></p>
                            </div>
                            <button onClick={() => setAnswers({})}
                              className="rounded-full border border-[#d4dae6] bg-white px-4 py-2 text-xs font-semibold text-[#344255] transition hover:-translate-y-0.5">
                              Reset
                            </button>
                          </div>
                        </div>

                        {/* Questions */}
                        {activeQuestions.map((question, qi) => {
                          const key         = `${activeUnit}-${qi}`;
                          const selected    = answers[key];
                          const isAnswered  = selected !== undefined;
                          const isCorrect   = selected === question.correctAnswerIndex;

                          return (
                            <motion.div key={qi} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: qi * 0.06 }}
                              className="play-card rounded-[28px] px-6 py-6 sm:px-8">
                              <div className="flex items-start gap-3 mb-5">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22000f] text-sm font-bold text-white">
                                  {qi + 1}
                                </span>
                                <p className="text-base font-medium text-[#172233] leading-6">{question.question}</p>
                              </div>

                              <div className="space-y-2.5">
                                {question.options.map((option, oi) => {
                                  const isSelected  = selected === oi;
                                  const showCorrect = isAnswered && oi === question.correctAnswerIndex;
                                  const showWrong   = isAnswered && isSelected && !isCorrect;

                                  let cls = "border-[#d4dae6] bg-white text-[#344255] hover:border-[#3d90ec] hover:bg-[#eef6ff]";
                                  if (showCorrect)    cls = "border-[#2fd400] bg-[#f0fce8] text-[#1a5c00] font-semibold";
                                  else if (showWrong) cls = "border-[#ef4335] bg-[#fff1ee] text-[#8c2e25]";
                                  else if (isSelected) cls = "border-[#3d90ec] bg-[#eef6ff] text-[#1a3a6c]";

                                  return (
                                    <button key={oi} disabled={isAnswered}
                                      onClick={() => !isAnswered && setAnswers((c) => ({ ...c, [key]: oi }))}
                                      className={`w-full rounded-[16px] border px-5 py-3.5 text-left text-sm transition ${cls} disabled:cursor-default`}>
                                      <span className="mr-2.5 font-bold">{String.fromCharCode(65 + oi)}.</span>
                                      {option}
                                    </button>
                                  );
                                })}
                              </div>

                              {isAnswered && (
                                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                  className={`mt-4 rounded-[16px] border px-5 py-4 text-sm ${
                                    isCorrect ? "border-[#2fd400] bg-[#f0fce8] text-[#1a5c00]" : "border-[#ffd6a0] bg-[#fff4e6] text-[#7a4400]"
                                  }`}>
                                  <p className="font-semibold mb-1">
                                    {isCorrect ? "✅ Correct!" : `❌ Correct answer: ${question.correctAnswer}`}
                                  </p>
                                  <p className="leading-6 opacity-90">{question.explanation}</p>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}

                        {/* Final score card */}
                        {answeredCount === activeQuestions.length && activeQuestions.length > 0 && (
                          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                            className="play-card rounded-[28px] px-6 py-8 sm:px-8 text-center">
                            <p className="text-5xl font-bold text-[#172233]">{currentScore}<span className="text-2xl text-[#718093] font-normal">/{activeQuestions.length}</span></p>
                            <p className="mt-3 text-base text-[#5b6678]">
                              {currentScore === activeQuestions.length
                                ? "🎉 Perfect! You've mastered this unit."
                                : currentScore >= Math.ceil(activeQuestions.length * 0.6)
                                  ? "👍 Good work — review the ones you missed."
                                  : "💪 Keep revising — try the Deep Study tab then retry."}
                            </p>
                            <button onClick={() => setAnswers({})}
                              className="mt-6 rounded-full bg-[#dfff57] px-7 py-3 text-sm font-semibold text-[#22000f] shadow-[0_12px_24px_rgba(177,204,57,0.28)] transition hover:-translate-y-0.5">
                              Retry Quiz
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          )}

          <footer className="pb-5 pt-8 text-center text-xs text-[#99a3b5]">
            {record.report.courseTitle} • {record.report.units.length} units • Storage: Firestore
          </footer>
        </div>
      </div>
      
      <SyllabusChat 
        reportId={record.id}
        courseTitle={record.report.courseTitle}
        activeUnitNumber={unit.unitNumber}
        activeUnitTitle={unit.unitTitle}
        hasSourceText={record.hasSourceText}
        deepStudyContext={detail?.subtopics?.map(s => s.title) || []}
      />
    </main>
  );
}
