"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";

// ── Data ──────────────────────────────────────────────────────────────────────

const REGIONS = [
  { id: "idf",   nom: "Île-de-France",              emoji: "🗼", chef: "Paris",       hue: 220, depts: ["Paris", "Seine-et-Marne", "Yvelines", "Essonne", "Hauts-de-Seine", "Seine-Saint-Denis", "Val-de-Marne", "Val-d'Oise"] },
  { id: "paca",  nom: "Provence-Alpes-Côte d'Azur", emoji: "🌊", chef: "Marseille",   hue: 200, depts: ["Bouches-du-Rhône", "Var", "Alpes-Maritimes", "Vaucluse", "Alpes-de-Haute-Provence", "Hautes-Alpes"] },
  { id: "auvra", nom: "Auvergne-Rhône-Alpes",       emoji: "⛰️", chef: "Lyon",         hue: 160, depts: ["Rhône", "Isère", "Ain", "Allier", "Ardèche", "Cantal", "Drôme", "Haute-Loire", "Haute-Savoie", "Loire", "Puy-de-Dôme", "Savoie"] },
  { id: "nouaq", nom: "Nouvelle-Aquitaine",          emoji: "🍷", chef: "Bordeaux",    hue: 340, depts: ["Gironde", "Dordogne", "Lot-et-Garonne", "Corrèze", "Creuse", "Haute-Vienne", "Charente", "Charente-Maritime", "Deux-Sèvres", "Vienne", "Landes", "Pyrénées-Atlantiques"] },
  { id: "occi",  nom: "Occitanie",                   emoji: "☀️", chef: "Toulouse",    hue: 40,  depts: ["Hérault", "Gard", "Haute-Garonne", "Ariège", "Aude", "Aveyron", "Gers", "Lot", "Lozère", "Hautes-Pyrénées", "Pyrénées-Orientales", "Tarn", "Tarn-et-Garonne"] },
  { id: "hauts", nom: "Hauts-de-France",             emoji: "🏭", chef: "Lille",       hue: 200, depts: ["Nord", "Pas-de-Calais", "Somme", "Aisne", "Oise"] },
  { id: "grand", nom: "Grand Est",                   emoji: "🥨", chef: "Strasbourg",  hue: 0,   depts: ["Bas-Rhin", "Haut-Rhin", "Moselle", "Meurthe-et-Moselle", "Meuse", "Vosges", "Ardennes", "Aube", "Haute-Marne", "Marne"] },
  { id: "breta", nom: "Bretagne",                    emoji: "⚓", chef: "Rennes",      hue: 240, depts: ["Finistère", "Côtes-d'Armor", "Ille-et-Vilaine", "Morbihan"] },
  { id: "norma", nom: "Normandie",                   emoji: "🐄", chef: "Rouen",       hue: 120, depts: ["Seine-Maritime", "Eure", "Calvados", "Manche", "Orne"] },
  { id: "pdl",   nom: "Pays de la Loire",            emoji: "🏰", chef: "Nantes",      hue: 270, depts: ["Loire-Atlantique", "Maine-et-Loire", "Sarthe", "Mayenne", "Vendée"] },
  { id: "cvdl",  nom: "Centre-Val de Loire",         emoji: "🌾", chef: "Orléans",     hue: 80,  depts: ["Loiret", "Loir-et-Cher", "Indre-et-Loire", "Cher", "Indre", "Eure-et-Loir"] },
  { id: "bfc",   nom: "Bourgogne-Franche-Comté",     emoji: "🍾", chef: "Dijon",       hue: 300, depts: ["Côte-d'Or", "Saône-et-Loire", "Yonne", "Nièvre", "Doubs", "Jura", "Haute-Saône", "Territoire de Belfort"] },
  { id: "cors",  nom: "Corse",                       emoji: "🏝️", chef: "Ajaccio",     hue: 170, depts: ["Haute-Corse", "Corse-du-Sud"] },
];

type Region = typeof REGIONS[0];

const LOCAL_ACTU: Record<string, { title: string; source: string; time: string }[]> = {
  idf:   [{ title: "Grand Paris Express : ouverture ligne 15", source: "Paris Info", time: "il y a 2h" }, { title: "Budget Île-de-France 2026 adopté", source: "IDF Actus", time: "il y a 5h" }],
  paca:  [{ title: "Feux de forêt : vigilance orange dans le Var", source: "PACA Info", time: "il y a 1h" }, { title: "Port de Marseille : record de fret", source: "Marseille Eco", time: "il y a 3h" }],
  auvra: [{ title: "Tunnel du Mont Blanc : travaux terminés", source: "AuRA Actus", time: "il y a 4h" }, { title: "Sommet Aurec-sur-Loire : énergie verte", source: "Loire Info", time: "il y a 6h" }],
  nouaq: [{ title: "Vendanges 2026 : récolte exceptionnelle en Gironde", source: "Vignoble FR", time: "il y a 2h" }, { title: "TGV Bordeaux-Paris : nouveau record", source: "SNCF Actu", time: "il y a 8h" }],
  occi:  [{ title: "Toulouse : Airbus commande record A320", source: "Toulouse Biz", time: "il y a 1h" }, { title: "Montpellier : Plan eau face à la sécheresse", source: "Occitanie Info", time: "il y a 4h" }],
  hauts: [{ title: "Reconstruction post-inondations : plan 200M€", source: "Nord Info", time: "il y a 3h" }, { title: "Euratechnologies Lille : 50 nouvelles startups", time: "il y a 6h", source: "Tech Nord" }],
  grand: [{ title: "Festival de Strasbourg : 300 000 visiteurs", source: "Grand Est", time: "il y a 2h" }, { title: "Moselle : usine hydrogène inaugurée", source: "Moselle Eco", time: "il y a 5h" }],
  breta: [{ title: "Marée noire évitée : filet de protection", source: "Bretagne Info", time: "il y a 1h" }, { title: "St-Malo : record de fréquentation 2026", source: "Tourisme 35", time: "il y a 4h" }],
  norma: [{ title: "D-Day 2026 : commémoration internationale", source: "Normandie", time: "il y a 3h" }, { title: "Centrale Flamanville : premier kWh EPR", source: "EDF Actu", time: "il y a 7h" }],
  pdl:   [{ title: "Nantes : nouveau quartier Bas Chantenay", source: "Nantes Métropole", time: "il y a 2h" }, { title: "Vendée Globe 2026 : départ confirmé", source: "Voile FR", time: "il y a 6h" }],
  cvdl:  [{ title: "Châteaux Loire Valley : UNESCO renouvelé", source: "Patrimoine FR", time: "il y a 4h" }, { title: "Orléans : centre data Microsoft inauguré", source: "Tech Loire", time: "il y a 8h" }],
  bfc:   [{ title: "Route des Grands Crus : affluence record", source: "Bourgogne Vins", time: "il y a 3h" }, { title: "Dijon : pôle excellence agroalimentaire", source: "BFC Eco", time: "il y a 7h" }],
  cors:  [{ title: "Corse : statut d'autonomie en débat", source: "Corse Matin", time: "il y a 1h" }, { title: "Ajaccio : aéroport international agrandi", source: "Corse Info", time: "il y a 5h" }],
};

function fakeStats(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  return { grafters: 120 + (n % 4800), grafts: 300 + (n % 12000), tendance: ["+12%", "+8%", "+21%", "+5%", "+17%", "+3%"][n % 6] };
}

type GraftLocal = { id: string; content: string; created_at: string; author_name: string; territoire: string | null };

// ── RegionCard ────────────────────────────────────────────────────────────────

function RegionCard({ r, onClick }: { r: Region; onClick: () => void }) {
  const stats = fakeStats(r.id);
  return (
    <button
      onClick={onClick}
      style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden", textAlign: "left", cursor: "pointer", padding: 0, transition: "border-color 0.15s, transform 0.15s", width: "100%" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `hsl(${r.hue},60%,30%)`; e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = "none"; }}
    >
      {/* Bannière */}
      <div style={{ height: "56px", background: `linear-gradient(135deg,hsl(${r.hue},50%,6%) 0%,hsl(${(r.hue+40)%360},60%,12%) 100%)`, display: "flex", alignItems: "flex-end", padding: "0 14px 10px", position: "relative" }}>
        <span style={{ fontSize: "28px", lineHeight: 1, filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}>{r.emoji}</span>
        <span style={{ marginLeft: "auto", fontSize: "10px", color: `hsl(${r.hue},70%,60%)`, fontWeight: 700, background: `hsl(${r.hue},40%,8%)`, padding: "2px 8px", borderRadius: "100px", border: `1px solid hsl(${r.hue},40%,20%)` }}>
          {stats.tendance}
        </span>
      </div>

      <div style={{ padding: "12px 14px 14px" }}>
        <p style={{ color: TEXT, fontSize: "14px", fontWeight: 700, margin: "0 0 2px", lineHeight: 1.3 }}>{r.nom}</p>
        <p style={{ color: TEXT2, fontSize: "11px", margin: "0 0 10px" }}>Chef-lieu : {r.chef}</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <div><span style={{ color: TEXT, fontWeight: 700, fontSize: "13px" }}>{stats.grafters.toLocaleString("fr-FR")}</span><span style={{ color: TEXT2, fontSize: "10px", marginLeft: "3px" }}>Grafters</span></div>
          <div><span style={{ color: TEXT, fontWeight: 700, fontSize: "13px" }}>{r.depts.length}</span><span style={{ color: TEXT2, fontSize: "10px", marginLeft: "3px" }}>dép.</span></div>
        </div>
      </div>
    </button>
  );
}

// ── RegionDetail ──────────────────────────────────────────────────────────────

function RegionDetail({ r, onBack }: { r: Region; onBack: () => void }) {
  const [tab,          setTab]          = useState<"fil" | "infos" | "depts">("fil");
  const [grafts,       setGrafts]       = useState<GraftLocal[]>([]);
  const [loadingGrafts,setLoadingGrafts] = useState(false);
  const stats = fakeStats(r.id);
  const actu  = LOCAL_ACTU[r.id] ?? [];

  useEffect(() => {
    if (tab !== "fil") return;
    setLoadingGrafts(true);
    const supabase = createClient();
    supabase.from("grafts").select("id,content,created_at,author_name,territoire")
      .eq("region", r.nom).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => { setGrafts((data as GraftLocal[]) ?? []); setLoadingGrafts(false); });
  }, [tab, r.nom]);

  return (
    <div>
      {/* Breadcrumb */}
      <button onClick={onBack} style={{ background: "none", border: "none", color: RED, fontSize: "14px", cursor: "pointer", marginBottom: "16px", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}>
        ← Toutes les régions
      </button>

      {/* Hero */}
      <div style={{ borderRadius: "16px", overflow: "hidden", background: `linear-gradient(135deg,hsl(${r.hue},50%,6%) 0%,hsl(${(r.hue+40)%360},60%,14%) 100%)`, padding: "24px 20px", marginBottom: "20px", border: `1px solid hsl(${r.hue},40%,18%)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <span style={{ fontSize: "44px", lineHeight: 1 }}>{r.emoji}</span>
          <div>
            <h2 style={{ color: TEXT, fontSize: "22px", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.3px" }}>{r.nom}</h2>
            <p style={{ color: `hsl(${r.hue},60%,65%)`, fontSize: "13px", margin: 0 }}>Chef-lieu : {r.chef} · {r.depts.length} départements</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { label: "Grafters", value: stats.grafters.toLocaleString("fr-FR") },
            { label: "Grafts", value: stats.grafts.toLocaleString("fr-FR") },
            { label: "Tendance", value: stats.tendance },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "rgba(0,0,0,0.35)", borderRadius: "10px", padding: "10px 16px" }}>
              <div style={{ color: TEXT, fontWeight: 800, fontSize: "18px" }}>{value}</div>
              <div style={{ color: TEXT2, fontSize: "11px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: "16px" }}>
        {([["fil", "📡 Fil local"], ["infos", "📰 Actus"], ["depts", "🗂️ Départements"]] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: "12px 8px", background: "none", border: "none", borderBottom: `2px solid ${tab === key ? RED : "transparent"}`, color: tab === key ? TEXT : TEXT2, fontSize: "13px", fontWeight: tab === key ? 700 : 400, cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Fil */}
      {tab === "fil" && (
        <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
          {loadingGrafts ? (
            <div style={{ padding: "32px", textAlign: "center", color: TEXT2, fontSize: "13px" }}>Chargement…</div>
          ) : grafts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🗺️</div>
              <p style={{ color: TEXT2, fontSize: "14px", margin: "0 0 4px", fontWeight: 600 }}>Aucun graft géolocalisé ici</p>
              <p style={{ color: "#333", fontSize: "12px", margin: 0 }}>Publiez avec 📍 pour apparaître ici.</p>
            </div>
          ) : grafts.map((g, i) => (
            <div key={g.id} style={{ padding: "14px 16px", borderBottom: i < grafts.length - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration: "none" }}>
                  <span style={{ color: RED, fontSize: "13px", fontWeight: 700 }}>@{g.author_name}</span>
                </Link>
                {g.territoire && <span style={{ fontSize: "11px", color: TEXT2 }}>📍 {g.territoire}</span>}
                <span style={{ fontSize: "11px", color: "#333", marginLeft: "auto" }}>
                  {new Date(g.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p style={{ color: TEXT, fontSize: "14px", margin: 0, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Actus */}
      {tab === "infos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "14px", overflow: "hidden" }}>
          {actu.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 16px", color: TEXT2, fontSize: "13px" }}>Aucune actualité locale.</div>
          ) : actu.map((a, i) => (
            <div key={i} style={{ padding: "16px", borderBottom: i < actu.length - 1 ? `1px solid ${BORDER}` : "none", cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <p style={{ color: TEXT, fontSize: "14px", fontWeight: 600, margin: "0 0 5px", lineHeight: 1.4 }}>{a.title}</p>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: RED, fontWeight: 700 }}>{a.source}</span>
                <span style={{ fontSize: "11px", color: "#333" }}>· {a.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Départements */}
      {tab === "depts" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "8px" }}>
          {r.depts.map(dept => {
            const slug = dept.toLowerCase().replace(/[\s'éèêàâùûîôäëïüÿç]/g, c => ({ é:"e",è:"e",ê:"e",à:"a",â:"a",ù:"u",û:"u",î:"i",ô:"o",ä:"a",ë:"e",ï:"i",ü:"u",ÿ:"y",ç:"c"," ":"-","'":"-" }[c] ?? c));
            return (
              <Link key={dept} href={`/dashboard/territoires/${r.id}/${slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: SURF, border: `1px solid ${BORDER}`, borderRadius: "12px", padding: "14px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.background = "#0d0d0d"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = SURF; }}
                >
                  <p style={{ color: TEXT, fontSize: "13px", fontWeight: 600, margin: "0 0 4px" }}>{dept}</p>
                  <p style={{ color: TEXT2, fontSize: "11px", margin: 0 }}>Voir le fil →</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TerritoiresPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search,   setSearch]   = useState("");

  const region = REGIONS.find(r => r.id === selected);

  const filtered = REGIONS.filter(r =>
    r.nom.toLowerCase().includes(search.toLowerCase()) ||
    r.chef.toLowerCase().includes(search.toLowerCase()) ||
    r.depts.some(d => d.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <style>{`* { box-sizing: border-box; }`}</style>
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 0 80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}`, padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: selected ? "0" : "12px" }}>
            <div>
              <h1 style={{ color: TEXT, fontSize: "20px", fontWeight: 900, margin: "0 0 2px", letterSpacing: "-0.3px" }}>🗺️ Territoires</h1>
              {!selected && <p style={{ color: TEXT2, fontSize: "12px", margin: 0 }}>Votre France, région par région</p>}
            </div>
          </div>

          {/* Recherche (visible seulement sur la liste) */}
          {!selected && (
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", fontSize: "15px", pointerEvents: "none" }}>🔎</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Région, ville, département…"
                style={{ width: "100%", padding: "10px 14px 10px 40px", background: SURF, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit" }}
              />
            </div>
          )}
        </div>

        <div style={{ padding: "16px" }}>

          {/* Vue liste */}
          {!selected && (
            <>
              {filtered.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <span style={{ fontSize: "40px" }}>🗺️</span>
                  <p style={{ color: TEXT2, fontSize: "14px", marginTop: "12px" }}>Aucune région trouvée pour "{search}"</p>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: "10px" }}>
                  {filtered.map(r => <RegionCard key={r.id} r={r} onClick={() => setSelected(r.id)} />)}
                </div>
              )}
            </>
          )}

          {/* Vue détail région */}
          {selected && region && <RegionDetail r={region} onBack={() => { setSelected(null); setSearch(""); }} />}
        </div>
      </div>
    </>
  );
}
