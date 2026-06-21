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
  { id:'youtube',    label:'YouTube',    icon:'▶', color:'#FF0000', rtmp:'rtmp://a.rtmp.youtube.com/live2', desc:'YouTube Live' },
  { id:'twitch',     label:'Twitch',     icon:'◈', color:'#9146FF', rtmp:'rtmp://live.twitch.tv/app',      desc:'Twitch' },
  { id:'kick',       label:'Kick',       icon:'◉', color:'#53FC18', rtmp:'rtmp://fa723fc1b171.global-contribute.live-video.net/app', desc:'Kick.com' },
  { id:'streamyard', label:'StreamYard', icon:'⬡', color:'#1DA1F2', rtmp:'rtmp://live.stenograft.fr/app',  desc:'StreamYard intégré' },
  { id:'steno',      label:'STENO Live', icon:'S',  color:RED,       rtmp:'rtmp://live.stenograft.fr/stream', desc:'Diffusion native STENO' },
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

function StartLiveModal({ username, userId, onClose }: {
  username: string; userId: string | null; onClose: () => void;
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
    <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.92)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderTop:`2px solid ${RED}`, borderRadius:'22px', width:'100%', maxWidth:'520px', maxHeight:'90vh', overflowY:'auto', scrollbarWidth:'none' }}>

        {/* Modal header */}
        <div style={{ padding:'20px 22px 16px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', boxShadow:`0 2px 12px ${RED}55` }}>🔴</div>
            <div>
              <h2 style={{ color:TEXT, fontSize:'16px', fontWeight:900, margin:'0 0 2px' }}>Démarrer un Live</h2>
              <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>Étape {step}/3</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:TEXT2, fontSize:'22px', cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Steps bar */}
        <div style={{ display:'flex', height:'3px', background:BORDER }}>
          <div style={{ width:`${(step/3)*100}%`, background:RED, transition:'width 0.3s ease', borderRadius:'0 2px 2px 0' }} />
        </div>

        <div style={{ padding:'20px 22px 22px' }}>

          {/* Step 1 — Plateforme */}
          {step === 1 && (
            <div>
              <label style={lbl}>Plateforme de diffusion</label>
              <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'20px' }}>
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', borderRadius:'12px', border:`1.5px solid ${platform===p.id ? p.color+'60' : BORDER}`, background: platform===p.id ? `${p.color}10` : 'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'9px', background:`${p.color}20`, border:`1px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:p.id==='steno'?'14px':'16px', color:p.color, flexShrink:0, fontWeight:900 }}>{p.icon}</div>
                    <div style={{ flex:1 }}>
                      <p style={{ color:TEXT, fontSize:'13px', fontWeight:700, margin:'0 0 1px' }}>{p.label}</p>
                      <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>{p.desc}</p>
                    </div>
                    <div style={{ width:'16px', height:'16px', borderRadius:'50%', border:`2px solid ${platform===p.id ? p.color : BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {platform===p.id && <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:p.color }} />}
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep(2)} style={{ width:'100%', padding:'12px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}44` }}>
                Continuer →
              </button>
            </div>
          )}

          {/* Step 2 — Configuration */}
          {step === 2 && (
            <div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'20px' }}>
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
                        <button key={c} onClick={() => setCat(c)} style={{ padding:'4px 11px', borderRadius:'100px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:`1px solid ${cat===c ? col : BORDER}`, background: cat===c ? `${col}18` : 'transparent', color: cat===c ? col : TEXT2, transition:'all 0.12s' }}>
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
              <div style={{ background:BG, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'16px', marginBottom:'14px' }}>
                <p style={{ color:GOLD, fontSize:'9px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 12px' }}>Récapitulatif</p>
                {[
                  { label:'Titre',      value:title },
                  { label:'Plateforme', value:plat.label },
                  { label:'Catégorie',  value:cat },
                  { label:'Diffuseur',  value:`@${username}` },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${BORDER}` }}>
                    <span style={{ color:TEXT2, fontSize:'12px' }}>{label}</span>
                    <span style={{ color:TEXT, fontSize:'12px', fontWeight:700 }}>{value}</span>
                  </div>
                ))}
              </div>

              {platform !== 'steno' && (
                <div style={{ background:SURF2, border:`1px solid ${BORDER}`, borderRadius:'12px', padding:'12px', marginBottom:'14px' }}>
                  <p style={{ color:TEXT2, fontSize:'11px', fontWeight:700, margin:'0 0 5px' }}>📡 Instructions OBS / StreamYard</p>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:'0 0 4px' }}>1. Ouvrez votre logiciel de streaming</p>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:'0 0 4px' }}>2. Entrez l'URL RTMP : <code style={{ color:GOLD, fontSize:'9px' }}>{plat.rtmp}</code></p>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:0 }}>3. Collez votre clé de stream et démarrez</p>
                </div>
              )}

              <div style={{ background:`${RED}08`, border:`1px solid ${RED}20`, borderRadius:'10px', padding:'12px', marginBottom:'16px', display:'flex', gap:'10px' }}>
                <span style={{ fontSize:'16px', flexShrink:0 }}>⚠️</span>
                <p style={{ color:TEXT2, fontSize:'11px', lineHeight:1.6, margin:0 }}>
                  En démarrant, vous acceptez la <span style={{ color:RED, fontWeight:600 }}>charte éditoriale</span> STENOGRAFT. Tout contenu illicite entraîne une suspension immédiate.
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
                  {loading ? 'Démarrage…' : '🔴 Lancer le live'}
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

function CommunityLiveCard({ live }: { live: LiveSession }) {
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
          <div style={{ position:'absolute', top:'8px', left:'8px', display:'flex', alignItems:'center', gap:'4px', background:RED, borderRadius:'4px', padding:'2px 7px' }}>
            <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
            <span style={{ color:'#fff', fontSize:'9px', fontWeight:800 }}>LIVE</span>
          </div>
          <div style={{ position:'absolute', bottom:'8px', right:'8px', background:'rgba(0,0,0,0.75)', borderRadius:'4px', padding:'2px 7px' }}>
            <span style={{ color:'#fff', fontSize:'10px', fontWeight:700 }}>👁 {fmtV(live.viewers_count)}</span>
          </div>
          <div style={{ position:'absolute', bottom:'8px', left:'8px', background:'rgba(0,0,0,0.75)', borderRadius:'4px', padding:'2px 7px' }}>
            <span style={{ color:'#fff', fontSize:'10px' }}>{elapsed(live.started_at)}</span>
          </div>
        </div>
        <div style={{ padding:'10px 12px 12px' }}>
          <p style={{ color:TEXT, fontSize:'13px', fontWeight:700, margin:'0 0 5px', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>{live.title}</p>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
            <div style={{ width:'16px', height:'16px', borderRadius:'50%', background:avatarGrad(hue), flexShrink:0 }} />
            <span style={{ color:TEXT2, fontSize:'11px' }}>@{live.username}</span>
            <span style={{ color:catColor, fontSize:'9px', fontWeight:700, marginLeft:'auto', background:`${catColor}15`, border:`1px solid ${catColor}25`, borderRadius:'100px', padding:'1px 6px' }}>{live.category}</span>
          </div>
          <div style={{ marginTop:'5px' }}>
            <span style={{ fontSize:'9px', color:platColor, background:`${platColor}15`, border:`1px solid ${platColor}25`, borderRadius:'100px', padding:'1px 7px', fontWeight:700 }}>
              {platIcon} {platLabel}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LivePage() {
  const [tab,           setTab]           = useState<Tab>('hub');
  const [modal,         setModal]         = useState(false);
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

      // Fetch live hub (all active lives)
      const { data: hub } = await sb.from('live_sessions')
        .select('*')
        .eq('status', 'live')
        .order('viewers_count', { ascending: false })
        .limit(20);
      setCommunityLives((hub ?? []) as LiveSession[]);

      // Fetch my past lives
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

      // Realtime: hub updates
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

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        @keyframes sg-pulse { 0%,100%{opacity:1;}50%{opacity:0.3;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;} }
      `}</style>

      {toast && (
        <div style={{ position:'fixed', bottom:'90px', left:'50%', transform:'translateX(-50%)', background:GOLD, color:'#000', fontSize:'13px', fontWeight:700, padding:'10px 20px', borderRadius:'100px', zIndex:500, pointerEvents:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', animation:'fadeUp 0.25s ease' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:'700px', margin:'0 auto', paddingBottom:'80px', fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* ── Sticky header ── */}
        <div style={{ position:'sticky', top:0, zIndex:10, background:`${BG}EE`, backdropFilter:'blur(14px)', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 10px', gap:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', boxShadow:`0 2px 14px ${RED}55`, flexShrink:0 }}>🔴</div>
              <div>
                <h1 style={{ color:TEXT, fontSize:'18px', fontWeight:900, margin:'0 0 1px', letterSpacing:'-0.3px' }}>STENO Live</h1>
                <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>
                  {communityLives.length > 0
                    ? <><span style={{ color:RED, fontWeight:700 }}>{communityLives.length}</span> lives en cours</>
                    : 'Aucun live en cours'
                  }
                  {myPastLives.length > 0 && ` · ${myPastLives.length} broadcasts`}
                </p>
              </div>
            </div>
            <button onClick={() => setModal(true)} style={{ display:'flex', alignItems:'center', gap:'7px', background:RED, color:'#fff', border:'none', borderRadius:'100px', padding:'9px 18px', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}55`, flexShrink:0 }}>
              <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
              🔴 Aller en live
            </button>
          </div>

          <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}` }}>
            {([
              ['hub',        '🏠 Hub'],
              ['mes-lives',  '📊 Mes lives'],
              ['planifier',  '📅 Planifier'],
              ['parametres', '⚙️ Paramètres'],
            ] as [Tab,string][]).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{ flex:1, padding:'11px 6px', background:'none', border:'none', borderBottom:`2px solid ${tab===key ? RED : 'transparent'}`, color: tab===key ? TEXT : TEXT2, fontSize:'12px', fontWeight: tab===key ? 700 : 400, cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:'14px 16px' }}>

          {/* ══════════════════════ HUB ══════════════════════ */}
          {tab === 'hub' && (
            <div>
              {/* Hero CTA */}
              <div style={{ background:`linear-gradient(135deg,#1a0505 0%,#2d0808 50%,#0a0000 100%)`, border:`1px solid ${RED}25`, borderRadius:'18px', padding:'24px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 20% 50%,${RED}12 0%,transparent 55%)`, pointerEvents:'none' }} />
                <div style={{ position:'relative', zIndex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:RED, display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                    <span style={{ color:RED, fontSize:'11px', fontWeight:800, letterSpacing:'1px' }}>DIFFUSION EN DIRECT</span>
                  </div>
                  <h2 style={{ color:TEXT, fontSize:'22px', fontWeight:900, margin:'0 0 8px', lineHeight:1.2 }}>
                    Partagez l'information<br />en temps réel
                  </h2>
                  <p style={{ color:TEXT2, fontSize:'13px', margin:'0 0 18px', lineHeight:1.6 }}>
                    Débats, analyses, reportages — diffusez sur YouTube, Twitch, Kick ou directement sur STENO TV.
                  </p>
                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                    <button onClick={() => setModal(true)} style={{ display:'flex', alignItems:'center', gap:'7px', background:RED, color:'#fff', border:'none', borderRadius:'100px', padding:'10px 20px', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}55` }}>
                      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                      🔴 Aller en live maintenant
                    </button>
                    <button onClick={() => setTab('planifier')} style={{ padding:'10px 18px', borderRadius:'100px', border:`1px solid ${BORDER}`, background:'transparent', color:TEXT2, fontSize:'12px', fontWeight:600, cursor:'pointer' }}>
                      📅 Planifier un live
                    </button>
                  </div>
                </div>
              </div>

              {/* Plateformes */}
              <div style={{ display:'flex', gap:'6px', marginBottom:'20px', flexWrap:'wrap' }}>
                {PLATFORMS.map(p => (
                  <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'5px', background:`${p.color}10`, border:`1px solid ${p.color}25`, borderRadius:'100px', padding:'4px 10px' }}>
                    <span style={{ color:p.color, fontSize:'11px', fontWeight:800 }}>{p.icon}</span>
                    <span style={{ color:p.color, fontSize:'10px', fontWeight:700 }}>{p.label}</span>
                  </div>
                ))}
              </div>

              {/* Lives en cours */}
              <div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                  <h3 style={{ color:TEXT, fontSize:'15px', fontWeight:800, margin:0, display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:RED, display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                    Lives en cours
                  </h3>
                  <Link href="/dashboard/tv" style={{ color:RED, fontSize:'11px', fontWeight:700, textDecoration:'none' }}>Voir tout →</Link>
                </div>

                {livesLoading ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'10px' }}>
                    {[0,1].map(i => (
                      <div key={i} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', overflow:'hidden' }}>
                        <div style={{ paddingTop:'56.25%', background:'#0D0D0D' }} />
                        <div style={{ padding:'10px 12px 14px' }}>
                          <div style={{ height:'12px', background:'#111', borderRadius:'4px', marginBottom:'8px' }} />
                          <div style={{ height:'10px', background:'#0D0D0D', borderRadius:'4px', width:'60%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : communityLives.length === 0 ? (
                  <div style={{ textAlign:'center', padding:'48px 20px', background:SURF, borderRadius:'16px', border:`1px solid ${BORDER}` }}>
                    <div style={{ fontSize:'40px', marginBottom:'12px' }}>📡</div>
                    <p style={{ color:TEXT, fontSize:'16px', fontWeight:800, margin:'0 0 6px' }}>Aucun live en cours</p>
                    <p style={{ color:TEXT2, fontSize:'13px', margin:'0 0 20px' }}>Soyez le premier à diffuser aujourd'hui.</p>
                    <button onClick={() => setModal(true)} style={{ background:RED, color:'#fff', border:'none', borderRadius:'100px', padding:'10px 24px', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${RED}44` }}>
                      🔴 Lancer un live
                    </button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'10px' }}>
                    {communityLives.map(live => <CommunityLiveCard key={live.id} live={live} />)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════ MES LIVES ══════════════════════ */}
          {tab === 'mes-lives' && (
            <div>
              {/* Stats cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'8px', marginBottom:'20px' }}>
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
                  <div key={s.label} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'6px' }}>
                      <span style={{ fontSize:'16px' }}>{s.icon}</span>
                      <span style={{ color:TEXT2, fontSize:'10px', fontWeight:600 }}>{s.label}</span>
                    </div>
                    <p style={{ color:s.color, fontSize:'22px', fontWeight:900, margin:0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <h3 style={{ color:TEXT, fontSize:'14px', fontWeight:800, margin:'0 0 10px' }}>
                Historique des broadcasts
              </h3>

              {myPastLives.length === 0 ? (
                <div style={{ textAlign:'center', padding:'48px 20px', background:SURF, borderRadius:'16px', border:`1px solid ${BORDER}` }}>
                  <span style={{ fontSize:'40px' }}>📡</span>
                  <p style={{ color:TEXT, fontSize:'16px', fontWeight:800, margin:'12px 0 6px' }}>Aucun broadcast</p>
                  <p style={{ color:TEXT2, fontSize:'13px', margin:'0 0 20px' }}>Vos lives terminés apparaîtront ici.</p>
                  <button onClick={() => setModal(true)} style={{ background:RED, color:'#fff', border:'none', borderRadius:'100px', padding:'10px 24px', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${RED}44` }}>
                    🔴 Lancer un live
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {myPastLives.map(b => {
                    const catColor = CAT_COLOR[b.category]||TEXT2;
                    const duration = fmtDuration(b.started_at, b.ended_at);
                    return (
                      <div key={b.id} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'14px 16px' }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'10px', marginBottom:'9px' }}>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ color:TEXT, fontSize:'13px', fontWeight:700, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap' }}>
                              <span style={{ color:TEXT2, fontSize:'10px' }}>{new Date(b.started_at).toLocaleDateString('fr-FR',{ day:'numeric', month:'long', year:'numeric' })}</span>
                              <span style={{ color:TEXT3, fontSize:'10px' }}>·</span>
                              <span style={{ color:TEXT2, fontSize:'10px' }}>⏱ {duration}</span>
                              <span style={{ color:catColor, fontSize:'9px', fontWeight:700, background:`${catColor}15`, border:`1px solid ${catColor}25`, borderRadius:'100px', padding:'1px 6px' }}>{b.category}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'12px', paddingTop:'9px', borderTop:`1px solid ${BORDER}` }}>
                          <div style={{ textAlign:'center' }}>
                            <p style={{ color:RED, fontWeight:800, fontSize:'14px', margin:0 }}>{b.peak_viewers}</p>
                            <p style={{ color:TEXT2, fontSize:'9px', margin:0 }}>Pic</p>
                          </div>
                          <div style={{ textAlign:'center' }}>
                            <p style={{ color:GOLD, fontWeight:800, fontSize:'14px', margin:0 }}>{b.super_chats_total}€</p>
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
              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', padding:'18px', marginBottom:'16px' }}>
                <h3 style={{ color:TEXT, fontSize:'14px', fontWeight:800, margin:'0 0 14px', display:'flex', alignItems:'center', gap:'7px' }}>
                  📅 Nouveau live planifié
                </h3>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <label style={lbl}>Titre *</label>
                    <input value={schTitle} onChange={e=>setSchTitle(e.target.value)} placeholder="Titre de votre prochain live…" style={inp}
                      onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                  </div>
                  <div style={{ display:'flex', gap:'8px' }}>
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
                          <button key={c} onClick={() => setSchCat(c)} style={{ padding:'4px 10px', borderRadius:'100px', fontSize:'10px', fontWeight:600, cursor:'pointer', border:`1px solid ${schCat===c ? col : BORDER}`, background: schCat===c ? `${col}18` : 'transparent', color: schCat===c ? col : TEXT2, transition:'all 0.12s' }}>
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
                  <h3 style={{ color:TEXT, fontSize:'14px', fontWeight:800, margin:'0 0 10px' }}>Lives planifiés ({scheduled.length})</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {[...scheduled].sort((a,b) => new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime()).map(s => {
                      const col = CAT_COLOR[s.cat]||TEXT2;
                      const plat = PLATFORMS.find(p=>p.id===s.platform);
                      return (
                        <div key={s.id} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'12px', padding:'13px 14px', display:'flex', alignItems:'center', gap:'12px' }}>
                          <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${RED}15`, border:`1px solid ${RED}25`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>📅</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ color:TEXT, fontSize:'13px', fontWeight:700, margin:'0 0 3px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.title}</p>
                            <div style={{ display:'flex', gap:'5px', alignItems:'center', flexWrap:'wrap' }}>
                              <span style={{ color:TEXT2, fontSize:'10px' }}>{schedDate(s.scheduledAt)}</span>
                              <span style={{ color:col, fontSize:'9px', fontWeight:700, background:`${col}15`, border:`1px solid ${col}25`, borderRadius:'100px', padding:'1px 6px' }}>{s.cat}</span>
                              {plat && <span style={{ color:plat.color, fontSize:'9px', fontWeight:700 }}>{plat.icon} {plat.label}</span>}
                            </div>
                          </div>
                          <button onClick={() => removeScheduled(s.id)} style={{ background:'none', border:'none', color:TEXT3, cursor:'pointer', fontSize:'18px', flexShrink:0 }}>×</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:'center', padding:'40px 20px' }}>
                  <span style={{ fontSize:'40px' }}>📅</span>
                  <p style={{ color:TEXT2, fontSize:'13px', margin:'12px 0 0' }}>Aucun live planifié.</p>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ PARAMÈTRES ══════════════════════ */}
          {tab === 'parametres' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Identité du streamer</p>
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <label style={lbl}>Nom affiché</label>
                  <input value={pseudonym} onChange={e=>setPseudonym(e.target.value)} style={inp}
                    onFocus={e=>(e.currentTarget.style.borderColor=RED+'60')} onBlur={e=>(e.currentTarget.style.borderColor=BORDER)} />
                </div>
              </div>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Qualité de diffusion</p>
                </div>
                <div style={{ padding:'14px 16px', display:'flex', gap:'7px' }}>
                  {(['720p','1080p','4K'] as const).map(q => (
                    <button key={q} onClick={() => setQualite(q)} style={{ flex:1, padding:'10px 0', borderRadius:'10px', border:`1px solid ${qualite===q ? RED : BORDER}`, background: qualite===q ? `${RED}18` : 'transparent', color: qualite===q ? RED : TEXT2, fontSize:'12px', fontWeight:qualite===q?800:400, cursor:'pointer', transition:'all 0.12s' }}>
                      {q}
                    </button>
                  ))}
                </div>
                <div style={{ padding:'0 16px 14px' }}>
                  <p style={{ color:TEXT3, fontSize:'10px', margin:0 }}>
                    {qualite==='720p' ? 'Recommandé pour connexions < 5 Mbit/s' : qualite==='1080p' ? 'Recommandé pour connexions > 10 Mbit/s' : '4K requiert > 25 Mbit/s et un encodeur performant'}
                  </p>
                </div>
              </div>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Options</p>
                </div>
                {[
                  { label:'Enregistrement automatique', sub:'Sauvegarder le replay après chaque live', state:autoRecord, set:setAutoRecord },
                  { label:'Super Chat activé',          sub:'Permettre les dons en live',             state:superChat,  set:setSuperChat  },
                ].map(opt => (
                  <div key={opt.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:`1px solid ${BORDER}` }}>
                    <div>
                      <p style={{ color:TEXT, fontSize:'13px', fontWeight:600, margin:'0 0 2px' }}>{opt.label}</p>
                      <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>{opt.sub}</p>
                    </div>
                    <button onClick={() => opt.set(v=>!v)} style={{ width:'42px', height:'24px', borderRadius:'12px', border:'none', background: opt.state ? RED : BORDER, cursor:'pointer', position:'relative', transition:'background 0.15s', flexShrink:0 }}>
                      <span style={{ position:'absolute', top:'3px', left: opt.state ? '21px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.15s', boxShadow:'0 1px 4px rgba(0,0,0,0.5)' }} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:`1px solid ${BORDER}`, background:BG }}>
                  <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', margin:0 }}>Clé de stream STENO Live</p>
                </div>
                <div style={{ padding:'14px 16px' }}>
                  <div style={{ background:BG, borderRadius:'10px', padding:'12px 14px', border:`1px solid ${BORDER}` }}>
                    <p style={{ color:TEXT2, fontSize:'10px', fontWeight:700, margin:'0 0 4px' }}>URL RTMP</p>
                    <code style={{ color:GOLD, fontSize:'11px', fontFamily:'monospace' }}>rtmp://live.stenograft.fr/stream</code>
                  </div>
                  <div style={{ background:BG, borderRadius:'10px', padding:'12px 14px', border:`1px solid ${BORDER}`, marginTop:'8px' }}>
                    <p style={{ color:TEXT2, fontSize:'10px', fontWeight:700, margin:'0 0 4px' }}>Clé de stream</p>
                    <code style={{ color:TEXT3, fontSize:'11px', fontFamily:'monospace' }}>••••••••••••••••••••••••</code>
                    <button onClick={() => { navigator.clipboard.writeText('rtmp://live.stenograft.fr/stream').catch(() => {}); setToast('Clé copiée !'); }} style={{ marginTop:'8px', display:'block', width:'100%', padding:'7px', borderRadius:'8px', border:`1px solid ${BORDER}`, background:'transparent', color:RED, fontSize:'11px', fontWeight:700, cursor:'pointer' }}>
                      Copier la clé
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={() => setToast('Paramètres sauvegardés ✓')} style={{ padding:'13px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'13px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 16px ${RED}44` }}>
                Enregistrer les paramètres
              </button>
            </div>
          )}
        </div>
      </div>

      {modal && <StartLiveModal username={username} userId={userId} onClose={() => setModal(false)} />}
    </>
  );
}
