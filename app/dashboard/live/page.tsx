'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const BG     = '#000000';
const SURF   = '#0A0A0A';
const SURF2  = '#0F0F0F';
const BORDER = '#1C1C1C';
const RED    = '#E0492F';
const GOLD   = '#C9A24B';
const TEXT   = '#E7E9EA';
const TEXT2  = '#71767B';
const TEXT3  = '#2A2A2A';
const GREEN  = '#2ECC71';
const BLUE   = '#1D9BF0';

// ── Constants ────────────────────────────────────────────────────────────────

const PLATFORMS = [
  { id:'steno', label:'STENO Live', icon:'S', color:RED, rtmp:'rtmp://live.stenograft.fr/stream', desc:'Diffusion native STENO' },
];

const CATS = ['Politique','Sport','Culture','Débat','Économie','Local','Environnement','Autre'];

const CAT_COLOR: Record<string,string> = {
  Politique:RED, Sport:'#E67E22', Culture:'#9B59B6', Débat:GOLD,
  Économie:GREEN, Local:BLUE, Environnement:'#27AE60', Autre:TEXT2,
};

const CAT_HUE: Record<string, [number,number]> = {
  Politique:[0,20], Sport:[30,60], Culture:[280,320], Débat:[40,60],
  Économie:[120,160], Local:[200,240], Environnement:[100,140], Autre:[220,260],
};

type Tab = 'hub' | 'mes-lives' | 'planifier' | 'parametres';

// ── DB type ───────────────────────────────────────────────────────────────────

type LiveSession = {
  id: string;
  room_id: string;
  user_id: string | null;
  username: string;
  title: string;
  category: string;
  platform: string;
  status: 'live' | 'ended';
  viewers_count: number;
  peak_viewers: number;
  super_chats_total: number;
  started_at: string;
  ended_at: string | null;
};

type ScheduledLive = {
  id: string; title: string; scheduledAt: string; cat: string; platform: string; notified: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function usernameHue(name: string): number {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  return Math.abs(h) % 360;
}
function avatarGrad(hue: number) {
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}
function categoryThumb(cat: string) {
  const [h1, h2] = CAT_HUE[cat] ?? [220, 260];
  return `linear-gradient(135deg,hsl(${h1},40%,8%) 0%,hsl(${h2},55%,18%) 100%)`;
}
function fmtV(n: number) { return n >= 1000 ? `${(n/1000).toFixed(1).replace('.0','')}k` : String(n); }
function elapsed(iso: string) {
  const s = Math.floor((Date.now()-new Date(iso).getTime())/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60).toString().padStart(2,'0');
  return h > 0 ? `${h}h${m}` : `${m}min`;
}
function fmtDuration(started: string, ended: string | null): string {
  if (!ended) return 'En cours';
  const s = Math.floor((new Date(ended).getTime() - new Date(started).getTime()) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}
function schedDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR',{ weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' });
}

// ── StartLiveModal ────────────────────────────────────────────────────────────

function StartLiveModal({ username, userId, isMobile, onClose }: {
  username: string; userId: string | null; isMobile: boolean; onClose: () => void;
}) {
  const router = useRouter();
  const [step,      setStep]      = useState<1|2|3>(1);
  const [platform,  setPlatform]  = useState('steno');
  const [title,     setTitle]     = useState('');
  const [cat,       setCat]       = useState('Politique');
  const [streamKey, setStreamKey] = useState('');
  const [showKey,   setShowKey]   = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    if (step === 2) setTimeout(() => titleRef.current?.focus(), 50);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  const roomIdRef = useRef('');
  if (!roomIdRef.current) roomIdRef.current = `${username}_${Date.now()}`.slice(0, 40);
  const roomId = roomIdRef.current;
  const plat   = PLATFORMS.find(p => p.id === platform)!;

  const startLive = async () => {
    if (!title.trim() || loading) return;
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: dbErr } = await supabase.from('live_sessions').insert({
      room_id:  roomId,
      user_id:  userId ?? null,
      username,
      title:    title.trim(),
      category: cat,
      platform,
      status:   'live',
    });

    if (dbErr) {
      setError('Erreur lors du démarrage. Réessayez.');
      setLoading(false);
      return;
    }

    router.push(`/dashboard/live/${encodeURIComponent(roomId)}?title=${encodeURIComponent(title)}&platform=${platform}&cat=${encodeURIComponent(cat)}`);
  };

  const inp: React.CSSProperties = { width:'100%', background:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'10px 13px', color:TEXT, fontSize:'13px', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', color:GOLD, fontSize:'10px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'6px' };

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:400, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(10px)', display:'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent:'center', padding: isMobile ? '0' : '20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderTop:`2px solid ${RED}`, borderRadius: isMobile ? '20px 20px 0 0' : '22px', width:'100%', maxWidth: isMobile ? '100%' : '520px', maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none', paddingBottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : '0' }}>

        {/* Modal header */}
        <div style={{ padding: isMobile ? '16px 18px 12px' : '20px 22px 16px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', boxShadow:`0 2px 12px ${RED}55` }}>🔴</div>
            <div>
              <h2 style={{ color:TEXT, fontSize: isMobile ? '14px' : '16px', fontWeight:900, margin:'0 0 2px' }}>Démarrer un Live</h2>
              <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>Étape {step}/3</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:TEXT2, fontSize:'22px', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Steps bar */}
        <div style={{ display:'flex', height:'3px', background:BORDER }}>
          <div style={{ width:`${(step/3)*100}%`, background:RED, transition:'width 0.3s ease', borderRadius:'0 2px 2px 0' }} />
        </div>

        <div style={{ padding: isMobile ? '16px 18px 18px' : '20px 22px 22px' }}>

          {/* Step 1 — Plateforme (STENO Live uniquement, on saute direct à l'étape 2) */}
          {step === 1 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', padding: isMobile ? '10px 12px' : '14px 16px', borderRadius:'14px', border:`1.5px solid ${RED}60`, background:`${RED}10`, marginBottom:'16px' }}>
                <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:`${RED}20`, border:`1px solid ${RED}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', color:RED, flexShrink:0, fontWeight:900 }}>S</div>
                <div>
                  <p style={{ color:TEXT, fontSize:'14px', fontWeight:800, margin:'0 0 2px' }}>STENO Live</p>
                  <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>Diffusion native · rtmp://live.stenograft.fr/stream</p>
                </div>
              </div>
              <button onClick={() => setStep(2)} style={{ width:'100%', padding:'12px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}44` }}>
                Continuer →
              </button>
            </div>
          )}

          {/* Step 2 — Configuration */}
          {step === 2 && (
            <div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'16px' }}>
                <div>
                  <label style={lbl}>Titre du live *</label>
                  <input ref={titleRef} value={title} onChange={e => setTitle(e.target.value.slice(0,100))} placeholder="Ex : Débat sur la réforme fiscale 2027…"
                    style={inp} onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                  <div style={{ textAlign:'right', fontSize:'10px', color:TEXT3, marginTop:'3px' }}>{title.length}/100</div>
                </div>

                <div>
                  <label style={lbl}>Catégorie</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                    {CATS.map(c => {
                      const col = CAT_COLOR[c]||TEXT2;
                      return (
                        <button key={c} onClick={() => setCat(c)} style={{ padding:'4px 10px', borderRadius:'100px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:`1px solid ${cat===c ? col : BORDER}`, background: cat===c ? `${col}18` : 'transparent', color: cat===c ? col : TEXT2, transition:'all 0.12s' }}>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {platform !== 'steno' && (
                  <div>
                    <label style={lbl}>Clé de stream</label>
                    <div style={{ position:'relative' }}>
                      <input value={streamKey} onChange={e=>setStreamKey(e.target.value)} placeholder={`Clé ${plat.label}…`} type={showKey?'text':'password'}
                        style={{ ...inp, paddingRight:'44px' }} onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                      <button onClick={() => setShowKey(v=>!v)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:TEXT2, cursor:'pointer', fontSize:'14px' }}>
                        {showKey ? '🙈' : '👁'}
                      </button>
                    </div>
                    <div style={{ background:SURF2, borderRadius:'8px', padding:'8px 11px', marginTop:'6px' }}>
                      <p style={{ color:TEXT3, fontSize:'10px', margin:'0 0 3px', fontWeight:700 }}>URL RTMP</p>
                      <code style={{ color:GOLD, fontSize:'10px', fontFamily:'monospace', wordBreak:'break-all' }}>{plat.rtmp}</code>
                    </div>
                    <p style={{ color:TEXT3, fontSize:'10px', margin:'5px 0 0' }}>🔒 Clé non stockée côté serveur.</p>
                  </div>
                )}
              </div>
              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setStep(1)} style={{ flex:1, padding:'11px', borderRadius:'12px', background:'transparent', border:`1px solid ${BORDER}`, color:TEXT2, fontSize:'13px', cursor:'pointer' }}>← Retour</button>
                <button onClick={() => setStep(3)} disabled={!title.trim()} style={{ flex:2, padding:'11px', borderRadius:'12px', background:title.trim()?RED:'#1a1a1a', border:'none', color:title.trim()?'#fff':TEXT3, fontSize:'13px', fontWeight:800, cursor:title.trim()?'pointer':'not-allowed', boxShadow:title.trim()?`0 4px 20px ${RED}44`:'none' }}>
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Lancement */}
          {step === 3 && (
            <div>
              <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:'14px', padding: isMobile ? '12px' : '16px', marginBottom:'12px' }}>
                <p style={{ color:GOLD, fontSize:'9px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 10px' }}>Récapitulatif</p>
                {[
                  { label:'Titre',      value:title },
                  { label:'Plateforme', value:plat.label },
                  { label:'Catégorie',  value:cat },
                  { label:'Diffuseur',  value:`@${username}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${BORDER}` }}>
                    <span style={{ color:TEXT2, fontSize:'12px' }}>{label}</span>
                    <span style={{ color:TEXT, fontSize:'12px', fontWeight:700 }}>{value}</span>
                  </div>
                ))}
              </div>

              {platform !== 'steno' && !isMobile && (
                <div style={{ background:SURF2, border:`1px solid ${BORDER}`, borderRadius:'12px', padding:'12px', marginBottom:'14px' }}>
                  <p style={{ color:TEXT2, fontSize:'11px', fontWeight:700, margin:'0 0 5px' }}>📡 Instructions OBS / StreamYard</p>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:'0 0 4px' }}>1. Ouvrez votre logiciel de streaming</p>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:'0 0 4px' }}>2. Entrez l'URL RTMP : <code style={{ color:GOLD, fontSize:'9px' }}>{plat.rtmp}</code></p>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:0 }}>3. Collez votre clé de stream et démarrez</p>
                </div>
              )}

              <div style={{ background:`${RED}08`, border:`1px solid ${RED}20`, borderRadius:'10px', padding:'10px 12px', marginBottom:'14px', display:'flex', gap:'8px' }}>
                <span style={{ fontSize:'14px', flexShrink:0 }}>⚠️</span>
                <p style={{ color:TEXT2, fontSize:'11px', lineHeight:1.6, margin:0 }}>
                  En démarrant, vous acceptez la <span style={{ color:RED, fontWeight:600 }}>charte éditoriale</span> STENOGRAFT.
                </p>
              </div>

              {error && (
                <div style={{ background:`${RED}15`, border:`1px solid ${RED}30`, borderRadius:'8px', padding:'10px 14px', marginBottom:'12px' }}>
                  <p style={{ color:RED, fontSize:'12px', margin:0 }}>{error}</p>
                </div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setStep(2)} style={{ flex:1, padding:'11px', borderRadius:'12px', background:'transparent', border:`1px solid ${BORDER}`, color:TEXT2, fontSize:'13px', cursor:'pointer' }}>← Modifier</button>
                <button onClick={startLive} disabled={loading} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'14px', fontWeight:800, cursor:loading?'not-allowed':'pointer', boxShadow:`0 4px 24px ${RED}55` }}>
                  <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                  {loading ? 'Démarrage…' : '🔴 Lancer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── LiveCard ──────────────────────────────────────────────────────────────────

function CommunityLiveCard({ live, isMobile }: { live: LiveSession; isMobile: boolean }) {
  const platColor = PLATFORMS.find(p=>p.id===live.platform)?.color || RED;
  const platIcon  = PLATFORMS.find(p=>p.id===live.platform)?.icon  || '▶';
  const platLabel = PLATFORMS.find(p=>p.id===live.platform)?.label || live.platform;
  const catColor  = CAT_COLOR[live.category] || TEXT2;
  const hue       = usernameHue(live.username);
  return (
    <Link href={`/dashboard/live/${encodeURIComponent(live.room_id)}?title=${encodeURIComponent(live.title)}&platform=${live.platform}&cat=${encodeURIComponent(live.category)}`} style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', overflow:'hidden', transition:'all 0.15s' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor=RED+'40';e.currentTarget.style.transform='translateY(-2px)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor=BORDER;e.currentTarget.style.transform='none';}}
      >
        <div style={{ position:'relative', width:'100%', paddingTop:'56.25%', background:categoryThumb(live.category) }}>
          <div style={{ position:'absolute', top:'6px', left:'6px', display:'flex', alignItems:'center', gap:'3px', background:RED, borderRadius:'4px', padding:'2px 6px' }}>
            <span style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
            <span style={{ color:'#fff', fontSize:'8px', fontWeight:800 }}>LIVE</span>
          </div>
          <div style={{ position:'absolute', bottom:'6px', right:'6px', background:'rgba(0,0,0,0.75)', borderRadius:'4px', padding:'2px 6px' }}>
            <span style={{ color:'#fff', fontSize:'9px', fontWeight:700 }}>👁 {fmtV(live.viewers_count)}</span>
          </div>
          <div style={{ position:'absolute', bottom:'6px', left:'6px', background:'rgba(0,0,0,0.75)', borderRadius:'4px', padding:'2px 6px' }}>
            <span style={{ color:'#fff', fontSize:'9px' }}>{elapsed(live.started_at)}</span>
          </div>
        </div>
        <div style={{ padding: isMobile ? '8px 10px 10px' : '10px 12px 12px' }}>
          <p style={{ color:TEXT, fontSize: isMobile ? '12px' : '13px', fontWeight:700, margin:`0 0 ${isMobile?'4px':'5px'}`, lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>{live.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
            <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:avatarGrad(hue), flexShrink:0 }} />
            <span style={{ color:TEXT2, fontSize:'10px' }}>@{live.username}</span>
            <span style={{ color:catColor, fontSize:'8px', fontWeight:700, marginLeft:'auto', background:`${catColor}15`, border:`1px solid ${catColor}25`, borderRadius:'100px', padding:'1px 5px' }}>{live.category}</span>
          </div>
          {!isMobile && (
            <div style={{ marginTop:'5px' }}>
              <span style={{ fontSize:'9px', color:platColor, background:`${platColor}15`, border:`1px solid ${platColor}25`, borderRadius:'100px', padding:'1px 7px', fontWeight:700 }}>
                {platIcon} {platLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const [tab,           setTab]           = useState<Tab>('hub');
  const [modal,         setModal]         = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const [username,      setUsername]      = useState('Grafter');
  const [userId,        setUserId]        = useState<string|null>(null);
  const [communityLives,setCommunityLives]= useState<LiveSession[]>([]);
  const [myPastLives,   setMyPastLives]   = useState<LiveSession[]>([]);
  const [livesLoading,  setLivesLoading]  = useState(true);
  const [scheduled,     setScheduled]     = useState<ScheduledLive[]>([]);
  const [schTitle,      setSchTitle]      = useState('');
  const [schCat,        setSchCat]        = useState('Politique');
  const [schDate,       setSchDate]       = useState('');
  const [schPlat,       setSchPlat]       = useState('youtube');
  const [toast,         setToast]         = useState<string|null>(null);
  const [qualite,       setQualite]       = useState<'720p'|'1080p'|'4K'>('1080p');
  const [autoRecord,    setAutoRecord]    = useState(true);
  const [superChat,     setSuperChat]     = useState(true);
  const [pseudonym,     setPseudonym]     = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Fetch auth + live sessions
  useEffect(() => {
    const sb = createClient();
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { data: { user } } = await sb.auth.getUser();
      const uname = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Grafter';
      setUsername(uname);
      setPseudonym(uname);
      setUserId(user?.id ?? null);

      const { data: hub } = await sb.from('live_sessions')
        .select('*')
        .eq('status', 'live')
        .order('viewers_count', { ascending: false })
        .limit(20);
      setCommunityLives((hub ?? []) as LiveSession[]);

      if (user) {
        const { data: mine } = await sb.from('live_sessions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'ended')
          .order('started_at', { ascending: false })
          .limit(30);
        setMyPastLives((mine ?? []) as LiveSession[]);
      }
      setLivesLoading(false);

      const channel = sb.channel('live-hub')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, async () => {
          const { data: fresh } = await sb.from('live_sessions')
            .select('*').eq('status', 'live')
            .order('viewers_count', { ascending: false }).limit(20);
          setCommunityLives((fresh ?? []) as LiveSession[]);
        })
        .subscribe();

      cleanup = () => { sb.removeChannel(channel); };
    };

    init();
    return () => { cleanup?.(); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const addScheduled = () => {
    if (!schTitle.trim() || !schDate) return;
    setScheduled(prev => [...prev, { id:`sc_${Date.now()}`, title:schTitle.trim(), scheduledAt:new Date(schDate).toISOString(), cat:schCat, platform:schPlat, notified:false }]);
    setSchTitle(''); setSchDate('');
    setToast('Live planifié ✓');
  };

  const removeScheduled = (id: string) => setScheduled(prev => prev.filter(s => s.id!==id));

  const totalPeak       = myPastLives.reduce((s,b) => s+b.peak_viewers, 0);
  const totalSuperChats = myPastLives.reduce((s,b) => s+b.super_chats_total, 0);

  const inp: React.CSSProperties = { width:'100%', background:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'10px 13px', color:TEXT, fontSize:'12px', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', color:GOLD, fontSize:'10px', fontWeight:700, letterSpacing:'0.8px', textTransform:'uppercase', marginBottom:'5px' };

  // Tab labels: emoji-only on mobile to fit 4 tabs
  const TABS: [Tab, string, string][] = [
    ['hub',        '🏠 Hub',        '🏠'],
    ['mes-lives',  '📊 Mes lives',  '📊'],
    ['planifier',  '📅 Planifier',  '📅'],
    ['parametres', '⚙️ Paramètres', '⚙️'],
  ];

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        @keyframes sg-pulse { 0%,100%{opacity:1;}50%{opacity:0.3;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }
      `}</style>

      {toast && (
        <div style={{ position:'fixed', bottom: isMobile ? '110px' : '90px', left:'50%', transform:'translateX(-50%)', background:GOLD, color:'#000', fontSize:'13px', fontWeight:700, padding:'10px 20px', borderRadius:'100px', zIndex:500, pointerEvents:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', animation:'fadeUp 0.25s ease' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:'700px', margin:'0 auto', paddingBottom: isMobile ? '110px' : '80px', fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* ── Sticky header ── */}
        <div style={{ position:'sticky', top:0, zIndex:10, background:`${BG}EE`, backdropFilter:'blur(14px)', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '10px 12px 8px' : '14px 16px 10px', gap:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '8px' : '10px' }}>
              <div style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px', borderRadius:'10px', background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? '14px' : '18px', boxShadow:`0 2px 14px ${RED}55`, flexShrink:0 }}>🔴</div>
              <div>
                <h1 style={{ color:TEXT, fontSize: isMobile ? '15px' : '18px', fontWeight:900, margin:'0 0 1px', letterSpacing:'-0.3px' }}>STENO Live</h1>
                {!isMobile && (
                  <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>
                    {communityLives.length > 0
                      ? <><span style={{ color:RED, fontWeight:700 }}>{communityLives.length}</span> lives en cours</>
                      : 'Aucun live en cours'
                    }
                    {myPastLives.length > 0 && ` · ${myPastLives.length} broadcasts`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setModal(true)}
              style={{ display:'flex', alignItems:'center', gap:'6px', background:RED, color:'#fff', border:'none', borderRadius:'100px', padding: isMobile ? '8px 12px' : '9px 18px', fontSize: isMobile ? '12px' : '13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}55`, flexShrink:0 }}
            >
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
              {isMobile ? '🔴 Live' : '🔴 Aller en live'}
            </button>
          </div>

          <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}` }}>
            {TABS.map(([key, label, short]) => (
              <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding: isMobile ? '9px 4px' : '11px 6px', background:'none', border:'none', borderBottom:`2px solid ${tab===key ? RED : 'transparent'}`, color: tab===key ? TEXT : TEXT2, fontSize: isMobile ? '13px' : '12px', fontWeight: tab===key ? 700 : 400, cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap' }}>
                {isMobile ? short : label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: isMobile ? '12px' : '14px 16px' }}>

          {/* ══════════════════════ HUB ══════════════════════ */}
          {tab === 'hub' && (
            <div>
              {/* Hero CTA */}
              <div style={{ background:`linear-gradient(135deg,#1a0505 0%,#2d0808 50%,#0a0000 100%)`, border:`1px solid ${RED}25`, borderRadius:'18px', padding: isMobile ? '16px' : '24px', marginBottom:'16px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 20% 50%,${RED}12 0%,transparent 55%)`, pointerEvents:'none' }} />
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'8px' }}>
                    <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:RED, display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                    <span style={{ color:RED, fontSize:'10px', fontWeight:800, letterSpacing:'1px' }}>DIFFUSION EN DIRECT</span>
                  </div>
                  <h2 style={{ color:TEXT, fontSize: isMobile ? '16px' : '22px', fontWeight:900, margin:`0 0 ${isMobile?'12px':'8px'}`, lineHeight:1.2 }}>
                    {isMobile ? 'Diffusez en direct' : <>Partagez l'information<br />en temps réel</>}
                  </h2>
                  {!isMobile && (
                    <p style={{ color:TEXT2, fontSize:'13px', margin:'0 0 18px', lineHeight:1.6 }}>
                      Débats, analyses, reportages — diffusez sur YouTube, Twitch, Kick ou directement sur STENO TV.
                    </p>
                  )}
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button onClick={() => setModal(true)} style={{ display:'flex', alignItems:'center', gap:'7px', background:RED, color:'#fff', border:'none', borderRadius:'100px', padding: isMobile ? '9px 16px' : '10px 20px', fontSize: isMobile ? '12px' : '13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}55` }}>
                      <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                      🔴 {isMobile ? 'Lancer un live' : 'Aller en live maintenant'}
                    </button>
                    <button onClick={() => setTab('planifier')} style={{ padding: isMobile ? '9px 14px' : '10px 18px', borderRadius:'100px', border:`1px solid ${BORDER}`, background:'transparent', color:TEXT2, fontSize: isMobile ? '11px' : '12px', fontWeight:600, cursor:'pointer' }}>
                      📅 Planifier
                    </button>
                  </div>
                </div>
              </div>

              {/* Plateformes */}
              <div style={{ display:'flex', gap:'5px', marginBottom:'16px', flexWrap:'wrap' }}>
                {PLATFORMS.map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'4px', background:`${p.color}10`, border:`1px solid ${p.color}25`, borderRadius:'100px', padding: isMobile ? '3px 8px' : '4px 10px' }}>
                    <span style={{ color:p.color, fontSize: isMobile ? '10px' : '11px', fontWeight:800 }}>{p.icon}</span>
                    {!isMobile && <span style={{ color:p.color, fontSize:'10px', fontWeight:700 }}>{p.label}</span>}
                  </div>
                ))}
              </div>

              {/* Lives en cours */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                  <h3 style={{ color:TEXT, fontSize: isMobile ? '13px' : '15px', fontWeight:800, margin:0, display:'flex', alignItems:'center', gap:'7px' }}>
                    <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:RED, display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                    Lives en cours
                  </h3>
                  <Link href="/dashboard/tv" style={{ color:RED, fontSize:'11px', fontWeight:700, textDecoration:'none' }}>Voir tout →</Link>
                </div>

                {livesLoading ? (
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(280px,1fr))', gap:'8px' }}>
                    {[0,1].map(i => (
                      <div key={i} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', overflow:'hidden' }}>
                        <div style={{ paddingTop:'56.25%', background:'#0D0D0D' }} />
                        <div style={{ padding:'8px 10px 12px' }}>
                          <div style={{ height:'11px', background:'#111', borderRadius:'4px', marginBottom:'7px' }} />
                          <div style={{ height:'9px', background:'#0D0D0D', borderRadius:'4px', width:'60%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : communityLives.length === 0 ? (
                  <div style={{ textAlign:'center', padding: isMobile ? '36px 16px' : '48px 20px', background:SURF, borderRadius:'16px', border:`1px solid ${BORDER}` }}>
                    <div style={{ fontSize:'36px', marginBottom:'10px' }}>📡</div>
                    <p style={{ color:TEXT, fontSize: isMobile ? '14px' : '16px', fontWeight:800, margin:'0 0 5px' }}>Aucun live en cours</p>
                    <p style={{ color:TEXT2, fontSize:'12px', margin:'0 0 16px' }}>Soyez le premier à diffuser aujourd'hui.</p>
                    <button onClick={() => setModal(true)} style={{ background:RED, color:'#fff', border:'none', borderRadius:'100px', padding:'10px 24px', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${RED}44` }}>
                      🔴 Lancer un live
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(280px,1fr))', gap:'8px' }}>
                    {communityLives.map(live => <CommunityLiveCard key={live.id} live={live} isMobile={isMobile} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════ MES LIVES ══════════════════════ */}
          {tab === 'mes-lives' && (
            <div>
              {/* Stats cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap: isMobile ? '6px' : '8px', marginBottom:'16px' }}>
                {[
                  { label:'Broadcasts',  value:String(myPastLives.length),                       icon:'📡', color:RED  },
                  { label:'Vues totales',value:totalPeak.toLocaleString('fr-FR'),                icon:'👁', color:BLUE },
                  { label:'Super Chats', value:`${totalSuperChats} €`,                          icon:'⭐', color:GOLD },
                  { label:'Durée totale',value:myPastLives.length > 0 ? fmtDuration(
                      new Date(Date.now() - myPastLives.reduce((s,b) => {
                        const dur = b.ended_at ? new Date(b.ended_at).getTime() - new Date(b.started_at).getTime() : 0;
                        return s + dur;
                      }, 0)).toISOString(), new Date().toISOString()
                    ) : '—',             icon:'⏱', color:GREEN },
                ].map(s => (
                  <div key={s.label} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', padding: isMobile ? '10px 12px' : '14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'5px' }}>
                      <span style={{ fontSize: isMobile ? '14px' : '16px' }}>{s.icon}</span>
                      <span style={{ color:TEXT2, fontSize:'10px', fontWeight:600 }}>{s.label}</span>
                    </div>
                    <p style={{ color:s.color, fontSize: isMobile ? '18px' : '22px', fontWeight:900, margin:0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <h3 style={{ color:TEXT, fontSize: isMobile ? '13px' : '14px', fontWeight:800, margin:'0 0 10px' }}>
                Historique des broadcasts
              </h3>

              {myPastLives.length === 0 ? (
                <div style={{ textAlign:'center', padding: isMobile ? '36px 16px' : '48px 20px', background:SURF, borderRadius:'16px', border:`1px solid ${BORDER}` }}>
                  <span style={{ fontSize:'36px' }}>📡</span>
                  <p style={{ color:TEXT, fontSize: isMobile ? '14px' : '16px', fontWeight:800, margin:'10px 0 5px' }}>Aucun broadcast</p>
                  <p style={{ color:TEXT2, fontSize:'12px', margin:'0 0 16px' }}>Vos lives terminés apparaîtront ici.</p>
                  <button onClick={() => setModal(true)} style={{ background:RED, color:'#fff', border:'none', borderRadius:'100px', padding:'10px 24px', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${RED}44` }}>
                    🔴 Lancer un live
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                  {myPastLives.map(b => {
                    const catColor = CAT_COLOR[b.category]||TEXT2;
                    const duration = fmtDuration(b.started_at, b.ended_at);
                    return (
                      <div key={b.id} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', padding: isMobile ? '10px 12px' : '14px 16px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px', marginBottom:'8px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ color:TEXT, fontSize: isMobile ? '12px' : '13px', fontWeight:700, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:'5px', flexWrap:'wrap' }}>
                              <span style={{ color:TEXT2, fontSize:'10px' }}>{new Date(b.started_at).toLocaleDateString('fr-FR',{ day:'numeric', month:'short' })}</span>
                              <span style={{ color:TEXT2, fontSize:'10px' }}>· ⏱ {duration}</span>
                              <span style={{ color:catColor, fontSize:'9px', fontWeight:700, background:`${catColor}15`, border:`1px solid ${catColor}25`, borderRadius:'100px', padding:'1px 5px' }}>{b.category}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'12px', paddingTop:'8px', borderTop:`1px solid ${BORDER}` }}>
                          <div style={{ textAlign:'center' }}>
                            <p style={{ color:RED, fontWeight:800, fontSize: isMobile ? '13px' : '14px', margin:0 }}>{b.peak_viewers}</p>
                            <p style={{ color:TEXT2, fontSize:'9px', margin:0 }}>Pic</p>
                          </div>
                          <div style={{ textAlign:'center' }}>
                            <p style={{ color:GOLD, fontWeight:800, fontSize: isMobile ? '13px' : '14px', margin:0 }}>{b.super_chats_total}€</p>
                            <p style={{ color:TEXT2, fontSize:'9px', margin:0 }}>Super Chat</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ PLANIFIER ══════════════════════ */}
          {tab === 'planifier' && (
            <div>
              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', padding: isMobile ? '14px' : '18px', marginBottom:'14px' }}>
                <h3 style={{ color:TEXT, fontSize: isMobile ? '13px' : '14px', fontWeight:800, margin:'0 0 12px', display:'flex', alignItems:'center', gap:'7px' }}>
                  📅 Nouveau live planifié
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  <div>
                    <label style={lbl}>Titre *</label>
                    <input value={schTitle} onChange={e=>setSchTitle(e.target.value)} placeholder="Titre de votre prochain live…" style={inp}
                      onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                  </div>
                  {/* Date + plateforme: side-by-side on desktop, stacked on mobile */}
                  <div style={{ display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:'8px' }}>
                    <div style={{ flex:1 }}>
                      <label style={lbl}>Date & heure *</label>
                      <input type="datetime-local" value={schDate} onChange={e=>setSchDate(e.target.value)} style={{ ...inp, colorScheme:'dark' }}
                        onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                    </div>
                    <div style={{ flex:1 }}>
                      <label style={lbl}>Plateforme</label>
                      <select value={schPlat} onChange={e=>setSchPlat(e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                        {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Catégorie</label>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                      {CATS.map(c => {
                        const col = CAT_COLOR[c]||TEXT2;
                        return (
                          <button key={c} onClick={() => setSchCat(c)} style={{ padding:'4px 9px', borderRadius:'100px', fontSize:'10px', fontWeight:600, cursor:'pointer', border:`1px solid ${schCat===c ? col : BORDER}`, background: schCat===c ? `${col}18` : 'transparent', color: schCat===c ? col : TEXT2, transition:'all 0.12s' }}>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button onClick={addScheduled} disabled={!schTitle.trim()||!schDate} style={{ padding:'11px', borderRadius:'12px', background: schTitle.trim()&&schDate ? RED : '#1a1a1a', border:'none', color: schTitle.trim()&&schDate ? '#fff' : TEXT3, fontSize:'13px', fontWeight:800, cursor: schTitle.trim()&&schDate ? 'pointer' : 'not-allowed', boxShadow: schTitle.trim()&&schDate ? `0 4px 16px ${RED}44` : 'none' }}>
                    Planifier ce live
                  </button>
                </div>
              </div>

              {scheduled.length > 0 ? (
                <div>
                  <h3 style={{ color:TEXT, fontSize: isMobile ? '13px' : '14px', fontWeight:800, margin:'0 0 10px' }}>Lives planifiés ({scheduled.length})</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
                    {[...scheduled].sort((a,b) => new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime()).map(s => {
                      const col = CAT_COLOR[s.cat]||TEXT2;
                      const plat = PLATFORMS.find(p=>p.id===s.platform);
                      return (
                        <div key={s.id} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'12px', padding: isMobile ? '10px 12px' : '13px 14px', display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${RED}15`, border:`1px solid ${RED}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', flexShrink:0 }}>📅</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ color:TEXT, fontSize: isMobile ? '12px' : '13px', fontWeight:700, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</p>
                            <div style={{ display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ color:TEXT2, fontSize:'9px' }}>{schedDate(s.scheduledAt)}</span>
                              <span style={{ color:col, fontSize:'8px', fontWeight:700, background:`${col}15`, border:`1px solid ${col}25`, borderRadius:'100px', padding:'1px 5px' }}>{s.cat}</span>
                              {plat && !isMobile && <span style={{ color:plat.color, fontSize:'9px', fontWeight:700 }}>{plat.icon} {plat.label}</span>}
                            </div>
                          </div>
                          <button onClick={() => removeScheduled(s.id)} style={{ background:'none', border:'none', color:TEXT3, cursor:'pointer', fontSize:'18px', flexShrink:0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'36px 20px' }}>
                  <span style={{ fontSize:'36px' }}>📅</span>
                  <p style={{ color:TEXT2, fontSize:'13px', margin:'10px 0 0' }}>Aucun live planifié.</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ PARAMÈTRES ══════════════════════ */}
          {tab === 'parametres' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Identité du streamer</p>
                </div>
                <div style={{ padding:'12px 14px' }}>
                  <label style={lbl}>Nom affiché</label>
                  <input value={pseudonym} onChange={e=>setPseudonym(e.target.value)} style={inp}
                    onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                </div>
              </div>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Qualité de diffusion</p>
                </div>
                <div style={{ padding:'12px 14px', display:'flex', gap:'7px' }}>
                  {(['720p','1080p','4K'] as const).map(q => (
                    <button key={q} onClick={() => setQualite(q)} style={{ flex:1, padding: isMobile ? '8px 0' : '10px 0', borderRadius:'10px', border:`1px solid ${qualite===q ? RED : BORDER}`, background: qualite===q ? `${RED}18` : 'transparent', color: qualite===q ? RED : TEXT2, fontSize:'12px', fontWeight:qualite===q?800:400, cursor:'pointer', transition:'all 0.12s' }}>
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{ padding:'0 14px 12px' }}>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:0 }}>
                    {qualite==='720p' ? 'Recommandé < 5 Mbit/s' : qualite==='1080p' ? 'Recommandé > 10 Mbit/s' : '4K requiert > 25 Mbit/s'}
                  </p>
                </div>
              </div>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Options</p>
                </div>
                {[
                  { label:'Enregistrement auto', sub:'Sauvegarder le replay', state:autoRecord, set:setAutoRecord },
                  { label:'Super Chat',           sub:'Permettre les dons',   state:superChat,  set:setSuperChat  },
                ].map(opt => (
                  <div key={opt.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', borderBottom:`1px solid ${BORDER}` }}>
                    <div>
                      <p style={{ color:TEXT, fontSize: isMobile ? '12px' : '13px', fontWeight:600, margin:'0 0 2px' }}>{opt.label}</p>
                      <p style={{ color:TEXT2, fontSize:'10px', margin:0 }}>{opt.sub}</p>
                    </div>
                    <button onClick={() => opt.set(v=>!v)} style={{ width:'42px', height:'24px', borderRadius:'12px', border:'none', background: opt.state ? RED : BORDER, cursor:'pointer', position:'relative', transition:'background 0.15s', flexShrink:0 }}>
                      <span style={{ position:'absolute', top:'3px', left: opt.state ? '21px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.5)' }} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Clé de stream STENO Live</p>
                </div>
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ background:BG, borderRadius:'10px', padding:'10px 12px', border:`1px solid ${BORDER}` }}>
                    <p style={{ color:TEXT2, fontSize:'10px', fontWeight:700, margin:'0 0 4px' }}>URL RTMP</p>
                    <code style={{ color:GOLD, fontSize:'10px', fontFamily:'monospace' }}>rtmp://live.stenograft.fr/stream</code>
                  </div>
                  <div style={{ background:BG, borderRadius:'10px', padding:'10px 12px', border:`1px solid ${BORDER}`, marginTop:'7px' }}>
                    <p style={{ color:TEXT2, fontSize:'10px', fontWeight:700, margin:'0 0 4px' }}>Clé de stream</p>
                    <code style={{ color:TEXT3, fontSize:'10px', fontFamily:'monospace' }}>••••••••••••••••••••••••</code>
                    <button onClick={() => { navigator.clipboard.writeText('rtmp://live.stenograft.fr/stream').catch(() => {}); setToast('Clé copiée !'); }} style={{ marginTop:'7px', display:'block', width:'100%', padding:'7px', borderRadius:'8px', border:`1px solid ${BORDER}`, background:'transparent', color:RED, fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                      Copier la clé
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => setToast('Paramètres sauvegardés ✓')} style={{ padding:'12px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${RED}44` }}>
                Enregistrer les paramètres
              </button>
            </div>
          )}
        </div>
      </div>

      {modal && <StartLiveModal username={username} userId={userId} isMobile={isMobile} onClose={() => setModal(false)} />}
    </>
  );
}
