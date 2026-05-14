"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";

import { ProgressBar } from "@/components/ui/progress-bar";
import { firebaseAuth } from "@/lib/firebase-client";
import { formatReportDate } from "@/lib/utils";

type UploadDashboardProps = {
  userEmail: string | null;
  userName: string | null;
  showSystemHealthLink: boolean;
  recentReports: Array<{
    id: string;
    fileName: string;
    courseTitle: string;
    createdAt: string | null;
  }>;
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete this action.";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDashboard({
  userEmail,
  userName,
  showSystemHealthLink,
  recentReports
}: UploadDashboardProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const rawName = userName?.trim() || userEmail || "Guest user";
  const displayName = rawName.split("@")[0];
  const userInitial = displayName.charAt(0).toUpperCase();

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

  async function handleTrySample() {
    try {
      setErrorMessage("");
      const res = await fetch("/sample-syllabus.pdf");
      if (!res.ok) throw new Error("Could not fetch sample syllabus. Make sure it exists in the public folder.");
      const blob = await res.blob();
      const file = new File([blob], "Sample_Syllabus_AI_INT246.pdf", { type: "application/pdf" });
      chooseFile(file);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="min-h-screen bg-[#f9fafb]">
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden sticky top-0 h-screen w-[300px] shrink-0 overflow-y-auto scrollbar-thin border-r border-[#e8ebf2] bg-white px-6 py-8 xl:flex xl:flex-col">
          <div className="flex items-center gap-4 rounded-[24px] border border-[#edf0f6] bg-white p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2ff] text-2xl font-semibold text-[#233142]">
              {userInitial}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <p className="truncate text-lg font-semibold text-[#172233]">{displayName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-full bg-[#dfff57] px-6 py-3.5 text-sm font-semibold text-[#1f2a22] shadow-[0_14px_28px_rgba(177,204,57,0.24)] transition hover:-translate-y-0.5"
          >
            + New Upload
          </button>

          <div className="mt-8 space-y-2">
            <Link href="/upload" className="sidebar-link sidebar-link-active">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#3d90ec]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 11.5L12 4l9 7.5" />
                <path d="M6.5 10v9h11v-9" />
              </svg>
              <span className="text-base font-medium">Home</span>
            </Link>
            <Link href="/results" className="sidebar-link">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#8190a6]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 5h12" />
                <path d="M6 10h12" />
                <path d="M6 15h9" />
                <path d="M6 19h7" />
              </svg>
              <span className="text-base font-medium">My library</span>
            </Link>
            <Link href="/results" className="sidebar-link">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#8190a6]" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 6h14v10H8l-3 3V6Z" />
              </svg>
              <span className="text-base font-medium">AI notes</span>
            </Link>
          </div>

          <div className="mt-auto" />
        </aside>

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <header className="play-nav sticky top-4 z-20 flex items-center justify-between rounded-[24px] px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22000f] text-base font-semibold text-white">
                L
              </div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-[#172233]">LPU Exam Cracker</p>
                {showSystemHealthLink ? (
                  <Link href="/system-health" aria-label="System health" className="h-2.5 w-2.5 rounded-full bg-[#2fd400]" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-[#b8c2d6]" />
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-full border border-[#d6dce7] bg-white px-5 py-2.5 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </header>

          <section className="mt-6 rounded-[32px] border border-[#e8ebf2] bg-white px-6 py-7 sm:px-8">
            <p className="text-lg font-semibold text-[#1f2a3b]">Hello, {displayName}.</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#172233] md:text-4xl">What are we studying today?</h1>
          </section>

          <section id="upload-board" className="mt-6 grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="play-card rounded-[36px] p-6"
            >
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">PDF drop zone</p>
                <h2 className="mt-3 text-3xl font-semibold text-[#172233]">Upload a syllabus PDF</h2>
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
                className={`mt-6 block cursor-pointer rounded-[32px] border-2 border-dashed px-8 py-16 text-center transition ${
                  isDragging ? 'border-[#9ba6ba] bg-[#f3f5f8]' : 'border-[#d6dbe4] bg-[#f8fafc]'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                />
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#22000f] text-xl font-semibold text-white">
                  PDF
                </div>
                <p className="mt-5 text-xl font-semibold text-[#172233]">
                  Drop your LPU syllabus here or tap to browse
                </p>
                <p className="mt-3 text-base leading-8 text-[#5b6678]">
                  Text-based PDFs up to 10 MB work best for fast parsing and clean AI output.
                </p>
                <div className="mt-5 rounded-[24px] border border-[#e1e6ef] bg-white px-4 py-3 text-sm text-[#516071]">
                  {selectedFile
                    ? `Selected: ${selectedFile.name} | ${formatFileSize(selectedFile.size)}`
                    : 'No file selected yet. The workspace is ready when you are.'}
                </div>
              </label>

              <div className="mt-6 space-y-4">
                {isUploading && <ProgressBar label={progressLabel} value={progress} />}
                {errorMessage && (
                  <div className="rounded-[24px] border border-[#ffcabf] bg-[#fff1ee] px-4 py-3 text-sm text-[#8c2e25]">
                    {errorMessage}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="rounded-full border border-[#d4dae6] bg-white px-6 py-3 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5"
                  >
                    Browse PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isUploading || !selectedFile}
                    className="rounded-full bg-[#dfff57] px-6 py-3 text-sm font-semibold text-[#22000f] shadow-[0_18px_38px_rgba(177,204,57,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUploading ? 'Analyzing...' : 'Analyze syllabus'}
                  </button>
                  <button
                    type="button"
                    onClick={handleTrySample}
                    disabled={isUploading}
                    className="rounded-full border border-[#e1e6ef] bg-[#f8fafc] px-6 py-3 text-sm font-semibold text-[#718093] transition hover:bg-[#eef2ff] hover:text-[#3d90ec] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Try Demo Syllabus
                  </button>
                </div>
              </div>
            </motion.div>

            <div className="space-y-6">
              <div className="play-card rounded-[32px] p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.26em] text-[#718093]">Recent uploads</p>
                  <button type="button" className="rounded-full border border-[#d7dde8] px-2.5 py-1 text-xs text-[#6d788b]">i</button>
                </div>
                <div className="mt-5 space-y-3">
                  {selectedFile ? (
                    <div className="play-card-soft rounded-[20px] p-4">
                      <p className="text-sm font-semibold text-[#1e2b3c]">{selectedFile.name}</p>
                      <p className="mt-1 text-xs text-[#748197]">Just selected • {formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : (
                    <div className="play-card-soft rounded-[20px] p-4 text-sm text-[#5b6678]">
                      No uploads in this session yet.
                    </div>
                  )}
                  {recentReports.length ? (
                    recentReports.map((report) => (
                      <Link
                        key={report.id}
                        href={`/results?reportId=${report.id}`}
                        className="play-card-soft block rounded-[20px] p-4 transition hover:-translate-y-0.5"
                      >
                        <p className="text-sm font-semibold text-[#1e2b3c]">{report.fileName}</p>
                        <p className="mt-1 text-xs text-[#748197]">
                          {report.courseTitle} • {formatReportDate(report.createdAt)}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <div className="play-card-soft rounded-[20px] p-4 text-sm text-[#5b6678]">
                      Recent analyzed PDFs will appear here.
                    </div>
                  )}
                </div>
              </div>

              <div className="play-card rounded-[32px] p-6">
                <p className="text-sm uppercase tracking-[0.26em] text-[#718093]">Need help?</p>
                <p className="mt-3 text-sm leading-7 text-[#5b6678]">
                  Open your latest report or check system details when needed.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/results"
                    className="rounded-full border border-[#d4dae6] bg-white px-5 py-3 text-sm font-semibold text-[#344255] transition hover:-translate-y-0.5"
                  >
                    Open latest report
                  </Link>
                  {showSystemHealthLink && (
                    <Link
                      href="/system-health"
                      className="rounded-full bg-[#22000f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                    >
                      System status
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="play-card rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">Your library</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#172233]">Saved Reports</h3>
              <p className="mt-3 text-base leading-8 text-[#5b6678]">Open previous syllabus analyses and continue revision.</p>
            </div>

            <div className="play-card rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">Recent quiz</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#172233]">Practice Snapshot</h3>
              <p className="mt-3 text-base leading-8 text-[#5b6678]">Jump back into the latest MCQ set and keep your streak going.</p>
            </div>

            <div className="play-card rounded-[30px] p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-[#718093]">AI notes</p>
              <h3 className="mt-3 text-2xl font-semibold text-[#172233]">Quick Summaries</h3>
              <p className="mt-3 text-base leading-8 text-[#5b6678]">Review generated unit summaries without reopening the full report.</p>
            </div>
          </section>

          <footer className="pb-5 pt-8 text-center text-xs text-[#99a3b5]">
            Status: {selectedFile ? "Ready" : "Waiting for upload"} • Engine: {isUploading ? "Analyzing" : "Idle"} • Storage: Firestore
          </footer>
        </div>
      </div>
    </main>
  );
}
