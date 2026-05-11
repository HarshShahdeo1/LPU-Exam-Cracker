"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { sendPasswordResetEmail, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { ConfettiCanvas } from "@/components/auth/confetti-canvas";
import { firebaseAuth } from "@/lib/firebase-client";

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    switch (error.code) {
      case "auth/configuration-not-found":
        return "Firebase Authentication is not fully configured yet. Enable Email/Password sign-in in Firebase Console > Authentication > Sign-in method.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is disabled for this Firebase project.";
      case "auth/email-already-in-use":
        return "That email is already registered. Switch to Login or use Forgot Password.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "The email or password is incorrect.";
      case "auth/user-not-found":
        return "No account found for this email.";
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/weak-password":
        return "Choose a stronger password — at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      default:
        if ("message" in error && typeof error.message === "string") return error.message;
    }
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function AuthLanding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoMessage,  setInfoMessage]  = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mode,         setMode]         = useState<"login" | "signup">("login");

  function switchMode(newMode: "login" | "signup") {
    setMode(newMode);
    setErrorMessage("");
    setInfoMessage("");
  }

  async function createServerSession(idToken: string) {
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error ?? "Unable to create a server session.");
    }
  }

  async function handleSignUp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");
    try {
      const cred    = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await cred.user.getIdToken();
      await createServerSession(idToken);
      startTransition(() => { router.push("/upload"); router.refresh(); });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");
    try {
      const cred    = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const idToken = await cred.user.getIdToken();
      await createServerSession(idToken);
      const next = searchParams.get("next");
      const path = next?.startsWith("/") ? next : "/upload";
      startTransition(() => { router.push(path); router.refresh(); });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    setErrorMessage("");
    setInfoMessage("");
    if (!email.trim()) {
      setErrorMessage("Enter your email address first, then click Forgot Password.");
      return;
    }
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim());
      setInfoMessage("Reset email sent — check your inbox.");
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f9fa]">

      {/* ── Confetti canvas (always active) ── */}
      <ConfettiCanvas />

      {/* ── Very subtle dot grid so background isn't totally flat ── */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, #c8cdd5 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />

      {/* ── Navbar ── */}
      <nav className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#22000f] text-sm font-black text-white shadow-lg">
            L
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-[#f8f9fa] bg-[#dfff57]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#172233]">LPU Exam Cracker</p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#718093]">AI Powered</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden items-center gap-1.5 rounded-full border border-[#e2e6ec] bg-white px-4 py-2 shadow-sm sm:flex"
        >
          <span className="h-2 w-2 rounded-full bg-[#2fd400]" style={{ boxShadow: "0 0 5px #2fd400" }} />
          <span className="text-xs font-medium text-[#718093]">All systems online</span>
        </motion.div>
      </nav>

      {/* ── Main grid ── */}
      <div className="relative z-10 mx-auto mt-4 grid max-w-6xl items-center gap-8 px-6 pb-16 sm:px-8 xl:mt-12 xl:grid-cols-2 xl:gap-20">

        {/* Left hero */}
        <AuthHeroPanel />

        {/* Right card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-[32px] border border-[#e2e6ec] bg-white p-7 shadow-[0_20px_60px_rgba(23,34,51,0.10)] sm:p-9">

            {/* Card header */}
            <div className="mb-7">
              {/* Colourful dot row — inspired by confetti */}
              <div className="mb-5 flex gap-1.5">
                {["#ef4335","#dfff57","#3d90ec","#ab95fb","#2fd400","#ff7417"].map((c) => (
                  <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#718093]">Secure access</p>
              <h2 className="mt-2 text-3xl font-black text-[#172233]">
                {mode === "login" ? "Welcome back 👋" : "Join LPU Cracker 🚀"}
              </h2>
              <p className="mt-1.5 text-sm text-[#718093]">
                {mode === "login" ? "Sign in to start your AI revision session" : "Create your free account to get started"}
              </p>

              {/* Tab switcher */}
              <div className="mt-5 flex rounded-2xl border border-[#e2e6ec] bg-[#f8fafc] p-1">
                <button type="button"
                  onClick={() => switchMode("login")}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-[#22000f] text-white shadow"
                      : "text-[#718093] hover:text-[#172233]"
                  }`}>
                  Sign In
                </button>
                <button type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
                    mode === "signup"
                      ? "bg-[#22000f] text-white shadow"
                      : "text-[#718093] hover:text-[#172233]"
                  }`}>
                  Create Account
                </button>
              </div>
            </div>

            <form className="space-y-4" onSubmit={mode === "login" ? handleLogin : handleSignUp}>

              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#344255]">Email</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba6ba]" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  <input
                    type="email" autoComplete="email" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@lpu.in"
                    suppressHydrationWarning
                    className="w-full rounded-2xl border border-[#d6dce7] bg-[#f8fafc] py-3.5 pl-10 pr-4 text-sm text-[#172233] outline-none transition placeholder:text-[#b0bac9] focus:border-[#22000f]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,0,15,0.06)]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#344255]">Password</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba6ba]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <input
                    type="password" autoComplete="current-password" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    suppressHydrationWarning
                    className="w-full rounded-2xl border border-[#d6dce7] bg-[#f8fafc] py-3.5 pl-10 pr-4 text-sm text-[#172233] outline-none transition placeholder:text-[#b0bac9] focus:border-[#22000f]/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(34,0,15,0.06)]"
                  />
                </div>
              </div>

              {/* Forgot */}
              <div className="flex justify-between text-xs">
                <button type="button" onClick={handleForgotPassword}
                  className="font-medium text-[#718093] transition hover:text-[#172233] hover:underline">
                  Forgot password?
                </button>
                <span className="text-[#9ba6ba]">🔒 Protected session</span>
              </div>

              {/* Alert messages */}
              {(errorMessage || infoMessage) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    errorMessage
                      ? "border-[#ffcabf] bg-[#fff1ee] text-[#8c2e25]"
                      : "border-[#cde9ce] bg-[#edf8ed] text-[#276334]"
                  }`}
                >
                  {errorMessage || infoMessage}
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full overflow-hidden rounded-2xl py-4 text-sm font-black text-[#22000f] transition-all disabled:cursor-wait disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #dfff57 0%, #c8e800 100%)",
                  boxShadow: "0 8px 24px rgba(223,255,87,0.45), 0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === "login" ? "Signing in…" : "Creating account…"}
                  </span>
                ) : (
                  mode === "login" ? "Sign in →" : "Create Account →"
                )}
                {/* Shimmer sweep */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </motion.button>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#edf0f6]" />
              <p className="text-xs text-[#b0bac9]">For LPU students only</p>
              <div className="h-px flex-1 bg-[#edf0f6]" />
            </div>

            {/* Footer trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#b0bac9]">
              <span className="flex items-center gap-1">🔐 Firebase Auth</span>
              <span>·</span>
              <span className="flex items-center gap-1">☁️ Firestore</span>
              <span>·</span>
              <span className="flex items-center gap-1">🤖 Groq AI</span>
            </div>
          </div>
        </motion.div>

      </div>
    </main>
  );
}
