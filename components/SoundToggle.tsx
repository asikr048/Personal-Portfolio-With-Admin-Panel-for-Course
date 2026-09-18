"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sound";

export default function SoundToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setEnabled(sound.getEnabled());

    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      setEnabled(customEvent.detail.enabled);
    };

    window.addEventListener("portfolio-sound-changed", handler);
    return () => window.removeEventListener("portfolio-sound-changed", handler);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center opacity-40 ${className}`}>
        <Volume2 size={16} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => sound.toggle()}
      title={enabled ? "Mute audio haptics" : "Unmute audio haptics"}
      aria-label={enabled ? "Mute audio haptics" : "Unmute audio haptics"}
      className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group ${className}`}
      style={{
        background: enabled ? "hsl(var(--p) / 0.12)" : "hsl(0 0% 100% / 0.04)",
        border: `1px solid ${enabled ? "hsl(var(--p) / 0.3)" : "hsl(0 0% 100% / 0.08)"}`,
        color: enabled ? "hsl(var(--p))" : "rgba(255,255,255,0.4)",
      }}
    >
      {enabled ? (
        <Volume2 size={16} className="transition-transform group-hover:scale-110" />
      ) : (
        <VolumeX size={16} className="transition-transform group-hover:scale-110" />
      )}

      {/* Subtle indicator dot */}
      {enabled && (
        <span
          className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
          style={{ background: "hsl(var(--p))", boxShadow: "0 0 6px hsl(var(--p))" }}
        />
      )}

      {/* Tooltip on desktop */}
      <span
        className="hidden md:block absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-50"
        style={{
          background: "hsl(210 60% 8% / 0.95)",
          border: "1px solid hsl(var(--p) / 0.15)",
          color: "hsl(195 80% 90%)",
        }}
      >
        {enabled ? "Sound: On" : "Sound: Off"}
      </span>
    </button>
  );
}
