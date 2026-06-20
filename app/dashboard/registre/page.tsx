"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

const CONTEXTS = ["Discours", "Interview", "Communiqué", "Séance plénière", "Conférence de presse", "Débat", "Déclaration", "Autre"] as const;
type ContextType = typeof CONTEXTS[number];

type Entry = {
  id: string;
  date: string;
  author: string;
  context: string;
  content: string;
  created_at: string;
};

type SortKey = "recent" | "oldest" | "author";

const CONTEXT_ICON: Record<string, string> = {
  Discours: "🎙️", Interview: "🎤", Communiqué: "📄", "Séance plénière": "🏛️",
  "Conférence de presse": "📺", Débat: "⚖️", Déclaration: "📢", Autre: "📌",
};

function relDate(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 86400)   return "aujourd'hui";
  const d = Math.floor(s / 86400);
  if (d < 30)      return `il y a ${d}j`;
  const m = Math.floor(d / 30);
  return m < 12 ? `il y a ${m} mois` : `il y a ${Math.floor(m / 12)} an${Math.floor(m / 12) > 1 ? "s" : ""}`;
}

// ── EntryCard ─────────────────────────────────────────────────────────────────

function EntryCard({ entry, index, expanded, onToggle }: { entry: Entry; index: number; expanded: boolean; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const date = new Date(entry.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const copyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`"${entry.content}" — ${entry.author}, ${new Date(entry.date).toLocaleDateString("fr-FR")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: expanded ? "#0d0d0d" : SURF, border: `1px solid ${expanded ? GOLD + "40" : BORDER}`, borderLeft: `3px solid ${expanded ? GOLD : BORDER}`, borderRadius: "14px", overflow: "hidden", marginBottom: "8px", transition: "border-color 0.15s", boxShadow: expanded ? `0 4px 24px rgba(201,168,76,0.06)` : "none" }}>

      {/* Header cliquable */}
      <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer" }}>

        {/* Index badge */}
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, background: expanded ? `${GOLD}20` : BORDER, border: `1px solid ${expanded ? GOLD + "50" : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: expanded ? GOLD : TEXT2, fontSize: "10px", fontWeight: 800, transition: "all 0.15s" }}>
          {String(index).padStart(3, "0")}
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px", flexWrap: "wrap" }}>
            <span style={{ color: expanded ? "#F0F0F0" : TEXT, fontSize: "14px", fontWeight: 700, transition: "color 0.15s" }}>{entry.author}</span>
            <span style={{ color: TEXT2, fontSize: "12px" }}>·</span>
            <span style={{ color: expanded ? GOLD : TEXT2, fontSize: "12px", textTransform: "capitalize", transition: "color 0.15s" }}>{date}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: expanded ? `${GOLD}18` : "#111", color: expanded ? GOLD : TEXT2, fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.5px", transition: "all 0.15s" }}>
              {CONTEXT_ICON[entry.context] || "📌"} {entry.context}
            </span>
            <span style={{ color: "#333", fontSize: "11px" }}>{relDate(entry.created_at)}</span>
          </div>
        </div>

        {/* Preview + chevron */}
        {!expanded && (
          <p style={{ color: "#444", fontSize: "12px", margin: 0, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
            {entry.content}
          </p>
        )}
        <span style={{ color: expanded ? GOLD : TEXT2, fontSize: "12px", transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s, color 0.15s", flexShrink: 0 }}>▾</span>
      </div>

      {/* Contenu étendu */}
      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${GOLD}18` }}>
          <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", margin: "14px 0 10px", opacity: 0.7 }}>Parole consignée</p>
          <blockquote style={{ margin: 0, padding: "16px 20px", background: BG, borderRadius: "10px", borderLeft: `3px solid ${GOLD}60`, color: "#C8CADA", fontSize: "15px", lineHeight: 1.75, fontStyle: "italic", whiteSpace: "pre-wrap" }}>
            {entry.content}
          </blockquote>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button onClick={copyQuote} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 14px", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "100px", color: copied ? GOLD : TEXT2, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s" }}>
              {copied ? "✓ Copié" : "📋 Copier la citation"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── StatsBar ──────────────────────────────────────────────────────────────────

function StatsBar({ entries }: { entries: Entry[] }) {
  const authors   = new Set(entries.map(e => e.author)).size;
  const contexts  = new Set(entries.map(e => e.context)).size;
  const thisMonth = entries.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).length;

  return (
    <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${BORDER}`, overflowX: "auto", scrollbarWidth: "none" }}>
      {[
        { label: "Entrées", value: entries.length },
        { label: "Personnalités", value: authors },
        { label: "Contextes", value: contexts },
        { label: "Ce mois", value: thisMonth },
      ].map(({ label, value }) => (
        <div key={label} style={{ flex: 1, padding: "12px 16px", textAlign: "center", minWidth: "80px" }}>
          <div style={{ color: TEXT, fontWeight: 800, fontSize: "18px" }}>{value}</div>
          <div style={{ color: TEXT2, fontSize: "11px" }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ── AddEntryModal ──────────────────────────────────────────────────────────────

function AddEntryModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: Entry) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm]       = useState({ date: today, author: "", context: CONTEXTS[0] as string, content: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
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
    if (!valid || loading) return;
    setLoading(true); setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.from("registre")
      .insert({ date: form.date, author: form.author.trim(), context: form.context.trim(), content: form.content.trim() })
      .select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onAdded(data as Entry);
    onClose();
  };

  const inp: React.CSSProperties = { width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "11px 14px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const lbl: React.CSSProperties = { display: "block", fontSize: "10px", fontWeight: 700, color: GOLD, marginBottom: "6px", letterSpacing: "1.2px", textTransform: "uppercase", opacity: 0.85 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "22px", padding: "28px", width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <div>
            <h2 style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: "0 0 4px" }}>Consigner une parole</h2>
            <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>Enregistrement officiel au registre</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "22px", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ height: "1px", background: `linear-gradient(90deg,${GOLD}40,transparent)`, margin: "16px 0 20px" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={set("date")} style={{ ...inp, colorScheme: "dark" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Auteur *</label>
              <input ref={firstRef} value={form.author} onChange={set("author")} placeholder="Nom complet" style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Contexte *</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CONTEXTS.map(ctx => (
                <button key={ctx} onClick={() => setForm(f => ({ ...f, context: ctx }))} style={{ padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${form.context === ctx ? GOLD : BORDER}`, background: form.context === ctx ? `${GOLD}18` : "transparent", color: form.context === ctx ? GOLD : TEXT2, transition: "all 0.12s" }}>
                  {CONTEXT_ICON[ctx]} {ctx}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Parole consignée *</label>
            <textarea value={form.content} onChange={set("content")} placeholder="Retranscription exacte de la parole…" rows={5} style={{ ...inp, resize: "vertical", lineHeight: 1.65 }} />
            <div style={{ textAlign: "right", fontSize: "11px", color: TEXT2, marginTop: "4px" }}>{form.content.length} car.</div>
          </div>

          {error && <p style={{ color: RED, fontSize: "12px", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{ background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
            <button onClick={handleSubmit} disabled={!valid || loading} style={{ background: valid && !loading ? RED : "#1a1a1a", color: valid && !loading ? "#fff" : "#333", border: "none", borderRadius: "10px", padding: "10px 22px", fontSize: "14px", fontWeight: 800, cursor: valid && !loading ? "pointer" : "not-allowed", boxShadow: valid ? `0 4px 16px ${RED}44` : "none" }}>
              {loading ? "Consignation…" : "Consigner au registre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RegistrePage() {
  const [entries,    setEntries]    = useState<Entry[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [dbError,    setDbError]    = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [filterCtx,  setFilterCtx]  = useState<string>("Tous");
  const [sort,       setSort]       = useState<SortKey>("recent");

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("registre").select("*").order("date", { ascending: false });
    if (error) { setDbError(true); setLoading(false); return; }
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const allContexts = useMemo(() => ["Tous", ...Array.from(new Set(entries.map(e => e.context)))], [entries]);

  const filtered = useMemo(() => {
    let list = entries.filter(e => {
      const q = search.toLowerCase();
      const matchSearch = !q || e.author.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.context.toLowerCase().includes(q);
      const matchCtx    = filterCtx === "Tous" || e.context === filterCtx;
      return matchSearch && matchCtx;
    });
    if (sort === "oldest") list = [...list].reverse();
    if (sort === "author") list = [...list].sort((a, b) => a.author.localeCompare(b.author, "fr"));
    return list;
  }, [entries, search, filterCtx, sort]);

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 0 80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 12px", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0, boxShadow: `0 2px 10px ${RED}44` }}>📜</div>
              <div>
                <h1 style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: "0 0 1px", letterSpacing: "-0.3px" }}>Le Registre</h1>
                <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>Consignation des paroles officielles</p>
              </div>
            </div>
            <button onClick={() => setModalOpen(true)} style={{ background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "9px 18px", fontSize: "13px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${RED}44`, flexShrink: 0 }}>
              + Consigner
            </button>
          </div>

          {/* Stats */}
          {!loading && !dbError && entries.length > 0 && <StatsBar entries={entries} />}

          {/* Barre de recherche */}
          <div style={{ padding: "10px 16px 0" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", pointerEvents: "none" }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher auteur, parole, contexte…" style={{ width: "100%", padding: "9px 14px 9px 38px", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>

          {/* Filtres contexte + tri */}
          <div style={{ display: "flex", gap: "6px", padding: "10px 16px", overflowX: "auto", scrollbarWidth: "none", alignItems: "center" }}>
            {allContexts.map(ctx => (
              <button key={ctx} onClick={() => setFilterCtx(ctx)} style={{ padding: "5px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: 600, cursor: "pointer", flexShrink: 0, border: `1px solid ${filterCtx === ctx ? GOLD : BORDER}`, background: filterCtx === ctx ? `${GOLD}18` : "transparent", color: filterCtx === ctx ? GOLD : TEXT2, transition: "all 0.12s", whiteSpace: "nowrap" }}>
                {ctx === "Tous" ? "Tous" : `${CONTEXT_ICON[ctx] || "📌"} ${ctx}`}
              </button>
            ))}
            <div style={{ marginLeft: "auto", flexShrink: 0 }}>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "8px", color: TEXT2, fontSize: "11px", padding: "5px 10px", outline: "none", cursor: "pointer" }}>
                <option value="recent">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="author">Par auteur</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding: "12px 16px" }}>

          {/* Erreur DB */}
          {dbError && (
            <div style={{ background: `${RED}15`, border: `1px solid ${RED}35`, borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
              <p style={{ color: RED, fontSize: "13px", fontWeight: 700, margin: "0 0 4px" }}>Table "registre" introuvable</p>
              <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>Crée-la via Supabase SQL Editor pour activer le registre.</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ background: SURF, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BORDER}`, borderRadius: "14px", padding: "14px 16px", display: "flex", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#111", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: "13px", width: "40%", background: "#111", borderRadius: "6px", marginBottom: "8px" }} />
                    <div style={{ height: "10px", width: "20%", background: "#0a0a0a", borderRadius: "6px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vide */}
          {!loading && !dbError && entries.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 20px", textAlign: "center" }}>
              <span style={{ fontSize: "48px" }}>📜</span>
              <p style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: 0 }}>Le registre est vide</p>
              <p style={{ color: TEXT2, fontSize: "13px", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>Consigne la première parole officielle pour l'historique.</p>
              <button onClick={() => setModalOpen(true)} style={{ marginTop: "8px", background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "11px 24px", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 18px ${RED}44` }}>
                + Consigner une parole
              </button>
            </div>
          )}

          {/* Aucun résultat filtre */}
          {!loading && !dbError && entries.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: TEXT2, fontSize: "14px" }}>Aucune entrée pour "{search || filterCtx}"</p>
              <button onClick={() => { setSearch(""); setFilterCtx("Tous"); }} style={{ color: RED, background: "none", border: "none", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Effacer les filtres</button>
            </div>
          )}

          {/* Liste */}
          {!loading && !dbError && filtered.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: TEXT2 }}>{filtered.length} entrée{filtered.length > 1 ? "s" : ""}{search || filterCtx !== "Tous" ? " filtrées" : ""}</span>
              </div>
              {filtered.map((e, i) => (
                <EntryCard
                  key={e.id} entry={e}
                  index={entries.length - entries.indexOf(e)}
                  expanded={expanded === e.id}
                  onToggle={() => setExpanded(expanded === e.id ? null : e.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {modalOpen && <AddEntryModal onClose={() => setModalOpen(false)} onAdded={e => setEntries(p => [e, ...p])} />}
    </>
  );
}
