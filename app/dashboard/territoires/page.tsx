"use client";
import { useState } from "react";
import Link from "next/link";

const REGIONS = [
  { id: "idf",   nom: "Île-de-France",              emoji: "🗼", depts: ["Paris", "Seine-et-Marne", "Yvelines", "Essonne", "Hauts-de-Seine", "Seine-Saint-Denis", "Val-de-Marne", "Val-d'Oise"] },
  { id: "paca",  nom: "Provence-Alpes-Côte d'Azur", emoji: "🌊", depts: ["Bouches-du-Rhône", "Var", "Alpes-Maritimes", "Vaucluse", "Alpes-de-Haute-Provence", "Hautes-Alpes"] },
  { id: "auvra", nom: "Auvergne-Rhône-Alpes",       emoji: "⛰️", depts: ["Rhône", "Isère", "Ain", "Allier", "Ardèche", "Cantal", "Drôme", "Haute-Loire", "Haute-Savoie", "Loire", "Puy-de-Dôme", "Savoie"] },
  { id: "nouaq", nom: "Nouvelle-Aquitaine",          emoji: "🍷", depts: ["Gironde", "Dordogne", "Lot-et-Garonne", "Corrèze", "Creuse", "Haute-Vienne", "Charente", "Charente-Maritime", "Deux-Sèvres", "Vienne", "Landes", "Pyrénées-Atlantiques"] },
  { id: "occi",  nom: "Occitanie",                   emoji: "☀️", depts: ["Hérault", "Gard", "Haute-Garonne", "Ariège", "Aude", "Aveyron", "Gers", "Lot", "Lozère", "Hautes-Pyrénées", "Pyrénées-Orientales", "Tarn", "Tarn-et-Garonne"] },
  { id: "hauts", nom: "Hauts-de-France",             emoji: "🏭", depts: ["Nord", "Pas-de-Calais", "Somme", "Aisne", "Oise"] },
  { id: "grand", nom: "Grand Est",                   emoji: "🥨", depts: ["Bas-Rhin", "Haut-Rhin", "Moselle", "Meurthe-et-Moselle", "Meuse", "Vosges", "Ardennes", "Aube", "Haute-Marne", "Marne"] },
  { id: "breta", nom: "Bretagne",                    emoji: "⚓", depts: ["Finistère", "Côtes-d'Armor", "Ille-et-Vilaine", "Morbihan"] },
  { id: "norma", nom: "Normandie",                   emoji: "🐄", depts: ["Seine-Maritime", "Eure", "Calvados", "Manche", "Orne"] },
  { id: "pdl",   nom: "Pays de la Loire",            emoji: "🏰", depts: ["Loire-Atlantique", "Maine-et-Loire", "Sarthe", "Mayenne", "Vendée"] },
  { id: "cvdl",  nom: "Centre-Val de Loire",         emoji: "🌾", depts: ["Loiret", "Loir-et-Cher", "Indre-et-Loire", "Cher", "Indre", "Eure-et-Loir"] },
  { id: "bfc",   nom: "Bourgogne-Franche-Comté",     emoji: "🍾", depts: ["Côte-d'Or", "Saône-et-Loire", "Yonne", "Nièvre", "Doubs", "Jura", "Haute-Saône", "Territoire de Belfort"] },
  { id: "cors",  nom: "Corse",                       emoji: "🏝️", depts: ["Haute-Corse", "Corse-du-Sud"] },
];

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const MUTED  = "#333333";

export default function TerritoiresPage() {
  const [selected, setSelected] = useState<string | null>(null);

  const region = REGIONS.find(r => r.id === selected);

  return (
    <div style={{
      maxWidth: "600px", margin: "0 auto", padding: "24px 16px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "28px", paddingBottom: "20px", borderBottom: `1px solid ${BORDER}` }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: TEXT, margin: "0 0 4px", letterSpacing: "-0.3px" }}>
          🗺️ Territoires
        </h1>
        <p style={{ color: TEXT2, fontSize: "13px", margin: 0 }}>Votre France, région par région</p>
      </div>

      {/* ── Vue régions ── */}
      {!selected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
          {REGIONS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelected(r.id)}
              style={{
                background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px",
                padding: "16px 14px", textAlign: "left", cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#444"; e.currentTarget.style.background = "#0f0f0f"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = SURF; }}
            >
              <div style={{ fontSize: "26px", marginBottom: "10px", lineHeight: 1 }}>{r.emoji}</div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT, lineHeight: 1.35 }}>{r.nom}</div>
              <div style={{ fontSize: "11px", color: TEXT2, marginTop: "5px" }}>{r.depts.length} département{r.depts.length > 1 ? "s" : ""}</div>
            </button>
          ))}
        </div>
      )}

      {/* ── Vue région sélectionnée ── */}
      {selected && region && (
        <div>
          <button
            onClick={() => setSelected(null)}
            style={{ background: "none", border: "none", color: RED, fontSize: "14px", cursor: "pointer", marginBottom: "24px", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}
          >
            ← Toutes les régions
          </button>

          {/* Titre région */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "28px" }}>
            <span style={{ fontSize: "36px", lineHeight: 1 }}>{region.emoji}</span>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: TEXT, margin: "0 0 2px", letterSpacing: "-0.3px" }}>
                {region.nom}
              </h2>
              <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>
                {region.depts.length} département{region.depts.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Départements */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ fontSize: "10px", color: TEXT2, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px" }}>
              Départements
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {region.depts.map(dept => (
                <Link
                  key={dept}
                  href={`/dashboard/territoires/${selected}/${dept.toLowerCase().replace(/[\s']/g, "-")}`}
                  style={{
                    padding: "8px 16px", borderRadius: "100px",
                    background: SURF, border: `1px solid ${BORDER}`,
                    color: TEXT2, fontSize: "13px", textDecoration: "none",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.color = TEXT; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; }}
                >
                  {dept}
                </Link>
              ))}
            </div>
          </div>

          {/* Fil de la région (placeholder) */}
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "20px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              📡 Fil de la région
            </div>
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div style={{ fontSize: "32px", marginBottom: "10px" }}>🗺️</div>
              <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 6px" }}>
                Les grafts géotagués de {region.nom} apparaîtront ici.
              </p>
              <p style={{ color: MUTED, fontSize: "11px", margin: 0 }}>
                Fonctionnalité disponible après le lancement
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
