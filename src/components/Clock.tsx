"use client";

import { useState, useEffect } from "react";

const CLOCK_STYLES = {
  wrapper: {
    position: "fixed" as const,
    top: "28px",
    right: "36px",
    zIndex: 10,
  },
  pill: {
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(40px) saturate(180%) brightness(1.1)",
    WebkitBackdropFilter: "blur(40px) saturate(180%) brightness(1.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "980px",
    padding: "8px 18px",
    boxShadow: [
      "0 4px 20px rgba(0,0,0,0.3)",
      "inset 0 1px 0 rgba(255,255,255,0.45)",
      "inset 0 -1px 0 rgba(0,0,0,0.12)",
    ].join(", "),
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  sheen: {
    position: "absolute" as const,
    inset: 0,
    borderRadius: "inherit",
    background:
      "linear-gradient(160deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 60%, rgba(255,255,255,0.06) 100%)",
    pointerEvents: "none" as const,
  },
  rimHighlight: {
    position: "absolute" as const,
    top: 0,
    left: "12%",
    right: "12%",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 50%, transparent)",
    pointerEvents: "none" as const,
  },
  timeText: {
    position: "relative" as const,
    fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif",
    fontSize: "17px",
    fontWeight: 600,
    letterSpacing: "0.01em",
    color: "rgba(255,255,255,0.92)",
    textShadow: "0 1px 6px rgba(0,0,0,0.4)",
    fontVariantNumeric: "tabular-nums" as const,
  },
} as const;

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

const LOCALE = "en-AU";
const TICK_INTERVAL_MS = 1000;

export default function Clock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  return (
    <div style={CLOCK_STYLES.wrapper} aria-label="Current time" role="status">
      <div style={CLOCK_STYLES.pill}>
        <div style={CLOCK_STYLES.sheen} aria-hidden="true" />
        <div style={CLOCK_STYLES.rimHighlight} aria-hidden="true" />
        <span style={CLOCK_STYLES.timeText}>
          {time.toLocaleTimeString(LOCALE, TIME_FORMAT_OPTIONS)}
        </span>
      </div>
    </div>
  );
}
