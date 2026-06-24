"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

const INTERESTS = [
  { key: "Politique",     emoji: "🏛️" },
  { key: "Économie",      emoji: "💰" },
  { key: "Environnement", emoji: "🌿" },
  { key: "Culture",       emoji: "🎭" },
  { key: "Sport",         emoji: "⚽" },
  { key: "Local",         emoji: "📍" },
];

type SuggestedUser = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_founder: boolean | null;
};

async function saveProfile(body: Record<string, unknown>) {
  const text = await (await fetch("/api/profile/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, _upsert: true }),
  })).text();
  return JSON.parse(text);
}

export default function OnboardingPage() {
  const router   = useRouter();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [step,      setStep]      = useState(1);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [display,   setDisplay]   = useState("…");
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);

  // Step 1
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio,       setBio]       = useState("");
  const [ville,     setVille]     = useState("");

  // Step 2
  const [selected,  setSelected]  = useState<string[]>([]);

  // Step 3
  const [suggested, setSuggested] = useState<SuggestedUser[]>([]);
  const [followed,  setFollowed]  = useState<string[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(true);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/connexion"); return; }
      setUserId(user.id);

      const meta = user.user_metadata;
      setDisplay(meta?.display_name ?? meta?.username ?? "Grafter");

      const { data: prof } = await supabase
        .from("profiles")
        .select("onboarding_completed, avatar_url, bio, city")
        .eq("id", user.id)
        .maybeSingle();

      if (prof?.onboarding_completed) { router.push("/dashboard"); return; }
      if (prof?.avatar_url) setAvatarUrl(prof.avatar_url);
      if (prof?.bio)        setBio(prof.bio);
      if (prof?.city)       setVille(prof.city);

      // Suggestions
      setLoadingSugg(true);
      let { data: sugg } = await supabase
        .from("profiles")
        .select("id, username, display_name, bio, avatar_url, is_founder")
        .eq("is_founder", true)
        .neq("id", user.id)
        .limit(5);

      if (!sugg?.length) {
        const { data: fallback } = await supabase
          .from("profiles")
          .select("id, username, display_name, bio, avatar_url, is_founder")
          .neq("id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        sugg = fallback ?? [];
      }
      setSuggested((sugg ?? []) as SuggestedUser[]);
      setLoadingSugg(false);
    };
    init();
  }, [router]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = "";
    setUploading(true);
    const supabase = createClient();
    const ext  = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(publicUrl);
      await saveProfile({ avatar_url: publicUrl });
    }
    setUploading(false);
  };

  const goStep2 = async () => {
    setSaving(true);
    await saveProfile({ bio: bio.trim() || null, city: ville.trim() || null });
    setSaving(false);
    setStep(2);
  };

  const goStep3 = async () => {
    setSaving(true);
    await saveProfile({ interests: selected });
    setSaving(false);
    setStep(3);
  };

  const finish = async () => {
    setSaving(true);
    const supabase = createClient();
    if (followed.length > 0 && userId) {
      const rows = followed.map(id => ({ follower_id: userId, following_id: id }));
      await supabase.from("follows").upsert(rows, { onConflict: "follower_id,following_id" });
    }
    await saveProfile({ onboarding_completed: true });
    setSaving(false);
    router.push("/dashboard");
  };

  const toggleInterest = (key: string) =>
    setSelected(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);

  const toggleFollow = (id: string) =>
    setFollowed(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id]);

  const avatarLetter = display[0]?.toUpperCase() ?? "G";

  // ── Shared styles ────────────────────────────────────────────────────────────
  const btnPrimary: React.CSSProperties = {
    background: RED, border: "none", borderRadius: "100px",
    color: "#fff", fontSize: "15px", fontWeight: 800,
    padding: "13px 28px", cursor: saving ? "not-allowed" : "pointer",
    opacity: saving ? 0.7 : 1, transition: "opacity 0.15s",
    boxShadow: `0 4px 18px ${RED}50`,
  };
  const btnOutline: React.CSSProperties = {
    background: "transparent", border: `1px solid ${BORDER}`,
    borderRadius: "100px", color: TEXT2, fontSize: "14px",
    fontWeight: 600, padding: "12px 20px", cursor: "pointer",
  };

  // ── Progress bar ─────────────────────────────────────────────────────────────
  const Progress = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: "36px" }}>
      {[1, 2, 3].map((s, i) => (
        <div key={s} style={{ display: "flex", alignItems: "center" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "13px", fontWeight: 800, flexShrink: 0,
            background: s < step ? RED : s === step ? `${RED}22` : SURF,
            border: s <= step ? `2px solid ${RED}` : `2px solid ${BORDER}`,
            color: s < step ? "#fff" : s === step ? RED : TEXT2,
            transition: "all 0.25s",
          }}>
            {s < step ? "✓" : s}
          </div>
          {i < 2 && (
            <div style={{ width: "60px", height: "2px", background: s < step ? RED : BORDER, transition: "background 0.25s", flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Step 1 — Profil ───────────────────────────────────────────────────────────
  const Step1 = () => (
    <div>
      <h1 style={{ color: TEXT, fontSize: "22px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.4px" }}>Personnalise ton profil</h1>
      <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 28px", lineHeight: 1.6 }}>Les autres Grafters pourront te découvrir plus facilement.</p>

      {/* Avatar */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{ position: "relative", width: "96px", height: "96px", borderRadius: "50%", border: `3px dashed ${BORDER}`, background: "transparent", cursor: uploading ? "wait" : "pointer", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 0, transition: "border-color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
              <span style={{ color: "#fff", fontSize: "28px", fontWeight: 900, lineHeight: 1 }}>{avatarLetter}</span>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "10px", fontWeight: 600 }}>+ Photo</span>
            </div>
          )}
          {uploading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "24px", height: "24px", border: `2px solid ${RED}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
      </div>
      {avatarUrl && (
        <p style={{ color: TEXT2, fontSize: "12px", textAlign: "center", margin: "-16px 0 20px" }}>
          <button onClick={() => fileRef.current?.click()} style={{ background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: "12px", fontWeight: 600, padding: 0 }}>Changer la photo</button>
        </p>
      )}

      {/* Bio */}
      <div style={{ marginBottom: "16px" }}>
        <label style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Biographie</label>
        <div style={{ position: "relative" }}>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value.slice(0, 300))}
            placeholder="Qui es-tu ? Raconte-toi en quelques mots…"
            rows={3}
            style={{ width: "100%", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "12px 14px", color: TEXT, fontSize: "14px", outline: "none", resize: "none", fontFamily: "inherit", boxSizing: "border-box", lineHeight: 1.6, transition: "border-color 0.15s" }}
            onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
          <span style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "11px", color: TEXT2 }}>{bio.length}/300</span>
        </div>
      </div>

      {/* Ville */}
      <div style={{ marginBottom: "32px" }}>
        <label style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Ville</label>
        <input
          value={ville}
          onChange={e => setVille(e.target.value.slice(0, 100))}
          placeholder="Paris, Lyon, Marseille…"
          style={{ width: "100%", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "12px 18px", color: TEXT, fontSize: "14px", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color 0.15s" }}
          onFocus={e => (e.currentTarget.style.borderColor = `${GOLD}60`)}
          onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button style={btnOutline} onClick={goStep2}>Passer</button>
        <button style={btnPrimary} onClick={goStep2} disabled={saving}>
          {saving ? "Enregistrement…" : "Continuer →"}
        </button>
      </div>
    </div>
  );

  // ── Step 2 — Intérêts ─────────────────────────────────────────────────────────
  const Step2 = () => (
    <div>
      <h1 style={{ color: TEXT, fontSize: "22px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.4px" }}>Tes centres d'intérêt</h1>
      <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 28px", lineHeight: 1.6 }}>Personnalise ton fil pour voir ce qui compte vraiment pour toi.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "32px" }}>
        {INTERESTS.map(({ key, emoji }) => {
          const on = selected.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleInterest(key)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "14px 16px", borderRadius: "14px", cursor: "pointer",
                background: on ? `${RED}12` : SURF,
                border: `2px solid ${on ? RED : BORDER}`,
                color: on ? TEXT : TEXT2,
                fontFamily: "inherit", fontSize: "15px", fontWeight: on ? 700 : 500,
                transition: "all 0.15s", textAlign: "left",
              }}
              onMouseEnter={e => { if (!on) e.currentTarget.style.borderColor = `${BORDER}`; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.borderColor = BORDER; }}
            >
              <span style={{ fontSize: "20px", lineHeight: 1, flexShrink: 0 }}>{emoji}</span>
              <span>{key}</span>
              {on && <span style={{ marginLeft: "auto", color: RED, fontSize: "16px", flexShrink: 0 }}>✓</span>}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <p style={{ color: TEXT2, fontSize: "12px", textAlign: "center", marginBottom: "16px" }}>
          {selected.length} centre{selected.length > 1 ? "s" : ""} d'intérêt sélectionné{selected.length > 1 ? "s" : ""}
        </p>
      )}

      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button style={btnOutline} onClick={goStep3}>Passer</button>
        <button style={btnPrimary} onClick={goStep3} disabled={saving}>
          {saving ? "Enregistrement…" : "Continuer →"}
        </button>
      </div>
    </div>
  );

  // ── Step 3 — Suggestions ──────────────────────────────────────────────────────
  const Step3 = () => (
    <div>
      <h1 style={{ color: TEXT, fontSize: "22px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.4px" }}>Suis des Grafters</h1>
      <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>Des Grafters actifs qui pourraient t'intéresser.</p>

      {loadingSugg ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
          <div style={{ width: "28px", height: "28px", border: `2px solid ${RED}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : suggested.length === 0 ? (
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "28px", textAlign: "center", marginBottom: "28px" }}>
          <p style={{ color: TEXT2, fontSize: "14px", margin: 0 }}>Aucune suggestion pour l'instant.<br />Tu pourras découvrir des Grafters dans Explorer.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "28px" }}>
          {suggested.map(u => {
            const isF = followed.includes(u.id);
            const letter = (u.display_name ?? u.username ?? "G")[0]?.toUpperCase();
            return (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", transition: "border-color 0.12s" }}>
                {/* Avatar */}
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg,${RED} 0%,#8B1A15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 900, overflow: "hidden" }}>
                  {u.avatar_url ? <img src={u.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : letter}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ color: TEXT, fontSize: "14px", fontWeight: 700 }}>{u.display_name ?? u.username}</span>
                    {u.is_founder && (
                      <span style={{ fontSize: "10px", color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: "100px", padding: "1px 6px", fontWeight: 700 }}>⭐ Fondateur</span>
                    )}
                  </div>
                  <p style={{ color: TEXT2, fontSize: "12px", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{u.username}</p>
                  {u.bio && <p style={{ color: TEXT2, fontSize: "12px", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.bio}</p>}
                </div>
                {/* Follow button */}
                <button
                  onClick={() => toggleFollow(u.id)}
                  style={{
                    background: isF ? "transparent" : TEXT, color: isF ? TEXT2 : BG,
                    border: `1px solid ${isF ? BORDER : TEXT}`,
                    borderRadius: "100px", padding: "7px 16px",
                    fontSize: "13px", fontWeight: 800, cursor: "pointer",
                    flexShrink: 0, whiteSpace: "nowrap", transition: "all 0.15s",
                  }}
                >
                  {isF ? "✓ Suivi" : "Suivre"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button style={{ ...btnPrimary, width: "100%", textAlign: "center" }} onClick={finish} disabled={saving}>
        {saving ? "Finalisation…" : followed.length > 0 ? `Terminer (${followed.length} abonnement${followed.length > 1 ? "s" : ""})` : "Terminer →"}
      </button>
      <p style={{ textAlign: "center", marginTop: "12px" }}>
        <button style={{ background: "none", border: "none", color: TEXT2, fontSize: "13px", cursor: "pointer", padding: 0 }} onClick={finish}>
          Passer cette étape
        </button>
      </p>
    </div>
  );

  return (
    <>
      {/* CSS animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Full-screen overlay — covers sidebar + bottom nav */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: BG,
        display: "flex", flexDirection: "column", alignItems: "center",
        overflowY: "auto", padding: "24px 16px 80px",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px", alignSelf: "flex-start", maxWidth: "520px", width: "100%" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 900, color: "#fff", flexShrink: 0 }}>S</div>
          <div>
            <span style={{ color: TEXT, fontSize: "13px", fontWeight: 900, letterSpacing: "1.5px", display: "block", lineHeight: 1 }}>STENOGRAFT</span>
            <span style={{ color: GOLD, fontSize: "9px", fontWeight: 700, letterSpacing: "3px" }}>SOUVERAIN</span>
          </div>
        </div>

        {/* Card */}
        <div style={{
          width: "100%", maxWidth: "520px",
          background: SURF, border: `1px solid ${BORDER}`,
          borderRadius: "20px", padding: "32px 28px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
          animation: "fadeIn 0.3s ease",
        }}>
          <Progress />
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 />}
          {step === 3 && <Step3 />}
        </div>

        {/* Step hint */}
        <p style={{ color: TEXT2, fontSize: "12px", marginTop: "20px" }}>
          Étape {step} sur 3 · Tu pourras modifier tout ça dans Paramètres
        </p>
      </div>
    </>
  );
}
