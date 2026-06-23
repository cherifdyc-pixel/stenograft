"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

type Profile = {
  id?: string; username: string; display_name?: string | null;
  bio: string | null; ville: string | null; site?: string | null;
  avatar_url?: string | null;
  verified?: boolean; created_at?: string;
};
type Graft  = { id: string; content: string; created_at: string; video_url: string | null; image_url?: string | null; parent_id: string | null };
type TabKey = "grafts" | "reponses" | "medias" | "approuves";
type Follower = { id: string; username: string; display_name: string | null };

const TABS: { key: TabKey; label: string }[] = [
  { key: "grafts",    label: "Grafts"    },
  { key: "reponses",  label: "Réponses"  },
  { key: "medias",    label: "Médias"    },
  { key: "approuves", label: "Approuvés" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  const d = new Date(iso);
  if (d.getFullYear() === new Date().getFullYear())
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function avatarGrad(name: string): string {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

// ── MiniGraftCard ────────────────────────────────────────────────────────────

function MiniGraftCard({ graft, isMobile }: { graft: Graft; isMobile: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = graft.content.length > 280;
  const shown = long && !expanded ? graft.content.slice(0, 280) + "…" : graft.content;

  return (
    <article
      style={{ padding: isMobile ? "11px 12px" : "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s", cursor: "default" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#050505")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {graft.parent_id && <p style={{ color: TEXT2, fontSize: "12px", margin: "0 0 4px" }}>↩ En réponse</p>}
      <p style={{ color: TEXT, fontSize: isMobile ? "13px" : "14px", lineHeight: 1.6, margin: "0 0 6px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{shown}</p>
      {long && (
        <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: RED, fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "6px" }}>
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}
      {graft.video_url && (
        <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}`, marginBottom: "6px" }}>
          <iframe src={graft.video_url} allowFullScreen loading="lazy" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        </div>
      )}
      {graft.image_url && !graft.video_url && (
        <img src={graft.image_url} alt="" style={{ width: "100%", borderRadius: "12px", marginBottom: "6px", maxHeight: "300px", objectFit: "cover", display: "block" }} />
      )}
      <span style={{ color: TEXT2, fontSize: "12px" }}>{relativeTime(graft.created_at)}</span>
    </article>
  );
}

// ── TabContent ────────────────────────────────────────────────────────────────

function TabContent({ tab, userId, isMobile }: { tab: TabKey; userId: string; isMobile: boolean }) {
  const [grafts,   setGrafts]   = useState<Graft[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setFetching(true);
    const sb = createClient();

    async function run() {
      let res;
      if (tab === "grafts")
        res = await sb.from("grafts").select("id,content,created_at,video_url,image_url,parent_id").eq("user_id", userId).is("parent_id", null).order("created_at", { ascending: false }).limit(30);
      else if (tab === "reponses")
        res = await sb.from("grafts").select("id,content,created_at,video_url,image_url,parent_id").eq("user_id", userId).not("parent_id", "is", null).order("created_at", { ascending: false }).limit(30);
      else if (tab === "medias")
        res = await sb.from("grafts").select("id,content,created_at,video_url,image_url,parent_id").eq("user_id", userId).or("video_url.not.is.null,image_url.not.is.null").order("created_at", { ascending: false }).limit(20);
      else {
        const { data: rows } = await sb.from("approvals").select("graft_id, grafts(id,content,created_at,video_url,image_url,parent_id)").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
        const items = (rows ?? []).map((r: any) => r.grafts).filter(Boolean) as Graft[];
        setGrafts(items);
        setFetching(false);
        return;
      }
      setGrafts((res?.data ?? []) as Graft[]);
      setFetching(false);
    }
    run();
  }, [tab, userId]);

  if (fetching) return (
    <div>
      {[0,1,2].map(i => (
        <div key={i} style={{ padding: isMobile ? "11px 12px" : "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ height: "12px", width: "100%", background: "#0D0D0D", borderRadius: "6px", marginBottom: "8px" }} />
          <div style={{ height: "12px", width: `${55+i*12}%`, background: "#090909", borderRadius: "6px" }} />
        </div>
      ))}
    </div>
  );

  if (grafts.length === 0) {
    const msgs: Record<TabKey, [string, string]> = {
      grafts:    ["Aucun graft",    "Tes publications apparaîtront ici."],
      reponses:  ["Aucune réponse", "Tes réponses apparaîtront ici."],
      medias:    ["Aucun média",    "Tes grafts avec vidéo apparaîtront ici."],
      approuves: ["Aucun approuvé", "Les grafts que tu as approuvés seront ici."],
    };
    const [label, desc] = msgs[tab];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: isMobile ? "40px 16px" : "60px 20px" }}>
        <span style={{ fontSize: isMobile ? "32px" : "40px" }}>📭</span>
        <p style={{ color: TEXT, fontSize: isMobile ? "15px" : "18px", fontWeight: 900, margin: 0 }}>{label}</p>
        <p style={{ color: TEXT2, fontSize: isMobile ? "13px" : "14px", margin: 0, textAlign: "center", maxWidth: "260px", lineHeight: 1.6 }}>{desc}</p>
      </div>
    );
  }

  return <div>{grafts.map(g => <MiniGraftCard key={g.id} graft={g} isMobile={isMobile} />)}</div>;
}

// ── FollowListModal ───────────────────────────────────────────────────────────

function FollowListModal({ userId, mode, onClose }: { userId: string; mode: "followers" | "following"; onClose: () => void }) {
  const [list, setList] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    async function run() {
      if (mode === "followers") {
        const { data } = await sb.from("follows").select("follower:profiles!follows_follower_id_fkey(id,username,display_name)").eq("following_id", userId).limit(50);
        setList((data ?? []).map((r: any) => r.follower).filter(Boolean));
      } else {
        const { data } = await sb.from("follows").select("following:profiles!follows_following_id_fkey(id,username,display_name)").eq("follower_id", userId).limit(50);
        setList((data ?? []).map((r: any) => r.following).filter(Boolean));
      }
      setLoading(false);
    }
    run();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userId, mode, onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: "480px", maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <span style={{ color: TEXT, fontWeight: 800, fontSize: "15px" }}>{mode === "followers" ? "Abonnés" : "Abonnements"}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT2, fontSize: "22px", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: TEXT2 }}>Chargement…</div>
          ) : list.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: TEXT2, fontSize: "14px" }}>
              {mode === "followers" ? "Aucun abonné pour l'instant." : "Tu ne suis personne."}
            </div>
          ) : list.map(f => (
            <Link key={f.id} href={`/dashboard/profil/${f.username}`} onClick={onClose} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", padding: "12px 18px", borderBottom: `1px solid ${BORDER}` }}
              onMouseEnter={e => (e.currentTarget.style.background = "#111")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: avatarGrad(f.username), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 800, flexShrink: 0 }}>
                {(f.display_name || f.username)[0].toUpperCase()}
              </div>
              <div>
                <div style={{ color: TEXT, fontWeight: 700, fontSize: "14px" }}>{f.display_name || f.username}</div>
                <div style={{ color: TEXT2, fontSize: "12px" }}>@{f.username}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EditProfileModal ──────────────────────────────────────────────────────────

function EditProfileModal({ profile, userId, exists, onClose, onSaved, isMobile }: {
  profile: Profile; userId: string; exists: boolean; isMobile: boolean;
  onClose: () => void; onSaved: (p: Profile) => void;
}) {
  const [form,            setForm]            = useState({ display_name: profile.display_name ?? "", bio: profile.bio ?? "", ville: profile.ville ?? "", site: profile.site ?? "" });
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState<string | null>(null);
  const [avatarUrl,       setAvatarUrl]       = useState<string | null>(profile.avatar_url ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarHov,       setAvatarHov]       = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo trop lourde (max 5 Mo)."); return; }
    if (!file.type.startsWith("image/")) { setError("Fichier non supporté."); return; }

    setUploadingAvatar(true); setError(null);
    const sb  = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `avatars/${userId}.${ext}`;

    const { error: upErr } = await sb.storage
      .from("grafts-images")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) { setError(upErr.message); setUploadingAvatar(false); return; }

    const { data: { publicUrl } } = sb.storage.from("grafts-images").getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;

    const { error: dbErr } = await sb
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", userId);

    if (dbErr) { setError(dbErr.message); setUploadingAvatar(false); return; }

    setAvatarUrl(url);
    setUploadingAvatar(false);
  };

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username:     profile.username,
          display_name: form.display_name.trim() || null,
          bio:          form.bio.trim() || null,
          city:         form.ville.trim() || null,
          website:      form.site.trim() || null,
          avatar_url:   avatarUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? `Erreur ${res.status}`); setSaving(false); return; }
      onSaved(json.profile as Profile);
    } catch {
      setError("Impossible de joindre le serveur.");
    }
    setSaving(false);
  };

  const inputSt: React.CSSProperties = { width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 13px", color: TEXT, fontSize: isMobile ? "13px" : "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" };
  const labelSt: React.CSSProperties = { color: TEXT2, fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", display: "block", marginBottom: "5px" };

  const avatarSz = isMobile ? "48px" : "60px";

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? "0" : "16px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: isMobile ? "20px 20px 0 0" : "20px", width: "100%", maxWidth: isMobile ? "100%" : "480px", maxHeight: isMobile ? "92vh" : "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.9)", paddingBottom: isMobile ? "env(safe-area-inset-bottom)" : "0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "12px 16px" : "14px 18px", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, background: SURFACE, zIndex: 1 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT, fontSize: "22px", cursor: "pointer" }}>×</button>
          <span style={{ color: TEXT, fontSize: isMobile ? "14px" : "15px", fontWeight: 800 }}>Modifier mon identité</span>
          <button onClick={handleSave} disabled={saving || uploadingAvatar} style={{ background: TEXT, color: BG, border: "none", borderRadius: "100px", padding: isMobile ? "6px 14px" : "7px 18px", fontSize: "13px", fontWeight: 800, cursor: (saving || uploadingAvatar) ? "not-allowed" : "pointer", opacity: (saving || uploadingAvatar) ? 0.6 : 1 }}>
            {saving ? "…" : "Sauvegarder"}
          </button>
        </div>

        {/* Mini banner + avatar cliquable */}
        <div style={{ height: isMobile ? "60px" : "80px", background: `linear-gradient(135deg,#050505 0%,${RED}28 50%,${GOLD}14 100%)`, position: "relative", flexShrink: 0 }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          <div
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={() => setAvatarHov(true)}
            onMouseLeave={() => setAvatarHov(false)}
            style={{ position: "absolute", bottom: isMobile ? "-24px" : "-30px", left: isMobile ? "14px" : "20px", width: avatarSz, height: avatarSz, borderRadius: "50%", border: `3px solid ${GOLD}`, cursor: "pointer", overflow: "hidden", flexShrink: 0, background: avatarGrad(profile.username || "?"), display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <span style={{ color: "#fff", fontSize: isMobile ? "16px" : "20px", fontWeight: 900 }}>{(form.display_name || profile.username || "?")[0]?.toUpperCase()}</span>
            }
            {/* Overlay caméra */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", opacity: (avatarHov || uploadingAvatar) ? 1 : 0, transition: "opacity 0.15s" }}>
              <span style={{ fontSize: "18px" }}>{uploadingAvatar ? "⏳" : "📷"}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? "34px 14px 20px" : "44px 20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "11px" : "14px" }}>
            <div>
              <label style={labelSt}>Nom affiché</label>
              <input value={form.display_name} onChange={set("display_name")} placeholder={profile.username} maxLength={50} style={inputSt} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </div>
            <div>
              <label style={labelSt}>Ville</label>
              <input value={form.ville} onChange={set("ville")} placeholder="Paris, Marseille, Alger…" style={inputSt} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </div>
            <div>
              <label style={labelSt}>Site web</label>
              <input value={form.site} onChange={set("site")} placeholder="https://…" type="url" style={inputSt} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </div>
            <div>
              <label style={labelSt}>Bio <span style={{ color: TEXT3, textTransform: "none", letterSpacing: 0 }}>{form.bio.length}/280</span></label>
              <textarea value={form.bio} onChange={set("bio")} placeholder="Parle de toi…" rows={isMobile ? 3 : 4} maxLength={280} style={{ ...inputSt, resize: "vertical", lineHeight: 1.6 }} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </div>
          </div>
          {error && (
            <div style={{ background: `${RED}15`, border: `1px solid ${RED}30`, borderRadius: "10px", padding: "10px 14px", marginTop: "12px" }}>
              <p style={{ color: RED, fontSize: "13px", fontWeight: 600, margin: 0 }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const [userId,        setUserId]        = useState<string | null>(null);
  const [authUsername,  setAuthUsername]  = useState<string>("…");
  const [profile,       setProfile]       = useState<Profile>({ username: "…", bio: null, ville: null });
  const [graftCount,    setGraftCount]    = useState<number | null>(null);
  const [followers,     setFollowers]     = useState(0);
  const [following,     setFollowing]     = useState(0);
  const [profileExists, setProfileExists] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [tab,           setTab]           = useState<TabKey>("grafts");
  const [followModal,   setFollowModal]   = useState<"followers" | "following" | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchData = useCallback(async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }

    const uname = user.user_metadata?.username ?? user.email?.split("@")[0] ?? "Grafter";
    setUserId(user.id);
    setAuthUsername(uname);

    const [
      { count: grafts },
      { count: frs },
      { count: fing },
      { data: profileData, error: profileErr },
    ] = await Promise.all([
      sb.from("grafts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      sb.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    ]);

    setGraftCount(grafts ?? 0);
    setFollowers(frs ?? 0);
    setFollowing(fing ?? 0);

    if (!profileErr && profileData) {
      setProfile(profileData as Profile);
      setProfileExists(true);
    } else {
      setProfile({ username: uname, bio: null, ville: null });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayName = profile.display_name || profile.username || authUsername;
  const handle      = (profile.username || authUsername).toLowerCase();
  const verified    = profile.verified ?? false;

  const copyLink = () => {
    navigator.clipboard.writeText(`https://stenograft.fr/dashboard/profil/${handle}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const avatarSize   = isMobile ? "64px"  : "82px";
  const avatarFont   = isMobile ? "22px"  : "28px";
  const avatarOffset = isMobile ? "-32px" : "-42px";
  const bannerHeight = isMobile ? "120px" : "160px";

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: isMobile ? "110px" : "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* ── Banner ── */}
        <div style={{ height: bannerHeight, background: `linear-gradient(135deg,#050505 0%,${RED}28 50%,${GOLD}14 100%)`, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 25% 70%,${RED}22 0%,transparent 55%),radial-gradient(circle at 80% 20%,${GOLD}14 0%,transparent 45%)` }} />
        </div>

        {/* ── Avatar row ── */}
        <div style={{ padding: isMobile ? "0 12px" : "0 16px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: isMobile ? "8px" : "12px" }}>
            <div onClick={() => setEditing(true)} style={{ width: avatarSize, height: avatarSize, borderRadius: "50%", background: avatarGrad(handle), border: verified ? `3px solid ${GOLD}` : `3px solid ${BG}`, boxShadow: verified ? `0 0 0 1px ${GOLD}60` : `0 0 0 1px ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: avatarFont, fontWeight: 900, marginTop: avatarOffset, flexShrink: 0, cursor: "pointer", overflow: "hidden" }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : displayName[0]?.toUpperCase() ?? "?"
              }
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button onClick={copyLink} title="Copier le lien du profil" style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: "100px", width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: isMobile ? "13px" : "15px", color: copied ? GOLD : TEXT2, transition: "all 0.15s" }}>
                {copied ? "✓" : "🔗"}
              </button>
              <button onClick={() => setEditing(true)} style={{ background: "transparent", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: isMobile ? "6px 14px" : "8px 18px", fontSize: isMobile ? "12px" : "13px", fontWeight: 700, cursor: "pointer", transition: "background 0.12s", whiteSpace: "nowrap" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >Modifier</button>
            </div>
          </div>

          {/* Nom + badge */}
          <div style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              <h1 style={{ color: TEXT, fontSize: isMobile ? "17px" : "20px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>{displayName}</h1>
              {verified && (
                <span title="Compte certifié" style={{ width: "16px", height: "16px", borderRadius: "50%", background: GOLD, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "8px", color: "#000", fontWeight: 900, flexShrink: 0 }}>✓</span>
              )}
            </div>
            <p style={{ color: TEXT2, fontSize: isMobile ? "12px" : "14px", margin: "2px 0 0" }}>@{handle}</p>
          </div>

          {/* Bio */}
          {profile.bio ? (
            <p style={{ color: TEXT, fontSize: isMobile ? "13px" : "14px", lineHeight: 1.6, margin: "8px 0 6px", whiteSpace: "pre-wrap" }}>{profile.bio}</p>
          ) : !loading ? (
            <p style={{ color: TEXT3, fontSize: isMobile ? "13px" : "14px", margin: "8px 0 6px", cursor: "pointer" }} onClick={() => setEditing(true)}>Ajoute une bio…</p>
          ) : null}

          {/* Meta */}
          <div style={{ display: "flex", gap: isMobile ? "10px" : "14px", flexWrap: "wrap", marginBottom: isMobile ? "8px" : "12px" }}>
            {profile.ville && <span style={{ color: TEXT2, fontSize: isMobile ? "12px" : "13px" }}>📍 {profile.ville}</span>}
            {profile.site && (
              <a href={profile.site} target="_blank" rel="noopener noreferrer" style={{ color: RED, fontSize: isMobile ? "12px" : "13px", textDecoration: "none" }}>🔗 {profile.site.replace(/^https?:\/\//, "")}</a>
            )}
            {profile.created_at && (
              <span style={{ color: TEXT2, fontSize: isMobile ? "12px" : "13px" }}>
                📅 {isMobile ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "short", year: "numeric" }) : `Membre depuis ${new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`}
              </span>
            )}
          </div>

          {/* Stats cliquables */}
          <div style={{ display: "flex", gap: isMobile ? "14px" : "18px", flexWrap: "wrap", paddingBottom: isMobile ? "8px" : "12px" }}>
            <div style={{ display: "flex", gap: "4px", alignItems: "baseline" }}>
              <span style={{ color: TEXT, fontSize: isMobile ? "14px" : "15px", fontWeight: 800 }}>{graftCount ?? "—"}</span>
              <span style={{ color: TEXT2, fontSize: isMobile ? "12px" : "13px" }}>Grafts</span>
            </div>
            <button onClick={() => followers > 0 && setFollowModal("followers")} style={{ background: "none", border: "none", padding: 0, cursor: followers > 0 ? "pointer" : "default", display: "flex", gap: "4px", alignItems: "baseline" }}>
              <span style={{ color: TEXT, fontSize: isMobile ? "14px" : "15px", fontWeight: 800 }}>{fmtN(followers)}</span>
              <span style={{ color: TEXT2, fontSize: isMobile ? "12px" : "13px" }}>Abonnés</span>
            </button>
            <button onClick={() => following > 0 && setFollowModal("following")} style={{ background: "none", border: "none", padding: 0, cursor: following > 0 ? "pointer" : "default", display: "flex", gap: "4px", alignItems: "baseline" }}>
              <span style={{ color: TEXT, fontSize: isMobile ? "14px" : "15px", fontWeight: 800 }}>{fmtN(following)}</span>
              <span style={{ color: TEXT2, fontSize: isMobile ? "12px" : "13px" }}>Abonnements</span>
            </button>
          </div>
        </div>

        {/* ── Tabs sticky ── */}
        <div ref={headerRef} style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 10, background: `${BG}F2`, backdropFilter: "blur(12px)" }}>
          {TABS.map(t => {
            const on = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, background: "none", border: "none", padding: isMobile ? "10px 2px" : "13px 4px", cursor: "pointer", borderBottom: `2px solid ${on ? RED : "transparent"}`, color: on ? TEXT : TEXT2, fontSize: isMobile ? "12px" : "13px", fontWeight: on ? 700 : 400, transition: "all 0.15s" }}
                onMouseEnter={e => !on && (e.currentTarget.style.background = "#080808")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >{t.label}</button>
            );
          })}
        </div>

        {/* ── Contenu ── */}
        {userId && <TabContent tab={tab} userId={userId} isMobile={isMobile} />}
        {!userId && !loading && (
          <div style={{ padding: "60px 20px", textAlign: "center", color: TEXT2 }}>Non connecté.</div>
        )}

        {/* ── Modaux ── */}
        {editing && userId && (
          <EditProfileModal
            profile={profile} userId={userId} exists={profileExists} isMobile={isMobile}
            onClose={() => setEditing(false)}
            onSaved={p => { setProfile(p); setProfileExists(true); setEditing(false); }}
          />
        )}
        {followModal && userId && (
          <FollowListModal userId={userId} mode={followModal} onClose={() => setFollowModal(null)} />
        )}
      </div>
    </>
  );
}
