"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Home, FolderOpen, Briefcase, Wrench, Quote, User, Mail,
  Copy, Volume2, VolumeX, Download, Bot, Lock, ArrowRight, CornerDownLeft
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { sound } from "@/lib/sound";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Actions" | "Preferences";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  shortcut?: string;
  perform: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const cfg = useSiteConfig();
  const inputRef = useRef<HTMLInputElement>(null);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(sound.getEnabled());
    const onSoundChange = (e: Event) => {
      const ce = e as CustomEvent<{ enabled: boolean }>;
      setSoundEnabled(ce.detail.enabled);
    };
    window.addEventListener("portfolio-sound-changed", onSoundChange);
    return () => window.removeEventListener("portfolio-sound-changed", onSoundChange);
  }, []);

  // Global keydown listener for ⌘K / Ctrl+K
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            sound.playPop();
          }
          return !prev;
        });
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    const onCustomToggle = () => {
      setIsOpen((prev) => {
        if (!prev) sound.playPop();
        return !prev;
      });
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("toggle-command-palette", onCustomToggle);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("toggle-command-palette", onCustomToggle);
    };
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSelectedIndex(0);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [
      // Navigation
      {
        id: "nav-home",
        title: "Home",
        category: "Navigation",
        icon: Home,
        shortcut: "H",
        perform: () => router.push("/"),
      },
      {
        id: "nav-projects",
        title: "Projects & Work",
        category: "Navigation",
        icon: FolderOpen,
        shortcut: "P",
        perform: () => router.push("/projects"),
      },
      {
        id: "nav-career",
        title: "Career & Experience",
        category: "Navigation",
        icon: Briefcase,
        perform: () => router.push("/career"),
      },
      {
        id: "nav-services",
        title: "Services & Capabilities",
        category: "Navigation",
        icon: Wrench,
        perform: () => router.push("/services"),
      },
      {
        id: "nav-testimonials",
        title: "Testimonials & Reviews",
        category: "Navigation",
        icon: Quote,
        perform: () => router.push("/testimonials"),
      },
      {
        id: "nav-about",
        title: "About / Bio",
        category: "Navigation",
        icon: User,
        perform: () => router.push("/personal"),
      },
      {
        id: "nav-contact",
        title: "Get in Touch",
        category: "Navigation",
        icon: Mail,
        shortcut: "C",
        perform: () => router.push("/contact"),
      },

      // Actions
      {
        id: "act-email",
        title: `Copy Email (${cfg.email || "hello@example.com"})`,
        category: "Actions",
        icon: Copy,
        perform: () => {
          if (navigator?.clipboard && cfg.email) {
            navigator.clipboard.writeText(cfg.email);
            sound.playSuccess();
            toast.success("Email address copied to clipboard!");
          }
        },
      },
      {
        id: "act-ai",
        title: "Ask AI Assistant",
        category: "Actions",
        icon: Bot,
        perform: () => {
          window.dispatchEvent(new CustomEvent("open-ai-chat"));
        },
      },
      {
        id: "act-resume",
        title: "Download Resume",
        category: "Actions",
        icon: Download,
        perform: () => {
          if (cfg.resumeURL) {
            window.open(cfg.resumeURL, "_blank");
          } else {
            toast.error("Resume URL not configured in admin panel.");
          }
        },
      },
      {
        id: "act-admin",
        title: "Admin Portal",
        category: "Actions",
        icon: Lock,
        perform: () => router.push("/admin/login"),
      },

      // Preferences
      {
        id: "pref-sound",
        title: soundEnabled ? "Mute Audio Feedback" : "Enable Audio Feedback",
        category: "Preferences",
        icon: soundEnabled ? VolumeX : Volume2,
        perform: () => {
          const next = sound.toggle();
          setSoundEnabled(next);
          toast(next ? "Audio haptics enabled" : "Audio haptics muted");
        },
      },
    ];

    return list;
  }, [cfg, router, soundEnabled]);

  // Filter items
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  // Keyboard navigation inside the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = (prev + 1) % filtered.length;
        sound.playTick();
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = (prev - 1 + filtered.length) % filtered.length;
        sound.playTick();
        return next;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        sound.playClick();
        filtered[selectedIndex].perform();
        setIsOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: -20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: "hsl(210 60% 8% / 0.95)",
              border: "1px solid hsl(var(--p) / 0.25)",
              boxShadow: "0 25px 80px rgba(0,0,0,0.8), 0 0 40px hsl(var(--p) / 0.15)",
            }}
          >
            {/* Top Search Bar */}
            <div
              className="flex items-center gap-3 px-4 py-3.5 border-b"
              style={{ borderColor: "hsl(var(--p) / 0.12)" }}
            >
              <Search size={18} style={{ color: "hsl(var(--p))" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search commands, pages, actions..."
                className="w-full bg-transparent text-sm text-white placeholder-white/40 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-white/50 border border-white/10">
                ESC
              </kbd>
            </div>

            {/* Results list */}
            <div className="max-h-[380px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-white/30 text-sm">
                  No matching commands found.
                </div>
              ) : (
                filtered.map((item, index) => {
                  const isSelected = index === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        item.perform();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => {
                        setSelectedIndex(index);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isSelected ? "text-white" : "text-white/70 hover:text-white"
                      }`}
                      style={{
                        background: isSelected ? "hsl(var(--p) / 0.14)" : "transparent",
                        border: isSelected
                          ? "1px solid hsl(var(--p) / 0.3)"
                          : "1px solid transparent",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            background: isSelected ? "hsl(var(--p) / 0.2)" : "hsl(0 0% 100% / 0.05)",
                            color: isSelected ? "hsl(var(--p))" : "rgba(255,255,255,0.6)",
                          }}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium leading-tight truncate">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-white/40 leading-tight">
                            {item.category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.shortcut && (
                          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-white/40 border border-white/10">
                            {item.shortcut}
                          </span>
                        )}
                        {isSelected && (
                          <CornerDownLeft size={13} style={{ color: "hsl(var(--p))" }} />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer hints */}
            <div
              className="flex items-center justify-between px-4 py-2 border-t text-[11px] text-white/40 bg-white/[0.02]"
              style={{ borderColor: "hsl(var(--p) / 0.1)" }}
            >
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 mr-1">↑↓</kbd>
                  Navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60 mr-1">↵</kbd>
                  Select
                </span>
              </div>
              <span className="flex items-center gap-1 font-syne text-[10px]">
                Command Palette <ArrowRight size={10} />
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
