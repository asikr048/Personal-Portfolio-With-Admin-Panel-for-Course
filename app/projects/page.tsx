"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Github, Calendar, Layers, Star, Code2, X, Cpu, CheckCircle, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import TiltCard from "@/components/TiltCard";
import { sound } from "@/lib/sound";

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

// Per-card accent palette (HSL triplets)
const PALETTE = [
  "205 90% 56%",  // blue
  "32 95% 55%",   // orange
  "150 78% 45%",  // green
  "270 80% 65%",  // violet
  "330 85% 62%",  // pink
  "190 90% 50%",  // cyan
  "45 95% 55%",   // amber
  "0 84% 62%",    // red
];

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="flex-1 min-w-0 rounded-xl px-2 py-3 flex flex-col items-center gap-1 text-center"
      style={{
        background: "hsl(210 60% 9% / 0.55)",
        border: "1px solid hsl(0 0% 100% / 0.06)",
      }}
    >
      <Icon size={15} style={{ color: "rgba(255,255,255,0.75)" }} />
      <span
        className="text-[10px] uppercase tracking-wider font-bold font-syne"
        style={{ color: `hsl(${accent})` }}
      >
        {label}
      </span>
      <span className="text-white font-bold text-sm font-syne truncate max-w-full">
        {value}
      </span>
    </div>
  );
}

function ProjectCard({
  p,
  accent,
  onOpen,
}: {
  p: Project;
  accent: string;
  onOpen: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <TiltCard
      maxTilt={9}
      dataCursor="View"
      onClick={() => {
        sound.playPop();
        onOpen();
      }}
      className="h-full"
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group relative rounded-2xl p-5 overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col justify-between"
        style={{
          background: `linear-gradient(160deg, hsl(${accent} / ${hovered ? 0.16 : 0.09}), hsl(210 60% 7% / 0.6))`,
          border: `1px solid hsl(${accent} / ${hovered ? 0.55 : 0.22})`,
          boxShadow: hovered
            ? `0 22px 60px rgba(0,0,0,0.5), 0 0 0 1px hsl(${accent} / 0.4), 0 0 40px hsl(${accent} / 0.22)`
            : `0 10px 36px rgba(0,0,0,0.38), 0 0 24px hsl(${accent} / 0.08)`,
        }}
      >
        {/* Top edge sheen */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, hsl(${accent} / 0.7), transparent)`,
          }}
        />

        <div>
          {/* Header */}
          <div className="flex items-center gap-3.5">
            {/* Icon tile */}
            <div
              className="relative shrink-0 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                background: `linear-gradient(140deg, hsl(${accent} / 0.25), hsl(${accent} / 0.08))`,
                border: `1px solid hsl(${accent} / 0.3)`,
              }}
            >
              {p.imageURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageURL}
                  alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  style={{ objectPosition: p.focus || "50% 50%" }}
                />
              ) : (
                <Code2 size={22} style={{ color: `hsl(${accent})` }} />
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                style={{
                  background: `hsl(${accent})`,
                  border: "2.5px solid hsl(210 60% 7%)",
                  boxShadow: `0 0 8px hsl(${accent})`,
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg font-syne truncate leading-tight group-hover:text-white">
                {p.title || "Untitled"}
              </p>
              <p className="text-white/40 text-sm truncate">
                {p.category}
                {p.year ? ` · ${p.year}` : ""}
              </p>
            </div>

            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                title="Open project"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                }}
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                style={{
                  background: "hsl(0 0% 100% / 0.05)",
                  border: `1px solid hsl(${accent} / 0.3)`,
                  color: `hsl(${accent})`,
                }}
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>

          {/* Description */}
          {p.description && (
            <div
              className="text-white/45 text-xs leading-relaxed mt-3.5 line-clamp-2 project-preview-html"
              dangerouslySetInnerHTML={{ __html: p.description }}
            />
          )}

          {/* Stat sub-panels */}
          <div className="flex gap-2.5 mt-4">
            <Stat icon={Calendar} label="Year" value={p.year || "—"} accent={accent} />
            <Stat icon={Layers} label="Stack" value={String(p.tech?.length ?? 0)} accent={accent} />
            <Stat icon={Star} label="Status" value={p.featured ? "Featured" : "Live"} accent={accent} />
          </div>
        </div>

        {/* Tech pills */}
        {p.tech?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {p.tech.slice(0, 5).map((t) => (
              <span
                key={t}
                className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                style={{
                  background: `hsl(${accent} / 0.08)`,
                  color: `hsl(${accent})`,
                  border: `1px solid hsl(${accent} / 0.2)`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Glowing bottom accent bar */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: hovered ? 4 : 3,
            background: `linear-gradient(90deg, transparent 4%, hsl(${accent}) 30%, hsl(${accent}) 70%, transparent 96%)`,
            boxShadow: `0 0 ${hovered ? 24 : 14}px hsl(${accent} / ${hovered ? 0.9 : 0.55})`,
            opacity: hovered ? 1 : 0.8,
            transition: "all 0.3s ease",
          }}
        />
      </div>
    </TiltCard>
  );
}

// ── Expanded detail modal with Case Study Tabs ──
function ProjectModal({
  data,
  onClose,
}: {
  data: { p: Project; accent: string } | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "stack" | "impact">("overview");

  useEffect(() => {
    setActiveTab("overview");
  }, [data]);

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.92, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl"
            style={{
              background: `linear-gradient(160deg, hsl(${data.accent} / 0.12), hsl(210 60% 7% / 0.98))`,
              border: `1px solid hsl(${data.accent} / 0.45)`,
              boxShadow: `0 30px 90px rgba(0,0,0,0.7), 0 0 60px hsl(${data.accent} / 0.25)`,
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              title="Close"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "hsl(210 60% 4% / 0.8)",
                border: `1px solid hsl(${data.accent} / 0.35)`,
                color: `hsl(${data.accent})`,
              }}
            >
              <X size={16} />
            </button>

            {/* Cover image */}
            {data.p.imageURL && (
              <div className="relative w-full h-56 sm:h-64 overflow-hidden rounded-t-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.p.imageURL}
                  alt={data.p.title}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: data.p.focus || "50% 50%" }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(180deg, transparent 35%, hsl(210 60% 7% / 0.98))`,
                  }}
                />
              </div>
            )}

            <div className="p-6 sm:p-7">
              <p
                className="text-xs uppercase tracking-widest font-syne mb-1.5 font-bold"
                style={{ color: `hsl(${data.accent})` }}
              >
                {data.p.category}
                {data.p.year ? ` · ${data.p.year}` : ""}
                {data.p.featured ? " · ★ Featured" : ""}
              </p>
              <h2 className="text-white font-bold text-2xl sm:text-3xl font-syne leading-tight">
                {data.p.title || "Untitled"}
              </h2>

              {/* Modal Tabs */}
              <div
                className="flex items-center gap-2 mt-5 p-1 rounded-xl w-fit"
                style={{
                  background: "hsl(210 60% 5% / 0.6)",
                  border: "1px solid hsl(0 0% 100% / 0.08)",
                }}
              >
                {(["overview", "stack", "impact"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => {
                      sound.playTick();
                      setActiveTab(tab);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-syne font-semibold capitalize transition-all ${
                      activeTab === tab ? "text-white" : "text-white/40 hover:text-white/70"
                    }`}
                    style={
                      activeTab === tab
                        ? {
                            background: `hsl(${data.accent} / 0.22)`,
                            border: `1px solid hsl(${data.accent} / 0.4)`,
                            color: `hsl(${data.accent})`,
                          }
                        : {}
                    }
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === "overview" && (
                <div className="mt-4">
                  {data.p.description && (
                    <div
                      className="project-html-content text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: data.p.description }}
                    />
                  )}

                  {/* Stats */}
                  <div className="flex gap-2.5 mt-6">
                    <Stat icon={Calendar} label="Year" value={data.p.year || "—"} accent={data.accent} />
                    <Stat icon={Layers} label="Stack" value={String(data.p.tech?.length ?? 0)} accent={data.accent} />
                    <Stat icon={Star} label="Status" value={data.p.featured ? "Featured" : "Live"} accent={data.accent} />
                  </div>
                </div>
              )}

              {activeTab === "stack" && (
                <div className="mt-4">
                  <p className="text-xs text-white/40 uppercase tracking-wider font-syne mb-3">
                    Technologies & Architecture
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {data.p.tech?.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{
                          background: `hsl(${data.accent} / 0.12)`,
                          color: `hsl(${data.accent})`,
                          border: `1px solid hsl(${data.accent} / 0.28)`,
                        }}
                      >
                        <Cpu size={12} />
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "impact" && (
                <div className="mt-4 space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                    <CheckCircle size={17} style={{ color: `hsl(${data.accent})` }} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-white">Full Production Readiness</p>
                      <p className="text-[11px] text-white/45 mt-0.5">Engineered with modern best practices, responsive layouts, and clean modular code.</p>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-start gap-3">
                    <Zap size={17} style={{ color: `hsl(${data.accent})` }} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-white">High Performance & Scalability</p>
                      <p className="text-[11px] text-white/45 mt-0.5">Optimized for fast Core Web Vitals, fluid transitions, and seamless user interaction.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action button */}
              {data.p.link && (
                <a
                  href={data.p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playClick()}
                  className="inline-flex items-center gap-2 mt-7 px-6 py-3 rounded-xl text-sm font-semibold font-syne transition-all hover:scale-[1.03]"
                  style={{
                    background: `linear-gradient(135deg, hsl(${data.accent}), hsl(${data.accent} / 0.75))`,
                    color: "hsl(210 100% 4%)",
                    boxShadow: `0 8px 28px hsl(${data.accent} / 0.35)`,
                  }}
                >
                  Visit Project <ExternalLink size={15} />
                </a>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<{ p: Project; accent: string } | null>(null);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(d.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category).filter(Boolean)))];
  const filtered = filter === "All" ? projects : projects.filter((p) => p.category === filter);

  return (
    <main className="h-screen w-screen overflow-y-auto md:pl-20 px-4 pb-24 md:pb-8 pt-8 relative">
      <div className="max-w-5xl mx-auto fade-up">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-1 font-syne" style={{ color: "hsl(var(--p))" }}>
            Portfolio Showcase
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold font-syne text-white">
            Projects & Work
          </h1>
          <p className="text-white/45 text-sm mt-2 max-w-xl">
            A curated showcase of applications, engineering experiments, and digital products.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-7">
          {categories.map((cat) => {
            const isSelected = filter === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  sound.playTick();
                  setFilter(cat);
                }}
                className="relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                style={
                  isSelected
                    ? {
                        background: "hsl(var(--p) / 0.22)",
                        color: "hsl(var(--p))",
                        border: "1px solid hsl(var(--p) / 0.4)",
                        boxShadow: "0 0 16px hsl(var(--p) / 0.2)",
                      }
                    : {
                        background: "hsl(210 60% 8% / 0.5)",
                        color: "rgba(255,255,255,0.6)",
                        border: "1px solid hsl(var(--p) / 0.1)",
                      }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Grid of 3D Tilt cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p, i) => {
            const accent = PALETTE[i % PALETTE.length];
            return (
              <ProjectCard
                key={p.id}
                p={p}
                accent={accent}
                onOpen={() => setSelected({ p, accent })}
              />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/30">
            <Github size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No projects found in this category.</p>
          </div>
        )}
      </div>

      <ProjectModal data={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
