"use client";
import { useState, useEffect, useMemo, useCallback } from "react";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#3A3A3A";
const GREEN  = "#2ECC71";
const BLUE   = "#1D9BF0";

const VOTES_KEY   = "sg_sondage_votes";   // { [id]: optionIndex }
const CREATED_KEY = "sg_sondage_created"; // created poll ids

type Option = { label: string; count: number };
type Poll = {
  id:        string;
  question:  string;
  options:   Option[];
  author:    string;
  authorHue: number;
  cat:       string;
  createdAt: string;
  endsAt:    string;
  featured?: boolean;
  verified?: boolean;
};

type Filter = "Tous" | "Politique" | "Société" | "Économie" | "International" | "Environnement" | "Sport" | "Culture";
type SortKey = "recent" | "populaire" | "cloture";

const CATS: Filter[] = ["Tous","Politique","Société","Économie","International","Environnement","Sport","Culture"];
const CAT_COLOR: Record<string, string> = {
  Politique:     RED,
  Société:       BLUE,
  Économie:      GOLD,
  International: "#9B59B6",
  Environnement: GREEN,
  Sport:         "#E67E22",
  Culture:       "#F39C12",
};

// Dates relatives à maintenant
function daysFromNow(d: number): string {
  return new Date(Date.now() + d * 86400000).toISOString();
}
function daysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}

const POLLS_SEED: Poll[] = [
  {
    id:"p1", featured:true, verified:true,
    question:"Faites-vous confiance au gouvernement pour gérer l'inflation ?",
    options:[{label:"Oui, totalement",count:1240},{label:"Plutôt oui",count:2870},{label:"Plutôt non",count:5410},{label:"Non, pas du tout",count:8230}],
    author:"StenoGraft", authorHue:0, cat:"Politique",
    createdAt:daysAgo(2), endsAt:daysFromNow(5),
  },
  {
    id:"p2", verified:true,
    question:"Le travail du dimanche devrait-il être généralisé ?",
    options:[{label:"Oui",count:4120},{label:"Non",count:6340},{label:"Dans certains secteurs",count:3870}],
    author:"EcoWatch_FR", authorHue:40, cat:"Économie",
    createdAt:daysAgo(1), endsAt:daysFromNow(3),
  },
  {
    id:"p3",
    question:"Quel est le principal problème de la France aujourd'hui ?",
    options:[{label:"Le pouvoir d'achat",count:9120},{label:"La sécurité",count:6240},{label:"L'environnement",count:4310},{label:"L'immigration",count:5890}],
    author:"CivicDebate", authorHue:220, cat:"Société",
    createdAt:daysAgo(3), endsAt:daysFromNow(1),
  },
  {
    id:"p4",
    question:"La France devrait-elle rejoindre une armée européenne unifiée ?",
    options:[{label:"Oui, pleinement",count:3210},{label:"Partenariat mais souveraineté",count:5670},{label:"Non, armée nationale",count:4890}],
    author:"GeopolitiqueEU", authorHue:270, cat:"International",
    createdAt:daysAgo(4), endsAt:daysFromNow(2),
  },
  {
    id:"p5",
    question:"Êtes-vous favorable à la nucléarisation du mix énergétique français ?",
    options:[{label:"Oui, priorité nucléaire",count:7230},{label:"Mix nucléaire/renouvelable",count:8910},{label:"Non, 100% renouvelable",count:5120},{label:"Pas d'opinion",count:1340}],
    author:"EnergieDebat", authorHue:120, cat:"Environnement",
    createdAt:daysAgo(1), endsAt:daysFromNow(6),
  },
  {
    id:"p6",
    question:"Qui mérite le Ballon d'or français 2026 ?",
    options:[{label:"Mbappé",count:12400},{label:"Camavinga",count:5670},{label:"Tchouaméni",count:4210},{label:"Autre",count:2100}],
    author:"FootballFR", authorHue:30, cat:"Sport",
    createdAt:daysAgo(0), endsAt:daysFromNow(7),
  },
  {
    id:"p7",
    question:"Le cinéma français est-il en déclin ?",
    options:[{label:"Oui, clairement",count:3120},{label:"Non, il se transforme",count:6780},{label:"Difficile à dire",count:4230}],
    author:"CinemaCulture", authorHue:300, cat:"Culture",
    createdAt:daysAgo(2), endsAt:daysFromNow(4),
  },
  {
    id:"p8",
    question:"Faut-il instaurer un revenu universel en France ?",
    options:[{label:"Oui, pour tous",count:5340},{label:"Oui, sous conditions",count:7890},{label:"Non",count:6120},{label:"Je ne sais pas",count:1870}],
    author:"EcoSocial_FR", authorHue:160, cat:"Économie",
    createdAt:daysAgo(5), endsAt:daysFromNow(0),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function totalVotes(options: Option[]): number {
  return options.reduce((s, o) => s + o.count, 0);
}

function timeLeft(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Clôturé";
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${h}h restantes`;
  return `${Math.floor(h / 24)}j restants`;
}

function isClosed(endsAt: string): boolean {
  return new Date(endsAt).getTime() <= Date.now();
}

function relDate(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 120) return "à l'instant";
  if (s < 3600) return `il y a ${Math.floor(s/60)}min`;
  if (s < 86400) return `il y a ${Math.floor(s/3600)}h`;
  return `il y a ${Math.floor(s/86400)}j`;
}

function avatarGrad(hue: number): string {
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

function fakeHue(name: string): number {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  return Math.abs(h) % 360;
}

// ── PollCard ──────────────────────────────────────────────────────────────────

function PollCard({ poll, voted, onVote, onShare, isMobile }: {
  poll: Poll;
  voted: number | null;
  onVote: (optIdx: number) => void;
  onShare: () => void;
  isMobile?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const closed   = isClosed(poll.endsAt);
  const revealed = voted !== null || closed;
  const total    = totalVotes(poll.options) + (voted !== null ? 1 : 0);
  const catColor = CAT_COLOR[poll.cat] || TEXT2;
  const tl       = timeLeft(poll.endsAt);

  // Options with augmented count if user just voted
  const options = poll.options.map((o, i) => ({
    ...o,
    count: voted === i ? o.count + 1 : o.count,
  }));

  return (
    <div style={{ background:SURF, border:`1px solid ${poll.featured ? GOLD+"40" : BORDER}`, borderRadius:"16px", overflow:"hidden", marginBottom:"10px", boxShadow: poll.featured ? `0 4px 24px ${GOLD}0A` : "none" }}>

      {/* Featured banner */}
      {poll.featured && (
        <div style={{ background:`linear-gradient(90deg,${GOLD}18,transparent)`, borderBottom:`1px solid ${GOLD}20`, padding:"5px 14px", display:"flex", alignItems:"center", gap:"5px" }}>
          <span style={{ fontSize:"10px" }}>⭐</span>
          <span style={{ color:GOLD, fontSize:"10px", fontWeight:800, letterSpacing:"0.5px" }}>SONDAGE À LA UNE</span>
        </div>
      )}

      <div style={{ padding: isMobile ? "11px 12px" : "14px 16px" }}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"10px", marginBottom:"10px" }}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"5px", flexWrap:"wrap" }}>
              <div style={{ width:"20px", height:"20px", borderRadius:"50%", background:avatarGrad(poll.authorHue), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"8px", fontWeight:800, color:"#fff", flexShrink:0 }}>
                {poll.author[0]}
              </div>
              <span style={{ color:TEXT2, fontSize:"11px", fontWeight:600 }}>{poll.author}</span>
              {poll.verified && <span style={{ color:GOLD, fontSize:"9px", background:`${GOLD}15`, border:`1px solid ${GOLD}30`, borderRadius:"100px", padding:"1px 5px", fontWeight:700 }}>✓</span>}
              {!isMobile && <span style={{ color:TEXT3, fontSize:"10px" }}>· {relDate(poll.createdAt)}</span>}
            </div>
            <h3 style={{ color:TEXT, fontSize: isMobile ? "13px" : "15px", fontWeight:700, margin:0, lineHeight:1.45 }}>{poll.question}</h3>
          </div>
        </div>

        {/* Options */}
        <div style={{ display:"flex", flexDirection:"column", gap: isMobile ? "5px" : "7px", marginBottom:"10px" }}>
          {options.map((opt, i) => {
            const pct     = total > 0 ? Math.round((opt.count / total) * 100) : 0;
            const isVoted = voted === i;
            const isWinner= revealed && pct === Math.max(...options.map(o => total>0 ? Math.round((o.count/total)*100) : 0));
            const isHov   = hovered === i;

            return (
              <button
                key={i}
                onClick={() => !revealed && !closed && onVote(i)}
                onMouseEnter={() => !revealed && setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                disabled={revealed || closed}
                style={{
                  position:"relative", overflow:"hidden",
                  background:"transparent",
                  border:`1.5px solid ${isVoted ? RED : isWinner && revealed ? GOLD+"50" : isHov ? BORDER : BORDER}`,
                  borderRadius:"10px", padding: isMobile ? "8px 10px" : "10px 12px",
                  cursor: revealed || closed ? "default" : "pointer",
                  textAlign:"left", transition:"all 0.15s",
                }}
              >
                {/* Progress fill */}
                {revealed && (
                  <div style={{ position:"absolute", inset:0, borderRadius:"8px", background: isVoted ? `${RED}18` : isWinner ? `${GOLD}0C` : "#0d0d0d", width:`${pct}%`, transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)", zIndex:0 }} />
                )}
                <div style={{ position:"relative", zIndex:1, display:"flex", alignItems:"center", justifyContent:"space-between", gap:"8px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
                    {revealed ? (
                      <span style={{ fontSize:"12px" }}>{isVoted ? "✓" : isWinner ? "👑" : "·"}</span>
                    ) : (
                      <div style={{ width:"14px", height:"14px", borderRadius:"50%", border:`2px solid ${isHov ? RED : BORDER}`, background: isHov ? `${RED}20` : "transparent", transition:"all 0.12s", flexShrink:0 }} />
                    )}
                    <span style={{ color: isVoted ? "#fff" : TEXT, fontSize: isMobile ? "12px" : "13px", fontWeight: isVoted ? 700 : 500 }}>{opt.label}</span>
                  </div>
                  {revealed && (
                    <div style={{ display:"flex", alignItems:"center", gap:"6px", flexShrink:0 }}>
                      <span style={{ color: isVoted ? RED : isWinner ? GOLD : TEXT2, fontWeight:800, fontSize:"13px" }}>{pct}%</span>
                      {!isMobile && <span style={{ color:TEXT3, fontSize:"10px" }}>{opt.count.toLocaleString("fr-FR")}</span>}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:"6px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ background:catColor+"18", color:catColor, fontSize:"10px", fontWeight:700, padding:"2px 8px", borderRadius:"100px", border:`1px solid ${catColor}30` }}>
              {poll.cat}
            </span>
            <span style={{ color:TEXT2, fontSize:"11px" }}>
              {total.toLocaleString("fr-FR")} vote{total>1?"s":""}
            </span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <span style={{ color: closed ? TEXT3 : (tl.includes("0h") || tl.includes("1j") ? RED : TEXT2), fontSize:"11px", fontWeight: closed ? 400 : 600 }}>
              {closed ? "🔒" : `⏱ ${tl}`}
            </span>
            <button onClick={onShare} style={{ background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"16px", padding:"2px 4px" }} title="Partager">🔗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CreatePollModal ───────────────────────────────────────────────────────────

function CreatePollModal({ onClose, onCreate, isMobile }: { onClose: () => void; onCreate: (p: Poll) => void; isMobile?: boolean }) {
  const [question, setQuestion]     = useState("");
  const [options,  setOptions]      = useState(["","","",""]);
  const [cat,      setCat]          = useState<Filter>("Politique");
  const [duration, setDuration]     = useState(7);

  const valid = question.trim().length >= 10 && options.filter(o => o.trim()).length >= 2;

  const setOpt = (i: number, val: string) => setOptions(prev => prev.map((o,j) => j===i ? val : o));
  const addOpt = () => options.length < 6 && setOptions(prev => [...prev, ""]);
  const removeOpt = (i: number) => options.length > 2 && setOptions(prev => prev.filter((_,j) => j!==i));

  const handleCreate = () => {
    if (!valid) return;
    const validOpts = options.filter(o => o.trim()).map(label => ({ label, count: 0 }));
    const poll: Poll = {
      id:       `custom_${Date.now()}`,
      question: question.trim(),
      options:  validOpts,
      author:   "Moi",
      authorHue:fakeHue("moi"),
      cat,
      createdAt:new Date().toISOString(),
      endsAt:   daysFromNow(duration),
    };
    onCreate(poll);
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key==="Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inp: React.CSSProperties = { width:"100%", background:BG, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 13px", color:TEXT, fontSize:"13px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s", boxSizing:"border-box" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:200, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(8px)", display:"flex", alignItems: isMobile ? "flex-end" : "center", justifyContent:"center", padding: isMobile ? "0" : "20px" }}
      onClick={e => { if (e.target===e.currentTarget) onClose(); }}
    >
      <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderTop:`2px solid ${RED}`, borderRadius: isMobile ? "20px 20px 0 0" : "22px", padding: isMobile ? "20px 16px" : "26px", width:"100%", maxWidth: isMobile ? "100%" : "520px", maxHeight:"90vh", overflowY:"auto", scrollbarWidth:"none", paddingBottom: isMobile ? `calc(16px + env(safe-area-inset-bottom))` : "26px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"18px" }}>
          <div>
            <h2 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 3px" }}>Créer un sondage</h2>
            <p style={{ color:TEXT2, fontSize:"12px", margin:0 }}>Posez votre question à la communauté</p>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:TEXT2, fontSize:"22px", cursor:"pointer" }}>×</button>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          {/* Question */}
          <div>
            <label style={{ display:"block", color:GOLD, fontSize:"10px", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"6px" }}>Question *</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Quelle est votre question ?" rows={3}
              style={{ ...inp, resize:"vertical", lineHeight:1.6 }}
              onFocus={e => (e.currentTarget.style.borderColor = RED+"60")}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <div style={{ textAlign:"right", fontSize:"10px", color: question.length>=10 ? TEXT3 : TEXT2, marginTop:"3px" }}>{question.length} car.</div>
          </div>

          {/* Options */}
          <div>
            <label style={{ display:"block", color:GOLD, fontSize:"10px", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"6px" }}>Options * (min. 2, max. 6)</label>
            <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
              {options.map((opt, i) => (
                <div key={i} style={{ display:"flex", gap:"7px", alignItems:"center" }}>
                  <div style={{ width:"22px", height:"22px", borderRadius:"50%", border:`2px solid ${BORDER}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:TEXT2, flexShrink:0 }}>{i+1}</div>
                  <input value={opt} onChange={e => setOpt(i, e.target.value)} placeholder={`Option ${i+1}${i<2?" *":""}`}
                    style={{ ...inp, flex:1 }}
                    onFocus={e => (e.currentTarget.style.borderColor = RED+"60")}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                  {i >= 2 && (
                    <button onClick={() => removeOpt(i)} style={{ background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"18px", padding:"0 4px", flexShrink:0 }}>×</button>
                  )}
                </div>
              ))}
              {options.length < 6 && (
                <button onClick={addOpt} style={{ background:"none", border:`1px dashed ${BORDER}`, borderRadius:"10px", padding:"8px", color:TEXT2, fontSize:"12px", cursor:"pointer", fontFamily:"inherit" }}>
                  + Ajouter une option
                </button>
              )}
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label style={{ display:"block", color:GOLD, fontSize:"10px", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"6px" }}>Catégorie</label>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
              {CATS.filter(c => c!=="Tous").map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ padding:"5px 11px", borderRadius:"100px", fontSize:"11px", fontWeight:600, cursor:"pointer", border:`1px solid ${cat===c ? (CAT_COLOR[c]||BORDER) : BORDER}`, background: cat===c ? (CAT_COLOR[c]||BORDER)+"20" : "transparent", color: cat===c ? (CAT_COLOR[c]||TEXT) : TEXT2, transition:"all 0.12s" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Durée */}
          <div>
            <label style={{ display:"block", color:GOLD, fontSize:"10px", fontWeight:700, letterSpacing:"1px", textTransform:"uppercase", marginBottom:"6px" }}>Durée : {duration}j</label>
            <div style={{ display:"flex", gap:"6px" }}>
              {[1,3,7,14,30].map(d => (
                <button key={d} onClick={() => setDuration(d)} style={{ flex:1, padding:"7px 0", borderRadius:"8px", fontSize:"11px", fontWeight:600, cursor:"pointer", border:`1px solid ${duration===d ? RED : BORDER}`, background: duration===d ? `${RED}18` : "transparent", color: duration===d ? RED : TEXT2, transition:"all 0.12s" }}>
                  {d}j
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", gap:"10px", justifyContent:"flex-end", paddingTop:"4px" }}>
            <button onClick={onClose} style={{ background:"transparent", color:TEXT2, border:`1px solid ${BORDER}`, borderRadius:"10px", padding:"10px 18px", fontSize:"13px", fontWeight:600, cursor:"pointer" }}>Annuler</button>
            <button onClick={handleCreate} disabled={!valid} style={{ background: valid ? RED : "#1a1a1a", color: valid ? "#fff" : "#333", border:"none", borderRadius:"10px", padding:"10px 22px", fontSize:"13px", fontWeight:800, cursor: valid ? "pointer" : "not-allowed", boxShadow: valid ? `0 4px 16px ${RED}44` : "none" }}>
              Publier le sondage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SondagesPage() {
  const [polls,    setPolls]    = useState<Poll[]>(POLLS_SEED);
  const [votes,    setVotes]    = useState<Record<string,number>>({});
  const [filter,   setFilter]   = useState<Filter>("Tous");
  const [sort,     setSort]     = useState<SortKey>("recent");
  const [search,   setSearch]   = useState("");
  const [modal,    setModal]    = useState(false);
  const [toast,    setToast]    = useState<string|null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const [isMobile,   setIsMobile]   = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load votes from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(VOTES_KEY) || "{}");
      setVotes(saved);
    } catch {}
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleVote = useCallback((pollId: string, optIdx: number) => {
    if (votes[pollId] !== undefined) return;
    const next = { ...votes, [pollId]: optIdx };
    setVotes(next);
    try { localStorage.setItem(VOTES_KEY, JSON.stringify(next)); } catch {}
    setToast("Vote enregistré !");
  }, [votes]);

  const handleShare = useCallback((poll: Poll) => {
    const url  = `${window.location.origin}/dashboard/sondages#${poll.id}`;
    const text = `${poll.question} — Votez sur StenoGraft`;
    navigator.clipboard.writeText(`${text}\n${url}`).catch(()=>{});
    setToast("Lien copié !");
  }, []);

  const handleCreate = useCallback((p: Poll) => {
    setPolls(prev => [p, ...prev]);
    setToast("Sondage publié !");
    try {
      const ids = JSON.parse(localStorage.getItem(CREATED_KEY)||"[]");
      localStorage.setItem(CREATED_KEY, JSON.stringify([p.id, ...ids]));
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    let list = polls.filter(p => {
      const q       = search.toLowerCase();
      const matchS  = !q || p.question.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q);
      const matchF  = filter==="Tous" || p.cat===filter;
      const matchCl = showClosed || !isClosed(p.endsAt);
      return matchS && matchF && matchCl;
    });
    if (sort==="populaire") list = [...list].sort((a,b) => totalVotes(b.options)-totalVotes(a.options));
    else if (sort==="cloture") list = [...list].sort((a,b) => new Date(a.endsAt).getTime()-new Date(b.endsAt).getTime());
    else list = [...list].sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
    // Featured always first
    return [...list.filter(p=>p.featured), ...list.filter(p=>!p.featured)];
  }, [polls, filter, sort, search, showClosed]);

  const totalVotesAll = polls.reduce((s,p) => s + totalVotes(p.options), 0);
  const participated  = Object.keys(votes).length;
  const closedCount   = polls.filter(p => isClosed(p.endsAt)).length;
  const openCount     = polls.filter(p => !isClosed(p.endsAt)).length;

  return (
    <>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { display:none; } @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom: isMobile ? "110px" : "100px", left:"50%", transform:"translateX(-50%)", background:GOLD, color:"#000", fontSize:"13px", fontWeight:700, padding:"10px 20px", borderRadius:"100px", zIndex:500, pointerEvents:"none", boxShadow:"0 4px 20px rgba(0,0,0,0.5)", animation:"fadeUp 0.25s ease" }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:"700px", margin:"0 auto", paddingBottom: isMobile ? "110px" : "80px", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* Header sticky */}
        <div style={{ position:"sticky", top:0, zIndex:10, background:`${BG}EE`, backdropFilter:"blur(12px)", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 10px", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:`linear-gradient(135deg,#1a2e6b 0%,#2d4db5 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>📊</div>
              <div>
                <h1 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 1px" }}>Sondages</h1>
                <p style={{ color:TEXT2, fontSize:"11px", margin:0 }}>{openCount} en cours · {totalVotesAll.toLocaleString("fr-FR")} votes</p>
              </div>
            </div>
            <button onClick={() => setModal(true)} style={{ background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"8px 16px", fontSize:"12px", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 16px ${RED}44`, flexShrink:0 }}>
              + Sondage
            </button>
          </div>

          {/* Stats bar */}
          <div style={{ display:"flex", borderBottom:`1px solid ${BORDER}`, overflowX:"auto", scrollbarWidth:"none" }}>
            {[
              { label:"Sondages",   value:polls.length,                            mobileHide: false },
              { label:"Votes",      value:totalVotesAll.toLocaleString("fr-FR"),   mobileHide: false },
              { label:"Participés", value:participated,                             mobileHide: false },
              { label:"En cours",   value:openCount,                               mobileHide: false },
              { label:"Clôturés",   value:closedCount,                             mobileHide: true  },
            ].filter(s => !isMobile || !s.mobileHide).map(s => (
              <div key={s.label} style={{ flex:1, padding: isMobile ? "7px 10px" : "9px 12px", textAlign:"center", minWidth:"60px", borderRight:`1px solid ${BORDER}` }}>
                <div style={{ color:TEXT, fontWeight:800, fontSize: isMobile ? "13px" : "15px" }}>{s.value}</div>
                <div style={{ color:TEXT2, fontSize:"9px" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ padding:"8px 16px 0" }}>
            <div style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", pointerEvents:"none" }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Chercher un sondage…"
                style={{ width:"100%", padding:"8px 36px 8px 33px", background:SURF, border:`1px solid ${BORDER}`, borderRadius:"100px", color:TEXT, fontSize:"12px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = BLUE+"60")}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"15px" }}>×</button>}
            </div>
          </div>

          {/* Filtres catégorie */}
          <div style={{ display:"flex", gap:"5px", padding:"8px 16px 10px", overflowX:"auto", scrollbarWidth:"none" }}>
            {CATS.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)} style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"10px", fontWeight:600, cursor:"pointer", flexShrink:0, border:`1px solid ${filter===cat ? (CAT_COLOR[cat]||RED) : BORDER}`, background: filter===cat ? `${CAT_COLOR[cat]||RED}18` : "transparent", color: filter===cat ? (CAT_COLOR[cat]||RED) : TEXT2, transition:"all 0.12s" }}>
                {cat}
              </button>
            ))}
            <div style={{ width:"1px", height:"16px", background:BORDER, flexShrink:0, alignSelf:"center" }} />
            {/* Sort */}
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"8px", color:TEXT2, fontSize:"10px", padding:"3px 7px", outline:"none", cursor:"pointer", flexShrink:0 }}>
              <option value="recent">Récents</option>
              <option value="populaire">Populaires</option>
              <option value="cloture">Clôture proche</option>
            </select>
            {/* Toggle clôturés */}
            <button onClick={() => setShowClosed(v => !v)} style={{ padding:"4px 10px", borderRadius:"100px", fontSize:"10px", fontWeight:600, cursor:"pointer", flexShrink:0, border:`1px solid ${showClosed ? TEXT2 : BORDER}`, background: showClosed ? BORDER : "transparent", color: showClosed ? TEXT : TEXT2, transition:"all 0.12s" }}>
              🔒 Clôturés
            </button>
          </div>
        </div>

        <div style={{ padding:"12px 16px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <span style={{ fontSize:"48px" }}>📊</span>
              <p style={{ color:TEXT, fontSize:"16px", fontWeight:800, margin:"12px 0 6px" }}>Aucun sondage trouvé</p>
              <p style={{ color:TEXT2, fontSize:"12px", margin:"0 0 16px" }}>Essayez d'autres filtres ou créez le vôtre.</p>
              <button onClick={() => setModal(true)} style={{ background:RED, color:"#fff", border:"none", borderRadius:"100px", padding:"10px 22px", fontSize:"13px", fontWeight:800, cursor:"pointer", boxShadow:`0 4px 16px ${RED}44` }}>
                + Créer un sondage
              </button>
            </div>
          ) : (
            filtered.map(poll => (
              <PollCard
                key={poll.id}
                poll={poll}
                voted={votes[poll.id] !== undefined ? votes[poll.id] : null}
                onVote={idx => handleVote(poll.id, idx)}
                onShare={() => handleShare(poll)}
                isMobile={isMobile}
              />
            ))
          )}
        </div>
      </div>

      {modal && <CreatePollModal onClose={() => setModal(false)} onCreate={handleCreate} isMobile={isMobile} />}
    </>
  );
}
