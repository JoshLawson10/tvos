"use client";

import Image from "next/image";
import { useRef, useState, useCallback } from "react";
import ContextMenu, { ContextMenuItem } from "@/components/ContextMenu";

interface AppIconProps {
  name: string;
  link: string;
  image?: string;
  iconData?: string;
  displayName?: boolean;
  isInDock?: boolean;
  focused?: boolean;
  onLaunch?: (name: string, link: string) => void;
  contextMenuItems?: ContextMenuItem[];
}

export default function AppIcon({
  name,
  link,
  image,
  iconData,
  displayName = false,
  isInDock = false,
  focused = false,
  onLaunch,
  contextMenuItems,
}: AppIconProps) {
  const [hovered, setHovered] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (!onLaunch) return;
    onLaunch(name, link);
  }, [name, link, onLaunch]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (!contextMenuItems?.length) return;
      e.preventDefault();
      setMenuPos({ x: e.clientX, y: e.clientY });
    },
    [contextMenuItems],
  );

  const closeMenu = useCallback(() => setMenuPos(null), []);

  const isActive = hovered || focused;
  const src = iconData ?? image ?? `/icons/unknown.png`;
  const useNativeImg = !!iconData;

  return (
    <>
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
          onContextMenu={handleContextMenu}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
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
          {useNativeImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt={`${name} icon`}
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <Image
              src={src}
              alt={`${name} icon`}
              fill
              draggable={false}
              style={{ objectFit: "cover" }}
            />
          )}
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

      {menuPos && contextMenuItems?.length && (
        <ContextMenu
          x={menuPos.x}
          y={menuPos.y}
          items={contextMenuItems}
          onClose={closeMenu}
        />
      )}
    </>
  );
}
