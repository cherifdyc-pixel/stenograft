"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const BG      = "#000000";
const SURFACE = "#0A0A0A";
const BORDER  = "#1C1C1C";
const RED     = "#E0492F";
const GOLD    = "#C9A24B";
const TEXT    = "#E7E9EA";
const TEXT2   = "#71767B";
const TEXT3   = "#3A3A3A";

type Alerte = { id: string; mot_cle: string; actif: boolean; created_at: string };
type Graft  = { id: string; content: string; created_at: string; author_name: string };

const SUGGESTIONS: { label: string; cat: string }[] = [
  { label: "assemblée nationale", cat: "Politique" },
  { label: "budget",              cat: "Politique" },
  { label: "grève",               cat: "Social"    },
  { label: "macron",              cat: "Politique" },
  { label: "élection",            cat: "Politique" },
  { label: "immigration",         cat: "Société"   },
  { label: "éducation",           cat: "Société"   },
  { label: "santé",               cat: "Société"   },
  { label: "ukraine",             cat: "International" },
  { label: "ia",                  cat: "Tech"      },
  { label: "climat",              cat: "Environnement" },
  { label: "psg",                 cat: "Sport"     },
  { label: "équipe de france",    cat: "Sport"     },
  { label: "inflation",           cat: "Économie"  },
  { label: "retraites",           cat: "Social"    },
];

const CAT_COLOR: Record<string, string> = {
  Politique: "#E0492F", Social: "#C9A24B", Société: "#1D9BF0",
  International: "#9B59B6", Tech: "#2ECC71", Environnement: "#27AE60",
  Sport: "#E67E22", Économie: "#F39C12",
};

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60)  return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

// ── AlerteCard ────────────────────────────────────────────────────────────────

function AlerteCard({ alerte, onDelete, onToggle, grafts }: {
  alerte: Alerte; grafts: Graft[];
  onDelete: (id: string) => void;
  onToggle: (id: string, actif: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirm,  setConfirm]  = useState(false);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    const res = await fetch("/api/alertes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: alerte.id }),
    });
    setDeleting(false);
    if (res.ok) onDelete(alerte.id);
    else setConfirm(false);
  };

  const handleToggle = async () => {
    const sb = createClient();
    const { error } = await sb.from("alertes").update({ actif: !alerte.actif }).eq("id", alerte.id);
    if (!error) onToggle(alerte.id, !alerte.actif);
  };

  return (
    <div style={{ background: SURFACE, border: `1px solid ${alerte.actif ? BORDER : TEXT3}`, borderRadius: "14px", overflow: "hidden", opacity: alerte.actif ? 1 : 0.65, transition: "opacity 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: alerte.actif ? `${RED}20` : TEXT3 + "20", border: `1px solid ${alerte.actif ? RED + "30" : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "17px", flexShrink: 0, transition: "all 0.2s" }}>
          {alerte.actif ? "🔔" : "🔕"}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: TEXT, fontWeight: 700, fontSize: "14px" }}>#{alerte.mot_cle}</div>
          <div style={{ color: TEXT2, fontSize: "11px", marginTop: "2px" }}>
            Depuis {new Date(alerte.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            {grafts.length > 0 && ` · ${grafts.length} graft${grafts.length > 1 ? "s" : ""} récent${grafts.length > 1 ? "s" : ""}`}
          </div>
        </div>

        {/* Toggle */}
        <button onClick={handleToggle} title={alerte.actif ? "Désactiver" : "Activer"} style={{ width: "40px", height: "22px", borderRadius: "11px", background: alerte.actif ? RED : BORDER, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0, padding: 0 }}>
          <span style={{ position: "absolute", top: "3px", left: alerte.actif ? "20px" : "3px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left 0.2s", display: "block" }} />
        </button>

        {/* Expand */}
        {grafts.length > 0 && (
          <button onClick={() => setExpanded(v => !v)} style={{ background: "none", border: "none", color: TEXT2, fontSize: "16px", cursor: "pointer", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", padding: "4px", lineHeight: 1 }}>›</button>
        )}

        {/* Supprimer */}
        <button onClick={handleDelete} disabled={deleting} onMouseLeave={() => setConfirm(false)} style={{ background: confirm ? `${RED}20` : "none", border: `1px solid ${confirm ? RED : "transparent"}`, borderRadius: "8px", color: confirm ? RED : TEXT2, fontSize: "12px", cursor: "pointer", padding: "4px 8px", fontWeight: confirm ? 700 : 400, transition: "all 0.15s", flexShrink: 0, whiteSpace: "nowrap" }}>
          {deleting ? "…" : confirm ? "Confirmer ✕" : "✕"}
        </button>
      </div>

      {/* Aperçu grafts */}
      {expanded && grafts.length > 0 && (
        <div style={{ borderTop: `1px solid ${BORDER}` }}>
          {grafts.slice(0, 3).map((g, i) => (
            <div key={g.id} style={{ padding: "10px 16px 10px 64px", borderBottom: i < Math.min(grafts.length, 3) - 1 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ display: "flex", gap: "6px", marginBottom: "3px" }}>
                <span style={{ color: RED, fontSize: "12px", fontWeight: 700 }}>@{g.author_name}</span>
                <span style={{ color: TEXT3, fontSize: "11px" }}>· {relativeTime(g.created_at)}</span>
              </div>
              <p style={{ color: TEXT2, fontSize: "12px", margin: 0, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>
                {g.content.split(new RegExp(`(${alerte.mot_cle})`, "gi")).map((part, idx) =>
                  part.toLowerCase() === alerte.mot_cle
                    ? <mark key={idx} style={{ background: `${RED}25`, color: RED, borderRadius: "3px", padding: "0 1px" }}>{part}</mark>
                    : part
                )}
              </p>
            </div>
          ))}
          {grafts.length > 3 && (
            <div style={{ padding: "8px 16px", textAlign: "center" }}>
              <span style={{ color: TEXT2, fontSize: "11px" }}>+{grafts.length - 3} autres grafts</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AlertesPage() {
  const [alertes,        setAlertes]        = useState<Alerte[]>([]);
  const [graftsByAlerte, setGraftsByAlerte] = useState<Record<string, Graft[]>>({});
  const [input,          setInput]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [fetching,       setFetching]       = useState(true);
  const [search,         setSearch]         = useState("");
  const [catFilter,      setCatFilter]      = useState<string | null>(null);

  const fetchAlertes = useCallback(async () => {
    const res  = await fetch("/api/alertes");
    const data = await res.json();
    if (!Array.isArray(data)) { setFetching(false); return; }
    const list = data as Alerte[];
    setAlertes(list);

    const sb = createClient();
    const results: Record<string, Graft[]> = {};
    await Promise.all(
      list.filter(a => a.actif).map(async a => {
        const { data: grafts } = await sb
          .from("grafts").select("id,content,created_at,author_name")
          .ilike("content", `%${a.mot_cle}%`)
          .order("created_at", { ascending: false }).limit(5);
        results[a.id] = (grafts ?? []) as Graft[];
      })
    );
    setGraftsByAlerte(results);
    setFetching(false);
  }, []);

  useEffect(() => { fetchAlertes(); }, [fetchAlertes]);

  const ajouter = async () => {
    const kw = input.trim().toLowerCase();
    if (!kw || loading) return;
    if (alertes.some(a => a.mot_cle === kw)) { setInput(""); return; }
    setLoading(true);
    await fetch("/api/alertes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mot_cle: kw }) });
    await fetchAlertes();
    setInput("");
    setLoading(false);
  };

  const addSuggestion = async (kw: string) => {
    if (alertes.some(a => a.mot_cle === kw) || loading) return;
    setLoading(true);
    await fetch("/api/alertes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mot_cle: kw }) });
    await fetchAlertes();
    setLoading(false);
  };

  const handleDelete = (id: string) => setAlertes(prev => prev.filter(a => a.id !== id));
  const handleToggle = (id: string, actif: boolean) => setAlertes(prev => prev.map(a => a.id === id ? { ...a, actif } : a));

  const filteredAlertes = alertes.filter(a => !search || a.mot_cle.includes(search.toLowerCase()));
  const usedKws         = new Set(alertes.map(a => a.mot_cle));
  const suggestions     = SUGGESTIONS.filter(s => !usedKws.has(s.label) && (!catFilter || s.cat === catFilter));
  const cats            = [...new Set(SUGGESTIONS.map(s => s.cat))];
  const activeCount     = alertes.filter(a => a.actif).length;

  return (
    <>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "80px", fontFamily: "'Inter',system-ui,sans-serif", color: TEXT }}>

        {/* Header sticky */}
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: `${BG}EE`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px 10px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: `${RED}20`, border: `1px solid ${RED}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🔔</div>
            <div>
              <h1 style={{ margin: 0, fontSize: "18px", fontWeight: 900, color: TEXT }}>Mes Alertes</h1>
              {!fetching && <p style={{ margin: 0, fontSize: "11px", color: TEXT2 }}>{alertes.length} alerte{alertes.length > 1 ? "s" : ""} · {activeCount} active{activeCount > 1 ? "s" : ""}</p>}
            </div>
          </div>

          {/* Formulaire */}
          <div style={{ padding: "0 16px 10px", display: "flex", gap: "8px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", color: TEXT3, pointerEvents: "none" }}>#</span>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && ajouter()} placeholder="mot-clé, nom, sujet…" style={{ width: "100%", padding: "9px 14px 9px 28px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "13px", outline: "none", fontFamily: "inherit", transition: "border-color 0.15s" }}
                onFocus={e => (e.currentTarget.style.borderColor = `${RED}60`)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>
            <button onClick={ajouter} disabled={!input.trim() || loading} style={{ padding: "9px 16px", borderRadius: "100px", background: input.trim() ? RED : BORDER, border: "none", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: input.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "background 0.15s" }}>
              {loading ? "…" : "+ Ajouter"}
            </button>
          </div>

          {alertes.length > 4 && (
            <div style={{ padding: "0 16px 8px" }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", pointerEvents: "none" }}>🔎</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filtrer mes alertes…" style={{ width: "100%", padding: "7px 14px 7px 28px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "100px", color: TEXT, fontSize: "12px", outline: "none", fontFamily: "inherit" }} />
              </div>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div style={{ padding: "12px 16px" }}>
          {fetching ? (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <div style={{ fontSize: "28px", opacity: 0.4, marginBottom: "10px" }}>🔔</div>
              <p style={{ color: TEXT2, fontSize: "13px" }}>Chargement…</p>
            </div>
          ) : filteredAlertes.length === 0 && !search ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "32px 0 16px", textAlign: "center" }}>
              <span style={{ fontSize: "36px" }}>🔔</span>
              <p style={{ color: TEXT, fontSize: "16px", fontWeight: 900, margin: 0 }}>Aucune alerte</p>
              <p style={{ color: TEXT2, fontSize: "13px", margin: 0, maxWidth: "240px", lineHeight: 1.6 }}>Ajoute un mot-clé ci-dessus ou choisis une suggestion.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
              {filteredAlertes.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{filteredAlertes.length} alerte{filteredAlertes.length > 1 ? "s" : ""}</span>
                  {alertes.some(a => !a.actif) && <span style={{ color: TEXT3, fontSize: "11px" }}>🔕 = en pause</span>}
                </div>
              )}
              {filteredAlertes.map(a => (
                <AlerteCard key={a.id} alerte={a} onDelete={handleDelete} onToggle={handleToggle} grafts={graftsByAlerte[a.id] ?? []} />
              ))}
              {search && filteredAlertes.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px" }}>
                  <p style={{ color: TEXT2, fontSize: "13px" }}>Aucune alerte pour "{search}"</p>
                  <button onClick={() => setSearch("")} style={{ color: RED, background: "none", border: "none", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>Effacer</button>
                </div>
              )}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ color: TEXT2, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Suggestions</span>
              </div>

              {/* Filtre catégorie */}
              <div style={{ display: "flex", gap: "5px", overflowX: "auto", marginBottom: "12px", paddingBottom: "2px" }}>
                <button onClick={() => setCatFilter(null)} style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: !catFilter ? 700 : 400, cursor: "pointer", border: `1px solid ${!catFilter ? GOLD : BORDER}`, background: !catFilter ? `${GOLD}20` : "transparent", color: !catFilter ? GOLD : TEXT2, flexShrink: 0, transition: "all 0.12s" }}>Tout</button>
                {cats.map(c => {
                  const col = CAT_COLOR[c] ?? GOLD;
                  return (
                    <button key={c} onClick={() => setCatFilter(catFilter === c ? null : c)} style={{ padding: "4px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: catFilter === c ? 700 : 400, cursor: "pointer", border: `1px solid ${catFilter === c ? col : BORDER}`, background: catFilter === c ? col + "20" : "transparent", color: catFilter === c ? col : TEXT2, flexShrink: 0, transition: "all 0.12s" }}>{c}</button>
                  );
                })}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {suggestions.map(s => {
                  const col = CAT_COLOR[s.cat] ?? GOLD;
                  return (
                    <button key={s.label} onClick={() => addSuggestion(s.label)} disabled={loading} style={{ padding: "7px 14px", borderRadius: "100px", fontSize: "12px", fontWeight: 600, cursor: "pointer", border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT2, transition: "all 0.15s", display: "flex", alignItems: "center", gap: "5px" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = col; e.currentTarget.style.color = col; e.currentTarget.style.background = col + "15"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TEXT2; e.currentTarget.style.background = SURFACE; }}
                    >
                      <span style={{ fontSize: "9px", color: col, background: col + "20", borderRadius: "100px", padding: "1px 5px", fontWeight: 700 }}>{s.cat}</span>
                      #{s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
