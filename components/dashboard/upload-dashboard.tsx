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
    <main className="min-h-screen bg-[#040405] px-6 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-5 rounded-[30px] border border-white/10 bg-white/[0.03] px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.26em] text-white/45">Dashboard</p>
            <h1 className="text-3xl font-semibold text-white">
              Welcome back{userName ? `, ${userName}` : ""}.
            </h1>
            <p className="text-white/65">
              Drop in an LPU syllabus PDF and the pipeline will extract units, ETE topics, and
              practice MCQs into Firestore-backed study cards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              {userEmail ?? "Authenticated user"}
            </span>
            <Button variant="ghost" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.4fr,0.8fr]">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <GlassPanel
              className={`min-h-[420px] p-6 transition ${
                isDragging ? "border-[#E14C3C]/60 bg-[#A50000]/10" : ""
              }`}
            >
              <div className="flex h-full flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60">
                    PDF Drop Zone
                  </div>
                  <div>
                    <h2 className="text-3xl font-semibold text-white">Upload a syllabus</h2>
                    <p className="mt-3 max-w-2xl text-white/65">
                      The server extracts text with <code>pdf-parse</code>, sends it to
                      <code> the configured JSON model </code>, and saves the structured output to
                      Firestore under <code>userReports</code>.
                    </p>
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
                  className="flex min-h-[230px] cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center transition hover:border-white/25 hover:bg-white/[0.03]"
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                  />
                  <div className="space-y-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-xl text-white">
                      PDF
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-white">
                        Drop your LPU syllabus here or tap to browse.
                      </p>
                      <p className="text-sm text-white/55">
                        Supports text-based PDFs up to 10 MB for fast OpenAI analysis.
                      </p>
                    </div>
                    {selectedFile && (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/75">
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
              <div className="mt-4 space-y-4 text-sm text-white/70">
                <p>1. Firebase session verifies access to protected routes.</p>
                <p>2. The uploaded PDF is parsed on the server with <code>pdf-parse</code>.</p>
                <p>3. OpenAI returns structured JSON for Units 1-4.</p>
                <p>4. Firestore stores the report for the authenticated user.</p>
              </div>
            </GlassPanel>

            <GlassPanel className="p-6">
              <p className="text-sm uppercase tracking-[0.26em] text-white/45">Shortcut</p>
              <div className="mt-4 space-y-4 text-white/70">
                <p>
                  Already analyzed something in this account? Jump straight to the latest result.
                </p>
                <Link
                  href="/results"
                  className="inline-flex rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium transition hover:bg-white/10"
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
