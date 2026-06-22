"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import BadgeVerifie from "@/components/BadgeVerifie";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#2A2A2A";
const GREEN  = "#2ECC71";
const BLUE   = "#1D9BF0";

type Period = "24h" | "7j" | "30j";

const PERIOD_MS: Record<Period, number> = {
  "24h": 864e5,
  "7j":  6048e5,
  "30j": 2592e6,
};

const CAT_KEYWORDS: Record<string, string[]> = {
  Politique:    ["politique","macron","assemblée","gouvernement","sénat","élection","vote","réforme","parlement","premier ministre"],
  Sport:        ["sport","football","ligue1","psg","équipe de france","rugby","tennis","jeux","athletisme","nba"],
  Culture:      ["culture","cinéma","musique","art","livre","festival","théâtre","expo","cannes","césar"],
  Économie:     ["économie","inflation","budget","emploi","salaire","impôt","croissance","entreprise","retraite","smic"],
  Environnement:["climat","écologie","environnement","co2","nucléaire","énergie","biodiversité","pollution","forêt"],
  International:["international","europe","usa","guerre","ukraine","israel","onu","otan","afrique","chine"],
};

type HashTag  = { tag: string; count: number; authors: number };
type GraftRow = { id: string; content: string; author_name: string; created_at: string };
type Grafter  = { id: string; username: string; display_name: string | null; verified?: boolean; total_followers: number; total_grafts: number };

function periodSince(p: Period): string {
  return new Date(Date.now() - PERIOD_MS[p]).toISOString();
}

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

function fmtRel(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)   return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}min`;
  if (s < 86400)return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
}

function avatarGrad(name: string): string {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${h},65%,18%) 0%,hsl(${(h+45)%360},70%,32%) 100%)`;
}

// ── Pulse line animation ──────────────────────────────────────────────────────

function PulseLine({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "14px" }}>
      {[6, 10, 8, 14, 9, 12, 7, 11].map((h, i) => (
        <div key={i} style={{
          width: "3px", borderRadius: "2px", background: RED,
          height: `${h}px`,
          animation: active ? `pulse-bar${(i % 4) + 1} ${0.6 + i * 0.07}s ease-in-out infinite alternate` : "none",
          opacity: active ? 1 : 0.25,
          transition: "opacity 0.3s",
        }} />
      ))}
    </div>
  );
}

// ── Section shell ─────────────────────────────────────────────────────────────

function Section({ title, icon, action, children }: {
  title: string; icon: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", marginBottom: "14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span style={{ fontSize: "16px" }}>{icon}</span>
          <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800 }}>{title}</span>
        </div>
        {action && (
          <Link href={action.href} style={{ color: RED, fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>
            {action.label} →
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// ── HashtagRow ────────────────────────────────────────────────────────────────

function HashtagRow({ tag, count, authors, rank, max, selected, onClick }: {
  tag: string; count: number; authors: number; rank: number; max: number;
  selected: boolean; onClick: () => void;
}) {
  const pct = Math.max(Math.round((count / max) * 100), count > 0 ? 6 : 2);
  const medal = rank < 3 ? ["🥇", "🥈", "🥉"][rank] : null;

  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 16px", cursor: "pointer", background: selected ? `${RED}07` : "transparent", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#080808"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = selected ? `${RED}07` : "transparent"; }}
    >
      <span style={{ fontSize: rank < 3 ? "15px" : "11px", fontWeight: 800, width: "24px", textAlign: "center", flexShrink: 0, color: rank < 3 ? GOLD : TEXT2 }}>
        {medal ?? `#${rank + 1}`}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: selected ? RED : TEXT, fontSize: "14px", fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.1px", transition: "color 0.12s" }}>{tag}</p>
        <div style={{ height: "3px", borderRadius: "2px", background: "#111", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: selected ? RED : "#333", borderRadius: "2px", transition: "width 0.5s ease, background 0.2s" }} />
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ color: selected ? RED : TEXT, fontSize: "13px", fontWeight: 700, margin: "0 0 1px", transition: "color 0.12s" }}>{fmtN(count)}</p>
        <p style={{ color: TEXT2, fontSize: "10px", margin: 0 }}>{authors} auteur{authors > 1 ? "s" : ""}</p>
      </div>
    </div>
  );
}

// ── GraftCard ─────────────────────────────────────────────────────────────────

function GraftCard({ graft }: { graft: GraftRow }) {
  return (
    <div style={{ padding: "13px 16px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: avatarGrad(graft.author_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
          {graft.author_name[0]?.toUpperCase()}
        </div>
        <Link href={`/dashboard/profil/${graft.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
          <span style={{ color: TEXT, fontSize: "13px", fontWeight: 700 }}>@{graft.author_name}</span>
        </Link>
        <span style={{ color: TEXT2, fontSize: "11px", marginLeft: "auto" }}>{fmtRel(graft.created_at)}</span>
      </div>
      <p style={{ color: TEXT, fontSize: "14px", lineHeight: 1.55, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
        {graft.content.split(/(#[\wÀ-ÿ]+)/g).map((part, i) =>
          part.startsWith("#")
            ? <span key={i} style={{ color: BLUE, fontWeight: 600 }}>{part}</span>
            : part
        )}
      </p>
    </div>
  );
}

// ── CatCard ───────────────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  Politique:     RED,
  Sport:         "#E67E22",
  Culture:       "#9B59B6",
  Économie:      GREEN,
  Environnement: "#27AE60",
  International: BLUE,
};

function CatCard({ cat, topTag, count }: { cat: string; topTag: string | null; count: number }) {
  const col = CAT_COLORS[cat] || GOLD;
  return (
    <div style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "13px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: col, flexShrink: 0 }} />
        <span style={{ color: col, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px" }}>{cat}</span>
      </div>
      {topTag ? (
        <>
          <p style={{ color: TEXT, fontSize: "14px", fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.1px" }}>{topTag}</p>
          <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>{fmtN(count)} graft{count > 1 ? "s" : ""}</p>
        </>
      ) : (
        <p style={{ color: TEXT2, fontSize: "12px", margin: 0, fontStyle: "italic" }}>Aucune tendance</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TendancesPage() {
  const [period,      setPeriod]      = useState<Period>("24h");
  const [hashtags,    setHashtags]    = useState<HashTag[]>([]);
  const [grafts,      setGrafts]      = useState<GraftRow[]>([]);
  const [grafters,    setGrafters]    = useState<Grafter[]>([]);
  const [totalGrafts, setTotalGrafts] = useState(0);
  const [loadingH,    setLoadingH]    = useState(true);
  const [loadingG,    setLoadingG]    = useState(true);
  const [loadingU,    setLoadingU]    = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagGrafts,   setTagGrafts]   = useState<GraftRow[]>([]);
  const [loadingTag,  setLoadingTag]  = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [tick,        setTick]        = useState(0);

  // Animate pulse every 30s
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Fetch hashtags + recent grafts
  const fetchData = useCallback(async () => {
    setLoadingH(true); setLoadingG(true);
    setSelectedTag(null); setTagGrafts([]);
    const sb    = createClient();
    const since = periodSince(period);

    // Hashtags extracted from grafts content
    const { data: raw } = await sb.from("grafts")
      .select("content, author_name")
      .gte("created_at", since)
      .limit(2000);

    if (raw) {
      const counts: Record<string, { count: number; authors: Set<string> }> = {};
      for (const { content, author_name } of raw) {
        for (const t of (content?.match(/#[\wÀ-ÿ]+/g) ?? [])) {
          const tag = t.toLowerCase();
          if (!counts[tag]) counts[tag] = { count: 0, authors: new Set() };
          counts[tag].count++;
          counts[tag].authors.add(author_name);
        }
      }
      const sorted = Object.entries(counts)
        .map(([tag, { count, authors }]) => ({ tag, count, authors: authors.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 30);
      setHashtags(sorted);
      setTotalGrafts(raw.length);
    }
    setLoadingH(false);

    // Recent grafts (no replies) for "Grafts viraux"
    const { data: gData } = await sb.from("grafts")
      .select("id, content, author_name, created_at")
      .gte("created_at", since)
      .is("parent_id", null)
      .order("created_at", { ascending: false })
      .limit(8);
    setGrafts((gData ?? []) as GraftRow[]);
    setLoadingG(false);
  }, [period]);

  // Fetch top grafters once
  useEffect(() => {
    const sb = createClient();
    sb.from("stats_grafters")
      .select("id, username, display_name, verified, total_followers, total_grafts")
      .order("total_followers", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setGrafters((data ?? []) as Grafter[]);
        setLoadingU(false);
      });
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load grafts for selected hashtag
  const selectTag = async (tag: string) => {
    if (selectedTag === tag) { setSelectedTag(null); setTagGrafts([]); return; }
    setSelectedTag(tag); setLoadingTag(true);
    const sb    = createClient();
    const since = periodSince(period);
    const { data } = await sb.from("grafts")
      .select("id, content, author_name, created_at")
      .ilike("content", `%${tag}%`)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5);
    setTagGrafts((data ?? []) as GraftRow[]);
    setLoadingTag(false);
  };

  // Map hashtags to categories
  const catMap: Record<string, { topTag: string | null; count: number }> = {};
  for (const cat of Object.keys(CAT_KEYWORDS)) {
    const keywords = CAT_KEYWORDS[cat];
    const match = hashtags.find(h => keywords.some(kw => h.tag.includes(kw)));
    catMap[cat] = match ? { topTag: match.tag, count: match.count } : { topTag: null, count: 0 };
  }

  const visibleTags = showAllTags ? hashtags : hashtags.slice(0, 10);
  const maxCount    = hashtags[0]?.count || 1;
  const isLoading   = loadingH;

  const PERIOD_LABELS: Record<Period, string> = { "24h": "24 heures", "7j": "7 jours", "30j": "30 jours" };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes pulse-bar1 { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
        @keyframes pulse-bar2 { from{transform:scaleY(0.6)} to{transform:scaleY(0.2)} }
        @keyframes pulse-bar3 { from{transform:scaleY(0.2)} to{transform:scaleY(0.85)} }
        @keyframes pulse-bar4 { from{transform:scaleY(0.8)} to{transform:scaleY(0.15)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .tend-tag-row { animation: fadeIn 0.2s ease both; }
      `}</style>

      <div style={{ maxWidth: "640px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter', system-ui, sans-serif", color: TEXT }}>

        {/* ── Sticky header ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(14px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", boxShadow: `0 2px 14px ${RED}55`, flexShrink: 0 }}>🔥</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: "0 0 1px", letterSpacing: "-0.3px" }}>Tendances</h1>
              <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>Le pouls de STENOGRAFT en temps réel</p>
            </div>
            <PulseLine active={!isLoading} />
          </div>

          {/* Period tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
            {(["24h", "7j", "30j"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: `2px solid ${period === p ? RED : "transparent"}`, color: period === p ? TEXT : TEXT2, fontSize: "13px", fontWeight: period === p ? 700 : 400, cursor: "pointer", transition: "all 0.12s" }}>
                {p === "24h" ? "Aujourd'hui" : p === "7j" ? "Cette semaine" : "Ce mois"}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px" }}>

          {/* ── Pulse banner ── */}
          <div style={{ background: `linear-gradient(135deg,#0d0000 0%,#1c0606 50%,#080000 100%)`, border: `1px solid ${RED}20`, borderRadius: "16px", padding: "16px 18px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: RED, display: "inline-block", animation: "pulse-bar1 1.1s ease-in-out infinite alternate" }} />
                <span style={{ color: RED, fontSize: "10px", fontWeight: 800, letterSpacing: "1px" }}>EN DIRECT</span>
              </div>
              {isLoading ? (
                <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Calcul du pouls…</p>
              ) : (
                <>
                  <p style={{ color: TEXT, fontSize: "16px", fontWeight: 900, margin: "0 0 3px", letterSpacing: "-0.3px" }}>
                    {fmtN(totalGrafts)} graft{totalGrafts > 1 ? "s" : ""}
                  </p>
                  <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>
                    publiés ces dernières <span style={{ color: TEXT, fontWeight: 600 }}>{PERIOD_LABELS[period]}</span>
                    {hashtags.length > 0 && ` · ${hashtags.length} hashtag${hashtags.length > 1 ? "s" : ""} actif${hashtags.length > 1 ? "s" : ""}`}
                  </p>
                </>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" }}>
              <PulseLine active={!isLoading} />
            </div>
          </div>

          {/* ── Hashtags du moment ── */}
          <Section title="Hashtags du moment" icon="🏷️" action={{ label: "Tout voir", href: "/dashboard/explorer" }}>
            {isLoading ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Analyse des grafts en cours…</p>
              </div>
            ) : hashtags.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <span style={{ fontSize: "36px" }}>🏷️</span>
                <p style={{ color: TEXT2, fontSize: "13px", margin: "10px 0 0" }}>Aucun hashtag sur cette période.</p>
              </div>
            ) : (
              <>
                {visibleTags.map((h, i) => (
                  <div key={h.tag} className="tend-tag-row" style={{ animationDelay: `${i * 30}ms` }}>
                    <HashtagRow
                      tag={h.tag} count={h.count} authors={h.authors}
                      rank={i} max={maxCount}
                      selected={selectedTag === h.tag}
                      onClick={() => selectTag(h.tag)}
                    />
                    {selectedTag === h.tag && (
                      <div style={{ background: "#050505", borderBottom: `1px solid ${BORDER}` }}>
                        {loadingTag ? (
                          <p style={{ color: TEXT2, fontSize: "12px", padding: "14px 16px 14px 52px", margin: 0 }}>Chargement…</p>
                        ) : tagGrafts.length === 0 ? (
                          <p style={{ color: TEXT2, fontSize: "12px", padding: "14px 16px 14px 52px", margin: 0 }}>Aucun graft trouvé.</p>
                        ) : tagGrafts.map((g, gi) => (
                          <div key={g.id} style={{ padding: "11px 16px 11px 52px", borderBottom: gi < tagGrafts.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
                              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: avatarGrad(g.author_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{g.author_name[0]?.toUpperCase()}</div>
                              <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
                                <span style={{ color: RED, fontSize: "12px", fontWeight: 700 }}>@{g.author_name}</span>
                              </Link>
                              <span style={{ color: TEXT2, fontSize: "10px", marginLeft: "auto" }}>{fmtRel(g.created_at)}</span>
                            </div>
                            <p style={{ margin: 0, color: TEXT, fontSize: "13px", lineHeight: 1.5 }}>
                              {g.content.split(new RegExp(`(${selectedTag})`, "gi")).map((part, pi) =>
                                part.toLowerCase() === selectedTag
                                  ? <mark key={pi} style={{ background: `${RED}22`, color: RED, borderRadius: "3px", padding: "0 2px" }}>{part}</mark>
                                  : part
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {hashtags.length > 10 && (
                  <button onClick={() => setShowAllTags(v => !v)} style={{ display: "block", width: "100%", padding: "12px 16px", background: "transparent", border: "none", borderTop: `1px solid ${BORDER}`, color: RED, fontSize: "13px", fontWeight: 700, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#080808")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {showAllTags ? "Réduire ↑" : `Voir les ${hashtags.length - 10} autres hashtags ↓`}
                  </button>
                )}
              </>
            )}
          </Section>

          {/* ── Par catégorie ── */}
          <Section title="Par catégorie" icon="📂">
            {isLoading ? (
              <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} style={{ height: "70px", background: BG, borderRadius: "10px", border: `1px solid ${BORDER}` }} />
                ))}
              </div>
            ) : (
              <div style={{ padding: "12px", display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "8px" }}>
                {Object.keys(CAT_KEYWORDS).map(cat => (
                  <CatCard key={cat} cat={cat} topTag={catMap[cat]?.topTag ?? null} count={catMap[cat]?.count ?? 0} />
                ))}
              </div>
            )}
          </Section>

          {/* ── Grafts du moment ── */}
          <Section title="Grafts du moment" icon="⚡" action={{ label: "Explorer", href: "/dashboard/explorer" }}>
            {loadingG ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Chargement…</p>
              </div>
            ) : grafts.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <span style={{ fontSize: "36px" }}>⚡</span>
                <p style={{ color: TEXT2, fontSize: "13px", margin: "10px 0 0" }}>Aucun graft sur cette période.</p>
              </div>
            ) : grafts.map(g => <GraftCard key={g.id} graft={g} />)}
          </Section>

          {/* ── Comptes en vue ── */}
          <Section title="Comptes en vue" icon="👥" action={{ label: "Top Grafters", href: "/dashboard/explorer" }}>
            {loadingU ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Chargement…</p>
              </div>
            ) : grafters.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <span style={{ fontSize: "36px" }}>👥</span>
                <p style={{ color: TEXT2, fontSize: "13px", margin: "10px 0 0" }}>Aucun compte pour le moment.</p>
              </div>
            ) : grafters.map((g, i) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: i < grafters.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                <span style={{ fontSize: i < 3 ? "14px" : "11px", fontWeight: 800, width: "22px", textAlign: "center", flexShrink: 0, color: i < 3 ? GOLD : TEXT2 }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                </span>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarGrad(g.username), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                  {(g.display_name || g.username || "?").slice(0,2).toUpperCase()}
                </div>
                <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: "none", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ color: TEXT, fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.display_name || g.username}</span>
                    <BadgeVerifie verified={g.verified} />
                  </div>
                  <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>
                    {fmtN(g.total_followers)} abonné{g.total_followers > 1 ? "s" : ""} · {fmtN(g.total_grafts)} graft{g.total_grafts > 1 ? "s" : ""}
                  </p>
                </Link>
                <FollowButton targetUserId={g.id} />
              </div>
            ))}
          </Section>

        </div>
      </div>
    </>
  );
}
