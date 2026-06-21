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
const TEXT3  = "#3A3A3A";
const GREEN  = "#2ECC71";

const CONTEXTS = ["Discours","Interview","Communiqué","Séance plénière","Conférence de presse","Débat","Déclaration","Autre"] as const;
type ContextType = typeof CONTEXTS[number];
type SortKey     = "recent" | "oldest" | "author";
type ViewMode    = "liste" | "timeline";

const CONTEXT_ICON: Record<string,string> = {
  Discours:"🎙️", Interview:"🎤", Communiqué:"📄", "Séance plénière":"🏛️",
  "Conférence de presse":"📺", Débat:"⚖️", Déclaration:"📢", Autre:"📌",
};

type Entry = { id:string; date:string; author:string; context:string; content:string; created_at:string; verified?:boolean };

function relDate(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 86400) return "aujourd'hui";
  const d = Math.floor(s / 86400);
  if (d < 30)   return `il y a ${d}j`;
  const m = Math.floor(d / 30);
  return m < 12 ? `il y a ${m} mois` : `il y a ${Math.floor(m/12)} an${Math.floor(m/12)>1?"s":""}`;
}

function avatarGrad(name: string): string {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`, "gi"));
  return parts.map((p,i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ background:`${GOLD}30`, color:GOLD, borderRadius:"2px", padding:"0 1px" }}>{p}</mark>
      : p
  );
}

// ── MiniMonthChart ────────────────────────────────────────────────────────────

function MiniMonthChart({ entries }: { entries: Entry[] }) {
  const months: Record<string,number> = {};
  entries.forEach(e => {
    const key = e.created_at.slice(0,7);
    months[key] = (months[key]||0) + 1;
  });
  const keys   = Object.keys(months).sort().slice(-6);
  const values = keys.map(k => months[k]);
  const max    = Math.max(...values, 1);

  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"24px" }}>
      {values.map((v,i) => (
        <div key={keys[i]} style={{ flex:1, borderRadius:"2px 2px 0 0", background:`${GOLD}${Math.round(40+((v/max)*180)).toString(16).padStart(2,"0")}`, height:`${Math.max(4,(v/max)*24)}px`, transition:"height 0.3s", minWidth:"6px" }} title={`${keys[i]}: ${v}`} />
      ))}
    </div>
  );
}

// ── StatsBar ──────────────────────────────────────────────────────────────────

function StatsBar({ entries }: { entries: Entry[] }) {
  const authors   = new Set(entries.map(e => e.author)).size;
  const contexts  = new Set(entries.map(e => e.context)).size;
  const thisMonth = entries.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).length;

  return (
    <div style={{ display:"flex", gap:"0", borderBottom:`1px solid ${BORDER}`, overflowX:"auto", scrollbarWidth:"none" }}>
      {[
        { label:"Entrées",        value:entries.length },
        { label:"Personnalités",  value:authors        },
        { label:"Contextes",      value:contexts       },
        { label:"Ce mois",        value:thisMonth      },
      ].map(({ label, value }) => (
        <div key={label} style={{ flex:1, padding:"10px 14px", textAlign:"center", minWidth:"72px" }}>
          <div style={{ color:TEXT, fontWeight:800, fontSize:"17px" }}>{value}</div>
          <div style={{ color:TEXT2, fontSize:"10px" }}>{label}</div>
        </div>
      ))}
      {/* Mini chart */}
      <div style={{ flex:2, padding:"10px 14px", minWidth:"80px", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
        <MiniMonthChart entries={entries} />
        <div style={{ color:TEXT3, fontSize:"9px", marginTop:"3px", textAlign:"center" }}>6 derniers mois</div>
      </div>
    </div>
  );
}

// ── TopAuteurs ────────────────────────────────────────────────────────────────

function TopAuteurs({ entries, onFilter }: { entries: Entry[]; onFilter: (a:string) => void }) {
  const counts: Record<string,number> = {};
  entries.forEach(e => { counts[e.author] = (counts[e.author]||0)+1; });
  const top = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,5);

  if (top.length === 0) return null;

  return (
    <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"14px 16px", marginBottom:"14px" }}>
      <p style={{ color:TEXT2, fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", margin:"0 0 10px" }}>Top personnalités</p>
      <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
        {top.map(([author, count], i) => (
          <div key={author} onClick={() => onFilter(author)} style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", padding:"3px 0" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            <span style={{ color:TEXT3, fontSize:"10px", fontWeight:800, width:"14px" }}>{i+1}</span>
            <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:avatarGrad(author), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", fontWeight:800, color:"#fff", flexShrink:0 }}>{author[0]}</div>
            <span style={{ flex:1, color:TEXT, fontSize:"12px", fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{author}</span>
            <span style={{ background:`${GOLD}15`, color:GOLD, fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"100px" }}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── EntryCard ──────────────────────────────────────────────────────────────────

function EntryCard({ entry, index, expanded, onToggle, search, onShareMsg }: {
  entry: Entry; index: number; expanded: boolean; onToggle: () => void;
  search: string; onShareMsg: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const date = new Date(entry.date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  const initials = entry.author.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();

  const copyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const txt = `"${entry.content}" — ${entry.author}, ${new Date(entry.date).toLocaleDateString("fr-FR")}`;
    navigator.clipboard.writeText(txt).catch(()=>{});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/registre#${entry.id}`;
    navigator.clipboard.writeText(url).catch(()=>{});
    onShareMsg("Lien copié !");
  };

  return (
    <div id={entry.id} style={{ background: expanded ? "#0d0d0d" : SURF, border:`1px solid ${expanded ? GOLD+"40" : BORDER}`, borderLeft:`3px solid ${expanded ? GOLD : BORDER}`, borderRadius:"14px", overflow:"hidden", marginBottom:"8px", transition:"border-color 0.15s", boxShadow: expanded ? `0 4px 24px rgba(201,168,76,0.06)` : "none" }}>

      {/* Header cliquable */}
      <div onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"13px 16px", cursor:"pointer" }}>
        {/* Numéro */}
        <div style={{ width:"30px", height:"30px", borderRadius:"8px", flexShrink:0, background: expanded ? `${GOLD}20` : BORDER, border:`1px solid ${expanded ? GOLD+"50" : BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", color: expanded ? GOLD : TEXT2, fontSize:"9px", fontWeight:800, transition:"all 0.15s" }}>
          {String(index).padStart(3,"0")}
        </div>

        {/* Avatar auteur */}
        <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:avatarGrad(entry.author), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:800, color:"#fff", flexShrink:0 }}>
          {initials}
        </div>

        {/* Infos */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"3px", flexWrap:"wrap" }}>
            <span style={{ color: expanded ? "#F0F0F0" : TEXT, fontSize:"13px", fontWeight:700 }}>{entry.author}</span>
            {entry.verified && <span style={{ color:GOLD, fontSize:"10px", background:`${GOLD}15`, border:`1px solid ${GOLD}30`, borderRadius:"100px", padding:"1px 6px", fontWeight:700 }}>✓ Vérifié</span>}
            <span style={{ color:TEXT2, fontSize:"11px" }}>· {date}</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:"3px", background: expanded ? `${GOLD}18` : "#111", color: expanded ? GOLD : TEXT2, fontSize:"10px", fontWeight:700, padding:"2px 7px", borderRadius:"20px" }}>
              {CONTEXT_ICON[entry.context]||"📌"} {entry.context}
            </span>
            <span style={{ color:TEXT3, fontSize:"10px" }}>{relDate(entry.created_at)}</span>
          </div>
        </div>

        {/* Preview */}
        {!expanded && (
          <p style={{ color:TEXT3, fontSize:"11px", margin:0, maxWidth:"140px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flexShrink:0 }}>
            {entry.content}
          </p>
        )}
        <span style={{ color: expanded ? GOLD : TEXT2, fontSize:"11px", transform: expanded ? "rotate(180deg)" : "none", transition:"transform 0.2s", flexShrink:0 }}>▾</span>
      </div>

      {/* Contenu étendu */}
      {expanded && (
        <div style={{ padding:"0 16px 16px", borderTop:`1px solid ${GOLD}18` }}>
          <p style={{ color:GOLD, fontSize:"9px", fontWeight:700, letterSpacing:"1.5px", textTransform:"uppercase", margin:"14px 0 10px", opacity:0.7 }}>Parole consignée</p>
          <blockquote style={{ margin:0, padding:"16px 20px", background:BG, borderRadius:"10px", borderLeft:`3px solid ${GOLD}60`, color:"#C8CADA", fontSize:"15px", lineHeight:1.75, fontStyle:"italic", whiteSpace:"pre-wrap" }}>
            {highlight(entry.content, search)}
          </blockquote>
          <div style={{ display:"flex", gap:"6px", marginTop:"12px", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:"6px" }}>
              <span style={{ color: entry.verified ? GREEN : TEXT3, fontSize:"11px", fontWeight:600 }}>
                {entry.verified ? "✓ Déclaration vérifiée" : "⚠ Non vérifiée"}
              </span>
            </div>
            <div style={{ display:"flex", gap:"6px" }}>
              <button onClick={share} style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 12px", background:"transparent", border:`1px solid ${BORDER}`, borderRadius:"100px", color:TEXT2, fontSize:"11px", fontWeight:600, cursor:"pointer" }}>
                🔗 Partager
              </button>
              <button onClick={copyQuote} style={{ display:"flex", alignItems:"center", gap:"4px", padding:"5px 12px", background:"transparent", border:`1px solid ${BORDER}`, borderRadius:"100px", color: copied ? GOLD : TEXT2, fontSize:"11px", fontWeight:600, cursor:"pointer", transition:"color 0.15s" }}>
                {copied ? "✓ Copié" : "📋 Citation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TimelineCard ──────────────────────────────────────────────────────────────

function TimelineCard({ entry, index, left, expanded, onToggle, search }: {
  entry: Entry; index: number; left: boolean; expanded: boolean; onToggle: () => void; search: string;
}) {
  const date     = new Date(entry.date).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
  const initials = entry.author.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();

  return (
    <div style={{ display:"flex", alignItems:"flex-start", gap:"0", marginBottom:"16px" }}>
      {/* Left side */}
      <div style={{ flex:1, textAlign:"right", paddingRight:"16px", display: left ? "block" : "none" }}>
        {left && (
          <div onClick={onToggle} style={{ display:"inline-block", background: expanded ? "#0d0d0d" : SURF, border:`1px solid ${expanded ? GOLD+"40" : BORDER}`, borderRadius:"12px", padding:"12px 14px", cursor:"pointer", maxWidth:"280px", textAlign:"left", transition:"border-color 0.15s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"5px" }}>
              <span style={{ color:TEXT, fontSize:"12px", fontWeight:700 }}>{entry.author}</span>
              {entry.verified && <span style={{ color:GOLD, fontSize:"9px" }}>✓</span>}
            </div>
            <p style={{ color:TEXT2, fontSize:"11px", margin:"0 0 6px", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp: expanded ? 99 : 3, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>
              {expanded ? highlight(entry.content, search) : entry.content}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
              <span style={{ color:TEXT3, fontSize:"9px" }}>{CONTEXT_ICON[entry.context]||"📌"} {entry.context}</span>
            </div>
          </div>
        )}
      </div>

      {/* Center line */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", width:"32px", flexShrink:0 }}>
        <div style={{ width:"10px", height:"10px", borderRadius:"50%", background: expanded ? GOLD : BORDER, border:`2px solid ${expanded ? GOLD : TEXT3}`, zIndex:1, marginTop:"14px", transition:"all 0.15s" }} />
      </div>

      {/* Right side */}
      <div style={{ flex:1, paddingLeft:"16px", display: left ? "none" : "block" }}>
        {!left && (
          <div onClick={onToggle} style={{ display:"inline-block", background: expanded ? "#0d0d0d" : SURF, border:`1px solid ${expanded ? GOLD+"40" : BORDER}`, borderRadius:"12px", padding:"12px 14px", cursor:"pointer", maxWidth:"280px", transition:"border-color 0.15s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"5px" }}>
              <span style={{ color:TEXT, fontSize:"12px", fontWeight:700 }}>{entry.author}</span>
              {entry.verified && <span style={{ color:GOLD, fontSize:"9px" }}>✓</span>}
            </div>
            <p style={{ color:TEXT2, fontSize:"11px", margin:"0 0 6px", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp: expanded ? 99 : 3, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>
              {expanded ? highlight(entry.content, search) : entry.content}
            </p>
            <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
              <span style={{ color:TEXT3, fontSize:"9px" }}>{CONTEXT_ICON[entry.context]||"📌"} {entry.context}</span>
            </div>
          </div>
        )}
      </div>

      {/* Date label (outside) */}
      <div style={{ position:"absolute", left:"50%", transform:"translateX(-50%)", marginTop:"16px", display:"none" }} />
    </div>
  );
}

// ── AddEntryModal ──────────────────────────────────────────────────────────────

function AddEntryModal({ onClose, onAdded }: { onClose: () => void; onAdded: (e: Entry) => void }) {
  const today  = new Date().toISOString().slice(0,10);
  const [form, setForm]     = useState({ date:today, author:"", context:CONTEXTS[0] as string, content:"" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]:e.target.value }));

  const valid = form.author.trim() && form.context.trim() && form.content.trim() && form.date;

  const handleSubmit = async () => {
    if (!valid || loading) return;
    setLoading(true); setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error:err } = await supabase.from("registre")
      .insert({ date:form.date, author:form.author.trim(), context:form.context.trim(), content:form.content.trim(), ...(user ? { added_by: user.id } : {}) })
      .select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onAdded(data as Entry);
    onClose();
  };

  const inp: React.CSSProperties = { width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 14px", color:TEXT, fontSize:"14px", outline:"none", fontFamily:"inherit", boxSizing:"border-box", transition:"border-color 0.15s" };
  const lbl: React.CSSProperties = { display:"block", fontSize:"10px", fontWeight:700, color:GOLD, marginBottom:"6px", letterSpacing:"1.2px", textTransform:"uppercase", opacity:0.85 };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderTop:`2px solid ${GOLD}`, borderRadius:"22px", padding:"28px", width:"100%", maxWidth:"540px", maxHeight:"90vh", overflowY:"auto", scrollbarWidth:"none" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
          <div>
            <h2 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 4px" }}>Consigner une parole</h2>
            <p style={{ color:TEXT2, fontSize:"12px", margin:0 }}>Enregistrement officiel au registre</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:TEXT2, fontSize:"22px", cursor:"pointer" }}>×</button>
        </div>
        <div style={{ height:"1px", background:`linear-gradient(90deg,${GOLD}40,transparent)`, margin:"16px 0 20px" }} />

        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ display:"flex", gap:"12px" }}>
            <div style={{ flex:1 }}>
              <label style={lbl}>Date</label>
              <input type="date" value={form.date} onChange={set("date")} style={{ ...inp, colorScheme:"dark" }} />
            </div>
            <div style={{ flex:1 }}>
              <label style={lbl}>Auteur *</label>
              <input ref={firstRef} value={form.author} onChange={set("author")} placeholder="Nom complet" style={inp}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD+"60")}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Contexte *</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {CONTEXTS.map(ctx => (
                <button key={ctx} onClick={() => setForm(f => ({ ...f, context:ctx }))} style={{ padding:"6px 12px", borderRadius:"100px", fontSize:"12px", fontWeight:600, cursor:"pointer", border:`1px solid ${form.context===ctx ? GOLD : BORDER}`, background: form.context===ctx ? `${GOLD}18` : "transparent", color: form.context===ctx ? GOLD : TEXT2, transition:"all 0.12s" }}>
                  {CONTEXT_ICON[ctx]} {ctx}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Parole consignée *</label>
            <textarea value={form.content} onChange={set("content")} placeholder="Retranscription exacte de la parole…" rows={5}
              style={{ ...inp, resize:"vertical", lineHeight:1.65 }}
              onFocus={e => (e.currentTarget.style.borderColor = GOLD+"60")}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <div style={{ textAlign:"right", fontSize:"11px", color:TEXT2, marginTop:"4px" }}>{form.content.length} car.</div>
          </div>

          {error && <p style={{ color:RED, fontSize:"12px", margin:0 }}>{error}</p>}

          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end" }}>
            <button onClick={onClose} style={{ background:"transparent", color:TEXT2, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 18px", fontSize:"14px", fontWeight:600, cursor:"pointer" }}>Annuler</button>
            <button onClick={handleSubmit} disabled={!valid||loading} style={{ background: valid&&!loading ? RED : "#1a1a1a", color: valid&&!loading ? "#fff" : "#333", border:"none", borderRadius:"10px", padding:"10px 22px", fontSize:"14px", fontWeight:800, cursor: valid&&!loading ? "pointer" : "not-allowed", boxShadow: valid ? `0 4px 16px ${RED}44` : "none" }}>
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
  const [filterCtx,  setFilterCtx]  = useState("Tous");
  const [filterYear, setFilterYear] = useState("Tous");
  const [sort,       setSort]       = useState<SortKey>("recent");
  const [view,       setView]       = useState<ViewMode>("liste");
  const [toast,      setToast]      = useState<string | null>(null);
  const [showTop,    setShowTop]    = useState(false);

  const fetchEntries = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("registre").select("*").order("date", { ascending:false });
    if (error) { setDbError(true); setLoading(false); return; }
    setEntries(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const allContexts = useMemo(() => ["Tous", ...Array.from(new Set(entries.map(e => e.context)))], [entries]);
  const allYears    = useMemo(() => {
    const ys = [...new Set(entries.map(e => new Date(e.date).getFullYear().toString()))].sort((a,b) => Number(b)-Number(a));
    return ["Tous", ...ys];
  }, [entries]);

  const filtered = useMemo(() => {
    let list = entries.filter(e => {
      const q          = search.toLowerCase();
      const matchSearch = !q || e.author.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.context.toLowerCase().includes(q);
      const matchCtx    = filterCtx==="Tous" || e.context===filterCtx;
      const matchYear   = filterYear==="Tous" || new Date(e.date).getFullYear().toString()===filterYear;
      return matchSearch && matchCtx && matchYear;
    });
    if (sort==="oldest") list = [...list].reverse();
    if (sort==="author") list = [...list].sort((a,b) => a.author.localeCompare(b.author,"fr"));
    return list;
  }, [entries, search, filterCtx, filterYear, sort]);

  return (
    <>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { display:none; }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"100px", left:"50%", transform:"translateX(-50%)", background:GOLD, color:"#000", fontSize:"13px", fontWeight:700, padding:"10px 20px", borderRadius:"100px", zIndex:500, pointerEvents:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:"700px", margin:"0 auto", paddingBottom:"80px", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* Header sticky */}
        <div style={{ position:"sticky", top:0, zIndex:10, background:`${BG}EE`, backdropFilter:"blur(12px)", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 12px", gap:"12px", flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:`linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0, boxShadow:`0 2px 10px ${RED}44` }}>📜</div>
              <div>
                <h1 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 1px" }}>Le Registre</h1>
                <p style={{ color:TEXT2, fontSize:"11px", margin:0 }}>Consignation des paroles officielles</p>
              </div>
            </div>
            <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
              {/* Vue toggle */}
              <div style={{ display:"flex", background:SURF, border:`1px solid ${BORDER}`, borderRadius:"8px", overflow:"hidden" }}>
                {(["liste","timeline"] as ViewMode[]).map(v => (
                  <button key={v} onClick={() => setView(v)} style={{ padding:"7px 10px", background: view===v ? BORDER : "transparent", border:"none", color: view===v ? TEXT : TEXT2, fontSize:"11px", cursor:"pointer", transition:"all 0.12s" }}>
                    {v==="liste" ? "☰" : "≋"}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowTop(v => !v)} style={{ padding:"7px 10px", background: showTop ? `${GOLD}18` : SURF, border:`1px solid ${showTop ? GOLD+"40" : BORDER}`, borderRadius:"8px", color: showTop ? GOLD : TEXT2, fontSize:"11px", cursor:"pointer" }} title="Top auteurs">👤</button>
              <button onClick={() => setModalOpen(true)} style={{ background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"8px 16px", fontSize:"12px", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 16px ${RED}44` }}>
                + Consigner
              </button>
            </div>
          </div>

          {/* Stats */}
          {!loading && !dbError && entries.length > 0 && <StatsBar entries={entries} />}

          {/* Recherche */}
          <div style={{ padding:"10px 16px 0" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", pointerEvents:"none" }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Auteur, parole, contexte…"
                style={{ width:"100%", padding:"8px 36px 8px 34px", background:SURF, border:`1px solid ${BORDER}`, borderRadius:"100px", color:TEXT, fontSize:"12px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD+"60")}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"16px" }}>×</button>}
            </div>
          </div>

          {/* Filtres */}
          <div style={{ display:"flex", gap:"5px", padding:"8px 16px 10px", overflowX:"auto", scrollbarWidth:"none", alignItems:"center" }}>
            {allContexts.map(ctx => (
              <button key={ctx} onClick={() => setFilterCtx(ctx)} style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"10px", fontWeight:600, cursor:"pointer", flexShrink:0, border:`1px solid ${filterCtx===ctx ? GOLD : BORDER}`, background: filterCtx===ctx ? `${GOLD}18` : "transparent", color: filterCtx===ctx ? GOLD : TEXT2, transition:"all 0.12s", whiteSpace:"nowrap" }}>
                {ctx==="Tous" ? "Tous" : `${CONTEXT_ICON[ctx]||"📌"} ${ctx}`}
              </button>
            ))}
            <div style={{ width:"1px", height:"16px", background:BORDER, flexShrink:0 }} />
            {/* Filtre année */}
            <select value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"8px", color:TEXT2, fontSize:"10px", padding:"4px 8px", outline:"none", cursor:"pointer", flexShrink:0 }}>
              {allYears.map(y => <option key={y} value={y}>{y==="Tous" ? "Toutes années" : y}</option>)}
            </select>
            <div style={{ marginLeft:"auto", flexShrink:0 }}>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"8px", color:TEXT2, fontSize:"10px", padding:"4px 8px", outline:"none", cursor:"pointer" }}>
                <option value="recent">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="author">Par auteur</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ padding:"12px 16px" }}>

          {/* Erreur DB */}
          {dbError && (
            <div style={{ background:`${RED}15`, border:`1px solid ${RED}35`, borderRadius:"12px", padding:"16px 20px", marginBottom:"16px" }}>
              <p style={{ color:RED, fontSize:"13px", fontWeight:700, margin:"0 0 4px" }}>Table "registre" introuvable</p>
              <p style={{ color:TEXT2, fontSize:"12px", margin:0 }}>Crée-la via Supabase SQL Editor pour activer le registre.</p>
            </div>
          )}

          {/* Skeleton */}
          {loading && (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ background:SURF, border:`1px solid ${BORDER}`, borderLeft:`3px solid ${BORDER}`, borderRadius:"14px", padding:"13px 16px", display:"flex", gap:"10px" }}>
                  <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:"#111", flexShrink:0 }} />
                  <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"#111", flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ height:"12px", width:"40%", background:"#111", borderRadius:"6px", marginBottom:"8px" }} />
                    <div style={{ height:"10px", width:"20%", background:"#0a0a0a", borderRadius:"6px" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vide */}
          {!loading && !dbError && entries.length===0 && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"12px", padding:"60px 20px", textAlign:"center" }}>
              <span style={{ fontSize:"48px" }}>📜</span>
              <p style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:0 }}>Le registre est vide</p>
              <p style={{ color:TEXT2, fontSize:"13px", margin:0, maxWidth:"260px", lineHeight:1.6 }}>Consigne la première parole officielle pour l'historique.</p>
              <button onClick={() => setModalOpen(true)} style={{ marginTop:"8px", background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"11px 24px", fontSize:"14px", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 18px ${RED}44` }}>
                + Consigner une parole
              </button>
            </div>
          )}

          {/* Aucun résultat */}
          {!loading && !dbError && entries.length>0 && filtered.length===0 && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <p style={{ color:TEXT2, fontSize:"13px" }}>Aucune entrée pour cette recherche.</p>
              <button onClick={() => { setSearch(""); setFilterCtx("Tous"); setFilterYear("Tous"); }} style={{ color:RED, background:"none", border:"none", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>Effacer les filtres</button>
            </div>
          )}

          {/* Contenu */}
          {!loading && !dbError && filtered.length>0 && (
            <>
              {/* Top auteurs (toggle) */}
              {showTop && <TopAuteurs entries={entries} onFilter={a => { setSearch(a); setShowTop(false); }} />}

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px" }}>
                <span style={{ fontSize:"11px", color:TEXT2 }}>
                  {filtered.length} entrée{filtered.length>1?"s":""}{(search||filterCtx!=="Tous"||filterYear!=="Tous") ? " filtrées" : ""}
                </span>
              </div>

              {view === "liste" ? (
                filtered.map((e, i) => (
                  <EntryCard
                    key={e.id} entry={e}
                    index={entries.length - entries.indexOf(e)}
                    expanded={expanded===e.id}
                    onToggle={() => setExpanded(expanded===e.id ? null : e.id)}
                    search={search}
                    onShareMsg={msg => setToast(msg)}
                  />
                ))
              ) : (
                <div style={{ position:"relative" }}>
                  {/* Timeline vertical line */}
                  <div style={{ position:"absolute", left:"50%", top:0, bottom:0, width:"1px", background:`linear-gradient(to bottom,transparent,${BORDER},transparent)`, transform:"translateX(-50%)", pointerEvents:"none" }} />
                  {filtered.map((e, i) => (
                    <TimelineCard
                      key={e.id} entry={e}
                      index={entries.length - entries.indexOf(e)}
                      left={i%2===0}
                      expanded={expanded===e.id}
                      onToggle={() => setExpanded(expanded===e.id ? null : e.id)}
                      search={search}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {modalOpen && <AddEntryModal onClose={() => setModalOpen(false)} onAdded={e => setEntries(p => [e, ...p])} />}
    </>
  );
}
