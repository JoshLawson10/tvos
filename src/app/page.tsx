"use client";

import { useState, useEffect, useCallback } from "react";
import AppIcon from "@/components/AppIcon";
import Clock from "@/components/Clock";
import Orb from "@/components/Orb";

// ─── Types ───────────────────────────────────────────────────────────────────

type DragSource = "dock" | "library";

interface DragState {
  name: string;
  from: DragSource;
  index: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DOCK_MAX_APPS = 5;
const STORAGE_KEY_DOCK = "dockApps";
const STORAGE_KEY_LIBRARY = "libraryApps";

const DEFAULT_DOCK: string[] = [
  "Finder",
  "Safari",
  "Mail",
  "Messages",
  "Calendar",
];

const DEFAULT_LIBRARY: string[] = Array.from({ length: 4 }, () => [
  "Finder",
  "Safari",
  "Mail",
  "Messages",
  "Calendar",
]).flat();

// ─── Styles ──────────────────────────────────────────────────────────────────

const ANIMATIONS = `
  @keyframes orb1 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(80px, -60px) scale(1.1); }
    66% { transform: translate(-40px, 40px) scale(0.95); }
  }
  @keyframes orb2 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(-60px, 80px) scale(0.9); }
    66% { transform: translate(50px, -30px) scale(1.05); }
  }
  @keyframes orb3 {
    0%, 100% { transform: translate(0px, 0px) scale(1); }
    50% { transform: translate(30px, 60px) scale(1.08); }
  }

  .dock-glass {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(40px) saturate(180%) brightness(1.1);
    -webkit-backdrop-filter: blur(40px) saturate(180%) brightness(1.1);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-bottom: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 8px 32px rgba(0,0,0,0.45),
      0 2px 8px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 0 -1px 0 rgba(0,0,0,0.12),
      inset 1px 0 0 rgba(255,255,255,0.08),
      inset -1px 0 0 rgba(255,255,255,0.08);
  }
  .dock-glass::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg,
      rgba(255,255,255,0.12) 0%,
      rgba(255,255,255,0.04) 40%,
      rgba(255,255,255,0.08) 100%
    );
    pointer-events: none;
  }
  .library-glass {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(60px) saturate(160%) brightness(1.05);
    -webkit-backdrop-filter: blur(60px) saturate(160%) brightness(1.05);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow:
      0 4px 24px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.15),
      inset 0 -1px 0 rgba(0,0,0,0.1);
  }
`;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or private browsing — silently ignore
  }
}

// ─── Reorder helper ───────────────────────────────────────────────────────────

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Home() {
  const [dockApps, setDockApps] = useState<string[]>(DEFAULT_DOCK);
  const [libraryApps, setLibraryApps] = useState<string[]>(DEFAULT_LIBRARY);
  const [mounted, setMounted] = useState(false);

  const [dragging, setDragging] = useState<DragState | null>(null);
  const [dockDragOver, setDockDragOver] = useState<number | null>(null);
  const [libraryDragOver, setLibraryDragOver] = useState<number | null>(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setDockApps(readStorage(STORAGE_KEY_DOCK, DEFAULT_DOCK));
    setLibraryApps(readStorage(STORAGE_KEY_LIBRARY, DEFAULT_LIBRARY));
    setMounted(true);
  }, []);

  // Persist dock
  useEffect(() => {
    if (mounted) writeStorage(STORAGE_KEY_DOCK, dockApps);
  }, [dockApps, mounted]);

  // Persist library
  useEffect(() => {
    if (mounted) writeStorage(STORAGE_KEY_LIBRARY, libraryApps);
  }, [libraryApps, mounted]);

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragStart = useCallback(
    (name: string, from: DragSource, index: number) => {
      setDragging({ name, from, index });
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDockDragOver(null);
    setLibraryDragOver(null);
  }, []);

  const handleDropOnDock = useCallback(
    (targetIndex: number) => {
      if (!dragging) return;

      if (dragging.from === "dock") {
        setDockApps((prev) => reorder(prev, dragging.index, targetIndex));
      } else {
        if (dockApps.length >= DOCK_MAX_APPS) return;
        setLibraryApps((prev) => {
          const next = [...prev];
          next.splice(dragging.index, 1);
          return next;
        });
        setDockApps((prev) => {
          const next = [...prev];
          next.splice(targetIndex, 0, dragging.name);
          return next;
        });
      }
    },
    [dragging, dockApps.length],
  );

  const handleDropOnLibrary = useCallback(
    (targetIndex: number) => {
      if (!dragging) return;

      if (dragging.from === "library") {
        setLibraryApps((prev) => reorder(prev, dragging.index, targetIndex));
      } else {
        setDockApps((prev) => {
          const next = [...prev];
          next.splice(dragging.index, 1);
          return next;
        });
        setLibraryApps((prev) => {
          const next = [...prev];
          next.splice(targetIndex, 0, dragging.name);
          return next;
        });
      }
    },
    [dragging],
  );

  // ── Render ───────────────────────────────────────────────────────────────

  const dockDropPlaceholderVisible =
    dockApps.length < DOCK_MAX_APPS && dragging?.from === "library";

  return (
    <>
      <style>{ANIMATIONS}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#050A14",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        {/* ── Ambient orbs ─────────────────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <Orb
            color="rgba(56, 130, 246, 0.55)"
            size="55vw"
            top="5%"
            left="10%"
            animation="orb1 18s ease-in-out infinite"
          />
          <Orb
            color="rgba(139, 92, 246, 0.45)"
            size="50vw"
            top="20%"
            right="5%"
            animation="orb2 22s ease-in-out infinite"
          />
          <Orb
            color="rgba(6, 182, 212, 0.35)"
            size="35vw"
            bottom="30%"
            left="35%"
            animation="orb3 15s ease-in-out infinite"
          />
          {/* Dark vignette */}
          <div
            style={{
              position: "absolute",
              width: "80vw",
              height: "80vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(30, 27, 75, 0.8) 0%, rgba(5, 10, 20, 0) 70%)",
              top: "-20%",
              left: "-10%",
            }}
          />
        </div>

        {/* ── Film-grain noise overlay ───────────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            opacity: 0.025,
          }}
        />

        <Clock />

        {/* ── Dock ─────────────────────────────────────────────────────── */}
        <div
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            position: "relative",
            zIndex: 2,
            paddingBottom: "40px",
          }}
        >
          <div
            style={{ width: "80%", position: "relative", minHeight: "120px" }}
          >
            <div
              className="dock-glass"
              onDragOver={(e) => e.preventDefault()}
              style={{
                display: "flex",
                gap: "24px",
                padding: "20px 28px",
                borderRadius: "28px",
                width: "100%",
                justifyContent: "center",
                position: "relative",
              }}
            >
              {dockApps.map((app, i) => (
                <div
                  key={`dock-${i}`}
                  draggable
                  onDragStart={() => handleDragStart(app, "dock", i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDockDragOver(i);
                  }}
                  onDragLeave={() => setDockDragOver(null)}
                  onDrop={() => {
                    handleDropOnDock(i);
                    setDockDragOver(null);
                  }}
                  style={{
                    width: `calc(100% / ${DOCK_MAX_APPS} - 24px)`,
                    opacity:
                      dragging?.from === "dock" && dragging.index === i
                        ? 0.25
                        : 1,
                    outline:
                      dockDragOver === i
                        ? "2px dashed rgba(255,255,255,0.55)"
                        : "none",
                    outlineOffset: "4px",
                    borderRadius: "18px",
                    transition:
                      "opacity 0.15s ease, outline 0.08s ease, transform 0.15s ease",
                    transform: dockDragOver === i ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <AppIcon name={app} isInDock />
                </div>
              ))}

              {/* Empty slot shown when dragging from library */}
              {dockDropPlaceholderVisible && (
                <div
                  aria-hidden="true"
                  style={{
                    width: `calc(100% / ${DOCK_MAX_APPS} - 24px)`,
                    aspectRatio: "16/9",
                    borderRadius: "18px",
                    border: "1.5px dashed rgba(255,255,255,0.25)",
                    background:
                      dockDragOver === dockApps.length
                        ? "rgba(255,255,255,0.1)"
                        : "rgba(255,255,255,0.04)",
                    transition: "background 0.15s ease",
                    backdropFilter: "blur(10px)",
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDockDragOver(dockApps.length);
                  }}
                  onDragLeave={() => setDockDragOver(null)}
                  onDrop={() => {
                    handleDropOnDock(dockApps.length);
                    setDockDragOver(null);
                  }}
                />
              )}
            </div>

            {/* Floor reflection */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: "8%",
                right: "8%",
                height: "40px",
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, transparent 100%)",
                borderRadius: "0 0 28px 28px",
                filter: "blur(4px)",
                transform: "scaleY(-0.3)",
                transformOrigin: "top",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* ── App Library ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "48px 0 64px",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ width: "80%" }}>
            <div
              className="library-glass"
              style={{
                borderRadius: "24px",
                padding: "28px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Inner gradient sheen */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.04) 100%)",
                  pointerEvents: "none",
                  borderRadius: "inherit",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${DOCK_MAX_APPS}, 1fr)`,
                  gap: "28px",
                  position: "relative",
                  zIndex: 1,
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                {libraryApps.map((app, i) => (
                  <div
                    key={`lib-${i}`}
                    draggable
                    onDragStart={() => handleDragStart(app, "library", i)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setLibraryDragOver(i);
                    }}
                    onDragLeave={() => setLibraryDragOver(null)}
                    onDrop={() => {
                      handleDropOnLibrary(i);
                      setLibraryDragOver(null);
                    }}
                    style={{
                      opacity:
                        dragging?.from === "library" && dragging.index === i
                          ? 0.2
                          : 1,
                      outline:
                        libraryDragOver === i
                          ? "2px dashed rgba(255,255,255,0.5)"
                          : "none",
                      outlineOffset: "4px",
                      borderRadius: "14px",
                      transition:
                        "opacity 0.15s ease, outline 0.08s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                      transform:
                        libraryDragOver === i ? "scale(1.05)" : "scale(1)",
                    }}
                  >
                    <AppIcon name={app} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
