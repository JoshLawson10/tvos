"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LaunchOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AppWindowProps {
  appName: string;
  link: string;
  origin: LaunchOrigin;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const OPEN_DURATION_MS = 420;
const CLOSE_DURATION_MS = 320;
const OPEN_EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
const CLOSE_EASING = "cubic-bezier(0.4, 0, 1, 1)";

// How long to wait after onLoad before assuming the site blocked the iframe.
// Legitimate pages populate their document quickly; blocked iframes load an
// empty document instantly and never update their contentDocument.
const BLOCK_DETECT_DELAY_MS = 1200;

// ─── Keyframe injection ───────────────────────────────────────────────────────

if (typeof document !== "undefined") {
  const id = "tvos-spin-keyframe";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `@keyframes tvos-spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(s);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function originTransform(origin: LaunchOrigin): string {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.max(origin.width / vw, origin.height / vh, 0.04);
  return `translate(${origin.x - vw / 2}px, ${origin.y - vh / 2}px) scale(${scale})`;
}

/**
 * Best-effort check for a blocked iframe. Browsers that enforce X-Frame-Options
 * or CSP frame-ancestors load a blank document into the frame. We try to read
 * contentDocument — if it's null (cross-origin security error) or empty, the
 * site is very likely blocked.
 */
function isIframeBlocked(iframe: HTMLIFrameElement): boolean {
  try {
    const doc = iframe.contentDocument;
    // Null means cross-origin access was denied — definitely blocked
    if (!doc) return true;
    // An empty body is the tell-tale sign of a blocked frame
    return doc.body === null || doc.body.innerHTML.trim() === "";
  } catch {
    // Security error reading cross-origin document → blocked
    return true;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "2.5px solid rgba(255,255,255,0.08)",
        borderTopColor: "rgba(255,255,255,0.6)",
        animation: "tvos-spin 0.75s linear infinite",
      }}
    />
  );
}

interface BlockedScreenProps {
  appName: string;
  link: string;
  onClose: () => void;
}

function BlockedScreen({ appName, link, onClose }: BlockedScreenProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, #080810 0%, #0d0d20 50%, #080810 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 40,
        zIndex: 1,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4zm0 2c1.9 0 3.67.53 5.18 1.44L7.44 21.18A9.94 9.94 0 0 1 6 16c0-5.52 4.48-10 10-10zm0 20c-1.9 0-3.67-.53-5.18-1.44l13.74-13.74A9.94 9.94 0 0 1 26 16c0 5.52-4.48 10-10 10z"
            fill="rgba(255,255,255,0.25)"
          />
        </svg>
      </div>

      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <h2
          style={{
            fontFamily:
              "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",
            fontSize: 20,
            fontWeight: 600,
            color: "rgba(255,255,255,0.9)",
            margin: "0 0 10px",
            letterSpacing: -0.3,
          }}
        >
          {appName} can&apos;t be embedded
        </h2>
        <p
          style={{
            fontFamily:
              "-apple-system,'SF Pro Text','Helvetica Neue',sans-serif",
            fontSize: 14,
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          This site uses security headers that prevent it from loading inside
          another page. You can open it directly in a new tab instead.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
          style={{
            padding: "10px 22px",
            borderRadius: 980,
            border: "none",
            background: "rgba(255,255,255,0.9)",
            color: "#050A14",
            fontFamily: "-apple-system,'SF Pro Text',sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "transform 0.15s ease, background 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.9)")
          }
        >
          Open in new tab ↗
        </button>
        <button
          onClick={onClose}
          style={{
            padding: "10px 22px",
            borderRadius: 980,
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.7)",
            fontFamily: "-apple-system,'SF Pro Text',sans-serif",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
          }
        >
          Go back
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Phase = "opening" | "open" | "closing";
type Content = "loading" | "loaded" | "blocked";

export default function AppWindow({
  appName,
  link,
  origin,
  onClose,
}: AppWindowProps) {
  const [phase, setPhase] = useState<Phase>("opening");
  const [content, setContent] = useState<Content>("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Two-rAF open animation
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase("open")),
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleClose = useCallback(() => {
    setPhase("closing");
    const t = setTimeout(onClose, CLOSE_DURATION_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Backspace") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // After iframe fires onLoad, wait briefly then check if the frame is empty.
  // Blocked iframes resolve instantly with an empty document; real pages have content.
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const timer = setTimeout(() => {
      if (isIframeBlocked(iframe)) {
        setContent("blocked");
      } else {
        setContent("loaded");
      }
    }, BLOCK_DETECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  const isAnimating = phase === "opening" || phase === "closing";
  const duration =
    phase === "closing" ? `${CLOSE_DURATION_MS}ms` : `${OPEN_DURATION_MS}ms`;
  const easing = phase === "closing" ? CLOSE_EASING : OPEN_EASING;
  const displayUrl = link.replace(/^https?:\/\//, "");

  return (
    <div
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: isAnimating ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.85)",
        backdropFilter: isAnimating ? "none" : "blur(8px)",
        WebkitBackdropFilter: isAnimating ? "none" : "blur(8px)",
        transition: `background ${duration} ${easing}`,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          transform: isAnimating
            ? originTransform(origin)
            : "translate(0,0) scale(1)",
          opacity: isAnimating ? 0 : 1,
          borderRadius: isAnimating ? "20px" : "0px",
          overflow: "hidden",
          transition: [
            `transform ${duration} ${easing}`,
            `opacity ${duration} ${easing}`,
            `border-radius ${duration} ${easing}`,
          ].join(", "),
          willChange: "transform, opacity",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "52px",
            padding: "0 20px",
            flexShrink: 0,
            background: "rgba(10,10,20,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          <button
            onClick={handleClose}
            aria-label={`Close ${appName}`}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,75,75,0.85)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.3), 0 2px 8px rgba(255,75,75,0.4)",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.15)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                stroke="rgba(0,0,0,0.7)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>

          <span
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontFamily:
                "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              letterSpacing: "0.01em",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            {appName}
          </span>

          <span
            style={{
              marginLeft: "auto",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "rgba(255,255,255,0.35)",
              maxWidth: 220,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayUrl}
          </span>
        </div>

        {/* Content area */}
        <div style={{ flex: 1, position: "relative", background: "#000" }}>
          {/* Loading state */}
          {content === "loading" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, #0a0a18 0%, #0f0f2a 50%, #0a0a18 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                zIndex: 1,
              }}
            >
              <Spinner />
              <span
                style={{
                  fontFamily: "-apple-system,'SF Pro Text',sans-serif",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  letterSpacing: "0.04em",
                }}
              >
                Loading {appName}…
              </span>
            </div>
          )}

          {/* Blocked state */}
          {content === "blocked" && (
            <BlockedScreen
              appName={appName}
              link={link}
              onClose={handleClose}
            />
          )}

          {/* iframe — always mounted so onLoad fires, hidden until loaded */}
          <iframe
            ref={iframeRef}
            src={link}
            title={appName}
            onLoad={handleIframeLoad}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              display: "block",
              opacity: content === "loaded" ? 1 : 0,
              transition: "opacity 0.35s ease",
              position: "absolute",
              inset: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}
