"use client";

import Image from "next/image";
import { useRef, useState } from "react";

interface AppIconProps {
  name: string;
  image?: string;
  displayName?: boolean;
  isInDock?: boolean;
}

export default function AppIcon({
  name,
  image,
  displayName = false,
  isInDock = false,
}: AppIconProps) {
  const [hovered, setHovered] = useState(false);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({});
  const [edgeStyle, setEdgeStyle] = useState({});
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;

    const rotateX = -ny * 8;
    const rotateY = nx * 8;

    setStyle({
      transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08) translateZ(10px)`,
      boxShadow: `
        ${-nx * 16}px ${-ny * 16 + 24}px 48px rgba(0,0,0,0.55),
        ${-nx * 6}px ${-ny * 6 + 10}px 20px rgba(0,0,0,0.35),
        inset 0 1px 0 rgba(255,255,255,0.25),
        inset 0 -1px 0 rgba(0,0,0,0.2)
      `,
    });

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    // Primary specular glare
    setGlareStyle({
      background: `
        radial-gradient(ellipse 60% 40% at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 70%),
        linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%)
      `,
      opacity: 1,
    });

    // Edge highlight that shifts with tilt
    const edgeOpacity = Math.sqrt(nx * nx + ny * ny) * 0.6;
    setEdgeStyle({
      background: `linear-gradient(${Math.atan2(ny, nx) * (180 / Math.PI) + 90}deg, rgba(255,255,255,${edgeOpacity * 0.5}) 0%, transparent 40%)`,
      opacity: 1,
    });
  }

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
    setStyle({
      transform:
        "perspective(800px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0px)",
      boxShadow: `
        0px 12px 32px rgba(0,0,0,0.4),
        0px 4px 12px rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.18),
        inset 0 -1px 0 rgba(0,0,0,0.15)
      `,
    });
    setGlareStyle({ opacity: 0 });
    setEdgeStyle({ opacity: 0 });
  }

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer w-full">
      <div
        className="w-full aspect-video"
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          borderRadius: isInDock ? "18px" : "14px",
          transition: hovered
            ? "transform 0.06s ease-out, box-shadow 0.06s ease-out"
            : "transform 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.45s ease",
          willChange: "transform",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "0px 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          ...style,
        }}
      >
        {/* App image */}
        <Image
          className="block object-cover"
          style={{ borderRadius: "inherit" }}
          src={image || `/unknown.png`}
          alt={`${name} icon`}
          fill
          draggable={false}
        />

        {/* Liquid glass base coat — subtle frosted tint over image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background:
              "linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.06) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Edge glow layer */}
        <div
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

        {/* Glass rim highlight — top edge */}
        <div
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

        {/* Glass rim — bottom edge */}
        <div
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

        {/* Focus ring for tvOS feel */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              inset: "-3px",
              borderRadius: isInDock ? "21px" : "17px",
              border: "2px solid rgba(255,255,255,0.55)",
              pointerEvents: "none",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.15), inset 0 0 0 1px rgba(255,255,255,0.1)",
            }}
          />
        )}
      </div>

      {/* Label */}
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
            opacity: hovered || displayName ? 1 : 0,
            transform:
              hovered || displayName ? "translateY(0px)" : "translateY(-5px)",
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
