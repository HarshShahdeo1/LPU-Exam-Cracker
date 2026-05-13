"use client";

import { motion } from "framer-motion";

export function AuthHeroPanel() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 flex flex-col items-center justify-center py-10 text-center xl:items-start xl:text-left"
    >
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e2e6ec] bg-white px-4 py-2 shadow-sm"
      >
        <svg className="h-3.5 w-3.5 text-[#2563eb]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#516071]">
          AI Study Tool for LPU
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.6 }}
        className="text-5xl font-black leading-[1.05] text-[#172233] md:text-6xl"
      >
        Study smarter.
        <br />
        <span className="bg-gradient-to-r from-[#2563eb] to-[#4f46e5] bg-clip-text text-transparent">
          Score higher.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.55 }}
        className="mt-5 max-w-md text-lg leading-8 text-[#516071]"
      >
        Upload your LPU syllabus PDF and get instant unit summaries,
        key terms, exam tips and MCQ practice — all powered by AI.
      </motion.p>

      {/* Stat pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8 flex flex-wrap justify-center gap-3 xl:justify-start"
      >
        {[
          { emoji: "🧠", label: "Deep unit summaries" },
          { emoji: "🎯", label: "ETE exam tips" },
          { emoji: "✏️",  label: "5 MCQs per unit" },
          { emoji: "📖", label: "Key term definitions" },
        ].map((item, i) => (
          <motion.span
            key={item.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.54 + i * 0.06 }}
            className="flex items-center gap-2 rounded-full border border-[#e8ebf2] bg-white px-4 py-2 text-sm font-medium text-[#344255] shadow-sm"
          >
            {item.emoji} {item.label}
          </motion.span>
        ))}
      </motion.div>
    </motion.section>
  );
}
