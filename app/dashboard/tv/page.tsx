"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const SURF2  = "#0F0F0F";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#2A2A2A";
const GREEN  = "#2ECC71";
const BLUE   = "#1D9BF0";

const WATCH_KEY = "sg_tv_watch";

type Cat = "Tout" | "Politique" | "Sport" | "Culture" | "Débat" | "Économie";
const CATS: Cat[] = ["Tout", "Politique", "Sport", "Culture", "Débat", "Économie"];

const CAT_COLOR: Record<string, string> = {
  Politique: RED,
  Sport:     "#E67E22",
  Culture:   "#9B59B6",
  Débat:     GOLD,
  Économie:  GREEN,
};

type Platform = "STENO";
const PLATFORM_COLOR: Record<Platform, string> = {
  STENO: "#E0492F",
};
const PLATFORM_ICON: Record<Platform, string> = {
  STENO: "◉",
};

type Live = {
  id:        string;
  title:     string;
  author:    string;
  authorHue: number;
  cat:       Cat;
  platform:  Platform;
  viewers:   number;
  thumb:     string; // gradient description for fake thumb
  startedAt: string;
  verified?: boolean;
};

type Replay = {
  id:        string;
  title:     string;
  author:    string;
  authorHue: number;
  cat:       Cat;
  platform:  Platform;
  views:     number;
  duration:  string;
  thumb:     string;
  publishedAt:string;
};

type NewsItem = { title: string; source: string; time: string; cat: Cat };
type HashTag  = { tag: string; count: number; cat: Cat };

// ── Seed data ──────────────────────────────────────────────────────────────────

const LIVES: Live[] = [
  { id:"l1", title:"Débat : La réforme des retraites 5 ans après", author:"PoliDebat_FR", authorHue:0,   cat:"Débat",    platform:"STENO",   viewers:8420,  thumb:"0,30%,6%,320,60%,14%", startedAt:new Date(Date.now()-5400000).toISOString(), verified:true },
  { id:"l2", title:"Ligue 1 Live : PSG vs OM — Analyse tactique", author:"FootballFR",  authorHue:30,  cat:"Sport",    platform:"STENO",    viewers:23100, thumb:"30,50%,6%,60,60%,14%",  startedAt:new Date(Date.now()-3600000).toISOString() },
  { id:"l3", title:"Cryptomonnaies & budget 2027 : décryptage",   author:"EcoWatch_FR", authorHue:120, cat:"Économie", platform:"STENO",      viewers:3870,  thumb:"120,40%,6%,160,55%,14%",startedAt:new Date(Date.now()-7200000).toISOString() },
  { id:"l4", title:"Festival Avignon : performances en direct",   author:"CultureLive",  authorHue:280, cat:"Culture",  platform:"STENO",viewers:1240,  thumb:"280,45%,6%,320,60%,14%",startedAt:new Date(Date.now()-1800000).toISOString() },
  { id:"l5", title:"Conseil municipal de Marseille — séance",     author:"MarseilleTV",  authorHue:200, cat:"Politique",platform:"STENO",   viewers:540,   thumb:"200,40%,6%,240,55%,14%",startedAt:new Date(Date.now()-9000000).toISOString(), verified:true },
];

const REPLAYS: Replay[] = [
  { id:"r1", title:"Grand débat national : synthèse exclusive",       author:"PoliDebat_FR", authorHue:0,   cat:"Débat",    platform:"STENO",   views:142000, duration:"1:24:07", thumb:"0,30%,8%,340,55%,20%",   publishedAt:new Date(Date.now()-86400000).toISOString() },
  { id:"r2", title:"Finale Coupe de France 2026 — buts & réactions", author:"FootballFR",  authorHue:30,  cat:"Sport",    platform:"STENO",    views:87400,  duration:"2:01:33", thumb:"30,50%,8%,60,60%,20%",   publishedAt:new Date(Date.now()-172800000).toISOString() },
  { id:"r3", title:"Budget 2027 : les mesures qui vont tout changer", author:"EcoWatch_FR", authorHue:120, cat:"Économie", platform:"STENO",   views:56200,  duration:"48:12",   thumb:"120,40%,8%,160,55%,20%", publishedAt:new Date(Date.now()-259200000).toISOString() },
  { id:"r4", title:"César 2026 — meilleur film & surprises",          author:"CultureLive",  authorHue:280, cat:"Culture",  platform:"STENO",views:34100,  duration:"3:12:45", thumb:"280,45%,8%,320,60%,20%", publishedAt:new Date(Date.now()-345600000).toISOString() },
  { id:"r5", title:"Discours du Premier ministre — réaction live",    author:"PoliDebat_FR", authorHue:0,   cat:"Politique",platform:"STENO",   views:201000, duration:"52:38",   thumb:"350,35%,8%,20,55%,20%",  publishedAt:new Date(Date.now()-432000000).toISOString(), },
  { id:"r6", title:"Rugby XV de France — recap tour du monde",        author:"SportNation",  authorHue:50,  cat:"Sport",    platform:"STENO",      views:29300,  duration:"1:08:22", thumb:"50,50%,8%,80,60%,20%",   publishedAt:new Date(Date.now()-518400000).toISOString() },
  { id:"r7", title:"Inflation & pouvoir d'achat : le vrai bilan",     author:"EcoWatch_FR",  authorHue:120, cat:"Économie", platform:"STENO",   views:73800,  duration:"35:54",   thumb:"120,45%,8%,150,55%,20%", publishedAt:new Date(Date.now()-604800000).toISOString() },
  { id:"r8", title:"Musique française : les nouveaux talents 2026",   author:"CultureLive",  authorHue:300, cat:"Culture",  platform:"STENO",    views:18700,  duration:"58:17",   thumb:"300,40%,8%,330,60%,20%", publishedAt:new Date(Date.now()-691200000).toISOString() },
];

const NEWS: NewsItem[] = [
  { title:"Vote de confiance au Parlement ce soir", source:"Le Monde",    time:"il y a 12min", cat:"Politique" },
  { title:"Euro 2026 : la France qualifiée",         source:"L'Équipe",   time:"il y a 28min", cat:"Sport" },
  { title:"CAC 40 en baisse de 1,3% à la clôture",  source:"Les Échos",  time:"il y a 35min", cat:"Économie" },
  { title:"Cannes 2026 : Palme d'or française",      source:"Libération", time:"il y a 1h",    cat:"Culture" },
  { title:"Réforme fiscale : le projet dévoilé",     source:"Le Figaro",  time:"il y a 1h15",  cat:"Économie" },
  { title:"Sécheresse : 23 départements en alerte",  source:"France Info",time:"il y a 2h",    cat:"Politique" },
  { title:"Ligue 1 : mercato d'été en ébullition",   source:"L'Équipe",   time:"il y a 2h30",  cat:"Sport" },
  { title:"Intelligence artificielle : loi votée",   source:"Le Monde",   time:"il y a 3h",    cat:"Politique" },
];

const HASHTAGS: HashTag[] = [
  { tag:"#Retraites",    count:42800, cat:"Politique" },
  { tag:"#Ligue1",       count:31200, cat:"Sport"     },
  { tag:"#Budget2027",   count:28700, cat:"Économie"  },
  { tag:"#Cannes2026",   count:19400, cat:"Culture"   },
  { tag:"#PouvoirAchat", count:17600, cat:"Économie"  },
  { tag:"#ElectionEU",   count:14300, cat:"Politique" },
  { tag:"#Sécheresse",   count:11200, cat:"Politique" },
  { tag:"#EDF",          count:8900,  cat:"Économie"  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function thumbGrad(thumb: string): string {
  const [h1, s1, l1, h2, s2, l2] = thumb.split(",");
  return `linear-gradient(135deg,hsl(${h1},${s1},${l1}) 0%,hsl(${h2},${s2},${l2}) 100%)`;
}

function avatarGrad(hue: number): string {
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

function fmtViewers(n: number): string {
  return n >= 1000 ? `${(n/1000).toFixed(1).replace(".0","")}k` : String(n);
}

function fmtViews(n: number): string {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${Math.round(n/1000)}k`;
  return String(n);
}

function elapsed(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s/60)}min`;
  return `${Math.floor(s/3600)}h${Math.floor((s%3600)/60).toString().padStart(2,"0")}`;
}

function relDate(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return "hier";
  return `il y a ${d}j`;
}

// ── PlatformBadge ─────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: Platform }) {
  const col = PLATFORM_COLOR[platform];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"3px", background:`${col}18`, color:col, border:`1px solid ${col}30`, borderRadius:"100px", padding:"1px 7px", fontSize:"9px", fontWeight:800, flexShrink:0 }}>
      {PLATFORM_ICON[platform]} {platform}
    </span>
  );
}

// ── LiveCard ──────────────────────────────────────────────────────────────────

function LiveCard({ live }: { live: Live }) {
  const [hov, setHov] = useState(false);
  const catColor = CAT_COLOR[live.cat] || TEXT2;

  const handleClick = () => {
    try {
      const history = JSON.parse(localStorage.getItem(WATCH_KEY)||"[]") as string[];
      const next = [live.id, ...history.filter(id => id!==live.id)].slice(0,20);
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <Link href={`/dashboard/tv/${live.id}`} onClick={handleClick} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ background:SURF, border:`1px solid ${hov ? RED+"40" : BORDER}`, borderRadius:"14px", overflow:"hidden", transition:"border-color 0.15s, transform 0.15s, box-shadow 0.15s", transform: hov ? "translateY(-2px)" : "none", boxShadow: hov ? `0 8px 28px rgba(224,73,47,0.12)` : "none" }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      >
        {/* Thumbnail */}
        <div style={{ position:"relative", width:"100%", paddingTop:"56.25%", background:thumbGrad(live.thumb), overflow:"hidden" }}>
          {/* Play overlay */}
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", alignItems:"center", justifyContent:"center", opacity: hov ? 1 : 0, transition:"opacity 0.15s" }}>
            <div style={{ width:"44px", height:"44px", borderRadius:"50%", background:`${RED}CC`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>▶</div>
          </div>
          {/* LIVE badge */}
          <div style={{ position:"absolute", top:"8px", left:"8px", display:"flex", alignItems:"center", gap:"4px", background:RED, borderRadius:"4px", padding:"2px 7px" }}>
            <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#fff", display:"inline-block", animation:"pulse 1.2s infinite" }} />
            <span style={{ color:"#fff", fontSize:"9px", fontWeight:800 }}>LIVE</span>
          </div>
          {/* Viewers */}
          <div style={{ position:"absolute", bottom:"8px", right:"8px", background:"rgba(0,0,0,0.75)", borderRadius:"4px", padding:"2px 7px" }}>
            <span style={{ color:"#fff", fontSize:"10px", fontWeight:700 }}>👁 {fmtViewers(live.viewers)}</span>
          </div>
          {/* Elapsed */}
          <div style={{ position:"absolute", bottom:"8px", left:"8px", background:"rgba(0,0,0,0.75)", borderRadius:"4px", padding:"2px 7px" }}>
            <span style={{ color:"#fff", fontSize:"10px" }}>{elapsed(live.startedAt)}</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding:"10px 12px 12px" }}>
          <p style={{ color:TEXT, fontSize:"13px", fontWeight:700, margin:"0 0 5px", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>
            {live.title}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"6px", flexWrap:"wrap" }}>
            <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:avatarGrad(live.authorHue), flexShrink:0 }} />
            <span style={{ color:TEXT2, fontSize:"11px" }}>{live.author}</span>
            {live.verified && <span style={{ color:GOLD, fontSize:"9px" }}>✓</span>}
            <span style={{ color:catColor, fontSize:"9px", fontWeight:700, marginLeft:"auto", background:`${catColor}15`, border:`1px solid ${catColor}30`, borderRadius:"100px", padding:"1px 6px" }}>{live.cat}</span>
          </div>
          <div style={{ marginTop:"6px" }}>
            <PlatformBadge platform={live.platform} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── ReplayCard ────────────────────────────────────────────────────────────────

function ReplayCard({ replay }: { replay: Replay }) {
  const [hov, setHov] = useState(false);
  const catColor = CAT_COLOR[replay.cat] || TEXT2;

  const handleClick = () => {
    try {
      const history = JSON.parse(localStorage.getItem(WATCH_KEY)||"[]") as string[];
      const next = [replay.id, ...history.filter(id => id!==replay.id)].slice(0,20);
      localStorage.setItem(WATCH_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <Link href={`/dashboard/tv/${replay.id}`} onClick={handleClick} style={{ textDecoration:"none", display:"block" }}>
      <div style={{ background:SURF, border:`1px solid ${hov ? GOLD+"30" : BORDER}`, borderRadius:"12px", overflow:"hidden", transition:"all 0.15s", transform: hov ? "translateY(-2px)" : "none" }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      >
        {/* Thumb */}
        <div style={{ position:"relative", width:"100%", paddingTop:"56.25%", background:thumbGrad(replay.thumb), overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.2)", display:"flex", alignItems:"center", justifyContent:"center", opacity: hov ? 1 : 0, transition:"opacity 0.15s" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px" }}>▶</div>
          </div>
          {/* Duration */}
          <div style={{ position:"absolute", bottom:"6px", right:"6px", background:"rgba(0,0,0,0.8)", borderRadius:"4px", padding:"2px 6px" }}>
            <span style={{ color:"#fff", fontSize:"9px", fontWeight:700 }}>{replay.duration}</span>
          </div>
          {/* Cat */}
          <div style={{ position:"absolute", top:"6px", left:"6px", background:`${catColor}CC`, borderRadius:"4px", padding:"1px 6px" }}>
            <span style={{ color:"#fff", fontSize:"8px", fontWeight:800 }}>{replay.cat}</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding:"8px 10px 10px" }}>
          <p style={{ color:TEXT, fontSize:"12px", fontWeight:600, margin:"0 0 4px", lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>
            {replay.title}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"5px", flexWrap:"wrap" }}>
            <span style={{ color:TEXT2, fontSize:"10px" }}>{replay.author}</span>
            <span style={{ color:TEXT3, fontSize:"10px" }}>·</span>
            <span style={{ color:TEXT2, fontSize:"10px" }}>{fmtViews(replay.views)} vues</span>
            <span style={{ color:TEXT3, fontSize:"10px" }}>·</span>
            <span style={{ color:TEXT2, fontSize:"10px" }}>{relDate(replay.publishedAt)}</span>
          </div>
          <div style={{ marginTop:"5px" }}>
            <PlatformBadge platform={replay.platform} />
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── ZappingPanel ──────────────────────────────────────────────────────────────

function ZappingPanel({ catFilter, onCatFilter }: { catFilter: Cat; onCatFilter: (c: Cat) => void }) {
  const [newsFilter, setNewsFilter] = useState<Cat>("Tout");
  const [tick, setTick] = useState(0);

  // Simulate live updates
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const filteredNews = newsFilter === "Tout" ? NEWS : NEWS.filter(n => n.cat === newsFilter);
  const filteredTags = catFilter === "Tout" ? HASHTAGS : HASHTAGS.filter(h => h.cat === catFilter);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"0" }}>
      {/* Header */}
      <div style={{ padding:"12px 14px 10px", borderBottom:`1px solid ${BORDER}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
          <span style={{ fontSize:"14px" }}>⚡</span>
          <span style={{ color:TEXT, fontSize:"14px", fontWeight:800 }}>Zapping</span>
          <span style={{ marginLeft:"auto", width:"6px", height:"6px", borderRadius:"50%", background:GREEN, boxShadow:`0 0 6px ${GREEN}` }} />
        </div>
      </div>

      {/* Filtres news */}
      <div style={{ padding:"8px 10px", borderBottom:`1px solid ${BORDER}`, display:"flex", gap:"4px", flexWrap:"wrap" }}>
        {(["Tout","Politique","Sport","Économie","Culture"] as Cat[]).map(c => (
          <button key={c} onClick={() => setNewsFilter(c)} style={{ padding:"2px 8px", borderRadius:"100px", fontSize:"9px", fontWeight:600, cursor:"pointer", border:`1px solid ${newsFilter===c ? (CAT_COLOR[c]||GOLD) : BORDER}`, background: newsFilter===c ? `${CAT_COLOR[c]||GOLD}18` : "transparent", color: newsFilter===c ? (CAT_COLOR[c]||GOLD) : TEXT2, transition:"all 0.12s" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Actualités */}
      <div style={{ borderBottom:`1px solid ${BORDER}` }}>
        <p style={{ color:TEXT3, fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", padding:"8px 14px 4px", margin:0 }}>Actus RSS</p>
        {filteredNews.map((news, i) => (
          <div key={i} style={{ padding:"8px 14px", borderTop: i>0 ? `1px solid ${BORDER}` : "none", cursor:"pointer", transition:"background 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <p style={{ color:TEXT, fontSize:"11px", fontWeight:600, margin:"0 0 3px", lineHeight:1.4 }}>{news.title}</p>
            <div style={{ display:"flex", gap:"5px" }}>
              <span style={{ color:CAT_COLOR[news.cat]||RED, fontSize:"9px", fontWeight:700 }}>{news.source}</span>
              <span style={{ color:TEXT3, fontSize:"9px" }}>· {news.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Trending hashtags */}
      <div style={{ padding:"8px 14px 12px" }}>
        <p style={{ color:TEXT3, fontSize:"9px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.8px", margin:"0 0 8px" }}>Tendances</p>
        <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
          {(filteredTags.length > 0 ? filteredTags : HASHTAGS).slice(0,6).map((ht, i) => (
            <div key={ht.tag} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <span style={{ color:TEXT3, fontSize:"9px", fontWeight:800, width:"14px" }}>#{i+1}</span>
              <div style={{ flex:1 }}>
                <button onClick={() => onCatFilter(ht.cat)} style={{ background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left" }}>
                  <span style={{ color:BLUE, fontSize:"11px", fontWeight:700 }}>{ht.tag}</span>
                </button>
                <div style={{ display:"flex", alignItems:"center", gap:"4px", marginTop:"1px" }}>
                  <div style={{ flex:1, height:"2px", borderRadius:"1px", background:BORDER, overflow:"hidden" }}>
                    <div style={{ height:"100%", background:`${BLUE}60`, width:`${Math.round((ht.count/HASHTAGS[0].count)*100)}%`, borderRadius:"1px" }} />
                  </div>
                  <span style={{ color:TEXT3, fontSize:"9px" }}>{fmtViews(ht.count)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TVPage() {
  const [cat,         setCat]         = useState<Cat>("Tout");
  const [zappingOpen, setZappingOpen] = useState(false);
  const [isMobile,    setIsMobile]    = useState(false);
  const [continueWatching, setContinueWatching] = useState<(Live|Replay)[]>([]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load continue watching
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem(WATCH_KEY)||"[]") as string[];
      const all: (Live|Replay)[] = [...LIVES, ...REPLAYS];
      const watched = history.map(id => all.find(x => x.id===id)).filter(Boolean) as (Live|Replay)[];
      setContinueWatching(watched.slice(0,4));
    } catch {}
  }, []);

  const filterItem = useCallback((item: { cat: Cat }) => cat === "Tout" || item.cat === cat, [cat]);

  const filteredLives   = LIVES.filter(filterItem);
  const filteredReplays = REPLAYS.filter(filterItem);

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes slideUp { from { transform:translateY(100%); } to { transform:none; } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      `}</style>

      <div style={{ maxWidth:"1200px", margin:"0 auto", paddingBottom: isMobile ? "140px" : "80px", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* Sticky header */}
        <div style={{ position:"sticky", top:0, zIndex:20, background:`${BG}EE`, backdropFilter:"blur(14px)", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px 10px", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              {/* Logo STENO TV */}
              <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                <div style={{ width:"36px", height:"36px", borderRadius:"10px", background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", boxShadow:`0 2px 12px ${RED}55` }}>📺</div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
                    <span style={{ color:TEXT, fontSize:"18px", fontWeight:900, letterSpacing:"-0.5px" }}>STENO</span>
                    <span style={{ color:RED, fontSize:"18px", fontWeight:900, letterSpacing:"-0.5px" }}>TV</span>
                  </div>
                  <p style={{ color:TEXT2, fontSize:"10px", margin:0 }}>
                    {LIVES.length} live{LIVES.length>1?"s":""} en cours · {REPLAYS.length} replays
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:"8px", alignItems:"center", flexShrink:0 }}>
              <Link href="/dashboard/live" style={{ textDecoration:"none" }}>
                <button style={{ display:"flex", alignItems:"center", gap:"6px", background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"8px 16px", fontSize:"12px", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 16px ${RED}55` }}>
                  <span style={{ width:"7px", height:"7px", borderRadius:"50%", background:"#fff", display:"inline-block", animation:"pulse 1.2s infinite" }} />
                  🔴 Démarrer un live
                </button>
              </Link>
            </div>
          </div>

          {/* Filtres catégories */}
          <div style={{ display:"flex", gap:"5px", padding:"0 16px 10px", overflowX:"auto", scrollbarWidth:"none" }}>
            {CATS.map(c => {
              const col = CAT_COLOR[c] || RED;
              return (
                <button key={c} onClick={() => setCat(c)} style={{ padding:"5px 13px", borderRadius:"100px", fontSize:"11px", fontWeight:600, cursor:"pointer", flexShrink:0, border:`1px solid ${cat===c ? col : BORDER}`, background: cat===c ? `${col}20` : "transparent", color: cat===c ? col : TEXT2, transition:"all 0.12s" }}>
                  {c}
                </button>
              );
            })}
            {isMobile && (
              <button onClick={() => setZappingOpen(v => !v)} style={{ marginLeft:"auto", padding:"5px 12px", borderRadius:"100px", fontSize:"11px", fontWeight:700, cursor:"pointer", flexShrink:0, border:`1px solid ${zappingOpen ? GOLD+"50" : BORDER}`, background: zappingOpen ? `${GOLD}15` : "transparent", color: zappingOpen ? GOLD : TEXT2 }}>
                ⚡ Zapping
              </button>
            )}
          </div>
        </div>

        {/* Layout desktop : content + sidebar */}
        <div style={{ display:"flex", gap:"0", alignItems:"flex-start" }}>

          {/* Main content */}
          <div style={{ flex:1, minWidth:0, padding:"14px 16px" }}>

            {/* Continue watching */}
            {continueWatching.length > 0 && (
              <div style={{ marginBottom:"24px" }}>
                <h2 style={{ color:TEXT, fontSize:"14px", fontWeight:800, margin:"0 0 10px", display:"flex", alignItems:"center", gap:"7px" }}>
                  <span>▶</span> Continuer à regarder
                </h2>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"8px" }}>
                  {continueWatching.map(item =>
                    "viewers" in item
                      ? <LiveCard key={item.id} live={item as Live} />
                      : <ReplayCard key={item.id} replay={item as Replay} />
                  )}
                </div>
              </div>
            )}

            {/* Lives en cours */}
            <div style={{ marginBottom:"28px" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                <h2 style={{ color:TEXT, fontSize:"16px", fontWeight:900, margin:0, display:"flex", alignItems:"center", gap:"8px" }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:"4px" }}>
                    <span style={{ width:"8px", height:"8px", borderRadius:"50%", background:RED, display:"inline-block", animation:"pulse 1.2s infinite" }} />
                    <span style={{ color:RED }}>Lives en cours</span>
                  </span>
                </h2>
                <span style={{ color:TEXT2, fontSize:"11px" }}>{filteredLives.length} live{filteredLives.length>1?"s":""}</span>
              </div>

              {filteredLives.length === 0 ? (
                <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"40px 20px", textAlign:"center" }}>
                  <span style={{ fontSize:"36px" }}>📺</span>
                  <p style={{ color:TEXT2, fontSize:"13px", margin:"10px 0 0" }}>Aucun live en cours pour cette catégorie.</p>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"12px" }}>
                  {filteredLives.map(live => <LiveCard key={live.id} live={live} />)}
                </div>
              )}
            </div>

            {/* Replays */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"12px" }}>
                <h2 style={{ color:TEXT, fontSize:"16px", fontWeight:900, margin:0 }}>
                  🎬 Replays
                </h2>
                <span style={{ color:TEXT2, fontSize:"11px" }}>{filteredReplays.length} vidéo{filteredReplays.length>1?"s":""}</span>
              </div>

              {filteredReplays.length === 0 ? (
                <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"40px 20px", textAlign:"center" }}>
                  <p style={{ color:TEXT2, fontSize:"13px", margin:0 }}>Aucun replay pour cette catégorie.</p>
                </div>
              ) : (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:"10px" }}>
                  {filteredReplays.map(replay => <ReplayCard key={replay.id} replay={replay} />)}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Zapping (desktop sticky) */}
          {!isMobile && (
            <div style={{ width:"280px", flexShrink:0, position:"sticky", top:"102px", height:"calc(100vh - 110px)", overflowY:"auto", scrollbarWidth:"none", borderLeft:`1px solid ${BORDER}`, background:SURF2 }}>
              <ZappingPanel catFilter={cat} onCatFilter={setCat} />
            </div>
          )}
        </div>

        {/* Mobile Zapping collapsible */}
        {isMobile && zappingOpen && (
          <div style={{ position:"fixed", bottom:"72px", left:0, right:0, zIndex:50, background:SURF, border:`1px solid ${BORDER}`, borderTop:`2px solid ${GOLD}`, borderRadius:"20px 20px 0 0", maxHeight:"60vh", overflowY:"auto", scrollbarWidth:"none", animation:"slideUp 0.25s ease" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:`1px solid ${BORDER}` }}>
              <span style={{ color:GOLD, fontSize:"14px", fontWeight:800 }}>⚡ Zapping</span>
              <button onClick={() => setZappingOpen(false)} style={{ background:"none", border:"none", color:TEXT2, fontSize:"20px", cursor:"pointer" }}>×</button>
            </div>
            <ZappingPanel catFilter={cat} onCatFilter={(c) => { setCat(c); setZappingOpen(false); }} />
          </div>
        )}
      </div>
    </>
  );
}
