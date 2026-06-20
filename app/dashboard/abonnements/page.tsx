"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import BadgeVerifie from "@/components/BadgeVerifie";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";
const GREEN   = "#2ECC71";

type Tab     = "abonnements" | "abonnes" | "suggestions";
type Profile = { id: string; username: string; display_name: string | null; bio: string | null; verified?: boolean | null; ville?: string | null };

function avatarGrad(name: string) {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

// ── GrafterCard ───────────────────────────────────────────────────────────────

function GrafterCard({ profile, mutuel = false }: { profile: Profile; mutuel?: boolean }) {
  return (
    <div
      style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#070707")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <Link href={`/dashboard/profil/${profile.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
        <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: avatarGrad(profile.username), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px", fontWeight: 800, border: `2px solid ${BORDER}` }}>
          {(profile.display_name || profile.username)[0].toUpperCase()}
        </div>
      </Link>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Link href={`/dashboard/profil/${profile.username}`} style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
            <span style={{ color: TEXT, fontWeight: 700, fontSize: "14px" }}>{profile.display_name || profile.username}</span>
            <BadgeVerifie verified={profile.verified} />
            {mutuel && (
              <span style={{ fontSize: "10px", color: GREEN, background: `${GREEN}15`, border: `1px solid ${GREEN}30`, borderRadius: "100px", padding: "1px 6px", fontWeight: 700 }}>Mutuel</span>
            )}
          </div>
          <div style={{ color: TEXT2, fontSize: "12px", marginTop: "1px" }}>@{profile.username}</div>
          {profile.bio && (
            <div style={{ color: TEXT2, fontSize: "12px", marginTop: "4px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
              {profile.bio}
            </div>
          )}
          {profile.ville && (
            <div style={{ color: TEXT3, fontSize: "11px", marginTop: "3px" }}>📍 {profile.ville}</div>
          )}
        </Link>
      </div>

      <div style={{ flexShrink: 0 }}>
        <FollowButton targetUserId={profile.id} />
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ display: "flex", gap: "12px", padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: SURFACE, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "12px", width: "35%", background: SURFACE, borderRadius: "6px", marginBottom: "8px" }} />
            <div style={{ height: "10px", width: `${50+i*8}%`, background: "#0D0D0D", borderRadius: "6px", marginBottom: "6px" }} />
            <div style={{ height: "9px", width: "70%", background: "#090909", borderRadius: "6px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────

function Empty({ icon, label, desc, cta }: { icon: string; label: string; desc: string; cta?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "60px 20px", textAlign: "center" }}>
      <span style={{ fontSize: "42px" }}>{icon}</span>
      <p style={{ color: TEXT, fontSize: "18px", fontWeight: 900, margin: 0 }}>{label}</p>
      <p style={{ color: TEXT2, fontSize: "14px", margin: 0, maxWidth: "260px", lineHeight: 1.6 }}>{desc}</p>
      {cta}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AbonnementsPage() {
  const [userId,       setUserId]       = useState<string | null>(null);
  const [tab,          setTab]          = useState<Tab>("abonnements");
  const [abonnements,  setAbonnements]  = useState<Profile[]>([]);
  const [abonnes,      setAbonnes]      = useState<Profile[]>([]);
  const [suggestions,  setSuggestions]  = useState<Profile[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const [{ data: followingRows }, { data: followerRows }] = await Promise.all([
      sb.from("follows").select("following:profiles!follows_following_id_fkey(id,username,display_name,bio,verified,ville)").eq("follower_id", user.id).order("created_at", { ascending: false }).limit(100),
      sb.from("follows").select("follower:profiles!follows_follower_id_fkey(id,username,display_name,bio,verified,ville)").eq("following_id", user.id).order("created_at", { ascending: false }).limit(100),
    ]);

    const following = (followingRows ?? []).map((r: any) => r.following).filter(Boolean) as Profile[];
    const followers = (followerRows  ?? []).map((r: any) => r.follower).filter(Boolean)  as Profile[];

    setAbonnements(following);
    setAbonnes(followers);

    // Suggestions: followers of people I follow that I don't follow yet
    const followingIds = new Set(following.map(p => p.id));
    followingIds.add(user.id);

    const { data: suggestRows } = await sb
      .from("profiles")
      .select("id,username,display_name,bio,verified,ville")
      .not("id", "in", `(${[...followingIds].join(",")})`)
      .limit(20);

    setSuggestions((suggestRows ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const followingIds = new Set(abonnements.map(p => p.id));

  const filterList = (list: Profile[]) =>
    search.trim()
      ? list.filter(p =>
          (p.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          p.username.toLowerCase().includes(search.toLowerCase())
        )
      : list;

  const filteredAbonnements = filterList(abonnements);
  const filteredAbonnes     = filterList(abonnes);
  const filteredSuggestions = filterList(suggestions);

  const counts: Record<Tab, number> = {
    abonnements: abonnements.length,
    abonnes:     abonnes.length,
    suggestions: suggestions.length,
  };

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${RED}20`, border: `1px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>👥</div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Réseau</h1>
          </div>

          {/* Onglets */}
          <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}` }}>
            {([
              ["abonnements", "Abonnements"],
              ["abonnes",     "Abonnés"],
              ["suggestions", "Découvrir"],
            ] as [Tab, string][]).map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px 4px", background: "none", border: "none", borderBottom: `2px solid ${tab === t ? RED : "transparent"}`, color: tab === t ? TEXT : TEXT2, fontSize: "13px", fontWeight: tab === t ? 700 : 400, cursor: "pointer", transition: "all 0.12s", position: "relative" }}>
                {label}
                {counts[t] > 0 && (
                  <span style={{ marginLeft: "4px", background: tab === t ? RED : SURFACE, color: tab === t ? "#fff" : TEXT2, borderRadius: "100px", padding: "1px 5px", fontSize: "10px", fontWeight: 700, border: `1px solid ${BORDER}` }}>
                    {counts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div style={{ padding: "8px 16px" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "13px", pointerEvents: "none" }}>🔎</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filtrer par nom…"
                style={{ width: "100%", padding: "8px 14px 8px 32px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: TEXT2, cursor: "pointer", fontSize: "16px", lineHeight: 1 }}>×</button>
              )}
            </div>
          </div>
        </div>

        {/* Chargement */}
        {loading && <Skeleton />}

        {/* ── Onglet Abonnements ── */}
        {!loading && tab === "abonnements" && (
          filteredAbonnements.length === 0 ? (
            search
              ? <Empty icon="🔎" label="Aucun résultat" desc={`Aucun abonnement ne correspond à "${search}"`} />
              : <Empty icon="➕" label="Tu ne suis personne" desc="Découvre des Grafters et abonne-toi pour enrichir ton fil."
                  cta={<button onClick={() => setTab("suggestions")} style={{ marginTop: "4px", padding: "9px 20px", background: RED, color: "#fff", border: "none", borderRadius: "100px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>Découvrir des Grafters</button>}
                />
          ) : (
            <div>
              <div style={{ padding: "8px 16px 4px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{filteredAbonnements.length} abonnement{filteredAbonnements.length > 1 ? "s" : ""}</span>
              </div>
              {filteredAbonnements.map(p => {
                const mutuel = abonnes.some(a => a.id === p.id);
                return <GrafterCard key={p.id} profile={p} mutuel={mutuel} />;
              })}
            </div>
          )
        )}

        {/* ── Onglet Abonnés ── */}
        {!loading && tab === "abonnes" && (
          filteredAbonnes.length === 0 ? (
            search
              ? <Empty icon="🔎" label="Aucun résultat" desc={`Aucun abonné ne correspond à "${search}"`} />
              : <Empty icon="👥" label="Aucun abonné" desc="Publie des grafts et interagis pour attirer tes premiers abonnés." />
          ) : (
            <div>
              <div style={{ padding: "8px 16px 4px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{filteredAbonnes.length} abonné{filteredAbonnes.length > 1 ? "s" : ""}</span>
              </div>
              {filteredAbonnes.map(p => {
                const mutuel = followingIds.has(p.id);
                return <GrafterCard key={p.id} profile={p} mutuel={mutuel} />;
              })}
            </div>
          )
        )}

        {/* ── Onglet Suggestions ── */}
        {!loading && tab === "suggestions" && (
          filteredSuggestions.length === 0 ? (
            search
              ? <Empty icon="🔎" label="Aucun résultat" desc={`Aucune suggestion pour "${search}"`} />
              : <Empty icon="🌟" label="Tu suis tout le monde !" desc="Tu es déjà connecté à tous les Grafters disponibles." />
          ) : (
            <div>
              <div style={{ padding: "8px 16px 4px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Grafters à découvrir</span>
              </div>
              {filteredSuggestions.map(p => <GrafterCard key={p.id} profile={p} />)}
              <div style={{ padding: "16px", textAlign: "center" }}>
                <Link href="/dashboard/recherche" style={{ color: RED, fontWeight: 700, fontSize: "13px", textDecoration: "none" }}>
                  Rechercher d'autres Grafters →
                </Link>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
}
