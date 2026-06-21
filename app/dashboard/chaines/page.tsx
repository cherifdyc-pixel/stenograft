'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const BG     = '#000000';
const SURF   = '#0A0A0A';
const BORDER = '#1C1C1C';
const RED    = '#E0492F';
const GOLD   = '#C9A24B';
const TEXT   = '#E7E9EA';
const TEXT2  = '#71767B';
const TEXT3  = '#2A2A2A';

const SUB_KEY = 'sg_chaines_subs';

const CATEGORIES = ['Tout','Politique','Sport','Culture','Économie','Débat','Local'] as const;
type Cat = typeof CATEGORIES[number];

type Chaine = {
  id:          string;
  nom:         string;
  emoji:       string;
  abonnes:     number;
  videos:      number;
  en_direct:   boolean;
  categorie:   Cat;
  description: string;
  hue:         number;
};

const CHAINES: Chaine[] = [
  { id:'1', nom:'Assemblée Nationale',  emoji:'🏛️', abonnes:12400, videos:89,  en_direct:true,  categorie:'Politique', description:'Séances plénières et commissions en direct',       hue:0   },
  { id:'2', nom:'Le Débat Citoyen',     emoji:'⚖️', abonnes:8200,  videos:134, en_direct:false, categorie:'Débat',     description:'Débats politiques et sociaux de fond',             hue:40  },
  { id:'3', nom:'France Sport Live',    emoji:'⚽', abonnes:34000, videos:456, en_direct:true,  categorie:'Sport',     description:'Sport en direct, commentaires et analyses',         hue:30  },
  { id:'4', nom:'Culture & Patrimoine', emoji:'🎭', abonnes:5600,  videos:78,  en_direct:false, categorie:'Culture',   description:'Art, histoire et patrimoine français',              hue:280 },
  { id:'5', nom:'Économie France',      emoji:'📊', abonnes:9100,  videos:203, en_direct:false, categorie:'Économie',  description:'Actualité économique et financière en continu',     hue:120 },
  { id:'6', nom:'Territoires en Direct',emoji:'🗺️', abonnes:3400,  videos:67,  en_direct:true,  categorie:'Local',     description:'Actualités locales et régionales par territoire',   hue:180 },
  { id:'7', nom:'Le Registre Live',     emoji:'📋', abonnes:7800,  videos:112, en_direct:false, categorie:'Politique', description:'Déclarations et paroles officielles archivées',     hue:10  },
  { id:'8', nom:'Science & Innovation', emoji:'🔬', abonnes:15200, videos:289, en_direct:false, categorie:'Culture',   description:'Science et technologie françaises au quotidien',    hue:200 },
  { id:'9', nom:'Justice & Droit',      emoji:'⚖️', abonnes:4300,  videos:91,  en_direct:false, categorie:'Politique', description:'Actualité judiciaire et analyses juridiques',       hue:350 },
  { id:'10',nom:'Rugby Nation',         emoji:'🏉', abonnes:11700, videos:178, en_direct:true,  categorie:'Sport',     description:'Rugby XV de France et Top 14 en direct',            hue:50  },
  { id:'11',nom:'Cinéma Français',      emoji:'🎬', abonnes:6800,  videos:143, en_direct:false, categorie:'Culture',   description:'Films, récompenses et interviews exclusifs',        hue:300 },
  { id:'12',nom:'PME & Entrepreneurs',  emoji:'💼', abonnes:3900,  videos:57,  en_direct:false, categorie:'Économie',  description:'Entrepreneuriat et success-stories françaises',      hue:60  },
];

function fmtAbonnes(n: number): string {
  if (n >= 1000) return `${(n/1000).toFixed(n>=10000?0:1)}k`;
  return String(n);
}

export default function ChainesPage() {
  const [cat,    setCat]    = useState<Cat | 'Tout'>('Tout');
  const [search, setSearch] = useState('');
  const [subs,   setSubs]   = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'toutes'|'abonnees'|'direct'>('toutes');

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SUB_KEY) || '[]') as string[];
      setSubs(new Set(saved));
    } catch {}
  }, []);

  const toggleSub = (id: string) => {
    setSubs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem(SUB_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const filtered = CHAINES.filter(c => {
    const q      = search.toLowerCase();
    const matchS = !q || c.nom.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
    const matchC = cat === 'Tout' || c.categorie === cat;
    const matchF = filter === 'toutes' || (filter === 'abonnees' && subs.has(c.id)) || (filter === 'direct' && c.en_direct);
    return matchS && matchC && matchF;
  }).sort((a, b) => {
    if (a.en_direct !== b.en_direct) return a.en_direct ? -1 : 1;
    if (subs.has(a.id) !== subs.has(b.id)) return subs.has(a.id) ? -1 : 1;
    return b.abonnes - a.abonnes;
  });

  const liveCount = CHAINES.filter(c => c.en_direct).length;
  const subCount  = subs.size;

  return (
    <>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { display:none; }`}</style>
      <div style={{ maxWidth:'700px', margin:'0 auto', paddingBottom:'80px', fontFamily:"'Inter',system-ui,sans-serif", color:TEXT }}>

        {/* Header sticky */}
        <div style={{ position:'sticky', top:0, zIndex:10, background:`${BG}EE`, backdropFilter:'blur(12px)', borderBottom:`1px solid ${BORDER}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px 10px', gap:'10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', boxShadow:`0 2px 12px ${RED}44` }}>📺</div>
              <div>
                <h1 style={{ color:TEXT, fontSize:'18px', fontWeight:900, margin:'0 0 1px' }}>Chaînes</h1>
                <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>{liveCount} en direct · {subCount} abonnement{subCount>1?'s':''}</p>
              </div>
            </div>
            <Link href="/dashboard/tv" style={{ textDecoration:'none' }}>
              <button style={{ padding:'7px 14px', borderRadius:'100px', border:`1px solid ${BORDER}`, background:'transparent', color:TEXT2, fontSize:'11px', fontWeight:600, cursor:'pointer' }}>
                ← STENO TV
              </button>
            </Link>
          </div>

          {/* Search */}
          <div style={{ padding:'0 16px 8px' }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'13px', pointerEvents:'none' }}>🔎</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une chaîne…"
                style={{ width:'100%', padding:'8px 36px 8px 32px', background:SURF, border:`1px solid ${BORDER}`, borderRadius:'100px', color:TEXT, fontSize:'12px', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s' }}
                onFocus={e => (e.currentTarget.style.borderColor = RED+'60')}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {search && <button onClick={() => setSearch('')} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:TEXT2, cursor:'pointer', fontSize:'15px' }}>×</button>}
            </div>
          </div>

          {/* Filtres rapides */}
          <div style={{ display:'flex', gap:'6px', padding:'0 16px 8px' }}>
            {([['toutes','Toutes'],['direct','🔴 En direct'],['abonnees','⭐ Mes abos']] as const).map(([k,l]) => (
              <button key={k} onClick={() => setFilter(k)} style={{ padding:'4px 12px', borderRadius:'100px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:`1px solid ${filter===k ? RED : BORDER}`, background: filter===k ? `${RED}18` : 'transparent', color: filter===k ? RED : TEXT2, transition:'all 0.12s' }}>
                {l}
              </button>
            ))}
          </div>

          {/* Catégories */}
          <div style={{ display:'flex', gap:'5px', padding:'0 16px 10px', overflowX:'auto', scrollbarWidth:'none' }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ padding:'4px 11px', borderRadius:'100px', fontSize:'10px', fontWeight:600, cursor:'pointer', flexShrink:0, border:`1px solid ${cat===c ? GOLD : BORDER}`, background: cat===c ? `${GOLD}18` : 'transparent', color: cat===c ? GOLD : TEXT2, transition:'all 0.12s' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding:'12px 16px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 20px' }}>
              <span style={{ fontSize:'40px' }}>📺</span>
              <p style={{ color:TEXT2, fontSize:'13px', marginTop:'12px' }}>Aucune chaîne trouvée.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'10px' }}>
              {filtered.map(c => {
                const isSub = subs.has(c.id);
                return (
                  <div key={c.id} style={{ background:SURF, border:`1px solid ${isSub ? GOLD+'30' : BORDER}`, borderRadius:'16px', overflow:'hidden', transition:'border-color 0.15s, transform 0.15s', cursor:'default' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                  >
                    {/* Banner */}
                    <div style={{ height:'52px', background:`linear-gradient(135deg,hsl(${c.hue},50%,5%) 0%,hsl(${(c.hue+40)%360},60%,11%) 100%)`, position:'relative', display:'flex', alignItems:'center', padding:'0 14px' }}>
                      <span style={{ fontSize:'26px', filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.6))' }}>{c.emoji}</span>
                      {c.en_direct && (
                        <div style={{ position:'absolute', top:'8px', right:'8px', display:'flex', alignItems:'center', gap:'4px', background:RED, borderRadius:'4px', padding:'2px 7px' }}>
                          <span style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#fff', display:'inline-block' }} />
                          <span style={{ color:'#fff', fontSize:'8px', fontWeight:800 }}>LIVE</span>
                        </div>
                      )}
                      {isSub && (
                        <div style={{ position:'absolute', bottom:'6px', right:'8px' }}>
                          <span style={{ fontSize:'10px', color:GOLD }}>★</span>
                        </div>
                      )}
                    </div>

                    <div style={{ padding:'12px 14px 14px' }}>
                      <p style={{ color:TEXT, fontSize:'13px', fontWeight:700, margin:'0 0 2px', lineHeight:1.3 }}>{c.nom}</p>
                      <p style={{ color:TEXT2, fontSize:'10px', margin:'0 0 7px' }}>
                        {fmtAbonnes(c.abonnes + (isSub ? 1 : 0))} abonnés · {c.videos} vidéos
                      </p>
                      <p style={{ color:TEXT3, fontSize:'11px', margin:'0 0 12px', lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' } as React.CSSProperties}>
                        {c.description}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'6px' }}>
                        <span style={{ background:`${RED}15`, color:RED, fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'100px', border:`1px solid ${RED}25` }}>
                          {c.categorie}
                        </span>
                        <button onClick={() => toggleSub(c.id)} style={{ padding:'5px 14px', borderRadius:'100px', border:`1px solid ${isSub ? GOLD+'50' : BORDER}`, background: isSub ? `${GOLD}15` : RED, color: isSub ? GOLD : '#fff', fontSize:'11px', fontWeight:700, cursor:'pointer', transition:'all 0.15s' }}>
                          {isSub ? '★ Abonné' : "S'abonner"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
