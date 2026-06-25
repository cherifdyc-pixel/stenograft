"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1A1A1A";
const TEXT   = "#F0F2F5";
const TEXT2  = "#6B7280";
const TEXT3  = "#2A2A2A";

// Tag color by context type
const TAG: Record<string, { color: string; bg: string; border: string }> = {
  "Discours":             { color: "#60A5FA", bg: "#1D4ED808", border: "#3B82F625" },
  "Promesse":             { color: "#FB923C", bg: "#EA580C08", border: "#F9731625" },
  "Engagement":           { color: "#4ADE80", bg: "#16A34A08", border: "#22C55E25" },
  "Déclaration":          { color: "#9CA3AF", bg: "#37415108", border: "#6B728025" },
  "Interview":            { color: "#A78BFA", bg: "#7C3AED08", border: "#8B5CF625" },
  "Communiqué":           { color: "#22D3EE", bg: "#0891B208", border: "#06B6D425" },
  "Séance plénière":      { color: "#FCD34D", bg: "#92400E08", border: "#F59E0B25" },
  "Conférence de presse": { color: "#FB7185", bg: "#BE123C08", border: "#F43F5E25" },
  "Débat":                { color: "#F472B6", bg: "#BE185D08", border: "#EC4899225" },
  "Autre":                { color: "#6B7280", bg: "#37415108", border: "#4B556325"  },
};

const CTX_ICON: Record<string, string> = {
  "Discours": "🎙️", "Promesse": "🤝", "Engagement": "🤜", "Déclaration": "📢",
  "Interview": "🎤", "Communiqué": "📄", "Séance plénière": "🏛️",
  "Conférence de presse": "📺", "Débat": "⚖️", "Autre": "📌",
};

const CONTEXTS = [
  "Discours", "Promesse", "Engagement", "Déclaration", "Interview",
  "Communiqué", "Séance plénière", "Conférence de presse", "Débat", "Autre",
] as const;

// Fixed filter pills → label / DB value
const PILLS = [
  { label: "Tous",         value: "Tous"        },
  { label: "Promesses",    value: "Promesse"    },
  { label: "Discours",     value: "Discours"    },
  { label: "Déclarations", value: "Déclaration" },
  { label: "Engagements",  value: "Engagement"  },
];

type Entry = {
  id: string; date: string; author: string;
  context: string; content: string; created_at: string; verified?: boolean;
};

function toHandle(name: string) {
  return name.trim()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_").replace(/^_|_$/g, "")
    .slice(0, 20);
}

function avatarGrad(name: string) {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},45%,18%) 0%,hsl(${(hue + 55) % 360},60%,36%) 100%)`;
}

function ini(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function relDate(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `il y a ${Math.floor(s / 60)}min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  if (d < 30)    return `il y a ${d} jour${d > 1 ? "s" : ""}`;
  const m = Math.floor(d / 30);
  return m < 12  ? `il y a ${m} mois` : `il y a ${Math.floor(m / 12)} an${Math.floor(m / 12) > 1 ? "s" : ""}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ── EntryCard ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, onShare }: { entry: Entry; onShare: (m: string) => void }) {
  const [copied,  setCopied]  = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tag = TAG[entry.context] ?? TAG["Autre"];
  const icon = CTX_ICON[entry.context] ?? "📌";
  const handle = toHandle(entry.author);
  const isLong = entry.content.length > 280;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const copy = () => {
    navigator.clipboard.writeText(`"${entry.content}" — ${entry.author}, ${fmtDate(entry.date)}`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const share = () => {
    navigator.clipboard.writeText(`${window.location.origin}/dashboard/registre#${entry.id}`).catch(() => {});
    onShare("Lien copié !");
  };

  return (
    <article id={entry.id} style={{ display: "flex", gap: "14px", padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.1s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#050505")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, paddingTop: "2px" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: avatarGrad(entry.author), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 900, letterSpacing: "-0.5px" }}>
          {ini(entry.author)}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
          <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800, letterSpacing: "-0.2px" }}>{entry.author}</span>
          {entry.verified && (
            <span style={{ color: GOLD, fontSize: "11px", fontWeight: 700 }}>✓</span>
          )}
          <span style={{ color: TEXT2, fontSize: "13px" }}>@{handle}</span>
          <span style={{ color: TEXT3, fontSize: "13px" }}>·</span>
          <span style={{ color: TEXT2, fontSize: "13px" }} title={fmtDate(entry.date)}>
            {relDate(entry.created_at)}
          </span>
        </div>

        {/* Tag */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", background: tag.bg, border: `1px solid ${tag.border}`, color: tag.color, fontSize: "12px", fontWeight: 700 }}>
            {icon} {entry.context}
          </span>
        </div>

        {/* Quote */}
        <div style={{ marginBottom: "12px", position: "relative" }}>
          <span style={{ display: "block", fontSize: "40px", lineHeight: 0.8, color: `${TEXT2}18`, fontFamily: "Georgia, 'Times New Roman', serif", marginBottom: "4px", userSelect: "none" }}>"</span>
          <p style={{
            color: TEXT, fontSize: "16px", lineHeight: 1.7, margin: 0, fontWeight: 400,
            display: "-webkit-box", WebkitBoxOrient: "vertical",
            WebkitLineClamp: expanded || !isLong ? 999 : 5,
            overflow: "hidden",
          } as React.CSSProperties}>
            {entry.content}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(v => !v)}
              style={{ background: "none", border: "none", color: "#4B9EFF", fontSize: "14px", fontWeight: 600, cursor: "pointer", padding: "6px 0 0", display: "block" }}>
              {expanded ? "Réduire" : "Voir la suite"}
            </button>
          )}
        </div>

        {/* Context small */}
        <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 14px" }}>
          {fmtDate(entry.date)}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <ActionBtn icon="🔗" label="Partager" onClick={share} />
          <span style={{ color: TEXT3, fontSize: "12px", padding: "0 2px" }}>·</span>
          <ActionBtn icon="📋" label={copied ? "Copié ✓" : "Copier"} onClick={copy} active={copied} />
          <span style={{ color: TEXT3, fontSize: "12px", padding: "0 2px" }}>·</span>

          {/* More menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(v => !v)}
              style={{ background: "none", border: "none", color: TEXT2, fontSize: "13px", fontWeight: 600, cursor: "pointer", padding: "5px 10px", borderRadius: "100px", transition: "all 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.color = TEXT; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = TEXT2; }}
            >···</button>
            {menuOpen && (
              <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, background: "#111", border: `1px solid ${BORDER}`, borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", overflow: "hidden", minWidth: "140px", zIndex: 50 }}>
                {[
                  { label: "🔖 Marquer", action: () => { onShare("Marqué !"); setMenuOpen(false); } },
                  { label: "🚩 Signaler", action: () => { onShare("Signalé."); setMenuOpen(false); } },
                ].map(({ label, action }) => (
                  <button key={label} onClick={action}
                    style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: TEXT2, fontSize: "13px", fontWeight: 600, padding: "11px 14px", cursor: "pointer", transition: "background 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = TEXT; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = TEXT2; }}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function ActionBtn({ icon, label, onClick, active }: { icon: string; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", background: "none", border: "none", borderRadius: "100px", color: active ? GOLD : TEXT2, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "#111"; e.currentTarget.style.color = active ? GOLD : TEXT; }}
      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = active ? GOLD : TEXT2; }}
    >
      {icon} {label}
    </button>
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

  const inp: React.CSSProperties = { width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "12px 16px", color: TEXT, fontSize: "15px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "11px", fontWeight: 700, color: TEXT2, marginBottom: "7px", letterSpacing: "0.8px", textTransform: "uppercase" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 400, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: "#0C0C0C", border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: "22px", padding: "28px 28px 24px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
          <div>
            <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Consigner une parole</h2>
            <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Ajouté au registre officiel</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "24px", cursor: "pointer", lineHeight: 1, padding: "0 0 0 12px" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...inp, colorScheme: "dark" }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={lbl}>Personnalité *</label>
              <input ref={firstRef} value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                placeholder="Nom complet" style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Type de parole *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CONTEXTS.map(ctx => {
                const t = TAG[ctx] ?? TAG["Autre"];
                const on = form.context === ctx;
                return (
                  <button key={ctx} onClick={() => setForm(f => ({ ...f, context: ctx }))}
                    style={{ padding: "5px 13px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.12s", border: `1px solid ${on ? t.border : BORDER}`, background: on ? t.bg : "transparent", color: on ? t.color : TEXT2 }}>
                    {CTX_ICON[ctx]} {ctx}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={lbl}>Parole consignée *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Retranscription exacte de la parole…" rows={5}
              style={{ ...inp, resize: "vertical", lineHeight: 1.7 }}
              onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <p style={{ color: TEXT2, fontSize: "12px", textAlign: "right", margin: "4px 0 0" }}>{form.content.length} car.</p>
          </div>

          {error && <p style={{ color: RED, fontSize: "13px", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ padding: "11px 20px", borderRadius: "100px", border: `1px solid ${BORDER}`, background: "transparent", color: TEXT2, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
            <button onClick={submit} disabled={!valid || loading}
              style={{ padding: "11px 26px", borderRadius: "100px", border: "none", background: valid && !loading ? RED : "#141414", color: valid && !loading ? "#fff" : "#333", fontSize: "14px", fontWeight: 800, cursor: valid && !loading ? "pointer" : "not-allowed", boxShadow: valid && !loading ? `0 4px 18px ${RED}44` : "none", transition: "all 0.15s" }}>
              {loading ? "Consignation…" : "Consigner"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegistrePage() {
  const [entries,   setEntries]   = useState<Entry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [dbError,   setDbError]   = useState(false);
  const [modal,     setModal]     = useState(false);
  const [filter,    setFilter]    = useState("Tous");
  const [toast,     setToast]     = useState<string | null>(null);

  const load = useCallback(async () => {
    const sb = createClient();
    const { data, error } = await sb.from("registre").select("*").order("date", { ascending: false });
    if (error) { setDbError(true); setLoading(false); return; }
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() =>
    filter === "Tous" ? entries : entries.filter(e => e.context === filter),
    [entries, filter]
  );

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @media (min-width: 641px) { .sg-fab-mobile { display: none !important; } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "96px", left: "50%", transform: "translateX(-50%)", background: "#fff", color: "#000", fontSize: "13px", fontWeight: 700, padding: "10px 22px", borderRadius: "100px", zIndex: 600, pointerEvents: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      {/* Mobile FAB */}
      <button
        className="sg-fab-mobile"
        onClick={() => setModal(true)}
        style={{ position: "fixed", bottom: "88px", right: "20px", zIndex: 200, width: "54px", height: "54px", borderRadius: "50%", background: RED, border: "none", color: "#fff", fontSize: "24px", fontWeight: 300, cursor: "pointer", boxShadow: `0 6px 24px ${RED}60`, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
      >+</button>

      <div style={{ maxWidth: "680px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter', system-ui, sans-serif", color: TEXT }}>

        {/* ── Header sticky ─────────────────────────────────────────── */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}F0`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "28px", lineHeight: 1 }}>🏛️</span>
              <div>
                <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>Mon Registre</h1>
                <p style={{ color: TEXT2, fontSize: "13px", margin: 0, marginTop: "1px" }}>La parole consignée</p>
              </div>
            </div>
            <button onClick={() => setModal(true)}
              style={{ background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "9px 20px", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 18px ${RED}44`, flexShrink: 0, transition: "opacity 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >+ Consigner</button>
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: "8px", padding: "0 20px 14px", overflowX: "auto", scrollbarWidth: "none" }}>
            {PILLS.map(p => {
              const on = filter === p.value;
              return (
                <button key={p.value} onClick={() => setFilter(p.value)}
                  style={{ padding: "6px 16px", borderRadius: "100px", fontSize: "13px", fontWeight: on ? 700 : 500, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", transition: "all 0.15s", border: `1.5px solid ${on ? RED : BORDER}`, background: on ? RED : "transparent", color: on ? "#fff" : TEXT2 }}>
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── États ─────────────────────────────────────────────────── */}

        {dbError && (
          <div style={{ margin: "24px 20px", background: `${RED}08`, border: `1px solid ${RED}25`, borderRadius: "16px", padding: "20px 24px" }}>
            <p style={{ color: RED, fontSize: "15px", fontWeight: 700, margin: "0 0 4px" }}>Table "registre" introuvable</p>
            <p style={{ color: TEXT2, fontSize: "13px", margin: 0, lineHeight: 1.6 }}>Crée la table dans Supabase SQL Editor pour activer le registre.</p>
          </div>
        )}

        {loading && (
          <div>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{ display: "flex", gap: "14px", padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#0f0f0f", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: "14px", width: "38%", background: "#0f0f0f", borderRadius: "7px", marginBottom: "12px" }} />
                  <div style={{ height: "22px", width: "18%", background: "#0a0a0a", borderRadius: "100px", marginBottom: "14px" }} />
                  <div style={{ height: "16px", width: "95%", background: "#0a0a0a", borderRadius: "7px", marginBottom: "8px" }} />
                  <div style={{ height: "16px", width: "80%", background: "#0a0a0a", borderRadius: "7px" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !dbError && entries.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", textAlign: "center", gap: "16px" }}>
            <span style={{ fontSize: "56px" }}>📜</span>
            <p style={{ color: TEXT, fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>Le registre est vide</p>
            <p style={{ color: TEXT2, fontSize: "15px", margin: 0, maxWidth: "300px", lineHeight: 1.65 }}>
              Consigne la première parole pour commencer à documenter les déclarations officielles.
            </p>
            <button onClick={() => setModal(true)}
              style={{ marginTop: "8px", background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "13px 30px", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 20px ${RED}44` }}>
              + Consigner une parole
            </button>
          </div>
        )}

        {!loading && !dbError && entries.length > 0 && filtered.length === 0 && (
          <div style={{ padding: "56px 20px", textAlign: "center" }}>
            <p style={{ color: TEXT2, fontSize: "15px", margin: "0 0 16px" }}>Aucune entrée dans cette catégorie.</p>
            <button onClick={() => setFilter("Tous")}
              style={{ color: RED, background: "none", border: `1px solid ${RED}40`, borderRadius: "100px", padding: "8px 20px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              Voir tout le registre
            </button>
          </div>
        )}

        {/* ── Feed ──────────────────────────────────────────────────── */}
        {!loading && !dbError && filtered.length > 0 && (
          <div>
            {filtered.map(entry => (
              <EntryCard key={entry.id} entry={entry} onShare={msg => setToast(msg)} />
            ))}
          </div>
        )}
      </div>

      {modal && <AddEntryModal onClose={() => setModal(false)} onAdded={e => setEntries(p => [e, ...p])} />}
    </>
  );
}
