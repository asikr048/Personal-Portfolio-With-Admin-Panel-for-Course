"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, Bot, User, Loader2, RotateCcw, ChevronDown, Terminal, MessageSquare, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { sound } from "@/lib/sound";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

interface TerminalLog {
  id: string;
  cmd: string;
  output: string;
}

interface AiPublicSettings {
  assistantName: string;
  greeting: string;
  provider: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

const SUGGESTED = [
  "What projects have you built?",
  "What's your core tech stack?",
  "Tell me about your career highlights.",
  "How can I contact or hire you?",
];

const G = {
  bg: "hsl(210 60% 7% / 0.94)",
  bgCard: "hsl(210 55% 6%)",
  bgInput: "hsl(210 60% 5%)",
  border: "hsl(var(--p) / 0.15)",
  borderH: "hsl(var(--p) / 0.4)",
  grad: "linear-gradient(135deg, hsl(var(--p)), hsl(var(--p2)))",
  bright: "hsl(var(--p))",
  mid: "hsl(var(--p))",
  glow: "hsl(var(--p) / 0.2)",
  text: "hsl(195 80% 92%)",
  muted: "rgba(255,255,255,0.45)",
  faint: "rgba(255,255,255,0.22)",
};

export default function AiChat() {
  const pathname = usePathname();
  const cfg = useSiteConfig();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "terminal">("chat");

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(true);

  // Terminal State
  const [termLogs, setTermLogs] = useState<TerminalLog[]>([
    {
      id: "init",
      cmd: "welcome",
      output: "DecentraForce OS [Version 3.8.0]\nType 'help' to view available commands.",
    },
  ]);
  const [termInput, setTermInput] = useState("");

  const [settings, setSettings] = useState<AiPublicSettings>({
    assistantName: "Executive AI",
    greeting: "Hi! I'm here to answer any questions about my work and experience. Ask me anything!",
    provider: "",
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const termBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);

  if (pathname.startsWith("/admin")) return null;

  useEffect(() => {
    fetch("/api/ai-settings")
      .then((r) => r.json())
      .then((d: AiPublicSettings) => setSettings(d))
      .catch(() => {});
  }, []);

  // Listen for global custom event to open AI Chat (e.g. from Command Palette)
  useEffect(() => {
    const onOpenCustom = () => {
      sound.playPop();
      setOpen(true);
    };
    window.addEventListener("open-ai-chat", onOpenCustom);
    return () => window.removeEventListener("open-ai-chat", onOpenCustom);
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: uid(),
          role: "assistant",
          content: settings.greeting || "Hi! Ask me anything about this portfolio.",
          ts: new Date(),
        },
      ]);
      setPulse(false);
      setTimeout(() => {
        if (mode === "chat") inputRef.current?.focus();
        else termInputRef.current?.focus();
      }, 120);
    }
  }, [open, messages.length, settings.greeting, mode]);

  useEffect(() => {
    if (mode === "chat") {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else {
      termBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, termLogs, mode]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    sound.playClick();
    const userMsg: Message = { id: uid(), role: "user", content: trimmed, ts: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages.slice(1), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      sound.playSuccess();
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: data.reply, ts: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`,
          ts: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  }

  function reset() {
    sound.playClick();
    if (mode === "chat") {
      setMessages([
        { id: uid(), role: "assistant", content: settings.greeting, ts: new Date() },
      ]);
    } else {
      setTermLogs([
        {
          id: uid(),
          cmd: "clear",
          output: "Terminal cleared. Type 'help' for commands.",
        },
      ]);
    }
  }

  function handleTerminalCommand(e: React.FormEvent) {
    e.preventDefault();
    const cmd = termInput.trim().toLowerCase();
    if (!cmd) return;

    sound.playClick();
    let output = "";

    switch (cmd) {
      case "help":
        output =
          "Available commands:\n  whoami     - Display profile identity & role\n  stack      - Display core technologies\n  location   - Show current location\n  contact    - Show contact email & details\n  clear      - Clear terminal window";
        break;
      case "whoami":
        output = `${cfg.heroTitle || "Developer"}\n${cfg.roles || cfg.heroSubtitle}\nStatus: ${cfg.availabilityStatus || "Open to work"}`;
        break;
      case "stack":
        output = `Core Tech Stack:\n${(cfg.techStack || "")
          .split(",")
          .map((s) => "  • " + s.trim())
          .join("\n")}`;
        break;
      case "location":
        output = `Location: ${cfg.location || "Remote"}`;
        break;
      case "contact":
        output = `Email: ${cfg.email || "hello@example.com"}\nGitHub: ${cfg.github || "N/A"}\nLinkedIn: ${cfg.linkedin || "N/A"}`;
        break;
      case "clear":
        setTermLogs([]);
        setTermInput("");
        return;
      default:
        output = `Command not recognized: '${cmd}'. Type 'help' for options.`;
    }

    setTermLogs((prev) => [...prev, { id: uid(), cmd: termInput, output }]);
    setTermInput("");
    setTimeout(() => termInputRef.current?.focus(), 40);
  }

  function fmt(d: Date) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <>
      {/* ── Floating button — bottom RIGHT ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
        <button
          onClick={() => {
            sound.playPop();
            setOpen((o) => !o);
          }}
          aria-label="Toggle AI assistant"
          className="group relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
          style={{
            boxShadow: open
              ? "0 10px 30px rgba(0,0,0,0.5)"
              : "0 12px 34px hsl(var(--p) / 0.45), 0 4px 12px rgba(0,0,0,0.4)",
          }}
        >
          {/* Rotating conic glow ring */}
          {!open && (
            <span
              className="absolute -inset-[3px] rounded-2xl blur-[4px] opacity-75 group-hover:opacity-100 transition-opacity"
              style={{
                background:
                  "conic-gradient(from 0deg, hsl(var(--p)), hsl(var(--p2)), hsl(var(--p)))",
                animation: "spinSlow 4s linear infinite",
              }}
            />
          )}

          {/* Button body */}
          <span
            className="absolute inset-0 rounded-2xl"
            style={{
              background: open
                ? "linear-gradient(150deg,#7f1d1d,#991b1b)"
                : "linear-gradient(150deg, hsl(var(--p)), hsl(var(--p2)))",
            }}
          />

          {/* Glossy top sheen */}
          <span
            className="absolute inset-0 rounded-2xl"
            style={{
              background:
                "radial-gradient(130% 80% at 50% -15%, rgba(255,255,255,0.55), transparent 55%)",
            }}
          />

          {/* Inner ring */}
          <span
            className="absolute inset-[3px] rounded-[14px]"
            style={{ border: "1px solid rgba(255,255,255,0.22)" }}
          />

          {/* Pulse */}
          {pulse && !open && (
            <span
              className="absolute inset-0 rounded-2xl"
              style={{
                animation: "aiPulse 2.2s ease-out infinite",
                background: "hsl(var(--p) / 0.35)",
              }}
            />
          )}

          {/* Icon */}
          <span
            className="relative z-10 drop-shadow"
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform .3s",
            }}
          >
            {open ? (
              <X size={22} color="white" strokeWidth={2.5} />
            ) : (
              <Bot size={24} color="white" strokeWidth={2} />
            )}
          </span>

          {/* Status dot */}
          {!open && (
            <span
              className="absolute -top-0.5 -right-0.5 z-20 w-3.5 h-3.5 rounded-full"
              style={{
                background: "#22c55e",
                border: "2.5px solid hsl(210 55% 6%)",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
          )}
        </button>

        {!open && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest select-none shadow-md backdrop-blur-md"
            style={{
              background: "hsl(210 60% 8% / 0.85)",
              border: "1px solid hsl(var(--p) / 0.3)",
              color: "hsl(var(--p))",
            }}
          >
            Ask AI
          </span>
        )}
      </div>

      {/* ── Chat / Terminal Window ── */}
      {open && (
        <div
          className="fixed bottom-28 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "min(400px, calc(100vw - 2.5rem))",
            height: "min(580px, calc(100vh - 9rem))",
            background: G.bgCard,
            border: `1px solid ${G.borderH}`,
            boxShadow: `0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${G.glow}`,
            animation: "chatIn .28s cubic-bezier(.34,1.4,.64,1) both",
          }}
        >
          {/* Header with Mode Toggle */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: G.bg, borderBottom: `1px solid ${G.border}` }}
          >
            <div
              className="relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: G.grad,
                boxShadow: `0 0 16px hsl(var(--p) / 0.4)`,
              }}
            >
              {mode === "chat" ? (
                <Bot size={16} color="white" />
              ) : (
                <Terminal size={16} color="white" />
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                style={{ background: G.bright, border: `2.5px solid ${G.bgCard}` }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold font-syne truncate" style={{ color: G.text }}>
                {settings.assistantName}
              </p>
              {/* Mode switch pills */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setMode("chat");
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
                    mode === "chat"
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <MessageSquare size={10} /> Chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTick();
                    setMode("terminal");
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 transition-all ${
                    mode === "terminal"
                      ? "bg-white/15 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <Terminal size={10} /> CLI
                </button>
              </div>
            </div>

            <button
              onClick={reset}
              title="Reset"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-white/40 hover:text-white"
            >
              <RotateCcw size={13} />
            </button>

            <button
              onClick={() => {
                sound.playPop();
                setOpen(false);
              }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-white/40 hover:text-white"
            >
              <ChevronDown size={15} />
            </button>
          </div>

          {/* Mode 1: Conversational Chat */}
          {mode === "chat" ? (
            <>
              <div
                className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
                style={{ scrollbarWidth: "thin" }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                    style={{
                      animation: i === messages.length - 1 ? "msgIn .2s ease both" : "none",
                    }}
                  >
                    <div
                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center mt-0.5"
                      style={
                        msg.role === "assistant"
                          ? { background: G.grad }
                          : { background: "hsl(210 60% 18%)" }
                      }
                    >
                      {msg.role === "assistant" ? (
                        <Bot size={11} color="white" />
                      ) : (
                        <User size={11} color="white" />
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 max-w-[80%]">
                      <div
                        className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                        style={
                          msg.role === "assistant"
                            ? {
                                background: G.bg,
                                border: `1px solid ${G.border}`,
                                color: G.text,
                                borderRadius: "4px 16px 16px 16px",
                              }
                            : {
                                background: G.grad,
                                color: "hsl(210 100% 4%)",
                                fontWeight: 600,
                                borderRadius: "16px 4px 16px 16px",
                                boxShadow: `0 2px 14px hsl(var(--p) / 0.3)`,
                              }
                        }
                      >
                        {msg.content}
                      </div>
                      <p
                        className={`text-[10px] px-1 ${
                          msg.role === "user" ? "text-right" : ""
                        }`}
                        style={{ color: G.faint }}
                      >
                        {fmt(msg.ts)}
                      </p>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-2.5">
                    <div
                      className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{ background: G.grad }}
                    >
                      <Bot size={11} color="white" />
                    </div>
                    <div
                      className="px-4 py-3.5 flex items-center gap-1.5"
                      style={{
                        background: G.bg,
                        border: `1px solid ${G.border}`,
                        borderRadius: "4px 16px 16px 16px",
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: G.mid,
                            animation: `dot 1.2s ease ${i * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {messages.length === 1 && !loading && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <p
                      className="text-[11px] font-semibold px-0.5 uppercase tracking-wider flex items-center gap-1 font-syne"
                      style={{ color: G.faint }}
                    >
                      <Sparkles size={11} /> Suggested prompts
                    </p>
                    {SUGGESTED.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        className="text-left px-3.5 py-2 rounded-xl text-xs font-medium transition-all hover:scale-[1.015] active:scale-[0.98]"
                        style={{
                          background: G.bg,
                          border: `1px solid ${G.border}`,
                          color: G.bright,
                        }}
                      >
                        ↗ {q}
                      </button>
                    ))}
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {/* Chat Input */}
              <div
                className="px-3 pb-3 pt-2 shrink-0"
                style={{ borderTop: `1px solid ${G.border}`, background: G.bg }}
              >
                <div
                  className="flex items-end gap-2 px-3 py-2 rounded-xl"
                  style={{ background: G.bgInput, border: `1px solid ${G.border}` }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask about projects, stack, or experience…"
                    rows={1}
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm outline-none resize-none"
                    style={{
                      maxHeight: "80px",
                      lineHeight: "1.5",
                      color: G.text,
                      caretColor: G.mid,
                    }}
                  />
                  <button
                    onClick={() => ask(input)}
                    disabled={loading || !input.trim()}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all disabled:opacity-25 hover:scale-110 active:scale-95"
                    style={{
                      background: input.trim() && !loading ? G.grad : "transparent",
                    }}
                  >
                    {loading ? (
                      <Loader2 size={14} color={G.mid} className="animate-spin" />
                    ) : (
                      <Send
                        size={14}
                        color={input.trim() ? "hsl(210 100% 4%)" : G.faint}
                      />
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] mt-1.5" style={{ color: G.faint }}>
                  Enter to send · Shift+Enter for newline
                </p>
              </div>
            </>
          ) : (
            /* Mode 2: Interactive Terminal CLI */
            <div className="flex-1 flex flex-col font-mono text-xs overflow-hidden bg-black/50 p-3">
              <div
                className="flex-1 overflow-y-auto space-y-2 select-text"
                style={{ scrollbarWidth: "thin" }}
              >
                {termLogs.map((log) => (
                  <div key={log.id} className="space-y-1">
                    <p className="flex items-center gap-1.5 text-white/50">
                      <span style={{ color: "hsl(var(--p))" }}>guest@portfolio:~$</span>
                      <span className="text-white font-medium">{log.cmd}</span>
                    </p>
                    <pre className="text-white/80 whitespace-pre-wrap pl-2 leading-relaxed">
                      {log.output}
                    </pre>
                  </div>
                ))}
                <div ref={termBottomRef} />
              </div>

              {/* CLI Command Line */}
              <form
                onSubmit={handleTerminalCommand}
                className="flex items-center gap-2 pt-2 border-t border-white/10 shrink-0"
              >
                <span style={{ color: "hsl(var(--p))" }} className="font-bold">
                  $
                </span>
                <input
                  ref={termInputRef}
                  value={termInput}
                  onChange={(e) => setTermInput(e.target.value)}
                  placeholder="Type 'help', 'whoami', 'stack'..."
                  className="flex-1 bg-transparent text-white placeholder-white/20 outline-none font-mono text-xs"
                />
              </form>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes chatIn {
          from { opacity:0; transform:translateY(14px) scale(.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes msgIn {
          from { opacity:0; transform:translateY(5px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dot {
          0%,60%,100% { transform:translateY(0); opacity:.35; }
          30%          { transform:translateY(-4px); opacity:1; }
        }
        @keyframes aiPulse {
          0%   { transform:scale(1);   opacity:.6; }
          70%  { transform:scale(1.9); opacity:0; }
          100% { transform:scale(1.9); opacity:0; }
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
