"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AppIconProps {
  name: string;
  image?: string;
  displayName?: boolean;
  isInDock?: boolean;
}

interface TiltStyles {
  transform: string;
  boxShadow: string;
}

interface GlareStyles {
  background: string;
  opacity: number;
}

interface EdgeStyles {
  background: string;
  opacity: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TILT_INTENSITY = 8;
const SCALE_ON_HOVER = 1.08;
const PERSPECTIVE = 800;
const FALLBACK_IMAGE = "/unknown.png";

const BORDER_RADIUS = {
  dock: "18px",
  dockFocus: "21px",
  library: "14px",
  libraryFocus: "17px",
} as const;

const BASE_SHADOW =
  "0px 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";

const RESET_TILT_STYLES: TiltStyles = {
  transform: `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)`,
  boxShadow: [
    "0px 12px 32px rgba(0,0,0,0.4)",
    "0px 4px 12px rgba(0,0,0,0.25)",
    "inset 0 1px 0 rgba(255,255,255,0.18)",
    "inset 0 -1px 0 rgba(0,0,0,0.15)",
  ].join(", "),
};

const HIDDEN_OVERLAY: Pick<GlareStyles, "opacity"> = { opacity: 0 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeTiltStyles(nx: number, ny: number): TiltStyles {
  const rotateX = -ny * TILT_INTENSITY;
  const rotateY = nx * TILT_INTENSITY;
  return {
    transform: `perspective(${PERSPECTIVE}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${SCALE_ON_HOVER}) translateZ(10px)`,
    boxShadow: [
      `${-nx * 16}px ${-ny * 16 + 24}px 48px rgba(0,0,0,0.55)`,
      `${-nx * 6}px ${-ny * 6 + 10}px 20px rgba(0,0,0,0.35)`,
      "inset 0 1px 0 rgba(255,255,255,0.25)",
      "inset 0 -1px 0 rgba(0,0,0,0.2)",
    ].join(", "),
  };
}

function computeGlareStyles(
  x: number,
  y: number,
  width: number,
  height: number,
): GlareStyles {
  const glareX = (x / width) * 100;
  const glareY = (y / height) * 100;
  return {
    background: [
      `radial-gradient(ellipse 60% 40% at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%)`,
      "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)",
    ].join(", "),
    opacity: 1,
  };
}

function computeEdgeStyles(nx: number, ny: number): EdgeStyles {
  const edgeOpacity = Math.sqrt(nx * nx + ny * ny) * 0.6;
  const angleDeg = Math.atan2(ny, nx) * (180 / Math.PI) + 90;
  return {
    background: `linear-gradient(${angleDeg}deg, rgba(255,255,255,${edgeOpacity * 0.5}) 0%, transparent 40%)`,
    opacity: 1,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AppIcon({
  name,
  image,
  displayName = false,
  isInDock = false,
}: AppIconProps) {
  const [hovered, setHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<Partial<TiltStyles>>({});
  const [glareStyle, setGlareStyle] = useState<Partial<GlareStyles>>({});
  const [edgeStyle, setEdgeStyle] = useState<Partial<EdgeStyles>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const borderRadius = isInDock ? BORDER_RADIUS.dock : BORDER_RADIUS.library;
  const focusBorderRadius = isInDock
    ? BORDER_RADIUS.dockFocus
    : BORDER_RADIUS.libraryFocus;

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;

    setTiltStyle(computeTiltStyles(nx, ny));
    setGlareStyle(computeGlareStyles(x, y, rect.width, rect.height));
    setEdgeStyle(computeEdgeStyles(nx, ny));
  }, []);

  const handleMouseEnter = useCallback(() => setHovered(true), []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setTiltStyle(RESET_TILT_STYLES);
    setGlareStyle(HIDDEN_OVERLAY as GlareStyles);
    setEdgeStyle(HIDDEN_OVERLAY as EdgeStyles);
  }, []);

  const labelVisible = hovered || displayName;

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer w-full">
      {/* Icon tile */}
      <div
        ref={containerRef}
        role="img"
        aria-label={name}
        className="w-full aspect-video"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          borderRadius,
          transition: hovered
            ? "transform 0.06s ease-out, box-shadow 0.06s ease-out"
            : "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.45s ease",
          willChange: "transform",
          position: "relative",
          overflow: "hidden",
          boxShadow: BASE_SHADOW,
          ...tiltStyle,
        }}
      >
        {/* App artwork */}
        <Image
          className="block object-cover"
          style={{ borderRadius: "inherit" }}
          src={image ?? FALLBACK_IMAGE}
          alt={`${name} icon`}
          fill
          draggable={false}
        />

        {/* Frosted glass base tint */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.06) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Edge glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            transition: "opacity 0.12s ease",
            opacity: 0,
            ...edgeStyle,
          }}
        />

        {/* Specular glare */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            pointerEvents: "none",
            transition: "opacity 0.12s ease",
            opacity: 0,
            mixBlendMode: "screen",
            ...glareStyle,
          }}
        />

        {/* Top rim highlight */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: "8%",
            right: "8%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 70%, transparent)",
            pointerEvents: "none",
            borderRadius: "0 0 4px 4px",
          }}
        />

        {/* Bottom rim shadow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: "8%",
            right: "8%",
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.3) 70%, transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Focus ring */}
        {hovered && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "-3px",
              borderRadius: focusBorderRadius,
              border: "2px solid rgba(255,255,255,0.55)",
              pointerEvents: "none",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          />
        )}
      </div>

      {/* Label — hidden in dock */}
      {!isInDock && (
        <span
          style={{
            fontFamily:
              "-apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.01em",
            color: "rgba(255,255,255,0.92)",
            textShadow: "0 1px 4px rgba(0,0,0,0.6), 0 0 12px rgba(0,0,0,0.4)",
            opacity: labelVisible ? 1 : 0,
            transform: labelVisible ? "translateY(0px)" : "translateY(-5px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
            textAlign: "center",
            maxWidth: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
