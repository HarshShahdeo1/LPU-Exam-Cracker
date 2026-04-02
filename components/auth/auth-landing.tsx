"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { sendPasswordResetEmail, signInWithEmailAndPassword } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";
import { firebaseAuth } from "@/lib/firebase-client";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    switch (error.code) {
      case "auth/configuration-not-found":
        return "Firebase Authentication is not fully configured yet. Enable Email/Password sign-in in Firebase Console > Authentication > Sign-in method.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is disabled for this Firebase project. Enable it in Firebase Console > Authentication > Sign-in method.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/user-not-found":
        return "No Firebase Auth user exists for this email yet.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      default:
        if ("message" in error && typeof error.message === "string") {
          return error.message;
        }
    }
  }

  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function AuthLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ idToken })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to create a server session.");
      }

      const requestedPath = searchParams.get("next");
      const nextPath = requestedPath?.startsWith("/") ? requestedPath : "/upload";

      startTransition(() => {
        router.push(nextPath);
        router.refresh();
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMessage("");
    setInfoMessage("");

    if (!email.trim()) {
      setErrorMessage("Enter your email address first, then trigger the password reset flow.");
      return;
    }

    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setInfoMessage("Password reset email sent. Check your inbox for the recovery link.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-hero-radial">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-10 px-6 py-10 lg:flex-row lg:items-center lg:px-10">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl space-y-8"
        >
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
            LPU Exam Cracker v2
          </div>
          <div className="space-y-5">
            <h1 className="max-w-2xl text-balance text-5xl font-semibold leading-tight text-white md:text-6xl">
              Turn syllabus PDFs into exam-ready study cards and practice quizzes.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-white/72">
              Upload an LPU syllabus, let the AI engine extract the most testable concepts, and
              keep every report in Firebase for repeat revision.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Protected sessions with Firebase Auth",
              "Structured JSON analysis with OpenAI",
              "Firestore-backed reports ready for AWS"
            ].map((item) => (
              <GlassPanel key={item} className="p-4 text-sm text-white/75 crimson-ring">
                {item}
              </GlassPanel>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1 }}
          className="w-full max-w-lg"
        >
          <GlassPanel className="crimson-ring p-8 sm:p-10">
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.26em] text-white/50">Secure Login</p>
              <h2 className="text-3xl font-semibold text-white">Enter the workspace</h2>
              <p className="text-sm leading-7 text-white/60">
                Sign in with your Firebase Auth email and password to start analyzing syllabus PDFs.
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              <label className="block space-y-2">
                <span className="text-sm text-white/70">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@lpu.in"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#E14C3C] focus:bg-black/40"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm text-white/70">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#E14C3C] focus:bg-black/40"
                  required
                />
              </label>

              <div className="flex items-center justify-between gap-4 text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-white/60 transition hover:text-white"
                >
                  Forgot Password
                </button>
                <span className="text-white/40">Firebase session secured on sign-in</span>
              </div>

              {(errorMessage || infoMessage) && (
                <div
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    errorMessage
                      ? "border-[#A50000]/60 bg-[#A50000]/10 text-[#FFD3CE]"
                      : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {errorMessage || infoMessage}
                </div>
              )}

              <Button type="submit" className="w-full py-3.5" disabled={isSubmitting}>
                {isSubmitting ? "Authenticating..." : "Enter"}
              </Button>
            </form>
          </GlassPanel>
        </motion.section>
      </div>
    </main>
  );
}
