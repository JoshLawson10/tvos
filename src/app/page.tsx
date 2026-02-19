"use client";

import { useState, useEffect } from "react";
import AppIcon from "@/components/AppIcon";
import Clock from "@/components/Clock";

const DEFAULT_DOCK = ["Finder", "Safari", "Mail", "Messages", "Calendar"];
const DEFAULT_LIBRARY = [
  "Finder",
  "Safari",
  "Mail",
  "Messages",
  "Calendar",
  "Finder",
  "Safari",
  "Mail",
  "Messages",
  "Calendar",
  "Finder",
  "Safari",
  "Mail",
  "Messages",
  "Calendar",
  "Finder",
  "Safari",
  "Mail",
  "Messages",
  "Calendar",
];

const GLASS_CSS = `
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }
  @keyframes bgDrift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
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
  .drop-zone-active {
    background: rgba(255,255,255,0.12) !important;
    border: 1.5px dashed rgba(255,255,255,0.5) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.06) !important;
  }
`;

export default function Home() {
  const [dockApps, setDockApps] = useState<string[]>(DEFAULT_DOCK);
  const [libraryApps, setLibraryApps] = useState<string[]>(DEFAULT_LIBRARY);
  const [mounted, setMounted] = useState(false);
  const [dragging, setDragging] = useState<{
    name: string;
    from: "dock" | "library";
    index: number;
  } | null>(null);
  const [dockDragOver, setDockDragOver] = useState<number | null>(null);
  const [libraryDragOver, setLibraryDragOver] = useState<number | null>(null);

  useEffect(() => {
    try {
      const savedDock = localStorage.getItem("dockApps");
      const savedLibrary = localStorage.getItem("libraryApps");
      if (savedDock) setDockApps(JSON.parse(savedDock));
      if (savedLibrary) setLibraryApps(JSON.parse(savedLibrary));
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("dockApps", JSON.stringify(dockApps));
  }, [dockApps, mounted]);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("libraryApps", JSON.stringify(libraryApps));
  }, [libraryApps, mounted]);

  function handleDragStart(
    name: string,
    from: "dock" | "library",
    index: number,
  ) {
    setDragging({ name, from, index });
  }

  function handleDragEnd() {
    setDragging(null);
    setDockDragOver(null);
    setLibraryDragOver(null);
  }

  function handleDropOnDock(targetIndex: number) {
    if (!dragging) return;
    const newDock = [...dockApps];
    if (dragging.from === "dock") {
      newDock.splice(dragging.index, 1);
      newDock.splice(targetIndex, 0, dragging.name);
      setDockApps(newDock);
    } else {
      if (dockApps.length >= 5) return;
      const newLibrary = [...libraryApps];
      newLibrary.splice(dragging.index, 1);
      newDock.splice(targetIndex, 0, dragging.name);
      setDockApps(newDock);
      setLibraryApps(newLibrary);
    }
  }

  function handleDropOnLibrary(targetIndex: number) {
    if (!dragging) return;
    const newLibrary = [...libraryApps];
    if (dragging.from === "library") {
      newLibrary.splice(dragging.index, 1);
      newLibrary.splice(targetIndex, 0, dragging.name);
      setLibraryApps(newLibrary);
    } else {
      const newDock = [...dockApps];
      newDock.splice(dragging.index, 1);
      newLibrary.splice(targetIndex, 0, dragging.name);
      setDockApps(newDock);
      setLibraryApps(newLibrary);
    }
  }

  return (
    <>
      <style>{GLASS_CSS}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#050A14",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: "55vw",
              height: "55vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(56, 130, 246, 0.55) 0%, rgba(56, 130, 246, 0) 70%)",
              top: "5%",
              left: "10%",
              animation: "orb1 18s ease-in-out infinite",
              filter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "50vw",
              height: "50vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(139, 92, 246, 0) 70%)",
              top: "20%",
              right: "5%",
              animation: "orb2 22s ease-in-out infinite",
              filter: "blur(2px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "35vw",
              height: "35vw",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(6, 182, 212, 0.35) 0%, rgba(6, 182, 212, 0) 70%)",
              bottom: "30%",
              left: "35%",
              animation: "orb3 15s ease-in-out infinite",
              filter: "blur(2px)",
            }}
          />
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

        <div
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
          {/* Dock container */}
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
                  style={{
                    width: `calc(100% / 5 - 24px)`,
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
                >
                  <AppIcon name={app} isInDock={true} />
                </div>
              ))}

              {dockApps.length < 5 && dragging?.from === "library" && (
                <div
                  style={{
                    width: `calc(100% / 5 - 24px)`,
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

            {/* Dock reflection — liquid glass floor reflection */}
            <div
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

        {/* ——— APP LIBRARY ——— */}
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
              <div
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
                  gridTemplateColumns: "repeat(5, 1fr)",
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
