"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const RED = "#C8312A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const BG = "#0F1119";
const SURFACE = "#161926";
const BORDER = "#1F2436";

type Graft = {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  parent_id: string | null;
};

type GraftWithReplies = Graft & { replies: Graft[] };

export default function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [grafts, setGrafts] = useState<GraftWithReplies[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGrafts = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("grafts")
      .select("*")
      .order("created_at", { ascending: false });

    const all = (data ?? []) as Graft[];
    const roots = all.filter(g => !g.parent_id);
    const withReplies: GraftWithReplies[] = roots.map(g => ({
      ...g,
      replies: all.filter(r => r.parent_id === g.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    }));
    setGrafts(withReplies);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGrafts(); }, [fetchGrafts]);

  const handlePublished = (graft: Graft) => {
    if (!graft.parent_id) {
      setGrafts(prev => [{ ...graft, replies: [] }, ...prev]);
    } else {
      setGrafts(prev => prev.map(g =>
        g.id === graft.parent_id
          ? { ...g, replies: [...g.replies, graft] }
          : g
      ));
    }
  };

  const [replyTarget, setReplyTarget] = useState<Graft | null>(null);

  return (
    <div style={{ padding: "44px 52px", maxWidth: "720px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "36px" }}>
        <div>
          <h1 style={{ color: "#ECEAE2", fontSize: "22px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.3px" }}>Fil public</h1>
          <p style={{ color: "#2A2F45", fontSize: "13px", margin: 0 }}>Les grafts de la communauté</p>
        </div>
        <button onClick={() => setModalOpen(true)} style={{
          background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
          color: "#fff", border: `1px solid rgba(201,168,76,0.2)`,
          borderRadius: "12px", padding: "12px 26px",
          fontSize: "14px", fontWeight: 800, cursor: "pointer",
          boxShadow: `0 4px 20px rgba(200,49,42,0.4)`, letterSpacing: "0.5px",
        }}>Grafter</button>
      </div>

      <div style={{ height: "1px", background: `linear-gradient(90deg, ${BORDER} 0%, transparent 100%)`, marginBottom: "32px" }} />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "64px" }}>
          <p style={{ color: "#2A2F45", fontSize: "14px" }}>Chargement…</p>
        </div>
      ) : grafts.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "48px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "18px", border: `1px dashed ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", color: "#1F2436" }}>⊞</div>
          <p style={{ color: "#2A2F45", fontSize: "15px", fontWeight: 600, margin: 0 }}>Le fil est vide pour l'instant</p>
          <p style={{ color: "#1F2436", fontSize: "13px", margin: 0, textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>Sois le premier à grafter quelque chose.</p>
          <button onClick={() => setModalOpen(true)} style={{ marginTop: "8px", background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`, color: "#fff", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: "10px", padding: "10px 22px", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px rgba(200,49,42,0.3)` }}>
            Grafter
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {grafts.map(g => (
            <GraftThread key={g.id} graft={g} onReply={() => setReplyTarget(g)} />
          ))}
        </div>
      )}

      {(modalOpen || replyTarget) && (
        <GrafterModal
          parentGraft={replyTarget}
          onClose={() => { setModalOpen(false); setReplyTarget(null); }}
          onPublished={(g) => { handlePublished(g); setModalOpen(false); setReplyTarget(null); }}
        />
      )}
    </div>
  );
}

function GraftThread({ graft, onReply }: { graft: GraftWithReplies; onReply: () => void }) {
  const [showReplies, setShowReplies] = useState(graft.replies.length > 0);

  return (
    <div>
      <GraftCard graft={graft} onReply={onReply} isRoot />
      {graft.replies.length > 0 && (
        <div style={{ marginLeft: "20px", marginTop: "2px", position: "relative" }}>
          {/* Thread line */}
          <div style={{ position: "absolute", left: "15px", top: 0, bottom: "16px", width: "2px", background: `linear-gradient(180deg, ${GOLD}30 0%, transparent 100%)`, borderRadius: "2px" }} />
          {showReplies && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingLeft: "32px" }}>
              {graft.replies.map(r => (
                <GraftCard key={r.id} graft={r} isReply />
              ))}
            </div>
          )}
          <button
            onClick={() => setShowReplies(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: "12px", fontWeight: 700, padding: "6px 0 0 32px", opacity: 0.7, letterSpacing: "0.3px" }}
          >
            {showReplies
              ? "Masquer les réponses"
              : `Voir ${graft.replies.length} réponse${graft.replies.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}

function GraftCard({ graft, onReply, isRoot, isReply }: { graft: Graft; onReply?: () => void; isRoot?: boolean; isReply?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const date = new Date(graft.created_at).toLocaleString("fr-FR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isReply ? BG : SURFACE,
        border: `1px solid ${hovered && isRoot ? GOLD + "25" : BORDER}`,
        borderRadius: isReply ? "12px" : "16px",
        padding: isReply ? "14px 18px" : "20px 22px",
        transition: "border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <div style={{
          width: isReply ? "26px" : "32px", height: isReply ? "26px" : "32px",
          borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg, ${RED}80 0%, ${GOLD}40 100%)`,
          border: `1.5px solid ${GOLD}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: GOLD_LIGHT, fontSize: isReply ? "11px" : "13px", fontWeight: 800,
        }}>
          {graft.author_name[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ color: "#ECEAE2", fontSize: isReply ? "12px" : "13px", fontWeight: 700 }}>{graft.author_name}</span>
          <span style={{ color: "#2A2F45", fontSize: "12px", marginLeft: "8px" }}>{date}</span>
        </div>
        {isReply && (
          <span style={{ color: GOLD, fontSize: "10px", fontWeight: 700, opacity: 0.6, letterSpacing: "0.5px" }}>RÉPONSE</span>
        )}
      </div>

      <p style={{ color: isReply ? "#878DA0" : "#C8CADA", fontSize: isReply ? "14px" : "15px", lineHeight: 1.65, margin: 0, whiteSpace: "pre-wrap" }}>
        {graft.content}
      </p>

      {isRoot && onReply && (
        <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={onReply}
            style={{
              background: hovered ? `${RED}15` : "transparent",
              color: hovered ? RED : "#3A4060",
              border: `1px solid ${hovered ? RED + "40" : "transparent"}`,
              borderRadius: "8px", padding: "5px 12px",
              fontSize: "12px", fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: "5px",
              transition: "all 0.15s",
            }}
          >
            ↩ Répondre
          </button>
        </div>
      )}
    </div>
  );
}

function GrafterModal({ parentGraft, onClose, onPublished }: {
  parentGraft: Graft | null;
  onClose: () => void;
  onPublished: (g: Graft) => void;
}) {
  const [text, setText] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 500;
  const isReply = !!parentGraft;

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePublish = async () => {
    if (!text.trim()) return;
    setPublishing(true);
    setError(null);
    const supabase = createClient();
    const payload: Record<string, unknown> = { content: text.trim(), author_name: "Yahia" };
    if (parentGraft) payload.parent_id = parentGraft.id;

    const { data, error: err } = await supabase
      .from("grafts")
      .insert(payload)
      .select()
      .single();

    setPublishing(false);
    if (err) { setError(err.message); return; }
    onPublished(data as Graft);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${isReply ? GOLD : RED}`, borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: `0 24px 64px rgba(0,0,0,0.6)` }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: isReply ? "16px" : "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${RED}80 0%, ${GOLD}40 100%)`, border: `1.5px solid ${GOLD}50`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD_LIGHT, fontSize: "13px", fontWeight: 800 }}>Y</div>
            <div>
              <span style={{ color: "#ECEAE2", fontSize: "14px", fontWeight: 700 }}>Yahia</span>
              {isReply && <span style={{ color: GOLD, fontSize: "12px", marginLeft: "6px", opacity: 0.8 }}>répond à {parentGraft!.author_name}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#5A6076", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        {/* Quoted graft for replies */}
        {isReply && (
          <div style={{ background: BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}50`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
            <p style={{ color: "#5A6076", fontSize: "12px", fontWeight: 700, margin: "0 0 4px" }}>{parentGraft!.author_name}</p>
            <p style={{ color: "#3A4060", fontSize: "13px", margin: 0, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {parentGraft!.content}
            </p>
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          placeholder={isReply ? `Ta réponse à ${parentGraft!.author_name}…` : "Exprime-toi…"}
          style={{ width: "100%", minHeight: isReply ? "100px" : "140px", background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", color: "#ECEAE2", fontSize: "15px", lineHeight: 1.6, resize: "vertical", outline: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" }}
          onFocus={e => (e.currentTarget.style.borderColor = isReply ? `${GOLD}50` : `${GOLD}50`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />

        {error && <p style={{ color: RED, fontSize: "12px", margin: "8px 0 0", fontWeight: 600 }}>{error}</p>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: text.length > MAX * 0.85 ? RED : "#2A2F45" }}>
            {text.length} / {MAX}
          </span>
          <button
            onClick={handlePublish}
            disabled={!text.trim() || publishing}
            style={{
              background: !text.trim() ? "#1F2436" : `linear-gradient(135deg, ${isReply ? GOLD : RED} 0%, ${isReply ? "#8B6E1A" : "#8B1A15"} 100%)`,
              color: !text.trim() ? "#3A4060" : "#fff",
              border: `1px solid ${!text.trim() ? "transparent" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "10px", padding: "10px 24px", fontSize: "14px", fontWeight: 800,
              cursor: text.trim() && !publishing ? "pointer" : "not-allowed",
              boxShadow: text.trim() ? `0 4px 16px rgba(200,49,42,0.35)` : "none",
              transition: "all 0.15s",
            }}
          >
            {publishing ? "Publication…" : isReply ? "Publier la réponse" : "Publier le graft"}
          </button>
        </div>
      </div>
    </div>
  );
}
