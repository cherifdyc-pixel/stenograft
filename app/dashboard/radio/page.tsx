"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

const FAV_KEY    = "steno_radio_favs";
const RECENT_KEY = "steno_radio_recent";
const SPEED_KEY  = "steno_radio_speed";
const VOLUME_KEY = "steno_radio_volume";

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".0","") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".0","") + "k";
  return String(n);
}
function fmtTime(s: number) {
  const h  = Math.floor(s / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
  return `${m}:${String(ss).padStart(2,"0")}`;
}
function parseDuration(str: string): number {
  const parts = str.split(":").map(Number);
  return parts.length === 3 ? parts[0]*3600+parts[1]*60+parts[2] : parts[0]*60+parts[1];
}

// ── Data ──────────────────────────────────────────────────────────────────────

type Station = { id: string; name: string; tagline: string; hue: number; icon: string; listeners: number; live: string; freq: string };
type PodCat  = "Politique" | "Société" | "Culture" | "Économie";
type Podcast = { id: number; show: string; title: string; duration: string; date: string; cat: PodCat; hue: number; plays: number; description: string };

const STATIONS: Station[] = [
  { id:"souverainete", name:"Radio Souveraineté", tagline:"Politique, actualités et débats français", hue:0,   icon:"🔴", listeners:4_820,  live:"Le grand journal de 18h",            freq:"88.2"  },
  { id:"info",         name:"France Info",        tagline:"Information en continu 24h/24",           hue:210, icon:"📡", listeners:48_300, live:"Flash info — 18h30",                  freq:"105.5" },
  { id:"assemblee",    name:"Radio Assemblée",    tagline:"Retransmissions officielles",             hue:220, icon:"🏛️", listeners:2_100,  live:"Séance de nuit — Commission",        freq:"91.1"  },
  { id:"culture",      name:"France Culture",     tagline:"Débats, essais et culture générale",      hue:270, icon:"🎭", listeners:18_700, live:"Les Chemins de la Philosophie",      freq:"93.5"  },
  { id:"territoires",  name:"Radio Territoires",  tagline:"Régions, communes et vie locale",         hue:140, icon:"🗺️", listeners:3_540,  live:"Bretagne ce soir",                    freq:"96.3"  },
  { id:"registre",     name:"Radio Registre",     tagline:"Lecture des engagements officiels",       hue:45,  icon:"📜", listeners:1_290,  live:"Archives — Allocutions 2025",         freq:"102.7" },
];

const POD_CATS: PodCat[] = ["Politique","Société","Culture","Économie"];

const PODCASTS: Podcast[] = [
  { id:1, show:"Le Grand Débat Citoyen",       title:"Épisode 24 — La souveraineté numérique française",          duration:"1:12:34", date:"19 juin", cat:"Politique", hue:0,   plays:8_420, description:"Avec trois experts du numérique, nous analysons les enjeux de souveraineté face aux GAFAM." },
  { id:2, show:"La Mémoire de la République",  title:"Épisode 8 — Les promesses tenues",                          duration:"48:22",   date:"17 juin", cat:"Politique", hue:220, plays:3_100, description:"Retour sur les engagements tenus depuis l'ouverture du Registre en janvier 2026." },
  { id:3, show:"Territoires en Action",        title:"Épisode 15 — Bretagne, modèle pour la France ?",            duration:"55:10",   date:"15 juin", cat:"Société",   hue:140, plays:2_800, description:"Le conseil régional breton expérimente la démocratie participative à grande échelle." },
  { id:4, show:"La Veille Politique",          title:"Épisode 32 — Analyse du vote de la semaine",                duration:"34:18",   date:"14 juin", cat:"Politique", hue:35,  plays:5_670, description:"Décryptage des votes marquants à l'Assemblée Nationale cette semaine." },
  { id:5, show:"Culture Citoyenne",            title:"Épisode 11 — Littérature et engagement",                    duration:"1:02:45", date:"12 juin", cat:"Culture",   hue:270, plays:1_940, description:"Comment les écrivains français contemporains s'engagent pour la démocratie." },
  { id:6, show:"L'Économie Souveraine",        title:"Épisode 7 — Réindustrialisation : état des lieux",          duration:"58:03",   date:"11 juin", cat:"Économie",  hue:180, plays:4_210, description:"Bilan de deux ans de politique de réindustrialisation et perspectives 2027." },
  { id:7, show:"Voix des Régions",             title:"Épisode 19 — PACA, enjeux et défis locaux",                 duration:"41:33",   date:"10 juin", cat:"Société",   hue:195, plays:1_200, description:"Reportage au cœur de la Région Provence-Alpes-Côte d'Azur." },
  { id:8, show:"Le Grand Débat Citoyen",       title:"Épisode 23 — Réforme constitutionnelle : pour ou contre ?", duration:"1:08:12", date:"9 juin",  cat:"Politique", hue:0,   plays:6_800, description:"Débat contradictoire entre constitutionnalistes sur le projet de réforme." },
  { id:9, show:"L'Économie Souveraine",        title:"Épisode 6 — Le modèle fiscal français en 2026",             duration:"52:44",   date:"5 juin",  cat:"Économie",  hue:180, plays:2_950, description:"Analyse comparative du modèle fiscal français face à ses voisins européens." },
  { id:10,show:"Culture Citoyenne",            title:"Épisode 10 — Cinéma et mémoire collective",                 duration:"1:05:20", date:"2 juin",  cat:"Culture",   hue:270, plays:1_660, description:"Projection et débat autour des films qui ont façonné l'identité citoyenne." },
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

// ── Waveform ──────────────────────────────────────────────────────────────────

function Waveform({ active, color=RED, bars=5, height=18 }: { active: boolean; color?: string; bars?: number; height?: number }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:`${height}px`, flexShrink:0 }}>
      {Array.from({ length: bars }, (_,i) => (
        <div key={i} style={{
          width:"3px", height:`${height}px`, borderRadius:"2px", background:color,
          transformOrigin:"bottom",
          transform: active ? undefined : `scaleY(${0.15+(i%3)*0.12})`,
          animation: active ? `rw${i+1} ${0.65+i*0.11}s ease-in-out infinite alternate` : "none",
          opacity: active ? 1 : 0.3,
          transition:"opacity 0.3s, transform 0.3s",
        }} />
      ))}
    </div>
  );
}

// ── NowPlayingBar ─────────────────────────────────────────────────────────────

type NowPlaying = { type:"station"; data:Station } | { type:"podcast"; data:Podcast };

function NowPlayingBar({ now, playing, onToggle, onClose, elapsed, totalSecs, onSeek, speed, onSpeedChange, volume, onVolume }: {
  now: NowPlaying; playing: boolean; onToggle: () => void; onClose: () => void;
  elapsed: number; totalSecs: number; onSeek: (s: number) => void;
  speed: number; onSpeedChange: (s: number) => void;
  volume: number; onVolume: (v: number) => void;
}) {
  const [showControls, setShowControls] = useState(false);
  const isStation = now.type === "station";
  const title     = isStation ? (now.data as Station).live : (now.data as Podcast).title;
  const sub       = isStation ? (now.data as Station).name : (now.data as Podcast).show;
  const hue       = now.data.hue;
  const pct       = isStation ? 0 : totalSecs > 0 ? Math.min((elapsed / totalSecs) * 100, 100) : 0;
  const speedIdx  = SPEEDS.indexOf(speed);
  const nextSpeed = SPEEDS[(speedIdx + 1) % SPEEDS.length];

  return (
    <div style={{ position:"sticky", bottom:0, zIndex:100, background:`${SURFACE}F8`, backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:`1px solid ${BORDER}` }}>
      {/* Seek bar */}
      {!isStation && totalSecs > 0 && (
        <div style={{ height:"3px", background:"#1a1a1a", cursor:"pointer" }}
          onClick={e => {
            const rect  = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            onSeek(Math.round(ratio * totalSecs));
          }}
        >
          <div style={{ height:"100%", width:`${pct}%`, background:RED, transition:"width 0.5s linear", borderRadius:"2px" }} />
        </div>
      )}

      {/* Main row */}
      <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"10px 16px" }}>
        <div style={{ width:"44px", height:"44px", borderRadius:"10px", background:`linear-gradient(135deg,hsl(${hue},50%,12%) 0%,hsl(${(hue+60)%360},60%,20%) 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0, boxShadow:`0 2px 12px hsl(${hue},50%,20%)` }}>
          {isStation ? (now.data as Station).icon : "🎙️"}
        </div>

        <div style={{ flex:1, minWidth:0, cursor:"pointer" }} onClick={() => setShowControls(v => !v)}>
          <p style={{ margin:0, fontSize:"13px", fontWeight:700, color:TEXT, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{title}</p>
          <div style={{ display:"flex", gap:"6px", alignItems:"center", marginTop:"2px" }}>
            <Waveform active={playing} color={isStation ? RED : TEXT2} height={10} bars={4} />
            <span style={{ color:TEXT2, fontSize:"11px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sub}</span>
          </div>
        </div>

        {!isStation && totalSecs > 0 && (
          <span style={{ color:TEXT2, fontSize:"11px", fontVariantNumeric:"tabular-nums", flexShrink:0 }}>
            {fmtTime(elapsed)}/{(now.data as Podcast).duration}
          </span>
        )}

        <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
          {!isStation && (
            <button onClick={() => onSeek(Math.max(0, elapsed - 15))} style={{ background:"none", border:"none", color:TEXT2, fontSize:"16px", cursor:"pointer", padding:"4px" }} title="-15s">⏮</button>
          )}
          <button onClick={onToggle} style={{ width:"40px", height:"40px", borderRadius:"50%", background:RED, border:"none", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:`0 2px 12px ${RED}50`, fontSize:"16px", flexShrink:0 }}>
            {playing ? "⏸" : "▶"}
          </button>
          {!isStation && (
            <button onClick={() => onSeek(Math.min(totalSecs, elapsed + 15))} style={{ background:"none", border:"none", color:TEXT2, fontSize:"16px", cursor:"pointer", padding:"4px" }} title="+15s">⏭</button>
          )}
          <button onClick={onClose} style={{ background:"none", border:"none", color:TEXT2, fontSize:"16px", cursor:"pointer", padding:"4px", opacity:0.6 }}>✕</button>
        </div>
      </div>

      {/* Expanded controls (tap title/sub to expand) */}
      {showControls && (
        <div style={{ padding:"8px 16px 12px", borderTop:`1px solid ${BORDER}`, display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flex:1, minWidth:"140px" }}>
            <span style={{ fontSize:"13px" }}>{volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}</span>
            <input type="range" min={0} max={100} value={volume} onChange={e => onVolume(Number(e.target.value))} style={{ flex:1, accentColor:RED, height:"3px", cursor:"pointer" }} />
            <span style={{ color:TEXT2, fontSize:"11px", width:"28px", textAlign:"right" }}>{volume}%</span>
          </div>
          {!isStation && (
            <button onClick={() => onSpeedChange(nextSpeed)} style={{ padding:"4px 10px", background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:"6px", color:speed !== 1 ? RED : TEXT2, fontSize:"12px", cursor:"pointer", fontWeight:700, flexShrink:0 }}>
              {speed}×
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── PodcastCard ───────────────────────────────────────────────────────────────

function PodcastCard({ p, active, playing, elapsed, totalSecs, onPlay, favs, onToggleFav }: {
  p: Podcast; active: boolean; playing: boolean; elapsed: number; totalSecs: number;
  onPlay: () => void; favs: Set<number>; onToggleFav: (id: number) => void;
}) {
  const isFav = favs.has(p.id);
  const pct   = active && totalSecs > 0 ? Math.min((elapsed / totalSecs) * 100, 100) : 0;

  return (
    <div onClick={onPlay}
      style={{ display:"flex", alignItems:"flex-start", gap:"12px", padding:"14px 16px", borderBottom:`1px solid ${BORDER}`, cursor:"pointer", background: active ? `${RED}06` : "transparent", transition:"background 0.12s" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#070707"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Cover */}
      <div style={{ width:"52px", height:"52px", borderRadius:"10px", background:`linear-gradient(135deg,hsl(${p.hue},50%,10%) 0%,hsl(${(p.hue+60)%360},58%,20%) 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0, position:"relative", overflow:"hidden" }}>
        🎙
        {active && playing && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.55)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Waveform active={true} color="#fff" height={16} bars={3} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"3px", flexWrap:"wrap" }}>
          <span style={{ background:`${RED}14`, border:`1px solid ${RED}25`, color:RED, fontSize:"9px", fontWeight:700, padding:"1px 6px", borderRadius:"3px" }}>{p.cat}</span>
          <span style={{ color:TEXT2, fontSize:"11px" }}>{p.show}</span>
        </div>
        <p style={{ margin:"0 0 3px", fontSize:"13px", fontWeight:700, color: active ? RED : TEXT, lineHeight:1.35 }}>{p.title}</p>
        <p style={{ margin:"0 0 5px", fontSize:"12px", color:TEXT2, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{p.description}</p>
        <div style={{ display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:"11px", color:TEXT2 }}>⏱ {p.duration}</span>
          <span style={{ fontSize:"11px", color:TEXT2 }}>▶ {fmtN(p.plays)}</span>
          <span style={{ fontSize:"11px", color:TEXT2 }}>· {p.date}</span>
          {active && <span style={{ fontSize:"11px", color:RED, fontWeight:700 }}>{fmtTime(elapsed)} / {p.duration}</span>}
        </div>
        {active && (
          <div style={{ marginTop:"6px", height:"2px", background:BORDER, borderRadius:"1px" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:RED, borderRadius:"1px", transition:"width 0.5s linear" }} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", flexShrink:0 }}>
        <button onClick={e => { e.stopPropagation(); onToggleFav(p.id); }}
          style={{ background:"none", border:"none", fontSize:"16px", cursor:"pointer", color: isFav ? GOLD : TEXT3, transition:"color 0.15s" }}
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          {isFav ? "★" : "☆"}
        </button>
        <div style={{ width:"32px", height:"32px", borderRadius:"50%", background: active ? `${RED}18` : SURFACE, border:`1px solid ${active ? RED : BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", color: active ? RED : TEXT2, transition:"all 0.15s" }}>
          {active && playing ? "⏸" : "▶"}
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
  const [podSearch, setPodSearch] = useState("");
  const [elapsed,   setElapsed]   = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [favs,      setFavs]      = useState<Set<number>>(new Set());
  const [recents,   setRecents]   = useState<number[]>([]);
  const [speed,     setSpeed]     = useState(1);
  const [volume,    setVolume]    = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const f  = JSON.parse(localStorage.getItem(FAV_KEY)    ?? "[]") as number[];
      setFavs(new Set(f));
      const r  = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as number[];
      setRecents(r);
      const sp = Number(localStorage.getItem(SPEED_KEY)  ?? "1");
      setSpeed(SPEEDS.includes(sp) ? sp : 1);
      const v  = Number(localStorage.getItem(VOLUME_KEY) ?? "100");
      setVolume(Math.min(100, Math.max(0, v)));
    } catch {}
  }, []);

  useEffect(() => {
    if (playing && now?.type === "podcast") {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= totalSecs - 1) { setPlaying(false); return totalSecs; }
          return e + 1;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [playing, now, totalSecs, speed]);

  const playStation = useCallback((s: Station) => {
    setNow({ type:"station", data:s });
    setElapsed(0); setTotalSecs(0); setPlaying(true);
  }, []);

  const playPodcast = useCallback((p: Podcast) => {
    setNow({ type:"podcast", data:p });
    setElapsed(0); setTotalSecs(parseDuration(p.duration)); setPlaying(true);
    setRecents(prev => {
      const next = [p.id, ...prev.filter(id => id !== p.id)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSeek        = (s: number) => setElapsed(Math.max(0, Math.min(totalSecs, s)));
  const handleSpeedChange = (s: number) => { setSpeed(s); localStorage.setItem(SPEED_KEY, String(s)); };
  const handleVolume      = (v: number) => { setVolume(v); localStorage.setItem(VOLUME_KEY, String(v)); };
  const togglePlay        = () => setPlaying(v => !v);
  const closePlayer       = () => { setNow(null); setPlaying(false); setElapsed(0); };

  const toggleFav = (id: number) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const isPlayingStation = (id: string) => playing && now?.type === "station" && (now.data as Station).id === id;
  const isPlayingPodcast = (id: number) => now?.type === "podcast" && (now.data as Podcast).id === id;

  const filteredPods = PODCASTS.filter(p =>
    (catFilter === "Tout" || p.cat === catFilter) &&
    (!podSearch || p.title.toLowerCase().includes(podSearch.toLowerCase()) || p.show.toLowerCase().includes(podSearch.toLowerCase()))
  );

  const recentPodcasts = recents.map(id => PODCASTS.find(p => p.id === id)).filter(Boolean) as Podcast[];
  const favPodcasts    = PODCASTS.filter(p => favs.has(p.id));

  return (
    <>
      <style>{`
        @keyframes rw1 { 0%{transform:scaleY(0.12)} 100%{transform:scaleY(0.9)} }
        @keyframes rw2 { 0%{transform:scaleY(0.5)}  100%{transform:scaleY(0.18)} }
        @keyframes rw3 { 0%{transform:scaleY(0.22)} 100%{transform:scaleY(1)} }
        @keyframes rw4 { 0%{transform:scaleY(0.75)} 100%{transform:scaleY(0.14)} }
        @keyframes rw5 { 0%{transform:scaleY(0.28)} 100%{transform:scaleY(0.85)} }
        @keyframes radio-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
      `}</style>

      <div style={{ background:BG, minHeight:"100vh", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT, display:"flex", flexDirection:"column" }}>

        {/* ── Header sticky ── */}
        <div style={{ position:"sticky", top:0, zIndex:50, background:`${BG}EE`, backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px", padding:"14px 16px 12px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", boxShadow:`0 3px 16px ${RED}55`, flexShrink:0 }}>📻</div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                <h1 style={{ margin:0, fontSize:"18px", fontWeight:900 }}>
                  <span style={{ color:RED }}>STENOGRAFT</span>{" "}<span style={{ color:TEXT }}>Radio</span>
                </h1>
                <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:`${RED}15`, border:`1px solid ${RED}30`, color:RED, fontSize:"9px", fontWeight:800, padding:"2px 7px", borderRadius:"4px", letterSpacing:"0.5px" }}>
                  <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:RED, animation:"radio-pulse 1.4s ease-in-out infinite", display:"inline-block" }} />
                  EN DIRECT
                </span>
              </div>
              <p style={{ margin:0, fontSize:"11px", color:TEXT2 }}>L'audio citoyen souverain</p>
            </div>
          </div>
        </div>

        <div style={{ flex:1, paddingBottom: now ? "0" : "80px" }}>

          {/* ── Featured station ── */}
          <div
            style={{ margin:"16px 16px 0", position:"relative", borderRadius:"18px", overflow:"hidden", background:`linear-gradient(125deg, hsl(${STATIONS[0].hue},45%,8%) 0%, hsl(${(STATIONS[0].hue+50)%360},55%,16%) 60%, hsl(${STATIONS[0].hue},38%,10%) 100%)`, border:`1px solid rgba(255,255,255,0.06)`, cursor:"pointer" }}
            onClick={() => isPlayingStation(STATIONS[0].id) ? togglePlay() : playStation(STATIONS[0])}
          >
            <div style={{ position:"absolute", inset:0, backgroundImage:"repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 4px)", pointerEvents:"none" }} />
            <div style={{ padding:"20px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"8px", marginBottom:"10px" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:"4px", background:RED, color:"#fff", fontSize:"9px", fontWeight:800, letterSpacing:"1px", padding:"3px 9px", borderRadius:"4px" }}>
                  <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fff", animation:"radio-pulse 1.3s ease-in-out infinite", display:"inline-block" }} />
                  DIRECT
                </span>
                <span style={{ background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", color:TEXT2, fontSize:"11px", fontWeight:600, padding:"2px 7px", borderRadius:"4px" }}>
                  👂 {fmtN(STATIONS[0].listeners)} auditeurs
                </span>
                <span style={{ marginLeft:"auto", background:"rgba(0,0,0,0.4)", color:TEXT2, fontSize:"10px", padding:"2px 7px", borderRadius:"4px" }}>
                  {STATIONS[0].freq} FM
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div style={{ fontSize:"36px", lineHeight:1 }}>{STATIONS[0].icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <h2 style={{ margin:"0 0 3px", fontSize:"18px", fontWeight:900, color:TEXT }}>{STATIONS[0].name}</h2>
                  <p style={{ margin:0, fontSize:"13px", color:"rgba(231,233,234,0.65)" }}>{STATIONS[0].live}</p>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <Waveform active={isPlayingStation(STATIONS[0].id)} color={RED} height={24} bars={5} />
                  <div style={{ width:"48px", height:"48px", borderRadius:"50%", background: isPlayingStation(STATIONS[0].id) ? "rgba(255,255,255,0.12)" : RED, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", boxShadow:`0 4px 20px ${RED}55`, transition:"background 0.2s", flexShrink:0 }}>
                    {isPlayingStation(STATIONS[0].id) && playing ? "⏸" : "▶"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Autres stations ── */}
          <section style={{ padding:"24px 16px 0" }}>
            <h2 style={{ margin:"0 0 10px", fontSize:"15px", fontWeight:800, color:TEXT }}>📡 Stations en direct</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              {STATIONS.slice(1).map(s => {
                const active = isPlayingStation(s.id);
                return (
                  <div key={s.id}
                    onClick={() => active ? togglePlay() : playStation(s)}
                    style={{ display:"flex", alignItems:"center", gap:"12px", padding:"11px 12px", borderRadius:"12px", cursor:"pointer", background: active ? `${RED}08` : "transparent", transition:"background 0.12s" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#080808"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width:"44px", height:"44px", borderRadius:"10px", background:`linear-gradient(135deg,hsl(${s.hue},50%,12%) 0%,hsl(${(s.hue+60)%360},60%,22%) 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", flexShrink:0 }}>{s.icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ margin:0, fontSize:"13px", fontWeight:700, color: active ? RED : TEXT }}>{s.name}</p>
                      <p style={{ margin:"2px 0 0", fontSize:"11px", color:TEXT2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{active ? s.live : s.tagline}</p>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px", flexShrink:0 }}>
                      <span style={{ color:TEXT2, fontSize:"10px" }}>{s.freq} FM</span>
                      {active
                        ? <Waveform active={playing} color={RED} height={14} bars={4} />
                        : <span style={{ color:TEXT2, fontSize:"10px" }}>👂 {fmtN(s.listeners)}</span>
                      }
                      <div style={{ width:"30px", height:"30px", borderRadius:"50%", background: active ? `${RED}18` : SURFACE, border:`1px solid ${active ? RED : BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", color: active ? RED : TEXT2, transition:"all 0.15s" }}>
                        {active && playing ? "⏸" : "▶"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Récemment écoutés ── */}
          {recentPodcasts.length > 0 && (
            <section style={{ padding:"24px 16px 0" }}>
              <h2 style={{ margin:"0 0 10px", fontSize:"15px", fontWeight:800, color:TEXT }}>🕐 Récemment écoutés</h2>
              <div style={{ display:"flex", gap:"10px", overflowX:"auto", paddingBottom:"4px" }}>
                {recentPodcasts.map(p => {
                  const active = isPlayingPodcast(p.id);
                  return (
                    <div key={p.id} onClick={() => active ? togglePlay() : playPodcast(p)}
                      style={{ flexShrink:0, width:"140px", background:SURFACE, border:`1px solid ${active ? RED : BORDER}`, borderRadius:"12px", overflow:"hidden", cursor:"pointer", transition:"border-color 0.15s" }}
                    >
                      <div style={{ width:"100%", height:"78px", background:`linear-gradient(135deg,hsl(${p.hue},50%,10%) 0%,hsl(${(p.hue+60)%360},58%,24%) 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"28px", position:"relative" }}>
                        🎙
                        {active && playing && (
                          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Waveform active={true} color="#fff" height={14} bars={3} />
                          </div>
                        )}
                      </div>
                      <div style={{ padding:"8px" }}>
                        <p style={{ margin:"0 0 2px", fontSize:"11px", fontWeight:700, color: active ? RED : TEXT, lineHeight:1.3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{p.title}</p>
                        <p style={{ margin:0, fontSize:"10px", color:TEXT2 }}>{p.duration}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Favoris ── */}
          {favPodcasts.length > 0 && (
            <section style={{ padding:"24px 16px 0" }}>
              <h2 style={{ margin:"0 0 2px", fontSize:"15px", fontWeight:800, color:TEXT }}>
                <span style={{ color:GOLD }}>★</span> Mes favoris
              </h2>
              {favPodcasts.map(p => (
                <PodcastCard key={p.id} p={p}
                  active={isPlayingPodcast(p.id)} playing={playing}
                  elapsed={isPlayingPodcast(p.id) ? elapsed : 0}
                  totalSecs={isPlayingPodcast(p.id) ? totalSecs : parseDuration(p.duration)}
                  onPlay={() => isPlayingPodcast(p.id) ? togglePlay() : playPodcast(p)}
                  favs={favs} onToggleFav={toggleFav}
                />
              ))}
            </section>
          )}

          {/* ── Podcasts ── */}
          <section style={{ padding:"24px 16px 0" }}>
            <h2 style={{ margin:"0 0 10px", fontSize:"15px", fontWeight:800, color:TEXT }}>🎙 Podcasts</h2>

            {/* Recherche */}
            <div style={{ position:"relative", marginBottom:"10px" }}>
              <span style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", pointerEvents:"none" }}>🔎</span>
              <input value={podSearch} onChange={e => setPodSearch(e.target.value)} placeholder="Chercher un podcast…"
                style={{ width:"100%", padding:"8px 36px 8px 30px", background:SURFACE, border:`1px solid ${BORDER}`, borderRadius:"100px", color:TEXT, fontSize:"12px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {podSearch && (
                <button onClick={() => setPodSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"16px", lineHeight:1 }}>×</button>
              )}
            </div>

            {/* Filtre catégorie */}
            <div style={{ display:"flex", gap:"6px", marginBottom:"6px", overflowX:"auto" }}>
              {(["Tout", ...POD_CATS] as const).map(c => {
                const on = catFilter === c;
                return (
                  <button key={c} onClick={() => setCatFilter(c as typeof catFilter)}
                    style={{ padding:"5px 13px", borderRadius:"100px", fontSize:"12px", fontWeight: on ? 700 : 500, background: on ? TEXT : "transparent", color: on ? BG : TEXT2, border: on ? "none" : `1px solid ${BORDER}`, cursor:"pointer", transition:"all 0.15s", flexShrink:0 }}
                  >{c}</button>
                );
              })}
            </div>

            {filteredPods.length === 0 ? (
              <div style={{ padding:"32px 0", textAlign:"center" }}>
                <p style={{ color:TEXT2, fontSize:"13px" }}>Aucun podcast pour cette recherche.</p>
                <button onClick={() => { setPodSearch(""); setCatFilter("Tout"); }} style={{ color:RED, background:"none", border:"none", fontSize:"12px", cursor:"pointer", fontWeight:600 }}>Effacer les filtres</button>
              </div>
            ) : (
              filteredPods.map(p => (
                <PodcastCard key={p.id} p={p}
                  active={isPlayingPodcast(p.id)} playing={playing}
                  elapsed={isPlayingPodcast(p.id) ? elapsed : 0}
                  totalSecs={isPlayingPodcast(p.id) ? totalSecs : parseDuration(p.duration)}
                  onPlay={() => isPlayingPodcast(p.id) ? togglePlay() : playPodcast(p)}
                  favs={favs} onToggleFav={toggleFav}
                />
              ))
            )}
          </section>

          <div style={{ height:"16px" }} />
        </div>

        {/* ── Player bar ── */}
        {now && (
          <NowPlayingBar
            now={now} playing={playing} onToggle={togglePlay} onClose={closePlayer}
            elapsed={elapsed} totalSecs={totalSecs} onSeek={handleSeek}
            speed={speed} onSpeedChange={handleSpeedChange}
            volume={volume} onVolume={handleVolume}
          />
        )}
      </div>
    </>
  );
}
