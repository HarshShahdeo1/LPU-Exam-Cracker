"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

import { GlassPanel } from "@/components/ui/glass-panel";
import { formatReportDate } from "@/lib/utils";
import { StoredUserReport } from "@/types/report";

type ResultsShellProps = {
  record: StoredUserReport | null;
  userEmail: string | null;
};

export function ResultsShell({ record, userEmail }: ResultsShellProps) {
  const [activeUnit, setActiveUnit] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const activeQuestions = record?.report.units[activeUnit]?.mcqs ?? [];
  const currentScore = activeQuestions.reduce((score, question, index) => {
    const key = `${activeUnit}-${index}`;
    return answers[key] === question.correctAnswerIndex ? score + 1 : score;
  }, 0);

  if (!record) {
    return (
      <main className="hero-noise flex min-h-screen items-center justify-center px-6 py-10">
        <GlassPanel className="max-w-2xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.26em] text-white/45">No Reports Yet</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Nothing to revise just yet.</h1>
          <p className="mt-4 text-white/65">
            Upload a syllabus PDF first and the results view will populate with summaries,
            high-weightage topics, and MCQ practice cards.
          </p>
          <div className="mt-6">
            <Link
              href="/upload"
              className="inline-flex rounded-2xl bg-gradient-to-r from-[#A50000] to-[#E14C3C] px-5 py-3 text-sm font-semibold text-white"
            >
              Go to upload dashboard
            </Link>
          </div>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="hero-noise relative min-h-screen overflow-hidden px-6 py-8">
      <div className="spotlight left-[-10rem] top-[-3rem] h-80 w-80 bg-[#7c1116]/26" />
      <div className="spotlight right-[-8rem] top-24 h-80 w-80 bg-[#ef4335]/14" />
      <div className="absolute inset-0 bg-grid opacity-15" />
      <div className="absolute inset-0 bg-grid-fine opacity-10" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="grid gap-6 rounded-[34px] border border-white/10 bg-white/[0.03] px-6 py-6 xl:grid-cols-[1.12fr,0.88fr] xl:items-end">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.26em] text-white/45">Results</p>
            <div>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                {record.report.courseTitle}
              </h1>
              <p className="mt-2 max-w-3xl text-white/65">{record.report.overview}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-white/55">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {record.fileName}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {formatReportDate(record.createdAt)}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {userEmail ?? "Authenticated user"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr,auto]">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Units", value: record.report.units.length.toString() },
                { label: "Questions", value: activeQuestions.length.toString() },
                { label: "Score", value: `${currentScore}/${activeQuestions.length}` }
              ].map((stat) => (
                <GlassPanel key={stat.label} className="p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">{stat.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{stat.value}</p>
                </GlassPanel>
              ))}
            </div>
            <div className="flex items-end">
              <Link
                href="/upload"
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                Analyze another PDF
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[0.92fr,1.08fr]">
          <GlassPanel className="p-6">
            <div className="flex flex-wrap gap-3">
              {record.report.units.map((unit, index) => (
                <button
                  key={unit.unitNumber}
                  onClick={() => setActiveUnit(index)}
                  className={`rounded-[24px] border px-4 py-4 text-left transition ${
                    activeUnit === index
                      ? "border-[#E14C3C]/50 bg-[linear-gradient(145deg,rgba(239,67,53,0.18),rgba(10,12,18,0.6))] text-white shadow-[0_20px_60px_rgba(165,0,0,0.16)]"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:-translate-y-0.5 hover:bg-white/[0.06]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Study Card</p>
                  <p className="mt-2 font-medium">{unit.unitTitle}</p>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={record.report.units[activeUnit].unitNumber}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.24 }}
                className="mt-6 space-y-6"
              >
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/45">Summary</p>
                  <div className="mt-4 grid gap-3">
                    {record.report.units[activeUnit].summary.map((point, index) => (
                      <div
                        key={point}
                        className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] px-4 py-4 text-sm leading-7 text-white/80"
                      >
                        <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ef4335]/20 bg-[#ef4335]/10 text-[11px] font-medium text-[#ffd7cb]">
                          0{index + 1}
                        </span>
                        {point}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-white/45">
                    High-Weightage Topics
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {record.report.units[activeUnit].highWeightageTopics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-[#E14C3C]/30 bg-[#A50000]/12 px-4 py-2 text-sm text-[#FFD8D3] shadow-[0_10px_30px_rgba(165,0,0,0.12)]"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <GlassPanel className="relative overflow-hidden p-5">
                  <div className="scanlines absolute inset-0" />
                  <p className="text-sm uppercase tracking-[0.24em] text-white/45">Source Hint</p>
                  <p className="relative mt-3 text-sm leading-7 text-white/68">
                    {record.sourceExcerpt || "A source excerpt was not persisted for this report."}
                  </p>
                </GlassPanel>
              </motion.div>
            </AnimatePresence>
          </GlassPanel>

          <GlassPanel className="relative overflow-hidden p-6">
            <div className="scanlines absolute inset-0" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/45">Practice Quiz</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {record.report.units[activeUnit].unitTitle}
                </h2>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
                Score: {currentScore}/{activeQuestions.length}
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {activeQuestions.map((question, questionIndex) => {
                const answerKey = `${activeUnit}-${questionIndex}`;
                const selectedAnswer = answers[answerKey];
                const isCorrect = selectedAnswer === question.correctAnswerIndex;

                return (
                  <div
                    key={question.question}
                    className="relative rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(0,0,0,0.24),rgba(255,255,255,0.03))] p-5"
                  >
                    <p className="text-sm uppercase tracking-[0.24em] text-white/40">
                      MCQ {questionIndex + 1}
                    </p>
                    <h3 className="mt-2 text-lg font-medium text-white">{question.question}</h3>

                    <div className="mt-4 grid gap-3">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selectedAnswer === optionIndex;
                        const showCorrect =
                          selectedAnswer !== undefined && optionIndex === question.correctAnswerIndex;

                        return (
                          <button
                            key={`${question.question}-${option}`}
                            onClick={() =>
                              setAnswers((current) => ({
                                ...current,
                                [answerKey]: optionIndex
                              }))
                            }
                            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                              showCorrect
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
                                : isSelected
                                  ? "border-[#E14C3C]/40 bg-[#A50000]/14 text-white"
                                  : "border-white/10 bg-white/[0.03] text-white/72 hover:-translate-y-0.5 hover:bg-white/[0.05]"
                            }`}
                          >
                            <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/20 text-xs text-white/70">
                              {String.fromCharCode(65 + optionIndex)}
                            </span>
                            {option}
                          </button>
                        );
                      })}
                    </div>

                    {selectedAnswer !== undefined && (
                      <div
                        className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-7 ${
                          isCorrect
                            ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
                            : "border-amber-300/20 bg-amber-400/10 text-amber-100"
                        }`}
                      >
                        <p className="font-medium">Correct answer: {question.correctAnswer}</p>
                        <p className="mt-1">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </section>
      </div>
    </main>
  );
}
