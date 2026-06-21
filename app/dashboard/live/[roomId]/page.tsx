'use client';
import { useState, useEffect, useRef } from 'react';
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
const TEXT3  = '#2A2A2A';

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

  const [showChat,    setShowChat]    = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);
  const [elapsed,     setElapsed]     = useState(0);
  const [viewers,     setViewers]     = useState(Math.floor(Math.random()*400)+50);
  const isOwnerRef = useRef(false);

  // Check ownership + end live on unmount
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const uid = data.user.id;
      sb.from('live_sessions')
        .select('user_id')
        .eq('room_id', roomId)
        .single()
        .then(({ data: session }) => {
          isOwnerRef.current = session?.user_id === uid;
        });
    });

    return () => {
      if (!isOwnerRef.current) return;
      const sb2 = createClient();
      sb2.from('live_sessions').update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      }).eq('room_id', roomId);
    };
  }, [roomId]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
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
        .live-layout { display:flex; gap:0; height:calc(100vh - 0px); }
        .live-player { flex:1; min-width:0; display:flex; flex-direction:column; }
        .live-chat-col { width:320px; flex-shrink:0; border-left:1px solid ${BORDER}; }
        @media (max-width:900px) {
          .live-layout { flex-direction:column; height:auto; }
          .live-chat-col { width:100%; border-left:none; border-top:1px solid ${BORDER}; height:420px; }
        }
      `}</style>

      <div style={{ fontFamily:"'Inter',system-ui,sans-serif", color:TEXT, background:BG, minHeight:'100vh' }}>

        {/* Top bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:`1px solid ${BORDER}`, background:`${BG}EE`, backdropFilter:'blur(12px)', position:'sticky', top:0, zIndex:20, gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', minWidth:0 }}>
            <Link href="/dashboard/tv" style={{ textDecoration:'none', color:TEXT2, fontSize:'12px', fontWeight:600, flexShrink:0 }}>← TV</Link>
            <div style={{ width:'1px', height:'14px', background:BORDER, flexShrink:0 }} />
            <div style={{ display:'flex', alignItems:'center', gap:'7px', minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'4px', background:RED, borderRadius:'4px', padding:'2px 8px', flexShrink:0 }}>
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                <span style={{ color:'#fff', fontSize:'10px', fontWeight:800 }}>LIVE</span>
              </div>
              <p style={{ color:TEXT, fontSize:'13px', fontWeight:700, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</p>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            <span style={{ color:TEXT2, fontSize:'11px' }}>⏱ {fmtElapsed(elapsed)}</span>
            <span style={{ color:TEXT2, fontSize:'11px' }}>👁 {viewers.toLocaleString()}</span>
            <span style={{ color:platColor, fontSize:'10px', background:`${platColor}18`, border:`1px solid ${platColor}30`, borderRadius:'100px', padding:'2px 8px', fontWeight:700 }}>
              {platform.charAt(0).toUpperCase()+platform.slice(1)}
            </span>
            <button onClick={() => setShowChat(v => !v)} style={{ padding:'5px 10px', borderRadius:'100px', border:`1px solid ${showChat ? GOLD+'40' : BORDER}`, background: showChat ? `${GOLD}12` : 'transparent', color: showChat ? GOLD : TEXT2, fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
              💬 {showChat ? 'Masquer' : 'Chat'}
            </button>
          </div>
        </div>

        <div className="live-layout">

          {/* Player column */}
          <div className="live-player">
            {/* Video placeholder */}
            <div style={{ flex:1, background:`linear-gradient(135deg,#0a0000 0%,#1a0505 50%,#050a00 100%)`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'300px', position:'relative', overflow:'hidden' }}>
              {/* Fake stream visual */}
              <div style={{ position:'absolute', inset:0, backgroundImage:`radial-gradient(circle at 30% 40%,${RED}10 0%,transparent 50%),radial-gradient(circle at 70% 60%,${GOLD}08 0%,transparent 50%)`, pointerEvents:'none' }} />

              <div style={{ textAlign:'center', zIndex:1 }}>
                <div style={{ fontSize:'64px', marginBottom:'16px' }}>📡</div>
                <p style={{ color:TEXT, fontSize:'16px', fontWeight:700, margin:'0 0 6px' }}>Stream en cours</p>
                <p style={{ color:TEXT2, fontSize:'12px', margin:'0 0 20px' }}>Connectez votre logiciel de streaming (OBS, StreamYard…)</p>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'rgba(0,0,0,0.6)', borderRadius:'10px', padding:'10px 16px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:RED, animation:'sg-pulse 1.2s infinite', flexShrink:0 }} />
                  <code style={{ color:GOLD, fontSize:'11px', fontFamily:'monospace' }}>rtmp://live.stenograft.fr/stream/{roomId}</code>
                </div>
              </div>

              {/* Overlays info */}
              <div style={{ position:'absolute', bottom:'14px', left:'14px', display:'flex', gap:'7px', flexWrap:'wrap' }}>
                <span style={{ background:'rgba(0,0,0,0.75)', borderRadius:'6px', padding:'3px 9px', color:TEXT2, fontSize:'10px', fontWeight:600 }}>{cat}</span>
                <span style={{ background:`${platColor}CC`, borderRadius:'6px', padding:'3px 9px', color:'#fff', fontSize:'10px', fontWeight:700 }}>
                  {platform.charAt(0).toUpperCase()+platform.slice(1)}
                </span>
              </div>
            </div>

            {/* Live info bar */}
            <div style={{ padding:'14px 16px', borderTop:`1px solid ${BORDER}`, background:SURF }}>
              <h2 style={{ color:TEXT, fontSize:'16px', fontWeight:800, margin:'0 0 6px' }}>{title}</h2>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
                <span style={{ color:TEXT2, fontSize:'12px' }}>Catégorie : <span style={{ color:RED, fontWeight:600 }}>{cat}</span></span>
                <span style={{ color:TEXT2, fontSize:'12px' }}>Démarré il y a <span style={{ color:TEXT, fontWeight:600 }}>{fmtElapsed(elapsed)}</span></span>
              </div>
            </div>

            {/* Mobile chat toggle */}
            {isMobile && (
              <div style={{ padding:'10px 16px', borderTop:`1px solid ${BORDER}` }}>
                <button onClick={() => setShowChat(v => !v)} style={{ width:'100%', padding:'10px', borderRadius:'10px', border:`1px solid ${BORDER}`, background:'transparent', color:TEXT2, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                  {showChat ? '▲ Masquer le chat' : '▼ Afficher le chat'}
                </button>
              </div>
            )}
          </div>

          {/* Chat column */}
          {showChat && (
            <div className="live-chat-col" style={{ padding:'12px' }}>
              <LiveChat roomId={roomId} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
