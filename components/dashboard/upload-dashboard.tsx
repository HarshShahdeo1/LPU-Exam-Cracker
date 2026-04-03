"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { ProgressBar } from "@/components/ui/progress-bar";
import { firebaseAuth } from "@/lib/firebase-client";

type UploadDashboardProps = {
  userEmail: string | null;
  userName: string | null;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete this action.";
}

export function UploadDashboard({ userEmail, userName }: UploadDashboardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isUploading) {
      return;
    }

    const interval = window.setInterval(() => {
      setProgress((current) => (current >= 92 ? current : Math.min(92, current + Math.random() * 11)));
    }, 550);

    return () => window.clearInterval(interval);
  }, [isUploading]);

  const progressLabel =
    progress < 30
      ? "Uploading syllabus PDF..."
      : progress < 75
        ? "Reading with the AI model..."
        : "Assembling study cards and quiz content...";
  const quickStats = [
    { label: "Status", value: "Ready" },
    { label: "Storage", value: "Firestore" },
    { label: "Flow", value: "PDF to Quiz" }
  ];
  const pipelineSteps = [
    "Authenticate the user session",
    "Extract readable syllabus text",
    "Generate unit summaries and MCQs",
    "Store the final report per user UID"
  ];

  function chooseFile(file: File | null) {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setErrorMessage("Choose a syllabus PDF before starting the analysis.");
      return;
    }

    setErrorMessage("");
    setIsUploading(true);
    setProgress(8);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json().catch(() => null)) as
        | { reportId?: string; error?: string }
        | null;

      if (!response.ok || !payload?.reportId) {
        throw new Error(payload?.error ?? "The PDF analysis request failed.");
      }

      setProgress(100);

      window.setTimeout(() => {
        startTransition(() => {
          router.push(`/results?reportId=${payload.reportId}`);
          router.refresh();
        });
      }, 350);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsUploading(false);
      setProgress(0);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await signOut(firebaseAuth);
      await fetch("/api/auth/signout", {
        method: "POST"
      });

      startTransition(() => {
        router.push("/");
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setIsSigningOut(false);
    }
  }

  return (
    <main className="hero-noise relative min-h-screen overflow-hidden px-6 py-8">
      <div className="spotlight left-[-8rem] top-[-4rem] h-72 w-72 bg-[#7c1116]/28" />
      <div className="spotlight right-[-8rem] top-24 h-80 w-80 bg-[#ef4335]/12" />
      <div className="absolute inset-0 bg-grid opacity-15" />
      <div className="absolute inset-0 bg-grid-fine opacity-10" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="grid gap-6 rounded-[34px] border border-white/10 bg-white/[0.03] px-6 py-6 2xl:grid-cols-[1.15fr,0.85fr] 2xl:items-center">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.26em] text-white/45">Dashboard</p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">
              Welcome back{userName ? `, ${userName}` : ""}.
            </h1>
            <p className="max-w-2xl text-white/65">
              Drop in an LPU syllabus PDF and the pipeline will extract units, ETE topics, and
              practice MCQs into Firestore-backed study cards.
            </p>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map((stat) => (
                <GlassPanel key={stat.label} className="min-w-0 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-base font-semibold text-white">{stat.value}</p>
                </GlassPanel>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                {userEmail ?? "Authenticated user"}
              </span>
              <Button variant="ghost" onClick={handleSignOut} disabled={isSigningOut}>
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.45fr,0.85fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <GlassPanel
              className={`relative min-h-[520px] overflow-hidden p-6 transition ${
                isDragging ? "border-[#E14C3C]/60 bg-[#A50000]/10" : ""
              }`}
            >
              <div className="spotlight left-[-3rem] top-[-2rem] h-44 w-44 bg-[#ef4335]/14" />
              <div className="scanlines absolute inset-0" />
              <div className="relative flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
                    PDF Drop Zone
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold text-white md:text-4xl">
                      Upload a syllabus
                    </h2>
                    <p className="mt-3 max-w-2xl text-white/65">
                      The server extracts text with <code>pdf-parse</code>, sends it to
                      <code> the configured JSON model </code>, and saves the structured output to
                      Firestore under <code>userReports</code>.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {["High-weightage topics", "ETE-focused summaries", "5 MCQs per unit"].map(
                      (chip) => (
                        <span
                          key={chip}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60"
                        >
                          {chip}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <label
                  onDragEnter={() => setIsDragging(true)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    chooseFile(event.dataTransfer.files?.[0] ?? null);
                  }}
                  className="surface-line flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-[30px] border border-dashed border-white/15 bg-[linear-gradient(180deg,rgba(0,0,0,0.28),rgba(255,255,255,0.02))] px-6 py-10 text-center transition hover:border-white/25 hover:bg-white/[0.03]"
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                  />
                  <div className="space-y-4">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#ef4335]/20 bg-[linear-gradient(145deg,rgba(239,67,53,0.16),rgba(255,255,255,0.03))] text-xl text-white shadow-[0_20px_60px_rgba(165,0,0,0.18)]">
                      PDF
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-medium text-white">
                        Drop your LPU syllabus here or tap to browse.
                      </p>
                      <p className="text-sm leading-7 text-white/55">
                        Supports text-based PDFs up to 10 MB for fast OpenAI analysis.
                      </p>
                    </div>
                    {selectedFile && (
                      <div className="rounded-2xl border border-[#ef4335]/20 bg-[#ef4335]/10 px-4 py-3 text-sm text-[#ffe8e1]">
                        Selected: {selectedFile.name}
                      </div>
                    )}
                  </div>
                </label>

                <div className="space-y-4">
                  {isUploading && <ProgressBar label={progressLabel} value={progress} />}
                  {errorMessage && (
                    <div className="rounded-2xl border border-[#A50000]/50 bg-[#A50000]/10 px-4 py-3 text-sm text-[#FFD3CE]">
                      {errorMessage}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={() => inputRef.current?.click()} variant="ghost">
                      Browse PDF
                    </Button>
                    <Button onClick={handleAnalyze} disabled={isUploading || !selectedFile}>
                      {isUploading ? "Analyzing..." : "Analyze syllabus"}
                    </Button>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.section>

          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="space-y-6"
          >
            <GlassPanel className="p-6">
              <p className="text-sm uppercase tracking-[0.26em] text-white/45">Pipeline</p>
              <div className="mt-4 space-y-3">
                {pipelineSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/70"
                  >
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#ef4335]/20 bg-[#ef4335]/10 text-[11px] font-medium text-[#ffd7cb]">
                      0{index + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <p className="text-sm uppercase tracking-[0.26em] text-white/45">Shortcut</p>
              <div className="mt-4 space-y-4 text-white/70">
                <p>
                  Already analyzed something in this account? Jump straight to the latest result.
                </p>
                <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(145deg,rgba(239,67,53,0.12),rgba(12,14,20,0.62))] p-4 text-sm leading-7 text-white/65">
                  Each report is shaped into study cards, topic tags, and answerable quiz prompts so
                  the output feels exam-oriented, not just summarized.
                </div>
                <Link
                  href="/results"
                  className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Open latest report
                </Link>
              </div>
            </GlassPanel>
          </motion.aside>
        </div>
      </div>
    </main>
  );
}
