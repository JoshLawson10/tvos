"use client";

import { useState, useEffect } from "react";
import AppIcon from "@/components/AppIcon";

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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Hero area — dock sits at the bottom of this */}
      <div
        className="flex items-end justify-center w-full"
        style={{
          height: "100vh",
          background: "linear-gradient(to bottom, #1a1a2e, #16213e, #0f3460)",
        }}
      >
        <div className="w-[80%] pb-8">
          {/* Dock */}
          <div
            className="dock flex gap-8 p-4 bg-gray-800 rounded-2xl w-full justify-center"
            onDragOver={(e) => e.preventDefault()}
          >
            {dockApps.map((app, i) => (
              <div
                key={`dock-${i}`}
                className="w-[calc(100%/5-1.75rem)]"
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
                  opacity:
                    dragging?.from === "dock" && dragging.index === i ? 0.3 : 1,
                  outline:
                    dockDragOver === i
                      ? "2px dashed rgba(255,255,255,0.4)"
                      : "none",
                  borderRadius: "12px",
                  transition: "outline 0.1s ease, opacity 0.15s ease",
                }}
              >
                <AppIcon name={app} isInDock={true} />
              </div>
            ))}

            {dockApps.length < 5 && dragging?.from === "library" && (
              <div
                className="w-[calc(100%/5-1.75rem)] aspect-video rounded-xl border-2 border-dashed border-white/30"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDockDragOver(dockApps.length);
                }}
                onDragLeave={() => setDockDragOver(null)}
                onDrop={() => {
                  handleDropOnDock(dockApps.length);
                  setDockDragOver(null);
                }}
                style={{
                  background:
                    dockDragOver === dockApps.length
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  transition: "background 0.15s ease",
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* App Library */}
      <div className="flex justify-center py-8">
        <div
          className="app-library grid grid-cols-5 gap-8 w-[80%] px-8"
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
                    ? 0.3
                    : 1,
                outline:
                  libraryDragOver === i
                    ? "2px dashed rgba(255,255,255,0.4)"
                    : "none",
                borderRadius: "12px",
                transition: "outline 0.1s ease, opacity 0.15s ease",
              }}
            >
              <AppIcon name={app} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
