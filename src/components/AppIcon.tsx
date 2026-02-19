"use client";

import Image from "next/image";
import { useRef, useState } from "react";

interface AppIconProps {
  name: string;
  image?: string;
  displayName?: boolean;
  showNameOnHover?: boolean;
}

export default function AppIcon({
  name,
  image,
  displayName = false,
  showNameOnHover = true,
}: AppIconProps) {
  const [hovered, setHovered] = useState(false);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({});
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left; // cursor x within element
    const y = e.clientY - rect.top; // cursor y within element
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Normalised -1 to 1
    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;

    const rotateX = -ny * 5; // tilt up/down
    const rotateY = nx * 5; // tilt left/right

    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.18)`,
      boxShadow: `
        ${-nx * 12}px ${-ny * 12 + 20}px 40px rgba(0,0,0,0.5),
        ${-nx * 4}px ${-ny * 4 + 8}px 16px rgba(0,0,0,0.3)
      `,
    });

    // Glare follows cursor
    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;
    setGlareStyle({
      background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)`,
      opacity: 1,
    });
  }

  function handleMouseEnter() {
    setHovered(true);
  }

  function handleMouseLeave() {
    setHovered(false);
    setStyle({
      transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)",
      boxShadow: "0px 8px 20px rgba(0,0,0,0.3)",
    });
    setGlareStyle({ opacity: 0 });
  }

  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer rounded-lg">
      <div
        className="rounded-lg"
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transition: hovered
            ? "transform 0.08s ease-out, box-shadow 0.08s ease-out"
            : "transform 0.4s ease, box-shadow 0.4s ease",
          willChange: "transform",
          position: "relative",
          overflow: "hidden",
          ...style,
        }}
      >
        <Image
          className="block rounded-lg"
          src={image || `/unknown.png`}
          alt={`${name} icon`}
          width={100}
          height={100}
          draggable={false}
        />

        {/* Glare layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            transition: "opacity 0.15s ease",
            opacity: 0,
            ...glareStyle,
          }}
        />
      </div>

      {/* Label */}
      <span
        className="text-sm text-white font-medium drop-shadow-md"
        style={{
          opacity: (hovered && showNameOnHover) || displayName ? 1 : 0,
          transform:
            (hovered && showNameOnHover) || displayName
              ? "translateY(0px)"
              : "translateY(-4px)",
          transition: "opacity 0.2s ease, transform 0.2s ease",
        }}
      >
        {name}
      </span>
    </div>
  );
}
