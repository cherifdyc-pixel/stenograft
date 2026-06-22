"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import FollowButton from "@/components/FollowButton";
import BadgeVerifie from "@/components/BadgeVerifie";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

type Period = "24h" | "7j" | "30j" | "tout";
type Trend  = { tag: string; count: number; authors: Set<string> };
type Graft  = { id: string; content: string; created_at: string; author_name: string };

const PERIOD_LABELS: Record<Period, string> = { "24h": "24h", "7j": "7 jours", "30j": "30 jours", "tout": "Tout" };

function periodToDate(p: Period): string | null {
  if (p === "tout") return null;
  const ms = { "24h": 864e5, "7j": 6048e5, "30j": 2592e6 }[p];
  return new Date(Date.now() - ms).toISOString();
}

function avatarGrad(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${h},65%,22%) 0%,hsl(${(h + 40) % 360},72%,32%) 100%)`;
}

function fmtCount(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

// ── TrendRow ──────────────────────────────────────────────────────────────────

function TrendRow({
  trend, rank, max, selected, onSelect, grafts, loadingGrafts, isMobile,
}: {
  trend: Trend; rank: number; max: number; selected: boolean;
  onSelect: () => void; grafts: Graft[]; loadingGrafts: boolean;
  isMobile: boolean;
}) {
  const pct       = Math.round((trend.count / max) * 100);
  const rankLabel = rank < 3 ? ["🥇", "🥈", "🥉"][rank] : `#${rank + 1}`;

  return (
    <div>
      <div
        onClick={onSelect}
        style={{ display: "flex", alignItems: "center", gap: "10px", padding: isMobile ? "11px 12px" : "14px 16px", borderBottom: `1px solid ${selected ? RED + "20" : BORDER}`, background: selected ? `${RED}07` : "transparent", cursor: "pointer", transition: "background 0.12s" }}
        onMouseEnter={e => { if (!selected) e.currentTarget.style.background = "#080808"; }}
        onMouseLeave={e => { if (!selected) e.currentTarget.style.background = "transparent"; }}
      >
        <div style={{ width: "30px", textAlign: "center", flexShrink: 0 }}>
          <span style={{ color: rank === 0 ? GOLD : rank === 1 ? "#A0A0A0" : rank === 2 ? "#A0522D" : TEXT2, fontSize: "13px", fontWeight: 800 }}>{rankLabel}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "5px" }}>
            <span style={{ fontSize: "15px", fontWeight: 800, color: selected ? RED : TEXT, letterSpacing: "-0.2px", transition: "color 0.15s" }}>{trend.tag}</span>
            <span style={{ fontSize: "11px", color: TEXT2 }}>{trend.authors.size} Grafter{trend.authors.size > 1 ? "s" : ""}</span>
          </div>
          <div style={{ height: "3px", borderRadius: "2px", background: "#111", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: selected ? RED : "#333", borderRadius: "2px", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.2s" }} />
          </div>
        </div>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ color: selected ? RED : TEXT2, fontSize: "13px", fontWeight: selected ? 700 : 400, transition: "color 0.15s" }}>
            {fmtCount(trend.count)}{!isMobile && <> graft{trend.count > 1 ? "s" : ""}</>}
          </span>
          <span style={{ color: TEXT2, fontSize: "14px", display: "inline-block", transform: selected ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>›</span>
        </div>
      </div>

      {selected && (
        <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
          {loadingGrafts ? (
            <div style={{ padding: "20px", color: TEXT2, fontSize: "13px" }}>Chargement…</div>
          ) : grafts.length === 0 ? (
            <div style={{ padding: "20px", color: TEXT2, fontSize: "13px" }}>Aucun graft trouvé.</div>
          ) : grafts.map((g, i) => (
            <div key={g.id} style={{ padding: isMobile ? "10px 12px 10px 44px" : "12px 16px 12px 58px", borderBottom: i < grafts.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "5px", flexWrap: "wrap" }}>
                <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "5px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: avatarGrad(g.author_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {g.author_name[0]?.toUpperCase()}
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

// ── Tab Tendances ─────────────────────────────────────────────────────────────

function TendancesTab({ isMobile }: { isMobile: boolean }) {
  const [period,   setPeriod]   = useState<Period>("7j");
  const [trends,   setTrends]   = useState<Trend[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [grafts,   setGrafts]   = useState<Graft[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingG, setLoadingG] = useState(false);
  const [search,   setSearch]   = useState("");

  const totalGrafts   = trends.reduce((s, t) => s + t.count, 0);
  const totalHashtags = trends.length;
  const totalAuthors  = new Set(trends.flatMap(t => [...t.authors])).size;

  const fetchTrends = useCallback(async () => {
    setLoadingT(true); setSelected(null); setGrafts([]);
    const supabase = createClient();
    const since = periodToDate(period);
    let q = supabase.from("grafts").select("content, author_name").limit(1000);
    if (since) q = q.gte("created_at", since);
    const { data } = await q;
    if (!data) { setLoadingT(false); return; }

    const counts: Record<string, { count: number; authors: Set<string> }> = {};
    for (const { content, author_name } of data) {
      for (const t of (content?.match(/#[\wÀ-ÿ]+/g) ?? [])) {
        const tag = t.toLowerCase();
        if (!counts[tag]) counts[tag] = { count: 0, authors: new Set() };
        counts[tag].count++;
        counts[tag].authors.add(author_name);
      }
    }
    setTrends(
      Object.entries(counts)
        .map(([tag, { count, authors }]) => ({ tag, count, authors }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 25)
    );
    setLoadingT(false);
  }, [period]);

  useEffect(() => { fetchTrends(); }, [fetchTrends]);

  const loadGrafts = async (tag: string) => {
    if (selected === tag) { setSelected(null); setGrafts([]); return; }
    setSelected(tag); setLoadingG(true);
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

  return (
    <>
      {/* Filtres période */}
      <div style={{ display: "flex", padding: isMobile ? "0 12px" : "0 16px", borderBottom: `1px solid ${BORDER}` }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{ flex: 1, padding: isMobile ? "9px 0" : "10px 0", background: "none", border: "none", borderBottom: `2px solid ${period === p ? RED : "transparent"}`, color: period === p ? TEXT : TEXT2, fontSize: isMobile ? "12px" : "13px", fontWeight: period === p ? 700 : 400, cursor: "pointer", transition: "all 0.12s" }}>
            {isMobile
              ? { "24h": "24h", "7j": "7j", "30j": "30j", "tout": "Tout" }[p]
              : PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div style={{ padding: isMobile ? "6px 12px" : "8px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", pointerEvents: "none" }}>🔎</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer les hashtags…" style={{ width: "100%", padding: "7px 10px 7px 30px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "12px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
      </div>

      {/* Stats */}
      {!loadingT && (
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
          {[{ label: "Grafts", value: fmtCount(totalGrafts) }, { label: "Hashtags", value: totalHashtags }, { label: "Grafters", value: totalAuthors }].map(({ label, value }) => (
            <div key={label} style={{ flex: 1, padding: "8px 0", textAlign: "center" }}>
              <div style={{ color: TEXT, fontWeight: 700, fontSize: "14px" }}>{value}</div>
              <div style={{ color: TEXT2, fontSize: "10px" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      {loadingT && (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>📊</div>
          <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Calcul des tendances…</p>
        </div>
      )}

      {!loadingT && trends.length === 0 && (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <span style={{ fontSize: "40px" }}>🏷️</span>
          <p style={{ color: TEXT2, fontSize: "14px", marginTop: "12px" }}>Aucun hashtag sur cette période.</p>
        </div>
      )}

      {!loadingT && filtered.length === 0 && search && (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <p style={{ color: TEXT2, fontSize: "14px" }}>Aucun hashtag pour "{search}"</p>
          <button onClick={() => setSearch("")} style={{ color: RED, background: "none", border: "none", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}>Effacer</button>
        </div>
      )}

      {!loadingT && filtered.map((t, i) => (
        <TrendRow
          key={t.tag} trend={t} rank={i} max={max}
          selected={selected === t.tag}
          onSelect={() => loadGrafts(t.tag)}
          grafts={grafts} loadingGrafts={loadingG}
          isMobile={isMobile}
        />
      ))}
    </>
  );
}

// ── Tab Top Grafters ──────────────────────────────────────────────────────────

function TopGraftersTab({ isMobile }: { isMobile: boolean }) {
  const [grafters, setGrafters] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("stats_grafters")
        .select("*")
        .order("total_followers", { ascending: false })
        .limit(20);
      setGrafters(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏆</div>
      <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Chargement…</p>
    </div>
  );

  if (!grafters.length) return (
    <div style={{ padding: "60px 20px", textAlign: "center" }}>
      <span style={{ fontSize: "40px" }}>👥</span>
      <p style={{ color: TEXT2, fontSize: "14px", marginTop: "12px" }}>Aucun Grafter pour le moment.</p>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "10px 12px" : "12px 16px" }}>
      {grafters.map((g, i) => (
        <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: isMobile ? "10px 0" : "12px 0", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: "13px", color: i < 3 ? GOLD : TEXT2, fontWeight: 800, width: "28px", flexShrink: 0, textAlign: "center" }}>
            {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
          </div>
          <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: isMobile ? "8px" : "10px", flex: 1, minWidth: 0 }}>
            <div style={{ width: isMobile ? "36px" : "42px", height: isMobile ? "36px" : "42px", borderRadius: "50%", background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "12px" : "14px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {(g.display_name || g.username || "?").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ color: TEXT, fontWeight: 700, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.display_name || g.username}</span>
                <BadgeVerifie verified={g.verified} />
              </div>
              <div style={{ color: TEXT2, fontSize: isMobile ? "11px" : "12px" }}>{(g.total_followers ?? 0).toLocaleString("fr-FR")} abonnés · {g.total_grafts ?? 0} grafts</div>
            </div>
          </Link>
          <FollowButton targetUserId={g.id} />
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "tendances" | "grafters";

export default function ExplorerPage() {
  const [tab,      setTab]      = useState<Tab>("tendances");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      <style>{`* { box-sizing: border-box; } @keyframes pulse-icon { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: isMobile ? "110px" : "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: isMobile ? "10px 12px 8px" : "14px 16px 12px" }}>
            <div style={{ width: isMobile ? "30px" : "38px", height: isMobile ? "30px" : "38px", borderRadius: "10px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isMobile ? "15px" : "20px", boxShadow: `0 3px 14px ${RED}55`, flexShrink: 0 }}>🔭</div>
            <div>
              <h1 style={{ margin: 0, fontSize: isMobile ? "15px" : "18px", fontWeight: 900, color: TEXT }}>Explorer</h1>
              {!isMobile && <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>Tendances et Grafters populaires</p>}
            </div>
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", padding: isMobile ? "0 12px" : "0 16px", gap: "0" }}>
            {([["tendances", "🔥 Tendances"], ["grafters", "🏆 Top Grafters"]] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: isMobile ? "10px 0" : "12px 0", background: "none", border: "none",
                  borderBottom: `2px solid ${tab === t ? RED : "transparent"}`,
                  color: tab === t ? TEXT : TEXT2, fontSize: isMobile ? "13px" : "14px",
                  fontWeight: tab === t ? 700 : 400, cursor: "pointer", transition: "all 0.12s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "tendances" && <TendancesTab isMobile={isMobile} />}
        {tab === "grafters"  && <TopGraftersTab isMobile={isMobile} />}
      </div>
    </>
  );
}
