"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const RED    = "#E0492F";
const BG     = "#000000";
const BORDER = "#1C1C1C";

const TABS = [
  { href: "/dashboard",           icon: "🏠", label: "Le Fil",   exact: true  },
  { href: "/dashboard/recherche", icon: "🔎", label: "Recherche",exact: false },
  { href: "/dashboard/explorer",  icon: "🔭", label: "Explorer", exact: false },
  { href: "/dashboard/tv",        icon: "📺", label: "Médias",   exact: false },
  { href: "/dashboard/profil-menu",icon: "👤",label: "Profil",   exact: false },
];

function isActive(pathname: string, href: string, exact: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export default function BottomNav() {
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
        const on = isActive(pathname, tab.href, tab.exact);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              textDecoration: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: "2px", minWidth: "56px",
              opacity: on ? 1 : 0.4, transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: "22px", lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: "10px", color: on ? RED : "#666", fontWeight: on ? 700 : 400 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
