'use client';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import LiveChat from '@/components/LiveChat';
import { createClient } from '@/utils/supabase/client';

const BG     = '#000000';
const SURF   = '#0A0A0A';
const BORDER = '#1C1C1C';
const RED    = '#E0492F';
const GOLD   = '#C9A24B';
const TEXT   = '#E7E9EA';
const TEXT2  = '#71767B';

const PLATFORM_COLOR: Record<string, string> = {
  youtube:'#FF0000', twitch:'#9146FF', kick:'#53FC18', streamyard:'#1DA1F2',
};

export default function LiveRoomPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const roomId       = String(params.roomId);
  const title        = searchParams.get('title') || 'Live STENO TV';
  const platform     = searchParams.get('platform') || 'youtube';
  const cat          = searchParams.get('cat') || 'Politique';

  const [showChat,     setShowChat]     = useState(true);
  const [isMobile,     setIsMobile]     = useState(false);
  const [elapsed,      setElapsed]      = useState(0);
  const [viewers,      setViewers]      = useState(Math.floor(Math.random()*400)+50);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(`https://stenograft.fr/dashboard/live/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fetch LiveKit token to join the room
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        const participantName = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? `guest_${Date.now()}`;

        const res = await fetch('/api/live/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: roomId, participantName }),
        });
        if (res.ok) {
          const { token } = await res.json() as { token: string };
          setLivekitToken(token);
        }
      } catch {
        // Non-blocking — chat still works via Supabase Realtime
      }
    };
    fetchToken();
  }, [roomId]);

  // End live on unmount — RLS blocks update for non-owners
  useEffect(() => {
    return () => {
      createClient().from('live_sessions').update({
        status:   'ended',
        ended_at: new Date().toISOString(),
      }).eq('room_id', roomId).eq('status', 'live');
    };
  }, [roomId]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Elapsed timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Viewers fluctuation
  useEffect(() => {
    const t = setInterval(() => setViewers(v => Math.max(1, v + Math.floor(Math.random()*8)-3)), 5000);
    return () => clearInterval(t);
  }, []);

  const fmtElapsed = (s: number) => {
    const h = Math.floor(s/3600);
    const m = Math.floor((s%3600)/60).toString().padStart(2,'0');
    const sec = (s%60).toString().padStart(2,'0');
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  };

  const platColor = PLATFORM_COLOR[platform] || RED;

  return (
    <>
      <style>{`
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { display:none; }
        @keyframes sg-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        .live-layout { display:flex; gap:0; height:calc(100vh - 49px); }
        .live-player { flex:1; min-width:0; display:flex; flex-direction:column; }
        .live-chat-col { width:320px; flex-shrink:0; border-left:1px solid ${BORDER}; }
        @media (max-width:639px) {
          .live-layout { flex-direction:column; height:auto; }
          .live-chat-col { width:100%; border-left:none; border-top:1px solid ${BORDER}; height:260px; }
        }
      `}</style>

      <div style={{ fontFamily:"'Inter',system-ui,sans-serif", color:TEXT, background:BG, minHeight:'100vh', paddingBottom: isMobile ? '110px' : '0' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: isMobile ? '8px 12px' : '10px 16px', borderBottom:`1px solid ${BORDER}`, background:`${BG}EE`, backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:20, gap:'8px' }}>

          {/* Left: back + title */}
          <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '8px' : '10px', minWidth:0 }}>
            <Link href="/dashboard/live" style={{ textDecoration:'none', color:TEXT2, fontSize:'12px', fontWeight:600, flexShrink:0 }}>←</Link>
            <div style={{ width:'1px', height:'14px', background:BORDER, flexShrink:0 }} />
            <div style={{ display:'flex', alignItems:'center', gap:'6px', minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', background:RED, borderRadius:'4px', padding:'2px 6px', flexShrink:0 }}>
                <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                <span style={{ color:'#fff', fontSize:'9px', fontWeight:800 }}>LIVE</span>
              </div>
              <p style={{ color:TEXT, fontSize: isMobile ? '12px' : '13px', fontWeight:700, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
            </div>
          </div>

          {/* Right: stats + chat toggle */}
          <div style={{ display:'flex', alignItems:'center', gap: isMobile ? '6px' : '10px', flexShrink:0 }}>
            {!isMobile && (
              <>
                <span style={{ color:TEXT2, fontSize:'11px' }}>⏱ {fmtElapsed(elapsed)}</span>
                <span style={{ color:TEXT2, fontSize:'11px' }}>👁 {viewers.toLocaleString()}</span>
                <span style={{ color:platColor, fontSize:'10px', background:`${platColor}18`, border:`1px solid ${platColor}30`, borderRadius:'100px', padding:'2px 8px', fontWeight:700 }}>
                  {platform.charAt(0).toUpperCase()+platform.slice(1)}
                </span>
              </>
            )}
            {isMobile && (
              <span style={{ color:TEXT2, fontSize:'10px' }}>👁 {viewers}</span>
            )}
            <button
              onClick={copyLink}
              style={{ padding: isMobile ? '5px 8px' : '5px 10px', borderRadius:'100px', border:`1px solid ${copied ? GOLD+'60' : BORDER}`, background: copied ? `${GOLD}12` : 'transparent', color: copied ? GOLD : TEXT2, fontSize:'11px', fontWeight:600, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}
            >
              {copied ? (isMobile ? '✓' : '✓ Lien copié !') : (isMobile ? '🔗' : '🔗 Partager')}
            </button>
            <button
              onClick={() => setShowChat(v => !v)}
              style={{ padding: isMobile ? '5px 8px' : '5px 10px', borderRadius:'100px', border:`1px solid ${showChat ? GOLD+'40' : BORDER}`, background: showChat ? `${GOLD}12` : 'transparent', color: showChat ? GOLD : TEXT2, fontSize:'11px', fontWeight:600, cursor:'pointer' }}
            >
              {isMobile ? '💬' : `💬 ${showChat ? 'Masquer' : 'Chat'}`}
            </button>
          </div>
        </div>

        <div className="live-layout">

          {/* Player column */}
          <div className="live-player">

            {/* Video placeholder */}
            <div style={{ flex:1, background:`linear-gradient(135deg,#0a0000 0%,#1a0505 50%,#050a00 100%)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight: isMobile ? '200px' : '300px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 30% 40%,${RED}10 0%,transparent 50%),radial-gradient(circle at 70% 60%,${GOLD}08 0%,transparent 50%)`, pointerEvents:'none' }} />

              <div style={{ textAlign:'center', zIndex:1, padding: isMobile ? '0 16px' : '0' }}>
                <div style={{ fontSize: isMobile ? '40px' : '64px', marginBottom: isMobile ? '10px' : '16px' }}>📡</div>
                <p style={{ color:TEXT, fontSize: isMobile ? '13px' : '16px', fontWeight:700, margin:`0 0 ${isMobile ? '4px' : '6px'}` }}>Stream en cours</p>
                {!isMobile && (
                  <p style={{ color:TEXT2, fontSize:'12px', margin:'0 0 20px' }}>Connectez votre logiciel de streaming (OBS, StreamYard…)</p>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'rgba(0,0,0,0.6)', borderRadius:'10px', padding: isMobile ? '8px 10px' : '10px 16px', marginTop: isMobile ? '8px' : '0', maxWidth: isMobile ? '280px' : 'none', overflow:'hidden' }}>
                  <div style={{ width: isMobile ? '6px' : '8px', height: isMobile ? '6px' : '8px', borderRadius:'50%', background:RED, animation:'sg-pulse 1.2s infinite', flexShrink:0 }} />
                  <code style={{ color:GOLD, fontSize: isMobile ? '9px' : '11px', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    rtmp://live.stenograft.fr/stream/{roomId}
                  </code>
                </div>
              </div>

              {/* Overlay badges */}
              <div style={{ position:'absolute', bottom:'10px', left:'10px', display:'flex', gap:'5px', flexWrap:'wrap' }}>
                <span style={{ background:'rgba(0,0,0,0.75)', borderRadius:'6px', padding:'2px 7px', color:TEXT2, fontSize:'9px', fontWeight:600 }}>{cat}</span>
                <span style={{ background:`${platColor}CC`, borderRadius:'6px', padding:'2px 7px', color:'#fff', fontSize:'9px', fontWeight:700 }}>
                  {platform.charAt(0).toUpperCase()+platform.slice(1)}
                </span>
              </div>

              {/* Timer overlay on mobile */}
              {isMobile && (
                <div style={{ position:'absolute', top:'8px', right:'8px', background:'rgba(0,0,0,0.7)', borderRadius:'6px', padding:'2px 8px' }}>
                  <span style={{ color:TEXT2, fontSize:'10px', fontWeight:600 }}>⏱ {fmtElapsed(elapsed)}</span>
                </div>
              )}
            </div>

            {/* Live info bar */}
            <div style={{ padding: isMobile ? '10px 12px' : '14px 16px', borderTop:`1px solid ${BORDER}`, background:SURF }}>
              <h2 style={{ color:TEXT, fontSize: isMobile ? '13px' : '16px', fontWeight:800, margin:`0 0 ${isMobile ? '3px' : '6px'}`, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</h2>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                <span style={{ color:RED, fontSize: isMobile ? '10px' : '12px', fontWeight:600 }}>{cat}</span>
                {!isMobile && (
                  <span style={{ color:TEXT2, fontSize:'12px' }}>· Démarré il y a <span style={{ color:TEXT, fontWeight:600 }}>{fmtElapsed(elapsed)}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* Chat column */}
          {showChat && (
            <div className="live-chat-col" style={{ padding:'10px' }}>
              <LiveChat roomId={roomId} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
