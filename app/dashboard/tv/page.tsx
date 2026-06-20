"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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

export const LIVE_STREAMS = [
  { id: 1, title: "Séance plénière — Assemblée Nationale", channel: "Assemblée Nationale", viewers: 3842, hue: 218, hue2: 248, tag: "Politique", elapsed: "2h14" },
  { id: 2, title: "Conseil de Paris — Budget municipal 2026", channel: "Territoires", viewers: 1204, hue: 142, hue2: 168, tag: "Territoires", elapsed: "47min" },
  { id: 3, title: "Audition — Commission des finances", channel: "Le Registre Live", viewers: 742, hue: 44, hue2: 28, tag: "Registre", elapsed: "1h03" },
];

const REPLAY_CATEGORIES = ["Politique", "Sport", "Culture", "Débat", "Économie"] as const;
type ReplayCat = typeof REPLAY_CATEGORIES[number];

const REPLAYS: Record<ReplayCat, { id: number; title: string; channel: string; views: number; hue: number; duration: string; date: string }[]> = {
  Politique: [
    { id: 10, title: "Discours de politique générale", channel: "Politique FR", views: 89_340, hue: 218, duration: "1:24:38", date: "il y a 2j" },
    { id: 11, title: "Souveraineté numérique française", channel: "Politique FR", views: 34_200, hue: 265, duration: "58:47", date: "il y a 5j" },
    { id: 12, title: "Débat présidentiel — archive 2022", channel: "Archives", views: 412_000, hue: 218, duration: "2:41:02", date: "il y a 4 ans" },
  ],
  Sport: [
    { id: 20, title: "Finale Coupe de France 2026", channel: "Sport FR", views: 520_000, hue: 100, duration: "2:03:44", date: "il y a 3j" },
    { id: 21, title: "Tour de France — Étape 14", channel: "Cyclisme FR", views: 98_400, hue: 60, duration: "4:12:00", date: "il y a 1sem" },
    { id: 22, title: "Roland-Garros — Demi-finales", channel: "Tennis FR", views: 240_000, hue: 28, duration: "3:58:10", date: "il y a 2sem" },
  ],
  Culture: [
    { id: 30, title: "Festival des arts citoyens — Paris 2026", channel: "Culture FR", views: 6_800, hue: 328, duration: "3:12:05", date: "il y a 1sem" },
    { id: 31, title: "Concert symphonique — Orchestre de Paris", channel: "Musique", views: 18_200, hue: 280, duration: "1:48:30", date: "il y a 3j" },
    { id: 32, title: "Exposition Louvre — Coulisses", channel: "Patrimoine", views: 44_100, hue: 38, duration: "52:14", date: "il y a 2j" },
  ],
  Débat: [
    { id: 40, title: "Grand débat — Laïcité et République", channel: "Débats FR", views: 76_800, hue: 0, duration: "1:35:22", date: "il y a 1j" },
    { id: 41, title: "Face-à-face — Economie vs Ecologie", channel: "Débats FR", views: 38_400, hue: 150, duration: "1:12:08", date: "il y a 4j" },
    { id: 42, title: "Table ronde — Intelligence artificielle souveraine", channel: "Tech FR", views: 29_000, hue: 200, duration: "58:44", date: "il y a 6j" },
  ],
  Économie: [
    { id: 50, title: "Conseil régional Bretagne — Transition énergétique", channel: "Territoires", views: 12_400, hue: 142, duration: "2:08:12", date: "il y a 3j" },
    { id: 51, title: "Budget 2026 — Analyse en direct", channel: "Économie FR", views: 55_700, hue: 50, duration: "1:22:18", date: "il y a 5j" },
    { id: 52, title: "PME françaises — Le grand tournant", channel: "Business FR", views: 8_200, hue: 32, duration: "46:30", date: "il y a 1sem" },
  ],
};

const TRENDING_TAGS = ["#AssembléeNationale", "#Budget2026", "#SouverainetéNumérique", "#Laïcité", "#ClimatFrance", "#SportFR", "#CultureCitoyenne"];

const RSS_NEWS = [
  { id: 1, title: "L'Assemblée vote le budget rectificatif 2026", source: "Le Registre", time: "il y a 12min" },
  { id: 2, title: "Souveraineté numérique : la France investit 2Md€", source: "Tech FR", time: "il y a 34min" },
  { id: 3, title: "Roland-Garros : victoire française en finale", source: "Sport FR", time: "il y a 1h" },
  { id: 4, title: "Conseil de Paris : nouveau plan mobilité voté", source: "Territoires", time: "il y a 1h20" },
  { id: 5, title: "Inflation : retour à 1.8% selon l'INSEE", source: "Économie FR", time: "il y a 2h" },
];

// ── LiveCard ──────────────────────────────────────────────────────────────────

type Heart = { id: number; x: number };

function LiveCard({ stream, featured }: { stream: typeof LIVE_STREAMS[0]; featured: boolean }) {
  const [hearts,  setHearts]  = useState<Heart[]>([]);
  const [viewers, setViewers] = useState(stream.viewers);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => {
      setViewers(v => Math.max(1, v + Math.floor(Math.random() * 9) - 4));
    }, 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (stream.viewers < 400) return;
    const freq = stream.viewers > 1500 ? 900 : 2200;
    const t = setInterval(() => {
      const n = stream.viewers > 1500 ? Math.ceil(Math.random() * 3) : 1;
      const batch: Heart[] = Array.from({ length: n }, (_, i) => ({
        id: Date.now() + i + Math.random(), x: 8 + Math.random() * 55,
      }));
      setHearts(prev => [...prev.slice(-18), ...batch]);
      const ids = new Set(batch.map(h => h.id));
      setTimeout(() => setHearts(prev => prev.filter(h => !ids.has(h.id))), 2400);
    }, freq + Math.random() * freq * 0.5);
    return () => clearInterval(t);
  }, [stream.viewers]);

  return (
    <div
      onClick={() => router.push(`/dashboard/tv/${stream.id}`)}
      style={{
        gridColumn: featured ? "span 2" : "span 1",
        position: "relative", borderRadius: "16px", overflow: "hidden",
        cursor: "pointer", aspectRatio: featured ? "16/7" : "16/9",
        background: `linear-gradient(125deg,hsl(${stream.hue},45%,7%) 0%,hsl(${stream.hue2},58%,15%) 55%,hsl(${stream.hue},38%,9%) 100%)`,
        border: "1px solid rgba(255,255,255,0.06)",
        animation: `live-bg ${4 + stream.id * 0.8}s ease-in-out infinite`,
        animationDelay: `${stream.id * 0.6}s`,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.018)"; e.currentTarget.style.boxShadow = "0 10px 36px rgba(0,0,0,0.65)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,0.05) 0px,rgba(0,0,0,0.05) 1px,transparent 1px,transparent 4px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", display: "flex", gap: "6px", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: RED, color: "#fff", fontSize: "11px", fontWeight: 800, letterSpacing: "1px", padding: "3px 9px", borderRadius: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff", animation: "live-dot 1.3s ease-in-out infinite" }} />LIVE
          </span>
          <span style={{ background: "rgba(0,0,0,0.68)", backdropFilter: "blur(6px)", color: TEXT, fontSize: "11px", fontWeight: 700, padding: "3px 9px", borderRadius: "4px" }}>👁 {fmtN(viewers)}</span>
        </div>
        <span style={{ background: "rgba(0,0,0,0.68)", backdropFilter: "blur(6px)", color: TEXT2, fontSize: "11px", padding: "3px 8px", borderRadius: "4px" }}>{stream.elapsed}</span>
      </div>
      {hearts.map(h => (
        <span key={h.id} style={{ position: "absolute", bottom: "68px", left: `${h.x}%`, fontSize: "20px", animation: "heart-rise 2.3s ease-out forwards", pointerEvents: "none", userSelect: "none" }}>❤️</span>
      ))}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 14px 14px", background: "linear-gradient(to top,rgba(0,0,0,0.92) 0%,transparent 100%)" }}>
        <p style={{ margin: "0 0 3px", fontSize: featured ? "17px" : "14px", fontWeight: 800, color: TEXT, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{stream.title}</p>
        <p style={{ margin: 0, fontSize: "12px", color: "rgba(231,233,234,0.65)" }}>{stream.channel}</p>
      </div>
    </div>
  );
}

// ── ReplayCard ────────────────────────────────────────────────────────────────

function ReplayCard({ item }: { item: { id: number; title: string; channel: string; views: number; hue: number; duration: string; date: string } }) {
  return (
    <div
      style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden", cursor: "pointer", transition: "transform 0.15s" }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={e => (e.currentTarget.style.transform = "none")}
    >
      <div style={{ position: "relative", aspectRatio: "16/9", background: `linear-gradient(135deg,hsl(${item.hue},40%,8%) 0%,hsl(${(item.hue + 60) % 360},50%,14%) 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <span style={{ color: "#fff", fontSize: "12px", marginLeft: "2px" }}>▶</span>
        </div>
        <div style={{ position: "absolute", bottom: "7px", right: "7px", background: "rgba(0,0,0,0.78)", borderRadius: "4px", padding: "2px 7px", fontSize: "11px", color: TEXT, fontWeight: 600 }}>{item.duration}</div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 700, color: TEXT, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.title}</p>
        <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>{item.channel}</p>
        <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
          <span style={{ fontSize: "11px", color: TEXT2 }}>👁 {fmtN(item.views)}</span>
          <span style={{ fontSize: "11px", color: TEXT2 }}>· {item.date}</span>
        </div>
      </div>
    </div>
  );
}

// ── ZappingPanel ──────────────────────────────────────────────────────────────

function ZappingPanel({ activeFilter, onFilter }: { activeFilter: ReplayCat | "Tous"; onFilter: (f: ReplayCat | "Tous") => void }) {
  const filters: (ReplayCat | "Tous")[] = ["Tous", ...REPLAY_CATEGORIES];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Filtres chaînes */}
      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, color: TEXT2, letterSpacing: "1.2px", textTransform: "uppercase" }}>Zapping</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {filters.map(f => (
            <button
              key={f}
              onClick={() => onFilter(f)}
              style={{
                padding: "9px 14px", borderRadius: "100px", border: "none", cursor: "pointer",
                background: activeFilter === f ? RED : "transparent",
                color: activeFilter === f ? "#fff" : TEXT2,
                fontSize: "13px", fontWeight: activeFilter === f ? 700 : 400,
                textAlign: "left", transition: "background 0.12s, color 0.12s",
              }}
              onMouseEnter={e => { if (activeFilter !== f) e.currentTarget.style.background = "#111"; }}
              onMouseLeave={e => { if (activeFilter !== f) e.currentTarget.style.background = "transparent"; }}
            >
              {f === "Tous" ? "🎛️ Tout afficher" : f === "Politique" ? "🏛️ " + f : f === "Sport" ? "⚽ " + f : f === "Culture" ? "🎭 " + f : f === "Débat" ? "🗣️ " + f : "📊 " + f}
            </button>
          ))}
        </div>
      </div>

      {/* Trending hashtags */}
      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, color: TEXT2, letterSpacing: "1.2px", textTransform: "uppercase" }}>Tendances TV</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {TRENDING_TAGS.map((tag, i) => (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 4px", borderRadius: "8px", cursor: "pointer" }}>
              <span style={{ fontSize: "11px", color: "#333", fontWeight: 700, width: "16px" }}>{i + 1}</span>
              <span style={{ fontSize: "13px", color: GOLD, fontWeight: 600 }}>{tag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actualités RSS */}
      <div>
        <h3 style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 800, color: TEXT2, letterSpacing: "1.2px", textTransform: "uppercase" }}>Actu en direct</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {RSS_NEWS.map(news => (
            <div key={news.id} style={{ padding: "10px 4px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer" }}>
              <p style={{ margin: "0 0 3px", fontSize: "12px", color: TEXT, lineHeight: 1.4, fontWeight: 500 }}>{news.title}</p>
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ fontSize: "10px", color: RED, fontWeight: 700 }}>{news.source}</span>
                <span style={{ fontSize: "10px", color: "#333" }}>· {news.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── LiveStartModal ────────────────────────────────────────────────────────────

const CHANNELS_LIST = ["Politique FR", "Territoires", "Le Registre Live", "Assemblée Nationale", "Conseils Régionaux"];

function LiveStartModal({ onClose }: { onClose: () => void }) {
  const [title,    setTitle]    = useState("");
  const [channel,  setChannel]  = useState(CHANNELS_LIST[0]);
  const [desc,     setDesc]     = useState("");
  const [camState, setCamState] = useState<"loading" | "ok" | "denied">("loading");
  const [launching, setLaunching] = useState(false);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router    = useRouter();

  useEffect(() => {
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then(s => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; setCamState("ok"); })
      .catch(() => setCamState("denied"));
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  const launch = async () => {
    if (!title.trim() || launching) return;
    setLaunching(true);
    await new Promise(r => setTimeout(r, 1300));
    streamRef.current?.getTracks().forEach(t => t.stop());
    onClose();
    router.push("/dashboard/tv/live");
  };

  const inputBase: React.CSSProperties = { width: "100%", background: "#0C0C0C", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "11px 14px", color: TEXT, fontSize: "15px", outline: "none", fontFamily: "inherit", resize: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 910, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "22px", width: "100%", maxWidth: "460px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: RED, animation: "live-dot 1.3s ease-in-out infinite" }} />
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: TEXT }}>Démarrer un Live</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", aspectRatio: "16/9", background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: camState === "ok" ? "block" : "none" }} />
            {camState === "loading" && <div style={{ textAlign: "center" }}><div style={{ fontSize: "36px", marginBottom: "8px" }}>📡</div><p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Connexion caméra…</p></div>}
            {camState === "denied"  && <div style={{ textAlign: "center" }}><div style={{ fontSize: "36px", marginBottom: "8px" }}>📷</div><p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Accès caméra refusé</p></div>}
            <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", alignItems: "center", gap: "5px", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", borderRadius: "6px", padding: "4px 10px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: camState === "ok" ? RED : TEXT2, animation: camState === "ok" ? "live-dot 1.3s ease-in-out infinite" : "none" }} />
              <span style={{ color: TEXT, fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px" }}>PRÉVISUALISATION</span>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT2, marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Titre du Live *</label>
            <input type="text" placeholder="Ex : Mon analyse du vote de ce soir" value={title} onChange={e => setTitle(e.target.value)} maxLength={80} style={inputBase} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT2, marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Chaîne</label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={{ ...inputBase, cursor: "pointer", appearance: "none" }}>
              {CHANNELS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: TEXT2, marginBottom: "6px", letterSpacing: "0.8px", textTransform: "uppercase" }}>Description (optionnel)</label>
            <textarea rows={2} placeholder="De quoi va parler ce live ?" value={desc} onChange={e => setDesc(e.target.value)} maxLength={200} style={inputBase} />
          </div>
          <button onClick={launch} disabled={!title.trim() || launching} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "15px 0", background: title.trim() && !launching ? RED : "#222", border: "none", borderRadius: "100px", color: "#fff", fontSize: "16px", fontWeight: 800, cursor: title.trim() && !launching ? "pointer" : "not-allowed", opacity: launching ? 0.72 : 1, boxShadow: title.trim() && !launching ? `0 4px 24px ${RED}55` : "none" }}>
            {launching ? <><span style={{ fontSize: "11px", animation: "live-dot 1s ease-in-out infinite" }}>●</span> Lancement en cours…</> : <>🔴 Lancer le Live</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TVPage() {
  const [showModal,     setShowModal]     = useState(false);
  const [activeFilter,  setActiveFilter]  = useState<ReplayCat | "Tous">("Tous");

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener("sg:start-live", handler);
    return () => window.removeEventListener("sg:start-live", handler);
  }, []);

  const visibleReplays = activeFilter === "Tous"
    ? (Object.values(REPLAYS).flat() as typeof REPLAYS[ReplayCat])
    : REPLAYS[activeFilter];

  return (
    <>
      <style>{`
        @keyframes live-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(.75)} }
        @keyframes heart-rise{ 0%{opacity:1;transform:translateY(0) scale(1) rotate(-8deg)} 30%{transform:translateY(-50px) scale(1.2) rotate(6deg)} 70%{opacity:.6;transform:translateY(-130px) scale(.85) rotate(-4deg)} 100%{opacity:0;transform:translateY(-200px) scale(.5) rotate(10deg)} }
        @keyframes live-bg   { 0%,100%{filter:brightness(1) saturate(1) hue-rotate(0deg)} 40%{filter:brightness(1.07) saturate(1.18) hue-rotate(6deg)} 70%{filter:brightness(.93) saturate(.92) hue-rotate(-5deg)} }
        *{box-sizing:border-box}
        .tv-layout{display:grid;grid-template-columns:1fr 280px;gap:0;align-items:start}
        .tv-zapping-desktop{display:block}
        .tv-zapping-mobile{display:none}
        @media(max-width:900px){
          .tv-layout{grid-template-columns:1fr}
          .tv-zapping-desktop{display:none}
          .tv-zapping-mobile{display:block}
        }
      `}</style>

      <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* ── Header ── */}
        <div style={{ padding: "18px 20px 16px", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50, background: `${BG}E8`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 3px 16px ${RED}55`, flexShrink: 0 }}>📺</div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 900, letterSpacing: "0.3px" }}>
                <span style={{ color: RED }}>STENO</span>{" "}<span style={{ color: TEXT }}>TV</span>
              </div>
              <div style={{ fontSize: "12px", color: TEXT2 }}>La télévision citoyenne souveraine</div>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: "flex", alignItems: "center", gap: "8px", background: RED, border: "none", borderRadius: "100px", padding: "11px 22px", color: "#fff", fontSize: "15px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 22px ${RED}55`, flexShrink: 0 }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#fff", animation: "live-dot 1.3s ease-in-out infinite" }} />
            Démarrer un Live
          </button>
        </div>

        {/* ── Layout principal ── */}
        <div className="tv-layout">

          {/* Colonne principale */}
          <div style={{ borderRight: `1px solid ${BORDER}`, minHeight: "100vh" }}>
            <div style={{ padding: "20px 20px 40px" }}>

              {/* Lives en cours */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: RED, animation: "live-dot 1.3s ease-in-out infinite" }} />
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT }}>Lives en cours</h2>
                <span style={{ color: TEXT2, fontSize: "13px" }}>· {LIVE_STREAMS.length} actifs</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "12px", marginBottom: "36px" }}>
                {LIVE_STREAMS.map((s, i) => <LiveCard key={s.id} stream={s} featured={i === 0} />)}
              </div>

              {/* Replays */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT }}>🎬 Replays</h2>
                {/* Filtres rapides mobile */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(["Tous", ...REPLAY_CATEGORIES] as (ReplayCat | "Tous")[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      style={{ padding: "5px 12px", borderRadius: "100px", border: `1px solid ${activeFilter === f ? RED : BORDER}`, background: activeFilter === f ? RED : "transparent", color: activeFilter === f ? "#fff" : TEXT2, fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.12s" }}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "12px" }}>
                {visibleReplays.map(item => <ReplayCard key={item.id} item={item} />)}
              </div>

              {/* Panneau zapping mobile */}
              <div className="tv-zapping-mobile" style={{ marginTop: "36px", padding: "20px", background: SURFACE, borderRadius: "16px", border: `1px solid ${BORDER}` }}>
                <ZappingPanel activeFilter={activeFilter} onFilter={setActiveFilter} />
              </div>

            </div>
          </div>

          {/* Panneau zapping desktop (sticky) */}
          <div className="tv-zapping-desktop" style={{ position: "sticky", top: "70px", maxHeight: "calc(100vh - 80px)", overflowY: "auto", scrollbarWidth: "none", padding: "20px 16px" }}>
            <ZappingPanel activeFilter={activeFilter} onFilter={setActiveFilter} />
          </div>

        </div>
      </div>

      {showModal && <LiveStartModal onClose={() => setShowModal(false)} />}
    </>
  );
}
