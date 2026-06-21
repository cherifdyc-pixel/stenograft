'use client';
import { useState } from 'react';

const MONTANTS = [
  { amount: 2,   color: '#4B9AC9', label: '2€'   },
  { amount: 5,   color: '#4BC94B', label: '5€'   },
  { amount: 10,  color: '#C9A24B', label: '10€'  },
  { amount: 20,  color: '#E0492F', label: '20€'  },
  { amount: 50,  color: '#C94BC9', label: '50€'  },
  { amount: 100, color: '#FFD700', label: '100€' },
];

export default function SuperChatModal({
  onSend,
  onClose,
}: {
  onSend: (amount: number, message: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(MONTANTS[1]);
  const [message,  setMessage]  = useState('');

  return (
    <>
      <style>{`@keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:none; opacity:1; } }`}</style>
      <div
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:1000, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 0 80px' }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ width:'100%', maxWidth:'480px', background:'#0a0a0a', border:'1px solid #222', borderTop:`2px solid ${selected.color}`, borderRadius:'20px 20px 0 0', padding:'24px 20px', animation:'slideUp 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          {/* Header */}
          <div style={{ textAlign:'center', marginBottom:'20px' }}>
            <div style={{ fontSize:'22px', marginBottom:'4px' }}>⭐</div>
            <div style={{ color:'#fff', fontSize:'15px', fontWeight:800, marginBottom:'4px' }}>Super Chat</div>
            <div style={{ fontSize:'12px', color:'#555' }}>Mettez votre message en avant pendant le live</div>
          </div>

          {/* Montants */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px', marginBottom:'16px' }}>
            {MONTANTS.map(m => (
              <button
                key={m.amount}
                onClick={() => setSelected(m)}
                style={{ padding:'12px 8px', borderRadius:'10px', border:`1.5px solid ${selected.amount===m.amount ? m.color : '#222'}`, background: selected.amount===m.amount ? m.color : '#111', color: selected.amount===m.amount ? '#fff' : '#555', fontSize:'15px', fontWeight:700, cursor:'pointer', transition:'all 0.18s', boxShadow: selected.amount===m.amount ? `0 0 14px ${m.color}55` : 'none' }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Message */}
          <input
            value={message}
            onChange={e => setMessage(e.target.value.slice(0, 150))}
            placeholder="Votre message (optionnel)…"
            style={{ width:'100%', padding:'12px 16px', borderRadius:'10px', background:'#111', border:`1px solid ${selected.color}44`, color:'#fff', fontSize:'13px', outline:'none', boxSizing:'border-box', marginBottom:'12px', fontFamily:'inherit', transition:'border-color 0.15s' }}
            onFocus={e => (e.currentTarget.style.borderColor = selected.color+'99')}
            onBlur={e => (e.currentTarget.style.borderColor = selected.color+'44')}
          />

          {/* Compteur */}
          <div style={{ textAlign:'right', fontSize:'10px', color:'#333', marginTop:'-8px', marginBottom:'12px' }}>{message.length}/150</div>

          {/* Preview */}
          <div style={{ padding:'12px 14px', borderRadius:'10px', marginBottom:'16px', background:`${selected.color}15`, border:`1px solid ${selected.color}44` }}>
            <div style={{ fontSize:'10px', color:selected.color, fontWeight:700, marginBottom:'4px' }}>
              ⭐ SUPER CHAT · {selected.label}
            </div>
            <div style={{ fontSize:'13px', color:'#ccc', fontStyle: message ? 'normal' : 'italic' }}>
              {message || 'Votre message apparaîtra ici…'}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onSend(selected.amount, message); onClose(); }}
            style={{ width:'100%', padding:'14px', borderRadius:'12px', background:selected.color, border:'none', color:'#fff', fontSize:'15px', fontWeight:800, cursor:'pointer', boxShadow:`0 4px 20px ${selected.color}55`, transition:'opacity 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Envoyer {selected.label} ⭐
          </button>

          <button
            onClick={onClose}
            style={{ width:'100%', padding:'10px', background:'none', border:'none', color:'#444', fontSize:'13px', cursor:'pointer', marginTop:'8px' }}
          >
            Annuler
          </button>
        </div>
      </div>
    </>
  );
}
