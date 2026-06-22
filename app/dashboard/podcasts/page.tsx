"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { PodcastEpisode } from "@/app/api/podcasts/route";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

type Cat = "Tout" | "Politique" | "Société" | "Culture" | "Économie";
const CATS: Cat[] = ["Tout", "Politique", "Société", "Culture", "Économie"];

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch { return "" }
}

function fmtTime(secs: number): string {
  if (!isFinite(secs)) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ── Waveform ──────────────────────────────────────────────────────────────────

function Waveform({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "16px", flexShrink: 0 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: "3px", height: "16px", borderRadius: "2px", background: RED,
          transformOrigin: "bottom",
          animation: active ? `pw${i} ${0.65 + i * 0.1}s ease-in-out infinite alternate` : "none",
          transform: active ? undefined : `scaleY(${0.15 + i * 0.1})`,
          opacity: active ? 1 : 0.3,
          transition: "opacity 0.3s",
        }} />
      ))}
    </div>
  );
}

// ── Episode Card ──────────────────────────────────────────────────────────────

function EpisodeCard({
  ep, active, playing, onPlay, isMobile,
}: { ep: PodcastEpisode; active: boolean; playing: boolean; onPlay: () => void; isMobile: boolean }) {
  const coverSize = isMobile ? "52px" : "64px";
  return (
    <div
      onClick={onPlay}
      style={{ display: "flex", gap: isMobile ? "10px" : "14px", padding: isMobile ? "12px 16px" : "14px 20px", cursor: "pointer", borderBottom: `1px solid ${BORDER}`, transition: "background 0.15s", background: active ? `${RED}08` : "transparent" }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#0A0A0A"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {/* Cover */}
      <div style={{ width: coverSize, height: coverSize, borderRadius: "10px", flexShrink: 0, position: "relative", overflow: "hidden", background: ep.image ? "transparent" : `linear-gradient(135deg,hsl(${ep.hue},50%,10%) 0%,hsl(${(ep.hue+60)%360},58%,20%) 100%)` }}>
        {ep.image
          ? <img src={ep.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px" }}>🎙</div>
        }
        {active && playing && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Waveform active={true} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
          <span style={{ background: `${RED}14`, border: `1px solid ${RED}25`, color: RED, fontSize: "10px", fontWeight: 700, padding: "1px 7px", borderRadius: "3px" }}>{ep.cat}</span>
          <span style={{ color: TEXT2, fontSize: "11px" }}>{ep.source}</span>
        </div>
        <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: active ? RED : TEXT, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ep.title}</p>
        {!isMobile && <p style={{ margin: "0 0 6px", fontSize: "12px", color: TEXT2, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{ep.description}</p>}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {ep.duration && <span style={{ fontSize: "11px", color: TEXT2 }}>⏱ {ep.duration}</span>}
          {ep.isoDate && <span style={{ fontSize: "11px", color: TEXT2 }}>· {fmtDate(ep.isoDate)}</span>}
        </div>
      </div>

      {/* Play button */}
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: active ? `${RED}18` : SURFACE, border: `1px solid ${active ? RED : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: active ? RED : TEXT2, flexShrink: 0, alignSelf: "center", transition: "all 0.15s" }}>
        {active && playing ? "⏸" : "▶"}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ isMobile }: { isMobile?: boolean }) {
  return (
    <div style={{ display: "flex", gap: isMobile ? "10px" : "14px", padding: isMobile ? "12px 16px" : "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ width: "64px", height: "64px", borderRadius: "10px", background: SURFACE, flexShrink: 0, animation: "sk-pulse 1.4s ease-in-out infinite" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", justifyContent: "center" }}>
        <div style={{ width: "60%", height: "12px", borderRadius: "4px", background: SURFACE, animation: "sk-pulse 1.4s ease-in-out infinite" }} />
        <div style={{ width: "90%", height: "14px", borderRadius: "4px", background: SURFACE, animation: "sk-pulse 1.4s ease-in-out infinite 0.1s" }} />
        <div style={{ width: "75%", height: "12px", borderRadius: "4px", background: SURFACE, animation: "sk-pulse 1.4s ease-in-out infinite 0.2s" }} />
      </div>
    </div>
  );
}

// ── Player Bar ────────────────────────────────────────────────────────────────

function PlayerBar({
  episode, playing, currentTime, duration, onToggle, onSeek, onClose, isMobile,
}: {
  episode: PodcastEpisode; playing: boolean;
  currentTime: number; duration: number;
  onToggle: () => void; onSeek: (pct: number) => void; onClose: () => void;
  isMobile: boolean;
}) {
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  };

  // Sur mobile : fixed au-dessus de la BottomNav (≈60px)
  const posStyle: React.CSSProperties = isMobile
    ? { position: "fixed", bottom: "calc(56px + env(safe-area-inset-bottom))", left: 0, right: 0, zIndex: 200 }
    : { position: "sticky", bottom: 0, zIndex: 100 };

  return (
    <div style={{ ...posStyle, background: `${SURFACE}F8`, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderTop: `1px solid ${BORDER}` }}>
      {/* Progress bar */}
      <div onClick={handleSeek} style={{ height: "3px", background: "#1a1a1a", cursor: "pointer" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: RED, transition: "width 0.5s linear" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "10px" : "14px", padding: isMobile ? "10px 16px" : "12px 20px" }}>
        {/* Cover */}
        <div style={{ width: isMobile ? "36px" : "44px", height: isMobile ? "36px" : "44px", borderRadius: "8px", flexShrink: 0, background: `linear-gradient(135deg,hsl(${episode.hue},50%,12%) 0%,hsl(${(episode.hue+60)%360},60%,22%) 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", overflow: "hidden" }}>
          {episode.image
            ? <img src={episode.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            : "🎙"
          }
        </div>

        {/* Title + time */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: isMobile ? "12px" : "13px", fontWeight: 700, color: TEXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{episode.title}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
            <Waveform active={playing} />
            <span style={{ color: TEXT2, fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>
              {fmtTime(currentTime)} / {fmtTime(duration)}
            </span>
            {!isMobile && <span style={{ color: TEXT2, fontSize: "11px" }}>· {episode.source}</span>}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <button onClick={onToggle} style={{ width: isMobile ? "38px" : "42px", height: isMobile ? "38px" : "42px", borderRadius: "50%", background: RED, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "17px", color: "#fff", boxShadow: `0 2px 14px ${RED}55`, flexShrink: 0 }}>
            {playing ? "⏸" : "▶"}
          </button>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", padding: "4px", opacity: 0.6 }}>✕</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PodcastsPage() {
  const [episodes,    setEpisodes]    = useState<PodcastEpisode[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [cat,         setCat]         = useState<Cat>("Tout");
  const [current,     setCurrent]     = useState<PodcastEpisode | null>(null);
  const [playing,     setPlaying]     = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,    setDuration]    = useState(0);
  const [isMobile,    setIsMobile]    = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetch("/api/podcasts")
      .then(r => r.json())
      .then((data: PodcastEpisode[]) => { setEpisodes(data); setLoading(false); })
      .catch(() => { setError("Impossible de charger les podcasts."); setLoading(false); });
  }, []);

  // Sync audio when episode changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    audio.src = current.audioUrl;
    audio.load();
    if (playing) audio.play().catch(() => setPlaying(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const playEpisode = useCallback((ep: PodcastEpisode) => {
    if (current?.id === ep.id) {
      const audio = audioRef.current;
      if (!audio) return;
      if (playing) { audio.pause(); setPlaying(false); }
      else         { audio.play().catch(() => {}); setPlaying(true); }
    } else {
      setCurrent(ep);
      setPlaying(true);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [current, playing]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) { audio.pause(); setPlaying(false); }
    else         { audio.play().catch(() => {}); setPlaying(true); }
  }, [playing]);

  const seek = useCallback((pct: number) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration)) return;
    audio.currentTime = pct * audio.duration;
  }, []);

  const filtered = cat === "Tout" ? episodes : episodes.filter(e => e.cat === cat);

  return (
    <>
      <style>{`
        @keyframes pw1 { 0%{transform:scaleY(0.12)} 100%{transform:scaleY(0.9)} }
        @keyframes pw2 { 0%{transform:scaleY(0.5)}  100%{transform:scaleY(0.18)} }
        @keyframes pw3 { 0%{transform:scaleY(0.22)} 100%{transform:scaleY(1)} }
        @keyframes pw4 { 0%{transform:scaleY(0.7)}  100%{transform:scaleY(0.15)} }
        @keyframes sk-pulse { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
        * { box-sizing:border-box; }
      `}</style>

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div style={{ background: BG, minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT, display: "flex", flexDirection: "column" }}>

        {/* ── Header ── */}
        <div style={{ padding: "20px 20px 0", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 50, background: `${BG}E8`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "11px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: `0 3px 16px ${RED}55`, flexShrink: 0 }}>🎙</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Podcasts</h1>
              <p style={{ margin: 0, fontSize: "12px", color: TEXT2 }}>Écouter, débattre, s'informer</p>
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "0", overflowX: "auto", scrollbarWidth: "none" }}>
            {CATS.map(c => {
              const on = cat === c;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  style={{ padding: "10px 16px", background: "none", border: "none", borderBottom: on ? `2px solid ${RED}` : "2px solid transparent", color: on ? TEXT : TEXT2, fontSize: "14px", fontWeight: on ? 700 : 400, cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s", flexShrink: 0 }}
                >{c}</button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, paddingBottom: isMobile ? (current ? "170px" : "110px") : "0" }}>
          {loading && Array.from({ length: 8 }, (_, i) => <Skeleton key={i} isMobile={isMobile} />)}

          {error && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📡</div>
              <p style={{ color: TEXT2, fontSize: "14px", margin: 0 }}>{error}</p>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ color: TEXT2, fontSize: "14px" }}>Aucun épisode dans cette catégorie.</p>
            </div>
          )}

          {!loading && !error && filtered.map(ep => (
            <EpisodeCard
              key={ep.id}
              ep={ep}
              active={current?.id === ep.id}
              playing={current?.id === ep.id && playing}
              onPlay={() => playEpisode(ep)}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* ── Player ── */}
        {current && (
          <PlayerBar
            episode={current}
            playing={playing}
            currentTime={currentTime}
            duration={duration}
            onToggle={togglePlay}
            onSeek={seek}
            onClose={() => { audioRef.current?.pause(); setCurrent(null); setPlaying(false); }}
            isMobile={isMobile}
          />
        )}
      </div>
    </>
  );
}
