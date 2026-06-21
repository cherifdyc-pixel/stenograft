"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const RED    = "#E0492F";
const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

// Official accounts we want to suggest — loaded from DB by username
const SUGGESTED_USERNAMES = ["stenograft", "veilleur", "registre"];

type SuggestedProfile = { id: string; username: string; display_name: string | null; bio: string | null };

export default function OnboardingPage() {
  const [step,        setStep]        = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [bio,         setBio]         = useState("");
  const [followed,    setFollowed]    = useState<string[]>([]);   // real UUIDs
  const [suggested,   setSuggested]   = useState<SuggestedProfile[]>([]);
  const [firstGraft,  setFirstGraft]  = useState("");
  const [loading,     setLoading]     = useState(false);
  const router = useRouter();

  const progress = Math.round((step / 3) * 100);

  // Load real suggested profiles from DB
  useEffect(() => {
    createClient()
      .from("profiles")
      .select("id, username, display_name, bio")
      .in("username", SUGGESTED_USERNAMES)
      .then(({ data }) => { if (data) setSuggested(data as SuggestedProfile[]); });
  }, []);

  // ── Étape 1 — Profil ─────────────────────────────────────────────────────────

  const saveProfile = async () => {
    if (!displayName.trim()) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const username = user.user_metadata?.username;
      await supabase.from("profiles").upsert({
        id: user.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        ...(username ? { username } : {}),
      });
    }
    setLoading(false);
    setStep(2);
  };

  // ── Étape 2 — Suivre ─────────────────────────────────────────────────────────

  const toggleFollow = (id: string) =>
    setFollowed(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const saveFollowsAndContinue = async () => {
    if (followed.length > 0) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const rows = followed.map(id => ({ follower_id: user.id, following_id: id }));
        await supabase.from("follows").upsert(rows, { onConflict: "follower_id,following_id" });
      }
    }
    setStep(3);
  };

  // ── Étape 3 — Premier graft ───────────────────────────────────────────────────

  const publishGraft = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && firstGraft.trim()) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      const author_name =
        profile?.username ??
        user.user_metadata?.username ??
        user.email?.split("@")[0] ??
        "Grafter";

      await supabase.from("grafts").insert({
        content: firstGraft.trim(),
        author_name,
        video_url: null,
        user_id: user.id,
      });
    }

    if (user) {
      await supabase.from("profiles").upsert({ id: user.id, onboarded: true });
    }

    setLoading(false);
    router.push("/dashboard");
  };

  const skip = () => router.push("/dashboard");

  // ── Styles partagés ──────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "13px 16px", borderRadius: "10px",
    background: BG, border: `1px solid ${BORDER}`, color: TEXT,
    fontSize: "15px", outline: "none", boxSizing: "border-box",
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "border-color 0.15s",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "14px", borderRadius: "12px",
    background: RED, color: "#fff", border: "none",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
    boxShadow: `0 4px 20px ${RED}40`, transition: "opacity 0.15s",
  };

  const btnGhost: React.CSSProperties = {
    width: "100%", padding: "10px", background: "none",
    border: "none", color: TEXT2, fontSize: "13px",
    cursor: "pointer", marginTop: "8px",
  };

  return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>

        {/* ── Header + Progress ── */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 900, color: "#fff" }}>S</div>
            <span style={{ fontSize: "16px", fontWeight: 900, color: TEXT, letterSpacing: "1px" }}>STENOGRAFT</span>
          </div>
          <div style={{ fontSize: "13px", color: TEXT2, marginBottom: "14px" }}>Étape {step} sur 3</div>
          <div style={{ height: "3px", background: BORDER, borderRadius: "2px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: RED, borderRadius: "2px", transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)" }} />
          </div>
        </div>

        {/* ── Étape 1 — Profil ── */}
        {step === 1 && (
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: "16px", padding: "32px 28px" }}>
            <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.3px" }}>Qui êtes-vous ?</h2>
            <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 24px" }}>Donnez un visage à votre parole.</p>

            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Nom d'affichage"
              autoFocus
              autoComplete="off"
              style={{ ...inputStyle, marginBottom: "12px" }}
              onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Une phrase pour vous présenter (optionnel)"
              rows={3}
              style={{ ...inputStyle, resize: "none", marginBottom: "20px" }}
              onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />

            <button
              onClick={saveProfile}
              disabled={!displayName.trim() || loading}
              style={{ ...btnPrimary, opacity: (!displayName.trim() || loading) ? 0.45 : 1, cursor: (!displayName.trim() || loading) ? "not-allowed" : "pointer" }}
            >
              {loading ? "Enregistrement…" : "Continuer →"}
            </button>
            <button onClick={skip} style={btnGhost}>Passer l'onboarding</button>
          </div>
        )}

        {/* ── Étape 2 — Suivre ── */}
        {step === 2 && (
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: "16px", padding: "32px 28px" }}>
            <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.3px" }}>Premiers Grafters</h2>
            <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 20px" }}>Suivez pour enrichir votre fil.</p>

            {suggested.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: TEXT2, fontSize: "13px" }}>
                Aucun compte officiel disponible pour l'instant.
              </div>
            ) : suggested.map(s => {
              const isFollowed = followed.includes(s.id);
              const initials = (s.display_name ?? s.username).split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 0", borderBottom: `1px solid ${BORDER}` }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 800, color: "#fff", flexShrink: 0, boxShadow: `0 2px 10px ${RED}40` }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: TEXT, fontWeight: 700, fontSize: "14px" }}>{s.display_name ?? s.username}</div>
                    <div style={{ color: TEXT2, fontSize: "12px", marginTop: "2px" }}>@{s.username}</div>
                    {s.bio && <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>{s.bio}</div>}
                  </div>
                  <button
                    onClick={() => toggleFollow(s.id)}
                    style={{
                      padding: "7px 18px", borderRadius: "20px", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                      background: isFollowed ? "transparent" : RED,
                      color: isFollowed ? TEXT2 : "#fff",
                      border: isFollowed ? `1px solid ${BORDER}` : "none",
                      boxShadow: isFollowed ? "none" : `0 2px 10px ${RED}35`,
                    }}
                  >
                    {isFollowed ? "✓ Suivi" : "Suivre"}
                  </button>
                </div>
              );
            })}

            <button onClick={saveFollowsAndContinue} style={{ ...btnPrimary, marginTop: "20px" }}>Continuer →</button>
            <button onClick={skip} style={btnGhost}>Passer cette étape</button>
          </div>
        )}

        {/* ── Étape 3 — Premier graft ── */}
        {step === 3 && (
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderTop: `2px solid ${RED}`, borderRadius: "16px", padding: "32px 28px" }}>
            <h2 style={{ color: TEXT, fontSize: "20px", fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.3px" }}>Votre premier graft</h2>
            <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 20px" }}>La parole est tenue. Prenez-la.</p>

            <textarea
              value={firstGraft}
              onChange={e => setFirstGraft(e.target.value.slice(0, 280))}
              placeholder="Ce que vous pensez, ce que vous observez, ce que vous voulez dire…"
              rows={5}
              autoFocus
              style={{ ...inputStyle, resize: "none", lineHeight: 1.6, marginBottom: "8px" }}
              onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
              onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
            />
            <div style={{ textAlign: "right", color: firstGraft.length > 250 ? RED : TEXT2, fontSize: "12px", marginBottom: "18px" }}>
              {firstGraft.length} / 280
            </div>

            <button onClick={publishGraft} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Publication…" : firstGraft.trim() ? "Greffer et entrer 🎯" : "Entrer sans greffer"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
