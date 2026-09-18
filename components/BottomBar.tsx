"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FolderOpen, Briefcase, User, Mail, Wrench, Quote, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSiteConfig } from "@/lib/hooks/useSiteConfig";
import { sound } from "@/lib/sound";
import SoundToggle from "@/components/SoundToggle";

export default function BottomBar() {
  const pathname = usePathname();
  const cfg = useSiteConfig();
  if (pathname.startsWith("/admin")) return null;

  const links = [
    { href: "/", icon: Home, label: "Home", show: true },
    { href: "/projects", icon: FolderOpen, label: "Projects", show: cfg.showProjects },
    { href: "/career", icon: Briefcase, label: "Career", show: cfg.showCareer },
    { href: "/services", icon: Wrench, label: "Services", show: cfg.showServices },
    { href: "/testimonials", icon: Quote, label: "Quotes", show: cfg.showTestimonials },
    { href: "/personal", icon: User, label: "About", show: true },
    { href: "/contact", icon: Mail, label: "Contact", show: cfg.showContact },
  ].filter((l) => l.show);

  const openPalette = () => {
    sound.playPop();
    window.dispatchEvent(new CustomEvent("toggle-command-palette"));
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 px-3">
      <nav
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl max-w-full overflow-x-auto no-scrollbar shadow-2xl"
        style={{
          background: "hsl(210 60% 8% / 0.88)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid hsl(var(--p) / 0.18)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
        }}
      >
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={openPalette}
          aria-label="Search"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-white/40 shrink-0 hover:text-white"
        >
          <Search size={17} />
          <span className="text-[9px] font-medium">Search</span>
        </button>

        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sound.playClick()}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 shrink-0",
                active ? "" : "text-white/35"
              )}
              style={
                active
                  ? {
                      color: "hsl(var(--p))",
                      background: "hsl(var(--p) / 0.12)",
                      border: "1px solid hsl(var(--p) / 0.25)",
                    }
                  : {}
              }
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          );
        })}

        {/* Mobile Sound Toggle */}
        <div className="shrink-0 pl-1 border-l border-white/10 flex items-center">
          <SoundToggle className="!w-8 !h-8" />
        </div>
      </nav>
    </div>
  );
}
