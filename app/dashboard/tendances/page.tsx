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

type Trend  = { tag: string; count: number; authors: Set<string> };
type Graft  = { id: string; content: string; created_at: string; author_name: string };
type Period = "24h" | "7j" | "30j" | "tout";

const PERIOD_LABELS: Record<Period, string> = { "24h": "24h", "7j": "7 jours", "30j": "30 jours", "tout": "Tout" };

function periodToDate(p: Period): string | null {
  if (p === "tout") return null;
  const ms = { "24h": 864e5, "7j": 6048e5, "30j": 2592e6 }[p];
  return new Date(Date.now() - ms).toISOString();
}

function avatarGrad(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${h},65%,22%) 0%,hsl(${(h+40)%360},72%,32%) 100%)`;
}

function fmtCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

// ── TrendRow ──────────────────────────────────────────────────────────────────

function TrendRow({
  trend, rank, max, selected, onSelect, grafts, loadingGrafts,
}: {
  trend: Trend; rank: number; max: number; selected: boolean;
  onSelect: () => void; grafts: Graft[]; loadingGrafts: boolean;
}) {
  const pct        = Math.round((trend.count / max) * 100);
  const rankColor  = rank === 0 ? GOLD : rank === 1 ? "#A0A0A0" : rank === 2 ? "#A0522D" : TEXT2;
  const rankLabel  = rank < 3 ? ["🥇","🥈","🥉"][rank] : `#${rank+1}`;

  return (
    <div>
      <div
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: `1px solid ${selected ? RED+"20" : BORDER}`, background: selected ? `${RED}07` : "transparent", cursor: "pointer", transition: "background 0.12s" }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#080808"; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
      >
        {/* Rang */}
        <div style={{ width: "30px", textAlign: "center", flexShrink: 0 }}>
          <span style={{ color: rankColor, fontSize: "13px", fontWeight: 800 }}>{rankLabel}</span>
        </div>

        {/* Tag + barre + auteurs */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "5px" }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: selected ? RED : TEXT, letterSpacing: "-0.2px", transition: "color 0.15s" }}>{trend.tag}</span>
            <span style={{ fontSize: "11px", color: TEXT2 }}>{trend.authors.size} Grafter{trend.authors.size > 1 ? "s" : ""}</span>
          </div>
          <div style={{ height: "3px", borderRadius: "2px", background: "#111", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: selected ? RED : "#333", borderRadius: "2px", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.2s" }} />
          </div>
        </div>

        {/* Compteur + chevron */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: selected ? RED : TEXT2, fontSize: "13px", fontWeight: selected ? 700 : 400, transition: "color 0.15s" }}>
            {fmtCount(trend.count)} graft{trend.count > 1 ? "s" : ""}
          </span>
          <span style={{ color: TEXT2, fontSize: "14px", transform: selected ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </div>
      </div>

      {/* Grafts dépliés */}
      {selected && (
        <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
          {loadingGrafts ? (
            <div style={{ padding: "20px", color: TEXT2, fontSize: "13px" }}>Chargement…</div>
          ) : grafts.length === 0 ? (
            <div style={{ padding: "20px", color: TEXT2, fontSize: "13px" }}>Aucun graft trouvé.</div>
          ) : grafts.map((g, i) => (
            <div key={g.id} style={{ padding: "12px 16px 12px 58px", borderBottom: i < grafts.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px", flexWrap: "wrap" }}>
                <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: avatarGrad(g.author_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {g.author_name[0].toUpperCase()}
                  </div>
                  <span style={{ color: RED, fontSize: "12px", fontWeight: 700 }}>@{g.author_name}</span>
                </Link>
                <span style={{ color: TEXT2, fontSize: "11px" }}>· {new Date(g.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
              </div>
              <p style={{ margin: 0, color: TEXT, fontSize: "13px", lineHeight: 1.55 }}>
                {g.content.split(new RegExp(`(${trend.tag})`, "gi")).map((part, idx) =>
                  part.toLowerCase() === trend.tag
                    ? <mark key={idx} style={{ background: `${RED}25`, color: RED, borderRadius: "3px", padding: "0 2px" }}>{part}</mark>
                    : part
                )}
              </p>
            </div>
          ))}
          {grafts.length >= 10 && (
            <div style={{ padding: "10px 16px", textAlign: "center" }}>
              <span style={{ color: TEXT2, fontSize: "12px" }}>Affichage des 10 premiers grafts</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── TopGrafters ───────────────────────────────────────────────────────────────

function TopGrafters({ grafts }: { grafts: { author_name: string }[] }) {
  const counts: Record<string, number> = {};
  for (const g of grafts) counts[g.author_name] = (counts[g.author_name] ?? 0) + 1;
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!top.length) return null;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden", marginBottom: "16px" }}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, fontSize: "12px", fontWeight: 800, color: TEXT2, letterSpacing: "1px", textTransform: "uppercase" }}>
        🏆 Top Grafters actifs
      </div>
      {top.map(([name, count], i) => (
        <Link key={name} href={`/dashboard/profil/${name.toLowerCase()}`} style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: i < top.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ color: i === 0 ? GOLD : TEXT2, fontSize: "12px", fontWeight: 700, width: "20px" }}>{i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}</span>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: avatarGrad(name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {name[0].toUpperCase()}
            </div>
            <span style={{ flex: 1, color: TEXT, fontSize: "13px", fontWeight: 600 }}>@{name}</span>
            <span style={{ color: TEXT2, fontSize: "12px" }}>{count} hashtag{count > 1 ? "s" : ""}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TendancesPage() {
  const [period,       setPeriod]       = useState<Period>("7j");
  const [trends,       setTrends]       = useState<Trend[]>([]);
  const [allGrafts,    setAllGrafts]    = useState<{ author_name: string }[]>([]);
  const [selected,     setSelected]     = useState<string | null>(null);
  const [grafts,       setGrafts]       = useState<Graft[]>([]);
  const [loadingT,     setLoadingT]     = useState(true);
  const [loadingG,     setLoadingG]     = useState(false);
  const [search,       setSearch]       = useState("");
  const [view,         setView]         = useState<"tendances" | "grafters">("tendances");

  const fetchTrends = useCallback(async () => {
    setLoadingT(true);
    setSelected(null);
    setGrafts([]);
    const supabase = createClient();
    const since = periodToDate(period);
    let q = supabase.from("grafts").select("content, author_name").limit(1000);
    if (since) q = q.gte("created_at", since);
    const { data } = await q;
    if (!data) { setLoadingT(false); return; }

    setAllGrafts(data);

    const counts: Record<string, { count: number; authors: Set<string> }> = {};
    for (const { content, author_name } of data) {
      const tags = content?.match(/#[\wÀ-ÿ]+/g) ?? [];
      for (const t of tags) {
        const tag = t.toLowerCase();
        if (!counts[tag]) counts[tag] = { count: 0, authors: new Set() };
        counts[tag].count++;
        counts[tag].authors.add(author_name);
      }
    }

    const sorted = Object.entries(counts)
      .map(([tag, { count, authors }]) => ({ tag, count, authors }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    setTrends(sorted);
    setLoadingT(false);
  }, [period]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const loadGrafts = async (tag: string) => {
    if (selected === tag) { setSelected(null); setGrafts([]); return; }
    setSelected(tag);
    setLoadingG(true);
    const supabase = createClient();
    const since = periodToDate(period);
    let q = supabase.from("grafts").select("id,content,created_at,author_name").ilike("content", `%${tag}%`).order("created_at", { ascending: false }).limit(10);
    if (since) q = q.gte("created_at", since);
    const { data } = await q;
    setGrafts((data ?? []) as Graft[]);
    setLoadingG(false);
  };

  const filtered = trends.filter(t => !search || t.tag.includes(search.toLowerCase()));
  const max = filtered[0]?.count || 1;

  const totalGrafts   = allGrafts.length;
  const totalHashtags = trends.length;
  const totalAuthors  = new Set(trends.flatMap(t => [...t.authors])).size;

  return (
    <>
      <style>{`* { box-sizing: border-box; } @keyframes pulse-icon { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 3px 14px ${RED}55`, flexShrink: 0 }}>🔥</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Tendances</h1>
              <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>Ce dont parlent les Grafters</p>
            </div>
          </div>

          {/* Filtres période */}
          <div style={{ display: "flex", gap: "0", padding: "0 16px", borderBottom: `1px solid ${BORDER}` }}>
            {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", borderBottom: `2px solid ${period === p ? RED : "transparent"}`, color: period === p ? TEXT : TEXT2, fontSize: "13px", fontWeight: period === p ? 700 : 400, cursor: "pointer", transition: "all 0.12s" }}>
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Onglets vue */}
          <div style={{ display: "flex", gap: "6px", padding: "8px 16px" }}>
            {([["tendances", "🔥 Hashtags"], ["grafters", "🏆 Grafters"]] as [typeof view, string][]).map(([v, label]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${view === v ? RED : BORDER}`, background: view === v ? RED : "transparent", color: view === v ? "#fff" : TEXT2, transition: "all 0.12s" }}>
                {label}
              </button>
            ))}
            {view === "tendances" && (
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", pointerEvents: "none" }}>🔎</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer…" style={{ width: "100%", padding: "6px 10px 6px 30px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "12px", outline: "none", fontFamily: "inherit" }} />
              </div>
            )}
          </div>

          {/* Stats */}
          {!loadingT && (
            <div style={{ display: "flex", borderTop: `1px solid ${BORDER}` }}>
              {[
                { label: "Grafts", value: fmtCount(totalGrafts) },
                { label: "Hashtags", value: totalHashtags },
                { label: "Grafters", value: totalAuthors },
              ].map(({ label, value }) => (
                <div key={label} style={{ flex: 1, padding: "8px 0", textAlign: "center" }}>
                  <div style={{ color: TEXT, fontWeight: 700, fontSize: "14px" }}>{value}</div>
                  <div style={{ color: TEXT2, fontSize: "10px" }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chargement */}
        {loadingT && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px", animation: "pulse-icon 1.2s ease-in-out infinite" }}>📊</div>
            <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Calcul des tendances…</p>
          </div>
        )}

        {/* Aucun hashtag */}
        {!loadingT && trends.length === 0 && (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <span style={{ fontSize: "40px" }}>🏷️</span>
            <p style={{ color: TEXT2, fontSize: "14px", marginTop: "12px" }}>Aucun hashtag dans les grafts sur cette période.</p>
          </div>
        )}

        {/* Vue Grafters */}
        {!loadingT && view === "grafters" && allGrafts.length > 0 && (
          <div style={{ padding: "12px 16px" }}>
            <TopGrafters grafts={allGrafts} />
          </div>
        )}

        {/* Vue Tendances */}
        {!loadingT && view === "tendances" && (
          <>
            {filtered.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <p style={{ color: TEXT2, fontSize: "14px" }}>Aucun hashtag pour "{search}"</p>
                <button onClick={() => setSearch("")} style={{ color: RED, background: "none", border: "none", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Effacer</button>
              </div>
            ) : (
              filtered.map((t, i) => (
                <TrendRow
                  key={t.tag} trend={t} rank={i} max={max}
                  selected={selected === t.tag}
                  onSelect={() => loadGrafts(t.tag)}
                  grafts={grafts} loadingGrafts={loadingG}
                />
              ))
            )}
          </>
        )}
      </div>
    </>
  );
}
