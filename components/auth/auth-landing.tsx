"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";

import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
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
      case "auth/email-already-in-use":
        return "That email is already registered. Switch to Login or use Forgot Password.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/user-not-found":
        return "No Firebase Auth user exists for this email yet.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Choose a stronger password with at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many authentication attempts. Wait a moment and try again.";
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function createServerSession(idToken: string) {
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
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const credential =
        mode === "login"
          ? await signInWithEmailAndPassword(firebaseAuth, email, password)
          : await (async () => {
              if (!fullName.trim()) {
                throw new Error("Enter your full name to create an account.");
              }

              if (password !== confirmPassword) {
                throw new Error("Password and confirm password do not match.");
              }

              const signupCredential = await createUserWithEmailAndPassword(
                firebaseAuth,
                email,
                password
              );

              await updateProfile(signupCredential.user, {
                displayName: fullName.trim()
              });

              return signupCredential;
            })();
      const idToken = await credential.user.getIdToken();
      await createServerSession(idToken);

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
    <main className="hero-noise relative min-h-screen overflow-hidden">
      <div className="spotlight pulse-glow left-[-10%] top-[-10%] h-[28rem] w-[28rem] bg-[#7c1116]/30" />
      <div className="spotlight right-[-6%] top-[8%] h-[24rem] w-[24rem] bg-[#ef4335]/16" />
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute inset-0 bg-grid-fine opacity-15" />
      <div className="relative mx-auto grid min-h-screen w-full max-w-7xl gap-10 px-6 py-10 lg:grid-cols-[1.15fr,0.85fr] lg:items-center lg:px-10">
        <AuthHeroPanel />

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.1 }}
          className="w-full max-w-xl justify-self-end"
        >
          <GlassPanel className="crimson-ring relative overflow-hidden p-8 sm:p-10">
            <div className="spotlight right-[-4rem] top-[-6rem] h-40 w-40 bg-[#ef4335]/20" />
            <div className="relative">
            <div className="mb-8 space-y-2">
              <p className="text-sm uppercase tracking-[0.26em] text-white/50">
                {mode === "login" ? "Secure Login" : "Public Signup"}
              </p>
              <h2 className="text-3xl font-semibold text-white">
                {mode === "login" ? "Enter the workspace" : "Create your account"}
              </h2>
              <p className="text-sm leading-7 text-white/60">
                {mode === "login"
                  ? "Sign in with your Firebase Auth email and password to start analyzing syllabus PDFs."
                  : "Create a Firebase-backed account and start analyzing syllabus PDFs right away."}
              </p>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-black/20 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                  setInfoMessage("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                  setInfoMessage("");
                }}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                  mode === "signup"
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Sign up
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleLogin}>
              {mode === "signup" && (
                <label className="block space-y-2">
                  <span className="text-sm text-white/70">Full Name</span>
                  <input
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Harsh Shahdeo"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#E14C3C] focus:bg-black/40"
                    required
                  />
                </label>
              )}

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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "login" ? "Enter your password" : "Create a password"}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#E14C3C] focus:bg-black/40"
                  required
                />
              </label>

              {mode === "signup" && (
                <label className="block space-y-2">
                  <span className="text-sm text-white/70">Confirm Password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-[#E14C3C] focus:bg-black/40"
                    required
                  />
                </label>
              )}

              <div className="flex items-center justify-between gap-4 text-sm">
                {mode === "login" ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-white/60 transition hover:text-white"
                  >
                    Forgot Password
                  </button>
                ) : (
                  <span className="text-white/55">Open signup with secure Firebase sessions</span>
                )}
                <span className="text-right text-white/40">
                  {mode === "login"
                    ? "Firebase session secured on sign-in"
                    : "Firebase session secured on sign-up"}
                </span>
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
                {isSubmitting
                  ? mode === "login"
                    ? "Authenticating..."
                    : "Creating account..."
                  : mode === "login"
                    ? "Enter"
                    : "Create account"}
              </Button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/45">
              {["Glassmorphism UI", "Realtime auth", "AI summaries", "Quiz-first workflow"].map(
                (chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5"
                  >
                    {chip}
                  </span>
                )
              )}
            </div>
            </div>
          </GlassPanel>
        </motion.section>
      </div>
    </main>
  );
}
