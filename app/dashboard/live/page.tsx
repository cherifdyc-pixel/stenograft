'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

const BG     = '#000000';
const SURF   = '#0A0A0A';
const BORDER = '#1C1C1C';
const RED    = '#E0492F';
const GOLD   = '#C9A24B';
const TEXT   = '#E7E9EA';
const TEXT2  = '#71767B';
const TEXT3  = '#2A2A2A';

const PLATFORMS = [
  { id:'youtube',    label:'YouTube',    icon:'▶', color:'#FF0000', desc:'Intégrez votre stream YouTube Live' },
  { id:'twitch',     label:'Twitch',     icon:'◈', color:'#9146FF', desc:'Connectez votre chaîne Twitch' },
  { id:'kick',       label:'Kick',       icon:'◉', color:'#53FC18', desc:'Diffusez sur Kick.com' },
  { id:'streamyard', label:'StreamYard', icon:'⬡', color:'#1DA1F2', desc:'Studio de broadcast multi-plateforme' },
];

const CATS = ['Politique','Sport','Culture','Débat','Économie','Local','Autre'];

export default function LiveStartPage() {
  const router  = useRouter();
  const [step,       setStep]       = useState<1|2|3>(1);
  const [platform,   setPlatform]   = useState<string>('youtube');
  const [title,      setTitle]      = useState('');
  const [cat,        setCat]        = useState('Politique');
  const [streamKey,  setStreamKey]  = useState('');
  const [username,   setUsername]   = useState('');
  const [loading,    setLoading]    = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setUsername(data.user?.email?.split('@')[0] || 'Grafter');
    });
  }, []);

  const roomId = `${username}_${Date.now()}`.slice(0, 32);

  const startLive = async () => {
    if (!title.trim()) return;
    setLoading(true);
    // On redirige vers la room live avec les paramètres
    router.push(`/dashboard/live/${encodeURIComponent(roomId)}?title=${encodeURIComponent(title)}&platform=${platform}&cat=${encodeURIComponent(cat)}`);
  };

  const inp: React.CSSProperties = { width:'100%', background:BG, border:`1px solid ${BORDER}`, borderRadius:'10px', padding:'11px 14px', color:TEXT, fontSize:'13px', outline:'none', fontFamily:'inherit', transition:'border-color 0.15s', boxSizing:'border-box' };
  const lbl: React.CSSProperties = { display:'block', color:GOLD, fontSize:'10px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:'6px' };

  return (
    <>
      <style>{`* { box-sizing:border-box; } ::-webkit-scrollbar { display:none; }`}</style>
      <div style={{ maxWidth:'600px', margin:'0 auto', paddingBottom:'80px', fontFamily:"'Inter',system-ui,sans-serif", color:TEXT, padding:'24px 16px' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'28px' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`linear-gradient(135deg,#1a0505 0%,${RED} 100%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', boxShadow:`0 4px 20px ${RED}55` }}>🔴</div>
          <div>
            <h1 style={{ color:TEXT, fontSize:'22px', fontWeight:900, margin:'0 0 3px' }}>Démarrer un Live</h1>
            <p style={{ color:TEXT2, fontSize:'12px', margin:0 }}>Diffusez en temps réel à votre communauté</p>
          </div>
        </div>

        {/* Steps indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'28px' }}>
          {([1,2,3] as const).map((s, i) => (
            <div key={s} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:800, border:`2px solid ${step>=s ? RED : BORDER}`, background: step>=s ? `${RED}18` : 'transparent', color: step>=s ? RED : TEXT2, transition:'all 0.15s' }}>
                {step>s ? '✓' : s}
              </div>
              <span style={{ fontSize:'11px', color: step>=s ? TEXT : TEXT2, fontWeight: step>=s ? 600 : 400 }}>
                {s===1 ? 'Plateforme' : s===2 ? 'Configuration' : 'Lancement'}
              </span>
              {i < 2 && <div style={{ flex:1, height:'1px', width:'30px', background: step>s ? RED+'60' : BORDER }} />}
            </div>
          ))}
        </div>

        {/* Step 1 — Plateforme */}
        {step === 1 && (
          <div>
            <p style={lbl}>Choisissez votre plateforme de diffusion</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'24px' }}>
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => setPlatform(p.id)} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 16px', borderRadius:'14px', border:`1.5px solid ${platform===p.id ? p.color+'60' : BORDER}`, background: platform===p.id ? `${p.color}10` : SURF, cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${p.color}20`, border:`1px solid ${p.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', color:p.color, flexShrink:0, fontWeight:800 }}>{p.icon}</div>
                  <div style={{ flex:1 }}>
                    <p style={{ color:TEXT, fontSize:'14px', fontWeight:700, margin:'0 0 2px' }}>{p.label}</p>
                    <p style={{ color:TEXT2, fontSize:'11px', margin:0 }}>{p.desc}</p>
                  </div>
                  <div style={{ width:'18px', height:'18px', borderRadius:'50%', border:`2px solid ${platform===p.id ? RED : BORDER}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {platform===p.id && <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:RED }} />}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} style={{ width:'100%', padding:'13px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${RED}44` }}>
              Continuer →
            </button>
          </div>
        )}

        {/* Step 2 — Configuration */}
        {step === 2 && (
          <div>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'24px' }}>
              <div>
                <label style={lbl}>Titre du live *</label>
                <input value={title} onChange={e => setTitle(e.target.value.slice(0,100))} placeholder="Ex: Débat sur la réforme fiscale 2027…"
                  style={inp}
                  onFocus={e => (e.currentTarget.style.borderColor = RED+'60')}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
                <div style={{ textAlign:'right', fontSize:'10px', color:TEXT3, marginTop:'3px' }}>{title.length}/100</div>
              </div>

              <div>
                <label style={lbl}>Catégorie</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                  {CATS.map(c => (
                    <button key={c} onClick={() => setCat(c)} style={{ padding:'5px 12px', borderRadius:'100px', fontSize:'11px', fontWeight:600, cursor:'pointer', border:`1px solid ${cat===c ? RED : BORDER}`, background: cat===c ? `${RED}18` : 'transparent', color: cat===c ? RED : TEXT2, transition:'all 0.12s' }}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Clé de stream (optionnel)</label>
                <input value={streamKey} onChange={e => setStreamKey(e.target.value)} placeholder="Votre stream key rtmp://…" type="password"
                  style={inp}
                  onFocus={e => (e.currentTarget.style.borderColor = RED+'60')}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
                <p style={{ color:TEXT3, fontSize:'10px', margin:'5px 0 0' }}>Votre clé n'est jamais stockée côté serveur.</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setStep(1)} style={{ flex:1, padding:'12px', borderRadius:'12px', background:'transparent', border:`1px solid ${BORDER}`, color:TEXT2, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                ← Retour
              </button>
              <button onClick={() => setStep(3)} disabled={!title.trim()} style={{ flex:2, padding:'12px', borderRadius:'12px', background: title.trim() ? RED : '#1a1a1a', border:'none', color: title.trim() ? '#fff' : TEXT3, fontSize:'13px', fontWeight:800, cursor: title.trim() ? 'pointer' : 'not-allowed', boxShadow: title.trim() ? `0 4px 20px ${RED}44` : 'none' }}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Lancement */}
        {step === 3 && (
          <div>
            <div style={{ background:SURF, border:`1px solid ${BORDER}`, borderRadius:'16px', padding:'20px', marginBottom:'20px' }}>
              <p style={{ color:GOLD, fontSize:'10px', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', margin:'0 0 14px' }}>Récapitulatif</p>
              {[
                { label:'Titre',      value:title },
                { label:'Plateforme', value:PLATFORMS.find(p=>p.id===platform)?.label || platform },
                { label:'Catégorie',  value:cat },
                { label:'Diffuseur',  value:`@${username}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${BORDER}` }}>
                  <span style={{ color:TEXT2, fontSize:'12px' }}>{label}</span>
                  <span style={{ color:TEXT, fontSize:'12px', fontWeight:600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ background:`${RED}08`, border:`1px solid ${RED}20`, borderRadius:'12px', padding:'14px', marginBottom:'20px', display:'flex', gap:'10px' }}>
              <span style={{ fontSize:'18px', flexShrink:0 }}>⚠️</span>
              <p style={{ color:TEXT2, fontSize:'12px', lineHeight:1.6, margin:0 }}>
                En démarrant ce live, vous acceptez les <span style={{ color:RED }}>conditions d'utilisation</span> de STENOGRAFT et vous engagez à respecter la charte éditoriale.
              </p>
            </div>

            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => setStep(2)} style={{ flex:1, padding:'12px', borderRadius:'12px', background:'transparent', border:`1px solid ${BORDER}`, color:TEXT2, fontSize:'13px', fontWeight:600, cursor:'pointer' }}>
                ← Modifier
              </button>
              <button onClick={startLive} disabled={loading} style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px', borderRadius:'12px', background:RED, border:'none', color:'#fff', fontSize:'14px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 24px ${RED}55` }}>
                <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#fff', display:'inline-block', animation:'sg-pulse 1.2s infinite' }} />
                {loading ? 'Démarrage…' : '🔴 Démarrer le live'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
