"use client";
import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import type { Article, GdeltEvent } from "./page";

const RED = "#E0492F";
const GOLD = "#C9A24B";
const GOLD_LIGHT = "#E8D07A";
const BG = "#000000";
const SURFACE = "#0D0D0D";
const BORDER = "#1C1C1C";

const SOURCE_COLOR: Record<string, string> = {
  "Le Monde": "#4A90D9",
  "France Info": "#E8851A",
  "Libération": "#E0492F",
};

const GDELT_COLOR = "#8B5CF6";

type GraftTarget = { title: string; link: string; source: string };

// ── HTML entity decoder ───────────────────────────────────────────────────────

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9A-Fa-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

// ── Date helpers ─────────────────────────────────────────────────────────────

function formatRssDate(raw: string): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatGdeltDate(raw: string): string {
  // "20240118T123456Z"
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return "";
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-FR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ── Thumbnail ────────────────────────────────────────────────────────────────

const SOURCE_GRADIENT: Record<string, string> = {
  "Le Monde":    "linear-gradient(135deg, #1A3A5C 0%, #4A90D9 100%)",
  "France Info": "linear-gradient(135deg, #5C3200 0%, #E8851A 100%)",
  "Libération":  "linear-gradient(135deg, #5C0A08 0%, #E0492F 100%)",
};

function Thumbnail({
  src, alt, accentColor, initial, gradient,
}: {
  src: string | null;
  alt: string;
  accentColor: string;
  initial: string;
  gradient?: string;
}) {
  const [errored, setErrored] = useState(false);
  const showPlaceholder = !src || errored;
  const bg = gradient ?? `linear-gradient(135deg, ${accentColor}30 0%, ${accentColor}08 100%)`;

  return (
    <div style={{
      width: "96px", height: "72px", borderRadius: "10px",
      overflow: "hidden", flexShrink: 0, position: "relative",
      border: `1px solid ${BORDER}`,
    }}>
      {showPlaceholder ? (
        <div style={{
          width: "100%", height: "100%",
          background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: accentColor, fontSize: "22px", fontWeight: 900,
          letterSpacing: "-1px", opacity: 0.7,
        }}>
          {initial}
        </div>
      ) : (
        <img
          src={src!}
          alt={alt}
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}

// ── Tone badge ───────────────────────────────────────────────────────────────

function ToneBadge({ tone }: { tone: number | null }) {
  if (tone === null || isNaN(tone)) return null;
  const positive = tone > 2;
  const negative = tone < -2;
  if (!positive && !negative) return null;
  const color = positive ? "#2ECC71" : RED;
  const label = positive ? "Positif" : "Négatif";
  const icon = positive ? "↑" : "↓";
  return (
    <span style={{
      background: `${color}18`,
      color,
      border: `1px solid ${color}40`,
      fontSize: "10px", fontWeight: 800,
      padding: "2px 8px", borderRadius: "20px",
      letterSpacing: "0.5px", flexShrink: 0,
      display: "inline-flex", alignItems: "center", gap: "3px",
    }}>
      {icon} {label}
    </span>
  );
}

// ── Root component ────────────────────────────────────────────────────────────

export default function ActualitesClient({
  articles,
  events,
}: {
  articles: Article[];
  events: GdeltEvent[];
}) {
  const [tab, setTab] = useState<"france" | "monde">("france");
  const [sourceFilter, setSourceFilter] = useState("Tous");
  const [graftTarget, setGraftTarget] = useState<GraftTarget | null>(null);

  const rssFiltered =
    sourceFilter === "Tous"  ? articles :
    sourceFilter === "GDELT" ? articles.filter(a => a.origin === "gdelt") :
    articles.filter(a => a.source === sourceFilter && a.origin !== "gdelt");

  const count = tab === "france" ? rssFiltered.length : events.length;

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
            <h1 style={{ color: "#F0F0F0", fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
              Actualités
            </h1>
          </div>
          <p style={{ color: "#3A3A3A", fontSize: "13px", margin: 0 }}>
            {tab === "france"
              ? "Flux agrégé · Le Monde · France Info · Libération"
              : "GDELT Project · événements France · 24 h"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "5px 10px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#2ECC71", display: "inline-block" }} />
          <span style={{ color: "#3A3A3A", fontSize: "12px", fontWeight: 600 }}>{count} articles</span>
        </div>
      </div>

      <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}50, ${GOLD}20, transparent)`, margin: "20px 0" }} />

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: BG, borderRadius: "12px", padding: "4px", width: "fit-content", border: `1px solid ${BORDER}` }}>
        {(["france", "monde"] as const).map(t => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: active ? SURFACE : "transparent",
                color: active ? "#F0F0F0" : "#3A3A3A",
                border: `1px solid ${active ? BORDER : "transparent"}`,
                borderRadius: "9px", padding: "7px 20px",
                fontSize: "13px", fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: "6px",
              }}
            >
              {t === "france" ? "🇫🇷 France" : "🌍 Monde"}
            </button>
          );
        })}
      </div>

      {/* ── FRANCE tab ── */}
      {tab === "france" && (
        <>
          <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
            {["Tous", "Le Monde", "France Info", "Libération", "GDELT"].map(s => {
              const on = sourceFilter === s;
              const color = s === "Tous" ? GOLD : s === "GDELT" ? GDELT_COLOR : (SOURCE_COLOR[s] ?? GOLD);
              return (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  style={{
                    background: on ? `${color}20` : "transparent",
                    color: on ? color : "#3A3A3A",
                    border: `1px solid ${on ? color + "50" : BORDER}`,
                    borderRadius: "20px", padding: "6px 16px",
                    fontSize: "13px", fontWeight: on ? 700 : 500,
                    cursor: "pointer", transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: "5px",
                  }}
                >
                  {s === "GDELT" && <span style={{ fontSize: "10px" }}>🌐</span>}
                  {s}
                </button>
              );
            })}
          </div>

          {rssFiltered.length === 0 ? (
            <EmptyState label="Flux inaccessibles" detail="Les sources RSS ne répondent pas." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {rssFiltered.map((article, i) => {
                const title = decodeHtmlEntities(article.title);
                const isGdelt = article.origin === "gdelt";
                const badgeColor = isGdelt ? GDELT_COLOR : (SOURCE_COLOR[article.source] ?? GOLD);
                const badge     = isGdelt ? `🌐 ${article.source}` : article.source;
                return (
                  <ArticleCard
                    key={`rss-${i}`}
                    title={title}
                    link={article.link}
                    date={formatRssDate(article.date)}
                    badge={badge}
                    badgeColor={badgeColor}
                    image={article.image}
                    isGdelt={isGdelt}
                    onGraft={() => setGraftTarget({ title, link: article.link, source: article.source })}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── MONDE tab (GDELT) ── */}
      {tab === "monde" && (
        <>
          {events.length === 0 ? (
            <EmptyState label="GDELT inaccessible" detail="L'API ne répond pas. Réessaie dans quelques instants." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {events.map((ev, i) => {
                const title = decodeHtmlEntities(ev.title);
                return (
                  <GdeltCard
                    key={`gdelt-${i}`}
                    event={{ ...ev, title }}
                    onGraft={() => setGraftTarget({ title, link: ev.url, source: ev.domain })}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {graftTarget && (
        <GrafterModal target={graftTarget} onClose={() => setGraftTarget(null)} />
      )}
    </div>
  );
}

// ── RSS article card ──────────────────────────────────────────────────────────

function ArticleCard({
  title, link, date, badge, badgeColor, image, isGdelt, onGraft,
}: {
  title: string; link: string; date: string;
  badge: string; badgeColor: string;
  image: string | null; isGdelt?: boolean; onGraft: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? isGdelt
            ? `linear-gradient(135deg, #1A0F2E 0%, #111111 100%)`
            : `linear-gradient(135deg, ${SURFACE} 0%, #111111 100%)`
          : SURFACE,
        border: `1px solid ${hovered ? badgeColor + "30" : BORDER}`,
        borderLeft: `3px solid ${hovered ? badgeColor : isGdelt ? `${GDELT_COLOR}40` : BORDER}`,
        borderRadius: "14px", padding: "16px 18px",
        transition: "border-color 0.15s, background 0.15s",
        display: "flex", gap: "14px", alignItems: "flex-start",
      }}
    >
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "9px", flexWrap: "wrap" }}>
          <span style={{
            background: `${badgeColor}18`, color: badgeColor,
            border: `1px solid ${badgeColor}35`,
            fontSize: "10px", fontWeight: 800, letterSpacing: "0.8px",
            padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase", flexShrink: 0,
          }}>{badge}</span>
          {isGdelt && (
            <span style={{
              background: `${GDELT_COLOR}12`, color: GDELT_COLOR,
              border: `1px solid ${GDELT_COLOR}30`,
              fontSize: "9px", fontWeight: 800, letterSpacing: "1px",
              padding: "2px 7px", borderRadius: "20px", flexShrink: 0,
            }}>INTERNATIONAL</span>
          )}
          {date && <span style={{ color: "#3A3A3A", fontSize: "12px" }}>{date}</span>}
        </div>

        <p style={{ color: "#F0F0F0", fontSize: "15px", fontWeight: 700, lineHeight: 1.5, margin: "0 0 13px" }}>
          {title}
        </p>

        <CardActions link={link} onGraft={onGraft} hovered={hovered} />
      </div>

      {/* Thumbnail */}
      <Thumbnail
        src={image}
        alt={title}
        accentColor={badgeColor}
        initial={badge[0]}
        gradient={SOURCE_GRADIENT[badge]}
      />
    </div>
  );
}

// ── GDELT event card ──────────────────────────────────────────────────────────

function GdeltCard({ event, onGraft }: { event: GdeltEvent; onGraft: () => void }) {
  const [hovered, setHovered] = useState(false);
  const date = formatGdeltDate(event.seendate);
  const accentColor = "#8B5CF6";
  const domainInitial = (event.domain || "G")[0].toUpperCase();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `linear-gradient(135deg, ${SURFACE} 0%, #111111 100%)` : SURFACE,
        border: `1px solid ${hovered ? accentColor + "35" : BORDER}`,
        borderLeft: `3px solid ${hovered ? accentColor : BORDER}`,
        borderRadius: "14px", padding: "16px 18px",
        transition: "border-color 0.15s, background 0.15s",
        display: "flex", gap: "14px", alignItems: "flex-start",
      }}
    >
      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "9px", flexWrap: "wrap" }}>
          <span style={{
            background: `${accentColor}18`, color: accentColor,
            border: `1px solid ${accentColor}35`,
            fontSize: "10px", fontWeight: 800, letterSpacing: "0.8px",
            padding: "3px 10px", borderRadius: "20px", textTransform: "uppercase", flexShrink: 0,
          }}>
            {event.domain || "GDELT"}
          </span>
          {event.sourcecountry && (
            <span style={{ color: "#3A3A3A", fontSize: "11px", fontWeight: 600, flexShrink: 0 }}>
              🌐 {event.sourcecountry}
            </span>
          )}
          <ToneBadge tone={event.tone} />
          {date && (
            <span style={{ color: "#3A3A3A", fontSize: "12px", marginLeft: "auto" }}>{date}</span>
          )}
        </div>

        <p style={{ color: "#F0F0F0", fontSize: "15px", fontWeight: 700, lineHeight: 1.5, margin: "0 0 13px" }}>
          {event.title}
        </p>

        <CardActions link={event.url} onGraft={onGraft} hovered={hovered} accentColor={accentColor} />
      </div>

      {/* Thumbnail */}
      <Thumbnail
        src={event.image}
        alt={event.title}
        accentColor={accentColor}
        initial={domainInitial}
        gradient="linear-gradient(135deg, #2D1B69 0%, #8B5CF6 100%)"
      />
    </div>
  );
}

// ── Shared action row ─────────────────────────────────────────────────────────

function CardActions({
  link, onGraft, hovered, accentColor = RED,
}: {
  link: string; onGraft: () => void; hovered: boolean; accentColor?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: "transparent", color: "#3A3A3A",
          border: `1px solid ${BORDER}`, borderRadius: "8px",
          padding: "6px 12px", fontSize: "12px", fontWeight: 600,
          textDecoration: "none", transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.color = "#F0F0F0"; e.currentTarget.style.borderColor = "#3A3A3A"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "#3A3A3A"; e.currentTarget.style.borderColor = BORDER; }}
      >
        <span style={{ fontSize: "11px" }}>↗</span> Lire l'article
      </a>
      <button
        onClick={onGraft}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: hovered ? `linear-gradient(135deg, ${accentColor} 0%, #5B21B6 100%)` : "transparent",
          color: hovered ? "#fff" : "#3A3A3A",
          border: `1px solid ${hovered ? "rgba(139,92,246,0.3)" : BORDER}`,
          borderRadius: "8px", padding: "6px 14px",
          fontSize: "12px", fontWeight: 700,
          cursor: "pointer", transition: "all 0.15s",
          boxShadow: hovered ? `0 4px 12px ${accentColor}40` : "none",
        }}
      >
        ⊞ Grafter
      </button>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", paddingTop: "56px" }}>
      <div style={{ width: "68px", height: "68px", borderRadius: "18px", border: `1px dashed ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px" }}>📰</div>
      <p style={{ color: "#3A3A3A", fontSize: "15px", fontWeight: 600, margin: 0 }}>{label}</p>
      <p style={{ color: "#1C1C1C", fontSize: "13px", margin: 0, textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>{detail}</p>
    </div>
  );
}

// ── Grafter modal ─────────────────────────────────────────────────────────────

function GrafterModal({ target, onClose }: { target: GraftTarget; onClose: () => void }) {
  const prefill = `📰 ${target.source} — ${target.title}\n${target.link}\n\nMon avis : `;
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

  const sourceColor = SOURCE_COLOR[target.source] ?? GOLD;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "560px", boxShadow: `0 24px 64px rgba(0,0,0,0.65)` }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: `linear-gradient(135deg, ${RED}80 0%, ${GOLD}40 100%)`, border: `1.5px solid ${GOLD}50`, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD_LIGHT, fontSize: "13px", fontWeight: 800 }}>Y</div>
            <div>
              <span style={{ color: "#F0F0F0", fontSize: "14px", fontWeight: 700 }}>Yahia</span>
              <span style={{ color: sourceColor, fontSize: "12px", marginLeft: "8px", opacity: 0.85 }}>
                réagit à {target.source}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#888888", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ background: BG, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${sourceColor}50`, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
          <span style={{ color: sourceColor, fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px" }}>{target.source}</span>
          <p style={{ color: "#888888", fontSize: "13px", margin: "4px 0 0", lineHeight: 1.45, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {target.title}
          </p>
        </div>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX))}
          rows={6}
          style={{ width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "16px", color: "#F0F0F0", fontSize: "14px", lineHeight: 1.65, resize: "vertical", outline: "none", fontFamily: "system-ui, -apple-system, sans-serif", boxSizing: "border-box" }}
          onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}50`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />

        {error && <p style={{ color: RED, fontSize: "12px", margin: "8px 0 0", fontWeight: 600 }}>{error}</p>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: text.length > MAX * 0.85 ? RED : "#3A3A3A" }}>
            {text.length} / {MAX}
          </span>
          <button
            onClick={handlePublish}
            disabled={!text.trim() || publishing || done}
            style={{
              background: done ? `linear-gradient(135deg, #2ECC71 0%, #1A8A4A 100%)` : !text.trim() ? "#1C1C1C" : `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
              color: !text.trim() ? "#3A3A3A" : "#fff",
              border: `1px solid ${!text.trim() ? "transparent" : "rgba(201,168,76,0.2)"}`,
              borderRadius: "10px", padding: "10px 24px",
              fontSize: "14px", fontWeight: 800,
              cursor: text.trim() && !publishing && !done ? "pointer" : "not-allowed",
              boxShadow: text.trim() && !done ? `0 4px 16px rgba(224,73,47,0.35)` : "none",
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
