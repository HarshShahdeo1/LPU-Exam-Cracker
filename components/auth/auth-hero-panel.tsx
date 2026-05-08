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
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#22000f]/10 bg-[#22000f]/5 px-4 py-2"
      >
        <span className="h-2 w-2 rounded-full bg-[#2fd400]" style={{ boxShadow: "0 0 6px #2fd400" }} />
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#22000f]/60">
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
        <span className="relative">
          <span className="relative z-10">Score higher.</span>
          <span className="absolute bottom-1 left-0 -z-0 h-4 w-full rounded-sm opacity-40"
            style={{ background: "linear-gradient(90deg, #dfff57, #c8e800)" }} />
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
