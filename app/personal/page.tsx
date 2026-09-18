"use client";
import { useEffect, useState } from "react";
import {
  MapPin, Mail, Phone, Github, Linkedin, Twitter, Instagram,
  Youtube, Dribbble, Globe, FileText,
  GraduationCap, Briefcase, Award, Code2, Zap, Users, Star,
  Heart, Languages, Sparkles, Pencil, Calendar, Sun, Moon,
  Navigation, Building2, Clock, ArrowUpRight
} from "lucide-react";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import GlassCard, { CARD_PALETTE } from "@/components/GlassCard";
import TiltCard from "@/components/TiltCard";
import { highlightIcon, type HighlightsData } from "@/lib/highlightIcons";
import { sound } from "@/lib/sound";

interface SkillGroup { name: string; items: string[]; }
interface SkillsData { groups: SkillGroup[]; }

interface CareerItem { id: string; type: string; title: string; org: string; years: string; }
interface CareerSection { title: string; items: CareerItem[]; }
interface CareerData { intro?: string; sections: CareerSection[]; }

// ── Count-up animation ──
function Counter({ value }: { value: string }) {
  const parts = value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/);
  const [shown, setShown] = useState(parts ? "0" : value);

  useEffect(() => {
    if (!parts) { setShown(value); return; }
    const target = parseFloat(parts[2]);
    const decimals = parts[2].includes(".") ? 1 : 0;
    const dur = 1200;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown((target * eased).toFixed(decimals));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!parts) return <>{value}</>;
  return <>{parts[1]}{shown}{parts[3]}</>;
}

// ── Local time clock hook ──
function useLocalTime(timezone?: string) {
  const [time, setTime] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function LocalTimeBadge({ location, timezone }: { location?: string; timezone?: string }) {
  const now = useLocalTime(timezone);
  const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: tz, hour12: true });
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: tz });
  const hour = parseInt(now.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false, timeZone: tz }));
  const isDaytime = hour >= 6 && hour < 20;
  const tzShort = (() => {
    try {
      return new Intl.DateTimeFormat("en", { timeZoneName: "short", timeZone: tz }).formatToParts(now).find(p => p.type === "timeZoneName")?.value ?? tz;
    } catch {
      return tz;
    }
  })();

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(210 60% 8% / 0.8), hsl(210 60% 5% / 0.6))",
        border: "1px solid hsl(var(--p) / 0.2)",
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3.5 py-2.5"
        style={{ borderBottom: "1px solid hsl(var(--p) / 0.1)", background: "hsl(var(--p) / 0.06)" }}
      >
        <div className="flex items-center gap-1.5">
          <Navigation size={11} style={{ color: "hsl(var(--p))" }} />
          <span className="text-[10px] uppercase tracking-widest font-syne font-bold" style={{ color: "hsl(var(--p))" }}>
            Local Time &amp; Zone
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isDaytime ? (
            <Sun size={12} style={{ color: "#f59e0b" }} />
          ) : (
            <Moon size={12} style={{ color: "#818cf8" }} />
          )}
          <span className="text-[10px] font-medium" style={{ color: isDaytime ? "#f59e0b" : "#818cf8" }}>
            {isDaytime ? "Daytime" : "Nighttime"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col gap-3">
        {/* Location name */}
        {location && (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "hsl(var(--p) / 0.12)", border: "1px solid hsl(var(--p) / 0.2)" }}
            >
              <MapPin size={12} style={{ color: "hsl(var(--p))" }} />
            </div>
            <span className="text-white/80 text-xs font-medium">{location}</span>
          </div>
        )}

        {/* Time display */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-white font-bold text-2xl font-syne leading-none tracking-tight">
              {timeStr}
            </p>
            <p className="text-white/40 text-[10px] mt-1.5 flex items-center gap-1">
              <Calendar size={10} />
              {dateStr}
            </p>
          </div>
          <div className="text-right">
            <div
              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium"
              style={{
                background: "hsl(var(--p) / 0.12)",
                color: "hsl(var(--p))",
                border: "1px solid hsl(var(--p) / 0.25)",
              }}
            >
              {tzShort}
            </div>
          </div>
        </div>

        {/* Day progress bar */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-white/30 uppercase tracking-wider font-syne">Day progress</span>
            <span className="text-white/40 font-mono">
              {Math.round(((hour * 60 + now.getMinutes()) / 1440) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(210 60% 12%)" }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${((hour * 60 + now.getMinutes()) / 1440) * 100}%`,
                background: isDaytime
                  ? "linear-gradient(90deg, hsl(185 100% 48%), hsl(45 95% 55%))"
                  : "linear-gradient(90deg, hsl(205 90% 56%), hsl(270 80% 65%))",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const TYPE_ICON: Record<string, typeof Briefcase> = {
  "Bachelor": GraduationCap,
  "Master": GraduationCap,
  "Full-Time": Briefcase,
  "Intern": Code2,
  "Certificate": Award,
  "Freelance": Users,
};

export default function PersonalPage() {
  const cfg = useSiteConfig();
  const [skills, setSkills] = useState<SkillsData | null>(null);
  const [career, setCareer] = useState<CareerData | null>(null);
  const [highlights, setHighlights] = useState<HighlightsData | null>(null);

  useEffect(() => {
    fetch("/api/skills").then((r) => r.json()).then(setSkills).catch(() => {});
    fetch("/api/career").then((r) => r.json()).then(setCareer).catch(() => {});
    fetch("/api/highlights").then((r) => r.json()).then(setHighlights).catch(() => {});
  }, []);

  const socials = [
    { icon: Github,    label: "GitHub",    href: cfg.github },
    { icon: Linkedin,  label: "LinkedIn",  href: cfg.linkedin },
    { icon: Twitter,   label: "Twitter",   href: cfg.twitter },
    { icon: Instagram, label: "Instagram", href: cfg.instagram },
    { icon: Youtube,   label: "YouTube",   href: cfg.youtube },
    { icon: Dribbble,  label: "Dribbble",  href: cfg.dribbble },
    { icon: Globe,     label: "Website",   href: cfg.website },
  ].filter((c) => c.href);

  const stats = (cfg.stats ?? []).filter((s) => s.value || s.label);

  // Flatten all career items into a single timeline
  const timeline =
    career?.sections.flatMap((sec) =>
      sec.items.map((item) => ({ ...item, section: sec.title }))
    ) ?? [];

  return (
    <main className="h-screen w-screen overflow-y-auto md:pl-20 px-4 pb-28 md:pb-16 pt-8 relative">
      <div className="max-w-6xl mx-auto fade-up space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1 font-syne" style={{ color: "hsl(var(--p))" }}>
              Profile &amp; Biography
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold font-syne text-white">
              Personal
            </h1>
          </div>

          {/* Admin link */}
          <a
            href="/admin/dashboard"
            onClick={() => sound.playClick()}
            title="Edit in Admin Panel"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-syne transition-all duration-200 hover:scale-105"
            style={{
              background: "hsl(var(--p) / 0.1)",
              border: "1px solid hsl(var(--p) / 0.25)",
              color: "hsl(var(--p))",
            }}
          >
            <Pencil size={12} /> Edit Profile
          </a>
        </div>

        {/* ── 1. Top Profile Hero Bento Banner ── */}
        <GlassCard className="rounded-3xl p-6 sm:p-8" depth={4}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

            {/* Left: Avatar + Bio details */}
            <div className="lg:col-span-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
              {/* Avatar */}
              <div
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shrink-0 shadow-xl"
                style={{
                  border: "2px solid hsl(var(--p) / 0.35)",
                  background: "hsl(210 60% 10%)",
                  boxShadow: "0 0 30px hsl(var(--p) / 0.15)",
                }}
              >
                {cfg.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cfg.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: cfg.photoFocus }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🧑‍💻</div>
                )}
              </div>

              {/* Identity & Text */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-white font-extrabold text-2xl sm:text-3xl font-syne leading-tight">
                    {cfg.heroTitle}
                  </h2>

                  {/* Availability badge */}
                  {(() => {
                    const color =
                      cfg.availabilityColor === "amber"
                        ? { bg: "hsl(40 96% 54% / 0.12)", border: "hsl(40 96% 54% / 0.3)", dot: "#f59e0b" }
                        : cfg.availabilityColor === "red"
                        ? { bg: "hsl(0 84% 60% / 0.12)", border: "hsl(0 84% 60% / 0.3)", dot: "#ef4444" }
                        : { bg: "hsl(142 70% 45% / 0.12)", border: "hsl(142 70% 45% / 0.3)", dot: "#22c55e" };
                    return (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                        style={{ background: color.bg, border: `1px solid ${color.border}` }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: color.dot, boxShadow: `0 0 6px ${color.dot}` }}
                        />
                        <span className="text-white/80">{cfg.availabilityStatus || "Open to work"}</span>
                      </span>
                    );
                  })()}
                </div>

                <p className="text-sm font-semibold font-syne" style={{ color: "hsl(var(--p))" }}>
                  {cfg.heroSubtitle}
                </p>

                {cfg.aboutText && (
                  <p className="text-white/55 text-xs sm:text-sm leading-relaxed max-w-2xl pt-1">
                    {cfg.aboutText}
                  </p>
                )}

                {/* Socials and actions row */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  {cfg.email && (
                    <a
                      href={`mailto:${cfg.email}`}
                      onClick={() => sound.playClick()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                      style={{
                        background: "hsl(var(--p) / 0.15)",
                        color: "hsl(var(--p))",
                        border: "1px solid hsl(var(--p) / 0.3)",
                      }}
                    >
                      <Mail size={13} /> {cfg.email}
                    </a>
                  )}

                  {cfg.resumeURL && (
                    <a
                      href={cfg.resumeURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => sound.playPop()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105 text-white/80 hover:text-white"
                      style={{
                        background: "hsl(0 0% 100% / 0.05)",
                        border: "1px solid hsl(0 0% 100% / 0.12)",
                      }}
                    >
                      <FileText size={13} /> Resume <ArrowUpRight size={12} />
                    </a>
                  )}

                  {socials.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={label}
                      onClick={() => sound.playClick()}
                      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                      style={{
                        background: "hsl(0 0% 100% / 0.04)",
                        color: "hsl(var(--p))",
                        border: "1px solid hsl(var(--p) / 0.18)",
                      }}
                    >
                      <Icon size={14} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Live Location & Time Widget */}
            <div className="lg:col-span-4 w-full">
              <LocalTimeBadge location={cfg.location} />
            </div>

          </div>
        </GlassCard>

        {/* ── 2. Key Stats Milestone Strip (Tilt Cards) ── */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {[
              { icon: Star,      color: CARD_PALETTE[0] },
              { icon: Briefcase, color: CARD_PALETTE[1] },
              { icon: Users,     color: CARD_PALETTE[2] },
              { icon: Zap,       color: CARD_PALETTE[4] },
            ].slice(0, stats.length).map(({ icon: Icon, color }, i) => (
              <TiltCard key={i} maxTilt={7} className="h-full">
                <div
                  className="rounded-2xl p-5 text-center h-full flex flex-col justify-center items-center"
                  style={{
                    background: `linear-gradient(150deg, hsl(${color} / 0.1), hsl(210 60% 8% / 0.55))`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid hsl(${color} / 0.22)`,
                    boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 20px hsl(${color} / 0.08)`,
                  }}
                >
                  <Icon size={17} className="mb-1.5" style={{ color: `hsl(${color})` }} />
                  <p className="font-syne font-extrabold text-2xl sm:text-3xl text-glow" style={{ color: `hsl(${color})` }}>
                    <Counter value={stats[i].value} />
                  </p>
                  <p className="text-white/45 text-xs mt-1 font-medium leading-tight">
                    {stats[i].label}
                  </p>
                </div>
              </TiltCard>
            ))}
          </div>
        )}

        {/* ── 3. Balanced Two-Column Bento Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ──── Left Column: Career & Skills (7 cols) ──── */}
          <div className="lg:col-span-7 flex flex-col gap-6">

            {/* Career & Education Timeline */}
            {timeline.length > 0 ? (
              <GlassCard className="rounded-3xl p-6 sm:p-7" depth={4}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-syne" style={{ color: "hsl(var(--p))" }}>
                      Experience &amp; Education
                    </p>
                    <h3 className="text-xl font-bold font-syne text-white mt-1">
                      Career Journey
                    </h3>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-mono"
                    style={{
                      background: "hsl(var(--p) / 0.1)",
                      color: "hsl(var(--p))",
                      border: "1px solid hsl(var(--p) / 0.2)",
                    }}
                  >
                    {timeline.length} Milestones
                  </span>
                </div>

                <div className="relative flex flex-col gap-0 pl-2">
                  {/* Vertical connecting line */}
                  <div
                    className="absolute left-[22px] top-3 bottom-4 w-px"
                    style={{
                      background: "linear-gradient(180deg, hsl(var(--p) / 0.6), hsl(var(--p2) / 0.15))",
                    }}
                  />

                  {timeline.map((item, i) => {
                    const Icon = TYPE_ICON[item.type] ?? Briefcase;
                    const accent = CARD_PALETTE[i % CARD_PALETTE.length];
                    return (
                      <div key={item.id} className="relative flex items-start gap-4 pb-6 last:pb-0 group">
                        {/* Dot / Icon badge */}
                        <div
                          className="relative z-10 shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                          style={{
                            background: `hsl(${accent} / 0.18)`,
                            border: `1px solid hsl(${accent} / 0.4)`,
                            boxShadow: `0 0 16px hsl(${accent} / 0.2)`,
                          }}
                        >
                          <Icon size={16} style={{ color: `hsl(${accent})` }} />
                        </div>

                        {/* Content box */}
                        <div
                          className="flex-1 rounded-2xl p-4 transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            background: `hsl(${accent} / 0.05)`,
                            border: `1px solid hsl(${accent} / 0.14)`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <p className="text-white font-bold text-sm font-syne leading-tight">
                                {item.title}
                              </p>
                              <p className="text-white/50 text-xs mt-1">
                                {item.org}
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  style={{ background: `hsl(${accent} / 0.15)`, color: `hsl(${accent})` }}>
                                  {item.type}
                                </span>
                              </p>
                            </div>
                            <span
                              className="text-[10px] px-2.5 py-1 rounded-full font-mono font-medium shrink-0"
                              style={{
                                background: `hsl(${accent} / 0.15)`,
                                color: `hsl(${accent})`,
                                border: `1px solid hsl(${accent} / 0.25)`,
                              }}
                            >
                              {item.years}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            ) : null}

            {/* Technical Skills & Expertise */}
            {skills?.groups && skills.groups.length > 0 && (
              <GlassCard className="rounded-3xl p-6 sm:p-7" depth={4}>
                <div className="mb-5">
                  <p className="text-xs uppercase tracking-widest font-syne" style={{ color: "hsl(var(--p))" }}>
                    Expertise
                  </p>
                  <h3 className="text-xl font-bold font-syne text-white mt-1">
                    Skills &amp; Technologies
                  </h3>
                </div>

                <div className="space-y-4">
                  {skills.groups.map((group, gi) => {
                    const accent = CARD_PALETTE[gi % CARD_PALETTE.length];
                    return (
                      <div key={group.name} className="space-y-2">
                        <p className="text-xs uppercase tracking-wider font-syne font-semibold" style={{ color: `hsl(${accent})` }}>
                          {group.name}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((skill) => (
                            <span
                              key={skill}
                              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:scale-105 cursor-default"
                              style={{
                                background: `hsl(${accent} / 0.1)`,
                                color: "hsl(195 75% 88%)",
                                border: `1px solid hsl(${accent} / 0.22)`,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

          </div>

          {/* ──── Right Column: Highlights, Traits, Languages & Quick Contact (5 cols) ──── */}
          <div className="lg:col-span-5 flex flex-col gap-6">

            {/* Beyond Code / Highlights */}
            {highlights && highlights.items.length > 0 && (
              <GlassCard className="rounded-3xl p-6" depth={4}>
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-widest font-syne flex items-center gap-1.5" style={{ color: "hsl(var(--p))" }}>
                    <Sparkles size={12} /> {highlights.title || "Beyond Code"}
                  </p>
                  {highlights.intro && (
                    <p className="text-white/50 text-xs mt-1 leading-relaxed">
                      {highlights.intro}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {highlights.items.map((item, i) => {
                    const accent = CARD_PALETTE[i % CARD_PALETTE.length];
                    const Icon = highlightIcon(item.icon);
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl p-3.5 flex items-start gap-3 transition-all hover:scale-[1.02]"
                        style={{
                          background: `linear-gradient(150deg, hsl(${accent} / 0.1), hsl(210 60% 8% / 0.5))`,
                          border: `1px solid hsl(${accent} / 0.22)`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            background: `hsl(${accent} / 0.16)`,
                            border: `1px solid hsl(${accent} / 0.35)`,
                            color: `hsl(${accent})`,
                          }}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-xs font-syne leading-tight">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-white/45 text-[11px] mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Currently Working On */}
            {cfg.currentlyWorkingOn && (
              <GlassCard className="rounded-3xl p-5" depth={4}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} style={{ color: "hsl(var(--p))" }} />
                  <p className="text-xs uppercase tracking-wider font-syne font-bold" style={{ color: "hsl(var(--p))" }}>
                    Current Focus
                  </p>
                </div>
                <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
                  {cfg.currentlyWorkingOn}
                </p>
              </GlassCard>
            )}

            {/* Personal Traits & Interests */}
            {(cfg.personalityTags || cfg.interests) && (
              <GlassCard className="rounded-3xl p-5 space-y-4" depth={4}>
                {cfg.personalityTags && (
                  <div>
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-syne mb-2 flex items-center gap-1.5 font-bold">
                      <Star size={11} style={{ color: "hsl(var(--p))" }} /> Personal Traits
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cfg.personalityTags.split(",").map((t) => t.trim()).filter(Boolean).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                          style={{
                            background: "hsl(var(--p) / 0.08)",
                            color: "hsl(var(--p))",
                            border: "1px solid hsl(var(--p) / 0.2)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {cfg.interests && (
                  <div>
                    <p className="text-white/35 text-[10px] uppercase tracking-widest font-syne mb-2 flex items-center gap-1.5 font-bold">
                      <Heart size={11} style={{ color: "hsl(330 85% 62%)" }} /> Interests &amp; Passions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cfg.interests.split(",").map((t) => t.trim()).filter(Boolean).map((interest) => (
                        <span
                          key={interest}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
                          style={{
                            background: "hsl(330 85% 62% / 0.08)",
                            color: "hsl(330 85% 72%)",
                            border: "1px solid hsl(330 85% 62% / 0.2)",
                          }}
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Languages */}
            {cfg.languages && (
              <GlassCard className="rounded-3xl p-5" depth={4}>
                <p className="text-white/35 text-[10px] uppercase tracking-widest font-syne mb-3 flex items-center gap-1.5 font-bold">
                  <Languages size={11} style={{ color: "hsl(var(--p))" }} /> Languages
                </p>
                <div className="flex flex-col gap-2">
                  {cfg.languages.split(",").map((l) => l.trim()).filter(Boolean).map((lang) => {
                    const [name, ...rest] = lang.split("(");
                    const level = rest.join("(").replace(")", "").trim();
                    return (
                      <div
                        key={lang}
                        className="flex items-center justify-between px-3.5 py-2 rounded-xl"
                        style={{
                          background: "hsl(var(--p) / 0.06)",
                          border: "1px solid hsl(var(--p) / 0.12)",
                        }}
                      >
                        <span className="text-white/80 text-xs font-medium">{name.trim()}</span>
                        {level && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium"
                            style={{ background: "hsl(var(--p) / 0.15)", color: "hsl(var(--p))" }}
                          >
                            {level}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            )}

            {/* Quick Contact & Details Card */}
            <GlassCard className="rounded-3xl p-5" depth={4}>
              <p className="text-xs uppercase tracking-wider font-syne font-bold mb-3" style={{ color: "hsl(var(--p))" }}>
                Direct Contact
              </p>

              <div className="space-y-2.5">
                {cfg.email && (
                  <a
                    href={`mailto:${cfg.email}`}
                    onClick={() => sound.playClick()}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: "hsl(0 0% 100% / 0.03)",
                      border: "1px solid hsl(var(--p) / 0.14)",
                    }}
                  >
                    <Mail size={14} style={{ color: "hsl(var(--p))" }} />
                    <span className="text-white/70 text-xs truncate flex-1">{cfg.email}</span>
                  </a>
                )}

                {cfg.phone && (
                  <a
                    href={`tel:${cfg.phone}`}
                    onClick={() => sound.playClick()}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
                    style={{
                      background: "hsl(0 0% 100% / 0.03)",
                      border: "1px solid hsl(var(--p) / 0.14)",
                    }}
                  >
                    <Phone size={14} style={{ color: "hsl(var(--p))" }} />
                    <span className="text-white/70 text-xs truncate flex-1">{cfg.phone}</span>
                  </a>
                )}

                {cfg.location && (
                  <div
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl"
                    style={{
                      background: "hsl(0 0% 100% / 0.02)",
                      border: "1px solid hsl(0 0% 100% / 0.06)",
                    }}
                  >
                    <Building2 size={14} style={{ color: "hsl(var(--p))" }} />
                    <span className="text-white/50 text-xs">{cfg.location}</span>
                  </div>
                )}
              </div>
            </GlassCard>

          </div>

        </div>

      </div>
    </main>
  );
}
