"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Send, Sparkles, Printer } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  source?: "GEMINI_AI" | "OFFLINE_RULES";
}

const INITIAL_MESSAGE: ChatMessage = {
  id: "init_1",
  sender: "assistant",
  text: "Namaste! I'm Vikram, your Purple Friday print specialist. Ask me anything about MOQs, turnaround times, 18% GST input credit, or our in-house printing methods.",
  timestamp: "Just now",
};

const SUGGESTED_PROMPTS = [
  "What is your MOQ?",
  "How fast is dispatch?",
  "Do I get 18% GST credit?",
  "How does proof approval work?",
  "What print method is best for hoodies?",
];

export function PurpleAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Restore open state from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem("pf_assistant_open");
    if (saved === "true") {
      setIsOpen(true);
      setUnreadCount(0);
    }
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    sessionStorage.setItem("pf_assistant_open", String(nextState));
    if (nextState) {
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `asst_${Date.now()}`,
          sender: "assistant",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
          source: data.source,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            sender: "assistant",
            text: data.error || "Unable to reach studio assistant. Please try again.",
            timestamp: "Just now",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: "assistant",
          text: "Connection interrupted. Our print experts are available via WhatsApp or email.",
          timestamp: "Just now",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 font-mono text-xs">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className="relative flex items-center gap-2.5 px-4 py-3 bg-ink text-white rounded-full shadow-[4px_4px_0_0_#6A2CFF] border-2 border-violet hover:scale-105 active:scale-95 transition-all group"
          aria-label="Open Purple Assistant"
        >
          <div className="relative">
            <Printer className="w-5 h-5 text-spot-lime animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-ink">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="font-display font-bold text-xs sm:text-sm tracking-tight inline-block text-white select-none">
            Print Assistant
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-[92vw] sm:w-96 bg-[#181324] text-white border-2 border-violet rounded-2xl shadow-[8px_8px_0_0_#15101F] flex flex-col overflow-hidden max-h-[80vh] sm:max-h-[580px]">
          {/* Header */}
          <div className="bg-[#110D1A] p-3.5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-violet/20 border border-violet/50 flex items-center justify-center text-spot-lime">
                <Printer className="w-4 h-4" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Vikram (Printmaker)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-white/50">
                  Bengaluru Studio • Live Knowledge Base
                </div>
              </div>
            </div>

            <button
              onClick={handleToggle}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Assistant"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#181324]/95">
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs font-mono leading-relaxed shadow-sm ${isUser
                        ? "bg-violet text-white rounded-br-none"
                        : "bg-[#110D1A] text-white/90 border border-white/10 rounded-bl-none"
                      }`}
                  >
                    {/* Render plain text only - zero markdown execution */}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                  <span className="text-[9px] text-white/30 mt-1 px-1">{m.timestamp}</span>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-1.5 text-spot-lime text-[11px] p-2 bg-[#110D1A] rounded-xl w-fit border border-white/5">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Consulting workshop spec sheets...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompts */}
          <div className="p-2 bg-[#110D1A] border-t border-white/5 overflow-x-auto flex gap-1.5 scrollbar-none">
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-white/70 hover:text-white transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 bg-[#110D1A] border-t border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about MOQs, turnaround, GST..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-[#181324] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-violet"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-violet text-white hover:bg-violet/90 disabled:opacity-40 transition-colors shrink-0"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
