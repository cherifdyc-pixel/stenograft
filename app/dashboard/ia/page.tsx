"use client";
import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

const QUICK_CHIPS = [
  { label: "📰 Actu du jour",         prompt: "Quelles sont les principales actualités françaises du moment ?" },
  { label: "🏛️ Le Registre",          prompt: "Explique-moi ce qu'est Le Registre dans STENOGRAFT et comment il fonctionne." },
  { label: "📊 Tendances",            prompt: "Quels sont les sujets les plus débattus en France en ce moment ?" },
  { label: "⚖️ Politique",            prompt: "Quel est l'état actuel de la politique française ?" },
  { label: "🗺️ Mon territoire",       prompt: "Comment utiliser la fonctionnalité Territoires de STENOGRAFT ?" },
  { label: "🤔 C'est quoi STENOGRAFT ?", prompt: "Explique-moi STENOGRAFT en 3 points clés." },
];

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/mistral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role:    "assistant",
        content: data.response ?? "Erreur de réponse.",
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Une erreur est survenue. Réessaie.",
      }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: "600px", margin: "0 auto", padding: "24px 16px",
      display: "flex", flexDirection: "column", minHeight: "calc(100vh - 80px)",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "24px", paddingBottom: "20px", borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: TEXT, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
          🤖 Le Grafter IA
        </h1>
        <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Propulsé par Mistral AI 🇫🇷</p>
      </div>

      {/* ── Fil de conversation ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>

        {/* État vide */}
        {messages.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "14px", lineHeight: 1 }}>🤖</div>
            <div style={{ fontSize: "16px", fontWeight: 700, color: TEXT, marginBottom: "8px" }}>
              Bonjour, je suis le Grafter IA
            </div>
            <div style={{ fontSize: "13px", color: TEXT2, marginBottom: "28px", lineHeight: 1.6 }}>
              Posez-moi une question sur l'actualité,<br />le débat politique, ou STENOGRAFT.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  onClick={() => send(chip.prompt)}
                  style={{
                    padding: "9px 16px", borderRadius: "100px",
                    background: SURF, border: `1px solid ${BORDER}`,
                    color: TEXT2, fontSize: "13px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = TEXT; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "12px 16px",
              borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              background: msg.role === "user" ? RED : "#111",
              color: TEXT, fontSize: "14px", lineHeight: 1.65,
              border: msg.role === "assistant" ? `1px solid ${BORDER}` : "none",
            }}>
              {msg.role === "assistant" && (
                <div style={{ fontSize: "10px", color: TEXT2, marginBottom: "7px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Grafter IA · Mistral 🇫🇷
                </div>
              )}
              <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "12px 18px", borderRadius: "18px 18px 18px 4px",
              background: "#111", border: `1px solid ${BORDER}`,
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              {[0, 1, 2].map(k => (
                <span key={k} style={{
                  width: "6px", height: "6px", borderRadius: "50%",
                  background: TEXT2, display: "inline-block",
                  animation: `sg-dot 1.2s ${k * 0.2}s infinite ease-in-out`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        display: "flex", gap: "8px", alignItems: "flex-end",
        position: "sticky", bottom: "80px",
        background: BG, paddingTop: "10px",
        borderTop: `1px solid ${BORDER}`,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          placeholder="Posez votre question…"
          rows={1}
          style={{
            flex: 1, padding: "12px 16px", borderRadius: "24px",
            background: SURF, border: `1px solid ${BORDER}`,
            color: TEXT, fontSize: "14px", outline: "none",
            resize: "none", fontFamily: "inherit", lineHeight: 1.5,
            transition: "border-color 0.15s",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          style={{
            width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0,
            background: input.trim() && !loading ? RED : "#1a1a1a",
            border: "none", color: "#fff", fontSize: "20px",
            cursor: input.trim() && !loading ? "pointer" : "not-allowed",
            transition: "background 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          ↑
        </button>
      </div>

      <style>{`
        @keyframes sg-dot {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
