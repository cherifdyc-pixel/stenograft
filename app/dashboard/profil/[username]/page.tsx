import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import BadgeVerifie from '@/components/BadgeVerifie'
import GraftActions from '@/components/GraftActions'
import MessageButton from '@/components/MessageButton'

const RED    = '#E0492F'
const BORDER = '#1C1C1C'
const TEXT   = '#E7E9EA'
const TEXT2  = '#71767B'
const TEXT3  = '#444'

export default async function ProfilPublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { username } = await params
  const { tab = 'grafts' } = await searchParams

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const [{ data: profile }, { data: { user: currentUser } }] = await Promise.all([
    supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
    supabase.auth.getUser(),
  ])

  if (!profile) notFound()

  const activeTab = ['grafts', 'approuves', 'medias'].includes(tab) ? tab : 'grafts'

  const [
    { count: graftsCount },
    { count: followersCount },
    { count: followingCount },
    { data: grafts },
    { data: mediaGrafts },
    { data: approvalRows },
  ] = await Promise.all([
    supabase.from('grafts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', profile.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', profile.id),
    supabase.from('grafts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('grafts').select('*').eq('user_id', profile.id).not('image_url', 'is', null).order('created_at', { ascending: false }).limit(20),
    supabase.from('approvals').select('graft_id, grafts(*)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20),
  ])

  const approvedGrafts = (approvalRows || []).map((r: any) => r.grafts).filter(Boolean)

  const initiales = (profile.display_name || profile.username || '?')
    .trim().split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const memberSince = new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const TABS = [
    { key: 'grafts',    label: 'Grafts' },
    { key: 'approuves', label: 'Approuvés' },
    { key: 'medias',    label: 'Médias' },
  ]

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 0 80px', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Cover */}
      <div style={{ height: '120px', background: 'linear-gradient(135deg, #1a0a0a 0%, #0a0a1a 100%)' }} />

      <div style={{ padding: '0 16px' }}>

        {/* Avatar + Follow */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-36px', marginBottom: '12px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#fff', border: '3px solid #000', flexShrink: 0 }}>
            {initiales}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {currentUser?.id !== profile.id && <MessageButton recipientId={profile.id} />}
            <FollowButton targetUserId={profile.id} />
          </div>
        </div>

        {/* Identité */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '20px', fontWeight: 700, color: TEXT }}>
              {profile.display_name || profile.username}
            </span>
            <BadgeVerifie verified={profile.verified} />
          </div>
          <div style={{ fontSize: '14px', color: TEXT2, margin: '2px 0 8px' }}>@{profile.username}</div>
          {profile.bio && (
            <div style={{ fontSize: '14px', color: '#aaa', lineHeight: '1.6', marginBottom: '8px' }}>{profile.bio}</div>
          )}
          <div style={{ fontSize: '12px', color: TEXT3 }}>📅 Membre depuis {memberSince}</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '24px', paddingBottom: '16px', borderBottom: `1px solid ${BORDER}` }}>
          {[
            { label: 'Grafts',      count: graftsCount   ?? 0 },
            { label: 'Abonnés',     count: followersCount ?? 0 },
            { label: 'Abonnements', count: followingCount ?? 0 },
          ].map(({ label, count }) => (
            <div key={label}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: TEXT }}>{count}</span>
              <span style={{ fontSize: '12px', color: TEXT2, marginLeft: '4px' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '4px' }}>
          {TABS.map(t => (
            <Link
              key={t.key}
              href={`?tab=${t.key}`}
              style={{
                flex: 1, textAlign: 'center', padding: '14px 0',
                fontSize: '14px',
                fontWeight: activeTab === t.key ? 700 : 400,
                color: activeTab === t.key ? TEXT : TEXT2,
                textDecoration: 'none',
                borderBottom: activeTab === t.key ? `2px solid ${RED}` : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* Contenu Grafts */}
        {activeTab === 'grafts' && (
          <div>
            {!grafts?.length ? (
              <Empty label="Aucun graft pour le moment." />
            ) : grafts.map(g => <GraftRow key={g.id} graft={g} />)}
          </div>
        )}

        {/* Contenu Approuvés */}
        {activeTab === 'approuves' && (
          <div>
            {!approvedGrafts.length ? (
              <Empty label="Aucun graft approuvé pour le moment." />
            ) : approvedGrafts.map((g: any) => <GraftRow key={g.id} graft={g} />)}
          </div>
        )}

        {/* Contenu Médias */}
        {activeTab === 'medias' && (
          <div>
            {!mediaGrafts?.length ? (
              <Empty label="Aucun média pour le moment." />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', marginTop: '4px' }}>
                {mediaGrafts.map(g => (
                  <img key={g.id} src={g.image_url!} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '4px' }} />
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

function GraftRow({ graft }: { graft: any }) {
  return (
    <div style={{ padding: '16px 0', borderBottom: '1px solid #111' }}>
      <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6' }}>{graft.content}</div>
      {graft.image_url && !graft.video_url && (
        <img src={graft.image_url} alt="" style={{ width: '100%', borderRadius: '10px', marginTop: '10px', maxHeight: '300px', objectFit: 'cover' }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div style={{ fontSize: '11px', color: '#444' }}>
          {new Date(graft.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
        </div>
        <GraftActions graftId={graft.id} />
      </div>
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#333', fontSize: '13px' }}>{label}</div>
  )
}
