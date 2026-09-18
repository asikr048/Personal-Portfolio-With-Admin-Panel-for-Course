"use client";
import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { sound } from "@/lib/sound";

export default function MagneticCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [cursorText, setCursorText] = useState("");
  const [isClicking, setIsClicking] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth spring physics for main cursor ring
  const springX = useSpring(mouseX, { stiffness: 450, damping: 32, mass: 0.2 });
  const springY = useSpring(mouseY, { stiffness: 450, damping: 32, mass: 0.2 });

  // Slower ambient aura
  const auraX = useSpring(mouseX, { stiffness: 150, damping: 25, mass: 0.8 });
  const auraY = useSpring(mouseY, { stiffness: 150, damping: 25, mass: 0.8 });

  useEffect(() => {
    // Only enable for precision pointer devices (desktop with mouse)
    if (typeof window === "undefined") return;
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    setEnabled(true);

    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      // Check what element is hovered
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest("[data-cursor]") as HTMLElement | null;
      if (cursorTarget) {
        setHovered(true);
        setCursorText(cursorTarget.getAttribute("data-cursor") || "");
        return;
      }

      const interactive = target.closest("a, button, input, textarea, select, [role='button'], .clickable");
      if (interactive) {
        setHovered(true);
        setCursorText("");
      } else {
        setHovered(false);
        setCursorText("");
      }
    };

    const onMouseDown = () => {
      setIsClicking(true);
      sound.playClick();
    };

    const onMouseUp = () => {
      setIsClicking(false);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [mouseX, mouseY]);

  if (!enabled) return null;

  return (
    <>
      {/* ── Ambient cursor glow layer (follows cursor, lights up glass cards) ── */}
      <motion.div
        className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] opacity-25 mix-blend-screen"
        style={{
          x: auraX,
          y: auraY,
          width: 320,
          height: 320,
          background: "radial-gradient(circle, hsl(var(--p) / 0.45) 0%, hsl(var(--p2) / 0.15) 50%, transparent 70%)",
        }}
      />

      {/* ── Magnetic Center Dot ── */}
      <motion.div
        className="pointer-events-none fixed z-[9999] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          x: mouseX,
          y: mouseY,
          width: hovered ? (cursorText ? 0 : 6) : 5,
          height: hovered ? (cursorText ? 0 : 6) : 5,
          backgroundColor: "hsl(var(--p))",
          boxShadow: "0 0 10px hsl(var(--p))",
        }}
      />

      {/* ── Dynamic Outer Ring / Badge ── */}
      <motion.div
        className="pointer-events-none fixed z-[9998] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full text-center"
        animate={{
          width: cursorText ? 76 : hovered ? 46 : 24,
          height: cursorText ? 76 : hovered ? 46 : 24,
          scale: isClicking ? 0.85 : 1,
          backgroundColor: cursorText
            ? "hsl(var(--p) / 0.9)"
            : hovered
            ? "hsl(var(--p) / 0.12)"
            : "transparent",
          borderColor: cursorText ? "transparent" : "hsl(var(--p) / 0.45)",
          borderWidth: cursorText ? 0 : 1.5,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={{
          x: springX,
          y: springY,
          backdropFilter: hovered ? "blur(4px)" : "none",
          WebkitBackdropFilter: hovered ? "blur(4px)" : "none",
        }}
      >
        {cursorText && (
          <motion.span
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] uppercase tracking-widest font-syne font-bold select-none"
            style={{ color: "hsl(210 100% 4%)" }}
          >
            {cursorText}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}
