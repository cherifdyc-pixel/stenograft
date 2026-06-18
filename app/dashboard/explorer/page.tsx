"use client";
import { useState } from "react";

const BG     = "#000000";
const BORDER = "#1C1C1C";
const SURFACE= "#0A0A0A";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#3A3A3A";

const TRENDS = [
  { tag: "#Macron",               count: 234, cat: "Politique" },
  { tag: "#AssembléeNationale",   count: 189, cat: "Politique" },
  { tag: "#Économie",             count: 145, cat: "France"    },
  { tag: "#ClimatFrance",         count: 112, cat: "Monde"     },
  { tag: "#ProchainesÉlections",  count:  87, cat: "Politique" },
  { tag: "#IntelligenceArtificielle", count: 74, cat: "France" },
  { tag: "#JusticeClimatique",    count:  62, cat: "Monde"     },
  { tag: "#Logement",             count:  55, cat: "France"    },
  { tag: "#SantéPublique",        count:  48, cat: "France"    },
  { tag: "#EducationNationale",   count:  41, cat: "Politique" },
];

const GRAFTERS = [
  { id: "1", name: "Soraya M.",   handle: "soraya_m",   bio: "Journaliste · Sciences Po",   hue: 210, followers: "12.4k" },
  { id: "2", name: "Karim D.",    handle: "karimdb",    bio: "Dev & politique francophone",  hue: 140, followers:  "8.1k" },
  { id: "3", name: "Léa V.",      handle: "lea_vdb",    bio: "Militante écologiste · Lyon",  hue: 280, followers:  "5.7k" },
  { id: "4", name: "Fouad K.",    handle: "fouadk",     bio: "Économiste, chercheur CNRS",   hue:  35, followers:  "3.2k" },
  { id: "5", name: "Priya F.",    handle: "priyaf",     bio: "Ingénieure & activiste data",  hue: 330, followers:  "2.8k" },
];

const TABS = ["Tendances", "Politique", "France", "Monde"] as const;
type TabKey = typeof TABS[number];

function hashN(id: string, salt = 0): number {
  let h = 5381 + salt;
  for (const c of id) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  return Math.abs(h);
}

function avatarGrad(hue: number) {
  return `linear-gradient(135deg, hsl(${hue},55%,14%) 0%, hsl(${(hue+45)%360},65%,34%) 100%)`;
}

export default function ExplorerPage() {
  const [query,    setQuery]    = useState("");
  const [tab,      setTab]      = useState<TabKey>("Tendances");
  const [subbed,   setSubbed]   = useState<Set<string>>(new Set());

  const toggleSub = (id: string) =>
    setSubbed(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = TRENDS.filter(t => {
    const matchQuery = !query || t.tag.toLowerCase().includes(query.toLowerCase());
    const matchTab   = tab === "Tendances" || t.cat === tab;
    return matchQuery && matchTab;
  });

  return (
    <div>
      {/* Sticky header + search */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "12px 16px 0" }}>
        <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 12px", letterSpacing: "-0.3px" }}>Explorer</h1>

        <div
          style={{ display: "flex", alignItems: "center", gap: "10px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", padding: "10px 16px", marginBottom: "12px", transition: "border-color 0.15s" }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = GOLD + "80")}
          onBlurCapture={e  => (e.currentTarget.style.borderColor = BORDER)}
        >
          <span style={{ fontSize: "16px", opacity: 0.5 }}>🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher des grafts, sujets, personnes…"
            style={{ background: "transparent", border: "none", outline: "none", color: TEXT, fontSize: "15px", width: "100%", fontFamily: "inherit" }}
          />
          {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", color: TEXT2, fontSize: "18px", cursor: "pointer", padding: 0 }}>×</button>}
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginLeft: "-16px", marginRight: "-16px", paddingLeft: "16px", overflowX: "auto", scrollbarWidth: "none" }}>
          {TABS.map(t => {
            const on = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{ background: "none", border: "none", padding: "12px 20px", cursor: "pointer", borderBottom: `2px solid ${on ? RED : "transparent"}`, color: on ? TEXT : TEXT2, fontSize: "15px", fontWeight: on ? 700 : 400, transition: "all 0.15s", whiteSpace: "nowrap", flexShrink: 0 }}
              >{t}</button>
            );
          })}
        </div>
      </div>

      {/* Trends section */}
      <div style={{ borderBottom: `4px solid ${BORDER}` }}>
        <p style={{ color: TEXT, fontSize: "19px", fontWeight: 900, margin: 0, padding: "16px 16px 10px", letterSpacing: "-0.3px" }}>
          {query ? `Résultats pour "${query}"` : `${tab === "Tendances" ? "Tendances" : `Tendances · ${tab}`} pour vous`}
        </p>

        {filtered.length === 0 ? (
          <div style={{ padding: "60px 16px", textAlign: "center" }}>
            <p style={{ color: TEXT2, fontSize: "15px" }}>Aucun résultat</p>
          </div>
        ) : (
          filtered.map((t, i) => (
            <div
              key={t.tag}
              style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0a0a0a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 3px" }}>{t.cat} · Tendance</p>
                  <p style={{ color: TEXT, fontSize: "15px", fontWeight: 700, margin: "0 0 3px" }}>{t.tag}</p>
                  <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>{t.count} grafts</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "40px", height: "4px", borderRadius: "3px", background: BORDER, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((t.count / TRENDS[0].count) * 100)}%`, background: `linear-gradient(90deg, ${GOLD}, ${RED})`, borderRadius: "3px" }} />
                  </div>
                  <span style={{ color: TEXT3, fontSize: "12px", fontWeight: 700, minWidth: "20px", textAlign: "right" }}>#{i + 1}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Grafters suggérés */}
      <div>
        <p style={{ color: TEXT, fontSize: "19px", fontWeight: 900, margin: 0, padding: "16px 16px 10px", letterSpacing: "-0.3px" }}>Grafters suggérés</p>

        {GRAFTERS.map(g => {
          const sub = subbed.has(g.id);
          return (
            <div
              key={g.id}
              style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0a0a0a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {/* Avatar */}
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: avatarGrad(g.hue), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px", fontWeight: 800, flexShrink: 0 }}>
                {g.name[0]}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: TEXT, fontSize: "15px", fontWeight: 700 }}>{g.name}</span>
                </div>
                <p style={{ color: TEXT2, fontSize: "13px", margin: "1px 0" }}>@{g.handle}</p>
                <p style={{ color: TEXT2, fontSize: "13px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.bio} · {g.followers} grafters</p>
              </div>

              {/* Button */}
              <button
                onClick={e => { e.stopPropagation(); toggleSub(g.id); }}
                style={{
                  background: sub ? "transparent" : TEXT,
                  color:      sub ? TEXT2          : BG,
                  border:     `1px solid ${sub ? BORDER : TEXT}`,
                  borderRadius: "100px",
                  padding: "8px 18px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >{sub ? "Abonné" : "S'abonner"}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
