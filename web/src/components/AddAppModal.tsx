"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface AppModalValues {
  name: string;
  link: string;
  iconData?: string;
}

interface AddAppModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, link: string, iconData?: string) => void;
  /** When provided the modal opens in edit mode — pre-filled, different title/CTA */
  initialValues?: AppModalValues;
}

const MODAL_CSS = `
  @keyframes modalIn {
    from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
    to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
  @keyframes backdropIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .add-modal-backdrop { animation: backdropIn 0.18s ease forwards; }
  .add-modal-panel    { animation: modalIn 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) forwards; }

  .add-modal-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 12px;
    color: #fff;
    font-size: 15px;
    padding: 13px 16px;
    width: 100%;
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    box-sizing: border-box;
    font-family: inherit;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .add-modal-input::placeholder { color: rgba(255,255,255,0.3); }
  .add-modal-input:focus {
    border-color: rgba(99,179,255,0.6);
    background: rgba(255,255,255,0.09);
    box-shadow: 0 0 0 3px rgba(99,179,255,0.15);
  }

  .add-modal-btn-primary {
    background: linear-gradient(135deg, rgba(99,179,255,0.85) 0%, rgba(139,92,246,0.75) 100%);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    padding: 13px 0;
    cursor: pointer;
    flex: 1;
    transition: filter 0.15s ease, transform 0.12s ease;
    font-family: inherit;
    letter-spacing: 0.01em;
  }
  .add-modal-btn-primary:hover   { filter: brightness(1.12); transform: scale(1.02); }
  .add-modal-btn-primary:active  { transform: scale(0.98); }
  .add-modal-btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

  .add-modal-btn-cancel {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    color: rgba(255,255,255,0.6);
    font-size: 15px;
    font-weight: 500;
    padding: 13px 0;
    cursor: pointer;
    flex: 0 0 100px;
    transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
    font-family: inherit;
  }
  .add-modal-btn-cancel:hover  { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.85); transform: scale(1.02); }
  .add-modal-btn-cancel:active { transform: scale(0.98); }

  /* Icon upload zone */
  .icon-zone {
    width: 100%;
    height: 120px;
    border-radius: 14px;
    border: 1.5px dashed rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    transition: border-color 0.18s ease, background 0.18s ease, transform 0.15s ease;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
  }
  .icon-zone:hover, .icon-zone:focus-visible {
    border-color: rgba(99,179,255,0.5);
    background: rgba(99,179,255,0.06);
    outline: none;
  }
  .icon-zone.drag-over {
    border-color: rgba(99,179,255,0.8);
    background: rgba(99,179,255,0.1);
    transform: scale(1.01);
  }
  .icon-zone.filled {
    border-style: solid;
    border-color: rgba(255,255,255,0.1);
  }
  .icon-zone.filled:hover { border-color: rgba(99,179,255,0.45); }
  .icon-zone.filled:hover .icon-zone-overlay { opacity: 1; }

  .icon-zone-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.52);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;
    opacity: 0;
    transition: opacity 0.18s ease;
    border-radius: inherit;
  }
`;

const FIELD_LABEL: React.CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,0.5)",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "6px",
};

function normaliseUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export default function AddAppModal({
  open,
  onClose,
  onAdd,
  initialValues,
}: AddAppModalProps) {
  const isEditMode = !!initialValues;

  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [iconData, setIconData] = useState<string | undefined>();
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed fields from initialValues when modal opens
  useEffect(() => {
    if (open) {
      setName(initialValues?.name ?? "");
      setLink(initialValues?.link ?? "");
      setIconData(initialValues?.iconData);
      setDragOver(false);
      setError(null);
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally only re-seed when `open` toggles, not on every initialValues change

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }
    try {
      setIconData(await readAsDataURL(file));
      setError(null);
    } catch {
      setError("Couldn't read that image — please try another.");
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) processFile(f);
      e.target.value = "";
    },
    [processFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleSubmit = useCallback(() => {
    const n = name.trim();
    const l = normaliseUrl(link);
    if (!n) {
      setError("Please enter an app name.");
      return;
    }
    if (!l) {
      setError("Please enter a URL.");
      return;
    }
    try {
      new URL(l);
    } catch {
      setError("That doesn't look like a valid URL.");
      return;
    }
    onAdd(n, l, iconData);
    onClose();
  }, [name, link, iconData, onAdd, onClose]);

  if (!open) return null;

  const zoneClass = [
    "icon-zone",
    dragOver ? "drag-over" : "",
    iconData ? "filled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <style>{MODAL_CSS}</style>

      {/* Backdrop */}
      <div
        className="add-modal-backdrop"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Panel */}
      <div
        className="add-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={isEditMode ? "Edit app" : "Add new app"}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          zIndex: 101,
          width: "min(540px, 92vw)",
          background: "rgba(18,22,38,0.85)",
          backdropFilter: "blur(60px) saturate(180%)",
          WebkitBackdropFilter: "blur(60px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: "24px",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          gap: "22px",
        }}
      >
        {/* Header */}
        <div>
          <h2
            style={{
              margin: 0,
              color: "#fff",
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            {isEditMode ? "Edit App" : "Add App"}
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "rgba(255,255,255,0.38)",
              fontSize: "13px",
            }}
          >
            {isEditMode
              ? "Update the name, URL, or icon for this app."
              : "Enter a name and URL, and optionally upload an icon."}
          </p>
        </div>

        {/* Icon + fields row */}
        <div style={{ display: "flex", gap: "18px", alignItems: "flex-start" }}>
          {/* Icon upload */}
          <div style={{ flex: "0 0 200px" }}>
            <label style={FIELD_LABEL}>
              Icon&nbsp;
              <span
                style={{
                  opacity: 0.4,
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                (optional)
              </span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div
              className={zoneClass}
              role="button"
              tabIndex={0}
              aria-label="Upload icon — click or drag an image here"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {iconData ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={iconData}
                    alt="Icon preview"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "inherit",
                    }}
                  />
                  <div className="icon-zone-overlay">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.85)",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      Replace
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      dragOver
                        ? "rgba(99,179,255,0.8)"
                        : "rgba(255,255,255,0.3)"
                    }
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: "stroke 0.15s" }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      textAlign: "center",
                      lineHeight: 1.45,
                      color: dragOver
                        ? "rgba(99,179,255,0.8)"
                        : "rgba(255,255,255,0.28)",
                      transition: "color 0.15s",
                      padding: "0 10px",
                    }}
                  >
                    {dragOver
                      ? "Drop to upload"
                      : "Click or drag\nan image here"}
                  </span>
                </>
              )}
            </div>
            {iconData && (
              <button
                onClick={() => setIconData(undefined)}
                style={{
                  marginTop: "7px",
                  background: "none",
                  border: "none",
                  color: "rgba(255,90,70,0.65)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "inherit",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(255,90,70,1)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,90,70,0.65)")
                }
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
                Remove icon
              </button>
            )}
          </div>

          {/* Name + URL */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <label style={FIELD_LABEL}>App Name</label>
              <input
                ref={nameRef}
                className="add-modal-input"
                type="text"
                placeholder="e.g. Paramount+"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                maxLength={40}
              />
            </div>
            <div>
              <label style={FIELD_LABEL}>URL</label>
              <input
                className="add-modal-input"
                type="url"
                placeholder="e.g. paramountplus.com"
                value={link}
                onChange={(e) => {
                  setLink(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p
            style={{
              margin: 0,
              color: "rgba(255,120,100,0.9)",
              fontSize: "13px",
              padding: "10px 14px",
              background: "rgba(255,80,60,0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(255,80,60,0.2)",
            }}
          >
            {error}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button className="add-modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="add-modal-btn-primary"
            onClick={handleSubmit}
            disabled={!name.trim() || !link.trim()}
          >
            {isEditMode ? "Save Changes" : "Add to Library"}
          </button>
        </div>
      </div>
    </>
  );
}
