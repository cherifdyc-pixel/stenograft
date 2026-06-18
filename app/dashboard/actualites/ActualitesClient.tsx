"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Article } from "./page";

const RED = "#C8312A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const BG = "#0F1119";
const SURFACE = "#161926";
const BORDER = "#1F2436";

const SOURCE_COLOR: Record<string, string> = {
  "Le Monde": "#4A90D9",
  "France Info": "#E8851A",
  "Libération": "#C8312A",
};

function formatDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ActualitesClient({ articles }: { articles: Article[] }) {
  const [filter, setFilter] = useState("Tous");
  const [graftTarget, setGraftTarget] = useState<Article | null>(null);

  const sources = ["Tous", "Le Monde", "France Info", "Libération"];
  const filtered = filter === "Tous" ? articles : articles.filter(a => a.source === filter);

  return (
    <div style={{ padding: "44px 52px", maxWidth: "820px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <div style={{
              width: "28px", height: "28px", borderRadius: "7px",
              background: `linear-gradient(135deg, ${GOLD} 0%, #8B6E1A 100%)`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
            }}>📰</div>
            <h1 style={{ color: "#ECEAE2", fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
              Actualités
            </h1>
          </div>
          <p style={{ color: "#2A2F45", fontSize: "13px", margin: 0 }}>
            Flux agrégé · Le Monde · France Info · Libération
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "5px 10px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2ECC71", display: "inline-block" }} />
          <span style={{ color: "#3A4060", fontSize: "12px", fontWeight: 600 }}>{filtered.length} articles</span>
        </div>
      </div>

      <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}50, ${GOLD}20, transparent)`, margin: "24px 0 24px" }} />

      {/* Source filters */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "28px", flexWrap: "wrap" }}>
        {sources.map(s => {
          const active = filter === s;
          const color = s === "Tous" ? GOLD : (SOURCE_COLOR[s] ?? GOLD);
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: active ? `${color}20` : "transparent",
                color: active ? color : "#3A4060",
                border: `1px solid ${active ? color + "50" : BORDER}`,
                borderRadius: "20px", padding: "6px 16px",
                fontSize: "13px", fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {s}
            </button>
          );
        })}
      </div>

      {/* Article list */}
      {articles.length === 0 ? (
        <EmptyState />
      ) : filtered.length === 0 ? (
        <p style={{ color: "#2A2F45", fontSize: "14px" }}>Aucun article pour cette source.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((article, i) => (
            <ArticleCard
              key={`${article.source}-${i}`}
              article={article}
              onGraft={() => setGraftTarget(article)}
            />
          ))}
        </div>
      )}

      {graftTarget && (
        <GrafterModal article={graftTarget} onClose={() => setGraftTarget(null)} />
      )}
    </div>
  );
}

function ArticleCard({ article, onGraft }: { article: Article; onGraft: () => void }) {
  const [hovered, setHovered] = useState(false);
  const sourceColor = SOURCE_COLOR[article.source] ?? GOLD;
  const date = formatDate(article.date);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `linear-gradient(135deg, ${SURFACE} 0%, #1A1D2B 100%)` : SURFACE,
        border: `1px solid ${hovered ? sourceColor + "30" : BORDER}`,
        borderLeft: `3px solid ${hovered ? sourceColor : BORDER}`,
        borderRadius: "14px", padding: "18px 20px",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {/* Source + date */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <span style={{
          background: `${sourceColor}18`,
          color: sourceColor,
          border: `1px solid ${sourceColor}35`,
          fontSize: "10px", fontWeight: 800, letterSpacing: "0.8px",
          padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase",
          flexShrink: 0,
        }}>
          {article.source}
        </span>
        {date && (
          <span style={{ color: "#2A2F45", fontSize: "12px", fontWeight: 500 }}>{date}</span>
        )}
      </div>

      {/* Title */}
      <p style={{
        color: "#ECEAE2", fontSize: "15px", fontWeight: 700,
        lineHeight: 1.55, margin: "0 0 14px",
      }}>
        {article.title}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <a
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: "transparent",
            color: "#3A4060",
            border: `1px solid ${BORDER}`,
            borderRadius: "8px", padding: "6px 12px",
            fontSize: "12px", fontWeight: 600,
            textDecoration: "none", transition: "all 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ECEAE2"; e.currentTarget.style.borderColor = "#3A4060"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#3A4060"; e.currentTarget.style.borderColor = BORDER; }}
        >
          <span style={{ fontSize: "11px" }}>↗</span> Lire l'article
        </a>
        <button
          onClick={onGraft}
          style={{
            display: "flex", alignItems: "center", gap: "5px",
            background: hovered ? `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)` : "transparent",
            color: hovered ? "#fff" : "#3A4060",
            border: `1px solid ${hovered ? "rgba(201,168,76,0.2)" : BORDER}`,
            borderRadius: "8px", padding: "6px 14px",
            fontSize: "12px", fontWeight: 700,
            cursor: "pointer", transition: "all 0.15s",
            boxShadow: hovered ? `0 4px 12px rgba(200,49,42,0.3)` : "none",
          }}
        >
          ⊞ Grafter
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "56px" }}>
      <div style={{
        width: "68px", height: "68px", borderRadius: "18px",
        border: `1px dashed ${BORDER}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "30px",
      }}>📰</div>
      <p style={{ color: "#2A2F45", fontSize: "15px", fontWeight: 600, margin: 0 }}>Flux inaccessibles</p>
      <p style={{ color: "#1F2436", fontSize: "13px", margin: 0, textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>
        Les sources RSS ne répondent pas. Réessaie dans quelques instants.
      </p>
    </div>
  );
}

function GrafterModal({ article, onClose }: { article: Article; onClose: () => void }) {
  const prefill = `📰 ${article.source} — ${article.title}\n${article.link}\n\nMon avis : `;
  const [text, setText] = useState(prefill);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 500;

  useEffect(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(text.length, text.length);
      }
    }, 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, text.length]);

  const handlePublish = async () => {
    if (!text.trim()) return;
    setPublishing(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("grafts")
      .insert({ content: text.trim(), author_name: "Yahia", video_url: null });
    setPublishing(false);
    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(onClose, 900);
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: `0 24px 64px rgba(0,0,0,0.65)` }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${RED}80 0%, ${GOLD}40 100%)`, border: `1.5px solid ${GOLD}50`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD_LIGHT, fontSize: "13px", fontWeight: 800 }}>Y</div>
            <div>
              <span style={{ color: "#ECEAE2", fontSize: "14px", fontWeight: 700 }}>Yahia</span>
              <span style={{ color: SOURCE_COLOR[article.source] ?? GOLD, fontSize: "12px", marginLeft: "8px", opacity: 0.85 }}>
                réagit à {article.source}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#5A6076", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        {/* Article preview */}
        <div style={{ background: BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${SOURCE_COLOR[article.source] ?? GOLD}50`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
          <span style={{ color: SOURCE_COLOR[article.source] ?? GOLD, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px" }}>{article.source}</span>
          <p style={{ color: "#5A6076", fontSize: "13px", margin: "4px 0 0", lineHeight: 1.45, display: "-webkit-box", overflow: "hidden", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {article.title}
          </p>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          rows={6}
          style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", color: "#ECEAE2", fontSize: "14px", lineHeight: 1.65, resize: "vertical", outline: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" }}
          onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}50`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />

        {error && <p style={{ color: RED, fontSize: "12px", margin: "8px 0 0", fontWeight: 600 }}>{error}</p>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: text.length > MAX * 0.85 ? RED : "#2A2F45" }}>
            {text.length} / {MAX}
          </span>
          <button
            onClick={handlePublish}
            disabled={!text.trim() || publishing || done}
            style={{
              background: done ? `linear-gradient(135deg, #2ECC71 0%, #1A8A4A 100%)` : !text.trim() ? "#1F2436" : `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
              color: !text.trim() ? "#3A4060" : "#fff",
              border: `1px solid ${!text.trim() ? "transparent" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "10px", padding: "10px 24px",
              fontSize: "14px", fontWeight: 800,
              cursor: text.trim() && !publishing && !done ? "pointer" : "not-allowed",
              boxShadow: text.trim() && !done ? `0 4px 16px rgba(200,49,42,0.35)` : "none",
              transition: "all 0.2s",
            }}
          >
            {done ? "✓ Grafté !" : publishing ? "Publication…" : "Publier le graft"}
          </button>
        </div>
      </div>
    </div>
  );
}
