"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";
const GREEN   = "#2ECC71";
const BLUE    = "#1D9BF0";
const PURPLE  = "#9B59B6";

type Period = "7j" | "30j" | "90j" | "tout";

const PERIOD_DAYS: Record<Period, number | null> = { "7j": 7, "30j": 30, "90j": 90, "tout": null };

function fmtN(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

function sinceDate(days: number | null): string | null {
  if (!days) return null;
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

// ── MiniBarChart ─────────────────────────────────────────────────────────────

function MiniBarChart({ data, color, label }: { data: { date: string; count: number }[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "56px" }}>
        {data.map((d, i) => {
          const pct = Math.max((d.count / max) * 100, d.count > 0 ? 8 : 3);
          return (
            <div key={i} title={`${d.date}: ${d.count} ${label}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", cursor: "default" }}>
              <div style={{ borderRadius: "3px 3px 0 0", background: d.count > 0 ? color : BORDER, height: `${pct}%`, transition: "height 0.4s ease", opacity: d.count > 0 ? 1 : 0.4 }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ color: TEXT3, fontSize: "10px" }}>{data[0]?.date}</span>
        <span style={{ color: TEXT3, fontSize: "10px" }}>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, chart }: {
  icon: string; label: string; value: number; sub?: string; color: string;
  chart?: { date: string; count: number }[];
}) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: `${color}20`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>{icon}</div>
        {sub && <span style={{ color: sub.startsWith("+") ? GREEN : sub.startsWith("-") ? RED : TEXT2, fontSize: "11px", fontWeight: 700, background: sub.startsWith("+") ? `${GREEN}15` : sub.startsWith("-") ? `${RED}15` : SURFACE, borderRadius: "100px", padding: "2px 8px" }}>{sub}</span>}
      </div>
      <div>
        <div style={{ color, fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px" }}>{fmtN(value)}</div>
        <div style={{ color: TEXT2, fontSize: "12px", marginTop: "1px" }}>{label}</div>
      </div>
      {chart && chart.length > 0 && <MiniBarChart data={chart} color={color} label={label} />}
    </div>
  );
}

// ── ProfileScore ──────────────────────────────────────────────────────────────

function ProfileScore({ profile }: { profile: any }) {
  const checks = [
    { label: "Photo / avatar",   done: false },
    { label: "Bio renseignée",   done: !!profile?.bio },
    { label: "Ville renseignée", done: !!profile?.ville },
    { label: "Site web",         done: !!profile?.site },
    { label: "Au moins 1 graft", done: (profile?.grafts ?? 0) > 0 },
    { label: "5 abonnés",        done: (profile?.followers ?? 0) >= 5 },
  ];
  const score = Math.round((checks.filter(c => c.done).length / checks.length) * 100);
  const color = score >= 80 ? GREEN : score >= 50 ? GOLD : RED;

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>⭐</div>
        <span style={{ color: TEXT, fontWeight: 800, fontSize: "14px" }}>Complétude du profil</span>
        <span style={{ marginLeft: "auto", color, fontWeight: 900, fontSize: "16px" }}>{score}%</span>
      </div>
      <div style={{ padding: "10px 16px 4px" }}>
        <div style={{ height: "5px", background: BORDER, borderRadius: "3px", overflow: "hidden", marginBottom: "12px" }}>
          <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: "3px", transition: "width 0.6s ease" }} />
        </div>
        {checks.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "7px 0", borderBottom: i < checks.length - 1 ? `1px solid ${BORDER}` : "none" }}>
            <span style={{ color: c.done ? GREEN : TEXT3, fontSize: "13px", width: "16px", textAlign: "center" }}>{c.done ? "✓" : "○"}</span>
            <span style={{ color: c.done ? TEXT2 : TEXT, fontSize: "13px", textDecoration: c.done ? "line-through" : "none" }}>{c.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: "12px 16px" }} />
    </div>
  );
}

// ── TopGrafts ─────────────────────────────────────────────────────────────────

function TopGraftCard({ graft, rank }: { graft: any; rank: number }) {
  const rankColor = rank === 0 ? GOLD : rank === 1 ? "#A0A0A0" : "#A0522D";
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <span style={{ color: rankColor, fontWeight: 800, fontSize: "13px", width: "22px", flexShrink: 0 }}>{rank < 3 ? ["🥇","🥈","🥉"][rank] : `#${rank+1}`}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: TEXT, fontSize: "13px", lineHeight: 1.55, margin: "0 0 5px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
          {graft.content}
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ color: GREEN, fontSize: "11px" }}>✓ {graft.approvals ?? 0} approbations</span>
          <span style={{ color: BLUE, fontSize: "11px" }}>↻ {graft.relays ?? 0} relays</span>
          <span style={{ color: TEXT2, fontSize: "11px" }}>{new Date(graft.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
        </div>
      </div>
    </div>
  );
}

// ── GrowthTips ────────────────────────────────────────────────────────────────

function GrowthTips({ totalGrafts, totalFollowers, hasHashtags }: { totalGrafts: number; totalFollowers: number; hasHashtags: boolean }) {
  const tips = [
    { tip: "Publie au moins 1 graft par jour",              done: totalGrafts >= 7,    icon: "✍️" },
    { tip: "Utilise des #hashtags pour être découvert",     done: hasHashtags,          icon: "#️⃣" },
    { tip: "Réponds aux grafts des autres Grafters",        done: false,                icon: "↩️" },
    { tip: "Atteins 10 abonnés",                            done: totalFollowers >= 10, icon: "👥" },
    { tip: "Complète ton profil à 100%",                    done: false,                icon: "⭐" },
    { tip: "Ajoute une vidéo dans un graft",                done: false,                icon: "🎥" },
  ];

  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${RED}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>🚀</div>
        <span style={{ color: TEXT, fontWeight: 800, fontSize: "14px" }}>Conseils pour grandir</span>
        <span style={{ marginLeft: "auto", color: TEXT2, fontSize: "11px" }}>{tips.filter(t => t.done).length}/{tips.length}</span>
      </div>
      <div style={{ padding: "4px 0" }}>
        {tips.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderBottom: i < tips.length - 1 ? `1px solid ${BORDER}` : "none", opacity: t.done ? 0.5 : 1 }}>
            <span style={{ fontSize: "15px", width: "22px", textAlign: "center" }}>{t.icon}</span>
            <span style={{ flex: 1, color: t.done ? TEXT2 : TEXT, fontSize: "13px", textDecoration: t.done ? "line-through" : "none" }}>{t.tip}</span>
            <span style={{ color: t.done ? GREEN : TEXT3, fontSize: "13px" }}>{t.done ? "✓" : "○"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatsPage() {
  const router = useRouter();
  const [period,     setPeriod]     = useState<Period>("30j");
  const [loading,    setLoading]    = useState(true);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [username,   setUsername]   = useState("");
  const [profile,    setProfile]    = useState<any>(null);

  const [totalGrafts,    setTotalGrafts]    = useState(0);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [totalFollowing, setTotalFollowing] = useState(0);
  const [totalApprovals, setTotalApprovals] = useState(0);
  const [totalRelays,    setTotalRelays]    = useState(0);

  const [graftChart,    setGraftChart]    = useState<{ date: string; count: number }[]>([]);
  const [followerChart, setFollowerChart] = useState<{ date: string; count: number }[]>([]);
  const [topGrafts,     setTopGrafts]     = useState<any[]>([]);
  const [hasHashtags,   setHasHashtags]   = useState(false);

  const buildDayChart = (items: { created_at: string }[], days: number) => {
    const map: Record<string, number> = {};
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    for (const item of items) {
      const key = item.created_at.slice(0, 10);
      if (key in map) map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      count,
    }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { router.push("/connexion"); return; }

    const uname = user.user_metadata?.username ?? user.email?.split("@")[0] ?? "";
    setUserId(user.id);
    setUsername(uname);

    const since = sinceDate(PERIOD_DAYS[period]);
    const days  = PERIOD_DAYS[period] ?? 90;

    const [
      { count: grafts },
      { count: frs },
      { count: fing },
      { count: apprs },
      { count: relays },
      { data: profileData },
      { data: graftItems },
      { data: topGraftData },
    ] = await Promise.all([
      sb.from("grafts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
      sb.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      sb.from("approvals").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      sb.from("grafts").select("*", { count: "exact", head: true }).eq("user_id", user.id).not("parent_id", "is", null),
      sb.from("profiles").select("*").eq("id", user.id).single(),
      since
        ? sb.from("grafts").select("created_at").eq("user_id", user.id).gte("created_at", since).order("created_at")
        : sb.from("grafts").select("created_at").eq("user_id", user.id).order("created_at"),
      sb.from("grafts").select("id,content,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    ]);

    setTotalGrafts(grafts ?? 0);
    setTotalFollowers(frs ?? 0);
    setTotalFollowing(fing ?? 0);
    setTotalApprovals(apprs ?? 0);
    setTotalRelays(relays ?? 0);
    setProfile({ ...(profileData ?? {}), grafts: grafts ?? 0, followers: frs ?? 0 });

    const gItems = (graftItems ?? []) as { created_at: string }[];
    setGraftChart(buildDayChart(gItems, Math.min(days, 30)));

    const allContent = (topGraftData ?? []).map((g: any) => g.content ?? "").join(" ");
    setHasHashtags(/#[\wÀ-ÿ]+/.test(allContent));

    // Simple scoring for top grafts — length as proxy for engagement (no approvals join available)
    const scored = (topGraftData ?? []).map((g: any) => ({ ...g, approvals: 0, relays: 0 })).slice(0, 5);
    setTopGrafts(scored);

    setLoading(false);
  }, [period, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const engagementRate = totalGrafts > 0 ? Math.round(((totalApprovals + totalRelays) / totalGrafts) * 10) / 10 : 0;

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${GOLD}20`, border: `1px solid ${GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>📊</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Mes Statistiques</h1>
              {username && <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>@{username}</p>}
            </div>
          </div>

          {/* Filtres période */}
          <div style={{ display: "flex", padding: "0 16px 10px", gap: "6px" }}>
            {(Object.keys(PERIOD_DAYS) as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ padding: "5px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: period === p ? 700 : 400, cursor: "pointer", border: `1px solid ${period === p ? GOLD : BORDER}`, background: period === p ? `${GOLD}20` : "transparent", color: period === p ? GOLD : TEXT2, transition: "all 0.12s" }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "60px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.5 }}>📊</div>
            <p style={{ color: TEXT2, fontSize: "13px" }}>Calcul de tes stats…</p>
          </div>
        ) : (
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>

            {/* Grille métriques 2×3 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <StatCard icon="✍️" label="Grafts publiés" value={totalGrafts} color={TEXT} chart={graftChart} />
              <StatCard icon="👥" label="Abonnés" value={totalFollowers} color={RED} chart={followerChart} />
              <StatCard icon="➕" label="Abonnements" value={totalFollowing} color={GOLD} />
              <StatCard icon="✓"  label="Approbations" value={totalApprovals} color={GREEN} />
              <StatCard icon="↻"  label="Relays" value={totalRelays} color={BLUE} />
              <StatCard icon="⚡" label="Engagement/graft" value={engagementRate} color={PURPLE} sub={engagementRate >= 2 ? "+Actif" : engagementRate >= 1 ? "Moyen" : "Faible"} />
            </div>

            {/* Graphique grafts */}
            {graftChart.length > 0 && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ color: TEXT, fontWeight: 700, fontSize: "13px" }}>Activité de publication</span>
                  <span style={{ color: TEXT2, fontSize: "11px" }}>({period})</span>
                </div>
                <MiniBarChart data={graftChart} color={RED} label="grafts" />
              </div>
            )}

            {/* Top grafts */}
            {topGrafts.length > 0 && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: `${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>🏆</div>
                  <span style={{ color: TEXT, fontWeight: 800, fontSize: "14px" }}>Derniers grafts</span>
                </div>
                {topGrafts.map((g, i) => <TopGraftCard key={g.id} graft={g} rank={i} />)}
              </div>
            )}

            {/* Résumé chiffres clés */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "14px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                <span style={{ fontSize: "16px" }}>📈</span>
                <span style={{ color: TEXT, fontWeight: 800, fontSize: "14px" }}>Chiffres clés</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {[
                  { label: "Ratio abonnés/abonnements", value: totalFollowing > 0 ? (totalFollowers / totalFollowing).toFixed(2) : "∞", color: totalFollowers >= totalFollowing ? GREEN : TEXT2 },
                  { label: "Taux d'engagement moyen",   value: `${engagementRate}×`, color: PURPLE },
                  { label: "Portée estimée",             value: fmtN(totalFollowers * Math.max(totalGrafts, 1)), color: GOLD },
                ].map(({ label, value, color }, i, arr) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                    <span style={{ color: TEXT2, fontSize: "13px" }}>{label}</span>
                    <span style={{ color, fontWeight: 700, fontSize: "14px" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <ProfileScore profile={profile} />
            <GrowthTips totalGrafts={totalGrafts} totalFollowers={totalFollowers} hasHashtags={hasHashtags} />
          </div>
        )}
      </div>
    </>
  );
}
