"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import GraftActions from "@/components/GraftActions";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

type TabKey = "tous" | "reponses" | "medias" | "pinnes";
type Sort   = "recent" | "oldest";
type Graft  = {
  id: string; content: string; created_at: string;
  video_url: string | null; parent_id: string | null;
  author_name: string; user_id: string;
};

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "tous",     icon: "✍️", label: "Tous"      },
  { key: "reponses", icon: "↩️", label: "Réponses"  },
  { key: "medias",   icon: "🎬", label: "Médias"    },
  { key: "pinnes",   icon: "📌", label: "Épinglés"  },
];

const PINNED_KEY = "steno_pinned_grafts";

function getPinned(): string[] {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) ?? "[]"); } catch { return []; }
}
function togglePin(id: string): boolean {
  const pins = getPinned();
  const next  = pins.includes(id) ? pins.filter(p => p !== id) : [id, ...pins];
  localStorage.setItem(PINNED_KEY, JSON.stringify(next));
  return !pins.includes(id);
}

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  const d = new Date(iso);
  if (d.getFullYear() === new Date().getFullYear())
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function extractTags(content: string): string[] {
  return [...new Set((content.match(/#[\wÀ-ÿ]+/gi) ?? []).map(t => t.toLowerCase()))];
}

// ── DeleteModal ───────────────────────────────────────────────────────────────

function DeleteModal({ graft, onClose, onDeleted }: { graft: Graft; onClose: () => void; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleDelete = async () => {
    setDeleting(true);
    const sb = createClient();
    const { error: err } = await sb.from("grafts").delete().eq("id", graft.id);
    if (err) { setError(err.message); setDeleting(false); return; }
    onDeleted(graft.id);
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "20px", width: "100%", maxWidth: "400px", padding: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.9)" }}>
        <div style={{ fontSize: "28px", textAlign: "center", marginBottom: "12px" }}>🗑️</div>
        <h2 style={{ color: TEXT, fontSize: "18px", fontWeight: 900, textAlign: "center", margin: "0 0 8px" }}>Supprimer ce graft ?</h2>
        <p style={{ color: TEXT2, fontSize: "13px", textAlign: "center", lineHeight: 1.6, margin: "0 0 20px" }}>
          Cette action est irréversible. Le graft sera définitivement supprimé.
        </p>
        <div style={{ background: `${RED}10`, border: `1px solid ${RED}20`, borderRadius: "10px", padding: "10px 14px", marginBottom: "20px" }}>
          <p style={{ color: TEXT2, fontSize: "12px", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
            {graft.content}
          </p>
        </div>
        {error && <p style={{ color: RED, fontSize: "12px", marginBottom: "12px", textAlign: "center" }}>{error}</p>}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: "10px", background: "transparent", color: TEXT2, border: `1px solid ${BORDER}`, fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Annuler</button>
          <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: "11px", borderRadius: "10px", background: RED, color: "#fff", border: "none", fontSize: "14px", fontWeight: 800, cursor: deleting ? "not-allowed" : "pointer", opacity: deleting ? 0.7 : 1 }}>
            {deleting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditModal ─────────────────────────────────────────────────────────────────

function EditModal({ graft, onClose, onUpdated }: { graft: Graft; onClose: () => void; onUpdated: (g: Graft) => void }) {
  const [content, setContent] = useState(graft.content);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const MAX = 500;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    if (!content.trim() || content === graft.content) return;
    setSaving(true); setError(null);
    const sb = createClient();
    const { data, error: err } = await sb.from("grafts").update({ content: content.trim() }).eq("id", graft.id).select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onUpdated({ ...graft, content: (data as any).content });
    onClose();
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "20px", width: "100%", maxWidth: "480px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.9)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT, fontSize: "22px", cursor: "pointer" }}>×</button>
          <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800 }}>Modifier le graft</span>
          <button onClick={handleSave} disabled={!content.trim() || content === graft.content || saving} style={{ background: content.trim() && content !== graft.content ? RED : SURFACE, color: content.trim() && content !== graft.content ? "#fff" : TEXT3, border: "none", borderRadius: "100px", padding: "7px 16px", fontSize: "13px", fontWeight: 800, cursor: content.trim() && content !== graft.content ? "pointer" : "not-allowed" }}>
            {saving ? "…" : "Sauvegarder"}
          </button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={MAX}
            rows={6}
            style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "12px 14px", color: TEXT, fontSize: "15px", lineHeight: 1.6, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            {error && <p style={{ color: RED, fontSize: "12px", margin: 0 }}>{error}</p>}
            <span style={{ color: content.length > MAX * 0.9 ? RED : TEXT3, fontSize: "12px", marginLeft: "auto" }}>{content.length}/{MAX}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── GraftCard ─────────────────────────────────────────────────────────────────

function GraftCard({
  graft, pinned, onDelete, onEdit, onTogglePin,
}: {
  graft: Graft; pinned: boolean;
  onDelete: (g: Graft) => void; onEdit: (g: Graft) => void; onTogglePin: (id: string) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const long   = graft.content.length > 300;
  const shown  = long && !expanded ? graft.content.slice(0, 300) + "…" : graft.content;
  const tags   = extractTags(graft.content);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const renderContent = (text: string) =>
    text.split(/(#[\wÀ-ÿ]+)/gi).map((part, i) =>
      /^#[\wÀ-ÿ]+$/i.test(part)
        ? <span key={i} style={{ color: RED }}>{part}</span>
        : part
    );

  return (
    <article style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s", position: "relative" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#060606")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {pinned && <span style={{ fontSize: "10px", color: GOLD, background: `${GOLD}15`, border: `1px solid ${GOLD}30`, borderRadius: "100px", padding: "1px 7px", fontWeight: 700 }}>📌 Épinglé</span>}
          {graft.parent_id && <span style={{ fontSize: "10px", color: TEXT2, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "1px 7px" }}>↩ Réponse</span>}
          {graft.video_url && <span style={{ fontSize: "10px", color: TEXT2, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "1px 7px" }}>🎬 Vidéo</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ color: TEXT2, fontSize: "11px" }}>{relativeTime(graft.created_at)}</span>

          {/* Menu contextuel */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(v => !v)} style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#111")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >⋯</button>
            {menuOpen && (
              <div style={{ position: "absolute", right: 0, top: "32px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "12px", minWidth: "170px", zIndex: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.7)", overflow: "hidden" }}>
                {[
                  { icon: "✏️", label: "Modifier",           action: () => { setMenuOpen(false); onEdit(graft); } },
                  { icon: pinned ? "📌" : "📌", label: pinned ? "Désépingler" : "Épingler", action: () => { setMenuOpen(false); onTogglePin(graft.id); } },
                  { icon: "🗑️", label: "Supprimer",          action: () => { setMenuOpen(false); onDelete(graft); }, danger: true },
                ].map(item => (
                  <button key={item.label} onClick={item.action} style={{ width: "100%", padding: "11px 14px", background: "none", border: "none", color: item.danger ? RED : TEXT, fontSize: "13px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "10px", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span>{item.icon}</span>{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <p style={{ color: TEXT, fontSize: "14px", lineHeight: 1.65, margin: "0 0 6px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {renderContent(shown)}
      </p>
      {long && (
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: RED, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "6px", fontWeight: 600 }}>
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}

      {/* Video */}
      {graft.video_url && (
        <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}`, marginBottom: "8px" }}>
          <iframe src={graft.video_url} allowFullScreen loading="lazy" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop: "6px" }}>
        <GraftActions graftId={graft.id} />
      </div>
    </article>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ height: "11px", width: `${70+i*5}%`, background: SURFACE, borderRadius: "6px", marginBottom: "8px" }} />
          <div style={{ height: "11px", width: `${55+i*7}%`, background: "#0D0D0D", borderRadius: "6px", marginBottom: "6px" }} />
          <div style={{ height: "11px", width: "40%", background: "#0A0A0A", borderRadius: "6px" }} />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MesGraftsPage() {
  const [userId,    setUserId]    = useState<string | null>(null);
  const [grafts,    setGrafts]    = useState<Graft[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<TabKey>("tous");
  const [sort,      setSort]      = useState<Sort>("recent");
  const [search,    setSearch]    = useState("");
  const [pinned,    setPinned]    = useState<string[]>([]);
  const [toDelete,  setToDelete]  = useState<Graft | null>(null);
  const [toEdit,    setToEdit]    = useState<Graft | null>(null);

  useEffect(() => { setPinned(getPinned()); }, []);

  const fetchGrafts = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data } = await sb
      .from("grafts")
      .select("id,content,created_at,video_url,parent_id,author_name,user_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    setGrafts((data ?? []) as Graft[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGrafts(); }, [fetchGrafts]);

  const handleDelete = (id: string) => {
    setGrafts(prev => prev.filter(g => g.id !== id));
    setPinned(prev => { const next = prev.filter(p => p !== id); localStorage.setItem(PINNED_KEY, JSON.stringify(next)); return next; });
  };

  const handleUpdate = (updated: Graft) => {
    setGrafts(prev => prev.map(g => g.id === updated.id ? updated : g));
  };

  const handleTogglePin = (id: string) => {
    togglePin(id);
    setPinned(getPinned());
  };

  // Filter by tab
  const byTab = grafts.filter(g => {
    if (tab === "reponses") return !!g.parent_id;
    if (tab === "medias")   return !!g.video_url;
    if (tab === "pinnes")   return pinned.includes(g.id);
    return true;
  });

  // Filter by search
  const bySearch = search.trim()
    ? byTab.filter(g => g.content.toLowerCase().includes(search.toLowerCase()))
    : byTab;

  // Sort
  const sorted = [...bySearch].sort((a, b) => {
    if (tab === "pinnes") {
      const ai = pinned.indexOf(a.id), bi = pinned.indexOf(b.id);
      return ai - bi;
    }
    if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const counts: Record<TabKey, number> = {
    tous:     grafts.length,
    reponses: grafts.filter(g => !!g.parent_id).length,
    medias:   grafts.filter(g => !!g.video_url).length,
    pinnes:   pinned.length,
  };

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${RED}20`, border: `1px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>✍️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Mes Grafts</h1>
              {!loading && <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>{grafts.length} graft{grafts.length > 1 ? "s" : ""} publié{grafts.length > 1 ? "s" : ""}</p>}
            </div>
            {/* Tri */}
            {tab !== "pinnes" && (
              <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
                {([["recent","⬇"],["oldest","⬆"]] as [Sort,string][]).map(([s, icon]) => (
                  <button key={s} onClick={() => setSort(s)} style={{ width: "30px", height: "30px", borderRadius: "8px", fontSize: "13px", cursor: "pointer", border: `1px solid ${sort === s ? GOLD : BORDER}`, background: sort === s ? `${GOLD}20` : "transparent", color: sort === s ? GOLD : TEXT2, transition: "all 0.12s" }}>{icon}</button>
                ))}
              </div>
            )}
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, padding: "10px 4px", background: "none", border: "none", borderBottom: `2px solid ${tab === t.key ? RED : "transparent"}`, color: tab === t.key ? TEXT : TEXT2, fontSize: "12px", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", transition: "all 0.12s", display: "flex", flexDirection: "column", alignItems: "center", gap: "1px" }}>
                <span>{t.icon}</span>
                <span>{t.label}</span>
                {counts[t.key] > 0 && <span style={{ fontSize: "9px", color: tab === t.key ? RED : TEXT3, fontWeight: 700 }}>{counts[t.key]}</span>}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ padding: "8px 16px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", pointerEvents: "none" }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans mes grafts…" style={{ width: "100%", padding: "8px 36px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: "16px" }}>×</button>}
            </div>
          </div>
        </div>

        {/* Chargement */}
        {loading && <Skeleton />}

        {/* Vide */}
        {!loading && sorted.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "60px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "40px" }}>{tab === "pinnes" ? "📌" : tab === "medias" ? "🎬" : "✍️"}</span>
            <p style={{ color: TEXT, fontSize: "17px", fontWeight: 900, margin: 0 }}>
              {search ? `Aucun résultat pour "${search}"` : tab === "pinnes" ? "Aucun graft épinglé" : tab === "medias" ? "Aucun graft avec vidéo" : tab === "reponses" ? "Aucune réponse" : "Aucun graft"}
            </p>
            <p style={{ color: TEXT2, fontSize: "13px", margin: 0, maxWidth: "240px", lineHeight: 1.6 }}>
              {tab === "pinnes" ? 'Épingle tes grafts via le menu ⋯.' : "Publie ton premier graft depuis le fil."}
            </p>
            {!search && tab === "tous" && (
              <Link href="/dashboard" style={{ marginTop: "4px", padding: "9px 20px", background: RED, color: "#fff", borderRadius: "100px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
                Aller au fil
              </Link>
            )}
            {search && <button onClick={() => setSearch("")} style={{ color: RED, background: "none", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Effacer la recherche</button>}
          </div>
        )}

        {/* Liste */}
        {!loading && sorted.length > 0 && (
          <div>
            <div style={{ padding: "8px 16px 4px" }}>
              <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {sorted.length} graft{sorted.length > 1 ? "s" : ""}{search ? ` · "${search}"` : ""}
              </span>
            </div>
            {sorted.map(g => (
              <GraftCard
                key={g.id}
                graft={g}
                pinned={pinned.includes(g.id)}
                onDelete={setToDelete}
                onEdit={setToEdit}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}

        {/* Modaux */}
        {toDelete && (
          <DeleteModal graft={toDelete} onClose={() => setToDelete(null)} onDeleted={handleDelete} />
        )}
        {toEdit && (
          <EditModal graft={toEdit} onClose={() => setToEdit(null)} onUpdated={handleUpdate} />
        )}
      </div>
    </>
  );
}

