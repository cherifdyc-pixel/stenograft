"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import BadgeVerifie from "@/components/BadgeVerifie";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

const HISTORY_KEY = "steno_search_history";
const MAX_HISTORY = 8;

type Tab      = "grafters" | "grafts" | "hashtags";
type Grafter  = { id: string; username: string; display_name: string | null; bio: string | null; verified?: boolean | null };
type Graft    = { id: string; content: string; created_at: string; author_name: string; image_url: string | null; video_url: string | null };
type HashTag  = { tag: string; count: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarGrad(name: string) {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: `${RED}30`, color: RED, borderRadius: "3px", padding: "0 1px" }}>{p}</mark>
          : p
      )}
    </>
  );
}

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── GrafterCard ───────────────────────────────────────────────────────────────

function GrafterCard({ g, query, isMobile }: { g: Grafter; query: string; isMobile: boolean }) {
  const avatarSize = isMobile ? "38px" : "46px";
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: isMobile ? "10px" : "12px", padding: isMobile ? "10px 12px" : "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#070707")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: avatarGrad(g.username), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: isMobile ? "13px" : "16px", fontWeight: 800, border: `2px solid ${BORDER}` }}>
          {(g.display_name || g.username)[0].toUpperCase()}
        </div>
      </Link>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
            <span style={{ color: TEXT, fontWeight: 700, fontSize: isMobile ? "13px" : "14px" }}>{highlight(g.display_name || g.username, query)}</span>
            <BadgeVerifie verified={g.verified} />
          </div>
          <div style={{ color: TEXT2, fontSize: isMobile ? "11px" : "12px", marginTop: "1px" }}>@{highlight(g.username, query)}</div>
          {g.bio && (
            <div style={{ color: TEXT2, fontSize: isMobile ? "11px" : "12px", marginTop: "3px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: isMobile ? 1 : 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{g.bio}</div>
          )}
        </Link>
      </div>
      <div style={{ flexShrink: 0 }}>
        <FollowButton targetUserId={g.id} />
      </div>
    </div>
  );
}

// ── GraftCard ─────────────────────────────────────────────────────────────────

function GraftCard({ g, query, isMobile }: { g: Graft; query: string; isMobile: boolean }) {
  return (
    <div style={{ padding: isMobile ? "10px 12px" : "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#070707")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px" }}>
        <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: avatarGrad(g.author_name), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "8px", fontWeight: 800, flexShrink: 0 }}>
            {g.author_name[0].toUpperCase()}
          </div>
          <span style={{ color: RED, fontSize: isMobile ? "12px" : "13px", fontWeight: 700 }}>@{g.author_name}</span>
        </Link>
        <span style={{ color: TEXT3, fontSize: "11px" }}>· {relativeTime(g.created_at)}</span>
      </div>
      <p style={{ color: TEXT, fontSize: isMobile ? "13px" : "14px", lineHeight: 1.6, margin: 0, wordBreak: "break-word" }}>
        {highlight(g.content, query)}
      </p>
      {g.image_url && !g.video_url && (
        <img src={g.image_url} alt="" style={{ width: "100%", borderRadius: "10px", marginTop: "8px", maxHeight: "260px", objectFit: "cover", display: "block", border: `1px solid ${BORDER}` }} />
      )}
    </div>
  );
}

// ── HashtagCard ───────────────────────────────────────────────────────────────

function HashtagCard({ tag, count, query, isMobile }: { tag: string; count: number; query: string; isMobile: boolean }) {
  const iconSize = isMobile ? "32px" : "38px";
  return (
    <Link href="/dashboard/explorer" style={{ textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "10px 12px" : "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#070707")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "10px" }}>
        <div style={{ width: iconSize, height: iconSize, borderRadius: "50%", background: `${RED}15`, border: `1px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "13px" : "16px", flexShrink: 0 }}>#</div>
        <div>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: isMobile ? "13px" : "14px" }}>{highlight(tag, query)}</div>
          <div style={{ color: TEXT2, fontSize: "11px" }}>{count} graft{count > 1 ? "s" : ""}</div>
        </div>
      </div>
      <span style={{ color: TEXT2 }}>›</span>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ isMobile }: { isMobile: boolean }) {
  const avatarSize = isMobile ? "38px" : "46px";
  return (
    <div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ display: "flex", gap: isMobile ? "10px" : "12px", padding: isMobile ? "10px 12px" : "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: SURFACE, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "12px", width: "40%", background: SURFACE, borderRadius: "6px", marginBottom: "8px" }} />
            <div style={{ height: "10px", width: `${55 + i * 7}%`, background: "#0D0D0D", borderRadius: "6px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RecherchePage() {
  const [query,    setQuery]    = useState("");
  const [tab,      setTab]      = useState<Tab>("grafters");
  const [grafters, setGrafters] = useState<Grafter[]>([]);
  const [grafts,   setGrafts]   = useState<Graft[]>([]);
  const [hashtags, setHashtags] = useState<HashTag[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [history,  setHistory]  = useState<string[]>([]);
  const [focused,  setFocused]  = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    try { setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]")); } catch {}
  }, []);

  const saveHistory = (q: string) => {
    const next = [q, ...history.filter(h => h !== q)].slice(0, MAX_HISTORY);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const removeHistory = (q: string) => {
    const next = history.filter(h => h !== q);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const search = useCallback(async (q: string) => {
    const safe = q.trim().slice(0, 100);
    if (!safe) { setGrafters([]); setGrafts([]); setHashtags([]); setLoading(false); return; }
    setLoading(true);
    const supabase = createClient();

    const [{ data: byUsername }, { data: byDisplay }, { data: gr }] = await Promise.all([
      supabase.from("profiles").select("id,username,display_name,bio,verified").ilike("username", `%${safe}%`).limit(15),
      supabase.from("profiles").select("id,username,display_name,bio,verified").ilike("display_name", `%${safe}%`).limit(15),
      supabase.from("grafts").select("id,content,created_at,author_name,image_url,video_url").ilike("content", `%${safe}%`).order("created_at", { ascending: false }).limit(30),
    ]);
    const seen = new Set<string>();
    const g = [...(byUsername ?? []), ...(byDisplay ?? [])].filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; }).slice(0, 15);

    setGrafters((g ?? []) as Grafter[]);

    const grList = (gr ?? []) as Graft[];
    setGrafts(grList);

    const counts: Record<string, number> = {};
    for (const { content } of grList) {
      const tags = content?.match(/#[\wÀ-ÿ]+/g) ?? [];
      for (const t of tags) {
        const tag = t.toLowerCase();
        if (tag.includes(safe.toLowerCase().replace(/^#/, ""))) {
          counts[tag] = (counts[tag] ?? 0) + 1;
        }
      }
    }
    setHashtags(Object.entries(counts).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count).slice(0, 15));
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (query) search(query); }, 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleSubmit = (q: string) => {
    if (q.trim()) { saveHistory(q.trim()); search(q.trim()); }
  };

  const counts = { grafters: grafters.length, grafts: grafts.length, hashtags: hashtags.length };
  const showResults = !!query && !loading;

  return (
    <>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: isMobile ? "110px" : "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* ── Header sticky ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ padding: isMobile ? "8px 12px" : "12px 16px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: "12px", fontSize: isMobile ? "14px" : "16px", pointerEvents: "none", zIndex: 1 }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={e => e.key === "Enter" && handleSubmit(query)}
                placeholder="Grafter, graft, #hashtag…"
                autoFocus
                style={{ flex: 1, padding: isMobile ? "9px 36px 9px 36px" : "11px 40px 11px 42px", borderRadius: "100px", background: SURFACE, border: `1px solid ${focused ? RED + "60" : BORDER}`, color: TEXT, fontSize: isMobile ? "13px" : "14px", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s", width: "100%" }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setGrafters([]); setGrafts([]); setHashtags([]); inputRef.current?.focus(); }} style={{ position: "absolute", right: "12px", background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>

          {/* Onglets */}
          {query && (
            <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
              {([["grafters", "👤 Grafters"], ["grafts", "✍️ Grafts"], ["hashtags", "# Hashtags"]] as [Tab, string][]).map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: isMobile ? "8px 2px" : "10px 4px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? RED : "transparent"}`, color: tab === t ? TEXT : TEXT2, fontSize: isMobile ? "11px" : "12px", fontWeight: tab === t ? 700 : 400, cursor: "pointer", transition: "all 0.12s", position: "relative" }}>
                  {label}
                  {counts[t] > 0 && (
                    <span style={{ marginLeft: "3px", background: tab === t ? RED : SURFACE, color: tab === t ? "#fff" : TEXT2, borderRadius: "100px", padding: "1px 4px", fontSize: "9px", fontWeight: 700 }}>{counts[t]}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Historique + Suggestions ── */}
        {!query && (
          <div style={{ padding: "10px 0" }}>
            {history.length > 0 && (
              <div>
                <div style={{ padding: isMobile ? "6px 12px" : "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recherches récentes</span>
                  <button onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }} style={{ background: "none", border: "none", color: TEXT2, fontSize: "12px", cursor: "pointer" }}>Tout effacer</button>
                </div>
                {history.map(h => (
                  <div key={h} style={{ display: "flex", alignItems: "center", gap: "10px", padding: isMobile ? "9px 12px" : "11px 16px", cursor: "pointer", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#080808")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <span style={{ fontSize: "13px", color: TEXT2 }}>🕐</span>
                    <span onClick={() => { setQuery(h); search(h); }} style={{ flex: 1, color: TEXT, fontSize: isMobile ? "13px" : "14px" }}>{h}</span>
                    <button onClick={e => { e.stopPropagation(); removeHistory(h); }} style={{ background: "none", border: "none", color: TEXT2, fontSize: "16px", cursor: "pointer", padding: "0 4px" }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions rapides */}
            <div style={{ padding: isMobile ? "12px 12px 6px" : "16px 16px 8px" }}>
              <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Explorer</span>
            </div>
            {[
              { icon: "🔥", label: "Tendances & Top Grafters", href: "/dashboard/explorer",   desc: "Ce dont parlent les Grafters" },
              { icon: "🏘️", label: "Communautés",             href: "/dashboard/communautes", desc: "Rejoins des espaces thématiques" },
              { icon: "🗺️", label: "Territoires",             href: "/dashboard/territoires", desc: "Actualités par région" },
              { icon: "📰", label: "L'Actu",                  href: "/dashboard/actualites",  desc: "Flux RSS et GDELT" },
            ].map(s => (
              <Link key={s.href} href={s.href} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: isMobile ? "10px" : "12px", padding: isMobile ? "10px 12px" : "13px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#080808")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ width: isMobile ? "34px" : "40px", height: isMobile ? "34px" : "40px", borderRadius: "12px", background: `${RED}15`, border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "15px" : "18px", flexShrink: 0 }}>{s.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: TEXT, fontSize: isMobile ? "13px" : "14px", fontWeight: 600 }}>{s.label}</div>
                  {!isMobile && <div style={{ color: TEXT2, fontSize: "12px" }}>{s.desc}</div>}
                </div>
                <span style={{ color: TEXT2, marginLeft: "auto" }}>›</span>
              </Link>
            ))}
          </div>
        )}

        {/* ── Chargement ── */}
        {loading && <Skeleton isMobile={isMobile} />}

        {/* ── Résultats : Grafters ── */}
        {showResults && tab === "grafters" && (
          grafters.length === 0 ? (
            <div style={{ padding: isMobile ? "40px 16px" : "60px 20px", textAlign: "center" }}>
              <span style={{ fontSize: isMobile ? "30px" : "36px" }}>👤</span>
              <p style={{ color: TEXT2, fontSize: isMobile ? "13px" : "14px", marginTop: "12px" }}>Aucun Grafter pour «&nbsp;{query}&nbsp;»</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: isMobile ? "6px 12px 3px" : "8px 16px 4px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{grafters.length} résultat{grafters.length > 1 ? "s" : ""}</span>
              </div>
              {grafters.map(g => <GrafterCard key={g.id} g={g} query={query} isMobile={isMobile} />)}
            </div>
          )
        )}

        {/* ── Résultats : Grafts ── */}
        {showResults && tab === "grafts" && (
          grafts.length === 0 ? (
            <div style={{ padding: isMobile ? "40px 16px" : "60px 20px", textAlign: "center" }}>
              <span style={{ fontSize: isMobile ? "30px" : "36px" }}>✍️</span>
              <p style={{ color: TEXT2, fontSize: isMobile ? "13px" : "14px", marginTop: "12px" }}>Aucun graft pour «&nbsp;{query}&nbsp;»</p>
            </div>
          ) : (
            <div>
              <div style={{ padding: isMobile ? "6px 12px 3px" : "8px 16px 4px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{grafts.length} résultat{grafts.length > 1 ? "s" : ""}</span>
              </div>
              {grafts.map(g => <GraftCard key={g.id} g={g} query={query} isMobile={isMobile} />)}
            </div>
          )
        )}

        {/* ── Résultats : Hashtags ── */}
        {showResults && tab === "hashtags" && (
          hashtags.length === 0 ? (
            <div style={{ padding: isMobile ? "40px 16px" : "60px 20px", textAlign: "center" }}>
              <span style={{ fontSize: isMobile ? "30px" : "36px" }}>#</span>
              <p style={{ color: TEXT2, fontSize: isMobile ? "13px" : "14px", marginTop: "12px" }}>Aucun hashtag pour «&nbsp;{query}&nbsp;»</p>
              <Link href="/dashboard/explorer" style={{ display: "inline-block", marginTop: "12px", color: RED, fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>Voir toutes les tendances →</Link>
            </div>
          ) : (
            <div>
              <div style={{ padding: isMobile ? "6px 12px 3px" : "8px 16px 4px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{hashtags.length} hashtag{hashtags.length > 1 ? "s" : ""}</span>
              </div>
              {hashtags.map(h => <HashtagCard key={h.tag} tag={h.tag} count={h.count} query={query} isMobile={isMobile} />)}
            </div>
          )
        )}
      </div>
    </>
  );
}
