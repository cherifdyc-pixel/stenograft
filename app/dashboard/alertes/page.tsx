"use client";
import { useState, useEffect } from "react";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

type Alerte = { id: string; mot_cle: string; actif: boolean; created_at: string };

export default function AlertesPage() {
  const [alertes, setAlertes] = useState<Alerte[]>([]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);

  const fetchAlertes = () =>
    fetch("/api/alertes").then(r => r.json()).then(d => Array.isArray(d) ? setAlertes(d) : null);

  useEffect(() => { fetchAlertes(); }, []);

  const ajouter = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    await fetch("/api/alertes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mot_cle: input.trim() }),
    });
    await fetchAlertes();
    setInput("");
    setLoading(false);
  };

  const supprimer = async (id: string) => {
    setAlertes(prev => prev.filter(a => a.id !== id));
    await fetch("/api/alertes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div style={{
      maxWidth: "600px", margin: "0 auto", padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: TEXT, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
          🔔 Mes Alertes
        </h1>
        <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>
          Soyez notifié quand un mot-clé est grafté
        </p>
      </div>

      {/* ── Formulaire ── */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && ajouter()}
          placeholder="Ex : Macron, budget, grève…"
          style={{
            flex: 1, padding: "12px 16px", borderRadius: "10px",
            background: SURF, border: `1px solid ${BORDER}`,
            color: TEXT, fontSize: "14px", outline: "none",
            transition: "border-color 0.15s", fontFamily: "inherit",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />
        <button
          onClick={ajouter}
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 20px", borderRadius: "10px",
            background: input.trim() && !loading ? RED : "#1a1a1a",
            border: "none", color: "#fff", fontSize: "14px", fontWeight: 700,
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            transition: "background 0.15s", whiteSpace: "nowrap",
          }}
        >
          {loading ? "…" : "+ Ajouter"}
        </button>
      </div>

      {/* ── Liste ── */}
      {alertes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔔</div>
          <p style={{ color: TEXT2, fontSize: "14px", margin: 0 }}>Aucune alerte configurée.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {alertes.map(a => (
            <div
              key={a.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 16px", background: SURF,
                borderRadius: "10px", border: `1px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: "16px", lineHeight: 1 }}>🔔</span>
              <span style={{ flex: 1, color: TEXT, fontSize: "14px", fontWeight: 600 }}>
                #{a.mot_cle}
              </span>
              <button
                onClick={() => supprimer(a.id)}
                style={{
                  background: "none", border: "none", color: TEXT2,
                  cursor: "pointer", fontSize: "16px", padding: "4px",
                  lineHeight: 1, transition: "color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = RED)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT2)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
