"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const RED    = "#E0492F";
const BG     = "#000000";
const BORDER = "#1C1C1C";

const TABS = [
  { href: "/dashboard",            icon: "🏠", label: "Le Fil",     exact: true  },
  { href: "/dashboard/tendances",  icon: "🔥", label: "Tendances",  exact: false },
  { href: "/dashboard",            icon: "✍️", label: "Grafter",   exact: true, central: true },
  { href: "/dashboard/tv",         icon: "📺", label: "TV",         exact: false },
  { href: "/dashboard/profil-menu",icon: "👤", label: "Profil",     exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function BottomNav({ onGraft }: { onGraft?: () => void }) {
  const pathname = usePathname();

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

        const on = isActive(pathname, tab.href, tab.exact);
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
            <span style={{ fontSize: "20px", lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", color: on ? RED : "#666", fontWeight: on ? 700 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
