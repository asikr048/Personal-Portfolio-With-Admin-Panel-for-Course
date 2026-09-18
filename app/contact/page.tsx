"use client";
import { useState } from "react";
import {
  Send,
  Mail,
  Github,
  Linkedin,
  Twitter,
  MapPin,
  Instagram,
  Youtube,
  Dribbble,
  Globe,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import GlassCard from "@/components/GlassCard";
import { sound } from "@/lib/sound";

export default function ContactPage() {
  const cfg = useSiteConfig();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socials = [
    { icon: Github, label: "GitHub", href: cfg.github },
    { icon: Linkedin, label: "LinkedIn", href: cfg.linkedin },
    { icon: Twitter, label: "Twitter", href: cfg.twitter },
    { icon: Instagram, label: "Instagram", href: cfg.instagram },
    { icon: Youtube, label: "YouTube", href: cfg.youtube },
    { icon: Dribbble, label: "Dribbble", href: cfg.dribbble },
    { icon: Globe, label: "Website", href: cfg.website },
  ].filter((s) => s.href);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all fields before sending.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      sound.playSuccess();
      setSent(true);
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      sound.playClick();
      setError(err instanceof Error ? err.message : "Failed to deliver message. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleMailtoFallback() {
    const subject = `Direct Contact from ${form.name || "Portfolio Visitor"}`;
    const body = `${form.message}\n\n— ${form.name} (${form.email})`;
    window.location.href = `mailto:${cfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      body
    )}`;
  }

  return (
    <main className="h-screen w-screen flex items-center justify-center md:pl-20 px-4 pb-20 md:pb-4 pt-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-5 gap-4 fade-up">
        {/* Left info panel */}
        <GlassCard className="md:col-span-2 rounded-2xl p-6 flex flex-col justify-between gap-6" depth={6}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1 font-syne" style={{ color: "hsl(var(--p))" }}>
              Get in touch
            </p>
            <h1 className="text-2xl font-bold font-syne text-white leading-tight">
              Let&apos;s build
              <br />
              something together
            </h1>
            <p className="text-white/40 text-xs mt-3 leading-relaxed">
              Whether you have a project in mind, a question, or just want to say hi — my inbox is always open.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {cfg.email && (
              <a
                href={`mailto:${cfg.email}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                style={{ background: "hsl(var(--p) / 0.06)", border: "1px solid hsl(var(--p) / 0.12)" }}
              >
                <Mail size={15} style={{ color: "hsl(var(--p))" }} />
                <span className="text-white/60 text-xs">{cfg.email}</span>
              </a>
            )}
            {cfg.location && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: "hsl(var(--p) / 0.04)", border: "1px solid hsl(var(--p) / 0.08)" }}
              >
                <MapPin size={15} style={{ color: "hsl(var(--p))" }} />
                <span className="text-white/40 text-xs">{cfg.location}</span>
              </div>
            )}
            {cfg.resumeURL && (
              <a
                href={cfg.resumeURL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.01]"
                style={{ background: "hsl(var(--p) / 0.06)", border: "1px solid hsl(var(--p) / 0.12)" }}
              >
                <FileText size={15} style={{ color: "hsl(var(--p))" }} />
                <span className="text-white/60 text-xs">Download resume / CV</span>
              </a>
            )}
          </div>

          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: "hsl(var(--p) / 0.08)",
                    color: "hsl(var(--p))",
                    border: "1px solid hsl(var(--p) / 0.15)",
                  }}
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Contact form */}
        <GlassCard className="md:col-span-3 rounded-2xl p-6" depth={10}>
          {sent ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-8">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "hsl(var(--p) / 0.12)",
                  border: "1px solid hsl(var(--p) / 0.3)",
                  boxShadow: "0 0 30px hsl(var(--p) / 0.2)",
                }}
              >
                <CheckCircle2 size={32} style={{ color: "hsl(var(--p))" }} />
              </div>
              <h2 className="text-white font-semibold font-syne text-lg mt-2">Message Sent Directly!</h2>
              <p className="text-white/50 text-xs max-w-sm leading-relaxed">
                Thank you for reaching out! Your message was delivered directly to my private admin inbox. I will get back to you soon.
              </p>
              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setSent(false);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                  style={{
                    background: "hsl(var(--p) / 0.12)",
                    color: "hsl(var(--p))",
                    border: "1px solid hsl(var(--p) / 0.25)",
                  }}
                >
                  Send another message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 h-full">
              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-400"
                  style={{ background: "hsl(0 80% 10% / 0.6)", border: "1px solid hsl(0 80% 50% / 0.3)" }}
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    disabled={sending}
                    className="px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all disabled:opacity-50"
                    style={{
                      background: "hsl(210 60% 6% / 0.8)",
                      border: "1px solid hsl(var(--p) / 0.12)",
                      caretColor: "hsl(var(--p))",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.35)")}
                    onBlur={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.12)")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="your@email.com"
                    disabled={sending}
                    className="px-3.5 py-2.5 rounded-xl text-sm text-white outline-none transition-all disabled:opacity-50"
                    style={{
                      background: "hsl(210 60% 6% / 0.8)",
                      border: "1px solid hsl(var(--p) / 0.12)",
                      caretColor: "hsl(var(--p))",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.35)")}
                    onBlur={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.12)")}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-white/35 text-xs uppercase tracking-wider font-syne">Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Tell me about your project, idea, or just say hi..."
                  rows={6}
                  disabled={sending}
                  className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-white outline-none resize-none transition-all disabled:opacity-50"
                  style={{
                    background: "hsl(210 60% 6% / 0.8)",
                    border: "1px solid hsl(var(--p) / 0.12)",
                    caretColor: "hsl(var(--p))",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.35)")}
                  onBlur={(e) => (e.target.style.borderColor = "hsl(var(--p) / 0.12)")}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] font-syne disabled:opacity-60 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--p)), hsl(var(--p2)))",
                    color: "hsl(210 100% 4%)",
                    boxShadow: "0 4px 24px hsl(var(--p) / 0.25)",
                  }}
                >
                  {sending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Delivering message...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Send message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}
