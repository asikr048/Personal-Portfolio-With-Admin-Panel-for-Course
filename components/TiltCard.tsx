"use client";
import { useState, useRef, useCallback, ReactNode, CSSProperties } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  maxTilt?: number;
  glare?: boolean;
  dataCursor?: string;
  onClick?: () => void;
}

export default function TiltCard({
  children,
  className = "",
  style = {},
  maxTilt = 10,
  glare = true,
  dataCursor,
  onClick,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tilt angles
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);

  // Spring physics for smooth tilt response
  const springX = useSpring(rotX, { stiffness: 350, damping: 28 });
  const springY = useSpring(rotY, { stiffness: 350, damping: 28 });

  // Glare position
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const normalX = (x - centerX) / centerX;
    const normalY = (y - centerY) / centerY;

    rotX.set(-normalY * maxTilt);
    rotY.set(normalX * maxTilt);

    glareX.set((x / rect.width) * 100);
    glareY.set((y / rect.height) * 100);
  }, [maxTilt, rotX, rotY, glareX, glareY]);

  const onMouseEnter = () => setIsHovered(true);

  const onMouseLeave = () => {
    setIsHovered(false);
    rotX.set(0);
    rotY.set(0);
  };

  return (
    <div
      style={{ perspective: 1000 }}
      className="relative"
    >
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        data-cursor={dataCursor}
        style={{
          ...style,
          rotateX: springX,
          rotateY: springY,
          transformStyle: "preserve-3d",
        }}
        className={`relative overflow-hidden transition-shadow duration-300 ${className}`}
      >
        {children}

        {/* ── Dynamic Glare Overlay ── */}
        {glare && (
          <motion.div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-30"
            style={{
              opacity: isHovered ? 0.35 : 0,
              background: `radial-gradient(circle 280px at ${glareX.get()}% ${glareY.get()}%, rgba(255, 255, 255, 0.35), transparent 75%)`,
              mixBlendMode: "overlay",
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
