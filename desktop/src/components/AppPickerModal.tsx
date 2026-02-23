import { useState, useEffect, useRef, useCallback } from "react";

export interface AvailableApp {
  name: string;
  link: string;
  category?: string;
  icon?: string;
}

interface AppPickerModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (app: AvailableApp) => void;
  onCustom: () => void;
  existingLinks: Set<string>;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CSS = `
  @keyframes pickerBackdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pickerPanelIn {
    from { opacity: 0; transform: translate(-50%, -46%) scale(0.95); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  .picker-backdrop {
    animation: pickerBackdropIn 0.2s ease forwards;
  }
  .picker-panel {
    animation: pickerPanelIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .picker-app-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 16px 10px 14px;
    border-radius: 16px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s ease;
    user-select: none;
    outline: none;
    min-height: 96px;
  }
  .picker-app-card:hover:not(.picker-app-card--added),
  .picker-app-card:focus-visible:not(.picker-app-card--added) {
    background: rgba(99,179,255,0.1);
    border-color: rgba(99,179,255,0.45);
    transform: scale(1.06) translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,179,255,0.2);
  }
  .picker-app-card:active:not(.picker-app-card--added) {
    transform: scale(0.98);
  }
  .picker-app-card--added {
    opacity: 0.4;
    cursor: default;
  }

  .picker-app-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    object-fit: cover;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    flex-shrink: 0;
    display: block;
  }

  .picker-app-name {
    font-size: 12px;
    font-weight: 500;
    color: rgba(255,255,255,0.8);
    text-align: center;
    line-height: 1.3;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .picker-added-badge {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(80,200,120,0.25);
    border: 1px solid rgba(80,200,120,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .picker-category-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.28);
    margin: 16px 0 8px;
    padding-left: 2px;
  }
  .picker-category-label:first-child {
    margin-top: 0;
  }

  .picker-custom-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: 14px;
    border: 1.5px dashed rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.03);
    color: rgba(255,255,255,0.45);
    font-size: 14px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease, transform 0.15s ease;
    letter-spacing: 0.01em;
  }
  .picker-custom-btn:hover, .picker-custom-btn:focus-visible {
    border-color: rgba(99,179,255,0.45);
    background: rgba(99,179,255,0.07);
    color: rgba(99,179,255,0.85);
    outline: none;
    transform: scale(1.01);
  }
  .picker-custom-btn:active {
    transform: scale(0.99);
  }

  .picker-scroll {
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.12) transparent;
  }
  .picker-scroll::-webkit-scrollbar { width: 4px; }
  .picker-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
  .picker-scroll::-webkit-scrollbar-track { background: transparent; }
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByCategory(apps: AvailableApp[]): [string, AvailableApp[]][] {
  const map = new Map<string, AvailableApp[]>();
  for (const app of apps) {
    const cat = app.category ?? "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(app);
  }
  return Array.from(map.entries());
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppPickerModal({
  open,
  onClose,
  onPick,
  onCustom,
  existingLinks,
}: AppPickerModalProps) {
  const [apps, setApps] = useState<AvailableApp[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load available apps when opened
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    window.electronAPI
      ?.getAvailableApps()
      .then((list) => setApps(list ?? []))
      .catch(() => setApps([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Focus first focusable element on open
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        panelRef.current
          ?.querySelector<HTMLElement>(
            ".picker-app-card:not(.picker-app-card--added), .picker-custom-btn",
          )
          ?.focus();
      }, 80);
    }
  }, [open]);

  const handlePick = useCallback(
    (app: AvailableApp) => {
      if (existingLinks.has(app.link)) return;
      onPick(app);
      onClose();
    },
    [existingLinks, onPick, onClose],
  );

  const handleCustom = useCallback(() => {
    onClose();
    onCustom();
  }, [onClose, onCustom]);

  if (!open) return null;

  const grouped = groupByCategory(apps);

  return (
    <>
      <style>{CSS}</style>

      {/* Backdrop */}
      <div
        className="picker-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="picker-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Add app"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 101,
          width: "min(680px, 94vw)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(14,18,34,0.88)",
          backdropFilter: "blur(60px) saturate(200%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "26px",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "26px 28px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "19px",
                  fontWeight: 700,
                  color: "#fff",
                  letterSpacing: "-0.01em",
                }}
              >
                Add App
              </h2>
              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.36)",
                }}
              >
                Choose from the list or add your own
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "rgba(255,255,255,0.5)",
                flexShrink: 0,
                transition: "background 0.15s, color 0.15s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.13)";
                e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M1 1l10 10M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable app grid */}
        <div
          className="picker-scroll"
          style={{ flex: 1, padding: "20px 28px", overflowY: "auto" }}
        >
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 160,
                color: "rgba(255,255,255,0.25)",
                fontSize: "14px",
              }}
            >
              Loading…
            </div>
          ) : apps.length === 0 ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 160,
                color: "rgba(255,255,255,0.25)",
                fontSize: "14px",
              }}
            >
              No apps found.
            </div>
          ) : (
            grouped.map(([category, catApps]) => (
              <div key={category}>
                <div className="picker-category-label">{category}</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(5, 1fr)",
                    gap: "10px",
                    marginBottom: "4px",
                  }}
                >
                  {catApps.map((app) => {
                    const added = existingLinks.has(app.link);
                    return (
                      <div
                        key={app.link}
                        role="button"
                        tabIndex={added ? -1 : 0}
                        className={[
                          "picker-app-card",
                          added ? "picker-app-card--added" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-label={`${app.name}${added ? " (already added)" : ""}`}
                        aria-disabled={added}
                        onClick={() => handlePick(app)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handlePick(app);
                          }
                        }}
                      >
                        {added && (
                          <span
                            className="picker-added-badge"
                            aria-hidden="true"
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6l3 3 5-5"
                                stroke="rgba(80,200,120,0.9)"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                        )}
                        <img
                          className="picker-app-icon"
                          src={app.icon ?? ""}
                          alt=""
                          draggable={false}
                          onError={(e) => {
                            // Fallback: render a coloured letter tile
                            const img = e.target as HTMLImageElement;
                            img.style.display = "none";
                            const sibling =
                              img.nextElementSibling as HTMLElement | null;
                            if (sibling) sibling.style.display = "flex";
                          }}
                        />
                        {/* Letter fallback — hidden until img errors */}
                        <span
                          aria-hidden="true"
                          style={{
                            display: "none",
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: `hsl(${[...app.name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360}, 40%, 28%)`,
                            border: "1px solid rgba(255,255,255,0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 20,
                            fontWeight: 700,
                            color: "rgba(255,255,255,0.7)",
                            flexShrink: 0,
                          }}
                        >
                          {app.name[0]}
                        </span>
                        <span className="picker-app-name">{app.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer — custom app CTA */}
        <div
          style={{
            padding: "16px 28px 22px",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            flexShrink: 0,
          }}
        >
          <button className="picker-custom-btn" onClick={handleCustom}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add custom app…
          </button>
        </div>
      </div>
    </>
  );
}
