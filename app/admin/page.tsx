import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const RED  = "#E0492F";
const GOLD = "#C9A24B";
const BLUE = "#4B9AC9";
const BG   = "#000000";
const SURF = "#0A0A0A";
const B    = "#1C1C1C";
const TEXT = "#E7E9EA";
const T2   = "#71767B";

// ── Server action ─────────────────────────────────────────────────────────────

async function marquerTraite(formData: FormData) {
  "use server";
  const id = formData.get("id") as string;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.from("signalements").update({ traite: true }).eq("id", id);
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== "cherifdyc@gmail.com") redirect("/dashboard");

  const [
    { count: graftersCount },
    { count: graftsCount },
    { count: followsCount },
    { count: signalementsCount },
    { data: signalements },
    { data: newUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("grafts").select("*", { count: "exact", head: true }),
    supabase.from("follows").select("*", { count: "exact", head: true }),
    supabase.from("signalements").select("*", { count: "exact", head: true }).eq("traite", false),
    supabase.from("signalements").select("*, grafts(content)").eq("traite", false).order("created_at", { ascending: false }).limit(20),
    supabase.from("profiles").select("id, username, display_name, created_at").order("created_at", { ascending: false }).limit(20),
  ]);

  const STATS = [
    { label: "Grafters",      value: graftersCount     ?? 0, color: RED  },
    { label: "Grafts",        value: graftsCount        ?? 0, color: GOLD },
    { label: "Abonnements",   value: followsCount       ?? 0, color: BLUE },
    { label: "Signalements",  value: signalementsCount  ?? 0, color: "#E05030" },
  ];

  return (
    <main style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Inter', system-ui, sans-serif", padding: "32px 24px" }}>
      <div style={{ maxWidth: "920px", margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: "36px", paddingBottom: "20px", borderBottom: `1px solid ${B}` }}>
          <div style={{ fontSize: "10px", color: RED, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>
            ⚡ Administration · Accès restreint
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 900, margin: "0 0 4px", letterSpacing: "-0.5px" }}>STENOGRAFT Dashboard</h1>
          <p style={{ color: T2, fontSize: "13px", margin: 0 }}>Connecté en tant que {user.email}</p>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "44px" }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background: SURF, border: `1px solid ${B}`, borderTop: `2px solid ${s.color}`, borderRadius: "12px", padding: "20px 16px", textAlign: "center" }}>
              <div style={{ fontSize: "34px", fontWeight: 900, color: s.color, letterSpacing: "-1px" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: T2, marginTop: "5px", fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Signalements ── */}
        <section style={{ marginBottom: "44px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: RED, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            🚩 Signalements non traités ({signalementsCount ?? 0})
          </h2>

          {!signalements?.length ? (
            <div style={{ background: SURF, border: `1px solid ${B}`, borderRadius: "12px", padding: "24px", color: T2, fontSize: "14px", textAlign: "center" }}>
              ✓ Aucun signalement en attente
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {signalements.map((s: any) => (
                <div key={s.id} style={{ background: SURF, border: `1px solid ${B}`, borderLeft: `3px solid ${RED}`, borderRadius: "10px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <span style={{ fontSize: "10px", color: RED, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.8px", background: `${RED}15`, border: `1px solid ${RED}30`, padding: "2px 8px", borderRadius: "20px" }}>
                        {s.raison}
                      </span>
                      <span style={{ fontSize: "11px", color: T2 }}>
                        {new Date(s.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p style={{ fontSize: "13px", color: "#888", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {(s.grafts as any)?.content ?? "(contenu supprimé)"}
                    </p>
                  </div>

                  <form action={marquerTraite} style={{ flexShrink: 0 }}>
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" style={{ padding: "7px 16px", borderRadius: "20px", background: "transparent", border: `1px solid ${B}`, color: T2, fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s" }}>
                      Traité ✓
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Derniers Grafters ── */}
        <section>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: GOLD, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            👤 Derniers Grafters inscrits
          </h2>
          <div style={{ background: SURF, border: `1px solid ${B}`, borderRadius: "12px", overflow: "hidden" }}>
            {newUsers?.map((u, i) => {
              const initials = (u.display_name || u.username || "?")
                .trim().split(/\s+/).map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", borderBottom: i < (newUsers.length - 1) ? `1px solid ${B}` : "none" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: `linear-gradient(135deg,${RED} 0%,#A8321F 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", color: TEXT, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.display_name || u.username || "Sans nom"}
                    </div>
                    <div style={{ fontSize: "12px", color: T2 }}>@{u.username}</div>
                  </div>
                  <div style={{ fontSize: "11px", color: T2, flexShrink: 0 }}>
                    {new Date(u.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </main>
  );
}
