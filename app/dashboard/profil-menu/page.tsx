"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

const SECTIONS = [
  { icon: "✍️", label: "Mes Grafts",        href: "/dashboard/mes-grafts"   },
  { icon: "💬", label: "Messages",          href: "/dashboard/messages"     },
  { icon: "🔴", label: "STENO Live",        href: "/dashboard/live"         },
  { icon: "📺", label: "STENOGRAFT TV",     href: "/dashboard/tv"           },
  { icon: "📰", label: "Le Veilleur",       href: "/dashboard/actualites"   },
  { icon: "🗺️", label: "Territoires",       href: "/dashboard/communautes"  },
  { icon: "🔥", label: "Tendances",         href: "/dashboard/tendances"    },
  { icon: "📊", label: "Mes Statistiques",  href: "/dashboard/stats"        },
  { icon: "🏘️", label: "Mes Communautés",   href: "/dashboard/communautes"  },
  { icon: "👥", label: "Mes Abonnements",   href: "/dashboard/abonnements"  },
  { icon: "📡", label: "Mes Chaînes",       href: "/dashboard/chaines"      },
  { icon: "🔖", label: "Mes Favoris",       href: "/dashboard/favoris"      },
  { icon: "🔔", label: "Mes Alertes",       href: "/dashboard/alertes"      },
  { icon: "🏛️", label: "Mon Registre",      href: "/dashboard/registre"     },
  { icon: "⚙️", label: "Paramètres",        href: "/dashboard/parametres"   },
];

export default function ProfilMenuPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (data.user) setUser(data.user);
    });
  }, []);

  const logout = async () => {
    await createClient().auth.signOut();
    router.push("/");
  };

  const initiales = (user?.email ?? "?").slice(0, 2).toUpperCase();
  const pseudo    = user?.user_metadata?.username ?? user?.email?.split("@")[0] ?? "…";

  return (
    <div style={{
      maxWidth: "600px", margin: "0 auto", padding: "32px 16px",
      fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh",
    }}>

      {/* ── Avatar + nom ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "36px" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: RED, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "24px", fontWeight: 800,
          color: "#fff", flexShrink: 0,
          boxShadow: `0 4px 20px ${RED}40`,
        }}>
          {initiales}
        </div>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: TEXT, letterSpacing: "-0.3px" }}>
            {pseudo}
          </div>
          <Link
            href="/dashboard/parametres"
            style={{ fontSize: "13px", color: RED, textDecoration: "none", marginTop: "2px", display: "block" }}
          >
            Modifier le profil →
          </Link>
        </div>
      </div>

      {/* ── Sections ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
        {SECTIONS.map(s => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "15px 16px",
              background: SURF,
              borderRadius: "12px",
              border: `1px solid ${BORDER}`,
              textDecoration: "none",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#111")}
            onMouseLeave={e => (e.currentTarget.style.background = SURF)}
          >
            <span style={{ fontSize: "20px", lineHeight: 1, minWidth: "24px", textAlign: "center" }}>{s.icon}</span>
            <span style={{ fontSize: "15px", color: TEXT, fontWeight: 500, flex: 1 }}>{s.label}</span>
            <span style={{ color: TEXT2, fontSize: "18px" }}>›</span>
          </Link>
        ))}
      </div>

      {/* ── Déconnexion ── */}
      <button
        onClick={logout}
        style={{
          width: "100%", padding: "14px",
          borderRadius: "12px",
          background: "transparent",
          border: `1px solid ${BORDER}`,
          color: TEXT2,
          fontSize: "14px", fontWeight: 500,
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = RED; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}
      >
        Se déconnecter
      </button>
    </div>
  );
}
