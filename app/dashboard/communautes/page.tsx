"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BG     = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

const MY_KEY = "sg_my_communities";

const CATEGORIES = ["Toutes", "Politique", "Culture", "Sport", "Tech", "Économie", "Éducation", "Environnement"] as const;
type Cat = typeof CATEGORIES[number];

const CAT_ICONS: Record<string, string> = {
  Toutes: "🌐", Politique: "🏛️", Culture: "🎭", Sport: "⚽",
  Tech: "💻", Économie: "📊", Éducation: "📚", Environnement: "🌿",
};

type Community = {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  category?: string | null;
  member_count?: number | null;
};

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

function relTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 86400)  return "aujourd'hui";
  const d = Math.floor(s / 86400);
  if (d < 30)    return `il y a ${d}j`;
  const m = Math.floor(d / 30);
  if (m < 12)    return `il y a ${m} mois`;
  return `il y a ${Math.floor(m / 12)} an${Math.floor(m / 12) > 1 ? "s" : ""}`;
}

// ── CommunityCard ─────────────────────────────────────────────────────────────

function CommunityCard({
  c, joined, onJoin, onLeave, onOpen,
}: {
  c: Community; joined: boolean;
  onJoin?: () => void; onLeave?: () => void; onOpen: () => void;
}) {
  const initials   = c.name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const memberCount = c.member_count ?? fakeCount(c.id);
  const hue        = (c.id.charCodeAt(0) * 17 + c.id.charCodeAt(1) * 7) % 360;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", transition: "border-color 0.15s, transform 0.15s", cursor: "pointer" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = joined ? GOLD + "60" : RED + "50"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "none"; }}
      onClick={onOpen}
    >
      {/* Bannière */}
      <div style={{ height: "60px", background: `linear-gradient(135deg,hsl(${hue},55%,8%) 0%,hsl(${(hue+60)%360},60%,14%) 100%)`, position: "relative" }}>
        {joined && (
          <span style={{ position: "absolute", top: "8px", right: "10px", background: GOLD, color: "#000", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.5px" }}>MEMBRE</span>
        )}
      </div>

      <div style={{ padding: "0 16px 16px" }}>
        {/* Avatar */}
        <div style={{ marginTop: "-22px", marginBottom: "10px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `hsl(${hue},50%,15%)`, border: `2px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 900, color: `hsl(${hue},80%,70%)` }}>
            {initials}
          </div>
        </div>

        <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 }}>{c.name}</p>
        {c.category && (
          <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 700, color: TEXT2, background: "#111", border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "2px 8px", marginBottom: "6px" }}>
            {CAT_ICONS[c.category] || "🌐"} {c.category}
          </span>
        )}
        {c.description && (
          <p style={{ color: TEXT2, fontSize: "12px", margin: "0 0 10px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{c.description}</p>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            <span style={{ fontSize: "11px", color: TEXT2 }}>👥 {memberCount.toLocaleString("fr-FR")}</span>
            <span style={{ fontSize: "11px", color: TEXT2 }}>🕐 {relTime(c.created_at)}</span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); joined ? onLeave?.() : onJoin?.(); }}
            style={{
              padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 700, cursor: "pointer",
              background: joined ? "transparent" : RED,
              color: joined ? TEXT2 : "#fff",
              border: joined ? `1px solid ${BORDER}` : "none",
              transition: "all 0.12s",
            } as React.CSSProperties}
            onMouseEnter={e => { if (joined) { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; } }}
            onMouseLeave={e => { if (joined) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; } }}
          >
            {joined ? "Quitter" : "Rejoindre"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── CommunityModal ─────────────────────────────────────────────────────────────

function CommunityModal({ c, joined, onJoin, onLeave, onClose }: {
  c: Community; joined: boolean; onJoin: () => void; onLeave: () => void; onClose: () => void;
}) {
  const initials    = c.name.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const memberCount = c.member_count ?? fakeCount(c.id);
  const hue         = (c.id.charCodeAt(0) * 17 + c.id.charCodeAt(1) * 7) % 360;
  const date        = new Date(c.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "22px", width: "100%", maxWidth: "500px", overflow: "hidden" }}>
        {/* Bannière */}
        <div style={{ height: "100px", background: `linear-gradient(135deg,hsl(${hue},55%,8%) 0%,hsl(${(hue+60)%360},60%,18%) 100%)`, position: "relative" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(0,0,0,0.6)", border: "none", color: TEXT, fontSize: "18px", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "-28px", marginBottom: "14px" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: `hsl(${hue},50%,15%)`, border: `3px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 900, color: `hsl(${hue},80%,70%)` }}>
              {initials}
            </div>
            <button
              onClick={() => { joined ? onLeave() : onJoin(); }}
              style={{ padding: "9px 20px", borderRadius: "100px", fontSize: "14px", fontWeight: 700, cursor: "pointer", border: joined ? `1px solid ${BORDER}` : "none", background: joined ? "transparent" : RED, color: joined ? TEXT2 : "#fff" }}
            >
              {joined ? "Quitter" : "Rejoindre"}
            </button>
          </div>

          <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 4px" }}>{c.name}</h2>
          {c.category && <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 700, color: TEXT2, background: "#111", border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "3px 10px", marginBottom: "10px" }}>{CAT_ICONS[c.category] || "🌐"} {c.category}</span>}
          {c.description && <p style={{ color: TEXT2, fontSize: "14px", lineHeight: 1.6, margin: "0 0 16px" }}>{c.description}</p>}

          <div style={{ display: "flex", gap: "20px", padding: "14px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, marginBottom: "16px" }}>
            <div><span style={{ color: TEXT, fontWeight: 700, fontSize: "16px" }}>{memberCount.toLocaleString("fr-FR")}</span><span style={{ color: TEXT2, fontSize: "12px", marginLeft: "4px" }}>membres</span></div>
            <div><span style={{ color: TEXT, fontWeight: 700, fontSize: "16px" }}>{date}</span><span style={{ color: TEXT2, fontSize: "12px", marginLeft: "4px" }}>créée</span></div>
          </div>

          <div style={{ textAlign: "center", color: TEXT2, fontSize: "13px", padding: "20px 0" }}>
            💬 Le fil de cette communauté arrive bientôt.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CreateModal ───────────────────────────────────────────────────────────────

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
      .from("communities")
      .insert({ name: name.trim(), description: desc.trim() || null, category })
      .select().single();
    setLoading(false);
    if (err) { setError(err.message); return; }
    onCreated(data as Community);
    onClose();
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "11px 14px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "22px", width: "100%", maxWidth: "480px", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: "0 0 4px" }}>Nouvelle communauté</h2>
            <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>Crée un espace pour ta communauté</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "22px", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: GOLD, marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Nom *</label>
            <input ref={inputRef} value={name} onChange={e => setName(e.target.value.slice(0, 60))} placeholder="Ex: Développeurs francophones" style={inputStyle} onKeyDown={e => e.key === "Enter" && handleCreate()} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT2, marginBottom: "8px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Catégorie</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {CATEGORIES.slice(1).map(cat => (
                <button key={cat} onClick={() => setCategory(cat)} style={{ padding: "6px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${category === cat ? RED : BORDER}`, background: category === cat ? RED : "transparent", color: category === cat ? "#fff" : TEXT2, transition: "all 0.12s" }}>
                  {CAT_ICONS[cat]} {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT2, marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Description <span style={{ color: "#333" }}>(optionnel)</span></label>
            <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 200))} placeholder="De quoi parle cette communauté ?" rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} />
          </div>

          {error && <p style={{ color: RED, fontSize: "12px", margin: 0 }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "4px" }}>
            <button onClick={onClose} style={{ background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
            <button onClick={handleCreate} disabled={!name.trim() || loading} style={{ background: name.trim() && !loading ? RED : "#1a1a1a", color: name.trim() && !loading ? "#fff" : "#333", border: "none", borderRadius: "10px", padding: "10px 22px", fontSize: "14px", fontWeight: 800, cursor: name.trim() && !loading ? "pointer" : "not-allowed", boxShadow: name.trim() ? `0 4px 16px ${RED}44` : "none" }}>
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
  const [activeTab,   setActiveTab]   = useState<"toutes" | "miennes" | "decouvrir">("toutes");
  const [activeCat,   setActiveCat]   = useState<Cat>("Toutes");
  const [createOpen,  setCreateOpen]  = useState(false);
  const [selected,    setSelected]    = useState<Community | null>(null);

  useEffect(() => { setMyIds(loadMyIds()); }, []);

  const fetchCommunities = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("communities").select("*").order("created_at", { ascending: false });
    setCommunities(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCommunities(); }, [fetchCommunities]);

  const join  = (id: string) => { const next = new Set([...myIds, id]); setMyIds(next); saveMyIds(next); };
  const leave = (id: string) => { const next = new Set([...myIds].filter(x => x !== id)); setMyIds(next); saveMyIds(next); };

  const handleCreated = (c: Community) => { setCommunities(p => [c, ...p]); join(c.id); };

  const filtered = communities.filter(c => {
    const matchSearch = search.trim() === "" || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat    = activeCat === "Toutes" || c.category === activeCat;
    const matchTab    = activeTab === "toutes" ? true : activeTab === "miennes" ? myIds.has(c.id) : !myIds.has(c.id);
    return matchSearch && matchCat && matchTab;
  });

  const myCount  = communities.filter(c => myIds.has(c.id)).length;

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "0 0 80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.3px" }}>Communautés</h1>
            <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>{communities.length} communauté{communities.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setCreateOpen(true)} style={{ background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "10px 20px", fontSize: "14px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 18px ${RED}44`, flexShrink: 0 }}>
            + Créer
          </button>
        </div>

        <div style={{ padding: "16px" }}>

          {/* Barre de recherche */}
          <div style={{ position: "relative", marginBottom: "14px" }}>
            <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", pointerEvents: "none" }}>🔎</span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une communauté…"
              style={{ width: "100%", padding: "11px 14px 11px 42px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit" }}
            />
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", gap: "0", borderBottom: `1px solid ${BORDER}`, marginBottom: "14px" }}>
            {([["toutes", "Toutes"], ["miennes", `Mes communautés (${myCount})`], ["decouvrir", "Découvrir"]] as [typeof activeTab, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, padding: "12px 8px", background: "none", border: "none", borderBottom: `2px solid ${activeTab === key ? RED : "transparent"}`, color: activeTab === key ? TEXT : TEXT2, fontSize: "13px", fontWeight: activeTab === key ? 700 : 400, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Filtres catégories */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px", scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", flexShrink: 0, border: `1px solid ${activeCat === cat ? RED : BORDER}`, background: activeCat === cat ? RED : "transparent", color: activeCat === cat ? "#fff" : TEXT2, transition: "all 0.12s" }}>
                {CAT_ICONS[cat]} {cat}
              </button>
            ))}
          </div>

          {/* Contenu */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                  <div style={{ height: "60px", background: "#0d0d0d" }} />
                  <div style={{ padding: "12px 16px 16px" }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#111", marginTop: "-22px", marginBottom: "10px" }} />
                    <div style={{ height: "14px", width: "60%", background: "#111", borderRadius: "6px", marginBottom: "8px" }} />
                    <div style={{ height: "11px", width: "80%", background: "#0a0a0a", borderRadius: "6px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 20px", textAlign: "center" }}>
              <span style={{ fontSize: "48px" }}>🗺️</span>
              <p style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: 0 }}>Aucune communauté trouvée</p>
              <p style={{ color: TEXT2, fontSize: "13px", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>
                {search ? "Essaie un autre terme de recherche." : "Sois le premier à en créer une !"}
              </p>
              {!search && (
                <button onClick={() => setCreateOpen(true)} style={{ marginTop: "8px", background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "11px 24px", fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>
                  Créer une communauté
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "12px" }}>
              {filtered.map(c => (
                <CommunityCard
                  key={c.id} c={c}
                  joined={myIds.has(c.id)}
                  onJoin={() => join(c.id)}
                  onLeave={() => leave(c.id)}
                  onOpen={() => setSelected(c)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} onCreated={handleCreated} />}
      {selected && (
        <CommunityModal
          c={selected}
          joined={myIds.has(selected.id)}
          onJoin={() => { join(selected.id); setSelected(s => s ? { ...s } : null); }}
          onLeave={() => { leave(selected.id); setSelected(s => s ? { ...s } : null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
