"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const RED = "#C8312A";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#E8C96A";
const BG = "#0F1119";
const SURFACE = "#161926";
const BORDER = "#1F2436";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <aside style={{ width: "248px", background: SURFACE, borderRight: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", padding: "28px 16px", gap: "4px", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px", paddingLeft: "8px" }}>
          <div style={{
            width: "38px", height: "38px", borderRadius: "10px",
            background: `linear-gradient(135deg, ${RED} 0%, #8B1A15 100%)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "19px", fontWeight: 900, color: GOLD, flexShrink: 0,
            boxShadow: `0 4px 16px rgba(200,49,42,0.4), inset 0 1px 0 rgba(201,168,76,0.3)`,
            border: `1px solid rgba(201,168,76,0.25)`,
          }}>S</div>
          <div>
            <span style={{ color: "#ECEAE2", fontSize: "15px", fontWeight: 900, letterSpacing: "0.5px", display: "block" }}>STENOGRAFT</span>
            <span style={{ color: GOLD, fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", opacity: 0.8 }}>Souverain</span>
          </div>
        </Link>

        <div style={{ height: "1px", background: `linear-gradient(90deg, ${GOLD}40 0%, transparent 100%)`, margin: "0 8px 20px" }} />

        <NavLink href="/dashboard" label="Fil public" icon="⊞" active={pathname === "/dashboard"} />
        <NavLink href="/dashboard/actualites" label="Actualités" icon="📰" active={pathname.startsWith("/dashboard/actualites")} />
        <NavLink href="/dashboard/communautes" label="Mes communautés" icon="◈" active={pathname.startsWith("/dashboard/communautes")} />
        <NavLink href="/dashboard/registre" label="Le Registre" icon="📜" active={pathname.startsWith("/dashboard/registre")} />
        <NavLink href="/dashboard/parametres" label="Paramètres" icon="⚙" active={pathname === "/dashboard/parametres"} />

        <div style={{ height: "1px", background: BORDER, margin: "8px 8px" }} />

        <NavLink href="/dashboard/profil" label="Mon profil" icon="◉" active={pathname.startsWith("/dashboard/profil")} />

        <div style={{ flex: 1 }} />

        <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: "16px", display: "flex", alignItems: "center", gap: "10px", paddingLeft: "8px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%",
            background: `linear-gradient(135deg, ${RED}80 0%, ${GOLD}40 100%)`,
            border: `1.5px solid ${GOLD}50`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: GOLD_LIGHT, fontSize: "14px", fontWeight: 800,
          }}>Y</div>
          <div>
            <p style={{ color: "#ECEAE2", fontSize: "13px", fontWeight: 700, margin: 0 }}>Yahia</p>
            <p style={{ color: GOLD, fontSize: "11px", margin: 0, opacity: 0.7 }}>● En ligne</p>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px 12px", borderRadius: "10px",
        background: active ? `linear-gradient(135deg, ${RED}18 0%, ${GOLD}08 100%)` : "transparent",
        color: active ? GOLD_LIGHT : "#5A6076",
        fontSize: "14px", fontWeight: active ? 700 : 500,
        borderLeft: active ? `2px solid ${RED}` : "2px solid transparent",
        transition: "background 0.15s, color 0.15s",
        cursor: "pointer",
      }}>
        <span style={{ fontSize: "16px" }}>{icon}</span>
        {label}
      </div>
    </Link>
  );
}
