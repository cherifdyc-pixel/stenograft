"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const RED    = "#E0492F";
const BG     = "#000000";
const BORDER = "#1C1C1C";

const TABS = [
  { href: "/dashboard",               icon: "🏠", label: "Le Fil",  exact: true  },
  { href: "/dashboard/notifications", icon: "🔔", label: "Notifs",  exact: false, notifBadge: true },
  { href: "/dashboard",               icon: "✍️", label: "Grafter", exact: true, central: true },
  { href: "/dashboard/messages",      icon: "💬", label: "Messages", exact: false, msgBadge: true },
  { href: "/dashboard/profil-menu",   icon: "👤", label: "Profil",   exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

function useUnreadCount() {
  const [notifs,   setNotifs]   = useState(0);
  const [messages, setMessages] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Notifs non lues
      const { count: n } = await supabase
        .from("notifications").select("*", { count: "exact", head: true })
        .eq("user_id", user.id).eq("read", false);
      setNotifs(n ?? 0);

      // Messages non lus
      const fetchMsgs = async () => {
        const { data: convs } = await supabase
          .from("conversations").select("id")
          .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`);
        const ids = (convs || []).map((c: any) => c.id);
        if (!ids.length) { setMessages(0); return; }
        const { count: m } = await supabase
          .from("messages").select("*", { count: "exact", head: true })
          .in("conversation_id", ids).neq("sender_id", user.id).eq("lu", false);
        setMessages(m ?? 0);
      };
      await fetchMsgs();

      const ch1 = supabase.channel("bn-notifs")
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
          async () => {
            const { count: fresh } = await supabase
              .from("notifications").select("*", { count: "exact", head: true })
              .eq("user_id", user.id).eq("read", false);
            setNotifs(fresh ?? 0);
          })
        .subscribe();

      const ch2 = supabase.channel("bn-messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" },
          () => { fetchMsgs(); })
        .subscribe();

      cleanup = () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
    };

    init();
    return () => { cleanup?.(); };
  }, []);

  return { notifs, messages };
}

export default function BottomNav({ onGraft }: { onGraft?: () => void }) {
  const pathname = usePathname();
  const { notifs: unreadNotifs, messages: unreadMessages } = useUnreadCount();

  return (
    <nav className="sg-bottom-nav" style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300,
      background: `${BG}F2`,
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      borderTop: `1px solid ${BORDER}`,
      display: "flex", alignItems: "center", justifyContent: "space-around",
      padding: "6px 0 calc(6px + env(safe-area-inset-bottom))",
    }}>
      {TABS.map(tab => {
        if (tab.central) {
          return (
            <button
              key="central"
              onClick={onGraft}
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: RED, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginTop: "-18px",
                boxShadow: `0 0 0 4px ${BG}, 0 4px 20px ${RED}60`,
                flexShrink: 0,
              }}
            >
              {tab.icon}
            </button>
          );
        }

        const on         = isActive(pathname, tab.href, tab.exact);
        const badgeCount = (tab as any).notifBadge ? unreadNotifs : (tab as any).msgBadge ? unreadMessages : 0;
        const badge      = badgeCount > 0;

        return (
          <Link
            key={tab.href + tab.label}
            href={tab.href}
            style={{
              textDecoration: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: "2px", minWidth: "48px",
              opacity: on ? 1 : 0.4, transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: 1, position: "relative", display: "inline-block" }}>
              {tab.icon}
              {badge && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-6px",
                  background: RED, color: "#fff",
                  borderRadius: "50%", fontSize: "9px", fontWeight: 700,
                  minWidth: "15px", height: "15px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1.5px solid ${BG}`,
                  padding: "0 2px",
                }}>
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </span>
            <span style={{ fontSize: "10px", color: on ? RED : "#666", fontWeight: on ? 700 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
