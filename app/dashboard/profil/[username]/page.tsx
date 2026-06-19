import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import FollowButton from '@/components/FollowButton'

export default async function ProfilPublicPage({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const [
    { count: graftsCount },
    { count: followersCount },
    { count: followingCount },
    { data: grafts },
  ] = await Promise.all([
    // Grafts : la table utilise author_name, on essaie aussi user_id si disponible
    supabase.from('grafts').select('*', { count: 'exact', head: true }).eq('author_name', profile.username),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('grafts').select('*').eq('author_name', profile.username).order('created_at', { ascending: false }).limit(20),
  ])

  const initiales = (profile.display_name || profile.username || '?')
    .trim()
    .split(/\s+/)
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          background: '#E0492F',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', fontWeight: 800, color: '#fff', flexShrink: 0,
          boxShadow: '0 4px 20px rgba(224,73,47,0.4)',
        }}>
          {initiales}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#E7E9EA', letterSpacing: '-0.3px' }}>
            {profile.display_name || profile.username}
          </div>
          <div style={{ fontSize: '14px', color: '#71767B', marginBottom: '10px' }}>
            @{profile.username}
          </div>
          <FollowButton targetUserId={profile.id} />
        </div>
      </div>

      {/* ── Bio ── */}
      {profile.bio && (
        <p style={{ color: '#E7E9EA', fontSize: '15px', lineHeight: 1.65, margin: '0 0 20px' }}>
          {profile.bio}
        </p>
      )}

      {/* ── Compteurs ── */}
      <div style={{
        display: 'flex', gap: '32px', marginBottom: '32px',
        borderBottom: '1px solid #1C1C1C', paddingBottom: '20px',
      }}>
        {[
          { label: 'Grafts',       count: graftsCount  ?? 0 },
          { label: 'Abonnés',      count: followersCount ?? 0 },
          { label: 'Abonnements',  count: followingCount ?? 0 },
        ].map(({ label, count }) => (
          <div key={label}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#E7E9EA', letterSpacing: '-0.5px' }}>{count}</div>
            <div style={{ fontSize: '12px', color: '#71767B', marginTop: '2px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Grafts ── */}
      <div>
        {!grafts || grafts.length === 0 ? (
          <p style={{ color: '#71767B', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            Aucun graft pour l'instant.
          </p>
        ) : grafts.map(graft => (
          <div
            key={graft.id}
            style={{
              padding: '16px 0',
              borderBottom: '1px solid #111',
              fontSize: '15px', color: '#E7E9EA', lineHeight: 1.65,
            }}
          >
            {graft.content}
            <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
              {new Date(graft.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
