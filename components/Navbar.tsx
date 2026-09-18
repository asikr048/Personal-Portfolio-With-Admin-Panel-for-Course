"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, Briefcase, User, Mail, Wrench, Quote, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import { sound } from "@/lib/sound";
import SoundToggle from "@/components/SoundToggle";

export default function Navbar() {
  const pathname = usePathname();
  const cfg = useSiteConfig();
  if (pathname.startsWith("/admin")) return null;

  const links = [
    { href: "/", icon: Home, label: "Home", show: true },
    { href: "/projects", icon: FolderOpen, label: "Projects", show: cfg.showProjects },
    { href: "/blog", icon: BookOpen, label: "Blog", show: cfg.showBlog ?? true },
    { href: "/career", icon: Briefcase, label: "Career", show: cfg.showCareer },
    { href: "/services", icon: Wrench, label: "Services", show: cfg.showServices },
    { href: "/testimonials", icon: Quote, label: "Testimonials", show: cfg.showTestimonials },
    { href: "/personal", icon: User, label: "About", show: true },
    { href: "/contact", icon: Mail, label: "Contact", show: cfg.showContact },
  ].filter((l) => l.show);

  const openPalette = () => {
    sound.playPop();
    window.dispatchEvent(new CustomEvent("toggle-command-palette"));
  };

  return (
    <nav className="hidden md:flex fixed left-0 top-0 h-full w-16 z-50 flex-col items-center justify-center gap-2">
      <div
        className="flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl"
        style={{
          background: "hsl(210 60% 8% / 0.65)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid hsl(var(--p) / 0.15)",
          boxShadow: "0 0 50px hsl(var(--p) / 0.06)",
        }}
      >
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={openPalette}
          title="Command Palette (⌘K / Ctrl+K)"
          aria-label="Command Palette"
          className="relative w-10 h-10 flex items-center justify-center rounded-xl text-white/40 hover:text-white transition-all duration-200 group"
          style={{
            background: "hsl(0 0% 100% / 0.04)",
            border: "1px solid hsl(0 0% 100% / 0.06)",
          }}
        >
          <Search size={16} className="transition-transform group-hover:scale-110" />
          <span
            className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap
            opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-50 flex items-center gap-1.5"
            style={{
              background: "hsl(210 60% 8% / 0.95)",
              border: "1px solid hsl(var(--p) / 0.15)",
              color: "hsl(195 80% 90%)",
            }}
          >
            Search <kbd className="px-1 py-0.2 rounded font-mono text-[9px] bg-white/10 text-white/60">⌘K</kbd>
          </span>
        </button>

        <div className="w-6 h-px my-1 bg-white/10" />

        {/* Navigation Links */}
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={label}
              onClick={() => sound.playClick()}
              className={cn(
                "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group",
                active ? "" : "text-white/30 hover:text-white/70"
              )}
              style={
                active
                  ? {
                      color: "hsl(var(--p))",
                      background: "hsl(var(--p) / 0.12)",
                      boxShadow: "0 0 16px hsl(var(--p) / 0.25)",
                      border: "1px solid hsl(var(--p) / 0.3)",
                    }
                  : {}
              }
            >
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: "hsl(var(--p))", boxShadow: "0 0 8px hsl(var(--p))" }}
                />
              )}
              <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />

              <span
                className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap
                opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-50"
                style={{
                  background: "hsl(210 60% 8% / 0.95)",
                  border: "1px solid hsl(var(--p) / 0.15)",
                  color: "hsl(195 80% 90%)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <div className="w-6 h-px my-1 bg-white/10" />

        {/* Sound Toggle */}
        <SoundToggle />
      </div>
    </nav>
  );
}
