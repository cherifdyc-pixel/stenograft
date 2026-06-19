import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import Link from "next/link";

const BG     = "#000000";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const GOLD   = "#C9A24B";

export default async function FavorisPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const { data: favoris } = await supabase
    .from("favoris")
    .select("id, created_at, grafts(id, content, created_at, author_name)")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const count = favoris?.length ?? 0;

  return (
    <div style={{
      maxWidth: "600px", margin: "0 auto", padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: TEXT, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
          🔖 Mes Favoris
        </h1>
        <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>
          {count} graft{count > 1 ? "s" : ""} sauvegardé{count > 1 ? "s" : ""}
        </p>
      </div>

      {count === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔖</div>
          <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 6px" }}>Aucun favori pour le moment.</p>
          <p style={{ color: "#333", fontSize: "12px", margin: 0 }}>
            Appuyez sur 🔖 sur un graft pour le sauvegarder.
          </p>
        </div>
      ) : (
        <div>
          {favoris!.map((f: any) => {
            const g = f.grafts;
            if (!g) return null;
            return (
              <div key={f.id} style={{ padding: "16px 0", borderBottom: `1px solid ${BORDER}` }}>
                <Link
                  href={`/dashboard/profil/${g.author_name.toLowerCase()}`}
                  style={{ textDecoration: "none" }}
                >
                  <span style={{ color: RED, fontSize: "13px", fontWeight: 700 }}>
                    @{g.author_name}
                  </span>
                </Link>
                <p style={{
                  color: TEXT, fontSize: "14px", margin: "6px 0 8px",
                  lineHeight: 1.6, whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {g.content}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: TEXT2 }}>
                    {new Date(g.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  <span style={{ fontSize: "11px", color: "#333" }}>·</span>
                  <span style={{ fontSize: "11px", color: GOLD }}>🔖 Sauvegardé</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
