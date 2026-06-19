"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";

type Grafter = { id: string; username: string; display_name: string | null };
type Graft   = { id: string; content: string; created_at: string; author_name: string };

function avatarGrad(name: string) {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return `linear-gradient(135deg,hsl(${h},65%,22%) 0%,hsl(${(h+40)%360},72%,32%) 100%)`;
}

function Avatar({ name, size }: { name: string; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: avatarGrad(name),
      border: `2px solid ${RED}40`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: Math.round(size * 0.38) + "px", fontWeight: 800,
    }}>
      {name[0].toUpperCase()}
    </div>
  );
}

export default function RecherchePage() {
  const [query,    setQuery]    = useState("");
  const [tab,      setTab]      = useState<"grafters" | "grafts">("grafters");
  const [grafters, setGrafters] = useState<Grafter[]>([]);
  const [grafts,   setGrafts]   = useState<Graft[]>([]);
  const [loading,  setLoading]  = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setGrafters([]); setGrafts([]); return; }
    setLoading(true);
    const supabase = createClient();

    const [{ data: g }, { data: gr }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, username, display_name")
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(10),
      supabase
        .from("grafts")
        .select("id, content, created_at, author_name")
        .ilike("content", `%${q}%`)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setGrafters(g ?? []);
    setGrafts((gr ?? []) as Graft[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const tabStyle = (active: boolean) => ({
    padding: "10px 24px", borderRadius: "100px", border: "none", cursor: "pointer",
    background: active ? RED : "transparent",
    color: active ? "#fff" : TEXT2,
    fontSize: "14px", fontWeight: active ? 700 : 400,
    transition: "all 0.15s",
    boxShadow: active ? `0 2px 12px ${RED}40` : "none",
  });

  const empty = (label: string) => (
    <div style={{ padding: "48px 0", textAlign: "center" }}>
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>🔎</div>
      <p style={{ color: TEXT2, fontSize: "14px", margin: 0 }}>{label}</p>
    </div>
  );

  return (
    <div style={{
      maxWidth: "600px", margin: "0 auto", padding: "24px 0",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Barre de recherche ── */}
      <div style={{ padding: "0 16px 20px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", fontSize: "18px", pointerEvents: "none" }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un Grafter ou un graft…"
            autoFocus
            style={{
              width: "100%", padding: "14px 20px 14px 48px",
              borderRadius: "100px",
              background: SURFACE,
              border: `1px solid ${BORDER}`,
              color: TEXT,
              fontSize: "15px", outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{ display: "flex", gap: "4px", padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
        <button style={tabStyle(tab === "grafters")} onClick={() => setTab("grafters")}>Grafters</button>
        <button style={tabStyle(tab === "grafts")}   onClick={() => setTab("grafts")}>Grafts</button>
      </div>

      {/* ── État vide initial ── */}
      {!query && (
        <div style={{ padding: "48px 16px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
          <p style={{ color: TEXT2, fontSize: "15px", margin: 0 }}>Cherchez un Grafter, un mot-clé…</p>
        </div>
      )}

      {/* ── Chargement ── */}
      {loading && (
        <div style={{ padding: "16px", color: TEXT2, fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>⟳</span>
          Recherche…
        </div>
      )}

      {/* ── Onglet Grafters ── */}
      {tab === "grafters" && !loading && query && (
        <div>
          {grafters.length === 0
            ? empty("Aucun Grafter trouvé pour « " + query + " »")
            : grafters.map(g => {
              const initials = (g.display_name || g.username)
                .trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
              return (
                <div
                  key={g.id}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#080808")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: "none", flexShrink: 0 }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: 800, color: "#fff", border: "2px solid transparent", transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = RED)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "transparent")}
                    >
                      {initials}
                    </div>
                  </Link>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: "none" }}>
                      <div style={{ color: TEXT, fontWeight: 700, fontSize: "15px", letterSpacing: "-0.2px" }}>
                        {g.display_name || g.username}
                      </div>
                      <div style={{ color: TEXT2, fontSize: "13px", marginTop: "1px" }}>@{g.username}</div>
                    </Link>
                  </div>

                  <FollowButton targetUserId={g.id} />
                </div>
              );
            })
          }
        </div>
      )}

      {/* ── Onglet Grafts ── */}
      {tab === "grafts" && !loading && query && (
        <div>
          {grafts.length === 0
            ? empty("Aucun graft trouvé pour « " + query + " »")
            : grafts.map(g => (
              <div
                key={g.id}
                style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}`, transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#080808")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={g.author_name} size={28} />
                    <span style={{ color: RED, fontSize: "13px", fontWeight: 700 }}>
                      {g.author_name}
                    </span>
                  </Link>
                  <span style={{ color: TEXT2, fontSize: "12px" }}>·</span>
                  <span style={{ color: TEXT2, fontSize: "12px" }}>
                    {new Date(g.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                </div>
                <p style={{
                  color: TEXT, fontSize: "14px", lineHeight: 1.55, margin: 0,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {g.content}
                </p>
              </div>
            ))
          }
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
