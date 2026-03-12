"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Loader2, ChevronDown } from "lucide-react";
import type { LeasingAgentContext, ChatMessage } from "@/app/api/ai/leasing-agent/route";

interface ListingChatWidgetProps {
  context: LeasingAgentContext;
}

const SUGGESTED_QUESTIONS = [
  "What's included in the rent?",
  "Is parking available?",
  "Are pets allowed?",
  "How do I schedule a tour?",
];

export function ListingChatWidget({ context }: ListingChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return;

    const userMessage: ChatMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setStreaming(true);

    // Placeholder for assistant response
    const assistantPlaceholder: ChatMessage = { role: "assistant", content: "" };
    setMessages([...updatedMessages, assistantPlaceholder]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/ai/leasing-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, context }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;
            try {
              const { text } = JSON.parse(raw);
              accumulated += text;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: accumulated };
                return copy;
              });
            } catch {
              // skip malformed chunk
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Sorry, I had trouble responding. Please try again.",
          };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleClose() {
    abortRef.current?.abort();
    setOpen(false);
    setMinimized(false);
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      {/* Floating button — only when chat is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-navy text-white shadow-lg hover:bg-navy/90 transition-all hover:scale-105 active:scale-95"
          aria-label="Ask the leasing agent"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Ask a question</span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden transition-all duration-200 ${
            minimized ? "w-72 h-14" : "w-80 sm:w-96 h-[480px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-navy text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Leasing Agent</p>
                <p className="text-[10px] text-white/70 mt-0.5">{context.listingTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized((v) => !v)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label={minimized ? "Expand" : "Minimize"}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${minimized ? "rotate-180" : ""}`} />
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body — hidden when minimized */}
          {!minimized && (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50/50">
                {/* Welcome message */}
                {!hasMessages && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle className="w-3.5 h-3.5 text-navy" />
                      </div>
                      <div className="bg-white rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-foreground shadow-sm border border-border/50 max-w-[85%]">
                        Hi! I&apos;m the leasing agent for{" "}
                        <span className="font-medium">{context.listingTitle}</span>. Ask me anything
                        about this property!
                      </div>
                    </div>

                    {/* Suggested questions */}
                    <div className="flex flex-wrap gap-1.5 pl-8">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="text-xs px-2.5 py-1.5 rounded-full border border-navy/20 text-navy hover:bg-navy/5 transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conversation */}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                        <MessageCircle className="w-3.5 h-3.5 text-navy" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm max-w-[85%] shadow-sm ${
                        msg.role === "user"
                          ? "bg-navy text-white rounded-tr-sm"
                          : "bg-white text-foreground rounded-tl-sm border border-border/50"
                      }`}
                    >
                      {msg.content || (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span className="text-xs">Typing…</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-border bg-white shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-border px-3 py-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about this property…"
                    disabled={streaming}
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || streaming}
                    className="p-1 rounded-lg text-navy hover:bg-navy/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send"
                  >
                    {streaming ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                  AI leasing agent · Powered by Lorde
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
