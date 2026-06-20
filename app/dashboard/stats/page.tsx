import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function StatsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const username = user.user_metadata?.username ?? user.email?.split('@')[0] ?? ''

  const [
    { data: stats },
    { data: grafts },
  ] = await Promise.all([
    supabase.from('stats_grafters').select('*').eq('id', user.id).single(),
    supabase.from('grafts').select('id, content, created_at').eq('author_name', username).order('created_at', { ascending: false }).limit(5),
  ])

  const metriques = [
    { icon: '✍️', label: 'Grafts publiés',      value: stats?.total_grafts        || 0, color: '#fff'     },
    { icon: '👥', label: 'Abonnés',              value: stats?.total_followers     || 0, color: '#E0492F'  },
    { icon: '➕', label: 'Abonnements',          value: stats?.total_following     || 0, color: '#C9A24B'  },
    { icon: '✓',  label: 'Approbations reçues',  value: stats?.total_approbations  || 0, color: '#4BC94B'  },
    { icon: '↻',  label: 'Relais reçus',         value: stats?.total_relais        || 0, color: '#4B9AC9'  },
    { icon: '🔖', label: 'Fois mis en favori',   value: stats?.total_favoris       || 0, color: '#C94BC9'  },
  ]

  const conseils = [
    { tip: "Publiez régulièrement — au moins 1 graft par jour",       done: (stats?.total_grafts || 0) > 7  },
    { tip: "Utilisez des hashtags pour être découvert",               done: false                           },
    { tip: "Répondez aux grafts des autres Grafters",                 done: false                           },
    { tip: "Ajoutez une photo à vos grafts pour +50% d'engagement",  done: false                           },
  ]

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 80px', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Titre */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Mes Statistiques</h1>
        <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Vue d'ensemble de votre impact sur STENOGRAFT</p>
      </div>

      {/* Grille métriques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
        {metriques.map(m => (
          <div key={m.label} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{m.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '10px', color: '#444', marginTop: '4px', lineHeight: 1.3 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Derniers grafts */}
      <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 600, color: '#E0492F', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Derniers grafts
      </div>
      <div style={{ marginBottom: '32px' }}>
        {!grafts?.length ? (
          <div style={{ color: '#333', fontSize: '13px', padding: '20px 0' }}>Aucun graft pour le moment.</div>
        ) : grafts.map(g => (
          <div key={g.id} style={{ padding: '12px 0', borderBottom: '1px solid #111' }}>
            <div style={{ fontSize: '14px', color: '#ccc', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
              {g.content}
            </div>
            <div style={{ fontSize: '11px', color: '#333', marginTop: '4px' }}>
              {new Date(g.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        ))}
      </div>

      {/* Conseils */}
      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#C9A24B', marginBottom: '12px' }}>
          🚀 Conseils pour grandir
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {conseils.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: c.done ? '#555' : '#888' }}>
              <span style={{ color: c.done ? '#4BC94B' : '#333', flexShrink: 0 }}>{c.done ? '✓' : '○'}</span>
              <span style={{ textDecoration: c.done ? 'line-through' : 'none' }}>{c.tip}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
