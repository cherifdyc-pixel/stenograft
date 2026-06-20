"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import RightSidebar from "./RightSidebar";
import NotificationBell from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import BottomNav from "@/components/BottomNav";

function useUnreadNotifs() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    let cleanup: (() => void) | undefined;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count: n } = await supabase
        .from("notifications").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("read", false);
      setCount(n ?? 0);
      const channel = supabase.channel("sidebar-notifs")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          async () => {
            const { count: fresh } = await supabase
              .from("notifications").select("*", { count: "exact", head: true })
              .eq("user_id", user.id).eq("read", false);
            setCount(fresh ?? 0);
          })
        .subscribe();
      cleanup = () => { supabase.removeChannel(channel); };
    };
    init();
    return () => { cleanup?.(); };
  }, []);
  return count;
}

function useUnreadMessages() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const supabase = createClient();
    let cleanup: (() => void) | undefined;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fetchCount = async () => {
        const { data: convs } = await supabase
          .from("conversations").select("id")
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
        const ids = (convs || []).map((c: any) => c.id);
        if (!ids.length) { setCount(0); return; }
        const { count: n } = await supabase
          .from("messages").select("*", { count: "exact", head: true })
          .in("conversation_id", ids)
          .neq("sender_id", user.id)
          .eq("lu", false);
        setCount(n ?? 0);
      };

      await fetchCount();

      const channel = supabase.channel("sidebar-messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" },
          () => { fetchCount(); })
        .subscribe();
      cleanup = () => { supabase.removeChannel(channel); };
    };
    init();
    return () => { cleanup?.(); };
  }, []);
  return count;
}

const BG     = "#000000";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const MUTED  = "#555555";

const NAV = [
  { href: "/dashboard",             icon: "🏠", label: "Le Fil",       exact: true  },
  { href: "/dashboard/recherche",   icon: "🔎", label: "Recherche",    exact: false },
  { href: "/dashboard/explorer",    icon: "🔭", label: "Explorer",     exact: false },
  { href: "/dashboard/tendances",   icon: "🔥", label: "Tendances",    exact: false },
  { href: "/dashboard/alertes",        icon: "🔔", label: "Alertes",        exact: false },
  { href: "/dashboard/notifications",  icon: "🔔", label: "Notifications",   exact: false, notifBadge: true },
  { href: "/dashboard/messages",       icon: "💬", label: "Messages",         exact: false, msgBadge: true },
  { href: "/dashboard/profil",      icon: "👤", label: "Mon Identité", exact: false },
  { href: "/dashboard/actualites",  icon: "📰", label: "Le Veilleur",  exact: false },
  { href: "/dashboard/registre",    icon: "🏛️", label: "Le Registre",  exact: false },
  { href: "/dashboard/communautes", icon: "🗺️", label: "Territoires",  exact: false },
  { href: "/dashboard/tv",          icon: "📺", label: "STENOGRAFT TV", exact: false },
  { href: "/dashboard/radio",       icon: "📻", label: "Radio",         exact: false },
  { href: "/dashboard/podcasts",    icon: "🎙️", label: "Podcasts",      exact: false },
  { href: "/dashboard/parametres",  icon: "⚙️", label: "Paramètres",   exact: false },
];


function active(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname     = usePathname();
  const router       = useRouter();
  const unreadNotifs    = useUnreadNotifs();
  const unreadMessages  = useUnreadMessages();

  const openGrafter = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sg:grafter"));
    if (pathname !== "/dashboard") router.push("/dashboard");
  };

  const openLive = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sg:start-live"));
    if (!pathname.startsWith("/dashboard/tv")) router.push("/dashboard/tv");
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .sg-sidebar    { display: flex !important; }
        .sg-bottom-nav { display: none !important; }
        .sg-right      { display: flex !important; }
        @media (max-width: 1200px) { .sg-right { display: none !important; } }
        @media (max-width: 768px) {
          .sg-sidebar    { display: none  !important; }
          .sg-bottom-nav { display: flex  !important; }
          .sg-main { padding-bottom: 80px; }
        }
        .sg-nav-item:hover { background: #0f0f0f !important; }
        .sg-profile-row:hover { background: #0f0f0f !important; }
        .sg-grafter-btn:hover { opacity: 0.88; }
        .sg-grafter-btn:active { transform: scale(0.97); }
        .sg-live-btn:hover { background: rgba(224,73,47,0.1) !important; }
        .sg-live-btn:active { transform: scale(0.97); }
        @keyframes sg-pulse {
          0%   { box-shadow: 0 4px 24px rgba(224,73,47,0.65), 0 0 0 0px  rgba(224,73,47,0.4); }
          70%  { box-shadow: 0 4px 24px rgba(224,73,47,0.35), 0 0 0 16px rgba(224,73,47,0);   }
          100% { box-shadow: 0 4px 24px rgba(224,73,47,0.65), 0 0 0 0px  rgba(224,73,47,0);   }
        }
        .sg-fab { animation: sg-pulse 2.6s ease-out infinite; }
        .sg-fab:hover { transform: scale(1.08) !important; opacity: 0.92; }
        .sg-fab:active { transform: scale(0.95) !important; }
      `}</style>

      <div style={{
        display: "flex",
        minHeight: "100vh",
        background: BG,
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: "1400px",
        margin: "0 auto",
      }}>

        {/* ══════════════════════════════════════════════════
            LEFT SIDEBAR
        ══════════════════════════════════════════════════ */}
        <aside className="sg-sidebar" style={{
          width: "275px",
          flexShrink: 0,
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
          padding: "0 12px 8px",
          overflowY: "auto",
          scrollbarWidth: "none",
        }}>

          {/* Logo */}
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 10px 12px", borderRadius: "14px", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0a0a0a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Icône S */}
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", fontWeight: 900, color: "#fff",
                flexShrink: 0,
                boxShadow: `0 4px 16px ${RED}55`,
                letterSpacing: "-1px",
              }}>S</div>
              {/* Texte */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ color: TEXT, fontSize: "16px", fontWeight: 900, letterSpacing: "1.5px", lineHeight: 1 }}>STENOGRAFT</span>
                <span style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "3px", lineHeight: 1, opacity: 0.85 }}>SOUVERAIN</span>
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ marginTop: "4px" }}>
            {NAV.map(item => {
              const on         = active(pathname, item.href, item.exact);
              const badgeCount = (item as any).notifBadge ? unreadNotifs : (item as any).msgBadge ? unreadMessages : 0;
              const badge      = badgeCount > 0;
              return (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
                  <div
                    className="sg-nav-item"
                    style={{
                      display: "flex", alignItems: "center", gap: "16px",
                      padding: "11px 14px",
                      borderRadius: "100px",
                      background: "transparent",
                      marginBottom: "2px",
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{ fontSize: "22px", lineHeight: 1, width: "26px", textAlign: "center", flexShrink: 0, position: "relative", display: "inline-block" }}>
                      {item.icon}
                      {badge && (
                        <span style={{
                          position: "absolute", top: "-4px", right: "-6px",
                          background: RED, color: "#fff",
                          borderRadius: "50%", fontSize: "9px", fontWeight: 700,
                          minWidth: "15px", height: "15px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1.5px solid #000", padding: "0 2px",
                        }}>
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      )}
                    </span>
                    <span style={{
                      color: TEXT,
                      fontSize: "19px",
                      fontWeight: on ? 800 : 400,
                      letterSpacing: "-0.2px",
                      lineHeight: 1.2,
                    }}>
                      {item.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Grafter button */}
          <button
            className="sg-grafter-btn"
            onClick={openGrafter}
            style={{
              display: "block",
              width: "calc(100% - 8px)",
              marginLeft: "4px",
              marginTop: "6px",
              padding: "15px 0",
              background: RED,
              border: "none",
              borderRadius: "100px",
              color: "#fff",
              fontSize: "17px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: `0 4px 24px ${RED}45`,
              letterSpacing: "0.2px",
              transition: "opacity 0.15s, transform 0.1s",
            }}
          >
            Grafter
          </button>

          {/* Live button */}
          <button
            className="sg-live-btn"
            onClick={openLive}
            style={{
              display: "block",
              width: "calc(100% - 8px)",
              marginLeft: "4px",
              marginTop: "8px",
              padding: "12px 0",
              background: "transparent",
              border: `1.5px solid ${RED}`,
              borderRadius: "100px",
              color: RED,
              fontSize: "15px",
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.2px",
              transition: "background 0.15s, transform 0.1s",
            }}
          >
            🔴 Démarrer un Live
          </button>

          <div style={{ flex: 1 }} />

          {/* Profile strip */}
          <Link href="/dashboard/profil" style={{ textDecoration: "none" }}>
            <div
              className="sg-profile-row"
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "11px 12px",
                borderRadius: "100px",
                marginBottom: "4px",
                transition: "background 0.12s",
              }}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
                border: `2px solid ${GOLD}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "15px", fontWeight: 900,
              }}>Y</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Yahia</p>
                <p style={{ color: MUTED, fontSize: "14px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@yahia</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <ThemeToggle />
                <NotificationBell />
                <span style={{ color: MUTED, fontSize: "18px", letterSpacing: "2px" }}>···</span>
              </div>
            </div>
          </Link>
        </aside>

        {/* ══════════════════════════════════════════════════
            MAIN CONTENT
        ══════════════════════════════════════════════════ */}
        <main
          className="sg-main"
          style={{
            flex: 1,
            minWidth: 0,
            borderLeft:  `1px solid ${BORDER}`,
            borderRight: `1px solid ${BORDER}`,
          }}
        >
          {children}
        </main>

        {/* ══════════════════════════════════════════════════
            RIGHT SIDEBAR
        ══════════════════════════════════════════════════ */}
        <RightSidebar />

        {/* ══════════════════════════════════════════════════
            MOBILE BOTTOM NAV
        ══════════════════════════════════════════════════ */}
        <BottomNav onGraft={openGrafter} />
      </div>
    </>
  );
}
