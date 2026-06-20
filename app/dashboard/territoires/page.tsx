"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

const BG     = "#000000";
const SURF   = "#0A0A0A";
const BORDER = "#1C1C1C";
const RED    = "#E0492F";
const GOLD   = "#C9A24B";
const TEXT   = "#E7E9EA";
const TEXT2  = "#71767B";
const TEXT3  = "#3A3A3A";
const GREEN  = "#2ECC71";

const MY_REGION_KEY = "sg_my_region";
type SortMode = "tendance" | "grafters" | "alpha";

// ── Data ──────────────────────────────────────────────────────────────────────

const REGIONS = [
  { id:"idf",   nom:"Île-de-France",              emoji:"🗼", chef:"Paris",       hue:220, zone:"Métropole", depts:["Paris","Seine-et-Marne","Yvelines","Essonne","Hauts-de-Seine","Seine-Saint-Denis","Val-de-Marne","Val-d'Oise"] },
  { id:"paca",  nom:"Provence-Alpes-Côte d'Azur", emoji:"🌊", chef:"Marseille",   hue:200, zone:"Métropole", depts:["Bouches-du-Rhône","Var","Alpes-Maritimes","Vaucluse","Alpes-de-Haute-Provence","Hautes-Alpes"] },
  { id:"auvra", nom:"Auvergne-Rhône-Alpes",       emoji:"⛰️", chef:"Lyon",         hue:160, zone:"Métropole", depts:["Rhône","Isère","Ain","Allier","Ardèche","Cantal","Drôme","Haute-Loire","Haute-Savoie","Loire","Puy-de-Dôme","Savoie"] },
  { id:"nouaq", nom:"Nouvelle-Aquitaine",          emoji:"🍷", chef:"Bordeaux",    hue:340, zone:"Métropole", depts:["Gironde","Dordogne","Lot-et-Garonne","Corrèze","Creuse","Haute-Vienne","Charente","Charente-Maritime","Deux-Sèvres","Vienne","Landes","Pyrénées-Atlantiques"] },
  { id:"occi",  nom:"Occitanie",                   emoji:"☀️", chef:"Toulouse",    hue:40,  zone:"Métropole", depts:["Hérault","Gard","Haute-Garonne","Ariège","Aude","Aveyron","Gers","Lot","Lozère","Hautes-Pyrénées","Pyrénées-Orientales","Tarn","Tarn-et-Garonne"] },
  { id:"hauts", nom:"Hauts-de-France",             emoji:"🏭", chef:"Lille",       hue:200, zone:"Métropole", depts:["Nord","Pas-de-Calais","Somme","Aisne","Oise"] },
  { id:"grand", nom:"Grand Est",                   emoji:"🥨", chef:"Strasbourg",  hue:0,   zone:"Métropole", depts:["Bas-Rhin","Haut-Rhin","Moselle","Meurthe-et-Moselle","Meuse","Vosges","Ardennes","Aube","Haute-Marne","Marne"] },
  { id:"breta", nom:"Bretagne",                    emoji:"⚓", chef:"Rennes",      hue:240, zone:"Métropole", depts:["Finistère","Côtes-d'Armor","Ille-et-Vilaine","Morbihan"] },
  { id:"norma", nom:"Normandie",                   emoji:"🐄", chef:"Rouen",       hue:120, zone:"Métropole", depts:["Seine-Maritime","Eure","Calvados","Manche","Orne"] },
  { id:"pdl",   nom:"Pays de la Loire",            emoji:"🏰", chef:"Nantes",      hue:270, zone:"Métropole", depts:["Loire-Atlantique","Maine-et-Loire","Sarthe","Mayenne","Vendée"] },
  { id:"cvdl",  nom:"Centre-Val de Loire",         emoji:"🌾", chef:"Orléans",     hue:80,  zone:"Métropole", depts:["Loiret","Loir-et-Cher","Indre-et-Loire","Cher","Indre","Eure-et-Loir"] },
  { id:"bfc",   nom:"Bourgogne-Franche-Comté",     emoji:"🍾", chef:"Dijon",       hue:300, zone:"Métropole", depts:["Côte-d'Or","Saône-et-Loire","Yonne","Nièvre","Doubs","Jura","Haute-Saône","Territoire de Belfort"] },
  { id:"cors",  nom:"Corse",                       emoji:"🏝️", chef:"Ajaccio",     hue:170, zone:"Métropole", depts:["Haute-Corse","Corse-du-Sud"] },
  // DOM-TOM
  { id:"guad",  nom:"Guadeloupe",                  emoji:"🌴", chef:"Basse-Terre", hue:140, zone:"DOM-TOM",   depts:["Guadeloupe"] },
  { id:"mart",  nom:"Martinique",                  emoji:"🌺", chef:"Fort-de-France",hue:320,zone:"DOM-TOM",  depts:["Martinique"] },
  { id:"guya",  nom:"Guyane",                      emoji:"🌿", chef:"Cayenne",     hue:100, zone:"DOM-TOM",   depts:["Guyane"] },
  { id:"reun",  nom:"La Réunion",                  emoji:"🏔️", chef:"Saint-Denis", hue:30,  zone:"DOM-TOM",   depts:["La Réunion"] },
  { id:"mayo",  nom:"Mayotte",                     emoji:"🐢", chef:"Mamoudzou",   hue:190, zone:"DOM-TOM",   depts:["Mayotte"] },
];

type Region = typeof REGIONS[0];

const LOCAL_ACTU: Record<string,{title:string;source:string;time:string}[]> = {
  idf:   [{title:"Grand Paris Express : ouverture ligne 15",source:"Paris Info",time:"il y a 2h"},{title:"Budget Île-de-France 2026 adopté",source:"IDF Actus",time:"il y a 5h"}],
  paca:  [{title:"Feux de forêt : vigilance orange dans le Var",source:"PACA Info",time:"il y a 1h"},{title:"Port de Marseille : record de fret",source:"Marseille Éco",time:"il y a 3h"}],
  auvra: [{title:"Tunnel du Mont Blanc : travaux terminés",source:"AuRA Actus",time:"il y a 4h"},{title:"Aurec-sur-Loire : énergie verte",source:"Loire Info",time:"il y a 6h"}],
  nouaq: [{title:"Vendanges 2026 : récolte exceptionnelle en Gironde",source:"Vignoble FR",time:"il y a 2h"},{title:"TGV Bordeaux-Paris : nouveau record",source:"SNCF Actu",time:"il y a 8h"}],
  occi:  [{title:"Toulouse : Airbus commande record A320",source:"Toulouse Biz",time:"il y a 1h"},{title:"Montpellier : Plan eau face à la sécheresse",source:"Occitanie Info",time:"il y a 4h"}],
  hauts: [{title:"Reconstruction post-inondations : plan 200M€",source:"Nord Info",time:"il y a 3h"},{title:"Euratechnologies Lille : 50 nouvelles startups",source:"Tech Nord",time:"il y a 6h"}],
  grand: [{title:"Festival de Strasbourg : 300 000 visiteurs",source:"Grand Est",time:"il y a 2h"},{title:"Moselle : usine hydrogène inaugurée",source:"Moselle Éco",time:"il y a 5h"}],
  breta: [{title:"Marée noire évitée : filet de protection",source:"Bretagne Info",time:"il y a 1h"},{title:"Saint-Malo : record de fréquentation 2026",source:"Tourisme 35",time:"il y a 4h"}],
  norma: [{title:"D-Day 2026 : commémoration internationale",source:"Normandie",time:"il y a 3h"},{title:"Centrale Flamanville : premier kWh EPR",source:"EDF Actu",time:"il y a 7h"}],
  pdl:   [{title:"Nantes : nouveau quartier Bas Chantenay",source:"Nantes Métropole",time:"il y a 2h"},{title:"Vendée Globe 2026 : départ confirmé",source:"Voile FR",time:"il y a 6h"}],
  cvdl:  [{title:"Châteaux Loire Valley : UNESCO renouvelé",source:"Patrimoine FR",time:"il y a 4h"},{title:"Orléans : centre data Microsoft inauguré",source:"Tech Loire",time:"il y a 8h"}],
  bfc:   [{title:"Route des Grands Crus : affluence record",source:"Bourgogne Vins",time:"il y a 3h"},{title:"Dijon : pôle excellence agroalimentaire",source:"BFC Éco",time:"il y a 7h"}],
  cors:  [{title:"Corse : statut d'autonomie en débat",source:"Corse Matin",time:"il y a 1h"},{title:"Ajaccio : aéroport international agrandi",source:"Corse Info",time:"il y a 5h"}],
  guad:  [{title:"Guadeloupe : projet eau potable 2027",source:"Guadeloupe 1ère",time:"il y a 2h"},{title:"Pointe-à-Pitre : nouveau CHU inauguré",source:"Santé Caraïbe",time:"il y a 5h"}],
  mart:  [{title:"Martinique : plan chlordécone en consultation",source:"Martinique 1ère",time:"il y a 3h"},{title:"Fort-de-France : marina étendue",source:"Tourisme Antilles",time:"il y a 6h"}],
  guya:  [{title:"Guyane : lancement Ariane 6 réussi",source:"CNES Actu",time:"il y a 1h"},{title:"Cayenne : école bilingue franco-créole",source:"Éducation Guyane",time:"il y a 4h"}],
  reun:  [{title:"La Réunion : plan énergie 100% renouvelable 2030",source:"Réunion 1ère",time:"il y a 2h"},{title:"Saint-Denis : tramway en service",source:"Mobilité Réunion",time:"il y a 6h"}],
  mayo:  [{title:"Mayotte : plan eau d'urgence prolongé",source:"Mayotte 1ère",time:"il y a 1h"},{title:"Mamoudzou : hôpital de campagne opérationnel",source:"Santé Mayotte",time:"il y a 3h"}],
};

const REGION_TAGS: Record<string,string[]> = {
  idf:   ["#GrandParis","#Métropole","#IDF","#Paris"],
  paca:  ["#Marseille","#PACA","#Mistral","#MerMéditerranée"],
  auvra: ["#Lyon","#Montagne","#Alpes","#AuRA"],
  nouaq: ["#Bordeaux","#Vignoble","#Aquitaine","#Basque"],
  occi:  ["#Toulouse","#Airbus","#Occitanie","#Méditerranée"],
  hauts: ["#Lille","#Nord","#Flandres","#HautsDeFrance"],
  grand: ["#Strasbourg","#Alsace","#GrandEst","#Moselle"],
  breta: ["#Rennes","#Bretagne","#Mer","#Celtique"],
  norma: ["#Rouen","#Normandie","#DDay","#Manche"],
  pdl:   ["#Nantes","#Loire","#PaysDeLaLoire","#Vendée"],
  cvdl:  ["#Orléans","#CentreVal","#Châteaux","#Loire"],
  bfc:   ["#Dijon","#Bourgogne","#Vins","#BFC"],
  cors:  ["#Corse","#Ajaccio","#Autonomie","#IleDeCorse"],
  guad:  ["#Guadeloupe","#DOM","#Antilles","#Caraïbe"],
  mart:  ["#Martinique","#Antilles","#DOM","#Caraïbe"],
  guya:  ["#Guyane","#Amazonie","#Ariane","#Espace"],
  reun:  ["#LaRéunion","#Volcanique","#IndienOcean","#DOM"],
  mayo:  ["#Mayotte","#COM","#IndienOcean","#Outremer"],
};

const LOCAL_GRAFTERS: Record<string,{name:string;grafts:number;hue:number}[]> = {
  idf:   [{name:"Alex M.",grafts:342,hue:220},{name:"Soraya K.",grafts:218,hue:30},{name:"Paul D.",grafts:187,hue:160}],
  paca:  [{name:"Camille R.",grafts:289,hue:200},{name:"Jean-Luc V.",grafts:201,hue:40},{name:"Nadia B.",grafts:155,hue:280}],
  auvra: [{name:"Thomas G.",grafts:231,hue:160},{name:"Marie C.",grafts:178,hue:320},{name:"Eric P.",grafts:143,hue:60}],
  breta: [{name:"Yvonne L.",grafts:267,hue:240},{name:"Maël F.",grafts:195,hue:180},{name:"Corentin B.",grafts:132,hue:40}],
};

const LOCAL_INITIATIVES: Record<string,{title:string;status:"En cours"|"Voté"|"En attente";date:string}[]> = {
  idf:   [{title:"Plan vélo métropolitain 2026-2030",status:"En cours",date:"Mars 2026"},{title:"Zéro déchet Paris 2027",status:"Voté",date:"Fév. 2026"}],
  breta: [{title:"Autonomie énergétique Bretagne",status:"Voté",date:"Avr. 2026"},{title:"Langue bretonne à l'école",status:"En attente",date:"Mai 2026"}],
  occi:  [{title:"Plan sécheresse Occitanie",status:"En cours",date:"Avr. 2026"},{title:"TGV Bordeaux-Toulouse accéléré",status:"Voté",date:"Janv. 2026"}],
  cors:  [{title:"Statut d'autonomie renforcé",status:"En attente",date:"Mai 2026"},{title:"Langue corse co-officielle",status:"En cours",date:"Mars 2026"}],
};

function fakeStats(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffff;
  return {
    grafters: 120 + (n % 4800),
    grafts:   300 + (n % 12000),
    tendance: ["+12%","+8%","+21%","+5%","+17%","+3%","+9%","+14%"][n%8],
    score:    n % 10,
  };
}

function avatarGrad(name: string): string {
  let h = 5381;
  for (const c of name) h = ((h << 5) + h + c.charCodeAt(0)) & 0x7fffffff;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg,hsl(${hue},55%,18%) 0%,hsl(${(hue+45)%360},65%,38%) 100%)`;
}

type GraftLocal = { id:string; content:string; created_at:string; author_name:string; territoire:string|null };

// ── RegionCard ────────────────────────────────────────────────────────────────

function RegionCard({ r, onClick, isMyRegion }: { r: Region; onClick: () => void; isMyRegion: boolean }) {
  const stats = fakeStats(r.id);
  const isPositive = stats.tendance.startsWith("+");
  return (
    <button onClick={onClick} style={{ background:SURF, border:`1px solid ${isMyRegion ? GOLD+"40" : BORDER}`, borderRadius:"16px", overflow:"hidden", textAlign:"left", cursor:"pointer", padding:0, transition:"border-color 0.15s, transform 0.15s, box-shadow 0.15s", width:"100%" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `hsl(${r.hue},60%,30%)`; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.4)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = isMyRegion ? GOLD+"40" : BORDER; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ height:"60px", background:`linear-gradient(135deg,hsl(${r.hue},50%,6%) 0%,hsl(${(r.hue+40)%360},60%,12%) 100%)`, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 12px", position:"relative" }}>
        <span style={{ fontSize:"30px", lineHeight:1, filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}>{r.emoji}</span>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
          {isMyRegion && <span style={{ fontSize:"9px", color:GOLD, background:`${GOLD}20`, border:`1px solid ${GOLD}40`, borderRadius:"100px", padding:"1px 6px", fontWeight:800 }}>MA RÉGION</span>}
          <span style={{ fontSize:"10px", color: isPositive ? GREEN : RED, fontWeight:700, background:`rgba(0,0,0,0.5)`, padding:"2px 7px", borderRadius:"100px" }}>{stats.tendance}</span>
        </div>
      </div>
      <div style={{ padding:"11px 12px 13px" }}>
        <p style={{ color:TEXT, fontSize:"13px", fontWeight:700, margin:"0 0 1px", lineHeight:1.3 }}>{r.nom}</p>
        <p style={{ color:TEXT2, fontSize:"10px", margin:"0 0 8px" }}>{r.chef} · {r.depts.length} dép.</p>
        <div style={{ display:"flex", gap:"10px" }}>
          <span style={{ color:TEXT2, fontSize:"10px" }}>👥 {stats.grafters.toLocaleString("fr-FR")}</span>
          <span style={{ color:TEXT2, fontSize:"10px" }}>📝 {stats.grafts.toLocaleString("fr-FR")}</span>
        </div>
      </div>
    </button>
  );
}

// ── RegionDetail ──────────────────────────────────────────────────────────────

function RegionDetail({ r, onBack, isMyRegion, onToggleMyRegion }: {
  r: Region; onBack: () => void; isMyRegion: boolean; onToggleMyRegion: () => void;
}) {
  const [tab, setTab]                   = useState<"fil"|"infos"|"grafters"|"initiatives"|"depts">("fil");
  const [grafts, setGrafts]             = useState<GraftLocal[]>([]);
  const [loadingGrafts, setLoadingGrafts] = useState(false);

  const stats       = fakeStats(r.id);
  const actu        = LOCAL_ACTU[r.id] ?? [];
  const tags        = REGION_TAGS[r.id] ?? [];
  const topGrafters = LOCAL_GRAFTERS[r.id] ?? [];
  const initiatives = LOCAL_INITIATIVES[r.id] ?? [];

  useEffect(() => {
    if (tab !== "fil") return;
    setLoadingGrafts(true);
    createClient().from("grafts").select("id,content,created_at,author_name,territoire")
      .eq("region", r.nom).order("created_at", { ascending:false }).limit(20)
      .then(({ data }) => { setGrafts((data as GraftLocal[]) ?? []); setLoadingGrafts(false); });
  }, [tab, r.nom]);

  const STATUS_COLOR: Record<string,string> = { "En cours":GOLD, "Voté":GREEN, "En attente":TEXT2 };

  return (
    <div>
      <button onClick={onBack} style={{ background:"none", border:"none", color:RED, fontSize:"13px", cursor:"pointer", marginBottom:"14px", padding:0, display:"flex", alignItems:"center", gap:"5px", fontWeight:600 }}>
        ← Toutes les régions
      </button>

      {/* Hero */}
      <div style={{ borderRadius:"16px", overflow:"hidden", background:`linear-gradient(135deg,hsl(${r.hue},50%,6%) 0%,hsl(${(r.hue+40)%360},60%,14%) 100%)`, padding:"20px", marginBottom:"16px", border:`1px solid hsl(${r.hue},40%,18%)` }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"12px", marginBottom:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <span style={{ fontSize:"40px", lineHeight:1 }}>{r.emoji}</span>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"3px" }}>
                <h2 style={{ color:TEXT, fontSize:"20px", fontWeight:900, margin:0 }}>{r.nom}</h2>
                {isMyRegion && <span style={{ fontSize:"9px", color:GOLD, background:`${GOLD}20`, border:`1px solid ${GOLD}40`, borderRadius:"100px", padding:"2px 7px", fontWeight:800 }}>MA RÉGION</span>}
              </div>
              <p style={{ color:`hsl(${r.hue},60%,65%)`, fontSize:"12px", margin:0 }}>{r.chef} · {r.depts.length} dép. · {r.zone}</p>
            </div>
          </div>
          <button onClick={onToggleMyRegion} style={{ padding:"7px 14px", borderRadius:"100px", fontSize:"11px", fontWeight:700, cursor:"pointer", background: isMyRegion ? `${GOLD}20` : "rgba(0,0,0,0.4)", border:`1px solid ${isMyRegion ? GOLD+"50" : "rgba(255,255,255,0.1)"}`, color: isMyRegion ? GOLD : TEXT2, transition:"all 0.15s", flexShrink:0 }}>
            {isMyRegion ? "★ Ma région" : "☆ Suivre"}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
          {[
            { label:"Grafters", value:stats.grafters.toLocaleString("fr-FR"), icon:"👥" },
            { label:"Grafts",   value:stats.grafts.toLocaleString("fr-FR"),   icon:"📝" },
            { label:"Tendance", value:stats.tendance,                          icon:"📈" },
            { label:"Dép.",     value:String(r.depts.length),                  icon:"🗂️" },
          ].map(s => (
            <div key={s.label} style={{ background:"rgba(0,0,0,0.4)", borderRadius:"10px", padding:"9px 14px", flex:1, minWidth:"70px" }}>
              <div style={{ color:TEXT, fontWeight:800, fontSize:"16px" }}>{s.value}</div>
              <div style={{ color:TEXT2, fontSize:"10px" }}>{s.icon} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Hashtags tendance */}
        {tags.length > 0 && (
          <div style={{ display:"flex", gap:"6px", marginTop:"12px", flexWrap:"wrap" }}>
            {tags.map(tag => (
              <span key={tag} style={{ fontSize:"11px", color:`hsl(${r.hue},70%,65%)`, background:`hsl(${r.hue},40%,8%)`, border:`1px solid hsl(${r.hue},40%,18%)`, borderRadius:"100px", padding:"2px 9px", fontWeight:600 }}>{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display:"flex", borderBottom:`1px solid ${BORDER}`, marginBottom:"14px", overflowX:"auto", scrollbarWidth:"none" }}>
        {([
          ["fil",          "📡 Fil local"],
          ["infos",        "📰 Actus"],
          ["grafters",     "👤 Grafters"],
          ["initiatives",  "🏛️ Initiatives"],
          ["depts",        "🗂️ Dép."],
        ] as [typeof tab, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding:"11px 10px", background:"none", border:"none", borderBottom:`2px solid ${tab===key ? RED : "transparent"}`, color: tab===key ? TEXT : TEXT2, fontSize:"12px", fontWeight: tab===key ? 700 : 400, cursor:"pointer", transition:"all 0.12s", whiteSpace:"nowrap", flexShrink:0 }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Fil local ── */}
      {tab === "fil" && (
        <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", overflow:"hidden" }}>
          {loadingGrafts ? (
            <div style={{ padding:"32px", textAlign:"center", color:TEXT2, fontSize:"13px" }}>Chargement…</div>
          ) : grafts.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 16px" }}>
              <div style={{ fontSize:"36px", marginBottom:"10px" }}>🗺️</div>
              <p style={{ color:TEXT2, fontSize:"13px", margin:"0 0 4px", fontWeight:600 }}>Aucun graft géolocalisé ici</p>
              <p style={{ color:TEXT3, fontSize:"11px", margin:0 }}>Publiez avec 📍 pour apparaître ici.</p>
            </div>
          ) : grafts.map((g, i) => (
            <div key={g.id} style={{ padding:"13px 16px", borderBottom: i<grafts.length-1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"7px", marginBottom:"5px", flexWrap:"wrap" }}>
                <div style={{ width:"26px", height:"26px", borderRadius:"50%", background:avatarGrad(g.author_name), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:800, color:"#fff", flexShrink:0 }}>{g.author_name[0]}</div>
                <Link href={`/dashboard/profil/${g.author_name.toLowerCase()}`} style={{ textDecoration:"none" }}>
                  <span style={{ color:RED, fontSize:"12px", fontWeight:700 }}>@{g.author_name}</span>
                </Link>
                {g.territoire && <span style={{ fontSize:"10px", color:TEXT2 }}>📍 {g.territoire}</span>}
                <span style={{ fontSize:"10px", color:TEXT3, marginLeft:"auto" }}>{new Date(g.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short" })}</span>
              </div>
              <p style={{ color:TEXT, fontSize:"13px", margin:0, lineHeight:1.55, display:"-webkit-box", WebkitLineClamp:3, WebkitBoxOrient:"vertical", overflow:"hidden" } as React.CSSProperties}>{g.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Actus ── */}
      {tab === "infos" && (
        <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", overflow:"hidden" }}>
          {actu.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 16px", color:TEXT2, fontSize:"13px" }}>Aucune actualité locale.</div>
          ) : actu.map((a, i) => (
            <div key={i} style={{ padding:"15px 16px", borderBottom: i<actu.length-1 ? `1px solid ${BORDER}` : "none", cursor:"pointer", transition:"background 0.12s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#0d0d0d")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <p style={{ color:TEXT, fontSize:"13px", fontWeight:600, margin:"0 0 5px", lineHeight:1.4 }}>{a.title}</p>
              <div style={{ display:"flex", gap:"7px" }}>
                <span style={{ fontSize:"10px", color:RED, fontWeight:700 }}>{a.source}</span>
                <span style={{ fontSize:"10px", color:TEXT3 }}>· {a.time}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Top Grafters ── */}
      {tab === "grafters" && (
        <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", overflow:"hidden" }}>
          {topGrafters.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 16px" }}>
              <p style={{ color:TEXT2, fontSize:"13px", margin:0 }}>Aucune donnée locale disponible.</p>
            </div>
          ) : topGrafters.map((g, i) => (
            <div key={g.name} style={{ display:"flex", alignItems:"center", gap:"12px", padding:"13px 16px", borderBottom: i<topGrafters.length-1 ? `1px solid ${BORDER}` : "none" }}>
              <span style={{ color:TEXT3, fontSize:"11px", fontWeight:800, width:"18px" }}>#{i+1}</span>
              <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:avatarGrad(g.name), display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:800, color:"#fff", flexShrink:0 }}>{g.name[0]}</div>
              <div style={{ flex:1 }}>
                <p style={{ color:TEXT, fontSize:"13px", fontWeight:700, margin:0 }}>{g.name}</p>
                <p style={{ color:TEXT2, fontSize:"11px", margin:0 }}>📍 {r.nom}</p>
              </div>
              <span style={{ background:`${RED}15`, color:RED, fontSize:"11px", fontWeight:700, padding:"3px 9px", borderRadius:"100px" }}>{g.grafts} grafts</span>
            </div>
          ))}
          <div style={{ padding:"14px 16px", textAlign:"center", borderTop:`1px solid ${BORDER}` }}>
            <Link href="/dashboard/recherche" style={{ color:RED, fontSize:"12px", fontWeight:700, textDecoration:"none" }}>Chercher d'autres Grafters →</Link>
          </div>
        </div>
      )}

      {/* ── Initiatives ── */}
      {tab === "initiatives" && (
        <div>
          {initiatives.length === 0 ? (
            <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"14px", padding:"40px 16px", textAlign:"center" }}>
              <p style={{ color:TEXT2, fontSize:"13px", margin:0 }}>Aucune initiative enregistrée pour cette région.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {initiatives.map((init, i) => (
                <div key={i} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"14px 16px", display:"flex", alignItems:"center", gap:"12px" }}>
                  <div style={{ flex:1 }}>
                    <p style={{ color:TEXT, fontSize:"13px", fontWeight:700, margin:"0 0 4px" }}>{init.title}</p>
                    <p style={{ color:TEXT2, fontSize:"11px", margin:0 }}>{init.date}</p>
                  </div>
                  <span style={{ fontSize:"10px", fontWeight:700, color:STATUS_COLOR[init.status]||TEXT2, background:STATUS_COLOR[init.status]+"15", border:`1px solid ${STATUS_COLOR[init.status]}30`, borderRadius:"100px", padding:"3px 9px", flexShrink:0 }}>
                    {init.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop:"12px", background:SURF, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"14px 16px", textAlign:"center" }}>
            <p style={{ color:TEXT2, fontSize:"12px", margin:"0 0 8px" }}>Une initiative locale à proposer ?</p>
            <Link href="/dashboard/registre" style={{ color:GOLD, fontWeight:700, fontSize:"12px", textDecoration:"none" }}>Consigner au Registre →</Link>
          </div>
        </div>
      )}

      {/* ── Départements ── */}
      {tab === "depts" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"8px" }}>
          {r.depts.map(dept => (
            <div key={dept} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"12px", padding:"13px", cursor:"pointer", transition:"border-color 0.15s, background 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = RED; e.currentTarget.style.background = "#0d0d0d"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = SURF; }}
            >
              <p style={{ color:TEXT, fontSize:"12px", fontWeight:600, margin:"0 0 3px" }}>{dept}</p>
              <p style={{ color:TEXT2, fontSize:"10px", margin:0 }}>{r.nom}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TerritoiresPage() {
  const [selected,  setSelected]  = useState<string|null>(null);
  const [search,    setSearch]    = useState("");
  const [sort,      setSort]      = useState<SortMode>("grafters");
  const [myRegion,  setMyRegion]  = useState<string|null>(null);
  const [zoneFilter,setZoneFilter]= useState<"Tous"|"Métropole"|"DOM-TOM">("Tous");

  useEffect(() => {
    try { setMyRegion(localStorage.getItem(MY_REGION_KEY)); } catch {}
  }, []);

  const toggleMyRegion = (id: string) => {
    const next = myRegion === id ? null : id;
    setMyRegion(next);
    try { if (next) localStorage.setItem(MY_REGION_KEY,next); else localStorage.removeItem(MY_REGION_KEY); } catch {}
  };

  const filtered = useMemo(() => {
    let list = REGIONS.filter(r => {
      const q = search.toLowerCase();
      const matchS = !q || r.nom.toLowerCase().includes(q) || r.chef.toLowerCase().includes(q) || r.depts.some(d => d.toLowerCase().includes(q));
      const matchZ = zoneFilter==="Tous" || r.zone===zoneFilter;
      return matchS && matchZ;
    });
    if (sort==="grafters") list = [...list].sort((a,b) => fakeStats(b.id).grafters - fakeStats(a.id).grafters);
    else if (sort==="alpha") list = [...list].sort((a,b) => a.nom.localeCompare(b.nom,"fr"));
    else list = [...list].sort((a,b) => parseFloat(fakeStats(b.id).tendance) - parseFloat(fakeStats(a.id).tendance));
    return list;
  }, [search, sort, zoneFilter]);

  const region   = REGIONS.find(r => r.id === selected);
  const totalGrafters = REGIONS.reduce((acc, r) => acc + fakeStats(r.id).grafters, 0);

  return (
    <>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { display:none; }`}</style>
      <div style={{ maxWidth:"700px", margin:"0 auto", paddingBottom:"80px", fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* Header sticky */}
        <div style={{ position:"sticky", top:0, zIndex:10, background:`${BG}EE`, backdropFilter:"blur(12px)", borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px 10px", gap:"10px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:`linear-gradient(135deg,#1a6b3a 0%,#2d9b55 100%)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px" }}>🗺️</div>
              <div>
                <h1 style={{ color:TEXT, fontSize:"18px", fontWeight:900, margin:"0 0 1px" }}>Territoires</h1>
                <p style={{ color:TEXT2, fontSize:"11px", margin:0 }}>
                  {selected ? region?.nom : `${REGIONS.length} régions · ${totalGrafters.toLocaleString("fr-FR")} Grafters`}
                </p>
              </div>
            </div>
          </div>

          {/* Recherche + contrôles (liste seulement) */}
          {!selected && (
            <>
              <div style={{ padding:"0 16px 8px", display:"flex", gap:"8px" }}>
                <div style={{ position:"relative", flex:1 }}>
                  <span style={{ position:"absolute", left:"12px", top:"50%", transform:"translateY(-50%)", fontSize:"13px", pointerEvents:"none" }}>🔎</span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Région, ville, département…"
                    style={{ width:"100%", padding:"8px 36px 8px 32px", background:SURF, border:`1px solid ${BORDER}`, borderRadius:"100px", color:TEXT, fontSize:"12px", outline:"none", fontFamily:"inherit", transition:"border-color 0.15s" }}
                    onFocus={e => (e.currentTarget.style.borderColor = RED+"60")}
                    onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  />
                  {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:"10px", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:TEXT2, cursor:"pointer", fontSize:"15px" }}>×</button>}
                </div>
                <select value={sort} onChange={e => setSort(e.target.value as SortMode)} style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:"8px", color:TEXT2, fontSize:"11px", padding:"5px 8px", outline:"none", cursor:"pointer", flexShrink:0 }}>
                  <option value="grafters">👥 Grafters</option>
                  <option value="tendance">📈 Tendance</option>
                  <option value="alpha">🔤 A–Z</option>
                </select>
              </div>

              {/* Zone filter */}
              <div style={{ display:"flex", gap:"5px", padding:"0 16px 10px" }}>
                {(["Tous","Métropole","DOM-TOM"] as const).map(z => (
                  <button key={z} onClick={() => setZoneFilter(z)} style={{ padding:"4px 12px", borderRadius:"100px", fontSize:"11px", fontWeight:600, cursor:"pointer", border:`1px solid ${zoneFilter===z ? RED : BORDER}`, background: zoneFilter===z ? RED : "transparent", color: zoneFilter===z ? "#fff" : TEXT2, transition:"all 0.12s" }}>
                    {z}
                  </button>
                ))}
                {myRegion && (
                  <button onClick={() => { const r = REGIONS.find(x => x.id===myRegion); if (r) setSelected(r.id); }} style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:"100px", fontSize:"11px", fontWeight:700, cursor:"pointer", border:`1px solid ${GOLD}40`, background:`${GOLD}15`, color:GOLD, transition:"all 0.12s" }}>
                    ★ Ma région
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ padding:"12px 16px" }}>
          {/* Liste */}
          {!selected && (
            filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"60px 20px" }}>
                <span style={{ fontSize:"40px" }}>🗺️</span>
                <p style={{ color:TEXT2, fontSize:"13px", marginTop:"12px" }}>Aucune région trouvée pour "{search}"</p>
              </div>
            ) : (
              <>
                {myRegion && !search && (
                  <div style={{ marginBottom:"16px" }}>
                    <p style={{ color:TEXT2, fontSize:"10px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:"8px" }}>★ Ma région</p>
                    {(() => { const r = REGIONS.find(x => x.id===myRegion); return r ? <RegionCard r={r} onClick={() => setSelected(r.id)} isMyRegion={true} /> : null; })()}
                  </div>
                )}
                {(!myRegion || search) && null}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))", gap:"10px" }}>
                  {filtered.filter(r => r.id!==myRegion || search).map(r => (
                    <RegionCard key={r.id} r={r} onClick={() => setSelected(r.id)} isMyRegion={myRegion===r.id} />
                  ))}
                </div>
              </>
            )
          )}

          {/* Détail */}
          {selected && region && (
            <RegionDetail
              r={region}
              onBack={() => { setSelected(null); }}
              isMyRegion={myRegion===region.id}
              onToggleMyRegion={() => toggleMyRegion(region.id)}
            />
          )}
        </div>
      </div>
    </>
  );
}
