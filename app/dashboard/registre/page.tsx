"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#333333";

const CONTEXTS = [
  "Discours", "Promesse", "Déclaration", "Interview",
  "Communiqué", "Séance plénière", "Conférence de presse", "Débat", "Autre",
] as const;
type ContextType = typeof CONTEXTS[number];
type SortKey = "recent" | "oldest" | "author";

const CTX: Record<string, { bg: string; color: string; border: string; icon: string }> = {
  "Discours":             { bg: "#1D4ED810", color: "#60A5FA", border: "#1D4ED840", icon: "🎙️" },
  "Promesse":             { bg: "#16A34A10", color: "#4ADE80", border: "#16A34A40", icon: "🤝" },
  "Déclaration":          { bg: "#D9770610", color: "#FB923C", border: "#D9770640", icon: "📢" },
  "Interview":            { bg: "#7C3AED10", color: "#A78BFA", border: "#7C3AED40", icon: "🎤" },
  "Communiqué":           { bg: "#0891B210", color: "#22D3EE", border: "#0891B240", icon: "📄" },
  "Séance plénière":      { bg: "#92400E10", color: "#FCD34D", border: "#92400E40", icon: "🏛️" },
  "Conférence de presse": { bg: "#BE123C10", color: "#FB7185", border: "#BE123C40", icon: "📺" },
  "Débat":                { bg: "#BE185D10", color: "#F472B6", border: "#BE185D40", icon: "⚖️" },
  "Autre":                { bg: "#37415110", color: "#9CA3AF", border: "#37415140", icon: "📌" },
};

type Entry = {
  id: string; date: string; author: string;
  context: string; content: string; created_at: string; verified?: boolean;
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function relTime(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600)  return `${Math.max(1, Math.floor(s / 60))}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  if (d < 30)    return `${d}j`;
  const m = Math.floor(d / 30);
  return m < 12  ? `${m}mois` : `${Math.floor(m / 12)}an${Math.floor(m / 12) > 1 ? "s" : ""}`;
}

function avatarGrad(name: string) {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},50%,16%) 0%,hsl(${(hue + 50) % 360},62%,36%) 100%)`;
}

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── EntryCard ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, onShare }: { entry: Entry; onShare: (msg: string) => void }) {
  const [copied,    setCopied]    = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const ctx = CTX[entry.context] ?? CTX["Autre"];
  const ini = initials(entry.author);
  const isLong = entry.content.length > 300;

  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const txt = `"${entry.content}" — ${entry.author}, ${fmtDate(entry.date)}`;
    navigator.clipboard.writeText(txt).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/registre#${entry.id}`).catch(() => {});
    onShare("Lien copié !");
  };

  return (
    <article id={entry.id} style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: "14px", transition: "background 0.1s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#060606")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: avatarGrad(entry.author), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px", border: `1.5px solid ${BORDER}` }}>
          {ini}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Row 1 : Nom · date · tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800, letterSpacing: "-0.2px" }}>
            {entry.author}
          </span>
          {entry.verified && (
            <span style={{ color: GOLD, fontSize: "11px", background: `${GOLD}15`, border: `1px solid ${GOLD}30`, borderRadius: "100px", padding: "0px 6px", fontWeight: 700 }}>✓</span>
          )}
          <span style={{ color: TEXT2, fontSize: "13px" }}>·</span>
          <span style={{ color: TEXT2, fontSize: "13px" }} title={fmtDate(entry.date)}>
            {fmtDate(entry.date)}
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 9px", borderRadius: "100px", background: ctx.bg, border: `1px solid ${ctx.border}`, color: ctx.color, fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
            {ctx.icon} {entry.context}
          </span>
        </div>

        {/* Row 2 : Citation */}
        <div style={{ marginBottom: "12px" }}>
          <p style={{
            color: "#C8CADA", fontSize: "15px", lineHeight: 1.65, margin: 0,
            display: "-webkit-box", WebkitBoxOrient: "vertical",
            WebkitLineClamp: expanded || !isLong ? 99 : 5,
            overflow: "hidden",
            whiteSpace: "pre-wrap",
          } as React.CSSProperties}>
            {entry.content}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(v => !v)}
              style={{ background: "none", border: "none", color: "#4B9EFF", fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "4px 0 0", display: "block" }}
            >
              {expanded ? "Réduire" : "Voir plus"}
            </button>
          )}
        </div>

        {/* Row 3 : Consigné le + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ color: TEXT3, fontSize: "12px" }}>Consigné {relTime(entry.created_at)}</span>
          <div style={{ flex: 1 }} />
          <button onClick={copy} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "100px", color: copied ? GOLD : TEXT2, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = copied ? GOLD : "#333"; e.currentTarget.style.color = copied ? GOLD : TEXT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = copied ? GOLD : TEXT2; }}
          >
            {copied ? "✓ Copié" : "📋 Copier"}
          </button>
          <button onClick={share} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT2, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = TEXT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}
          >
            🔗 Partager
          </button>
        </div>
      </div>
    </article>
  );
}

// ── AddEntryModal ─────────────────────────────────────────────────────────────

function AddEntryModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: Entry) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm]       = useState({ date: today, author: "", context: CONTEXTS[0] as string, content: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const valid = form.author.trim() && form.content.trim() && form.date;

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true); setError(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error: err } = await sb
      .from("registre")
      .insert({ date: form.date, author: form.author.trim(), context: form.context, content: form.content.trim(), ...(user ? { added_by: user.id } : {}) })
      .select().maybeSingle();
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (data) onAdded(data as Entry);
    onClose();
  };

  const inp: React.CSSProperties = { width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "11px 14px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "10px", fontWeight: 700, color: GOLD, marginBottom: "6px", letterSpacing: "1px", textTransform: "uppercase", opacity: 0.85 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <div>
            <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Consigner une parole</h2>
            <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Enregistrement au registre officiel</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "24px", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Date *</label>
              <input type="date" value={form.date} onChange={set("date")} style={{ ...inp, colorScheme: "dark" }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={lbl}>Auteur *</label>
              <input ref={firstRef} value={form.author} onChange={set("author")} placeholder="Nom de la personnalité" style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Type de parole *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CONTEXTS.map(ctx => {
                const c = CTX[ctx] ?? CTX["Autre"];
                const on = form.context === ctx;
                return (
                  <button key={ctx} onClick={() => setForm(f => ({ ...f, context: ctx }))}
                    style={{ padding: "5px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.12s", border: `1px solid ${on ? c.border : BORDER}`, background: on ? c.bg : "transparent", color: on ? c.color : TEXT2 }}>
                    {c.icon} {ctx}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={lbl}>Parole consignée *</label>
            <textarea value={form.content} onChange={set("content")} placeholder="Retranscription exacte…" rows={5}
              style={{ ...inp, resize: "vertical", lineHeight: 1.65 }}
              onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <div style={{ textAlign: "right", color: TEXT2, fontSize: "11px", marginTop: "4px" }}>{form.content.length} car.</div>
          </div>

          {error && <p style={{ color: RED, fontSize: "13px", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <button onClick={onClose} style={{ background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "10px 20px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
            <button onClick={submit} disabled={!valid || loading}
              style={{ background: valid && !loading ? RED : "#111", color: valid && !loading ? "#fff" : "#444", border: "none", borderRadius: "100px", padding: "10px 24px", fontSize: "14px", fontWeight: 800, cursor: valid && !loading ? "pointer" : "not-allowed", boxShadow: valid && !loading ? `0 4px 16px ${RED}44` : "none", transition: "all 0.15s" }}>
              {loading ? "Consignation…" : "Consigner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function RegistrePage() {
  const [entries,   setEntries]   = useState<Entry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [dbError,   setDbError]   = useState(false);
  const [modal,     setModal]     = useState(false);
  const [search,    setSearch]    = useState("");
  const [filterCtx, setFilterCtx] = useState("Tous");
  const [sort,      setSort]      = useState<SortKey>("recent");
  const [toast,     setToast]     = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const sb = createClient();
    const { data, error } = await sb.from("registre").select("*").order("date", { ascending: false });
    if (error) { setDbError(true); setLoading(false); return; }
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const allCtx = useMemo(() =>
    ["Tous", ...Array.from(new Set(entries.map(e => e.context)))],
    [entries]
  );

  const filtered = useMemo(() => {
    let list = entries.filter(e => {
      const q = search.toLowerCase();
      const match = !q || e.author.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.context.toLowerCase().includes(q);
      return match && (filterCtx === "Tous" || e.context === filterCtx);
    });
    if (sort === "oldest") list = [...list].reverse();
    if (sort === "author")  list = [...list].sort((a, b) => a.author.localeCompare(b.author, "fr"));
    return list;
  }, [entries, search, filterCtx, sort]);

  // Stats
  const stats = useMemo(() => ({
    total:    entries.length,
    auteurs:  new Set(entries.map(e => e.author)).size,
    ceMois:   entries.filter(e => {
      const d = new Date(e.created_at);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }).length,
  }), [entries]);

  const SORTS: { key: SortKey; label: string }[] = [
    { key: "recent", label: "Récents" },
    { key: "oldest", label: "Anciens" },
    { key: "author", label: "A–Z" },
  ];

  return (
    <>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "90px", left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#000", fontSize: "13px", fontWeight: 700, padding: "10px 20px", borderRadius: "100px", zIndex: 600, pointerEvents: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: "680px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter', system-ui, sans-serif", color: TEXT }}>

        {/* ── Header sticky ───────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${BORDER}` }}>

          {/* Titre + bouton */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 12px" }}>
            <div>
              <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.4px" }}>Le Registre</h1>
              {!loading && !dbError && (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {[
                    { label: `${stats.total} entrée${stats.total !== 1 ? "s" : ""}` },
                    { label: `${stats.auteurs} personnalité${stats.auteurs !== 1 ? "s" : ""}` },
                    stats.ceMois > 0 ? { label: `${stats.ceMois} ce mois` } : null,
                  ].filter(Boolean).map((s, i) => (
                    <span key={i} style={{ color: TEXT2, fontSize: "12px" }}>
                      {i > 0 && <span style={{ marginRight: "10px", color: TEXT3 }}>·</span>}
                      {s!.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setModal(true)}
              style={{ background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "9px 18px", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${RED}44`, flexShrink: 0, transition: "opacity 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              + Consigner
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: "0 20px 10px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", pointerEvents: "none", opacity: 0.5 }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Auteur, parole, contexte…"
                style={{ width: "100%", padding: "9px 36px 9px 38px", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: "18px", lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>
          </div>

          {/* Filtres contexte + tri */}
          <div style={{ display: "flex", gap: "6px", padding: "0 20px 12px", overflowX: "auto", scrollbarWidth: "none", alignItems: "center" }}>
            {allCtx.map(ctx => {
              const on = filterCtx === ctx;
              const c  = CTX[ctx];
              return (
                <button key={ctx} onClick={() => setFilterCtx(ctx)}
                  style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", transition: "all 0.12s", border: `1px solid ${on && c ? c.border : on ? `${GOLD}50` : BORDER}`, background: on && c ? c.bg : on ? `${GOLD}12` : "transparent", color: on && c ? c.color : on ? GOLD : TEXT2 }}>
                  {ctx === "Tous" ? "Tous" : `${CTX[ctx]?.icon ?? "📌"} ${ctx}`}
                </button>
              );
            })}
            <div style={{ width: "1px", height: "16px", background: BORDER, flexShrink: 0, marginLeft: "4px" }} />
            {SORTS.map(s => (
              <button key={s.key} onClick={() => setSort(s.key)}
                style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", transition: "all 0.12s", border: `1px solid ${sort === s.key ? `${RED}50` : BORDER}`, background: sort === s.key ? `${RED}12` : "transparent", color: sort === s.key ? RED : TEXT2 }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── États ────────────────────────────────────────────────── */}

        {/* Erreur DB */}
        {dbError && (
          <div style={{ margin: "20px", background: `${RED}10`, border: `1px solid ${RED}30`, borderRadius: "14px", padding: "20px" }}>
            <p style={{ color: RED, fontSize: "14px", fontWeight: 700, margin: "0 0 4px" }}>Table "registre" introuvable</p>
            <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Crée-la dans Supabase SQL Editor pour activer le registre.</p>
          </div>
        )}

        {/* Skeleton */}
        {loading && (
          <div>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: "14px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#111", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "14px", width: "35%", background: "#111", borderRadius: "6px", marginBottom: "10px" }} />
                  <div style={{ height: "12px", width: "90%", background: "#0d0d0d", borderRadius: "6px", marginBottom: "6px" }} />
                  <div style={{ height: "12px", width: "70%", background: "#0d0d0d", borderRadius: "6px" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feed vide */}
        {!loading && !dbError && entries.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", textAlign: "center", gap: "14px" }}>
            <span style={{ fontSize: "52px" }}>📜</span>
            <p style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: 0 }}>Le registre est vide</p>
            <p style={{ color: TEXT2, fontSize: "14px", margin: 0, maxWidth: "280px", lineHeight: 1.6 }}>Consigne la première parole officielle pour commencer l'historique.</p>
            <button onClick={() => setModal(true)}
              style={{ marginTop: "8px", background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "12px 28px", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 18px ${RED}44` }}>
              + Consigner une parole
            </button>
          </div>
        )}

        {/* Aucun résultat */}
        {!loading && !dbError && entries.length > 0 && filtered.length === 0 && (
          <div style={{ padding: "48px 20px", textAlign: "center" }}>
            <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 12px" }}>Aucune entrée pour cette recherche.</p>
            <button onClick={() => { setSearch(""); setFilterCtx("Tous"); }}
              style={{ color: RED, background: "none", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              Effacer les filtres
            </button>
          </div>
        )}

        {/* ── Feed ─────────────────────────────────────────────────── */}
        {!loading && !dbError && filtered.length > 0 && (
          <>
            {search || filterCtx !== "Tous" ? (
              <p style={{ color: TEXT2, fontSize: "12px", padding: "10px 20px 0" }}>
                {filtered.length} entrée{filtered.length > 1 ? "s" : ""} filtrée{filtered.length > 1 ? "s" : ""}
              </p>
            ) : null}
            {filtered.map(entry => (
              <EntryCard key={entry.id} entry={entry} onShare={msg => setToast(msg)} />
            ))}
          </>
        )}
      </div>

      {modal && <AddEntryModal onClose={() => setModal(false)} onAdded={e => setEntries(p => [e, ...p])} />}
    </>
  );
}
