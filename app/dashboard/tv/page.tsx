"use client";
import { useState } from "react";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

// ── Data ──────────────────────────────────────────────────────────────────────

const LIVE_STREAMS = [
  {
    id: 1,
    title: "Séance plénière — Assemblée Nationale",
    channel: "Assemblée Nationale",
    viewers: 3842,
    hue: 220,
    tag: "Politique",
    duration: "2h14 en cours",
  },
  {
    id: 2,
    title: "Conseil de Paris — Budget municipal 2026",
    channel: "Territoires",
    viewers: 1204,
    hue: 140,
    tag: "Territoires",
    duration: "47min en cours",
  },
  {
    id: 3,
    title: "Audition de M. Dupont — Commission des finances",
    channel: "Le Registre Live",
    viewers: 742,
    hue: 45,
    tag: "Registre",
    duration: "1h03 en cours",
  },
];

const CHANNELS = [
  {
    id: "politique-fr",
    icon: "🏛️",
    name: "Politique FR",
    desc: "Débats, votes et séances plénières en direct",
    abonnes: 12_400,
    color: "#1D9BF0",
  },
  {
    id: "territoires",
    icon: "🗺️",
    name: "Territoires",
    desc: "Conseils régionaux et départementaux de France",
    abonnes: 8_730,
    color: "#2ECC71",
  },
  {
    id: "registre-live",
    icon: "📋",
    name: "Le Registre Live",
    desc: "Suivi en direct des engagements et promesses",
    abonnes: 6_190,
    color: GOLD,
  },
  {
    id: "assemblee",
    icon: "🇫🇷",
    name: "Assemblée Nationale",
    desc: "Séances officielles retransmises intégralement",
    abonnes: 24_800,
    color: RED,
  },
  {
    id: "conseils-regionaux",
    icon: "🏙️",
    name: "Conseils Régionaux",
    desc: "Toutes les régions — Bretagne, PACA, Grand Est…",
    abonnes: 4_320,
    color: "#8B5CF6",
  },
];

const REPLAY_FILTERS = ["Tout", "Politique", "Territoires", "Société", "Culture"] as const;
type ReplayFilter = (typeof REPLAY_FILTERS)[number];

const REPLAYS = [
  {
    id: 1,
    title: "Discours de politique générale — Premier ministre",
    channel: "Politique FR",
    duration: "1:24:38",
    views: 89_340,
    date: "il y a 2j",
    cat: "Politique",
    hue: 220,
  },
  {
    id: 2,
    title: "Conseil régional Bretagne — Transition énergétique",
    channel: "Territoires",
    duration: "2:08:12",
    views: 12_400,
    date: "il y a 3j",
    cat: "Territoires",
    hue: 140,
  },
  {
    id: 3,
    title: "Table ronde — Souveraineté numérique française",
    channel: "Politique FR",
    duration: "58:47",
    views: 34_200,
    date: "il y a 5j",
    cat: "Société",
    hue: 260,
  },
  {
    id: 4,
    title: "Festival des arts citoyens — Paris 2026",
    channel: "Territoires",
    duration: "3:12:05",
    views: 6_800,
    date: "il y a 1sem",
    cat: "Culture",
    hue: 330,
  },
  {
    id: 5,
    title: "Séance Questions au Gouvernement — 12 juin",
    channel: "Assemblée Nationale",
    duration: "1:47:22",
    views: 56_100,
    date: "il y a 1sem",
    cat: "Politique",
    hue: 0,
  },
  {
    id: 6,
    title: "Enquête citoyenne — Déserts médicaux ruraux",
    channel: "Territoires",
    duration: "44:15",
    views: 18_900,
    date: "il y a 2sem",
    cat: "Société",
    hue: 180,
  },
];

const VIDEO_GRAFTS = [
  { id: 1, author: "Yahia",    hue: 0,   views: 4_200, duration: "0:42", text: "Réaction au discours de ce matin" },
  { id: 2, author: "Soraya",   hue: 210, views: 1_830, duration: "1:05", text: "Mon analyse du vote d'hier soir" },
  { id: 3, author: "Karim",    hue: 140, views: 7_640, duration: "0:28", text: "Ce passage m'a sidéré 👇" },
  { id: 4, author: "Léa",      hue: 280, views: 920,   duration: "2:14", text: "Interview sur la réforme locale" },
  { id: 5, author: "Fouad",    hue: 35,  views: 3_100, duration: "0:53", text: "Ma réponse à la question posée" },
  { id: 6, author: "Priya",    hue: 330, views: 2_450, duration: "1:30", text: "Analyse du budget régional PACA" },
  { id: 7, author: "Adrien",   hue: 70,  views: 550,   duration: "0:19", text: "Micro-trottoir place de la Bastille" },
  { id: 8, author: "Camille",  hue: 195, views: 8_200, duration: "3:02", text: "Reportage : conseil municipal 🏙️" },
  { id: 9, author: "Baptiste", hue: 300, views: 1_100, duration: "0:35", text: "Ce que personne ne dit" },
];

// ── Components ────────────────────────────────────────────────────────────────

function LiveBadge() {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: RED, color: "#fff", fontSize: "10px", fontWeight: 800, letterSpacing: "1px", padding: "3px 8px", borderRadius: "4px" }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", display: "inline-block", animation: "tv-pulse 1.4s ease-in-out infinite" }} />
      LIVE
    </span>
  );
}

function Thumbnail({ hue, aspect = "16/9", size = "100%" }: { hue: number; aspect?: string; size?: string }) {
  return (
    <div style={{
      width: size,
      aspectRatio: aspect,
      background: `linear-gradient(135deg, hsl(${hue},40%,8%) 0%, hsl(${(hue + 60) % 360},50%,14%) 100%)`,
      borderRadius: "8px",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Play icon overlay */}
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
        <span style={{ color: "#fff", fontSize: "14px", marginLeft: "2px" }}>▶</span>
      </div>
      {/* Subtle scan lines */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 4px)", pointerEvents: "none" }} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TVPage() {
  const [replayFilter, setReplayFilter] = useState<ReplayFilter>("Tout");
  const [followed, setFollowed]         = useState<Set<string>>(new Set());
  const [activeStream, setActiveStream] = useState<number | null>(null);

  const toggleFollow = (id: string) => {
    setFollowed(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filteredReplays = replayFilter === "Tout"
    ? REPLAYS
    : REPLAYS.filter(r => r.cat === replayFilter);

  return (
    <>
      <style>{`
        @keyframes tv-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes tv-scan {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .tv-live-card { transition: transform 0.18s ease, border-color 0.18s ease; cursor: pointer; }
        .tv-live-card:hover { transform: translateY(-3px); border-color: rgba(224,73,47,0.5) !important; }
        .tv-channel-row { transition: background 0.15s; }
        .tv-channel-row:hover { background: #0f0f0f !important; }
        .tv-replay-card { transition: transform 0.18s ease; cursor: pointer; }
        .tv-replay-card:hover { transform: translateY(-2px); }
        .tv-vgraft { cursor: pointer; position: relative; overflow: hidden; border-radius: 8px; }
        .tv-vgraft:hover .tv-vgraft-overlay { opacity: 1 !important; }
        .tv-filter-btn { transition: all 0.15s; cursor: pointer; border: none; }
        .tv-follow-btn { transition: all 0.15s; cursor: pointer; border: none; }
        .tv-follow-btn:hover { opacity: 0.85; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: TEXT }}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div style={{ padding: "24px 20px 20px", borderBottom: `1px solid ${BORDER}`, background: BG, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(8px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: `0 4px 20px ${RED}55`, flexShrink: 0 }}>📺</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: RED, letterSpacing: "0.5px" }}>STENOGRAFT</h1>
                <span style={{ fontSize: "20px", fontWeight: 900, color: TEXT }}>TV</span>
                <LiveBadge />
              </div>
              <p style={{ margin: 0, fontSize: "13px", color: TEXT2 }}>La télévision citoyenne souveraine</p>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "900px" }}>

          {/* ══ EN DIRECT ═══════════════════════════════════════════════════ */}
          <section style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: RED, display: "inline-block", animation: "tv-pulse 1.4s ease-in-out infinite" }} />
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT, letterSpacing: "-0.2px" }}>En Direct</h2>
              <span style={{ color: TEXT2, fontSize: "13px" }}>· {LIVE_STREAMS.length} streams actifs</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "14px" }}>
              {LIVE_STREAMS.map(s => (
                <div
                  key={s.id}
                  className="tv-live-card"
                  onClick={() => setActiveStream(activeStream === s.id ? null : s.id)}
                  style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden" }}
                >
                  {/* Thumbnail */}
                  <div style={{ position: "relative" }}>
                    <Thumbnail hue={s.hue} />
                    {/* Overlay badges */}
                    <div style={{ position: "absolute", top: "8px", left: "8px" }}><LiveBadge /></div>
                    <div style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(0,0,0,0.72)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", color: TEXT2, fontWeight: 600 }}>
                      👁 {fmtN(s.viewers)}
                    </div>
                    <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.72)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", color: TEXT2 }}>{s.duration}</div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "12px" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: TEXT, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: TEXT2 }}>{s.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ CHAÎNES ═════════════════════════════════════════════════════ */}
          <section style={{ padding: "8px 20px 24px", borderTop: `1px solid ${BORDER}` }}>
            <h2 style={{ margin: "20px 0 16px", fontSize: "16px", fontWeight: 800, color: TEXT, letterSpacing: "-0.2px" }}>📡 Chaînes</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {CHANNELS.map(ch => {
                const isFollowed = followed.has(ch.id);
                return (
                  <div key={ch.id} className="tv-channel-row" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 10px", borderRadius: "12px" }}>
                    {/* Icon */}
                    <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: `${ch.color}14`, border: `1px solid ${ch.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{ch.icon}</div>
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: TEXT }}>{ch.name}</p>
                      </div>
                      <p style={{ margin: "2px 0 0", fontSize: "13px", color: TEXT2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ch.desc}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: TEXT2, opacity: 0.6 }}>{fmtN(ch.abonnes)} abonnés</p>
                    </div>
                    {/* Follow button */}
                    <button
                      className="tv-follow-btn"
                      onClick={() => toggleFollow(ch.id)}
                      style={{
                        padding: "7px 16px",
                        borderRadius: "100px",
                        fontSize: "13px",
                        fontWeight: 700,
                        flexShrink: 0,
                        background: isFollowed ? "transparent" : TEXT,
                        color: isFollowed ? TEXT : BG,
                        border: isFollowed ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      {isFollowed ? "Suivi ✓" : "Suivre"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ══ REPLAYS ══════════════════════════════════════════════════════ */}
          <section style={{ padding: "8px 20px 24px", borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", margin: "20px 0 16px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT, letterSpacing: "-0.2px" }}>🎬 Replays</h2>
              {/* Filters */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {REPLAY_FILTERS.map(f => {
                  const on = replayFilter === f;
                  return (
                    <button
                      key={f}
                      className="tv-filter-btn"
                      onClick={() => setReplayFilter(f)}
                      style={{
                        padding: "5px 14px",
                        borderRadius: "100px",
                        fontSize: "13px",
                        fontWeight: on ? 700 : 500,
                        background: on ? TEXT : "transparent",
                        color: on ? BG : TEXT2,
                        border: on ? "none" : `1px solid ${BORDER}`,
                      }}
                    >{f}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}>
              {filteredReplays.map(r => (
                <div key={r.id} className="tv-replay-card" style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden" }}>
                  <div style={{ position: "relative" }}>
                    <Thumbnail hue={r.hue} />
                    <div style={{ position: "absolute", bottom: "8px", right: "8px", background: "rgba(0,0,0,0.8)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", color: TEXT, fontWeight: 600 }}>{r.duration}</div>
                    <div style={{ position: "absolute", top: "8px", left: "8px", background: `${RED}18`, border: `1px solid ${RED}30`, color: RED, borderRadius: "4px", padding: "2px 7px", fontSize: "10px", fontWeight: 700 }}>{r.cat}</div>
                  </div>
                  <div style={{ padding: "12px" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: 700, color: TEXT, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: TEXT2 }}>{r.channel}</p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <span style={{ fontSize: "11px", color: TEXT2 }}>👁 {fmtN(r.views)}</span>
                      <span style={{ fontSize: "11px", color: TEXT2 }}>· {r.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ══ GRAFTS VIDÉO ════════════════════════════════════════════════ */}
          <section style={{ padding: "8px 20px 40px", borderTop: `1px solid ${BORDER}` }}>
            <h2 style={{ margin: "20px 0 4px", fontSize: "16px", fontWeight: 800, color: TEXT, letterSpacing: "-0.2px" }}>🎥 Grafts Vidéo</h2>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: TEXT2 }}>Les grafts avec vidéo du fil public</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "3px" }}>
              {VIDEO_GRAFTS.map(g => (
                <div key={g.id} className="tv-vgraft" style={{ aspectRatio: "9/16", background: `linear-gradient(160deg, hsl(${g.hue},40%,8%) 0%, hsl(${(g.hue + 60) % 360},50%,14%) 100%)`, position: "relative" }}>
                  {/* Scan lines */}
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)", pointerEvents: "none" }} />
                  {/* Play */}
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: "12px", marginLeft: "2px" }}>▶</span>
                    </div>
                  </div>
                  {/* Author avatar */}
                  <div style={{ position: "absolute", top: "8px", left: "8px", width: "24px", height: "24px", borderRadius: "50%", background: `linear-gradient(135deg, hsl(${g.hue},55%,18%) 0%, hsl(${(g.hue + 45) % 360},65%,38%) 100%)`, border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "10px", fontWeight: 800 }}>{g.author[0]}</div>
                  {/* Duration */}
                  <div style={{ position: "absolute", top: "8px", right: "6px", background: "rgba(0,0,0,0.72)", borderRadius: "3px", padding: "1px 5px", fontSize: "10px", color: TEXT, fontWeight: 600 }}>{g.duration}</div>
                  {/* Overlay info */}
                  <div className="tv-vgraft-overlay" style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 8px 8px", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", opacity: 0, transition: "opacity 0.18s" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "11px", fontWeight: 700, color: TEXT, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.text}</p>
                    <span style={{ fontSize: "10px", color: TEXT2 }}>👁 {fmtN(g.views)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
