"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

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

type GraftLocal = { id: string; content: string; created_at: string; author_name: string; territoire: string | null };

export default function TerritoiresPage() {
  const [selected,     setSelected]     = useState<string | null>(null);
  const [graftsRegion, setGraftsRegion] = useState<GraftLocal[]>([]);
  const [loadingGrafts,setLoadingGrafts]= useState(false);

  const region = REGIONS.find(r => r.id === selected);

  useEffect(() => {
    if (!region) { setGraftsRegion([]); return; }
    setLoadingGrafts(true);
    const supabase = createClient();
    supabase
      .from("grafts")
      .select("id, content, created_at, author_name, territoire")
      .eq("region", region.nom)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => { setGraftsRegion((data as GraftLocal[]) ?? []); setLoadingGrafts(false); });
  }, [selected]);

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

          {/* Fil de la région */}
          <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: TEXT, padding: "16px 16px 12px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: "8px" }}>
              📡 Fil de la région
              {graftsRegion.length > 0 && (
                <span style={{ fontSize: "11px", color: TEXT2, fontWeight: 400 }}>{graftsRegion.length} graft{graftsRegion.length > 1 ? "s" : ""}</span>
              )}
            </div>
            {loadingGrafts ? (
              <div style={{ padding: "28px", textAlign: "center", color: TEXT2, fontSize: "13px" }}>Chargement…</div>
            ) : graftsRegion.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>🗺️</div>
                <p style={{ color: TEXT2, fontSize: "13px", margin: "0 0 4px" }}>
                  Aucun graft géolocalisé en {region.nom} pour l'instant.
                </p>
                <p style={{ color: MUTED, fontSize: "11px", margin: 0 }}>
                  Publiez avec 📍 pour apparaître ici.
                </p>
              </div>
            ) : (
              graftsRegion.map((g, i) => (
                <div key={g.id} style={{ padding: "14px 16px", borderBottom: i < graftsRegion.length - 1 ? `1px solid ${BORDER}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
                      <span style={{ color: RED, fontSize: "13px", fontWeight: 700 }}>@{g.author_name}</span>
                    </Link>
                    {g.territoire && (
                      <span style={{ fontSize: "11px", color: TEXT2 }}>📍 {g.territoire}</span>
                    )}
                    <span style={{ fontSize: "11px", color: MUTED, marginLeft: "auto" }}>
                      {new Date(g.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p style={{ color: TEXT, fontSize: "14px", margin: 0, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {g.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
