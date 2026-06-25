"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
          .in("conversation_id", ids).neq("sender_id", user.id).eq("lu", false);
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
const TEXT2  = "#71767B";
const MUTED  = "#555555";

type NavItem = {
  href: string; icon: string; label: string; exact: boolean;
  notifBadge?: boolean; msgBadge?: boolean;
};

type NavGroup = {
  label: string; icon: string; items: NavItem[];
};

type NavEntry = NavItem | NavGroup;

const NAV: NavEntry[] = [
  { href: "/dashboard",               icon: "🏠",  label: "Le Fil",       exact: true  },
  { href: "/dashboard/recherche",     icon: "🔎",  label: "Recherche",    exact: false },
  { href: "/dashboard/explorer",      icon: "🔭",  label: "Explorer",     exact: false },
  { href: "/dashboard/notifications", icon: "🔔",  label: "Notifications",exact: false, notifBadge: true },
  { href: "/dashboard/messages",      icon: "💬",  label: "Messages",     exact: false, msgBadge: true   },
  { href: "/dashboard/live",          icon: "🔴",  label: "STENO LIVE",   exact: false },
  { href: "/dashboard/profil",        icon: "👤",  label: "Profil",       exact: false },
  { href: "/dashboard/parametres",    icon: "⚙️",  label: "Paramètres",  exact: false },
  {
    label: "Plus", icon: "···",
    items: [
      { href: "/dashboard/tendances",   icon: "🔥",  label: "Tendances",    exact: false },
      { href: "/dashboard/abonnements", icon: "❤️",  label: "Abonnements",  exact: false },
      { href: "/dashboard/tv",          icon: "📺",  label: "STENO TV",     exact: false },
      { href: "/dashboard/chaines",     icon: "📡",  label: "Chaînes",      exact: false },
      { href: "/dashboard/podcasts",    icon: "🎙️", label: "Podcasts",     exact: false },
      { href: "/dashboard/studio",      icon: "🎬",  label: "STENO STUDIO", exact: false },
      { href: "/dashboard/ia",          icon: "🤖",  label: "Grafter IA",   exact: false },
      { href: "/dashboard/actualites",  icon: "📰",  label: "L'Actu",       exact: false },
      { href: "/dashboard/territoires", icon: "🗺️",  label: "Territoires",  exact: false },
      { href: "/dashboard/alertes",     icon: "🔔",  label: "Alertes",      exact: false },
      { href: "/dashboard/registre",    icon: "🏛️",  label: "Mon Registre", exact: false },
    ],
  },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

function useCurrentUser() {
  const [display, setDisplay] = useState("…");
  const [handle,  setHandle]  = useState("…");
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata;
      setHandle(meta?.username ?? data.user.email?.split("@")[0] ?? "grafter");
      setDisplay(meta?.display_name ?? meta?.username ?? data.user.email?.split("@")[0] ?? "Grafter");
    });
  }, []);
  return { display, handle };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const unreadNotifs   = useUnreadNotifs();
  const unreadMessages = useUnreadMessages();
  const { display: profileDisplay, handle: profileHandle } = useCurrentUser();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Plus": false,
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const toggleGroup = (label: string) =>
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));

  const openGrafter = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sg:grafter"));
    if (pathname !== "/dashboard") router.push("/dashboard");
  };

  const openLive = () => {
    if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("sg:start-live"));
    if (!pathname.startsWith("/dashboard/live")) router.push("/dashboard/live");
  };

  const renderItem = (item: NavItem) => {
    const on         = isActive(pathname, item.href, item.exact);
    const badgeCount = item.notifBadge ? unreadNotifs : item.msgBadge ? unreadMessages : 0;
    const badge      = badgeCount > 0;
    return (
      <Link key={item.href} href={item.href} style={{ textDecoration: "none", display: "block" }}>
        <div
          className="sg-nav-item"
          style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "9px 14px", borderRadius: "100px",
            background: on ? `${RED}12` : "transparent",
            marginBottom: "1px", transition: "background 0.12s",
          }}
        >
          <span style={{ fontSize: "20px", lineHeight: 1, width: "24px", textAlign: "center", flexShrink: 0, position: "relative", display: "inline-block" }}>
            {item.icon}
            {badge && (
              <span style={{
                position: "absolute", top: "-4px", right: "-6px",
                background: RED, color: "#fff", borderRadius: "50%",
                fontSize: "9px", fontWeight: 700, minWidth: "15px", height: "15px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1.5px solid #000", padding: "0 2px",
              }}>
                {badgeCount > 9 ? "9+" : badgeCount}
              </span>
            )}
          </span>
          <span style={{ color: TEXT, fontSize: "17px", fontWeight: on ? 800 : 400, letterSpacing: "-0.2px", lineHeight: 1.2, flex: 1 }}>
            {item.label}
          </span>
          {on && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: RED, flexShrink: 0 }} />}
        </div>
      </Link>
    );
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
        .sg-nav-item:hover   { background: #0f0f0f !important; }
        .sg-group-btn:hover  { background: #0a0a0a !important; }
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
        .sg-fab:hover  { transform: scale(1.08) !important; opacity: 0.92; }
        .sg-fab:active { transform: scale(0.95) !important; }
      `}</style>

      <div style={{
        display: "flex", minHeight: "100vh", background: BG,
        fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        maxWidth: "1400px", margin: "0 auto",
      }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside className="sg-sidebar" style={{
          width: "275px", flexShrink: 0, flexDirection: "column",
          position: "sticky", top: 0, height: "100vh",
          padding: "0 12px 8px", overflowY: "auto", scrollbarWidth: "none",
        }}>

          {/* Logo */}
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 10px 12px", borderRadius: "14px", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0a0a0a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: "40px", height: "40px", borderRadius: "12px",
                background: `linear-gradient(135deg, ${RED} 0%, #A8321F 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", fontWeight: 900, color: "#fff", flexShrink: 0,
                boxShadow: `0 4px 16px ${RED}55`, letterSpacing: "-1px",
              }}>S</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{ color: TEXT, fontSize: "16px", fontWeight: 900, letterSpacing: "1.5px", lineHeight: 1 }}>STENOGRAFT</span>
                <span style={{ color: GOLD, fontSize: "10px", fontWeight: 700, letterSpacing: "3px", lineHeight: 1, opacity: 0.85 }}>SOUVERAIN</span>
              </div>
            </div>
          </Link>

          {/* Nav */}
          <nav style={{ marginTop: "4px" }}>
            {NAV.map(entry => {
              if (!isGroup(entry)) return renderItem(entry as NavItem);

              const group = entry as NavGroup;
              const isOpen = openGroups[group.label] ?? true;
              const hasActiveChild = group.items.some(it => isActive(pathname, it.href, it.exact));

              return (
                <div key={group.label} style={{ marginBottom: "2px" }}>
                  <button
                    className="sg-group-btn"
                    onClick={() => toggleGroup(group.label)}
                    style={{
                      display: "flex", alignItems: "center", gap: "14px", width: "100%",
                      padding: "9px 14px", borderRadius: "100px",
                      background: "transparent", border: "none", cursor: "pointer",
                      transition: "background 0.12s",
                    }}
                  >
                    <span style={{ fontSize: "20px", lineHeight: 1, width: "24px", textAlign: "center", flexShrink: 0 }}>{group.icon}</span>
                    <span style={{ color: hasActiveChild ? RED : TEXT2, fontSize: "15px", fontWeight: hasActiveChild ? 700 : 500, letterSpacing: "-0.1px", flex: 1, textAlign: "left" }}>
                      {group.label}
                    </span>
                    <span style={{ color: TEXT2, fontSize: "14px", display: "inline-block", transition: "transform 0.2s", transform: isOpen ? "rotate(90deg)" : "none" }}>›</span>
                  </button>

                  {isOpen && (
                    <div style={{ paddingLeft: "10px" }}>
                      {group.items.map(item => renderItem(item))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Grafter button */}
          <button
            className="sg-grafter-btn"
            onClick={openGrafter}
            style={{
              display: "block", width: "calc(100% - 8px)", marginLeft: "4px", marginTop: "6px",
              padding: "15px 0", background: RED, border: "none", borderRadius: "100px",
              color: "#fff", fontSize: "17px", fontWeight: 800, cursor: "pointer",
              boxShadow: `0 4px 24px ${RED}45`, letterSpacing: "0.2px",
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
              display: "block", width: "calc(100% - 8px)", marginLeft: "4px", marginTop: "8px",
              padding: "12px 0", background: "transparent", border: `1.5px solid ${RED}`,
              borderRadius: "100px", color: RED, fontSize: "15px", fontWeight: 800,
              cursor: "pointer", letterSpacing: "0.2px",
              transition: "background 0.15s, transform 0.1s",
            }}
          >
            🔴 Démarrer un Live
          </button>

          <div style={{ flex: 1 }} />

          {/* Profile strip + menu ··· */}
          <div ref={menuRef} style={{ position: "relative", marginBottom: "4px" }}>

            {/* Dropdown menu */}
            {menuOpen && (
              <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0, background: "#0d0d0d", border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 50 }}>
                {[
                  { icon: "👤", label: "Mon profil",   action: () => { router.push("/dashboard/profil");     setMenuOpen(false); } },
                  { icon: "⚙️", label: "Paramètres",   action: () => { router.push("/dashboard/parametres"); setMenuOpen(false); } },
                ].map(({ icon, label, action }) => (
                  <button key={label} onClick={action}
                    style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "11px 16px", background: "none", border: "none", color: TEXT2, fontSize: "14px", fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#161616"; e.currentTarget.style.color = TEXT; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = TEXT2; }}
                  >{icon} {label}</button>
                ))}
                <div style={{ height: "1px", background: BORDER, margin: "2px 0" }} />
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    const sb = createClient();
                    await sb.auth.signOut();
                    router.push("/connexion");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", padding: "11px 16px", background: "none", border: "none", color: "#7a2a2a", fontSize: "14px", fontWeight: 700, cursor: "pointer", textAlign: "left", transition: "all 0.1s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${RED}10`; e.currentTarget.style.color = RED; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#7a2a2a"; }}
                >🚪 Déconnexion</button>
              </div>
            )}

            {/* Row : avatar + nom cliquable → profil | ··· ouvre le menu */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 12px", borderRadius: "100px", transition: "background 0.12s" }}
              className="sg-profile-row"
            >
              <Link href="/dashboard/profil" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`, border: `2px solid ${GOLD}`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "15px", fontWeight: 900 }}>
                  {profileDisplay[0]?.toUpperCase() ?? "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profileDisplay}</p>
                  <p style={{ color: MUTED, fontSize: "14px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>@{profileHandle}</p>
                </div>
              </Link>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <ThemeToggle />
                <NotificationBell />
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  style={{ background: menuOpen ? "#1a1a1a" : "none", border: "none", borderRadius: "8px", padding: "4px 8px", cursor: "pointer", color: menuOpen ? TEXT : MUTED, fontSize: "18px", letterSpacing: "2px", lineHeight: 1, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#1a1a1a"; e.currentTarget.style.color = TEXT; }}
                  onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = MUTED; } }}
                >···</button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="sg-main" style={{ flex: 1, minWidth: 0, borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}` }}>
          {children}
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <RightSidebar />

        {/* ── MOBILE BOTTOM NAV ── */}
        <BottomNav />
      </div>
    </>
  );
}
