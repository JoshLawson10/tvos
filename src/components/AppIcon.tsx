"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";

interface AppIconProps {
  name: string;
  link: string;
  image?: string;
  displayName?: boolean;
  isInDock?: boolean;
  focused?: boolean;
  onLaunch?: (name: string, link: string) => void;
}

export default function AppIcon({
  name,
  link,
  image,
  displayName = false,
  isInDock = false,
  focused = false,
  onLaunch,
}: AppIconProps) {
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (!onLaunch) return;
    onLaunch(name, link);
  }, [name, link, onLaunch]);

  const isActive = hovered || focused;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        ref={containerRef}
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: 200,
          aspectRatio: "16/9",
          borderRadius: 16,
          overflow: "hidden",
          position: "relative",
          cursor: "pointer",
          transform: isActive ? "scale(1.08)" : "scale(1)",
          transition: "transform 0.18s ease",
          boxShadow: isActive
            ? "0 0 0 3px rgba(255,255,255,0.7)"
            : "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <Image
          src={image ?? `/icons/unknown.png`}
          alt={`${name} icon`}
          fill
          draggable={false}
          style={{ objectFit: "cover" }}
        />
      </div>

      {!isInDock && (
        <span
          style={{
            color: "white",
            fontSize: 14,
            opacity: isActive || displayName ? 1 : 0,
            transition: "opacity 0.2s",
          }}
        >
          {name}
        </span>
      )}
    </div>
  );
}
