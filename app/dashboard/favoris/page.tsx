"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

type Sort = "recent" | "oldest" | "auteur";
type Favori = {
  id: string;
  created_at: string;
  graft_id: string;
  grafts: {
    id: string; content: string; created_at: string;
    author_name: string; video_url: string | null;
  } | null;
};

function avatarGrad(name: string) {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
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

function extractHashtags(content: string): string[] {
  return [...new Set((content.match(/#[\wÀ-ÿ]+/gi) ?? []).map(t => t.toLowerCase()))];
}

// ── FavoriCard ────────────────────────────────────────────────────────────────

function FavoriCard({ favori, onRemove }: { favori: Favori; onRemove: (id: string) => void }) {
  const g = favori.grafts;
  if (!g) return null;

  const [expanded,  setExpanded]  = useState(false);
  const [removing,  setRemoving]  = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const long   = g.content.length > 280;
  const shown  = long && !expanded ? g.content.slice(0, 280) + "…" : g.content;
  const tags   = extractHashtags(g.content);

  const handleRemove = async () => {
    if (!confirmed) { setConfirmed(true); return; }
    setRemoving(true);
    const sb = createClient();
    await sb.from("favoris").delete().eq("id", favori.id);
    onRemove(favori.id);
  };

  return (
    <article
      style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s", position: "relative" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#060606")}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; setConfirmed(false); }}
    >
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "8px" }}>
        <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: avatarGrad(g.author_name), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 800, flexShrink: 0 }}>
            {g.author_name[0].toUpperCase()}
          </div>
          <div>
            <span style={{ color: TEXT, fontWeight: 700, fontSize: "13px" }}>@{g.author_name}</span>
            <span style={{ color: TEXT2, fontSize: "11px", marginLeft: "6px" }}>· {relativeTime(g.created_at)}</span>
          </div>
        </Link>

        {/* Bookmark badge */}
        <span style={{ marginLeft: "auto", color: GOLD, fontSize: "12px", display: "flex", alignItems: "center", gap: "3px", flexShrink: 0 }}>
          🔖 <span style={{ fontSize: "10px", color: TEXT2 }}>{new Date(favori.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
        </span>
      </div>

      {/* Content */}
      <p style={{ color: TEXT, fontSize: "14px", lineHeight: 1.65, margin: "0 0 6px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{shown}</p>
      {long && (
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: RED, fontSize: "12px", cursor: "pointer", padding: 0, marginBottom: "6px", fontWeight: 600 }}>
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}

      {/* Video */}
      {g.video_url && (
        <div style={{ borderRadius: "10px", overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}`, marginBottom: "8px" }}>
          <iframe src={g.video_url} allowFullScreen loading="lazy" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        </div>
      )}

      {/* Hashtags */}
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
          {tags.map(t => (
            <span key={t} style={{ color: RED, fontSize: "12px", background: `${RED}12`, borderRadius: "100px", padding: "2px 8px", border: `1px solid ${RED}20` }}>{t}</span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
        <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ color: TEXT2, fontSize: "12px", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          👤 Voir le profil
        </Link>
        <button
          onClick={handleRemove}
          disabled={removing}
          style={{ marginLeft: "auto", background: confirmed ? `${RED}20` : "transparent", border: `1px solid ${confirmed ? RED : BORDER}`, borderRadius: "100px", padding: "4px 10px", color: confirmed ? RED : TEXT2, fontSize: "11px", fontWeight: confirmed ? 700 : 400, cursor: removing ? "not-allowed" : "pointer", transition: "all 0.15s" }}
        >
          {removing ? "…" : confirmed ? "Confirmer ✕" : "Retirer des favoris"}
        </button>
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
          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: SURFACE, flexShrink: 0 }} />
            <div style={{ height: "12px", width: "30%", background: SURFACE, borderRadius: "6px", marginTop: "4px" }} />
          </div>
          <div style={{ height: "11px", width: "100%", background: "#0D0D0D", borderRadius: "6px", marginBottom: "6px" }} />
          <div style={{ height: "11px", width: `${60 + i * 8}%`, background: "#0A0A0A", borderRadius: "6px" }} />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FavorisPage() {
  const [favoris,  setFavoris]  = useState<Favori[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [sort,     setSort]     = useState<Sort>("recent");
  const [tagFilter,setTagFilter]= useState<string | null>(null);

  const fetchFavoris = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await sb
      .from("favoris")
      .select("id,created_at,graft_id,grafts(id,content,created_at,author_name,video_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setFavoris((data ?? []) as unknown as Favori[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchFavoris(); }, [fetchFavoris]);

  const handleRemove = (id: string) => {
    setFavoris(prev => prev.filter(f => f.id !== id));
  };

  // All hashtags across favoris
  const allTags = [...new Set(
    favoris.flatMap(f => f.grafts ? extractHashtags(f.grafts.content) : [])
  )].slice(0, 12);

  // Filter + sort
  const filtered = favoris
    .filter(f => {
      const g = f.grafts;
      if (!g) return false;
      const q = search.toLowerCase();
      if (q && !g.content.toLowerCase().includes(q) && !g.author_name.toLowerCase().includes(q)) return false;
      if (tagFilter && !extractHashtags(g.content).includes(tagFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "recent")  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "oldest")  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "auteur")  return (a.grafts?.author_name ?? "").localeCompare(b.grafts?.author_name ?? "");
      return 0;
    });

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${GOLD}20`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🔖</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Mes Favoris</h1>
              {!loading && <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>{favoris.length} graft{favoris.length > 1 ? "s" : ""} sauvegardé{favoris.length > 1 ? "s" : ""}</p>}
            </div>

            {/* Tri */}
            <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
              {([["recent","⬇ Récent"],["oldest","⬆ Ancien"],["auteur","A-Z"]] as [Sort, string][]).map(([s, label]) => (
                <button key={s} onClick={() => setSort(s)} style={{ padding: "5px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: sort === s ? 700 : 400, cursor: "pointer", border: `1px solid ${sort === s ? GOLD : BORDER}`, background: sort === s ? `${GOLD}20` : "transparent", color: sort === s ? GOLD : TEXT2, transition: "all 0.12s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recherche */}
          <div style={{ padding: "0 16px 8px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", pointerEvents: "none" }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans mes favoris…" style={{ width: "100%", padding: "8px 36px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>

          {/* Filtre hashtags */}
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: "5px", padding: "0 16px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
              <button onClick={() => setTagFilter(null)} style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: !tagFilter ? 700 : 400, cursor: "pointer", border: `1px solid ${!tagFilter ? GOLD : BORDER}`, background: !tagFilter ? `${GOLD}20` : "transparent", color: !tagFilter ? GOLD : TEXT2, flexShrink: 0, transition: "all 0.12s" }}>
                Tous
              </button>
              {allTags.map(t => (
                <button key={t} onClick={() => setTagFilter(tagFilter === t ? null : t)} style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: tagFilter === t ? 700 : 400, cursor: "pointer", border: `1px solid ${tagFilter === t ? RED : BORDER}`, background: tagFilter === t ? `${RED}20` : "transparent", color: tagFilter === t ? RED : TEXT2, flexShrink: 0, transition: "all 0.12s" }}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chargement */}
        {loading && <Skeleton />}

        {/* Vide */}
        {!loading && favoris.length === 0 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "70px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "44px" }}>🔖</span>
            <p style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: 0 }}>Aucun favori</p>
            <p style={{ color: TEXT2, fontSize: "14px", margin: 0, maxWidth: "240px", lineHeight: 1.6 }}>
              Appuie sur 🔖 sur un graft pour le retrouver ici.
            </p>
            <Link href="/dashboard" style={{ marginTop: "4px", padding: "9px 20px", background: RED, color: "#fff", borderRadius: "100px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}>
              Aller au fil
            </Link>
          </div>
        )}

        {/* Aucun résultat filtré */}
        {!loading && favoris.length > 0 && filtered.length === 0 && (
          <div style={{ padding: "50px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "32px" }}>🔎</span>
            <p style={{ color: TEXT2, fontSize: "14px", marginTop: "12px" }}>
              {search ? `Aucun favori pour "${search}"` : `Aucun favori avec ${tagFilter}`}
            </p>
            <button onClick={() => { setSearch(""); setTagFilter(null); }} style={{ color: RED, background: "none", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginTop: "4px" }}>
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Liste */}
        {!loading && filtered.length > 0 && (
          <div>
            <div style={{ padding: "8px 16px 4px" }}>
              <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {filtered.length} favori{filtered.length > 1 ? "s" : ""}
                {(search || tagFilter) && ` · filtré${filtered.length > 1 ? "s" : ""}`}
              </span>
            </div>
            {filtered.map(f => (
              <FavoriCard key={f.id} favori={f} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
