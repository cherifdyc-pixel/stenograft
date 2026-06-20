"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

const MY_KEY = "sg_my_communities";

const CATEGORIES = ["Toutes","Politique","Culture","Sport","Tech","Économie","Éducation","Environnement"] as const;
type Cat  = typeof CATEGORIES[number];
type Sort = "populaire" | "recent" | "alpha";

const CAT_ICONS: Record<string,string> = {
  Toutes:"🌐", Politique:"🏛️", Culture:"🎭", Sport:"⚽",
  Tech:"💻", Économie:"📊", Éducation:"📚", Environnement:"🌿",
};

const CAT_COLOR: Record<string,string> = {
  Politique:"#E0492F", Culture:"#9B59B6", Sport:"#E67E22",
  Tech:"#2ECC71", Économie:"#F39C12", Éducation:"#1D9BF0", Environnement:"#27AE60",
};

type Community = {
  id: string; name: string; description: string | null;
  created_by: string | null; created_at: string;
  category?: string | null; member_count?: number | null;
};

// Fake recent activity messages per community
const ACTIVITY_MSGS = [
  "vient de rejoindre la communauté",
  "a grafté un nouveau message",
  "a partagé un lien",
  "a répondu à une discussion",
  "a approuvé une proposition",
];
const ACTIVITY_AUTHORS = ["Soraya M.","Karim D.","Léa V.","Fouad K.","Adrien T.","Camille R.","Baptiste L.","Marine P.","Thomas G.","Yasmine B."];

function loadMyIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(MY_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function saveMyIds(ids: Set<string>) {
  localStorage.setItem(MY_KEY, JSON.stringify([...ids]));
}

function fakeCount(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  return 12 + (n % 480);
}

function fakeActivity(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 17 + id.charCodeAt(i)) & 0xffff;
  return 1 + (n % 24);
}

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 86400)  return "aujourd'hui";
  const d = Math.floor(s / 86400);
  if (d < 30)    return `il y a ${d}j`;
  const m = Math.floor(d / 30);
  if (m < 12)    return `il y a ${m} mois`;
  return `il y a ${Math.floor(m / 12)} an${Math.floor(m/12)>1?"s":""}`;
}

function avatarGrad(name: string): string {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

function communityHue(id: string): number {
  return (id.charCodeAt(0) * 17 + (id.charCodeAt(1) || 5) * 7) % 360;
}

// ── MemberAvatars ──────────────────────────────────────────────────────────────

function MemberAvatars({ names, max=3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  return (
    <div style={{ display:"flex" }}>
      {shown.map((name, i) => (
        <div key={name} style={{ width:"20px", height:"20px", borderRadius:"50%", background:avatarGrad(name), border:`1.5px solid ${BG}`, marginLeft: i===0 ? 0 : "-6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px", fontWeight:800, color:"#fff" }}>
          {name[0]}
        </div>
      ))}
    </div>
  );
}

// ── CommunityCard ──────────────────────────────────────────────────────────────

function CommunityCard({ c, joined, onJoin, onLeave, onOpen, featured=false }: {
  c: Community; joined: boolean; onJoin: () => void; onLeave: () => void; onOpen: () => void; featured?: boolean;
}) {
  const initials    = c.name.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();
  const memberCount = c.member_count ?? fakeCount(c.id);
  const hue         = communityHue(c.id);
  const actCount    = fakeActivity(c.id);
  const catColor    = CAT_COLOR[c.category ?? ""] ?? RED;
  const fakeNames   = ACTIVITY_AUTHORS.slice(0, 5).map((n,i) => n + c.id.slice(i%3,i%3+1));

  return (
    <div
      style={{ background:SURFACE, border:`1px solid ${joined ? GOLD+"40" : BORDER}`, borderRadius:"16px", overflow:"hidden", transition:"border-color 0.15s, transform 0.15s, box-shadow 0.15s", cursor:"pointer", ...(featured ? { gridColumn:"span 2" } : {}) }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = joined ? GOLD+"80" : RED+"50"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = joined ? GOLD+"40" : BORDER; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
      onClick={onOpen}
    >
      {/* Bannière */}
      <div style={{ height: featured ? "80px" : "56px", background:`linear-gradient(135deg,hsl(${hue},55%,8%) 0%,hsl(${(hue+60)%360},60%,14%) 100%)`, position:"relative" }}>
        {joined && <span style={{ position:"absolute", top:"8px", right:"10px", background:GOLD, color:"#000", fontSize:"9px", fontWeight:800, padding:"2px 8px", borderRadius:"20px", letterSpacing:"0.5px" }}>MEMBRE</span>}
        {featured && <span style={{ position:"absolute", top:"8px", left:"10px", background:`${RED}22`, border:`1px solid ${RED}40`, color:RED, fontSize:"9px", fontWeight:800, padding:"2px 8px", borderRadius:"20px", letterSpacing:"0.5px" }}>🔥 TENDANCE</span>}
      </div>

      <div style={{ padding:"0 14px 14px" }}>
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginTop:"-20px", marginBottom:"10px" }}>
          <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:`hsl(${hue},50%,15%)`, border:`2px solid ${BG}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:900, color:`hsl(${hue},80%,70%)` }}>
            {initials}
          </div>
          <button
            onClick={e => { e.stopPropagation(); joined ? onLeave() : onJoin(); }}
            style={{ padding:"5px 13px", borderRadius:"100px", fontSize:"11px", fontWeight:700, cursor:"pointer", background: joined ? "transparent" : RED, color: joined ? TEXT2 : "#fff", border: joined ? `1px solid ${BORDER}` : "none", transition:"all 0.12s", flexShrink:0 }}
            onMouseEnter={e => { if (joined) { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; } }}
            onMouseLeave={e => { if (joined) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; } }}
          >
            {joined ? "Quitter" : "Rejoindre"}
          </button>
        </div>

        <p style={{ color:TEXT, fontSize:"14px", fontWeight:700, margin:"0 0 3px", lineHeight:1.3 }}>{c.name}</p>

        {c.category && (
          <span style={{ display:"inline-block", fontSize:"9px", fontWeight:700, color:catColor, background:catColor+"15", border:`1px solid ${catColor}30`, borderRadius:"100px", padding:"2px 7px", marginBottom:"6px" }}>
            {CAT_ICONS[c.category]||"🌐"} {c.category}
          </span>
        )}

        {c.description && (
          <p style={{ color:TEXT2, fontSize:"12px", margin:"0 0 10px", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{c.description}</p>
        )}

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <MemberAvatars names={fakeNames} />
            <span style={{ fontSize:"10px", color:TEXT2 }}>{memberCount.toLocaleString("fr-FR")} membres</span>
          </div>
          <span style={{ fontSize:"10px", color: actCount > 10 ? RED : TEXT3 }}>
            {actCount > 10 ? `🔴 ${actCount} actifs` : `${actCount} en ligne`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── CommunityModal ──────────────────────────────────────────────────────────────

type FeedItem = { id: number; author: string; text: string; mins: number };

function CommunityModal({ c, joined, onJoin, onLeave, onClose }: {
  c: Community; joined: boolean; onJoin: () => void; onLeave: () => void; onClose: () => void;
}) {
  const [feed, setFeed]     = useState<FeedItem[]>([]);
  const [input, setInput]   = useState("");
  const [posted, setPosted] = useState(false);

  const initials    = c.name.trim().split(/\s+/).map(w => w[0]).join("").slice(0,2).toUpperCase();
  const memberCount = c.member_count ?? fakeCount(c.id);
  const hue         = communityHue(c.id);
  const date        = new Date(c.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" });
  const catColor    = CAT_COLOR[c.category ?? ""] ?? RED;
  const actCount    = fakeActivity(c.id);
  const fakeNames   = ACTIVITY_AUTHORS.slice(0, 5).map((n,i) => n + c.id.slice(i%3,i%3+1));

  // Generate fake feed items
  useEffect(() => {
    const items: FeedItem[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      author: ACTIVITY_AUTHORS[i % ACTIVITY_AUTHORS.length],
      text: [
        `Passionnant de voir comment ${c.name} évolue cette semaine ! Quelqu'un a des nouvelles sur le dernier sujet ?`,
        `Je viens de partager un article très intéressant sur les enjeux de la communauté. À lire absolument.`,
        `Merci à tous les membres actifs, c'est grâce à vous que cette communauté grandit 🙏`,
        `Discussion ouverte : quel serait le prochain thème à aborder ensemble ?`,
        `J'ai une question pour les membres expérimentés : comment bien démarrer dans ${c.category ?? "ce domaine"} ?`,
        `Retour sur le débat de la semaine dernière — les points principaux ont été résumés ici.`,
      ][i % 6],
      mins: [2, 14, 38, 67, 120, 300][i],
    }));
    setFeed(items);
  }, [c.id, c.name, c.category]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const postMsg = () => {
    if (!input.trim()) return;
    const item: FeedItem = { id: Date.now(), author: "Vous", text: input.trim(), mins: 0 };
    setFeed(prev => [item, ...prev]);
    setInput("");
    setPosted(true);
    setTimeout(() => setPosted(false), 2000);
  };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:"22px", width:"100%", maxWidth:"520px", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }}>

        {/* Bannière */}
        <div style={{ height:"90px", background:`linear-gradient(135deg,hsl(${hue},55%,8%) 0%,hsl(${(hue+60)%360},60%,18%) 100%)`, position:"relative", flexShrink:0 }}>
          <button onClick={onClose} style={{ position:"absolute", top:"12px", right:"12px", background:"rgba(0,0,0,0.6)", border:"none", color:TEXT, fontSize:"18px", width:"32px", height:"32px", borderRadius:"50%", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>
        </div>

        <div style={{ overflowY:"auto", scrollbarWidth:"none" }}>
          <div style={{ padding:"0 20px 20px" }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:"-26px", marginBottom:"14px" }}>
              <div style={{ width:"52px", height:"52px", borderRadius:"13px", background:`hsl(${hue},50%,15%)`, border:`3px solid ${BG}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", fontWeight:900, color:`hsl(${hue},80%,70%)` }}>
                {initials}
              </div>
              <button onClick={() => { joined ? onLeave() : onJoin(); }}
                style={{ padding:"9px 20px", borderRadius:"100px", fontSize:"13px", fontWeight:700, cursor:"pointer", border: joined ? `1px solid ${BORDER}` : "none", background: joined ? "transparent" : RED, color: joined ? TEXT2 : "#fff", transition:"all 0.12s" }}
              >{joined ? "Quitter" : "Rejoindre"}</button>
            </div>

            <h2 style={{ color:TEXT, fontSize:"20px", fontWeight:900, margin:"0 0 4px" }}>{c.name}</h2>
            {c.category && (
              <span style={{ display:"inline-block", fontSize:"11px", fontWeight:700, color:catColor, background:catColor+"15", border:`1px solid ${catColor}30`, borderRadius:"100px", padding:"3px 10px", marginBottom:"10px" }}>
                {CAT_ICONS[c.category]||"🌐"} {c.category}
              </span>
            )}
            {c.description && <p style={{ color:TEXT2, fontSize:"13px", lineHeight:1.6, margin:"0 0 14px" }}>{c.description}</p>}

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"10px", marginBottom:"16px" }}>
              {[
                { label:"Membres", value:memberCount.toLocaleString("fr-FR"), icon:"👥" },
                { label:"En ligne", value:String(actCount), icon:"🔴" },
                { label:"Créée", value:date, icon:"📅" },
              ].map(s => (
                <div key={s.label} style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 12px", textAlign:"center" }}>
                  <div style={{ fontSize:"16px", marginBottom:"3px" }}>{s.icon}</div>
                  <div style={{ color:TEXT, fontWeight:700, fontSize:"13px" }}>{s.value}</div>
                  <div style={{ color:TEXT2, fontSize:"10px" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Top membres */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
              <MemberAvatars names={fakeNames} max={5} />
              <span style={{ color:TEXT2, fontSize:"12px" }}>{fakeNames.slice(0,3).map(n=>n.split(".")[0]).join(", ")} et {memberCount-3} autres</span>
            </div>

            {/* Fil d'activité */}
            <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:"14px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                <span style={{ color:TEXT2, fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>Activité récente</span>
                <span style={{ color:TEXT3, fontSize:"10px" }}>{feed.length} messages</span>
              </div>

              {/* Post input (membres only) */}
              {joined && (
                <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && postMsg()} placeholder="Écrire dans la communauté…"
                    style={{ flex:1, background:BG, border:`1px solid ${BORDER}`, borderRadius:"8px", padding:"8px 12px", color:TEXT, fontSize:"13px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
                    onFocus={e => (e.currentTarget.style.borderColor = RED+"60")}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                  <button onClick={postMsg} disabled={!input.trim()} style={{ background: input.trim() ? RED : "#1a1a1a", border:"none", borderRadius:"8px", padding:"8px 12px", color:"#fff", fontSize:"13px", cursor: input.trim() ? "pointer" : "default", fontWeight:700, transition:"background 0.12s", flexShrink:0 }}>
                    {posted ? "✓" : "→"}
                  </button>
                </div>
              )}

              {/* Feed */}
              <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
                {feed.map(item => (
                  <div key={item.id} style={{ display:"flex", gap:"10px", padding:"10px 0", borderBottom:`1px solid ${BORDER}` }}>
                    <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:avatarGrad(item.author), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", fontWeight:800, color:"#fff", flexShrink:0 }}>{item.author[0]}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", gap:"6px", alignItems:"center", marginBottom:"3px" }}>
                        <span style={{ color: item.author==="Vous" ? GOLD : TEXT, fontSize:"12px", fontWeight:700 }}>{item.author}</span>
                        <span style={{ color:TEXT3, fontSize:"10px" }}>{item.mins === 0 ? "à l'instant" : item.mins < 60 ? `${item.mins}min` : `${Math.round(item.mins/60)}h`}</span>
                      </div>
                      <p style={{ color:TEXT2, fontSize:"12px", margin:0, lineHeight:1.5 }}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {!joined && (
                <div style={{ textAlign:"center", padding:"16px 0 4px" }}>
                  <button onClick={onJoin} style={{ background:RED, border:"none", borderRadius:"100px", padding:"10px 24px", color:"#fff", fontSize:"13px", fontWeight:800, cursor:"pointer" }}>
                    Rejoindre pour participer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CreateModal ────────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Community) => void }) {
  const [name,     setName]     = useState("");
  const [desc,     setDesc]     = useState("");
  const [category, setCategory] = useState<string>("Politique");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCreate = async () => {
    if (!name.trim() || loading) return;
    setLoading(true); setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("communities").insert({ name:name.trim(), description:desc.trim()||null, category })
      .select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated(data as Community);
    onClose();
  };

  const inputStyle: React.CSSProperties = { width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"11px 14px", color:TEXT, fontSize:"14px", outline:"none", fontFamily:"inherit", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(10px)", display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderTop:`2px solid ${GOLD}`, borderRadius:"22px", width:"100%", maxWidth:"480px", padding:"28px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"22px" }}>
          <div>
            <h2 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 4px" }}>Nouvelle communauté</h2>
            <p style={{ color:TEXT2, fontSize:"12px", margin:0 }}>Crée un espace pour ta communauté</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:TEXT2, fontSize:"22px", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div>
            <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:GOLD, marginBottom:"6px", letterSpacing:"0.8px", textTransform:"uppercase" }}>Nom *</label>
            <input ref={inputRef} value={name} onChange={e => setName(e.target.value.slice(0,60))} placeholder="Ex: Développeurs francophones" style={inputStyle} onKeyDown={e => e.key==="Enter" && handleCreate()} />
            <span style={{ color:TEXT3, fontSize:"10px", float:"right", marginTop:"3px" }}>{name.length}/60</span>
          </div>

          <div>
            <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:TEXT2, marginBottom:"8px", letterSpacing:"0.8px", textTransform:"uppercase" }}>Catégorie</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
              {CATEGORIES.slice(1).map(cat => {
                const col = CAT_COLOR[cat] ?? RED;
                return (
                  <button key={cat} onClick={() => setCategory(cat)} style={{ padding:"6px 12px", borderRadius:"100px", fontSize:"12px", fontWeight:600, cursor:"pointer", border:`1px solid ${category===cat ? col : BORDER}`, background: category===cat ? col+"20" : "transparent", color: category===cat ? col : TEXT2, transition:"all 0.12s" }}>
                    {CAT_ICONS[cat]} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ display:"block", fontSize:"11px", fontWeight:700, color:TEXT2, marginBottom:"6px", letterSpacing:"0.8px", textTransform:"uppercase" }}>Description <span style={{ color:TEXT3 }}>(optionnel)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0,200))} placeholder="De quoi parle cette communauté ?" rows={3} style={{ ...inputStyle, resize:"none", lineHeight:1.6 }} />
            <span style={{ color:TEXT3, fontSize:"10px", float:"right", marginTop:"3px" }}>{desc.length}/200</span>
          </div>

          {error && <p style={{ color:RED, fontSize:"12px", margin:0 }}>{error}</p>}

          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", marginTop:"6px" }}>
            <button onClick={onClose} style={{ background:"transparent", color:TEXT2, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 18px", fontSize:"14px", fontWeight:600, cursor:"pointer" }}>Annuler</button>
            <button onClick={handleCreate} disabled={!name.trim()||loading} style={{ background: name.trim()&&!loading ? RED : "#1a1a1a", color: name.trim()&&!loading ? "#fff" : "#333", border:"none", borderRadius:"10px", padding:"10px 22px", fontSize:"14px", fontWeight:800, cursor: name.trim()&&!loading ? "pointer" : "not-allowed", boxShadow: name.trim() ? `0 4px 16px ${RED}44` : "none" }}>
              {loading ? "Création…" : "Créer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CommunautesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myIds,       setMyIds]       = useState<Set<string>>(new Set());
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState("");
  const [activeTab,   setActiveTab]   = useState<"toutes"|"miennes"|"decouvrir">("toutes");
  const [activeCat,   setActiveCat]   = useState<Cat>("Toutes");
  const [sort,        setSort]        = useState<Sort>("populaire");
  const [createOpen,  setCreateOpen]  = useState(false);
  const [selected,    setSelected]    = useState<Community | null>(null);

  useEffect(() => { setMyIds(loadMyIds()); }, []);

  const fetchCommunities = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("communities").select("*").order("created_at", { ascending:false });
    setCommunities(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const join  = (id: string) => { const next = new Set([...myIds, id]); setMyIds(next); saveMyIds(next); };
  const leave = (id: string) => { const next = new Set([...myIds].filter(x => x!==id)); setMyIds(next); saveMyIds(next); };
  const handleCreated = (c: Community) => { setCommunities(p => [c, ...p]); join(c.id); };

  let filtered = communities.filter(c => {
    const q    = search.trim().toLowerCase();
    const matchS = !q || c.name.toLowerCase().includes(q) || (c.description??"").toLowerCase().includes(q);
    const matchC = activeCat==="Toutes" || c.category===activeCat;
    const matchT = activeTab==="toutes" ? true : activeTab==="miennes" ? myIds.has(c.id) : !myIds.has(c.id);
    return matchS && matchC && matchT;
  });

  // Sort
  if (sort === "populaire") filtered = [...filtered].sort((a,b) => fakeCount(b.id) - fakeCount(a.id));
  else if (sort === "recent") filtered = [...filtered].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  else filtered = [...filtered].sort((a,b) => a.name.localeCompare(b.name));

  // Featured = top 2 most popular (only on "toutes" tab without search/filter)
  const showFeatured = activeTab==="toutes" && !search && activeCat==="Toutes";
  const featured     = showFeatured ? [...communities].sort((a,b) => fakeCount(b.id)-fakeCount(a.id)).slice(0,2) : [];
  const featuredIds  = new Set(featured.map(c => c.id));
  const rest         = showFeatured ? filtered.filter(c => !featuredIds.has(c.id)) : filtered;

  const myCount = communities.filter(c => myIds.has(c.id)).length;

  return (
    <>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { display:none; }`}</style>
      <div style={{ maxWidth:"860px", margin:"0 auto", paddingBottom:"80px", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* Header sticky */}
        <div style={{ position:"sticky", top:0, zIndex:10, background:`${BG}EE`, backdropFilter:"blur(12px)", borderBottom:`1px solid ${BORDER}`, padding:"14px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", flexWrap:"wrap" }}>
          <div>
            <h1 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 2px" }}>Communautés</h1>
            {!loading && <p style={{ color:TEXT2, fontSize:"11px", margin:0 }}>{communities.length} communauté{communities.length!==1?"s":""} · {myCount} rejoint{myCount!==1?"es":"e"}</p>}
          </div>
          <button onClick={() => setCreateOpen(true)} style={{ background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"9px 18px", fontSize:"13px", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 18px ${RED}44`, flexShrink:0 }}>
            + Créer
          </button>
        </div>

        <div style={{ padding:"12px 16px" }}>

          {/* Recherche */}
          <div style={{ position:"relative", marginBottom:"12px" }}>
            <span style={{ position:"absolute", left:"13px", top:"50%", transform:"translateY(-50%)", fontSize:"14px", pointerEvents:"none" }}>🔎</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une communauté…"
              style={{ width:"100%", padding:"10px 40px 10px 40px", background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:"100px", color:TEXT, fontSize:"13px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
              onFocus={e => (e.currentTarget.style.borderColor = RED+"60")}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"12px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"16px" }}>×</button>}
          </div>

          {/* Onglets */}
          <div style={{ display:"flex", borderBottom:`1px solid ${BORDER}`, marginBottom:"12px" }}>
            {([["toutes","Toutes"],["miennes",`Mes communautés${myCount>0?" ("+myCount+")":""}`],["decouvrir","Découvrir"]] as [typeof activeTab,string][]).map(([key,label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{ flex:1, padding:"11px 6px", background:"none", border:"none", borderBottom:`2px solid ${activeTab===key ? RED : "transparent"}`, color: activeTab===key ? TEXT : TEXT2, fontSize:"12px", fontWeight: activeTab===key ? 700 : 400, cursor:"pointer", transition:"all 0.12s", whiteSpace:"nowrap" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtres + tri */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px", marginBottom:"12px", flexWrap:"wrap" }}>
            <div style={{ display:"flex", gap:"5px", overflowX:"auto", paddingBottom:"2px", scrollbarWidth:"none" }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCat(cat)} style={{ padding:"5px 12px", borderRadius:"100px", fontSize:"11px", fontWeight:600, cursor:"pointer", flexShrink:0, border:`1px solid ${activeCat===cat ? RED : BORDER}`, background: activeCat===cat ? RED : "transparent", color: activeCat===cat ? "#fff" : TEXT2, transition:"all 0.12s" }}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
            <select value={sort} onChange={e => setSort(e.target.value as Sort)} style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:"8px", color:TEXT2, fontSize:"11px", padding:"5px 8px", outline:"none", cursor:"pointer", flexShrink:0 }}>
              <option value="populaire">⬆ Populaire</option>
              <option value="recent">🕐 Récent</option>
              <option value="alpha">🔤 A–Z</option>
            </select>
          </div>

          {/* Contenu */}
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"12px" }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:"16px", overflow:"hidden" }}>
                  <div style={{ height:"56px", background:"#0d0d0d" }} />
                  <div style={{ padding:"8px 14px 14px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:"#111", marginTop:"-20px", marginBottom:"10px" }} />
                    <div style={{ height:"13px", width:"60%", background:"#111", borderRadius:"6px", marginBottom:"8px" }} />
                    <div style={{ height:"10px", width:"80%", background:"#0a0a0a", borderRadius:"6px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Featured */}
              {featured.length > 0 && (
                <div style={{ marginBottom:"20px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"10px" }}>
                    <span style={{ color:TEXT2, fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>🔥 Tendance</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"10px" }}>
                    {featured.map(c => (
                      <CommunityCard key={c.id} c={c} joined={myIds.has(c.id)} onJoin={() => join(c.id)} onLeave={() => leave(c.id)} onOpen={() => setSelected(c)} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Section label */}
              {rest.length > 0 && showFeatured && (
                <div style={{ marginBottom:"10px" }}>
                  <span style={{ color:TEXT2, fontSize:"11px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>Toutes les communautés · {rest.length}</span>
                </div>
              )}

              {/* Cards grid */}
              {rest.length === 0 && !showFeatured ? (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"10px", padding:"48px 20px", textAlign:"center" }}>
                  <span style={{ fontSize:"40px" }}>
                    {activeTab==="miennes" ? "🤝" : activeTab==="decouvrir" ? "🌐" : "🗺️"}
                  </span>
                  <p style={{ color:TEXT, fontSize:"16px", fontWeight:900, margin:0 }}>
                    {activeTab==="miennes" ? "Aucune communauté rejointe" : activeTab==="decouvrir" ? "Tu as tout rejoint !" : "Aucune communauté trouvée"}
                  </p>
                  <p style={{ color:TEXT2, fontSize:"12px", margin:0, maxWidth:"240px", lineHeight:1.6 }}>
                    {activeTab==="miennes" ? "Rejoins une communauté ou crée la tienne." : activeTab==="decouvrir" ? "Tu es déjà membre de toutes les communautés disponibles." : search ? "Essaie un autre terme." : "Sois le premier à en créer une !"}
                  </p>
                  {activeTab!=="decouvrir" && (
                    <button onClick={() => { setCreateOpen(true); }} style={{ marginTop:"4px", background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"10px 22px", fontSize:"13px", fontWeight:800, cursor:"pointer" }}>
                      Créer une communauté
                    </button>
                  )}
                </div>
              ) : rest.length > 0 ? (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:"10px" }}>
                  {rest.map(c => (
                    <CommunityCard key={c.id} c={c} joined={myIds.has(c.id)} onJoin={() => join(c.id)} onLeave={() => leave(c.id)} onOpen={() => setSelected(c)} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
      {selected && (
        <CommunityModal
          c={selected}
          joined={myIds.has(selected.id)}
          onJoin={() => { join(selected.id); setSelected(s => s ? {...s} : null); }}
          onLeave={() => { leave(selected.id); setSelected(s => s ? {...s} : null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
