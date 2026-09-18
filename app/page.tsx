"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Download, MapPin, ChevronDown, Sparkles,
  Github, Linkedin, Twitter, Instagram, Youtube, Dribbble, Globe, Mail, Settings2, Clock,
  ArrowUpRight, ExternalLink, Code2, Palette, Lightbulb, Zap, CheckCircle2, Quote, Copy, ChevronUp, Star
} from "lucide-react";
import { toast } from "sonner";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import type { Stat } from "@/lib/siteConfig";
import HeroCanvas from "@/components/HeroCanvas";
import TiltCard from "@/components/TiltCard";
import { sound } from "@/lib/sound";
import { getPlainExcerpt } from "@/lib/utils";

interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  tech: string[];
  year: string;
  link: string;
  imageURL: string;
  featured: boolean;
  focus?: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar?: string;
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  Code: Code2,
  Palette: Palette,
  Lightbulb: Lightbulb,
  Zap: Zap,
  Globe: Globe,
};

const PALETTE = [
  "185 100% 48%",
  "205 90% 56%",
  "32 95% 55%",
  "150 78% 45%",
  "270 80% 65%",
  "330 85% 62%",
];

// ── Typing animation through the configured roles ──
function Typing({ source }: { source: string }) {
  const words = useMemo(
    () => source.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
    [source],
  );
  const [text, setText] = useState("");
  const [wi, setWi] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;
    const word = words[wi % words.length];
    let delay = del ? 45 : 90;
    if (!del && text === word) delay = 1500;
    if (del && text === "") delay = 350;
    const t = setTimeout(() => {
      if (!del && text === word) { setDel(true); return; }
      if (del && text === "") { setDel(false); setWi((v) => (v + 1) % words.length); return; }
      setText(word.slice(0, del ? text.length - 1 : text.length + 1));
    }, delay);
    return () => clearTimeout(t);
  }, [text, del, wi, words]);

  return (
    <span>
      {text}
      <span className="caret" style={{ color: "hsl(var(--p))" }}>|</span>
    </span>
  );
}

// ── Count-up number animation ──
function Counter({ value }: { value: string }) {
  const parts = useMemo(() => value.match(/^(\D*)(\d+(?:\.\d+)?)(.*)$/), [value]);
  const [shown, setShown] = useState(parts ? "0" : value);

  useEffect(() => {
    if (!parts) { setShown(value); return; }
    const target = parseFloat(parts[2]);
    const decimals = parts[2].includes(".") ? 1 : 0;
    const dur = 1400;
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
  }, [value, parts]);

  if (!parts) return <>{value}</>;
  return <>{parts[1]}{shown}{parts[3]}</>;
}

export default function HomePage() {
  const cfg = useSiteConfig();
  const [currentTime, setCurrentTime] = useState("");
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => {
        const items: Project[] = d.items ?? [];
        const featured = items.filter((p) => p.featured);
        setFeaturedProjects(featured.length > 0 ? featured.slice(0, 3) : items.slice(0, 3));
      })
      .catch(() => {});

    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => setServices((d.items ?? []).slice(0, 3)))
      .catch(() => {});

    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((d) => setTestimonials(d.items ?? []))
      .catch(() => {});
  }, []);

  const socials = [
    { href: cfg.github, icon: Github, label: "GitHub" },
    { href: cfg.linkedin, icon: Linkedin, label: "LinkedIn" },
    { href: cfg.twitter, icon: Twitter, label: "Twitter" },
    { href: cfg.instagram, icon: Instagram, label: "Instagram" },
    { href: cfg.youtube, icon: Youtube, label: "YouTube" },
    { href: cfg.dribbble, icon: Dribbble, label: "Dribbble" },
    { href: cfg.website, icon: Globe, label: "Website" },
  ].filter((s) => s.href);

  const stats: Stat[] = (cfg.stats ?? []).filter((s) => s.value || s.label);
  const tech = (cfg.techStack ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const copyEmail = () => {
    if (cfg.email && navigator.clipboard) {
      navigator.clipboard.writeText(cfg.email);
      sound.playSuccess();
      toast.success("Email address copied to clipboard!");
    }
  };

  const scrollToTop = () => {
    sound.playPop();
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="h-screen w-screen overflow-y-auto md:pl-16 relative scroll-smooth">
      {/* ─────────── 1. HERO SECTION ─────────── */}
      <section className="relative min-h-screen w-full flex flex-col justify-center px-5 sm:px-8 lg:px-16 pt-20 pb-20 overflow-hidden">
        {/* Interactive Particle Constellation Canvas */}
        <HeroCanvas />

        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-8 items-center">

          {/* Left — text */}
          <div className="flex flex-col gap-5 order-2 md:order-1 text-center md:text-left items-center md:items-start">
            {cfg.heroTagline && (
              <div
                className="rise inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium w-fit backdrop-blur-md"
                style={{
                  background: "hsl(var(--p) / 0.08)",
                  border: "1px solid hsl(var(--p) / 0.25)",
                  color: "hsl(var(--p))",
                  animationDelay: "0.05s",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full pulse-ring" style={{ background: "hsl(var(--p))" }} />
                {cfg.heroTagline}
              </div>
            )}

            <h1 className="rise font-syne font-extrabold leading-[1.05] text-4xl sm:text-5xl lg:text-6xl" style={{ animationDelay: "0.12s" }}>
              <span className="text-white/55 text-2xl sm:text-3xl lg:text-4xl font-bold block mb-1">Hi, I&apos;m</span>
              <span className="gradient-text">{cfg.heroTitle}</span>
            </h1>

            <div className="rise font-syne font-bold text-xl sm:text-2xl lg:text-3xl text-white/90 min-h-[1.4em]" style={{ animationDelay: "0.2s" }}>
              <Typing source={cfg.roles || cfg.heroSubtitle} />
            </div>

            {cfg.aboutText && (
              <p className="rise text-white/50 text-sm sm:text-base leading-relaxed max-w-lg" style={{ animationDelay: "0.28s" }}>
                {cfg.aboutText}
              </p>
            )}

            <div className="rise flex flex-wrap items-center gap-4 text-white/40 text-xs" style={{ animationDelay: "0.32s" }}>
              {cfg.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} style={{ color: "hsl(var(--p))" }} /> {cfg.location}
                </div>
              )}
              {currentTime && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/60">
                  <Clock size={12} style={{ color: "hsl(var(--p))" }} />
                  <span>{currentTime}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="rise flex flex-wrap gap-3 justify-center md:justify-start pt-1" style={{ animationDelay: "0.38s" }}>
              {cfg.ctaPrimaryText && (
                <Link
                  href={cfg.ctaPrimaryLink || "/projects"}
                  onClick={() => sound.playClick()}
                  data-cursor="Explore"
                  className="group flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    background: "linear-gradient(135deg,hsl(var(--p)),hsl(var(--p2)))",
                    color: "hsl(210 100% 4%)",
                    boxShadow: "0 8px 32px hsl(var(--p) / 0.35)",
                  }}
                >
                  {cfg.ctaPrimaryText}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </Link>
              )}
              {cfg.resumeURL && (
                <a
                  href={cfg.resumeURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playPop()}
                  data-cursor="Resume"
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    background: "hsl(var(--p) / 0.1)",
                    color: "hsl(var(--p))",
                    border: "1px solid hsl(var(--p) / 0.25)",
                  }}
                >
                  <Download size={15} /> Resume
                </a>
              )}
              {cfg.ctaSecondaryText && (
                <Link
                  href={cfg.ctaSecondaryLink || "/contact"}
                  onClick={() => sound.playClick()}
                  data-cursor="Connect"
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.03] active:scale-[0.98] text-white/70 hover:text-white"
                  style={{
                    border: "1px solid hsl(0 0% 100% / 0.14)",
                    background: "hsl(0 0% 100% / 0.03)",
                  }}
                >
                  <Mail size={15} /> {cfg.ctaSecondaryText}
                </Link>
              )}
            </div>

            {/* Socials */}
            {socials.length > 0 && (
              <div className="rise flex items-center gap-2.5 mt-1" style={{ animationDelay: "0.44s" }}>
                {socials.map(({ href, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={label}
                    onClick={() => sound.playClick()}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:-translate-y-0.5"
                    style={{
                      background: "hsl(var(--p) / 0.08)",
                      color: "hsl(var(--p))",
                      border: "1px solid hsl(var(--p) / 0.18)",
                    }}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            )}

            {/* Discreet admin link */}
            <Link
              href="/admin/login"
              title="Admin panel"
              onClick={() => sound.playClick()}
              className="rise opacity-20 hover:opacity-70 transition-opacity w-fit mt-1"
              style={{ animationDelay: "0.5s" }}
            >
              <Settings2 size={13} className="text-white/50" />
            </Link>
          </div>

          {/* Right — photo with luxury glowing ambient blob */}
          <div className="rise order-1 md:order-2 flex justify-center md:justify-end" style={{ animationDelay: "0.18s" }}>
            <div className="relative">
              {/* Radial glow */}
              <div
                className="absolute -inset-8 z-0 rounded-full blur-3xl opacity-45"
                style={{ background: "radial-gradient(circle, hsl(var(--p) / 0.6), transparent 70%)" }}
              />
              {/* Gradient blob ring */}
              <div
                className="blob relative z-10 p-[3px] floaty"
                style={{
                  background: "linear-gradient(135deg,hsl(var(--p)),hsl(var(--p2)))",
                  width: "min(72vw, 330px)",
                  height: "min(72vw, 330px)",
                  boxShadow: "0 0 50px hsl(var(--p) / 0.25)",
                }}
              >
                <div className="blob w-full h-full overflow-hidden" style={{ background: "hsl(210 60% 8%)" }}>
                  {cfg.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cfg.photoURL}
                      alt={cfg.heroTitle}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      style={{ objectPosition: cfg.photoFocus }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">🧑‍💻</div>
                  )}
                </div>
              </div>

              {/* Floating status badge */}
              <div
                className="absolute -bottom-2 -left-2 z-20 flex items-center gap-2 px-3.5 py-2 rounded-2xl floaty shadow-xl"
                style={{
                  background: "hsl(210 60% 8% / 0.88)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid hsl(var(--p) / 0.25)",
                  animationDelay: "1s",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#22c55e", boxShadow: "0 0 10px #22c55e" }}
                />
                <span className="text-white/80 text-xs font-medium font-syne">
                  {cfg.availabilityStatus || "Open to work"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex flex-col items-center justify-center pt-8 text-white/30 text-xs font-syne uppercase tracking-widest gap-2 select-none pointer-events-none">
          <span>Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border border-white/20 flex items-start justify-center p-1">
            <span className="w-1 h-2 rounded-full bg-white/60 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ─────────── 2. STATS WITH 3D TILT ─────────── */}
      {cfg.showStats && stats.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 pb-20 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const color = PALETTE[i % PALETTE.length];
              return (
                <TiltCard
                  key={i}
                  maxTilt={8}
                  className="rounded-2xl p-6 text-center h-full"
                  style={{
                    background: `linear-gradient(150deg, hsl(${color} / 0.08), hsl(210 60% 8% / 0.55))`,
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: `1px solid hsl(${color} / 0.22)`,
                    boxShadow: `0 10px 30px rgba(0,0,0,0.35), 0 0 20px hsl(${color} / 0.08)`,
                  }}
                >
                  <p className="font-syne font-extrabold text-3xl sm:text-4xl text-glow" style={{ color: `hsl(${color})` }}>
                    <Counter value={s.value} />
                  </p>
                  <p className="text-white/50 text-xs sm:text-sm mt-1.5 font-medium">{s.label}</p>
                </TiltCard>
              );
            })}
          </div>
        </section>
      )}

      {/* ─────────── 3. FEATURED WORK SHOWCASE ─────────── */}
      {featuredProjects.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 pb-24 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-syne mb-1 font-bold" style={{ color: "hsl(var(--p))" }}>
                  Selected Work
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold font-syne text-white">
                  Featured Projects
                </h2>
                <p className="text-white/45 text-sm mt-2 max-w-lg">
                  Hand-crafted applications and digital platforms engineered for performance and delight.
                </p>
              </div>

              <Link
                href="/projects"
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                style={{
                  background: "hsl(var(--p) / 0.1)",
                  border: "1px solid hsl(var(--p) / 0.25)",
                  color: "hsl(var(--p))",
                }}
              >
                View all projects <ArrowRight size={13} />
              </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map((p, i) => {
                const accent = PALETTE[i % PALETTE.length];
                return (
                  <TiltCard key={p.id} maxTilt={9} dataCursor="View" className="h-full">
                    <div
                      className="group rounded-2xl overflow-hidden h-full flex flex-col justify-between transition-all duration-300"
                      style={{
                        background: `linear-gradient(160deg, hsl(${accent} / 0.1), hsl(210 60% 7% / 0.65))`,
                        border: `1px solid hsl(${accent} / 0.25)`,
                        boxShadow: `0 15px 40px rgba(0,0,0,0.4), 0 0 20px hsl(${accent} / 0.08)`,
                      }}
                    >
                      {/* Image Preview */}
                      {p.imageURL ? (
                        <div className="relative w-full h-44 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageURL}
                            alt={p.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            style={{ objectPosition: p.focus || "50% 50%" }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,60%,7%)] via-transparent to-transparent opacity-80" />
                        </div>
                      ) : (
                        <div
                          className="w-full h-36 flex items-center justify-center"
                          style={{ background: `hsl(${accent} / 0.08)` }}
                        >
                          <Code2 size={36} style={{ color: `hsl(${accent})` }} />
                        </div>
                      )}

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] uppercase tracking-wider font-mono font-bold" style={{ color: `hsl(${accent})` }}>
                              {p.category} {p.year ? `· ${p.year}` : ""}
                            </span>
                            {p.featured && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                                ★ Featured
                              </span>
                            )}
                          </div>

                          <h3 className="text-white font-bold text-lg font-syne group-hover:text-white leading-tight">
                            {p.title}
                          </h3>

                          {p.description && (
                            <p className="text-white/45 text-xs mt-2 line-clamp-2 leading-relaxed">
                              {getPlainExcerpt(p.description)}
                            </p>
                          )}
                        </div>

                        {/* Tech tags & Link */}
                        <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {p.tech?.slice(0, 3).map((t) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-white/60">
                                {t}
                              </span>
                            ))}
                          </div>

                          {p.link ? (
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => sound.playClick()}
                              className="text-xs font-syne font-semibold flex items-center gap-1 hover:underline"
                              style={{ color: `hsl(${accent})` }}
                            >
                              Visit <ExternalLink size={12} />
                            </a>
                          ) : (
                            <Link
                              href="/projects"
                              onClick={() => sound.playClick()}
                              className="text-xs font-syne font-semibold flex items-center gap-1 hover:underline"
                              style={{ color: `hsl(${accent})` }}
                            >
                              Details <ArrowRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 4. SERVICES & EXPERTISE ─────────── */}
      {services.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 pb-24 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest font-syne mb-1 font-bold" style={{ color: "hsl(var(--p))" }}>
                  Expertise
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold font-syne text-white">
                  Specialized Services
                </h2>
                <p className="text-white/45 text-sm mt-2 max-w-lg">
                  Transforming business requirements into resilient, high-speed, and accessible digital solutions.
                </p>
              </div>

              <Link
                href="/services"
                onClick={() => sound.playClick()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold font-syne transition-all hover:scale-105"
                style={{
                  background: "hsl(var(--p) / 0.1)",
                  border: "1px solid hsl(var(--p) / 0.25)",
                  color: "hsl(var(--p))",
                }}
              >
                All services <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((s, i) => {
                const accent = PALETTE[(i + 2) % PALETTE.length];
                const Icon = SERVICE_ICONS[s.icon] ?? Code2;
                return (
                  <TiltCard key={s.id} maxTilt={8} className="h-full">
                    <div
                      className="rounded-3xl p-7 h-full flex flex-col justify-between transition-all duration-300"
                      style={{
                        background: `linear-gradient(150deg, hsl(${accent} / 0.08), hsl(210 60% 8% / 0.6))`,
                        backdropFilter: "blur(18px)",
                        border: `1px solid hsl(${accent} / 0.22)`,
                        boxShadow: `0 15px 40px rgba(0,0,0,0.35)`,
                      }}
                    >
                      <div>
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                          style={{
                            background: `hsl(${accent} / 0.15)`,
                            border: `1px solid hsl(${accent} / 0.35)`,
                            color: `hsl(${accent})`,
                            boxShadow: `0 0 20px hsl(${accent} / 0.2)`,
                          }}
                        >
                          <Icon size={24} />
                        </div>

                        <h3 className="text-white font-bold text-xl font-syne mb-2.5">
                          {s.title}
                        </h3>

                        <p className="text-white/50 text-xs sm:text-sm leading-relaxed">
                          {s.description}
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                        <Link
                          href="/contact"
                          onClick={() => sound.playClick()}
                          className="text-xs font-semibold font-syne flex items-center gap-1.5 transition-all hover:translate-x-1"
                          style={{ color: `hsl(${accent})` }}
                        >
                          Inquire about this <ArrowRight size={12} />
                        </Link>
                        <span className="text-[10px] font-mono text-white/30">0{i + 1}</span>
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 5. WORKFLOW / METHODOLOGY ─────────── */}
      <section className="px-5 sm:px-8 lg:px-16 pb-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-widest font-syne mb-1 font-bold" style={{ color: "hsl(var(--p))" }}>
              Methodology
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold font-syne text-white">
              How I Turn Ideas Into Reality
            </h2>
            <p className="text-white/45 text-sm mt-2">
              A battle-tested workflow focused on clarity, engineering rigour, and high velocity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Discover & Blueprint",
                desc: "Understanding core objectives, defining system architecture, UX wireframes, and component roadmaps.",
                icon: Lightbulb,
                accent: PALETTE[0],
              },
              {
                step: "02",
                title: "Build & Refine",
                desc: "Iterative development with clean typed code, continuous testing, responsive physics, and micro-interactions.",
                icon: Code2,
                accent: PALETTE[1],
              },
              {
                step: "03",
                title: "Ship & Scale",
                desc: "Smooth automated deployment, Core Web Vitals optimization, analytics, and continuous performance tuning.",
                icon: Zap,
                accent: PALETTE[3],
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <TiltCard key={p.step} maxTilt={7} className="h-full">
                  <div
                    className="rounded-3xl p-7 h-full flex flex-col justify-between"
                    style={{
                      background: "hsl(210 60% 8% / 0.5)",
                      backdropFilter: "blur(16px)",
                      border: `1px solid hsl(${p.accent} / 0.2)`,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <span className="font-mono text-2xl font-bold" style={{ color: `hsl(${p.accent})` }}>
                          {p.step}
                        </span>
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `hsl(${p.accent} / 0.1)`, color: `hsl(${p.accent})` }}
                        >
                          <Icon size={18} />
                        </div>
                      </div>

                      <h3 className="text-white font-bold text-lg font-syne mb-2">
                        {p.title}
                      </h3>

                      <p className="text-white/45 text-xs sm:text-sm leading-relaxed">
                        {p.desc}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-white/5 flex items-center gap-2 text-[11px] text-white/40">
                      <CheckCircle2 size={13} style={{ color: `hsl(${p.accent})` }} />
                      <span>Strict quality standards</span>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────── 6. TECH MARQUEE ─────────── */}
      {cfg.showMarquee && tech.length > 0 && (
        <section className="pb-24 relative z-10 overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] font-syne font-bold text-white/35">
              Tools, Frameworks &amp; Languages
            </p>
          </div>

          <div className="marquee-mask overflow-hidden">
            <div className="marquee-track flex w-max gap-3 py-2">
              {[...tech, ...tech, ...tech].map((t, i) => (
                <span
                  key={i}
                  className="shrink-0 px-6 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-300 hover:scale-105"
                  style={{
                    background: "hsl(var(--p) / 0.07)",
                    color: "hsl(var(--p))",
                    border: "1px solid hsl(var(--p) / 0.2)",
                    boxShadow: "0 0 15px hsl(var(--p) / 0.04)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 7. TESTIMONIALS ─────────── */}
      {testimonials.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 pb-24 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-xl mx-auto mb-10">
              <p className="text-xs uppercase tracking-widest font-syne mb-1 font-bold" style={{ color: "hsl(var(--p))" }}>
                Endorsements
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold font-syne text-white">
                Client Testimonials
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((t, i) => {
                const accent = PALETTE[i % PALETTE.length];
                return (
                  <TiltCard key={t.id} maxTilt={6} className="h-full">
                    <div
                      className="rounded-3xl p-7 h-full flex flex-col justify-between"
                      style={{
                        background: `linear-gradient(150deg, hsl(${accent} / 0.08), hsl(210 60% 8% / 0.55))`,
                        backdropFilter: "blur(18px)",
                        border: `1px solid hsl(${accent} / 0.22)`,
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <Quote size={24} style={{ color: `hsl(${accent})` }} />
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={13} className="fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>

                        <p className="text-white/80 text-sm sm:text-base leading-relaxed italic">
                          &ldquo;{t.quote}&rdquo;
                        </p>
                      </div>

                      <div className="pt-6 mt-6 border-t border-white/10 flex items-center gap-3.5">
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm font-syne"
                          style={{
                            background: `hsl(${accent} / 0.2)`,
                            border: `1px solid hsl(${accent} / 0.4)`,
                            color: `hsl(${accent})`,
                          }}
                        >
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm font-syne">{t.name}</p>
                          <p className="text-white/40 text-xs">{t.role}</p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── 8. COLLABORATE CALL-TO-ACTION ─────────── */}
      <section className="px-5 sm:px-8 lg:px-16 pb-24 relative z-10">
        <div className="max-w-6xl mx-auto">
          <TiltCard maxTilt={5}>
            <div
              className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
              style={{
                background: "linear-gradient(140deg, hsl(var(--p) / 0.16), hsl(210 60% 8% / 0.8))",
                backdropFilter: "blur(24px)",
                border: "1px solid hsl(var(--p) / 0.35)",
                boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 60px hsl(var(--p) / 0.15)",
              }}
            >
              {/* Radial glow background */}
              <div
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-35"
                style={{ background: "radial-gradient(circle, hsl(var(--p)), transparent 70%)" }}
              />

              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest font-syne"
                  style={{
                    background: "hsl(var(--p) / 0.15)",
                    border: "1px solid hsl(var(--p) / 0.3)",
                    color: "hsl(var(--p))",
                  }}
                >
                  <Sparkles size={11} /> Let&apos;s collaborate
                </span>

                <h2 className="text-3xl sm:text-5xl font-extrabold font-syne text-white leading-tight">
                  Have an ambitious project in mind?
                </h2>

                <p className="text-white/55 text-sm sm:text-base leading-relaxed">
                  I&apos;m currently open to new opportunities, contract projects, and design engineering leadership. Let&apos;s build something unforgettable.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <Link
                    href="/contact"
                    onClick={() => sound.playClick()}
                    className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold font-syne transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--p)), hsl(var(--p2)))",
                      color: "hsl(210 100% 4%)",
                      boxShadow: "0 8px 30px hsl(var(--p) / 0.4)",
                    }}
                  >
                    Start a Conversation <ArrowRight size={15} />
                  </Link>

                  {cfg.email && (
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-105 text-white/80 hover:text-white"
                      style={{
                        background: "hsl(0 0% 100% / 0.05)",
                        border: "1px solid hsl(0 0% 100% / 0.15)",
                      }}
                    >
                      <Copy size={14} /> Copy Email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* ─────────── 9. EXPLORE QUICK DIRECTORY ─────────── */}
      <section className="px-5 sm:px-8 lg:px-16 pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-white/35 text-xs mb-6 font-syne uppercase tracking-wider">
            <ChevronDown size={14} /> Navigate Sections
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { show: cfg.showProjects, href: "/projects", label: "Projects", desc: "Things I've built & shipped", icon: Sparkles },
              { show: cfg.showServices, href: "/services", label: "Services", desc: "How I can help your team", icon: Sparkles },
              { show: cfg.showCareer, href: "/career", label: "Career", desc: "Experience & journey", icon: Sparkles },
              { show: cfg.showContact, href: "/contact", label: "Contact", desc: "Let's connect & talk", icon: Mail },
            ].filter((c) => c.show).map((c) => (
              <TiltCard key={c.href} maxTilt={6} dataCursor="Explore" className="h-full">
                <Link
                  href={c.href}
                  onClick={() => sound.playClick()}
                  className="group rounded-2xl p-5 flex flex-col justify-between h-full transition-all block"
                  style={{
                    background: "hsl(210 60% 8% / 0.55)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    border: "1px solid hsl(var(--p) / 0.12)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold font-syne text-sm">{c.label}</span>
                    <ArrowRight
                      size={15}
                      style={{ color: "hsl(var(--p))" }}
                      className="transition-transform group-hover:translate-x-1.5"
                    />
                  </div>
                  <span className="text-white/40 text-xs">{c.desc}</span>
                </Link>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── 10. LUXURY FOOTER ─────────── */}
      <footer className="px-5 sm:px-8 lg:px-16 pb-14 pt-8 border-t border-white/5 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Available for select engineering &amp; design work</span>
          </div>

          <p>{cfg.footerText || `© ${new Date().getFullYear()} ${cfg.brandName || cfg.heroTitle}. All rights reserved.`}</p>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          >
            <span>Back to top</span>
            <ChevronUp size={13} />
          </button>
        </div>
      </footer>
    </main>
  );
}
