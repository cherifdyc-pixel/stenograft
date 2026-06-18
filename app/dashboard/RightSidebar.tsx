"use client";
import { useState } from "react";
import Link from "next/link";

const GOLD   = "#C9A24B";
const BG     = "#000000";
const SURFACE= "#0A0A0A";
const BORDER = "#1C1C1C";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#3A3A3A";
const RED    = "#E0492F";

const ECHOS = [
  { tag: "#Macron",               count: 234, cat: "Politique France" },
  { tag: "#AssembléeNationale",   count: 189, cat: "Politique France" },
  { tag: "#Économie",             count: 145, cat: "Tendance"         },
  { tag: "#ClimatFrance",         count: 112, cat: "Environnement"    },
  { tag: "#ProchainesÉlections",  count:  87, cat: "Politique France" },
];

const SUGGESTIONS = [
  { id: "1", name: "Soraya M.",  handle: "soraya_m",  bio: "Journaliste · Sciences Po",         hue: 210 },
  { id: "2", name: "Karim D.",   handle: "karimdb",   bio: "Dev & politique francophone",        hue: 140 },
  { id: "3", name: "Léa V.",     handle: "lea_vdb",   bio: "Militante écologiste · Lyon",        hue: 280 },
];

function avatarGrad(hue: number) {
  return `linear-gradient(135deg, hsl(${hue},55%,14%) 0%, hsl(${(hue+45)%360},65%,34%) 100%)`;
}

function fmtCount(n: number) {
  return n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: TEXT, fontSize: "19px", fontWeight: 900, margin: "0 0 14px", letterSpacing: "-0.3px" }}>
      {children}
    </p>
  );
}

export default function RightSidebar() {
  const [subscribed, setSubscribed] = useState<Set<string>>(new Set());
  const [query, setQuery]           = useState("");

  const toggle = (id: string) =>
    setSubscribed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <aside
      className="sg-right"
      style={{
        width: "290px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        scrollbarWidth: "none",
        padding: "12px 16px 40px",
      }}
    >

      {/* ── BARRE EXPLORER ───────────────────────────────── */}
      <div style={{ position: "sticky", top: 0, zIndex: 5, background: `${BG}EE`, backdropFilter: "blur(12px)", paddingBottom: "8px", marginBottom: "16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: "100px",
          padding: "10px 16px",
          transition: "border-color 0.15s",
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = GOLD + "70")}
          onBlurCapture={e  => (e.currentTarget.style.borderColor = BORDER)}
        >
          <span style={{ fontSize: "15px", opacity: 0.5, flexShrink: 0 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Explorer STENOGRAFT"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: TEXT,
              fontSize: "15px",
              width: "100%",
              fontFamily: "inherit",
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: TEXT2, fontSize: "16px", cursor: "pointer", flexShrink: 0, padding: 0 }}>×</button>
          )}
        </div>
      </div>

      {/* ── LES ÉCHOS ─────────────────────────────────────── */}
      <section style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        overflow: "hidden",
        marginBottom: "16px",
      }}>
        <div style={{ padding: "14px 16px 10px" }}>
          <Heading>Les Échos</Heading>
        </div>

        {ECHOS.map((e, i) => (
          <div
            key={e.tag}
            style={{ padding: "10px 16px", cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={el => (el.currentTarget.style.background = "#111")}
            onMouseLeave={el => (el.currentTarget.style.background = "transparent")}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT2, fontSize: "12px", margin: "0 0 2px" }}>{e.cat}</p>
                <p style={{ color: TEXT, fontSize: "14px", fontWeight: 700, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.tag}</p>
                <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>{fmtCount(e.count)} grafts</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                <span style={{ color: TEXT3, fontSize: "11px", fontWeight: 700 }}>#{i + 1}</span>
                <div style={{ width: "32px", height: "3px", borderRadius: "2px", background: BORDER, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((e.count / ECHOS[0].count) * 100)}%`, background: GOLD, borderRadius: "2px" }} />
                </div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <Link href="/dashboard/explorer" style={{ color: RED, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            Voir plus de tendances
          </Link>
        </div>
      </section>

      {/* ── QUI S'ABONNER ─────────────────────────────────── */}
      <section style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: "16px",
        overflow: "hidden",
      }}>
        <div style={{ padding: "14px 16px 10px" }}>
          <Heading>Qui s'abonner</Heading>
        </div>

        {SUGGESTIONS.map(g => {
          const sub = subscribed.has(g.id);
          return (
            <div
              key={g.id}
              style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#111")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Avatar */}
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: avatarGrad(g.hue), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "15px", fontWeight: 800, flexShrink: 0 }}>
                {g.name[0]}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: TEXT, fontSize: "14px", fontWeight: 700, margin: "0 0 1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</p>
                <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 2px" }}>@{g.handle}</p>
                <p style={{ color: TEXT2, fontSize: "12px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.bio}</p>
              </div>

              {/* S'abonner */}
              <button
                onClick={e => { e.stopPropagation(); toggle(g.id); }}
                style={{
                  background:   sub ? "transparent" : TEXT,
                  color:        sub ? TEXT2          : BG,
                  border:       `1px solid ${sub ? BORDER : TEXT}`,
                  borderRadius: "100px",
                  padding: "6px 14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {sub ? "Abonné" : "S'abonner"}
              </button>
            </div>
          );
        })}

        <div style={{ padding: "12px 16px", borderTop: `1px solid ${BORDER}` }}>
          <Link href="/dashboard/explorer" style={{ color: RED, fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
            Voir plus de suggestions
          </Link>
        </div>
      </section>

      {/* Footer links */}
      <div style={{ marginTop: "16px", padding: "0 4px" }}>
        <p style={{ color: TEXT3, fontSize: "11px", lineHeight: 1.8 }}>
          Conditions · Confidentialité · Paramètres des cookies · Accessibilité · Info sur les publicités · Plus ···
        </p>
        <p style={{ color: TEXT3, fontSize: "11px", marginTop: "4px" }}>© 2026 STENOGRAFT</p>
      </div>
    </aside>
  );
}
