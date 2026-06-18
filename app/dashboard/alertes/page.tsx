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
const GREEN  = "#00BA7C";

type Alerte = {
  id: string;
  type: "mention" | "abonné" | "approuvé" | "relayé" | "réponse";
  from: string;
  excerpt: string;
  time: string;
  read: boolean;
};

const MOCK: Alerte[] = [
  { id: "1", type: "approuvé", from: "Soraya M.", excerpt: "a approuvé ton graft sur l'Assemblée Nationale",           time: "2m",  read: false },
  { id: "2", type: "relayé",   from: "Karim D.",  excerpt: "a relayé ton graft sur la politique économique",            time: "14m", read: false },
  { id: "3", type: "mention",  from: "Léa V.",    excerpt: 't\'a mentionné : "...comme le souligne @yahia, le texte..."', time: "1h", read: false },
  { id: "4", type: "abonné",   from: "Fouad K.",  excerpt: "s'est abonné à ton profil",                                 time: "3h",  read: true  },
  { id: "5", type: "réponse",  from: "Priya F.",  excerpt: 'a répondu à ton graft : "Tout à fait, et on pourrait..."',  time: "5h",  read: true  },
  { id: "6", type: "approuvé", from: "Soraya M.", excerpt: "a approuvé ton graft sur le GDELT",                         time: "1j",  read: true  },
  { id: "7", type: "abonné",   from: "Léa V.",    excerpt: "s'est abonnée à ton profil",                                time: "2j",  read: true  },
];

const TYPE_ICON: Record<Alerte["type"], string> = {
  mention: "💬", abonné: "👤", approuvé: "❤️", relayé: "🔁", réponse: "💬",
};
const TYPE_COLOR: Record<Alerte["type"], string> = {
  mention: "#5B8EF0", abonné: "#C9A24B", approuvé: "#E05E80", relayé: "#3DBA74", réponse: "#5B8EF0",
};

export default function AlertesPage() {
  const [alertes, setAlertes] = useState(MOCK);
  const [filter,  setFilter]  = useState<"toutes" | "non lues">("toutes");

  const markAllRead = () => setAlertes(a => a.map(x => ({ ...x, read: true })));
  const markRead    = (id: string) => setAlertes(a => a.map(x => x.id === id ? { ...x, read: true } : x));

  const shown   = filter === "non lues" ? alertes.filter(a => !a.read) : alertes;
  const unread  = alertes.filter(a => !a.read).length;

  return (
    <div style={{ maxWidth: "620px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "16px 16px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: 0, letterSpacing: "-0.3px" }}>Alertes</h1>
            {unread > 0 && (
              <span style={{ background: RED, color: "#fff", fontSize: "11px", fontWeight: 800, borderRadius: "100px", padding: "2px 8px", minWidth: "20px", textAlign: "center" }}>
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: "none", border: "none", color: RED, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Tout marquer lu
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex" }}>
          {(["toutes", "non lues"] as const).map(f => {
            const on = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, background: "none", border: "none", padding: "12px 0", cursor: "pointer", borderBottom: `2px solid ${on ? RED : "transparent"}`, color: on ? TEXT : TEXT2, fontSize: "15px", fontWeight: on ? 700 : 400, transition: "all 0.15s", textTransform: "capitalize" }}>
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", paddingTop: "80px" }}>
          <span style={{ fontSize: "40px" }}>🔔</span>
          <p style={{ color: TEXT2, fontSize: "15px", fontWeight: 700, margin: 0 }}>Aucune alerte</p>
          <p style={{ color: TEXT3, fontSize: "13px", margin: 0 }}>Tu es à jour !</p>
        </div>
      ) : (
        shown.map(a => (
          <div
            key={a.id}
            onClick={() => markRead(a.id)}
            style={{
              display: "flex", gap: "14px", alignItems: "flex-start",
              padding: "16px",
              borderBottom: `1px solid ${BORDER}`,
              background: a.read ? "transparent" : `${TYPE_COLOR[a.type]}08`,
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#0a0a0a")}
            onMouseLeave={e => (e.currentTarget.style.background = a.read ? "transparent" : `${TYPE_COLOR[a.type]}08`)}
          >
            {/* Icon */}
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${TYPE_COLOR[a.type]}18`, border: `1px solid ${TYPE_COLOR[a.type]}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
              {TYPE_ICON[a.type]}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "baseline", flexWrap: "wrap", marginBottom: "4px" }}>
                <span style={{ color: TEXT, fontSize: "14px", fontWeight: 700 }}>{a.from}</span>
                <span style={{ color: TEXT2, fontSize: "14px" }}>{a.excerpt}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: TEXT3, fontSize: "12px" }}>{a.time}</span>
                {!a.read && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: RED, display: "inline-block" }} />}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
