import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import BadgeVerifie from '@/components/BadgeVerifie'

export default async function ExplorerPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: topGrafters },
    { data: recentGrafts },
    { data: trendingGrafts },
  ] = await Promise.all([
    supabase.from('stats_grafters').select('*').order('total_followers', { ascending: false }).limit(10),
    supabase.from('grafts').select('id, content, created_at, image_url, author_name').order('created_at', { ascending: false }).limit(10),
    supabase.from('grafts').select('content').limit(200),
  ])

  // Calcul hashtags tendance côté serveur
  const hashtags: Record<string, number> = {}
  trendingGrafts?.forEach(({ content }) => {
    const tags = content?.match(/#[\wÀ-ÿ]+/g) || []
    tags.forEach((t: string) => {
      const key = t.toLowerCase()
      hashtags[key] = (hashtags[key] || 0) + 1
    })
  })
  const topHashtags = Object.entries(hashtags).sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 80px', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Titre */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Explorer</h1>
        <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Découvrez les Grafters et les tendances</p>
      </div>

      {/* Hashtags tendance */}
      {topHashtags.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Tendances
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {topHashtags.map(([tag, count]) => (
              <Link key={tag} href="/dashboard/tendances" style={{ padding: '6px 14px', borderRadius: '20px', background: '#0a0a0a', border: '1px solid #1a1a1a', color: '#E0492F', fontSize: '13px', textDecoration: 'none', fontWeight: 500 }}>
                {tag} <span style={{ color: '#444', fontSize: '11px' }}>{count}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top Grafters */}
      {(topGrafters?.length ?? 0) > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '12px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Grafters populaires
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {topGrafters!.filter(g => g.id !== user?.id).slice(0, 6).map((g: any, i) => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#0a0a0a', borderRadius: '10px', border: '1px solid #111' }}>
                <div style={{ fontSize: '13px', color: '#333', fontWeight: 700, width: '20px', flexShrink: 0 }}>#{i + 1}</div>
                <Link href={`/dashboard/profil/${g.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E0492F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                    {(g.display_name || g.username || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{g.display_name || g.username}</span>
                      <BadgeVerifie verified={g.verified} />
                    </div>
                    <div style={{ color: '#444', fontSize: '12px' }}>{g.total_followers ?? 0} abonnés · {g.total_grafts ?? 0} grafts</div>
                  </div>
                </Link>
                <FollowButton targetUserId={g.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grafts récents */}
      <div>
        <div style={{ fontSize: '12px', color: '#555', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Grafts récents
        </div>
        {!recentGrafts?.length ? (
          <div style={{ color: '#333', fontSize: '13px', padding: '20px 0' }}>Aucun graft pour le moment.</div>
        ) : recentGrafts.map((g: any) => (
          <div key={g.id} style={{ padding: '14px 0', borderBottom: '1px solid #111' }}>
            <Link href={`/dashboard/profil/${g.author_name?.toLowerCase()}`} style={{ textDecoration: 'none' }}>
              <span style={{ color: '#E0492F', fontSize: '13px', fontWeight: 600 }}>
                {g.author_name}
              </span>
            </Link>
            <div style={{ color: '#ccc', fontSize: '14px', marginTop: '4px', lineHeight: 1.6 }}>{g.content}</div>
            {g.image_url && (
              <img src={g.image_url} alt="" style={{ width: '100%', borderRadius: '10px', marginTop: '8px', maxHeight: '200px', objectFit: 'cover' }} />
            )}
          </div>
        ))}
      </div>

    </div>
  )
}
