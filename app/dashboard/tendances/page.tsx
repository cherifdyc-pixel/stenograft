"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

type Trend = { tag: string; count: number };
type Graft = { id: string; content: string; created_at: string; author_name: string };

function avatarGrad(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${h},65%,22%) 0%,hsl(${(h + 40) % 360},72%,32%) 100%)`;
}

export default function TendancesPage() {
  const [trends,   setTrends]   = useState<Trend[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [grafts,   setGrafts]   = useState<Graft[]>([]);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingG, setLoadingG] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.from("grafts").select("content").limit(500);
      if (!data) { setLoadingT(false); return; }

      const counts: Record<string, number> = {};
      for (const { content } of data) {
        const tags = content?.match(/#[\wÀ-ÿ]+/g) ?? [];
        for (const t of tags) {
          const tag = t.toLowerCase();
          counts[tag] = (counts[tag] ?? 0) + 1;
        }
      }

      const sorted = Object.entries(counts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      setTrends(sorted);
      setLoadingT(false);
    })();
  }, []);

  const loadGrafts = async (tag: string) => {
    if (selected === tag) { setSelected(null); setGrafts([]); return; }
    setSelected(tag);
    setLoadingG(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("grafts")
      .select("id, content, created_at, author_name")
      .ilike("content", `%${tag}%`)
      .order("created_at", { ascending: false })
      .limit(20);
    setGrafts((data ?? []) as Graft[]);
    setLoadingG(false);
  };

  const max = trends[0]?.count || 1;

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: `${BG}E8`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 3px 16px ${RED}55`, flexShrink: 0 }}>🔥</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Tendances</h1>
            <p style={{ margin: 0, fontSize: "12px", color: TEXT2 }}>Ce dont parlent les Grafters</p>
          </div>
        </div>
      </div>

      {/* ── Chargement ── */}
      {loadingT && (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px", animation: "pulse-icon 1.2s ease-in-out infinite" }}>📊</div>
          <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Calcul des tendances…</p>
        </div>
      )}

      {/* ── Pas de hashtags ── */}
      {!loadingT && trends.length === 0 && (
        <div style={{ padding: "48px 20px", textAlign: "center" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px" }}>🏷️</div>
          <p style={{ color: TEXT2, fontSize: "14px", margin: 0 }}>Aucun hashtag dans les grafts pour l'instant.</p>
        </div>
      )}

      {/* ── Liste des tendances ── */}
      {!loadingT && trends.map((t, i) => {
        const isSelected = selected === t.tag;
        const pct = Math.round((t.count / max) * 100);
        const rankColor = i === 0 ? GOLD : i === 1 ? "#A0A0A0" : i === 2 ? "#A0522D" : TEXT2;

        return (
          <div key={t.tag}>
            {/* ── Ligne tendance ── */}
            <div
              onClick={() => loadGrafts(t.tag)}
              style={{
                display: "flex", alignItems: "center", gap: "14px",
                padding: "14px 20px",
                borderBottom: `1px solid ${isSelected ? RED + "20" : BORDER}`,
                background: isSelected ? `${RED}06` : "transparent",
                cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#080808"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
            >
              {/* Rang */}
              <div style={{ width: "28px", textAlign: "center", flexShrink: 0 }}>
                <span style={{ color: rankColor, fontSize: "13px", fontWeight: 800 }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i + 1}`}
                </span>
              </div>

              {/* Tag + barre */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "15px", fontWeight: 800, color: isSelected ? RED : TEXT, letterSpacing: "-0.2px", marginBottom: "6px", transition: "color 0.15s" }}>
                  {t.tag}
                </div>
                <div style={{ height: "3px", borderRadius: "2px", background: "#111", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: isSelected ? RED : "#333", borderRadius: "2px", transition: "width 0.5s cubic-bezier(0.4,0,0.2,1), background 0.2s" }} />
                </div>
              </div>

              {/* Compteur */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <span style={{ color: isSelected ? RED : TEXT2, fontSize: "12px", fontWeight: isSelected ? 700 : 400, transition: "color 0.15s" }}>
                  {t.count} graft{t.count > 1 ? "s" : ""}
                </span>
              </div>

              {/* Chevron */}
              <span style={{ color: TEXT2, fontSize: "13px", flexShrink: 0, transform: isSelected ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>›</span>
            </div>

            {/* ── Grafts dépliés ── */}
            {isSelected && (
              <div style={{ background: SURFACE, borderBottom: `1px solid ${BORDER}` }}>
                {loadingG ? (
                  <div style={{ padding: "16px 20px", color: TEXT2, fontSize: "13px" }}>Chargement…</div>
                ) : grafts.length === 0 ? (
                  <div style={{ padding: "16px 20px", color: TEXT2, fontSize: "13px" }}>Aucun graft trouvé.</div>
                ) : (
                  grafts.map(g => (
                    <div key={g.id} style={{ padding: "12px 20px 12px 62px", borderBottom: `1px solid ${BORDER}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: avatarGrad(g.author_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                            {g.author_name[0].toUpperCase()}
                          </div>
                          <span style={{ color: RED, fontSize: "13px", fontWeight: 700 }}>{g.author_name}</span>
                        </Link>
                        <span style={{ color: TEXT2, fontSize: "11px" }}>·</span>
                        <span style={{ color: TEXT2, fontSize: "11px" }}>
                          {new Date(g.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: TEXT, fontSize: "14px", lineHeight: 1.55 }}>
                        {/* Highlight le hashtag dans le contenu */}
                        {g.content.split(new RegExp(`(${t.tag})`, "gi")).map((part, idx) =>
                          part.toLowerCase() === t.tag
                            ? <mark key={idx} style={{ background: `${RED}25`, color: RED, borderRadius: "3px", padding: "0 2px" }}>{part}</mark>
                            : part
                        )}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      <style>{`
        @keyframes pulse-icon { 0%,100%{opacity:0.5} 50%{opacity:1} }
        * { box-sizing:border-box; }
      `}</style>
    </div>
  );
}
