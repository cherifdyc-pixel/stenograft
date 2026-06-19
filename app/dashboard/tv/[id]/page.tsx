"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { LIVE_STREAMS } from "../page";

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

// ── Chat data ─────────────────────────────────────────────────────────────────

type ChatMsg = { id: number; author: string; hue: number; text: string; verified?: boolean };

const MSG_POOL: Omit<ChatMsg, "id">[] = [
  { author: "Soraya M.",   hue: 210, text: "C'est exactement le point crucial ici 🔥" },
  { author: "Karim D.",    hue: 140, text: "Merci pour cette retransmission en direct !" },
  { author: "Léa V.",      hue: 280, text: "On en discutait ce matin, content de voir ça ici" },
  { author: "Fouad K.",    hue: 35,  text: "Peut-on avoir les sources ?" },
  { author: "Priya F.",    hue: 330, text: "Je partage à ma communauté 🇫🇷" },
  { author: "Adrien T.",   hue: 70,  text: "La démocratie en action 💪" },
  { author: "Camille R.",  hue: 195, text: "Question : qui finance ce programme ?" },
  { author: "Baptiste L.", hue: 300, text: "Excellent sujet, continuez comme ça" },
  { author: "Marine P.",   hue: 165, text: "Ce passage m'a vraiment surpris" },
  { author: "Thomas G.",   hue: 50,  text: "On vote pour ce projet ou contre ?" },
  { author: "Yasmine B.",  hue: 15,  text: "❤️ depuis Lyon" },
  { author: "Romain C.",   hue: 240, text: "Je suis 100% pour cette mesure" },
  { author: "Inès M.",     hue: 90,  text: "Grafter ce moment dans le Registre !" },
  { author: "Hugo S.",     hue: 350, text: "Quelqu'un peut résumer ce point ?" },
  { author: "Yahia",       hue: 0,   text: "La parole est tenue 🔴", verified: true },
];

const INIT_MSGS: ChatMsg[] = MSG_POOL.slice(0, 6).map((m, i) => ({ ...m, id: i }));

// ── GrafterModal ──────────────────────────────────────────────────────────────

function GrafterModal({ streamTitle, onClose }: { streamTitle: string; onClose: () => void }) {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    await new Promise(r => setTimeout(r, 800));
    setDone(true);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "20px", width: "100%", maxWidth: "500px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>🏛️</span>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: TEXT }}>Grafter ce moment</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "22px", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ padding: "16px 18px" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🏛️</div>
              <p style={{ color: GOLD, fontSize: "16px", fontWeight: 800, margin: "0 0 6px" }}>Ancré dans le Registre</p>
              <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Cette déclaration est désormais un contrat public.</p>
              <button onClick={onClose} style={{ marginTop: "16px", background: GOLD, border: "none", borderRadius: "100px", padding: "10px 24px", color: BG, fontSize: "14px", fontWeight: 800, cursor: "pointer" }}>Fermer</button>
            </div>
          ) : (
            <>
              <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 12px", lineHeight: 1.5 }}>
                Ancrez une déclaration du live <span style={{ color: TEXT, fontWeight: 600 }}>"{streamTitle}"</span> dans Le Registre — elle deviendra un contrat public opposable.
              </p>
              <textarea
                autoFocus
                rows={4}
                placeholder="Transcrivez la déclaration exacte ou votre interprétation de ce moment…"
                value={text}
                onChange={e => setText(e.target.value)}
                maxLength={280}
                style={{ width: "100%", background: "#0C0C0C", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit", resize: "none", boxSizing: "border-box" }}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
                <span style={{ fontSize: "12px", color: TEXT2 }}>{text.length}/280</span>
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  style={{ background: text.trim() ? GOLD : "#222", border: "none", borderRadius: "100px", padding: "10px 22px", color: text.trim() ? BG : TEXT2, fontSize: "14px", fontWeight: 800, cursor: text.trim() ? "pointer" : "not-allowed", transition: "background 0.15s" }}
                >
                  Ancrer dans le Registre
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Live Viewer ───────────────────────────────────────────────────────────────

type FloatHeart = { id: number; x: number };

export default function LiveViewerPage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();

  const stream = LIVE_STREAMS.find(s => String(s.id) === id) ?? {
    id: 0,
    title: id === "live" ? "Mon Live en cours" : "Stream STENOGRAFT TV",
    channel: "STENOGRAFT TV",
    viewers: 1,
    hue: 0,
    hue2: 30,
    tag: "Live",
    elapsed: "0min",
  };

  const [messages, setMessages]   = useState<ChatMsg[]>(INIT_MSGS);
  const [viewers, setViewers]     = useState(id === "live" ? 1 : stream.viewers);
  const [hearts, setHearts]       = useState<FloatHeart[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showGrafter, setShowGrafter] = useState(false);
  const [heartCount, setHeartCount]   = useState(0);
  const [shared, setShared]           = useState(false);

  const chatRef  = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const msgIdx   = useRef(6);

  // Auto-scroll chat
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Rolling chat messages
  useEffect(() => {
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        const msg = MSG_POOL[msgIdx.current % MSG_POOL.length];
        msgIdx.current++;
        setMessages(prev => [...prev.slice(-60), { ...msg, id: Date.now() + Math.random() }]);
        schedule();
      }, 900 + Math.random() * 2200);
    };
    schedule();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // Viewer drift
  useEffect(() => {
    const t = setInterval(() => {
      setViewers(v => {
        if (id === "live") return v + (Math.random() > 0.4 ? 1 : 0);
        return Math.max(1, v + Math.floor(Math.random() * 9) - 4);
      });
    }, 2600);
    return () => clearInterval(t);
  }, [id]);

  // Auto hearts for big streams
  useEffect(() => {
    if (stream.viewers < 500 || id === "live") return;
    const t = setInterval(() => {
      addHeart(1, true);
    }, 1200 + Math.random() * 1000);
    return () => clearInterval(t);
  }, [stream.viewers, id]);

  const addHeart = useCallback((count = 3, auto = false) => {
    if (!auto) setHeartCount(c => c + count);
    const batch: FloatHeart[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i + Math.random(),
      x: 5 + Math.random() * 45,
    }));
    setHearts(prev => [...prev.slice(-25), ...batch]);
    const ids = new Set(batch.map(h => h.id));
    setTimeout(() => setHearts(prev => prev.filter(h => !ids.has(h.id))), 2500);
  }, []);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMsg = { id: Date.now(), author: "Yahia", hue: 0, text: chatInput.trim(), verified: true };
    setMessages(prev => [...prev.slice(-60), msg]);
    setChatInput("");
  };

  const share = () => {
    const url = `${window.location.origin}/dashboard/tv/${id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setShared(true);
    setTimeout(() => setShared(false), 2200);
  };

  return (
    <>
      <style>{`
        @keyframes live-dot2 { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(0.75)} }
        @keyframes heart-up {
          0%   { opacity:1;   transform:translateY(0) scale(1) rotate(-6deg); }
          30%  {              transform:translateY(-60px) scale(1.25) rotate(7deg); }
          70%  { opacity:0.6; transform:translateY(-160px) scale(0.8) rotate(-4deg); }
          100% { opacity:0;   transform:translateY(-240px) scale(0.45) rotate(12deg); }
        }
        @keyframes vid-bg {
          0%,100%{filter:brightness(1)    saturate(1)    hue-rotate(0deg)}
          40%    {filter:brightness(1.08) saturate(1.2)  hue-rotate(7deg)}
          70%    {filter:brightness(0.92) saturate(0.9)  hue-rotate(-6deg)}
        }
        @keyframes viewer-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .tv-chat-msg { animation: fadein-up 0.25s ease both; }
        @keyframes fadein-up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        * { box-sizing:border-box; }
      `}</style>

      {/* Full-screen overlay */}
      <div style={{ position: "fixed", inset: 0, zIndex: 800, background: BG, display: "flex", flexDirection: "column", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: `${BG}E0`, backdropFilter: "blur(10px)", borderBottom: `1px solid ${BORDER}`, flexShrink: 0, zIndex: 10 }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", color: TEXT, fontSize: "20px", cursor: "pointer", lineHeight: 1, padding: "4px 8px 4px 0", flexShrink: 0 }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", background: RED, color: "#fff", fontSize: "10px", fontWeight: 800, letterSpacing: "1px", padding: "3px 8px", borderRadius: "4px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#fff", animation: "live-dot2 1.3s ease-in-out infinite" }} />
                {id === "live" ? "VOTRE LIVE" : "LIVE"}
              </span>
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stream.title}</p>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>{stream.channel}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            <button
              onClick={() => setShowGrafter(true)}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: `${GOLD}18`, border: `1px solid ${GOLD}35`, borderRadius: "8px", padding: "7px 12px", color: GOLD, fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
            >🏛️ Grafter</button>
            <button
              onClick={share}
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "7px 12px", color: shared ? "#2ECC71" : TEXT2, fontSize: "13px", fontWeight: 600, cursor: "pointer", transition: "color 0.15s" }}
            >{shared ? "✓ Copié !" : "🔗 Partager"}</button>
          </div>
        </div>

        {/* ── Body: video + chat ── */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>

          {/* Video area */}
          <div style={{ flex: 1, position: "relative", background: `linear-gradient(125deg, hsl(${stream.hue},45%,6%) 0%, hsl(${stream.hue2 ?? stream.hue + 30},58%,13%) 55%, hsl(${stream.hue},38%,8%) 100%)`, animation: "vid-bg 6s ease-in-out infinite", overflow: "hidden" }}>

            {/* Scan lines */}
            <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,rgba(0,0,0,0.04) 0px,rgba(0,0,0,0.04) 1px,transparent 1px,transparent 4px)", pointerEvents: "none" }} />

            {/* Center play icon */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <span style={{ color: "#fff", fontSize: "28px", marginLeft: "4px", opacity: 0.7 }}>▶</span>
              </div>
            </div>

            {/* Viewer counter */}
            <div style={{ position: "absolute", top: "14px", right: "14px", display: "flex", alignItems: "center", gap: "6px", background: "rgba(0,0,0,0.68)", backdropFilter: "blur(6px)", borderRadius: "8px", padding: "6px 12px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: RED, animation: "viewer-pulse 2s ease-in-out infinite" }} />
              <span style={{ color: TEXT, fontSize: "13px", fontWeight: 700 }}>{fmtN(viewers)} spectateurs</span>
            </div>

            {/* Hearts overlay */}
            {hearts.map(h => (
              <span key={h.id} style={{ position: "absolute", bottom: "90px", left: `${h.x}%`, fontSize: "26px", animation: "heart-up 2.4s ease-out forwards", pointerEvents: "none", userSelect: "none" }}>❤️</span>
            ))}

            {/* Bottom controls */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 16px 16px", background: "linear-gradient(to top,rgba(0,0,0,0.9) 0%,transparent 100%)", display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => addHeart(3)}
                style={{ display: "flex", alignItems: "center", gap: "7px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "10px 20px", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", backdropFilter: "blur(6px)", transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                ❤️ <span>{heartCount > 0 ? fmtN(heartCount) : ""}</span>
              </button>
              <button
                onClick={() => setShowGrafter(true)}
                style={{ display: "flex", alignItems: "center", gap: "7px", background: `${GOLD}20`, border: `1px solid ${GOLD}45`, borderRadius: "100px", padding: "10px 20px", color: GOLD, fontSize: "15px", fontWeight: 700, cursor: "pointer", backdropFilter: "blur(6px)" }}
              >
                🏛️ Grafter ce moment
              </button>
            </div>
          </div>

          {/* Chat panel */}
          <div style={{ width: "320px", flexShrink: 0, display: "flex", flexDirection: "column", borderLeft: `1px solid ${BORDER}`, background: SURFACE }}>
            {/* Chat header */}
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px" }}>💬</span>
                <span style={{ color: TEXT, fontSize: "14px", fontWeight: 700 }}>Chat en direct</span>
                <span style={{ color: TEXT2, fontSize: "12px", marginLeft: "auto" }}>{fmtN(viewers)} en ligne</span>
              </div>
            </div>

            {/* Messages */}
            <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "10px", scrollbarWidth: "none" }}>
              {messages.map(m => (
                <div key={m.id} className="tv-chat-msg" style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: `linear-gradient(135deg,hsl(${m.hue},55%,18%) 0%,hsl(${(m.hue+45)%360},65%,38%) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 800, flexShrink: 0, border: m.verified ? `1.5px solid ${GOLD}` : "none" }}>{m.author[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ color: m.verified ? GOLD : TEXT, fontSize: "12px", fontWeight: 700 }}>{m.author}</span>
                    {m.verified && <span style={{ color: GOLD, fontSize: "10px", marginLeft: "4px" }}>✓</span>}
                    <p style={{ margin: "2px 0 0", color: TEXT2, fontSize: "13px", lineHeight: 1.45, wordBreak: "break-word" }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat input */}
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${BORDER}`, display: "flex", gap: "8px", flexShrink: 0 }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                placeholder="Réagir au live…"
                maxLength={200}
                style={{ flex: 1, background: "#0C0C0C", border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit" }}
                onFocus={e => (e.currentTarget.style.borderColor = RED)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim()}
                style={{ background: chatInput.trim() ? RED : "#1a1a1a", border: "none", borderRadius: "8px", padding: "9px 14px", color: "#fff", fontSize: "14px", cursor: chatInput.trim() ? "pointer" : "default", fontWeight: 700, transition: "background 0.12s", flexShrink: 0 }}
              >→</button>
            </div>
          </div>
        </div>
      </div>

      {showGrafter && <GrafterModal streamTitle={stream.title} onClose={() => setShowGrafter(false)} />}
    </>
  );
}
