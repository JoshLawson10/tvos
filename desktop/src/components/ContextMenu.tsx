import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "danger";
  onSelect: () => void;
  dividerAbove?: boolean;
  disabled?: boolean;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const CSS = `
  @keyframes ctxMenuIn {
    from { opacity: 0; transform: scale(0.92); }
    to   { opacity: 1; transform: scale(1); }
  }
  .ctx-menu {
    position: fixed;
    z-index: 9999;
    min-width: 180px;
    background: rgba(22, 26, 42, 0.92);
    backdrop-filter: blur(40px) saturate(180%);
    -webkit-backdrop-filter: blur(40px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 14px;
    padding: 6px;
    box-shadow: 0 16px 48px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
    animation: ctxMenuIn 0.14s cubic-bezier(0.25, 1, 0.5, 1) forwards;
    transform-origin: top left;
    user-select: none;
  }
  .ctx-menu-item {
    display: flex; align-items: center; gap: 10px;
    width: 100%; padding: 9px 12px; border: none;
    background: transparent; border-radius: 9px; cursor: pointer;
    font-family: inherit; font-size: 14px; font-weight: 500;
    letter-spacing: 0.01em; text-align: left;
    transition: background 0.1s ease, color 0.1s ease;
    box-sizing: border-box; color: rgba(255,255,255,0.82);
  }
  .ctx-menu-item:hover:not(:disabled), .ctx-menu-item:focus-visible:not(:disabled) {
    background: rgba(255,255,255,0.08); outline: none;
  }
  .ctx-menu-item:active:not(:disabled) { background: rgba(255,255,255,0.12); }
  .ctx-menu-item:disabled { opacity: 0.35; cursor: not-allowed; }
  .ctx-menu-item.danger { color: rgba(255, 90, 80, 0.9); }
  .ctx-menu-item.danger:hover:not(:disabled), .ctx-menu-item.danger:focus-visible:not(:disabled) {
    background: rgba(255, 60, 50, 0.12); color: rgba(255, 110, 100, 1);
  }
  .ctx-menu-item-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; opacity: 0.75; }
  .ctx-menu-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 6px; border: none; }
`;

function ContextMenuInner({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        onClose();
    };
    const onScroll = () => onClose();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const timer = setTimeout(() => {
      window.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("scroll", onScroll, {
        capture: true,
        passive: true,
      });
      window.addEventListener("keydown", onKey);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  useEffect(() => {
    menuRef.current
      ?.querySelector<HTMLButtonElement>(".ctx-menu-item:not(:disabled)")
      ?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const btns = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        ".ctx-menu-item:not(:disabled)",
      ) ?? [],
    );
    const idx = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      btns[(idx + 1) % btns.length]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      btns[(idx - 1 + btns.length) % btns.length]?.focus();
    }
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div
        ref={menuRef}
        className="ctx-menu"
        role="menu"
        aria-label="App options"
        style={{ left: x, top: y }}
        onKeyDown={handleKeyDown}
      >
        {items.map((item) => (
          <div key={item.key}>
            {item.dividerAbove && (
              <hr className="ctx-menu-divider" aria-hidden="true" />
            )}
            <button
              role="menuitem"
              className={[
                "ctx-menu-item",
                item.variant === "danger" ? "danger" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                onClose();
              }}
            >
              {item.icon && (
                <span className="ctx-menu-item-icon">{item.icon}</span>
              )}
              {item.label}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export default function ContextMenu(props: ContextMenuProps) {
  if (typeof document === "undefined") return null;
  return createPortal(<ContextMenuInner {...props} />, document.body);
}
