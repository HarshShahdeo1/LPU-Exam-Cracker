"use client";

import { motion } from "framer-motion";

import { GlassPanel } from "@/components/ui/glass-panel";

const heroStats = [
  { value: "4 Units", label: "Structured instantly" },
  { value: "20 MCQs", label: "Practice-ready output" },
  { value: "Firebase", label: "Reports persist per user" }
];

const flowCards = [
  {
    title: "Syllabus Scan",
    copy: "Raw PDFs become a clean revision framework with summaries, priorities, and quizzes."
  },
  {
    title: "Exam Pulse",
    copy: "A cinematic dashboard feel, built to make revision sessions feel crisp and deliberate."
  }
];

export function AuthHeroPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-3xl space-y-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70"
      >
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#ef4335] shadow-[0_0_18px_rgba(239,67,53,0.9)]" />
        LPU Exam Cracker v2
      </motion.div>

      <div className="space-y-5">
        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-[0.95] text-white md:text-7xl">
          Build a sharper revision loop from raw syllabus PDFs to
          <span className="text-gradient"> exam-ready study intelligence.</span>
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-white/72 md:text-xl">
          Designed like an academic control room: premium motion, structured AI extraction, and a
          workspace that feels worth coming back to.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {heroStats.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + index * 0.08 }}
            whileHover={{ y: -4 }}
          >
            <GlassPanel className="crimson-ring p-5">
              <p className="text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-white/65">{item.label}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <GlassPanel className="relative overflow-hidden p-6 md:p-7">
          <div className="scanlines absolute inset-0" />
          <div className="relative space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-white/45">
                  Revision Cockpit
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  AI analysis with premium study flow
                </h3>
              </div>
              <div className="float-slow rounded-2xl border border-[#ef4335]/20 bg-[#ef4335]/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-[#ffd7cb]">
                Live system
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {flowCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                >
                  <p className="text-sm font-medium text-white">{card.title}</p>
                  <p className="mt-3 text-sm leading-7 text-white/60">{card.copy}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-[0.82fr,1.18fr]">
              <div className="rounded-[24px] border border-white/10 bg-[#080b11]/80 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-white/45">Pipeline</p>
                <div className="mt-4 space-y-3 text-sm text-white/72">
                  <p>1. Signup or login with Firebase</p>
                  <p>2. Parse syllabus PDF on the server</p>
                  <p>3. Generate structured unit intelligence</p>
                  <p>4. Save reports for repeated practice</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#ef4335]/14 bg-[linear-gradient(145deg,rgba(239,67,53,0.12),rgba(10,12,18,0.62))] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                    Practice Snapshot
                  </p>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/65">
                    Unit 03 ready
                  </span>
                </div>
                <h4 className="mt-4 text-lg font-medium text-white">
                  Computer Networks: transport layer priorities
                </h4>
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-sm text-white/72">
                    Which protocol guarantees ordered delivery?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/58">
                    {["A. UDP", "B. TCP", "C. IP", "D. ARP"].map((option) => (
                      <span
                        key={option}
                        className={`rounded-full px-3 py-1 ${
                          option === "B. TCP"
                            ? "border border-[#ef4335]/30 bg-[#ef4335]/14 text-[#ffe6df]"
                            : "border border-white/10 bg-white/5"
                        }`}
                      >
                        {option}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </motion.section>
  );
}
