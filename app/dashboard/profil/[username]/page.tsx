import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FollowButton from '@/components/FollowButton'
import BadgeVerifie from '@/components/BadgeVerifie'
import BadgeFoundateur from '@/components/BadgeFoundateur'
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
    <>
      <style>{`
        * { box-sizing: border-box; }
        .pub-wrap    { max-width: 600px; margin: 0 auto; padding: 0 0 80px; font-family: 'Inter', system-ui, sans-serif; }
        .pub-cover   { height: 120px; background: linear-gradient(135deg,#1a0a0a 0%,#0a0a1a 100%); }
        .pub-inner   { padding: 0 16px; }
        .pub-avrow   { display: flex; justify-content: space-between; align-items: flex-end; margin-top: -36px; margin-bottom: 12px; }
        .pub-avatar  { width: 72px; height: 72px; border-radius: 50%; background: ${RED}; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: #fff; border: 3px solid #000; flex-shrink: 0; }
        .pub-btns    { display: flex; gap: 8px; }
        .pub-ident   { margin-bottom: 16px; }
        .pub-name    { font-size: 20px; font-weight: 700; color: ${TEXT}; }
        .pub-handle  { font-size: 14px; color: ${TEXT2}; margin: 2px 0 8px; }
        .pub-bio     { font-size: 14px; color: #aaa; line-height: 1.6; margin-bottom: 8px; }
        .pub-meta    { font-size: 12px; color: ${TEXT3}; }
        .pub-stats   { display: flex; gap: 24px; padding-bottom: 16px; border-bottom: 1px solid ${BORDER}; }
        .pub-stat-n  { font-size: 16px; font-weight: 700; color: ${TEXT}; }
        .pub-stat-l  { font-size: 12px; color: ${TEXT2}; margin-left: 4px; }
        .pub-tabs    { display: flex; border-bottom: 1px solid ${BORDER}; margin-bottom: 4px; }
        .pub-tab     { flex: 1; text-align: center; padding: 14px 0; font-size: 14px; text-decoration: none; transition: color 0.15s; }
        .pub-graft   { padding: 16px 0; border-bottom: 1px solid #111; }
        .pub-graft-t { font-size: 14px; color: #ccc; line-height: 1.6; }
        .pub-graft-d { font-size: 11px; color: #444; }

        @media (max-width: 639px) {
          .pub-wrap   { padding-bottom: 110px; }
          .pub-cover  { height: 90px; }
          .pub-inner  { padding: 0 12px; }
          .pub-avrow  { margin-top: -28px; margin-bottom: 8px; }
          .pub-avatar { width: 56px; height: 56px; font-size: 18px; }
          .pub-btns   { gap: 6px; }
          .pub-ident  { margin-bottom: 10px; }
          .pub-name   { font-size: 16px; }
          .pub-handle { font-size: 12px; margin-bottom: 5px; }
          .pub-bio    { font-size: 13px; margin-bottom: 5px; }
          .pub-stats  { gap: 14px; padding-bottom: 12px; }
          .pub-stat-n { font-size: 14px; }
          .pub-stat-l { font-size: 11px; }
          .pub-tab    { padding: 10px 0; font-size: 12px; }
          .pub-graft  { padding: 11px 0; }
          .pub-graft-t{ font-size: 13px; }
        }
      `}</style>

      <div className="pub-wrap">

        {/* Cover */}
        <div className="pub-cover" />

        <div className="pub-inner">

          {/* Avatar + boutons */}
          <div className="pub-avrow">
            <div className="pub-avatar">{initiales}</div>
            <div className="pub-btns">
              {currentUser?.id !== profile.id && <MessageButton recipientId={profile.id} />}
              <FollowButton targetUserId={profile.id} />
            </div>
          </div>

          {/* Identité */}
          <div className="pub-ident">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span className="pub-name">{profile.display_name || profile.username}</span>
              <BadgeVerifie verified={profile.verified} />
            </div>
            <div className="pub-handle">@{profile.username}</div>
            {profile.is_founder && (
              <div style={{ marginTop: '6px', marginBottom: '6px' }}>
                <BadgeFoundateur isFounder={profile.is_founder} />
              </div>
            )}
            {profile.bio && <div className="pub-bio">{profile.bio}</div>}
            {profile.ville && <div className="pub-meta">📍 {profile.ville}</div>}
            {profile.website && /^https?:\/\//.test(profile.website) && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="pub-meta" style={{ color: RED, textDecoration: 'none', display: 'block', marginTop: '2px' }}>
                🔗 {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <div className="pub-meta" style={{ marginTop: '4px' }}>📅 Membre depuis {memberSince}</div>
          </div>

          {/* Stats */}
          <div className="pub-stats">
            {[
              { label: 'Grafts',      count: graftsCount   ?? 0 },
              { label: 'Abonnés',     count: followersCount ?? 0 },
              { label: 'Abonnements', count: followingCount ?? 0 },
            ].map(({ label, count }) => (
              <div key={label}>
                <span className="pub-stat-n">{count}</span>
                <span className="pub-stat-l">{label}</span>
              </div>
            ))}
          </div>

          {/* Onglets */}
          <div className="pub-tabs">
            {TABS.map(t => (
              <Link
                key={t.key}
                href={`?tab=${t.key}`}
                className="pub-tab"
                style={{
                  fontWeight: activeTab === t.key ? 700 : 400,
                  color: activeTab === t.key ? TEXT : TEXT2,
                  borderBottom: activeTab === t.key ? `2px solid ${RED}` : '2px solid transparent',
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
    </>
  )
}

function GraftRow({ graft }: { graft: any }) {
  return (
    <div className="pub-graft">
      <div className="pub-graft-t">{graft.content}</div>
      {graft.image_url && !graft.video_url && (
        <img src={graft.image_url} alt="" style={{ width: '100%', borderRadius: '10px', marginTop: '10px', maxHeight: '300px', objectFit: 'cover' }} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
        <div className="pub-graft-d">
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
