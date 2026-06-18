"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const RED = "#C8312A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const BG = "#0F1119";
const SURFACE = "#161926";
const BORDER = "#1F2436";

const USERNAME = "Yahia";

type Profile = {
  id?: string;
  username: string;
  bio: string | null;
  ville: string | null;
};

export default function ProfilPage() {
  const [profile, setProfile] = useState<Profile>({ username: USERNAME, bio: null, ville: null });
  const [graftCount, setGraftCount] = useState<number | null>(null);
  const [communityCount, setCommunityCount] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();

    // Grafts count
    const { count } = await supabase
      .from("grafts")
      .select("*", { count: "exact", head: true })
      .eq("author_name", USERNAME);
    setGraftCount(count ?? 0);

    // Communities count (from localStorage)
    try {
      const ids = JSON.parse(localStorage.getItem("sg_my_communities") ?? "[]");
      setCommunityCount(ids.length);
    } catch { setCommunityCount(0); }

    // Profile
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", USERNAME)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
      setProfileExists(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaved = (p: Profile) => {
    setProfile(p);
    setProfileExists(true);
    setEditing(false);
  };

  const initials = profile.username.slice(0, 2).toUpperCase();

  if (loading) {
    return <div style={{ padding: "44px 52px" }}><p style={{ color: "#2A2F45", fontSize: "14px" }}>Chargement…</p></div>;
  }

  return (
    <div style={{ padding: "44px 52px", maxWidth: "720px" }}>

      {/* Profile card */}
      <div style={{
        background: SURFACE, border: `1px solid ${BORDER}`,
        borderRadius: "20px", overflow: "hidden",
        boxShadow: `0 8px 40px rgba(0,0,0,0.3)`,
        marginBottom: "24px",
      }}>
        {/* Banner */}
        <div style={{
          height: "100px",
          background: `linear-gradient(135deg, #0A0C12 0%, ${RED}25 40%, ${GOLD}15 100%)`,
          borderBottom: `1px solid ${BORDER}`,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            backgroundImage: `radial-gradient(circle at 30% 60%, ${RED}20 0%, transparent 50%), radial-gradient(circle at 75% 30%, ${GOLD}12 0%, transparent 40%)`,
          }} />
          {/* Edit button */}
          <button
            onClick={() => setEditing(true)}
            style={{
              position: "absolute", top: "14px", right: "16px",
              background: "rgba(0,0,0,0.4)", color: GOLD,
              border: `1px solid ${GOLD}40`, borderRadius: "8px",
              padding: "6px 14px", fontSize: "12px", fontWeight: 700,
              cursor: "pointer", backdropFilter: "blur(8px)",
              letterSpacing: "0.3px",
            }}
          >
            Modifier le profil
          </button>
        </div>

        {/* Avatar + info */}
        <div style={{ padding: "0 28px 28px", position: "relative" }}>
          {/* Avatar */}
          <div style={{
            width: "80px", height: "80px", borderRadius: "22px",
            background: `linear-gradient(135deg, ${RED} 0%, #6B1410 100%)`,
            border: `3px solid ${SURFACE}`,
            boxShadow: `0 0 0 1px ${GOLD}40, 0 8px 24px rgba(200,49,42,0.4)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 900, color: GOLD_LIGHT,
            position: "relative", top: "-40px", marginBottom: "-20px",
            letterSpacing: "-1px",
          }}>
            {initials}
          </div>

          {/* Name + badge */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <h1 style={{ color: "#ECEAE2", fontSize: "22px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>
                {profile.username}
              </h1>
              <span style={{
                background: `linear-gradient(135deg, ${RED}30 0%, ${GOLD}20 100%)`,
                color: GOLD, fontSize: "10px", fontWeight: 800,
                padding: "3px 9px", borderRadius: "20px",
                border: `1px solid ${GOLD}30`, letterSpacing: "1px",
              }}>
                MEMBRE
              </span>
            </div>
            {profile.ville && (
              <p style={{ color: "#5A6076", fontSize: "13px", margin: 0 }}>
                📍 {profile.ville}
              </p>
            )}
          </div>

          {/* Bio */}
          {profile.bio ? (
            <p style={{
              color: "#878DA0", fontSize: "14px", lineHeight: 1.65,
              margin: "0 0 20px", maxWidth: "480px",
            }}>
              {profile.bio}
            </p>
          ) : (
            <p style={{ color: "#2A2F45", fontSize: "14px", fontStyle: "italic", margin: "0 0 20px", cursor: "pointer" }} onClick={() => setEditing(true)}>
              Ajoute une bio…
            </p>
          )}

          {/* Gold divider */}
          <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}30, transparent)`, marginBottom: "20px" }} />

          {/* Stats row */}
          <div style={{ display: "flex", gap: "32px" }}>
            <Stat value={graftCount ?? "—"} label="Grafts" accent={RED} />
            <div style={{ width: "1px", background: BORDER }} />
            <Stat value={communityCount ?? "—"} label="Communautés" accent={GOLD} />
            <div style={{ width: "1px", background: BORDER }} />
            <Stat value="0" label="Abonnés" accent={GOLD} />
          </div>
        </div>
      </div>

      {/* Recent grafts section */}
      <RecentGrafts />

      {editing && (
        <EditProfileModal
          profile={profile}
          exists={profileExists}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function Stat({ value, label, accent }: { value: string | number | null; label: string; accent: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: accent, fontSize: "22px", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.5px" }}>
        {value ?? "—"}
      </p>
      <p style={{ color: "#3A4060", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>
        {label}
      </p>
    </div>
  );
}

function RecentGrafts() {
  const [grafts, setGrafts] = useState<{ id: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    createClient()
      .from("grafts")
      .select("id, content, created_at")
      .eq("author_name", USERNAME)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => setGrafts(data ?? []));
  }, []);

  if (grafts.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <h2 style={{ color: GOLD, fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", margin: 0 }}>
          Grafts récents
        </h2>
        <div style={{ flex: 1, height: "1px", background: `linear-gradient(90deg, ${GOLD}30, transparent)` }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {grafts.map(g => {
          const date = new Date(g.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
          return (
            <div key={g.id} style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px 18px" }}>
              <p style={{ color: "#C8CADA", fontSize: "14px", lineHeight: 1.6, margin: "0 0 8px", whiteSpace: "pre-wrap" }}>{g.content}</p>
              <p style={{ color: "#2A2F45", fontSize: "11px", margin: 0 }}>{date}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditProfileModal({ profile, exists, onClose, onSaved }: {
  profile: Profile; exists: boolean;
  onClose: () => void; onSaved: (p: Profile) => void;
}) {
  const [form, setForm] = useState({ bio: profile.bio ?? "", ville: profile.ville ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const payload = { username: USERNAME, bio: form.bio.trim() || null, ville: form.ville.trim() || null };

    const { data, error: err } = exists
      ? await supabase.from("profiles").update(payload).eq("username", USERNAME).select().single()
      : await supabase.from("profiles").insert(payload).select().single();

    setLoading(false);
    if (err) { setError(err.message); return; }
    onSaved(data as Profile);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: BG, border: `1px solid ${BORDER}`,
    borderRadius: "10px", padding: "11px 14px",
    color: "#ECEAE2", fontSize: "14px", outline: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    color: GOLD, fontSize: "10px", fontWeight: 700,
    letterSpacing: "1.2px", textTransform: "uppercase",
    display: "block", marginBottom: "7px", opacity: 0.85,
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD}`, borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "480px", boxShadow: `0 24px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,168,76,0.07)` }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h2 style={{ color: "#ECEAE2", fontSize: "18px", fontWeight: 900, margin: "0 0 4px" }}>Modifier le profil</h2>
            <p style={{ color: "#2A2F45", fontSize: "13px", margin: 0 }}>Informations visibles publiquement</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#5A6076", fontSize: "20px", cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}30, transparent)`, marginBottom: "24px" }} />

        {/* Avatar preview */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
          <div style={{
            width: "56px", height: "56px", borderRadius: "14px",
            background: `linear-gradient(135deg, ${RED} 0%, #6B1410 100%)`,
            boxShadow: `0 0 0 2px ${GOLD}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", fontWeight: 900, color: GOLD_LIGHT, flexShrink: 0,
          }}>
            {USERNAME.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ color: "#ECEAE2", fontSize: "15px", fontWeight: 700, margin: "0 0 2px" }}>{USERNAME}</p>
            <p style={{ color: "#2A2F45", fontSize: "12px", margin: 0 }}>Avatar généré automatiquement</p>
          </div>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Ville</label>
          <input
            value={form.ville}
            onChange={set("ville")}
            placeholder="Ex: Paris, Lyon, Alger…"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={form.bio}
            onChange={set("bio")}
            placeholder="Parle de toi en quelques mots…"
            rows={4}
            maxLength={280}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }}
            onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
          <p style={{ color: "#2A2F45", fontSize: "11px", margin: "5px 0 0", textAlign: "right" }}>
            {form.bio.length} / 280
          </p>
        </div>

        {error && (
          <div style={{ background: `${RED}15`, border: `1px solid ${RED}35`, borderRadius: "8px", padding: "10px 14px", marginBottom: "14px" }}>
            <p style={{ color: RED, fontSize: "12px", fontWeight: 600, margin: 0 }}>{error}</p>
            {error.includes("profiles") && (
              <p style={{ color: "#5A6076", fontSize: "11px", margin: "4px 0 0" }}>
                Crée d'abord la table profiles dans Supabase.
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", color: "#5A6076", border: `1px solid ${BORDER}`, borderRadius: "10px", padding: "10px 18px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
              color: "#fff", border: `1px solid rgba(201,168,76,0.2)`,
              borderRadius: "10px", padding: "10px 22px",
              fontSize: "14px", fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: `0 4px 16px rgba(200,49,42,0.3)`,
              opacity: loading ? 0.7 : 1,
              transition: "all 0.15s",
            }}
          >
            {loading ? "Enregistrement…" : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
}
