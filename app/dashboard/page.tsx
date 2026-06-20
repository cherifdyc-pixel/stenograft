"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import GraftActions from "@/components/GraftActions";
import GraftSondage from "@/components/GraftSondage";
import FavoriButton from "@/components/FavoriButton";
import SignalerButton from "@/components/SignalerButton";
import GraftImageUpload from "@/components/GraftImageUpload";
import MentionInput from "@/components/MentionInput";

const BG      = "#000000";
const SURFACE = "#0D0D0D";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#333333";
const BLUE    = "#1D9BF0";
const GREEN   = "#00BA7C";
const PINK    = "#F91880";

const VERIFIED  = new Set(["Yahia"]);
const MAX_CHARS = 500;

type Graft = {
  id: string; content: string; author_name: string;
  created_at: string; parent_id: string | null; video_url: string | null; image_url: string | null;
};
type GraftWithReplies = Graft & { replies: Graft[] };

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const now = Date.now();
  const d   = new Date(iso);
  const s   = Math.floor((now - d.getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `il y a ${h}h`;
  const yd = new Date(now - 86_400_000);
  if (d.toDateString() === yd.toDateString()) return "hier";
  if (d.getFullYear() === new Date().getFullYear())
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function hashN(id: string, salt = 0): number {
  let h = 5381 + salt;
  for (const c of id) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  return Math.abs(h);
}

function avatarGrad(name: string): string {
  const hue = hashN(name, 7) % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,18%) 0%, hsl(${(hue+45)%360},65%,38%) 100%)`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, size, certified }: { name: string; size: number; certified?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatarGrad(name),
      border: certified ? `2px solid ${GOLD}` : "2px solid transparent",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: Math.round(size * 0.38) + "px", fontWeight: 800,
    }}>
      {name[0].toUpperCase()}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [grafts,      setGrafts]      = useState<GraftWithReplies[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [replyTarget, setReplyTarget] = useState<Graft | null>(null);

  const fetchGrafts = useCallback(async () => {
    const sb = createClient();

    // Récupérer l'utilisateur connecté et ses abonnements
    const { data: { user } } = await sb.auth.getUser();

    let followedNames: string[] = [];

    if (user) {
      const { data: followingData } = await sb
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followingIds = followingData?.map(f => f.following_id) ?? [];

      if (followingIds.length > 0) {
        // Mapper les UUIDs vers les usernames via la table profiles
        const { data: profileData } = await sb
          .from("profiles")
          .select("username")
          .in("id", followingIds);

        followedNames = profileData?.map(p => p.username) ?? [];
      }
    }

    // Construire la requête : filtrée sur les abonnements si l'utilisateur en a
    let query = sb
      .from("grafts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (followedNames.length > 0) {
      query = query.in("author_name", followedNames);
    }

    const { data } = await query;
    const all = (data ?? []) as Graft[];
    const roots = all.filter(g => !g.parent_id);
    setGrafts(roots.map(g => ({
      ...g,
      replies: all.filter(r => r.parent_id === g.id)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchGrafts(); }, [fetchGrafts]);

  useEffect(() => {
    const h = () => document.getElementById("sg-compose-textarea")?.focus();
    window.addEventListener("sg:grafter", h);
    return () => window.removeEventListener("sg:grafter", h);
  }, []);

  const handlePublished = (graft: Graft) => {
    if (!graft.parent_id)
      setGrafts(prev => [{ ...graft, replies: [] }, ...prev]);
    else
      setGrafts(prev => prev.map(g =>
        g.id === graft.parent_id ? { ...g, replies: [...g.replies, graft] } : g
      ));
  };

  return (
    <div>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}E6`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "14px 16px" }}>
        <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>Le Fil</h1>
      </div>

      {/* Inline compose box */}
      <ComposeBox onPublished={handlePublished} />

      {/* Divider */}
      <div style={{ height: "6px", background: SURFACE, borderBottom: `1px solid ${BORDER}` }} />

      {/* Feed */}
      {loading
        ? <LoadingSkeleton />
        : grafts.length === 0
          ? <EmptyFeed onFocus={() => document.getElementById("sg-compose-textarea")?.focus()} />
          : grafts.map(g => (
              <GraftThread
                key={g.id}
                graft={g}
                onReply={() => setReplyTarget(g)}
              />
            ))
      }

      {replyTarget && (
        <ReplyModal
          parentGraft={replyTarget}
          onClose={() => setReplyTarget(null)}
          onPublished={g => { handlePublished(g); setReplyTarget(null); }}
        />
      )}
    </div>
  );
}

// ── Inline Compose Box ────────────────────────────────────────────────────────

type Localisation = { latitude: number; longitude: number; region: string; territoire: string };

function ComposeBox({ onPublished }: { onPublished: (g: Graft) => void }) {
  const [text,           setText]           = useState("");
  const [expanded,       setExpanded]       = useState(false);
  const [videoFile,      setVideoFile]      = useState<File | null>(null);
  const [publishing,     setPublishing]     = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [localisation,   setLocalisation]   = useState<Localisation | null>(null);
  const [locLoading,     setLocLoading]     = useState(false);
  const [imageUrl,       setImageUrl]       = useState('');
  const videoRef     = useRef<HTMLInputElement>(null);
  const remaining    = MAX_CHARS - text.length;
  const pct          = text.length / MAX_CHARS;
  const canPost      = (text.trim().length > 0 || videoFile || imageUrl) && !publishing;

  const uploadVideo = async (file: File): Promise<string> => {
    const tr = await fetch("/api/apivideo/token", { method: "POST" });
    if (!tr.ok) throw new Error("Token d'upload indisponible");
    const { token } = await tr.json();
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch(`https://ws.api.video/upload?token=${token}`, { method: "POST", body: fd });
    if (!r.ok) throw new Error("Échec de l'upload vidéo");
    return (await r.json()).assets.player as string;
  };

  const ajouterLocalisation = () => {
    if (!navigator.geolocation) return;
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}`);
        const data = await res.json();
        const feature = data.features?.[0];
        const region = feature?.properties?.region ?? "";
        const ville  = feature?.properties?.city ?? feature?.properties?.municipality ?? "";
        setLocalisation({ latitude, longitude, region, territoire: ville });
      } catch {
        setLocalisation({ latitude, longitude, region: "", territoire: "" });
      }
      setLocLoading(false);
    }, () => setLocLoading(false));
  };

  const handlePublish = async () => {
    if (!canPost) return;
    setPublishing(true); setError(null);
    let video_url: string | null = null;
    if (videoFile) {
      setUploadingVideo(true);
      try { video_url = await uploadVideo(videoFile); }
      catch (e) { setError(e instanceof Error ? e.message : "Erreur upload"); setPublishing(false); setUploadingVideo(false); return; }
      setUploadingVideo(false);
    }
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error: err } = await sb.from("grafts").insert({
      content: text.trim(),
      user_id: user?.id,
      author_name: user?.email?.split("@")[0] ?? "Grafter",
      video_url,
      ...(localisation ? {
        latitude:   localisation.latitude,
        longitude:  localisation.longitude,
        region:     localisation.region,
        territoire: localisation.territoire,
      } : {}),
      ...(imageUrl ? { image_url: imageUrl } : {}),
    }).select().single();
    setPublishing(false);
    if (err) { setError(err.message); return; }
    setText(""); setVideoFile(null); setExpanded(false); setLocalisation(null); setImageUrl('');
    if (videoRef.current) videoRef.current.value = "";
    onPublished(data as Graft);
  };

  const mediaButtons = [
    { icon: "📷", label: "Photo",        onClick: () => {} },
    { icon: "🎥", label: "Vidéo",        onClick: () => videoRef.current?.click() },
    { icon: "📊", label: "Consultation", onClick: () => {} },
    { icon: locLoading ? "⏳" : localisation ? "📍✓" : "📍", label: "Localiser", onClick: ajouterLocalisation },
  ];

  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", gap: "12px" }}>
        {/* Avatar */}
        <Avatar name="Yahia" size={40} certified />

        {/* Right side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Textarea */}
          <MentionInput
            value={text}
            onChange={val => { setText(val.slice(0, MAX_CHARS)); setExpanded(true); }}
            placeholder="Quoi de neuf ? Utilisez @ pour mentionner un Grafter..."
          />

          <GraftImageUpload onUpload={setImageUrl} />

          {/* Localisation chip */}
          {localisation && (localisation.region || localisation.territoire) && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: SURFACE, border: `1px solid ${RED}40`, borderRadius: "10px", padding: "7px 12px", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px" }}>📍</span>
              <span style={{ color: TEXT2, fontSize: "13px", flex: 1 }}>
                {[localisation.territoire, localisation.region].filter(Boolean).join(", ")}
              </span>
              <button onClick={() => setLocalisation(null)} style={{ background: "none", border: "none", color: TEXT2, fontSize: "16px", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}

          {/* Video preview chip */}
          {videoFile && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: SURFACE, border: `1px solid ${GOLD}40`, borderRadius: "10px", padding: "8px 12px", marginBottom: "10px" }}>
              <span style={{ fontSize: "16px" }}>🎬</span>
              <span style={{ color: TEXT2, fontSize: "13px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videoFile.name}</span>
              <button onClick={() => { setVideoFile(null); if (videoRef.current) videoRef.current.value = ""; }} style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", lineHeight: 1, padding: 0 }}>×</button>
            </div>
          )}

          {/* Divider */}
          {(expanded || text.length > 0) && (
            <div style={{ height: "1px", background: BORDER, margin: "4px 0 10px" }} />
          )}

          {/* Bottom row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
            {/* Media buttons */}
            <div style={{ display: "flex", gap: "2px" }}>
              {mediaButtons.map(btn => (
                <MediaBtn key={btn.label} icon={btn.icon} label={btn.label} onClick={btn.onClick} />
              ))}
              <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={e => { setVideoFile(e.target.files?.[0] ?? null); setError(null); setExpanded(true); }} />
            </div>

            {/* Right: counter + publish */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              {text.length > 0 && (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="9" fill="none" stroke={BORDER} strokeWidth="2.5" />
                    <circle cx="12" cy="12" r="9" fill="none" stroke={remaining < 20 ? RED : remaining < 80 ? GOLD : BLUE} strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 9}`} strokeDashoffset={`${2 * Math.PI * 9 * (1 - pct)}`} strokeLinecap="round" />
                  </svg>
                  {remaining <= 80 && <span style={{ color: remaining < 20 ? RED : TEXT2, fontSize: "12px", fontWeight: 600 }}>{remaining}</span>}
                </>
              )}
              <button
                onClick={handlePublish}
                disabled={!canPost}
                style={{ background: canPost ? RED : `${RED}44`, color: "#fff", border: "none", borderRadius: "100px", padding: "8px 20px", fontSize: "14px", fontWeight: 800, cursor: canPost ? "pointer" : "default", transition: "background 0.15s", boxShadow: canPost ? `0 2px 12px ${RED}44` : "none", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                {uploadingVideo ? "Upload…" : publishing ? "Publication…" : "Grafter"}
              </button>
            </div>
          </div>

          {error && <p style={{ color: RED, fontSize: "12px", margin: "8px 0 0", fontWeight: 600 }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}

function MediaBtn({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{ background: hov ? `${BLUE}18` : "transparent", border: "none", borderRadius: "100px", padding: "7px 9px", cursor: "pointer", fontSize: "17px", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.12s" }}
    >{icon}</button>
  );
}

// ── Thread ────────────────────────────────────────────────────────────────────

function GraftThread({ graft, onReply }: { graft: GraftWithReplies; onReply: () => void }) {
  const [showReplies, setShowReplies] = useState(true);
  return (
    <div>
      <GraftCard graft={graft} onReply={onReply} repliesCount={graft.replies.length} />
      {graft.replies.length > 0 && (
        <>
          {showReplies && graft.replies.map(r => <GraftCard key={r.id} graft={r} isReply />)}
          <button
            onClick={() => setShowReplies(v => !v)}
            style={{ background: "none", border: "none", cursor: "pointer", color: BLUE, fontSize: "13px", fontWeight: 600, padding: "6px 16px 14px 68px", display: "block", borderBottom: `1px solid ${BORDER}`, width: "100%", textAlign: "left" }}
          >
            {showReplies
              ? "Masquer les réponses"
              : `Voir ${graft.replies.length} réponse${graft.replies.length > 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  );
}

// ── Mention rendering ─────────────────────────────────────────────────────────

function renderContent(content: string) {
  const parts = content.split(/(@\w+)/g)
  return parts.map((part, i) => {
    if (part.match(/^@\w+$/)) {
      return <Link key={i} href={`/dashboard/profil/${part.slice(1)}`} style={{ color: '#E0492F', textDecoration: 'none' }}>{part}</Link>
    }
    return <span key={i}>{part}</span>
  })
}

// ── Graft Card ────────────────────────────────────────────────────────────────

function GraftCard({ graft, onReply, isReply = false, repliesCount = 0 }: {
  graft: Graft; onReply?: () => void; isReply?: boolean; repliesCount?: number;
}) {
  const verified = VERIFIED.has(graft.author_name);
  const time     = relativeTime(graft.created_at);

  return (
    <article
      style={{
        display: "flex", gap: "12px",
        padding: isReply ? "12px 16px 10px 68px" : "14px 16px 10px",
        borderBottom: `1px solid ${BORDER}`,
        transition: "background 0.12s",
        cursor: "default",
      }}
      onMouseEnter={e => (e.currentTarget.style.background = "#040404")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {/* Avatar */}
      {!isReply && (
        <Link href={`/dashboard/profil/${graft.author_name.toLowerCase()}`} style={{ textDecoration: "none", flexShrink: 0 }}>
          <Avatar name={graft.author_name} size={40} certified={verified} />
        </Link>
      )}

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            {isReply && (
              <Link href={`/dashboard/profil/${graft.author_name.toLowerCase()}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                <Avatar name={graft.author_name} size={34} certified={verified} />
              </Link>
            )}
            <Link href={`/dashboard/profil/${graft.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
              <span style={{ color: TEXT, fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap" }}>{graft.author_name}</span>
            </Link>
            {verified && (
              <>
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: GOLD, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "9px", color: "#000", fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span style={{ color: GOLD, fontSize: "12px", fontWeight: 700 }}>Certifié</span>
              </>
            )}
            <span style={{ color: TEXT3 }}>·</span>
            <Link href={`/dashboard/profil/${graft.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
              <span style={{ color: TEXT2, fontSize: "14px" }}>@{graft.author_name.toLowerCase()}</span>
            </Link>
            <span style={{ color: TEXT3 }}>·</span>
            <span style={{ color: TEXT2, fontSize: "14px" }}>{time}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
              <SignalerButton graftId={graft.id} />
              <MoreMenu graft={graft} />
            </div>
        </div>

        {/* Text */}
        <p style={{ color: TEXT, fontSize: "15px", lineHeight: 1.55, margin: "2px 0 10px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {renderContent(graft.content)}
        </p>

        {/* Image */}
        {graft.image_url && (
          <img src={graft.image_url} alt="Image du graft" style={{ width: '100%', borderRadius: '10px', marginTop: '10px', maxHeight: '400px', objectFit: 'cover' }} />
        )}

        {/* Video 16:9 */}
        {graft.video_url && (
          <div style={{ borderRadius: "14px", overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}`, marginBottom: "10px" }}>
            <iframe src={graft.video_url} allowFullScreen loading="lazy" style={{ width: "100%", height: "100%", border: "none", display: "block" }} title="vidéo" />
          </div>
        )}

        {/* Action bar */}
        <div style={{ display: "flex", alignItems: "center", marginLeft: "-8px", marginTop: "2px" }}>
          <ActBtn icon="💬" label="Réagir" count={repliesCount || undefined} hoverColor={BLUE} active={false} onClick={onReply} />
          <FavoriButton graftId={graft.id} />
        </div>

        <GraftSondage graftId={graft.id} />
        <GraftActions graftId={graft.id} />
      </div>
    </article>
  );
}

function ActBtn({ icon, label, count, hoverColor, active, onClick }: {
  icon: string; label: string; count?: number; hoverColor: string; active: boolean; onClick?: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={label}
      style={{ background: hov ? `${hoverColor}18` : "transparent", border: "none", borderRadius: "100px", padding: "7px 10px", display: "flex", alignItems: "center", gap: "5px", cursor: onClick ? "pointer" : "default", transition: "background 0.12s" }}
    >
      <span style={{ fontSize: "18px", lineHeight: 1 }}>{icon}</span>
      {count !== undefined && (
        <span style={{ color: hov || active ? hoverColor : TEXT2, fontSize: "13px", fontWeight: 500, transition: "color 0.12s" }}>
          {fmtN(count)}
        </span>
      )}
    </button>
  );
}

// ── ··· Menu ──────────────────────────────────────────────────────────────────

function MoreMenu({ graft }: { graft: Graft }) {
  const [open, setOpen] = useState(false);
  const [hov,  setHov]  = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div style={{ position: "relative", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      <button
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => setOpen(v => !v)}
        style={{ background: hov ? `${BLUE}18` : "transparent", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: hov ? BLUE : TEXT2, fontSize: "17px", transition: "all 0.12s", letterSpacing: "2px" }}
      >···</button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#111", border: `1px solid ${BORDER}`, borderRadius: "14px", minWidth: "200px", boxShadow: "0 8px 32px rgba(0,0,0,0.7)", zIndex: 50, overflow: "hidden" }}>
          {[
            { label: "Copier le contenu", fn: () => navigator.clipboard.writeText(graft.content), red: false },
            { label: "Signaler ce graft",  fn: () => {},                                            red: true  },
          ].map(it => (
            <button
              key={it.label}
              onClick={() => { it.fn(); setOpen(false); }}
              style={{ display: "block", width: "100%", background: "none", border: "none", padding: "13px 16px", textAlign: "left", cursor: "pointer", color: it.red ? RED : TEXT, fontSize: "14px", fontWeight: it.red ? 600 : 400 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1A1A1A")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reply Modal ───────────────────────────────────────────────────────────────

function ReplyModal({ parentGraft, onClose, onPublished }: {
  parentGraft: Graft; onClose: () => void; onPublished: (g: Graft) => void;
}) {
  const [text,       setText]       = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remaining   = MAX_CHARS - text.length;
  const pct         = text.length / MAX_CHARS;
  const canPost     = text.trim().length > 0 && !publishing;

  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePublish = async () => {
    if (!canPost) return;
    setPublishing(true); setError(null);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error: err } = await sb.from("grafts").insert({ content: text.trim(), user_id: user?.id, author_name: user?.email?.split("@")[0] ?? "Grafter", video_url: null, parent_id: parentGraft.id }).select().single();
    setPublishing(false);
    if (err) { setError(err.message); return; }
    onPublished(data as Graft);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(91,112,131,0.4)", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "5vh" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG, borderRadius: "16px", width: "100%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 0 0 1px #2a2a2a, 0 24px 60px rgba(0,0,0,0.8)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: BG, zIndex: 5 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT, fontSize: "20px", cursor: "pointer", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>×</button>
          <span style={{ color: TEXT, fontSize: "16px", fontWeight: 700 }}>Répondre</span>
          <button
            onClick={handlePublish}
            disabled={!canPost}
            style={{ background: canPost ? RED : `${RED}55`, color: "#fff", border: "none", borderRadius: "100px", padding: "8px 20px", fontSize: "15px", fontWeight: 800, cursor: canPost ? "pointer" : "not-allowed" }}
          >
            {publishing ? "Publication…" : "Répondre"}
          </button>
        </div>

        <div style={{ padding: "16px" }}>
          {/* Quoted graft */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "14px", paddingBottom: "14px", borderBottom: `1px solid ${BORDER}` }}>
            <Link href={`/dashboard/profil/${parentGraft.author_name.toLowerCase()}`} style={{ textDecoration: "none", flexShrink: 0 }}>
              <Avatar name={parentGraft.author_name} size={38} certified={VERIFIED.has(parentGraft.author_name)} />
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={`/dashboard/profil/${parentGraft.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
                <span style={{ color: TEXT, fontSize: "14px", fontWeight: 700 }}>{parentGraft.author_name} </span>
              </Link>
              <p style={{ color: TEXT2, fontSize: "14px", lineHeight: 1.5, margin: "2px 0 0", display: "-webkit-box", overflow: "hidden", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{parentGraft.content}</p>
            </div>
          </div>

          {/* Compose */}
          <div style={{ display: "flex", gap: "12px" }}>
            <Avatar name="Yahia" size={40} certified />
            <div style={{ flex: 1 }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
                placeholder="Votre réponse…"
                style={{ width: "100%", minHeight: "100px", background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: "18px", lineHeight: 1.5, resize: "none", fontFamily: "inherit", boxSizing: "border-box", padding: "4px 0" }}
              />
            </div>
          </div>

          {error && <p style={{ color: RED, fontSize: "13px", margin: "8px 0 0", fontWeight: 600 }}>{error}</p>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", paddingTop: "12px", borderTop: `1px solid ${BORDER}`, marginTop: "12px" }}>
            {text.length > 0 && (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="12" cy="12" r="9" fill="none" stroke={BORDER} strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="9" fill="none" stroke={remaining < 20 ? RED : remaining < 80 ? GOLD : BLUE} strokeWidth="2.5" strokeDasharray={`${2 * Math.PI * 9}`} strokeDashoffset={`${2 * Math.PI * 9 * (1 - pct)}`} strokeLinecap="round" />
                </svg>
                {remaining <= 80 && <span style={{ color: remaining < 20 ? RED : TEXT2, fontSize: "12px", fontWeight: 600 }}>{remaining}</span>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: "flex", gap: "12px", padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#0D0D0D", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "13px", width: `${110 + i * 20}px`, background: "#0D0D0D", borderRadius: "6px", marginBottom: "10px" }} />
            <div style={{ height: "13px", width: "100%", background: "#090909", borderRadius: "6px", marginBottom: "6px" }} />
            <div style={{ height: "13px", width: "65%", background: "#090909", borderRadius: "6px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty feed ────────────────────────────────────────────────────────────────

function EmptyFeed({ onFocus }: { onFocus: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "80px 32px 0" }}>
      <p style={{ color: TEXT, fontSize: "28px", fontWeight: 900, margin: 0, letterSpacing: "-0.5px", textAlign: "center" }}>Bienvenue sur Le Fil</p>
      <p style={{ color: TEXT2, fontSize: "15px", margin: 0, textAlign: "center", maxWidth: "300px", lineHeight: 1.6 }}>Suis des Grafters et reviens ici pour voir leurs publications.</p>
      <button onClick={onFocus} style={{ marginTop: "16px", background: RED, color: "#fff", border: "none", borderRadius: "100px", padding: "14px 32px", fontSize: "16px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 24px ${RED}45` }}>
        Grafter quelque chose
      </button>
    </div>
  );
}
