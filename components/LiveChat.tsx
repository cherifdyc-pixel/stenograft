'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import SuperChatModal from '@/components/SuperChatModal';

const BG     = '#000000';
const SURF   = '#0A0A0A';
const BORDER = '#1C1C1C';
const RED    = '#E0492F';
const GOLD   = '#C9A24B';
const TEXT   = '#E7E9EA';
const TEXT2  = '#71767B';
const TEXT3  = '#2A2A2A';

type LiveMessage = {
  id:         string;
  user_id?:   string | null;
  username:   string;
  content:    string;
  type:       'message' | 'super_chat' | 'system';
  amount:     number;
  created_at: string;
};

const COLORS = [RED, GOLD, '#4BC9C9', '#C94BC9', '#4BC94B', '#4B9AC9'];
const userColor = (username: string) => COLORS[username.charCodeAt(0) % COLORS.length];

const SEED: Omit<LiveMessage, 'id'>[] = [
  { username:'StenoFan',   content:'Super live ! 🔥',                type:'message',    amount:0, created_at:new Date(Date.now()-180000).toISOString() },
  { username:'Grafter75',  content:'Enfin un débat sérieux',          type:'message',    amount:0, created_at:new Date(Date.now()-150000).toISOString() },
  { username:'PolitikFR',  content:'Je suis entièrement d\'accord',   type:'message',    amount:0, created_at:new Date(Date.now()-120000).toISOString() },
  { username:'CitoyenX',   content:'Question pour la prochaine fois ?', type:'message', amount:0, created_at:new Date(Date.now()-90000).toISOString() },
  { username:'ViveLaRep',  content:'Merci pour ce contenu 🇫🇷',      type:'super_chat', amount:5, created_at:new Date(Date.now()-60000).toISOString() },
  { username:'Anonyme99',  content:'C\'est exactement ça !',          type:'message',    amount:0, created_at:new Date(Date.now()-30000).toISOString() },
];

export default function LiveChat({ roomId }: { roomId: string }) {
  const [messages,      setMessages]      = useState<LiveMessage[]>(SEED.map((m, i) => ({ ...m, id: `seed_${i}` })));
  const [input,         setInput]         = useState('');
  const [username,      setUsername]      = useState('Grafter');
  const [loading,       setLoading]       = useState(false);
  const [spectators,    setSpectators]    = useState(Math.floor(Math.random() * 500) + 50);
  const [dbOk,          setDbOk]          = useState(false);
  const [showSuperChat, setShowSuperChat] = useState(false);
  const [foundersSet,   setFoundersSet]   = useState<Set<string>>(new Set());
  const foundersRef  = useRef<Set<string>>(new Set());
  const checkedRef   = useRef<Set<string>>(new Set());
  const bottomRef    = useRef<HTMLDivElement>(null);

  // Batch-check which user IDs are founders, caching results to avoid duplicate queries
  const markFounders = useCallback(async (userIds: (string | null | undefined)[]) => {
    const fresh = userIds.filter((id): id is string => !!id && !checkedRef.current.has(id));
    if (!fresh.length) return;
    fresh.forEach(id => checkedRef.current.add(id));
    const sb = createClient();
    const { data } = await sb.from('profiles').select('id').eq('is_founder', true).in('id', fresh);
    if (data?.length) {
      data.forEach(r => foundersRef.current.add(r.id));
      setFoundersSet(new Set(foundersRef.current));
    }
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUsername(user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Grafter');

      const { data, error } = await supabase
        .from('live_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (!error) {
        setDbOk(true);
        if (data && data.length > 0) setMessages(data as LiveMessage[]);

        // Batch-check founder status for all message authors + current user
        const uids = [...new Set([
          ...(data ?? []).map((m: any) => m.user_id),
          user?.id,
        ])];
        markFounders(uids);

        const channel = supabase.channel(`live:${roomId}`)
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public',
            table: 'live_messages',
            filter: `room_id=eq.${roomId}`,
          }, (payload) => {
            const msg = payload.new as LiveMessage;
            setMessages(prev => [...prev, msg]);
            if (msg.user_id) markFounders([msg.user_id]);
          })
          .subscribe();
        cleanup = () => { supabase.removeChannel(channel); };
      }

      const interval = setInterval(() => {
        setSpectators(v => Math.max(1, v + Math.floor(Math.random() * 10) - 4));
      }, 3000);

      return () => { cleanup?.(); clearInterval(interval); };
    };

    const cleanup2 = init();
    return () => { cleanup2.then(fn => fn?.()); };
  }, [roomId, markFounders]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (superAmount = 0) => {
    if (!input.trim() || loading) return;
    const trimmed = input.trim();
    setLoading(true);

    if (dbOk) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('live_messages').insert({
        room_id: roomId,
        user_id: user?.id,
        username,
        content: trimmed,
        type: superAmount > 0 ? 'super_chat' : 'message',
        amount: superAmount,
      });
      if (error) { setLoading(false); return; }
    } else {
      setMessages(prev => [...prev, {
        id: `local_${Date.now()}`,
        username,
        content: trimmed,
        type: superAmount > 0 ? 'super_chat' : 'message',
        amount: superAmount,
        created_at: new Date().toISOString(),
      }]);
    }

    setInput('');
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @keyframes fadeSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        .lc-msg { animation: fadeSlide 0.2s ease; }
      `}</style>

      <div style={{ display:'flex', flexDirection:'column', height:'100%', background:SURF, borderRadius:'14px', border:`1px solid ${BORDER}`, overflow:'hidden', fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* Header */}
        <div style={{ padding:'11px 14px', borderBottom:`1px solid ${BORDER}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:BG, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:RED, display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
            <span style={{ color:TEXT, fontSize:'13px', fontWeight:700 }}>Chat en direct</span>
          </div>
          <span style={{ color:TEXT2, fontSize:'11px' }}>👁 {spectators.toLocaleString()}</span>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'5px', scrollbarWidth:'none' }}>
          {messages.length === 0 && (
            <div style={{ textAlign:'center', color:TEXT3, fontSize:'12px', padding:'24px 0' }}>
              Soyez le premier à écrire dans le chat
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="lc-msg" style={{
              padding:      msg.type === 'super_chat' ? '8px 10px' : '1px 0',
              background:   msg.type === 'super_chat' ? `${GOLD}18` : 'transparent',
              borderRadius: msg.type === 'super_chat' ? '8px' : '0',
              border:       msg.type === 'super_chat' ? `1px solid ${GOLD}35` : 'none',
            }}>
              {msg.type === 'super_chat' && (
                <div style={{ fontSize:'10px', color:GOLD, fontWeight:700, marginBottom:'3px' }}>
                  ⭐ SUPER CHAT · {msg.amount}€
                </div>
              )}
              {msg.type === 'system' ? (
                <div style={{ color:TEXT2, fontSize:'11px', fontStyle:'italic', textAlign:'center', padding:'4px 0' }}>{msg.content}</div>
              ) : (
                <span style={{ fontSize:'13px', lineHeight:1.5 }}>
                  <span style={{ color:userColor(msg.username), fontWeight:700 }}>{msg.username}</span>
                  {msg.user_id && foundersSet.has(msg.user_id) && (
                    <span
                      title="Grafter Fondateur"
                      style={{
                        display:'inline-flex', alignItems:'center',
                        fontSize:'9px', color:GOLD, fontWeight:700,
                        padding:'1px 4px', borderRadius:'4px',
                        background:`${GOLD}18`, border:`1px solid ${GOLD}40`,
                        margin:'0 4px', verticalAlign:'middle',
                      }}
                    >
                      ⭐
                    </span>
                  )}
                  <span style={{ color:'#c8cada', marginLeft: msg.user_id && foundersSet.has(msg.user_id) ? '0' : '5px' }}>{msg.content}</span>
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding:'10px 12px', borderTop:`1px solid ${BORDER}`, background:BG, flexShrink:0 }}>
          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
            <button
              onClick={() => setShowSuperChat(true)}
              title="Super Chat"
              style={{ width:'36px', height:'36px', borderRadius:'50%', background:`${GOLD}22`, border:`1px solid ${GOLD}44`, color:GOLD, fontSize:'16px', cursor:'pointer', flexShrink:0 }}
            >⭐</button>
            <input
              value={input}
              onChange={e => setInput(e.target.value.slice(0, 200))}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Écrire dans le chat…"
              style={{ flex:1, padding:'8px 12px', borderRadius:'20px', background:'#111', border:`1px solid ${BORDER}`, color:TEXT, fontSize:'13px', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s' }}
              onFocus={e => (e.currentTarget.style.borderColor = RED+'60')}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              style={{ width:'34px', height:'34px', borderRadius:'50%', background: input.trim() ? RED : '#1a1a1a', border:'none', color:'#fff', fontSize:'16px', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink:0, transition:'background 0.15s', boxShadow: input.trim() ? `0 2px 10px ${RED}55` : 'none' }}
            >↑</button>
          </div>
          <div style={{ textAlign:'right', fontSize:'9px', color:TEXT3, marginTop:'3px' }}>{input.length}/200</div>
        </div>
      </div>

      {showSuperChat && (
        <SuperChatModal
          roomId={roomId}
          onSuccess={(amount, message) => {
            if (!dbOk) {
              setMessages(prev => [...prev, {
                id:         `sc_${Date.now()}`,
                username,
                content:    message || `Super Chat de ${amount}€`,
                type:       'super_chat',
                amount,
                created_at: new Date().toISOString(),
              }]);
            }
            setShowSuperChat(false);
          }}
          onClose={() => setShowSuperChat(false)}
        />
      )}
    </>
  );
}
