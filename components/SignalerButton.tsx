"use client";
import { useState, useRef, useEffect } from "react";

const RAISONS = [
  { value: "spam",     label: "Spam ou publicité" },
  { value: "haine",   label: "Discours haineux" },
  { value: "faux",    label: "Information fausse" },
  { value: "violence",label: "Violence ou danger" },
  { value: "autre",   label: "Autre" },
];

export default function SignalerButton({ graftId }: { graftId: string }) {
  const [open,    setOpen]    = useState(false);
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer en cliquant en dehors
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signaler = async (raison: string) => {
    setLoading(true);
    await fetch("/api/signaler", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graft_id: graftId, raison }),
    });
    setLoading(false);
    setSent(true);
    setTimeout(() => { setOpen(false); setSent(false); }, 2000);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Signaler ce graft"
        style={{ background: "none", border: "none", color: "#555", fontSize: "18px", cursor: "pointer", padding: "2px 6px", lineHeight: 1, letterSpacing: "1px" }}
      >
        ···
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "28px", width: "210px",
          background: "#111", border: "1px solid #222", borderRadius: "12px",
          zIndex: 200, overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        }}>
          {sent ? (
            <div style={{ padding: "18px 16px", textAlign: "center", color: "#E0492F", fontSize: "13px", fontWeight: 700 }}>
              ✓ Signalement envoyé
            </div>
          ) : (
            <>
              <div style={{ padding: "10px 14px", fontSize: "10px", color: "#444", borderBottom: "1px solid #1a1a1a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Signaler ce graft
              </div>
              {RAISONS.map((r, i) => (
                <button
                  key={r.value}
                  onClick={() => signaler(r.value)}
                  disabled={loading}
                  style={{
                    display: "block", width: "100%", padding: "10px 14px",
                    background: "none", border: "none",
                    borderBottom: i < RAISONS.length - 1 ? "1px solid #1a1a1a" : "none",
                    textAlign: "left", color: "#888", fontSize: "13px",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.1s, color 0.1s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = "#E0492F"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#888"; }}
                >
                  {r.label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
