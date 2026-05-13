"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { GlassPanel } from "@/components/ui/glass-panel";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type SyllabusChatProps = {
  reportId: string;
  courseTitle: string;
  activeUnitNumber: number;
  activeUnitTitle: string;
  hasSourceText: boolean;
  deepStudyContext?: string[];
};

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content
  };
}

export function SyllabusChat({
  reportId,
  courseTitle,
  activeUnitNumber,
  activeUnitTitle,
  hasSourceText,
  deepStudyContext
}: SyllabusChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [providerName, setProviderName] = useState("AI");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      hasSourceText
        ? `Ask anything about ${courseTitle}. I can explain units, suggest likely 2-mark questions, and help you revise the current topic.`
        : "This report does not include full syllabus chat context yet. Re-run the analysis once to enable Ask Your Syllabus."
    )
  ]);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  const starterPrompts = useMemo(
    () => [
      `What is the most difficult topic in Unit ${activeUnitNumber}?`,
      `Give me a 2-mark question on ${activeUnitTitle}.`,
      `Which three points from ${activeUnitTitle} should I revise first?`
    ],
    [activeUnitNumber, activeUnitTitle]
  );

  useEffect(() => {
    async function fetchProvider() {
      try {
        const res = await fetch("/api/syllabus-chat");
        const data = await res.json();
        if (data.provider) setProviderName(data.provider);
      } catch (err) {
        console.error("Failed to fetch provider name", err);
      }
    }
    fetchProvider();
  }, []);

  useEffect(() => {
    function handleOpenChat() {
      setIsOpen(true);
    }
    window.addEventListener("open-syllabus-chat", handleOpenChat);
    return () => window.removeEventListener("open-syllabus-chat", handleOpenChat);
  }, []);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isOpen, messages]);

  async function sendQuestion(submittedQuestion: string) {
    const trimmedQuestion = submittedQuestion.trim();

    if (!trimmedQuestion || isSending || !hasSourceText) {
      return;
    }

    const userMessage = createMessage("user", trimmedQuestion);
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setIsSending(true);

    try {
      const response = await fetch("/api/syllabus-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reportId,
          question: trimmedQuestion,
          activeUnitNumber,
          activeUnitTitle,
          deepStudyContext
        })
      });

      const payload = (await response.json().catch(() => null)) as
        | { answer?: string; error?: string; provider?: string }
        | null;

      if (!response.ok || !payload?.answer) {
        throw new Error(payload?.error ?? "Syllabus chat is unavailable right now.");
      }

      if (payload.provider) {
        setProviderName(payload.provider);
      }

      setMessages((current) => [...current, createMessage("assistant", payload.answer as string)]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          error instanceof Error ? error.message : "Syllabus chat is unavailable right now."
        )
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion(question);
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(390px,calc(100vw-1.5rem))] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="pointer-events-auto w-full"
          >
            <GlassPanel className="overflow-hidden p-0">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(37,99,235,0.16),rgba(255,255,255,0.02))] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/45">
                      Ask Your Syllabus
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      Chat with {activeUnitTitle}
                    </h3>
                    <p className="mt-1 text-sm text-white/60">Powered by {providerName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/65 transition hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="max-h-[430px] overflow-y-auto px-4 py-4">
                <div className="mb-4 flex flex-wrap gap-2">
                  {starterPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isSending || !hasSourceText}
                      onClick={() => void sendQuestion(prompt)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-xs text-white/65 transition hover:-translate-y-0.5 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[92%] rounded-[22px] px-4 py-3 text-sm leading-7 ${
                        message.role === "assistant"
                          ? "border border-white/10 bg-white/[0.04] text-white/78"
                          : "ml-auto border border-[#2563eb]/20 bg-[#1e3a8a]/30 text-[#eff6ff]"
                      }`}
                    >
                      {message.content}
                    </div>
                  ))}

                  {isSending && (
                    <div className="max-w-[92%] rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/60">
                      Thinking through the syllabus...
                    </div>
                  )}
                  <div ref={scrollAnchorRef} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="border-t border-white/10 px-4 py-4">
                {!hasSourceText && (
                  <div className="mb-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                    This report was created before full chat context was saved. Re-run the syllabus
                    analysis once, then ask questions here.
                  </div>
                )}
                <div className="flex gap-3">
                  <textarea
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        if (!isSending && question.trim() && hasSourceText) {
                          void sendQuestion(question);
                        }
                      }
                    }}
                    rows={3}
                    maxLength={400}
                    placeholder="Ask about difficult topics, 2-mark questions, revision strategy, or unit explanations..."
                    className="min-h-[92px] flex-1 resize-none rounded-[22px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/28 focus:border-[#2563eb]/50"
                    disabled={isSending || !hasSourceText}
                  />
                  <div className="flex flex-col justify-end gap-2">
                    <Button
                      type="submit"
                      disabled={isSending || !question.trim() || !hasSourceText}
                      className="min-w-[110px] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                    >
                      {isSending ? "Asking..." : "Ask"}
                    </Button>
                    <p className="text-right text-xs text-white/35">{question.length}/400</p>
                  </div>
                </div>
              </form>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="pointer-events-auto flex items-center gap-3 rounded-full border border-[#2563eb]/20 bg-[linear-gradient(135deg,rgba(30,58,138,0.92),rgba(37,99,235,0.92))] px-5 py-3 text-sm font-semibold text-white shadow-[0_24px_70px_rgba(30,58,138,0.34)] transition hover:-translate-y-0.5"
      >
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/90" />
        Ask Your Syllabus
      </button>
    </div>
  );
}
