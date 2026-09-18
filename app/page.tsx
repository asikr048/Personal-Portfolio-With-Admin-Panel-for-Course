"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Download, MapPin, ChevronDown, Sparkles,
  Github, Linkedin, Twitter, Instagram, Youtube, Dribbble, Globe, Mail, Settings2, Clock
} from "lucide-react";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import type { Stat } from "@/lib/siteConfig";
import HeroCanvas from "@/components/HeroCanvas";
import TiltCard from "@/components/TiltCard";
import { sound } from "@/lib/sound";

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

  return (
    <main className="h-screen w-screen overflow-y-auto md:pl-16 relative">
      {/* ─────────── HERO ─────────── */}
      <section className="relative min-h-screen w-full flex items-center px-5 sm:px-8 lg:px-16 pt-16 pb-28 md:py-0 overflow-hidden">
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
              <p className="rise text-white/45 text-sm sm:text-base leading-relaxed max-w-lg" style={{ animationDelay: "0.28s" }}>
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
            <div className="rise flex flex-wrap gap-3 justify-center md:justify-start" style={{ animationDelay: "0.38s" }}>
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
      </section>

      {/* ─────────── STATS WITH 3D TILT ─────────── */}
      {cfg.showStats && stats.length > 0 && (
        <section className="px-5 sm:px-8 lg:px-16 pb-14 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {stats.map((s, i) => (
              <TiltCard
                key={i}
                maxTilt={8}
                className="rounded-2xl p-5 sm:p-6 text-center"
                style={{
                  background: "hsl(210 60% 8% / 0.55)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid hsl(var(--p) / 0.15)",
                }}
              >
                <p className="font-syne font-extrabold text-3xl sm:text-4xl text-glow" style={{ color: "hsl(var(--p))" }}>
                  <Counter value={s.value} />
                </p>
                <p className="text-white/50 text-xs sm:text-sm mt-1.5 font-medium">{s.label}</p>
              </TiltCard>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── TECH MARQUEE ─────────── */}
      {cfg.showMarquee && tech.length > 0 && (
        <section className="pb-16 relative z-10">
          <p className="text-center text-white/30 text-xs uppercase tracking-[0.25em] font-syne mb-5 font-semibold">
            Tech & Technologies
          </p>
          <div className="marquee-mask overflow-hidden">
            <div className="marquee-track flex w-max gap-3">
              {[...tech, ...tech, ...tech].map((t, i) => (
                <span
                  key={i}
                  className="shrink-0 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:border-white/30"
                  style={{
                    background: "hsl(var(--p) / 0.07)",
                    color: "hsl(var(--p))",
                    border: "1px solid hsl(var(--p) / 0.18)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────── EXPLORE WITH 3D TILT ─────────── */}
      <section className="px-5 sm:px-8 lg:px-16 pb-24 md:pb-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-white/35 text-xs mb-6 font-syne uppercase tracking-wider">
            <ChevronDown size={14} /> Explore Sections
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { show: cfg.showProjects, href: "/projects", label: "Projects", desc: "Things I've built & shipped", icon: Sparkles },
              { show: cfg.showServices, href: "/services", label: "Services", desc: "How I can help your team", icon: Sparkles },
              { show: cfg.showCareer, href: "/career", label: "Career", desc: "Experience & journey", icon: Sparkles },
              { show: cfg.showContact, href: "/contact", label: "Contact", desc: "Let's connect & talk", icon: Mail },
            ].filter((c) => c.show).map((c) => (
              <TiltCard
                key={c.href}
                maxTilt={6}
                dataCursor="Explore"
                className="h-full"
              >
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
          {cfg.footerText && <p className="text-center text-white/30 text-xs mt-12">{cfg.footerText}</p>}
        </div>
      </section>
    </main>
  );
}
