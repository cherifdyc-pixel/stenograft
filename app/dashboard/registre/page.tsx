"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const RED = "#C8312A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const BG = "#0F1119";
const SURFACE = "#161926";
const BORDER = "#1F2436";

type Entry = {
  id: string;
  date: string;
  author: string;
  context: string;
  content: string;
  created_at: string;
};

export default function RegistrePage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("registre")
      .select("*")
      .order("date", { ascending: false });
    if (err) { setError("La table registre n'existe pas encore."); setLoading(false); return; }
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleAdded = (entry: Entry) => {
    setEntries((prev) => [entry, ...prev]);
  };

  return (
    <div style={{ padding: "44px 52px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
              📜
            </div>
            <h1 style={{ color: "#ECEAE2", fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>Le Registre</h1>
          </div>
          <p style={{ color: "#2A2F45", fontSize: "13px", margin: 0 }}>Consignation des paroles officielles</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
            color: "#fff", border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: "12px", padding: "12px 22px",
            fontSize: "14px", fontWeight: 800, cursor: "pointer",
            boxShadow: `0 4px 20px rgba(200,49,42,0.4)`,
            letterSpacing: "0.3px",
          }}
        >
          + Consigner
        </button>
      </div>

      {/* Gold separator */}
      <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}50, ${GOLD}20, transparent)`, margin: "24px 0 36px" }} />

      {error && (
        <div style={{ background: `${RED}15`, border: `1px solid ${RED}35`, borderRadius: "12px", padding: "16px 20px", marginBottom: "28px" }}>
          <p style={{ color: RED, fontSize: "13px", fontWeight: 700, margin: "0 0 6px" }}>{error}</p>
          <p style={{ color: "#5A6076", fontSize: "12px", margin: 0, fontFamily: "monospace" }}>
            Crée la table via Supabase SQL Editor (voir ci-dessous).
          </p>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#2A2F45", fontSize: "14px" }}>Chargement…</p>
      ) : entries.length === 0 && !error ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {entries.map((e, i) => (
            <EntryRow
              key={e.id}
              entry={e}
              index={entries.length - i}
              expanded={expanded === e.id}
              onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <AddEntryModal onClose={() => setModalOpen(false)} onAdded={handleAdded} />
      )}
    </div>
  );
}

function EntryRow({ entry, index, expanded, onToggle }: { entry: Entry; index: number; expanded: boolean; onToggle: () => void }) {
  const date = new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? `linear-gradient(135deg, ${SURFACE} 0%, #1A1D2B 100%)` : SURFACE,
        border: `1px solid ${expanded ? GOLD + "35" : BORDER}`,
        borderLeft: `3px solid ${expanded ? GOLD : BORDER}`,
        borderRadius: "14px", cursor: "pointer",
        marginBottom: "10px",
        boxShadow: expanded ? `0 4px 24px rgba(201,168,76,0.06)` : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
        overflow: "hidden",
      }}
    >
      {/* Row header */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px" }}>
        {/* Index badge */}
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
          background: expanded ? `linear-gradient(135deg, ${GOLD}25 0%, ${RED}15 100%)` : `${BORDER}`,
          border: `1px solid ${expanded ? GOLD + "40" : BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: expanded ? GOLD : "#3A4060", fontSize: "11px", fontWeight: 800,
          transition: "all 0.15s",
        }}>
          {String(index).padStart(3, "0")}
        </div>

        {/* Date + Author */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px", flexWrap: "wrap" }}>
            <span style={{ color: expanded ? GOLD_LIGHT : "#ECEAE2", fontSize: "14px", fontWeight: 700, transition: "color 0.15s" }}>
              {entry.author}
            </span>
            <span style={{ color: "#2A2F45", fontSize: "12px" }}>·</span>
            <span style={{ color: expanded ? GOLD : "#5A6076", fontSize: "12px", fontWeight: 600, textTransform: "capitalize", transition: "color 0.15s" }}>
              {date}
            </span>
          </div>
          <span style={{
            display: "inline-block", background: expanded ? `${GOLD}18` : `${BORDER}`, color: expanded ? GOLD : "#3A4060",
            fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px",
            letterSpacing: "0.5px", textTransform: "uppercase", transition: "all 0.15s",
          }}>
            {entry.context}
          </span>
        </div>

        {/* Preview + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          {!expanded && (
            <p style={{ color: "#3A4060", fontSize: "13px", margin: 0, maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {entry.content}
            </p>
          )}
          <span style={{ color: expanded ? GOLD : "#3A4060", fontSize: "12px", transition: "transform 0.2s, color 0.15s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
            ▾
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: `1px solid ${GOLD}18` }}>
          <div style={{ marginTop: "16px" }}>
            <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", margin: "0 0 10px", opacity: 0.7 }}>
              Parole consignée
            </p>
            <blockquote style={{
              margin: 0, padding: "16px 20px",
              background: BG, borderRadius: "10px",
              borderLeft: `3px solid ${GOLD}60`,
              color: "#C8CADA", fontSize: "15px", lineHeight: 1.75,
              fontStyle: "italic", whiteSpace: "pre-wrap",
            }}>
              {entry.content}
            </blockquote>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "56px" }}>
      <div style={{
        width: "68px", height: "68px", borderRadius: "18px",
        border: `1px dashed ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "30px", color: "#1F2436",
      }}>📜</div>
      <p style={{ color: "#2A2F45", fontSize: "15px", fontWeight: 600, margin: 0 }}>Le registre est vide</p>
      <p style={{ color: "#1F2436", fontSize: "13px", margin: 0, textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>
        Consigne la première parole officielle.
      </p>
      <button onClick={onAdd} style={{
        marginTop: "8px",
        background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
        color: "#fff", border: `1px solid rgba(201,168,76,0.2)`,
        borderRadius: "10px", padding: "10px 22px",
        fontSize: "14px", fontWeight: 700, cursor: "pointer",
        boxShadow: `0 4px 16px rgba(200,49,42,0.3)`,
      }}>
        + Consigner une parole
      </button>
    </div>
  );
}

function AddEntryModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: Entry) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ date: today, author: "", context: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const valid = form.author.trim() && form.context.trim() && form.content.trim() && form.date;

  const handleSubmit = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("registre")
      .insert({ date: form.date, author: form.author.trim(), context: form.context.trim(), content: form.content.trim() })
      .select()
      .single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onAdded(data as Entry);
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: BG, border: `1px solid ${BORDER}`,
    borderRadius: "10px", padding: "11px 14px",
    color: "#ECEAE2", fontSize: "14px", outline: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    color: GOLD, fontSize: "10px", fontWeight: 700,
    letterSpacing: "1.2px", textTransform: "uppercase",
    display: "block", marginBottom: "7px", opacity: 0.85,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "560px", boxShadow: `0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,168,76,0.07)`, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h2 style={{ color: "#ECEAE2", fontSize: "18px", fontWeight: 900, margin: "0 0 4px" }}>Consigner une parole</h2>
            <p style={{ color: "#2A2F45", fontSize: "13px", margin: 0 }}>Enregistrement officiel au registre</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#5A6076", fontSize: "20px", cursor: "pointer", padding: "4px 8px", marginTop: "-4px" }}>×</button>
        </div>

        {/* Gold divider */}
        <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}30, transparent)`, marginBottom: "24px" }} />

        <div style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
          {/* Date */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={form.date}
              onChange={set("date")}
              style={{ ...inputStyle, colorScheme: "dark" }}
              onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
          </div>
          {/* Auteur */}
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Auteur *</label>
            <input
              ref={firstRef}
              value={form.author}
              onChange={set("author")}
              placeholder="Nom complet"
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
          </div>
        </div>

        {/* Contexte */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Contexte *</label>
          <input
            value={form.context}
            onChange={set("context")}
            placeholder="Ex: Discours d'ouverture, Interview, Communiqué…"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {/* Contenu */}
        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Parole consignée *</label>
          <textarea
            value={form.content}
            onChange={set("content")}
            placeholder="Retranscription exacte de la parole…"
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }}
            onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {error && <p style={{ color: RED, fontSize: "12px", fontWeight: 600, margin: "0 0 14px" }}>{error}</p>}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", color: "#5A6076", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || loading}
            style={{
              background: !valid ? "#1F2436" : `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
              color: !valid ? "#3A4060" : "#fff",
              border: `1px solid ${!valid ? "transparent" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "10px", padding: "10px 22px",
              fontSize: "14px", fontWeight: 800,
              cursor: valid && !loading ? "pointer" : "not-allowed",
              boxShadow: valid ? `0 4px 16px rgba(200,49,42,0.3)` : "none",
              transition: "all 0.15s",
            }}
          >
            {loading ? "Consignation…" : "Consigner au registre"}
          </button>
        </div>
      </div>
    </div>
  );
}
