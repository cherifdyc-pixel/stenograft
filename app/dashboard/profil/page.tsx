"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import FollowButton from "@/components/FollowButton";

const BG      = "#000000";
const SURFACE = "#0D0D0D";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";
const BLUE    = "#1D9BF0";

type Profile = { id?: string; username: string; bio: string | null; ville: string | null };
type Graft   = { id: string; content: string; created_at: string; video_url: string | null; parent_id: string | null };
type TabKey  = "grafts" | "reponses" | "medias" | "approuves";

const TABS: { key: TabKey; label: string }[] = [
  { key: "grafts",    label: "Grafts"    },
  { key: "reponses",  label: "Réponses"  },
  { key: "medias",    label: "Médias"    },
  { key: "approuves", label: "Approuvés" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const now = Date.now();
  const d   = new Date(iso);
  const s   = Math.floor((now - d.getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `il y a ${m}min`;
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

function avatarGrad(name: string): string {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${hue},55%,18%) 0%, hsl(${(hue+45)%360},65%,38%) 100%)`;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilPage() {
  const [userId,        setUserId]        = useState<string | null>(null);
  const [username,      setUsername]      = useState<string>("…");
  const [verified,      setVerified]      = useState(false);
  const [profile,       setProfile]       = useState<Profile>({ username: "…", bio: null, ville: null });
  const [graftCount,    setGraftCount]    = useState<number | null>(null);
  const [followers,     setFollowers]     = useState<number>(0);
  const [following,     setFollowing]     = useState<number>(0);
  const [profileExists, setProfileExists] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [editing,       setEditing]       = useState(false);
  const [tab,           setTab]           = useState<TabKey>("grafts");

  const fetchData = useCallback(async () => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }

    const uname = user.user_metadata?.username ?? user.email?.split("@")[0] ?? "Grafter";
    setUserId(user.id);
    setUsername(uname);

    const [
      { count: grafts },
      { count: followersCount },
      { count: followingCount },
      { data: profileData, error: profileError },
    ] = await Promise.all([
      sb.from("grafts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      sb.from("profiles").select("*").eq("id", user.id).single(),
    ]);

    setGraftCount(grafts ?? 0);
    setFollowers(followersCount ?? 0);
    setFollowing(followingCount ?? 0);

    if (!profileError && profileData) {
      setProfile(profileData as Profile);
      setVerified(profileData.verified ?? false);
      setProfileExists(true);
    } else {
      setProfile({ username: uname, bio: null, ville: null });
    }

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ paddingBottom: "40px" }}>
      {/* ── Banner ── */}
      <div style={{ height: "200px", background: `linear-gradient(135deg, #050505 0%, ${RED}28 50%, ${GOLD}14 100%)`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 25% 70%, ${RED}20 0%, transparent 55%), radial-gradient(circle at 80% 20%, ${GOLD}12 0%, transparent 45%)` }} />
      </div>

      {/* ── Avatar row ── */}
      <div style={{ padding: "0 20px", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "14px" }}>
          <div style={{
            width: "84px", height: "84px", borderRadius: "50%",
            background: avatarGrad(username),
            border: verified ? `3px solid ${GOLD}` : `3px solid ${BG}`,
            boxShadow: verified ? `0 0 0 1px ${GOLD}60` : `0 0 0 1px ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "30px", fontWeight: 900,
            marginTop: "-42px", flexShrink: 0,
          }}>
            {username[0]?.toUpperCase() ?? "?"}
          </div>

          <button
            onClick={() => setEditing(true)}
            style={{ background: "transparent", color: TEXT, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "9px 22px", fontSize: "14px", fontWeight: 600, cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0f0f0f")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >Modifier mon identité</button>
        </div>

        {/* Name + badge */}
        <div style={{ marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>{profile.username || username}</h1>
            {verified && (
              <>
                <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: GOLD, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#000", fontWeight: 900, flexShrink: 0 }}>✓</span>
                <span style={{ color: GOLD, fontSize: "13px", fontWeight: 700 }}>Certifié</span>
              </>
            )}
          </div>
          <p style={{ color: TEXT2, fontSize: "14px", margin: "4px 0 0" }}>@{(profile.username || username).toLowerCase()}</p>
        </div>

        {/* Bio */}
        {profile.bio ? (
          <p style={{ color: TEXT, fontSize: "15px", lineHeight: 1.6, margin: "10px 0" }}>{profile.bio}</p>
        ) : (
          <p style={{ color: TEXT3, fontSize: "14px", margin: "10px 0", cursor: "pointer" }} onClick={() => setEditing(true)}>Ajoute une bio…</p>
        )}

        {/* Meta */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "14px" }}>
          {profile.ville && (
            <span style={{ color: TEXT2, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>📍 {profile.ville}</span>
          )}
          {profile.id && (
            <span style={{ color: TEXT2, fontSize: "14px", display: "flex", alignItems: "center", gap: "4px" }}>
              📅 Membre depuis {new Date((profile as any).created_at || Date.now()).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", paddingBottom: "14px" }}>
          <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
            <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800 }}>{graftCount ?? "—"}</span>
            <span style={{ color: TEXT2, fontSize: "14px" }}>Grafts</span>
          </div>
          <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
            <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800 }}>{fmtN(followers)}</span>
            <span style={{ color: TEXT2, fontSize: "14px" }}>Abonnés</span>
          </div>
          <div style={{ display: "flex", gap: "5px", alignItems: "baseline" }}>
            <span style={{ color: TEXT, fontSize: "15px", fontWeight: 800 }}>{fmtN(following)}</span>
            <span style={{ color: TEXT2, fontSize: "14px" }}>Abonnements</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, position: "sticky", top: 0, zIndex: 10, background: `${BG}F0`, backdropFilter: "blur(12px)" }}>
        {TABS.map(t => {
          const on = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ flex: 1, background: "none", border: "none", padding: "14px 4px", cursor: "pointer", borderBottom: `2px solid ${on ? RED : "transparent"}`, color: on ? TEXT : TEXT2, fontSize: "14px", fontWeight: on ? 700 : 400, transition: "all 0.15s" }}
              onMouseEnter={e => !on && (e.currentTarget.style.background = "#0a0a0a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >{t.label}</button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {userId && <TabContent tab={tab} userId={userId} loading={loading} />}

      {editing && userId && (
        <EditProfileModal
          profile={profile}
          userId={userId}
          exists={profileExists}
          onClose={() => setEditing(false)}
          onSaved={p => { setProfile(p); setProfileExists(true); setEditing(false); }}
        />
      )}
    </div>
  );
}

// ── Tab content ───────────────────────────────────────────────────────────────

function TabContent({ tab, userId, loading }: { tab: TabKey; userId: string; loading: boolean }) {
  const [grafts,   setGrafts]   = useState<Graft[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (tab === "approuves") { setFetching(false); return; }
    setFetching(true);
    const sb = createClient();

    async function run() {
      let res;
      if (tab === "grafts")
        res = await sb.from("grafts").select("id,content,created_at,video_url,parent_id").eq("user_id", userId).is("parent_id", null).order("created_at", { ascending: false }).limit(30);
      else if (tab === "reponses")
        res = await sb.from("grafts").select("id,content,created_at,video_url,parent_id").eq("user_id", userId).not("parent_id", "is", null).order("created_at", { ascending: false }).limit(30);
      else
        res = await sb.from("grafts").select("id,content,created_at,video_url,parent_id").eq("user_id", userId).not("video_url", "is", null).order("created_at", { ascending: false }).limit(30);
      setGrafts((res.data ?? []) as Graft[]);
      setFetching(false);
    }
    run();
  }, [tab, userId]);

  if (tab === "approuves") return <PlaceholderTab icon="❤️" label="Grafts approuvés" desc="Les grafts que tu as approuvés apparaîtront ici." />;
  if (fetching || loading) return <LoadingSkeleton />;
  if (grafts.length === 0)  return <EmptyTab tab={tab} />;

  return (
    <div>
      {grafts.map(g => <MiniGraftCard key={g.id} graft={g} />)}
    </div>
  );
}

function MiniGraftCard({ graft }: { graft: Graft }) {
  return (
    <article
      style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s", cursor: "default" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#050505")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      {graft.parent_id && (
        <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 6px" }}>↩ En réponse</p>
      )}
      <p style={{ color: TEXT, fontSize: "15px", lineHeight: 1.55, margin: "0 0 8px", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
        {graft.content}
      </p>
      {graft.video_url && (
        <div style={{ borderRadius: "12px", overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}`, marginBottom: "8px" }}>
          <iframe src={graft.video_url} allowFullScreen loading="lazy" style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
        </div>
      )}
      <span style={{ color: TEXT2, fontSize: "13px" }}>{relativeTime(graft.created_at)}</span>
    </article>
  );
}

function PlaceholderTab({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "80px 20px" }}>
      <span style={{ fontSize: "48px" }}>{icon}</span>
      <p style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: 0 }}>{label}</p>
      <p style={{ color: TEXT2, fontSize: "15px", margin: 0, textAlign: "center", maxWidth: "280px", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function EmptyTab({ tab }: { tab: TabKey }) {
  const msgs: Record<TabKey, [string, string]> = {
    grafts:    ["Aucun graft",    "Tes publications apparaîtront ici."],
    reponses:  ["Aucune réponse", "Tes réponses à d'autres grafts apparaîtront ici."],
    medias:    ["Aucun média",    "Tes grafts avec vidéo apparaîtront ici."],
    approuves: ["Aucun approuvé", "Les grafts que tu as approuvés apparaîtront ici."],
  };
  const [label, desc] = msgs[tab];
  return <PlaceholderTab icon="📭" label={label} desc={desc} />;
}

function LoadingSkeleton() {
  return (
    <div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ padding: "14px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ height: "13px", width: "100%", background: "#0D0D0D", borderRadius: "6px", marginBottom: "8px" }} />
          <div style={{ height: "13px", width: `${60 + i * 10}%`, background: "#090909", borderRadius: "6px" }} />
        </div>
      ))}
    </div>
  );
}

// ── Edit Profile Modal ────────────────────────────────────────────────────────

function EditProfileModal({ profile, userId, exists, onClose, onSaved }: {
  profile: Profile; userId: string; exists: boolean; onClose: () => void; onSaved: (p: Profile) => void;
}) {
  const [form,   setForm]   = useState({ bio: profile.bio ?? "", ville: profile.ville ?? "" });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSave = async () => {
    setSaving(true); setError(null);
    const sb = createClient();
    const payload = { bio: form.bio.trim() || null, ville: form.ville.trim() || null };
    const { data, error: err } = exists
      ? await sb.from("profiles").update(payload).eq("id", userId).select().single()
      : await sb.from("profiles").insert({ ...payload, id: userId }).select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved(data as Profile);
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: BG, border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "12px 14px", color: TEXT, fontSize: "15px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" };
  const labelStyle: React.CSSProperties = { color: TEXT2, fontSize: "12px", fontWeight: 600, display: "block", marginBottom: "6px" };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(91,112,131,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "20px", width: "100%", maxWidth: "500px", overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${BORDER}` }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: TEXT, fontSize: "22px", cursor: "pointer", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}>×</button>
          <span style={{ color: TEXT, fontSize: "16px", fontWeight: 800 }}>Modifier mon identité</span>
          <button onClick={handleSave} disabled={saving} style={{ background: TEXT, color: BG, border: "none", borderRadius: "100px", padding: "7px 18px", fontSize: "14px", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
            {saving ? "…" : "Sauvegarder"}
          </button>
        </div>

        <div style={{ height: "90px", background: `linear-gradient(135deg, #050505 0%, ${RED}28 50%, ${GOLD}14 100%)`, position: "relative" }}>
          <div style={{ position: "absolute", bottom: "-32px", left: "20px", width: "64px", height: "64px", borderRadius: "50%", background: avatarGrad(profile.username || "?"), border: `3px solid ${GOLD}`, boxShadow: `0 0 0 1px ${GOLD}60`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "22px", fontWeight: 900 }}>
            {(profile.username || "?")[0]?.toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "48px 20px 24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>Ville</label>
            <input value={form.ville} onChange={set("ville")} placeholder="Paris, Alger, Lyon…" style={inputStyle} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
          </div>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Bio</label>
            <textarea value={form.bio} onChange={set("bio")} placeholder="Parle de toi…" rows={4} maxLength={280} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            <p style={{ color: TEXT3, fontSize: "12px", margin: "4px 0 0", textAlign: "right" }}>{form.bio.length}/280</p>
          </div>
          {error && (
            <div style={{ background: `${RED}15`, border: `1px solid ${RED}30`, borderRadius: "10px", padding: "10px 14px" }}>
              <p style={{ color: RED, fontSize: "13px", fontWeight: 600, margin: 0 }}>{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
