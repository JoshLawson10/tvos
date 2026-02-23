import { forwardRef, useRef, useState, useCallback } from "react";
import ContextMenu from "./ContextMenu";
import type { ContextMenuItem } from "./ContextMenu";

interface AppIconProps {
  name: string;
  link: string;
  icon?: string; // bundled local path
  iconData?: string; // user-uploaded base64, takes priority
  displayName?: boolean;
  isInDock?: boolean;
  focused?: boolean;
  onLaunch?: (name: string, link: string) => void;
  contextMenuItems?: ContextMenuItem[];
}

const AppIcon = forwardRef<HTMLDivElement, AppIconProps>(
  (
    {
      name,
      link,
      icon,
      iconData,
      displayName = false,
      isInDock = false,
      focused = false,
      onLaunch,
      contextMenuItems,
    },
    forwardedRef,
  ) => {
    const [hovered, setHovered] = useState(false);
    const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
      null,
    );

    const localRef = useRef<HTMLDivElement>(null);

    const handleClick = useCallback(() => {
      if (onLaunch) {
        onLaunch(name, link);
        return;
      }
      window.electronAPI?.openApp(link);
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
    const src = iconData ?? icon;

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
            ref={(el) => {
              localRef.current = el;
              if (typeof forwardedRef === "function") {
                forwardedRef(el);
              } else if (forwardedRef) {
                forwardedRef.current = el;
              }
            }}
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
              width: isInDock ? 200 : "100%",
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
            {src ? (
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
              // Letter tile fallback when no icon is available
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `hsl(${[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 35%, 25%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.6)",
                  userSelect: "none",
                }}
              >
                {name[0]}
              </div>
            )}
          </div>

          {!isInDock && (
            <span
              style={{
                color: "white",
                fontSize: 14,
                opacity: isActive || displayName ? 1 : 0,
                transition: "opacity 0.2s",
                userSelect: "none",
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
  },
);

export default AppIcon;
