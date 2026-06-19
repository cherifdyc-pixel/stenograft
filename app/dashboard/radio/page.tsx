"use client";
import { useState, useEffect, useRef, useCallback } from "react";

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

function fmtTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m}:${String(ss).padStart(2, "0")}`;
}

function parseDuration(str: string): number {
  const parts = str.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

// ── Data ──────────────────────────────────────────────────────────────────────

type Station = { id: string; name: string; tagline: string; hue: number; icon: string; listeners: number; live: string };
type Podcast  = { id: number; show: string; title: string; duration: string; date: string; cat: PodCat; hue: number; plays: number; description: string };
type PodCat   = "Politique" | "Société" | "Culture" | "Économie";

const STATIONS: Station[] = [
  { id: "souverainete", name: "Radio Souveraineté", tagline: "Politique, actualités et débats français", hue: 0,   icon: "🔴", listeners: 4_820, live: "Le grand journal de 18h" },
  { id: "info",         name: "France Info",        tagline: "Information en continu 24h/24",            hue: 210, icon: "📡", listeners: 48_300, live: "Flash info — 18h30" },
  { id: "assemblee",    name: "Radio Assemblée",    tagline: "Retransmissions officielles",              hue: 220, icon: "🏛️", listeners: 2_100, live: "Séance de nuit — Commission" },
  { id: "culture",      name: "France Culture",     tagline: "Débats, essais et culture générale",       hue: 270, icon: "🎭", listeners: 18_700, live: "Les Chemins de la Philosophie" },
  { id: "territoires",  name: "Radio Territoires",  tagline: "Régions, communes et vie locale",          hue: 140, icon: "🗺️", listeners: 3_540, live: "Bretagne ce soir" },
  { id: "registre",     name: "Radio Registre",     tagline: "Lecture des engagements officiels",        hue: 45,  icon: "📜", listeners: 1_290, live: "Archives — Allocutions 2025" },
];

const POD_CATS: PodCat[] = ["Politique", "Société", "Culture", "Économie"];

const PODCASTS: Podcast[] = [
  { id: 1, show: "Le Grand Débat Citoyen",    title: "Épisode 24 — La souveraineté numérique française",          duration: "1:12:34", date: "19 juin", cat: "Politique", hue: 0,   plays: 8_420, description: "Avec trois experts du numérique, nous analysons les enjeux de souveraineté face aux GAFAM." },
  { id: 2, show: "La Mémoire de la République", title: "Épisode 8 — Les promesses tenues",                        duration: "48:22",  date: "17 juin", cat: "Politique", hue: 220, plays: 3_100, description: "Retour sur les engagements tenus depuis l'ouverture du Registre en janvier 2026." },
  { id: 3, show: "Territoires en Action",     title: "Épisode 15 — Bretagne, modèle pour la France ?",            duration: "55:10",  date: "15 juin", cat: "Société",  hue: 140, plays: 2_800, description: "Le conseil régional breton expérimente la démocratie participative à grande échelle." },
  { id: 4, show: "La Veille Politique",       title: "Épisode 32 — Analyse du vote de la semaine",                duration: "34:18",  date: "14 juin", cat: "Politique", hue: 35,  plays: 5_670, description: "Décryptage des votes marquants à l'Assemblée Nationale cette semaine." },
  { id: 5, show: "Culture Citoyenne",         title: "Épisode 11 — Littérature et engagement",                    duration: "1:02:45", date: "12 juin", cat: "Culture",  hue: 270, plays: 1_940, description: "Comment les écrivains français contemporains s'engagent pour la démocratie." },
  { id: 6, show: "L'Économie Souveraine",     title: "Épisode 7 — Réindustrialisation : état des lieux",          duration: "58:03",  date: "11 juin", cat: "Économie", hue: 180, plays: 4_210, description: "Bilan de deux ans de politique de réindustrialisation et perspectives 2027." },
  { id: 7, show: "Voix des Régions",          title: "Épisode 19 — PACA, enjeux et défis locaux",                 duration: "41:33",  date: "10 juin", cat: "Société",  hue: 195, plays: 1_200, description: "Reportage au cœur de la Région Provence-Alpes-Côte d'Azur." },
  { id: 8, show: "Le Grand Débat Citoyen",    title: "Épisode 23 — Réforme constitutionnelle : pour ou contre ?", duration: "1:08:12", date: "9 juin",  cat: "Politique", hue: 0,   plays: 6_800, description: "Débat contradictoire entre constitutionnalistes sur le projet de réforme." },
];

// ── Waveform ──────────────────────────────────────────────────────────────────

function Waveform({ active, color = RED, bars = 5, height = 18 }: { active: boolean; color?: string; bars?: number; height?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: `${height}px`, flexShrink: 0 }}>
      {Array.from({ length: bars }, (_, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: `${height}px`,
            borderRadius: "2px",
            background: color,
            transformOrigin: "bottom",
            transform: active ? undefined : `scaleY(${0.15 + (i % 3) * 0.12})`,
            animation: active ? `rw${i + 1} ${0.65 + i * 0.11}s ease-in-out infinite alternate` : "none",
            opacity: active ? 1 : 0.3,
            transition: "opacity 0.3s, transform 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ── NowPlayingBar ─────────────────────────────────────────────────────────────

type NowPlaying =
  | { type: "station"; data: Station }
  | { type: "podcast"; data: Podcast; progress: number };

function NowPlayingBar({
  now, playing, onToggle, onClose, elapsed, totalSecs,
}: {
  now: NowPlaying; playing: boolean; onToggle: () => void; onClose: () => void;
  elapsed: number; totalSecs: number;
}) {
  const isStation = now.type === "station";
  const title     = isStation ? (now.data as Station).live   : (now.data as Podcast).title;
  const sub       = isStation ? (now.data as Station).name   : (now.data as Podcast).show;
  const hue       = now.data.hue;
  const pct       = isStation ? 0 : Math.min((elapsed / totalSecs) * 100, 100);

  return (
    <div style={{ position: "sticky", bottom: 0, zIndex: 100, background: `${SURFACE}F8`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${BORDER}` }}>
      {/* Progress bar (podcasts only) */}
      {!isStation && (
        <div style={{ height: "2px", background: "#1a1a1a" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: RED, transition: "width 1s linear" }} />
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 20px" }}>
        {/* Cover */}
        <div style={{ width: "46px", height: "46px", borderRadius: "10px", background: `linear-gradient(135deg,hsl(${hue},50%,12%) 0%,hsl(${(hue+60)%360},60%,20%) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0, boxShadow: `0 2px 12px hsl(${hue},50%,20%)` }}>
          {isStation ? (now.data as Station).icon : "🎙️"}
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</p>
          <div style={{ display: "flex", align: "center", gap: "8px", alignItems: "center", marginTop: "3px" }}>
            <Waveform active={playing} color={isStation ? RED : TEXT2} height={12} bars={4} />
            <span style={{ color: TEXT2, fontSize: "12px" }}>{sub}</span>
            {!isStation && (
              <span style={{ color: TEXT2, fontSize: "12px", marginLeft: "auto", fontVariantNumeric: "tabular-nums" }}>
                {fmtTime(elapsed)} / {(now.data as Podcast).duration}
              </span>
            )}
          </div>
        </div>
        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {!isStation && (
            <button
              onClick={() => {/* rewind 15s */}}
              style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", padding: "4px" }}
            >⏮</button>
          )}
          <button
            onClick={onToggle}
            style={{ width: "42px", height: "42px", borderRadius: "50%", background: RED, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 14px ${RED}55`, fontSize: "18px", flexShrink: 0 }}
          >
            {playing ? "⏸" : "▶"}
          </button>
          {!isStation && (
            <button
              onClick={() => {/* forward 15s */}}
              style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", padding: "4px" }}
            >⏭</button>
          )}
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", padding: "4px", opacity: 0.6, marginLeft: "4px" }}
          >✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RadioPage() {
  const [now,       setNow]       = useState<NowPlaying | null>(null);
  const [playing,   setPlaying]   = useState(false);
  const [catFilter, setCatFilter] = useState<PodCat | "Tout">("Tout");
  const [elapsed,   setElapsed]   = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Podcast timer
  useEffect(() => {
    if (playing && now?.type === "podcast") {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= totalSecs - 1) { setPlaying(false); return totalSecs; }
          return e + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, now, totalSecs]);

  const playStation = useCallback((s: Station) => {
    setNow({ type: "station", data: s });
    setElapsed(0); setTotalSecs(0);
    setPlaying(true);
  }, []);

  const playPodcast = useCallback((p: Podcast) => {
    setNow({ type: "podcast", data: p, progress: 0 });
    setElapsed(0);
    setTotalSecs(parseDuration(p.duration));
    setPlaying(true);
  }, []);

  const togglePlay = () => setPlaying(v => !v);
  const closePlayer = () => { setNow(null); setPlaying(false); setElapsed(0); };

  const isPlayingStation = (id: string) => playing && now?.type === "station" && (now.data as Station).id === id;
  const isPlayingPodcast = (id: number) => playing && now?.type === "podcast" && (now.data as Podcast).id === id;

  const filteredPods = catFilter === "Tout" ? PODCASTS : PODCASTS.filter(p => p.cat === catFilter);

  return (
    <>
      <style>{`
        @keyframes rw1 { 0%{transform:scaleY(0.12)} 100%{transform:scaleY(0.9)} }
        @keyframes rw2 { 0%{transform:scaleY(0.5)}  100%{transform:scaleY(0.18)} }
        @keyframes rw3 { 0%{transform:scaleY(0.22)} 100%{transform:scaleY(1)} }
        @keyframes rw4 { 0%{transform:scaleY(0.75)} 100%{transform:scaleY(0.14)} }
        @keyframes rw5 { 0%{transform:scaleY(0.28)} 100%{transform:scaleY(0.85)} }
        @keyframes radio-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .radio-station:hover { background:#0f0f0f !important; }
        .radio-pod:hover     { background:#0f0f0f !important; }
        .radio-cat:hover     { opacity:0.85; }
        * { box-sizing:border-box; }
      `}</style>

      <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50, background: `${BG}E8`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 3px 16px ${RED}55`, flexShrink: 0 }}>📻</div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, letterSpacing: "0.3px" }}>
                  <span style={{ color: RED }}>STENOGRAFT</span>{" "}<span style={{ color: TEXT }}>Radio</span>
                </h1>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: `${RED}15`, border: `1px solid ${RED}30`, color: RED, fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "4px", letterSpacing: "0.5px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: RED, animation: "radio-pulse 1.4s ease-in-out infinite" }} />
                  EN DIRECT
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "12px", color: TEXT2 }}>L'audio citoyen souverain</p>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingBottom: now ? "0" : "40px" }}>

          {/* ── Featured: station en vedette ── */}
          <div style={{ margin: "20px 20px 0", position: "relative", borderRadius: "18px", overflow: "hidden", background: `linear-gradient(125deg, hsl(${STATIONS[0].hue},45%,8%) 0%, hsl(${(STATIONS[0].hue + 50) % 360},55%,16%) 60%, hsl(${STATIONS[0].hue},38%,10%) 100%)`, border: `1px solid rgba(255,255,255,0.06)`, cursor: "pointer" }}
            onClick={() => playStation(STATIONS[0])}
          >
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 4px)", pointerEvents: "none" }} />
            <div style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: RED, color: "#fff", fontSize: "10px", fontWeight: 800, letterSpacing: "1px", padding: "3px 9px", borderRadius: "4px" }}>
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff", animation: "radio-pulse 1.3s ease-in-out infinite" }} />
                  DIRECT
                </span>
                <span style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: TEXT2, fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "4px" }}>
                  👂 {fmtN(STATIONS[0].listeners)} auditeurs
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ fontSize: "40px", lineHeight: 1 }}>{STATIONS[0].icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ margin: "0 0 4px", fontSize: "20px", fontWeight: 900, color: TEXT }}>{STATIONS[0].name}</h2>
                  <p style={{ margin: 0, fontSize: "14px", color: "rgba(231,233,234,0.65)" }}>{STATIONS[0].live}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <Waveform active={isPlayingStation(STATIONS[0].id)} color={RED} height={28} bars={6} />
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: isPlayingStation(STATIONS[0].id) ? "rgba(255,255,255,0.12)" : RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: `0 4px 20px ${RED}55`, transition: "background 0.2s", flexShrink: 0 }}>
                    {isPlayingStation(STATIONS[0].id) ? "⏸" : "▶"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stations ── */}
          <section style={{ padding: "28px 20px 0" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: 800, color: TEXT }}>📡 Stations en direct</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {STATIONS.slice(1).map(s => {
                const active = isPlayingStation(s.id);
                return (
                  <div
                    key={s.id}
                    className="radio-station"
                    onClick={() => active ? togglePlay() : playStation(s)}
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 12px", borderRadius: "12px", cursor: "pointer", transition: "background 0.15s" }}
                  >
                    <div style={{ width: "46px", height: "46px", borderRadius: "11px", background: `linear-gradient(135deg,hsl(${s.hue},50%,12%) 0%,hsl(${(s.hue+60)%360},60%,22%) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: active ? RED : TEXT }}>{s.name}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: TEXT2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{active ? s.live : s.tagline}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      {active && <Waveform active={playing} color={RED} height={16} bars={4} />}
                      {!active && <span style={{ color: TEXT2, fontSize: "11px" }}>👂 {fmtN(s.listeners)}</span>}
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: active ? `${RED}18` : SURFACE, border: `1px solid ${active ? RED : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: active ? RED : TEXT2, transition: "all 0.15s", marginLeft: "4px" }}>
                        {active && playing ? "⏸" : "▶"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Podcasts ── */}
          <section style={{ padding: "28px 20px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT }}>🎙 Podcasts</h2>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {(["Tout", ...POD_CATS] as const).map(c => {
                  const on = catFilter === c;
                  return (
                    <button
                      key={c}
                      className="radio-cat"
                      onClick={() => setCatFilter(c as typeof catFilter)}
                      style={{ padding: "5px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: on ? 700 : 500, background: on ? TEXT : "transparent", color: on ? BG : TEXT2, border: on ? "none" : `1px solid ${BORDER}`, cursor: "pointer", transition: "all 0.15s" }}
                    >{c}</button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredPods.map(p => {
                const active = isPlayingPodcast(p.id);
                return (
                  <div
                    key={p.id}
                    className="radio-pod"
                    onClick={() => active ? togglePlay() : playPodcast(p)}
                    style={{ display: "flex", alignItems: "flex-start", gap: "14px", padding: "14px 12px", borderRadius: "12px", cursor: "pointer", transition: "background 0.15s" }}
                  >
                    {/* Cover */}
                    <div style={{ width: "54px", height: "54px", borderRadius: "10px", background: `linear-gradient(135deg,hsl(${p.hue},50%,10%) 0%,hsl(${(p.hue+60)%360},58%,20%) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
                      🎙
                      {active && playing && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Waveform active={true} color="#fff" height={18} bars={3} />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px", flexWrap: "wrap" }}>
                        <span style={{ background: `${RED}14`, border: `1px solid ${RED}25`, color: RED, fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "3px", letterSpacing: "0.3px" }}>{p.cat}</span>
                        <span style={{ color: TEXT2, fontSize: "11px" }}>{p.show}</span>
                      </div>
                      <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: active ? RED : TEXT, lineHeight: 1.35 }}>{p.title}</p>
                      <p style={{ margin: "0 0 6px", fontSize: "12px", color: TEXT2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{p.description}</p>
                      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: TEXT2 }}>⏱ {p.duration}</span>
                        <span style={{ fontSize: "11px", color: TEXT2 }}>▶ {fmtN(p.plays)} écoutes</span>
                        <span style={{ fontSize: "11px", color: TEXT2 }}>· {p.date}</span>
                        {active && (
                          <span style={{ fontSize: "11px", color: RED, fontWeight: 700, marginLeft: "auto" }}>
                            {fmtTime(elapsed)} / {p.duration}
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {active && (
                        <div style={{ marginTop: "8px", height: "2px", background: BORDER, borderRadius: "1px" }}>
                          <div style={{ height: "100%", width: `${(elapsed / totalSecs) * 100}%`, background: RED, borderRadius: "1px", transition: "width 1s linear" }} />
                        </div>
                      )}
                    </div>
                    {/* Play button */}
                    <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: active ? `${RED}18` : SURFACE, border: `1px solid ${active ? RED : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", color: active ? RED : TEXT2, transition: "all 0.15s", flexShrink: 0, marginTop: "8px" }}>
                      {active && playing ? "⏸" : "▶"}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Spacer ── */}
          <div style={{ height: now ? "0" : "40px" }} />
        </div>

        {/* ── Player bar ── */}
        {now && (
          <NowPlayingBar
            now={now}
            playing={playing}
            onToggle={togglePlay}
            onClose={closePlayer}
            elapsed={elapsed}
            totalSecs={totalSecs}
          />
        )}
      </div>
    </>
  );
}
