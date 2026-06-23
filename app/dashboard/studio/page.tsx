"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#2A2A2A";
const GREEN  = "#2ECC71";
const BLUE   = "#1D9BF0";

const CATS = ["Politique", "Sport", "Culture", "Économie", "Débat", "Local"];

type Tab = "overview" | "chaine" | "contenus" | "revenus";

type UserProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  verified?: boolean;
};

type VideoGraft = {
  id: string;
  content: string;
  video_url: string | null;
  created_at: string;
};

type LiveSession = {
  id: string;
  room_id: string;
  title: string;
  category: string;
  platform: string;
  peak_viewers: number;
  super_chats_total: number;
  started_at: string;
  ended_at: string | null;
};

type SuperChatRecord = {
  id: string;
  live_id: string;
  montant: number;
  message: string;
  couleur: string;
  created_at: string;
};

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(".0", "") + "k";
  return String(n);
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  return h > 0 ? `${h}h${m}` : `${m}min`;
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span style={{ color: TEXT2, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.7px" }}>{label}</span>
      </div>
      <p style={{ color, fontSize: "26px", fontWeight: 900, margin: "0 0 3px", letterSpacing: "-0.5px" }}>{value}</p>
      {sub && <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>{sub}</p>}
    </div>
  );
}

// ── VideoUploadModal ──────────────────────────────────────────────────────────

function VideoUploadModal({ userId, username, onClose, onUploaded, isMobile }: {
  userId: string; username: string;
  onClose: () => void; onUploaded: () => void;
  isMobile: boolean;
}) {
  const [title,    setTitle]    = useState("");
  const [file,     setFile]     = useState<File | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) { setError("Fichier non valide (MP4, MOV, WebM…)"); return; }
    if (f.size > 500 * 1024 * 1024)  { setError("Fichier trop lourd (max 500 Mo)"); return; }
    setFile(f); setError(null);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
  };

  const handleUpload = async () => {
    if (!file || !title.trim() || loading) return;
    setLoading(true); setError(null); setProgress(15);
    const sb   = createClient();
    const ext  = file.name.split(".").pop() ?? "mp4";
    const path = `${userId}/${Date.now()}.${ext}`;
    setProgress(35);
    const { error: upErr } = await sb.storage.from("videos").upload(path, file, { contentType: file.type });
    if (upErr) { setError(upErr.message); setLoading(false); return; }
    setProgress(70);
    const { data: { publicUrl } } = sb.storage.from("videos").getPublicUrl(path);
    const { error: dbErr } = await sb.from("grafts").insert({
      content:     title.trim().slice(0, 500),
      video_url:   publicUrl,
      author_name: username,
      user_id:     userId,
    });
    if (dbErr) { setError(dbErr.message); setLoading(false); return; }
    setProgress(100);
    setTimeout(() => { onUploaded(); onClose(); }, 400);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inp: React.CSSProperties = {
    width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px",
    padding: "11px 14px", color: TEXT, fontSize: "13px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(10px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? "0" : "20px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: isMobile ? "22px 22px 0 0" : "22px", width: "100%", maxWidth: isMobile ? "100%" : "500px", overflow: "hidden", paddingBottom: isMobile ? "env(safe-area-inset-bottom)" : undefined }}>
        <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px" }}>📹</div>
            <h2 style={{ color: TEXT, fontSize: "16px", fontWeight: 900, margin: 0 }}>Uploader une vidéo</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "22px", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "20px 22px 24px" }}>
          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            style={{ border: `2px dashed ${file ? RED : BORDER}`, borderRadius: "14px", padding: "28px 20px", textAlign: "center", cursor: "pointer", marginBottom: "16px", background: file ? `${RED}06` : "transparent", transition: "all 0.15s" }}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input ref={inputRef} type="file" accept="video/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {file ? (
              <>
                <span style={{ fontSize: "34px" }}>🎬</span>
                <p style={{ color: TEXT, fontWeight: 700, margin: "8px 0 3px", fontSize: "14px" }}>{file.name}</p>
                <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
              </>
            ) : (
              <>
                <span style={{ fontSize: "38px" }}>📹</span>
                <p style={{ color: TEXT, fontWeight: 700, margin: "10px 0 4px", fontSize: "14px" }}>Glisser-déposer ou cliquer</p>
                <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>MP4, MOV, WebM · max 500 Mo</p>
              </>
            )}
          </div>

          {/* Title */}
          <label style={{ display: "block", color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Titre *</label>
          <input value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="Titre de la vidéo…"
            style={inp}
            onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
          <div style={{ textAlign: "right", fontSize: "10px", color: TEXT3, marginTop: "3px", marginBottom: "16px" }}>{title.length}/100</div>

          {error && (
            <div style={{ background: `${RED}12`, border: `1px solid ${RED}30`, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
              <p style={{ color: RED, fontSize: "12px", margin: 0 }}>{error}</p>
            </div>
          )}

          {loading && (
            <div style={{ marginBottom: "14px" }}>
              <div style={{ height: "4px", background: BORDER, borderRadius: "2px", overflow: "hidden", marginBottom: "6px" }}>
                <div style={{ height: "100%", width: `${progress}%`, background: RED, borderRadius: "2px", transition: "width 0.5s ease" }} />
              </div>
              <p style={{ color: TEXT2, fontSize: "11px", margin: 0, textAlign: "center" }}>Upload en cours… {progress}%</p>
            </div>
          )}

          <button onClick={handleUpload} disabled={!file || !title.trim() || loading}
            style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", fontSize: "14px", fontWeight: 800, transition: "all 0.15s", cursor: file && title.trim() && !loading ? "pointer" : "not-allowed", background: file && title.trim() && !loading ? RED : "#1a1a1a", color: file && title.trim() && !loading ? "#fff" : TEXT3, boxShadow: file && title.trim() && !loading ? `0 4px 20px ${RED}44` : "none" }}
          >
            {loading ? "Envoi en cours…" : "Publier la vidéo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudioPage() {
  const [tab,            setTab]            = useState<Tab>("overview");
  const [profile,        setProfile]        = useState<UserProfile | null>(null);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [graftsCount,    setGraftsCount]    = useState(0);
  const [totalViews,     setTotalViews]     = useState(0);
  const [totalRevenu,    setTotalRevenu]    = useState(0);
  const [isMobile,       setIsMobile]       = useState(false);

  // Ma chaîne
  const [chanDesc,  setChanDesc]  = useState("");
  const [chanCat,   setChanCat]   = useState("Politique");
  const [chanSaving,setChanSaving]= useState(false);
  const [chanSaved, setChanSaved] = useState(false);

  // Contenus
  const [videos,     setVideos]     = useState<VideoGraft[]>([]);
  const [lives,      setLives]      = useState<LiveSession[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [loading,    setLoading]    = useState(true);

  // Revenus
  const [superChats, setSuperChats] = useState<SuperChatRecord[]>([]);
  const [toast,      setToast]      = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const sb = createClient();
    const init = async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Profile
      const { data: prof } = await sb.from("profiles")
        .select("id, username, display_name, bio, verified")
        .eq("id", user.id)
        .maybeSingle();
      setProfile((prof as UserProfile) ?? {
        id:           user.id,
        username:     user.user_metadata?.username ?? user.email?.split("@")[0] ?? "Grafter",
        display_name: user.user_metadata?.display_name ?? null,
        bio:          null,
      });

      // Followers count
      const { count: fCount } = await sb.from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);
      setFollowersCount(fCount ?? 0);

      // Grafts count
      const { count: gCount } = await sb.from("grafts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setGraftsCount(gCount ?? 0);

      // Lives (stats + revenue)
      const { data: livesData } = await sb.from("live_sessions")
        .select("id, room_id, title, category, platform, peak_viewers, super_chats_total, started_at, ended_at")
        .eq("user_id", user.id)
        .eq("status", "ended")
        .order("started_at", { ascending: false })
        .limit(50);
      const livesArr = (livesData ?? []) as LiveSession[];
      setLives(livesArr);
      setTotalViews(livesArr.reduce((s, l) => s + l.peak_viewers, 0));
      setTotalRevenu(livesArr.reduce((s, l) => s + l.super_chats_total, 0));

      // Videos (grafts with video_url)
      const { data: vids } = await sb.from("grafts")
        .select("id, content, video_url, created_at")
        .eq("user_id", user.id)
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(30);
      setVideos((vids ?? []) as VideoGraft[]);

      // Super chats received
      const { data: chats } = await sb.from("super_chats")
        .select("id, live_id, montant, message, couleur, created_at")
        .eq("user_id", user.id)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(100);
      setSuperChats((chats ?? []) as SuperChatRecord[]);

      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const saveChain = async () => {
    if (!userId || chanSaving) return;
    setChanSaving(true);
    const sb = createClient();
    await fetch("/api/profile/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel_desc: chanDesc.trim().slice(0, 500),
        channel_cat:  chanCat,
      }),
    });
    setChanSaving(false);
    setChanSaved(true);
    setToast("Chaîne mise à jour ✓");
    setTimeout(() => setChanSaved(false), 2000);
  };

  const refreshVideos = async () => {
    if (!userId) return;
    const sb = createClient();
    const { data } = await sb.from("grafts")
      .select("id, content, video_url, created_at")
      .eq("user_id", userId)
      .not("video_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(30);
    setVideos((data ?? []) as VideoGraft[]);
  };

  const displayName = profile?.display_name ?? profile?.username ?? "Grafter";
  const username    = profile?.username ?? "grafter";
  const initiales   = displayName.slice(0, 2).toUpperCase();
  const avgRevenu   = lives.length > 0 ? totalRevenu / lives.length : 0;

  // Group super chats by live
  const chatsByLive = superChats.reduce<Record<string, { total: number; count: number; title: string }>>((acc, sc) => {
    const live = lives.find(l => l.room_id === sc.live_id);
    const title = live?.title ?? sc.live_id;
    if (!acc[sc.live_id]) acc[sc.live_id] = { total: 0, count: 0, title };
    acc[sc.live_id].total += sc.montant;
    acc[sc.live_id].count += 1;
    return acc;
  }, {});

  const inp: React.CSSProperties = {
    width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px",
    padding: "11px 14px", color: TEXT, fontSize: "13px", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.7} }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", bottom: isMobile ? "100px" : "90px", left: "50%", transform: "translateX(-50%)", background: GOLD, color: "#000", fontSize: "13px", fontWeight: 700, padding: "10px 22px", borderRadius: "100px", zIndex: 500, pointerEvents: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.5)", animation: "fadeUp 0.25s ease", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth: "700px", margin: "0 auto", paddingBottom: isMobile ? "110px" : "80px", fontFamily: "'Inter', system-ui, sans-serif", color: TEXT }}>

        {/* ── Sticky header ── */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(14px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: `linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "19px", boxShadow: `0 2px 14px ${RED}55`, flexShrink: 0 }}>🎬</div>
            <div>
              <h1 style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: "0 0 1px", letterSpacing: "-0.3px" }}>
                <span style={{ color: RED }}>STENO</span> <span style={{ color: GOLD }}>STUDIO</span>
              </h1>
              <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>Espace créateur professionnel</p>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
            {([
              ["overview", "📊 Vue d'ensemble", "📊"],
              ["chaine",   "📡 Ma chaîne",       "📡"],
              ["contenus", "🎬 Contenus",         "🎬"],
              ["revenus",  "💰 Revenus",           "💰"],
            ] as [Tab, string, string][]).map(([key, label, icon]) => (
              <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: isMobile ? "10px 2px" : "11px 4px", background: "none", border: "none", borderBottom: `2px solid ${tab === key ? RED : "transparent"}`, color: tab === key ? TEXT : TEXT2, fontSize: isMobile ? "10px" : "11px", fontWeight: tab === key ? 700 : 400, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
                {isMobile ? (
                  <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                    <span style={{ fontSize: "18px", lineHeight: 1 }}>{icon}</span>
                    <span>{key === "overview" ? "Stats" : key === "chaine" ? "Chaîne" : key === "contenus" ? "Médias" : "Revenus"}</span>
                  </span>
                ) : label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "16px" }}>

          {/* ══════════════════════ VUE D'ENSEMBLE ══════════════════════ */}
          {tab === "overview" && (
            <div>
              {/* Profile hero */}
              <div style={{ background: `linear-gradient(135deg,#0d0000 0%,#1c0606 50%,#080000 100%)`, border: `1px solid ${RED}22`, borderRadius: "18px", padding: "24px", marginBottom: "16px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 15% 60%,${RED}12 0%,transparent 55%)`, pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", fontWeight: 900, color: "#fff", flexShrink: 0, border: `3px solid ${RED}50`, boxShadow: `0 4px 24px ${RED}45` }}>
                    {loading ? "…" : initiales}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "3px" }}>
                      <span style={{ color: TEXT, fontSize: "20px", fontWeight: 900, letterSpacing: "-0.3px" }}>
                        {loading ? "Chargement…" : displayName}
                      </span>
                      {profile?.verified && (
                        <span style={{ background: GOLD, color: "#000", fontSize: "9px", fontWeight: 800, padding: "2px 7px", borderRadius: "100px", letterSpacing: "0.5px", flexShrink: 0 }}>✓ VÉRIFIÉ</span>
                      )}
                    </div>
                    <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>@{loading ? "…" : username}</p>
                    {profile?.bio && (
                      <p style={{ color: TEXT2, fontSize: "12px", margin: "6px 0 0", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{profile.bio}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: isMobile ? "nowrap" : "wrap", flexDirection: isMobile ? "column" : "row" }}>
                  <Link href={`/dashboard/profil/${username}`} style={{ textDecoration: "none" }}>
                    <button style={{ padding: "8px 16px", borderRadius: "100px", border: `1px solid ${RED}40`, background: "transparent", color: RED, fontSize: "12px", fontWeight: 700, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>Voir ma chaîne →</button>
                  </Link>
                  <button onClick={() => setTab("chaine")} style={{ padding: "8px 16px", borderRadius: "100px", border: `1px solid ${BORDER}`, background: "transparent", color: TEXT2, fontSize: "12px", fontWeight: 600, cursor: "pointer", width: isMobile ? "100%" : "auto" }}>⚙️ Modifier</button>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "16px" }}>
                <StatCard icon="❤️" label="Abonnés"            value={loading ? "—" : fmtN(followersCount)} color={RED}   sub="personnes vous suivent" />
                <StatCard icon="👁"  label="Vues totales"      value={loading ? "—" : fmtN(totalViews)}     color={BLUE}  sub="sur tous vos lives" />
                <StatCard icon="✍️" label="Grafts publiés"     value={loading ? "—" : fmtN(graftsCount)}    color={GOLD}  sub="depuis votre inscription" />
                <StatCard icon="⭐" label="Revenus Super Chat" value={loading ? "—" : `${totalRevenu.toFixed(0)}€`} color={GREEN} sub="total reçu en live" />
              </div>

              {/* Quick actions */}
              <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: BG }}>
                  <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Actions rapides</p>
                </div>
                {[
                  { icon: "🎬", label: "Uploader une vidéo",    sub: "Publiez du contenu sur votre chaîne",  action: () => { setTab("contenus"); setShowUpload(true); } },
                  { icon: "🔴", label: "Démarrer un live",       sub: "Diffusez en direct sur STENO TV",       action: () => { window.location.href = "/dashboard/live"; } },
                  { icon: "📊", label: "Voir mes statistiques",  sub: "Analysez votre audience en détail",     action: () => { window.location.href = "/dashboard/stats"; } },
                ].map((a, i, arr) => (
                  <button key={a.label} onClick={a.action} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "transparent", border: "none", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer", width: "100%", textAlign: "left", transition: "background 0.12s" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${RED}10`, border: `1px solid ${RED}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{a.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: TEXT, fontSize: "14px", fontWeight: 700, margin: "0 0 2px" }}>{a.label}</p>
                      <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>{a.sub}</p>
                    </div>
                    <span style={{ color: TEXT2, fontSize: "18px" }}>›</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════ MA CHAÎNE ══════════════════════ */}
          {tab === "chaine" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

              {/* Bannière */}
              <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: BG }}>
                  <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Bannière de la chaîne</p>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ height: "110px", borderRadius: "12px", background: `linear-gradient(135deg,#0d0000 0%,${RED}28 50%,#000810 100%)`, border: `1px dashed ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.15s" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${RED}50`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
                  >
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: "22px" }}>🖼️</span>
                      <p style={{ color: TEXT2, fontSize: "12px", margin: "6px 0 2px" }}>Cliquer pour modifier la bannière</p>
                      <p style={{ color: TEXT3, fontSize: "10px", margin: 0 }}>Recommandé : 1500 × 500 px</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: BG }}>
                  <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Description de la chaîne</p>
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <textarea value={chanDesc} onChange={e => setChanDesc(e.target.value.slice(0, 500))}
                    placeholder="Décrivez votre chaîne : votre ligne éditoriale, vos sujets de prédilection…"
                    rows={4}
                    style={{ ...inp, resize: "none" }}
                    onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                  <div style={{ textAlign: "right", fontSize: "10px", color: TEXT3, marginTop: "4px" }}>{chanDesc.length}/500</div>
                </div>
              </div>

              {/* Catégorie */}
              <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: BG }}>
                  <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Catégorie principale</p>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {CATS.map(c => (
                    <button key={c} onClick={() => setChanCat(c)} style={{ padding: "7px 16px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${chanCat === c ? RED : BORDER}`, background: chanCat === c ? `${RED}18` : "transparent", color: chanCat === c ? RED : TEXT2, transition: "all 0.12s" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lien public */}
              <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, background: BG }}>
                  <p style={{ color: GOLD, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>Lien vers la chaîne publique</p>
                </div>
                <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <code style={{ flex: 1, color: TEXT2, fontSize: "12px", fontFamily: "monospace", background: BG, border: `1px solid ${BORDER}`, borderRadius: "8px", padding: "9px 12px", wordBreak: "break-all" }}>
                    /dashboard/profil/{username}
                  </code>
                  <Link href={`/dashboard/profil/${username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                    <button style={{ padding: "9px 14px", borderRadius: "10px", background: `${RED}14`, border: `1px solid ${RED}30`, color: RED, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                      Voir →
                    </button>
                  </Link>
                </div>
              </div>

              <button onClick={saveChain} disabled={chanSaving}
                style={{ padding: "14px", borderRadius: "12px", border: "none", color: "#fff", fontSize: "14px", fontWeight: 800, cursor: chanSaving ? "not-allowed" : "pointer", transition: "background 0.3s", background: chanSaved ? GREEN : RED, boxShadow: `0 4px 16px ${chanSaved ? GREEN : RED}44` }}
              >
                {chanSaving ? "Enregistrement…" : chanSaved ? "✓ Enregistré" : "Enregistrer la chaîne"}
              </button>
            </div>
          )}

          {/* ══════════════════════ MES CONTENUS ══════════════════════ */}
          {tab === "contenus" && (
            <div>
              {/* Vidéos */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h2 style={{ color: TEXT, fontSize: "15px", fontWeight: 800, margin: 0 }}>🎬 Vidéos publiées</h2>
                <button onClick={() => setShowUpload(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: RED, border: "none", borderRadius: "100px", padding: "8px 16px", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 14px ${RED}44` }}>
                  + Uploader
                </button>
              </div>

              {loading ? (
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "24px" }}>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: 0, animation: "shimmer 1.4s ease-in-out infinite" }}>Chargement…</p>
                </div>
              ) : videos.length === 0 ? (
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "40px 20px", textAlign: "center", marginBottom: "24px" }}>
                  <span style={{ fontSize: "40px" }}>🎬</span>
                  <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: "12px 0 6px" }}>Aucune vidéo publiée</p>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 18px" }}>Uploadez votre premier contenu vidéo.</p>
                  <button onClick={() => setShowUpload(true)} style={{ background: RED, border: "none", borderRadius: "100px", padding: "10px 24px", color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${RED}44` }}>
                    Uploader une vidéo
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
                  {videos.map(v => (
                    <div key={v.id} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "13px 15px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "52px", height: "40px", borderRadius: "8px", background: `${RED}12`, border: `1px solid ${RED}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🎬</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: TEXT, fontSize: "13px", fontWeight: 700, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.content}</p>
                        <span style={{ color: TEXT2, fontSize: "11px" }}>{fmtDate(v.created_at)}</span>
                      </div>
                      {v.video_url && (
                        <a href={v.video_url} target="_blank" rel="noopener noreferrer" style={{ color: RED, fontSize: "11px", fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>Voir →</a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Lives passés */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <h2 style={{ color: TEXT, fontSize: "15px", fontWeight: 800, margin: 0 }}>📡 Lives passés</h2>
                <Link href="/dashboard/live" style={{ color: RED, fontSize: "12px", fontWeight: 700, textDecoration: "none" }}>Nouveau live →</Link>
              </div>

              {loading ? (
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "32px", textAlign: "center" }}>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: 0, animation: "shimmer 1.4s ease-in-out infinite" }}>Chargement…</p>
                </div>
              ) : lives.length === 0 ? (
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "32px 20px", textAlign: "center" }}>
                  <span style={{ fontSize: "36px" }}>📡</span>
                  <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: "10px 0 6px" }}>Aucun live terminé</p>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 16px" }}>Vos broadcasts apparaîtront ici après chaque live.</p>
                  <Link href="/dashboard/live" style={{ textDecoration: "none" }}>
                    <button style={{ background: RED, border: "none", borderRadius: "100px", padding: "10px 24px", color: "#fff", fontSize: "13px", fontWeight: 800, cursor: "pointer", boxShadow: `0 4px 16px ${RED}44` }}>
                      🔴 Démarrer un live
                    </button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {lives.map(l => (
                    <div key={l.id} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "13px 15px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "9px" }}>
                        <p style={{ color: TEXT, fontSize: "13px", fontWeight: 700, margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</p>
                        <span style={{ color: TEXT2, fontSize: "11px", flexShrink: 0 }}>{fmtDate(l.started_at)}</span>
                      </div>
                      <div style={{ display: "flex", gap: "18px", paddingTop: "9px", borderTop: `1px solid ${BORDER}`, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ color: BLUE, fontWeight: 800, fontSize: "15px", margin: 0 }}>{fmtN(l.peak_viewers)}</p>
                          <p style={{ color: TEXT2, fontSize: "9px", margin: 0 }}>Pic spectateurs</p>
                        </div>
                        <div>
                          <p style={{ color: GOLD, fontWeight: 800, fontSize: "15px", margin: 0 }}>{l.super_chats_total}€</p>
                          <p style={{ color: TEXT2, fontSize: "9px", margin: 0 }}>Super Chats</p>
                        </div>
                        <div>
                          <p style={{ color: TEXT2, fontWeight: 700, fontSize: "13px", margin: 0 }}>{fmtDuration(l.started_at, l.ended_at)}</p>
                          <p style={{ color: TEXT2, fontSize: "9px", margin: 0 }}>Durée</p>
                        </div>
                        <div>
                          <p style={{ color: TEXT2, fontWeight: 600, fontSize: "12px", margin: 0 }}>{l.category}</p>
                          <p style={{ color: TEXT2, fontSize: "9px", margin: 0 }}>Catégorie</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════ MES REVENUS ══════════════════════ */}
          {tab === "revenus" && (
            <div>
              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px 12px", textAlign: "center" }}>
                  <p style={{ color: GOLD, fontSize: "26px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{totalRevenu.toFixed(0)}€</p>
                  <p style={{ color: TEXT2, fontSize: "10px", margin: 0, fontWeight: 600 }}>Total Super Chats</p>
                </div>
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px 12px", textAlign: "center" }}>
                  <p style={{ color: GREEN, fontSize: "26px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{avgRevenu.toFixed(0)}€</p>
                  <p style={{ color: TEXT2, fontSize: "10px", margin: 0, fontWeight: 600 }}>Moy. par live</p>
                </div>
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px 12px", textAlign: "center" }}>
                  <p style={{ color: RED, fontSize: "26px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>{superChats.length}</p>
                  <p style={{ color: TEXT2, fontSize: "10px", margin: 0, fontWeight: 600 }}>Transactions</p>
                </div>
              </div>

              {/* Par live */}
              {Object.keys(chatsByLive).length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ color: TEXT, fontSize: "14px", fontWeight: 800, margin: "0 0 10px" }}>Par live</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(chatsByLive)
                      .sort((a, b) => b[1].total - a[1].total)
                      .map(([liveId, s]) => (
                        <div key={liveId} style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "13px 15px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: `${GOLD}10`, border: `1px solid ${GOLD}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>⭐</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: TEXT, fontSize: "13px", fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                            <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>{s.count} Super Chat{s.count > 1 ? "s" : ""}</p>
                          </div>
                          <span style={{ color: GOLD, fontSize: "16px", fontWeight: 900, flexShrink: 0 }}>{s.total}€</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Historique récent */}
              <h3 style={{ color: TEXT, fontSize: "14px", fontWeight: 800, margin: "0 0 10px" }}>Historique récent</h3>
              {superChats.length === 0 ? (
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "40px 20px", textAlign: "center" }}>
                  <span style={{ fontSize: "40px" }}>⭐</span>
                  <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: "12px 0 6px" }}>Aucun Super Chat reçu</p>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Les Super Chats apparaissent ici après vos lives.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {superChats.slice(0, 20).map(sc => (
                    <div key={sc.id} style={{ background: SURF, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${sc.couleur}`, borderRadius: "10px", padding: "11px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: sc.couleur, fontSize: "17px", fontWeight: 900, flexShrink: 0, minWidth: "40px" }}>{sc.montant}€</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {sc.message ? (
                          <p style={{ color: TEXT, fontSize: "12px", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.message}</p>
                        ) : (
                          <p style={{ color: TEXT3, fontSize: "12px", margin: "0 0 2px", fontStyle: "italic" }}>Aucun message</p>
                        )}
                        <p style={{ color: TEXT2, fontSize: "10px", margin: 0 }}>
                          {lives.find(l => l.room_id === sc.live_id)?.title ?? "Live"} · {fmtDate(sc.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {showUpload && userId && (
        <VideoUploadModal
          userId={userId}
          username={profile?.username ?? "Grafter"}
          onClose={() => setShowUpload(false)}
          onUploaded={refreshVideos}
          isMobile={isMobile}
        />
      )}
    </>
  );
}
