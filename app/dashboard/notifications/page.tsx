'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

const RED    = '#E0492F'
const BORDER = '#1C1C1C'
const TEXT   = '#E7E9EA'
const TEXT2  = '#71767B'

type Notif = {
  id: string
  type: 'follow' | 'approve' | 'relay' | 'reply'
  read: boolean
  created_at: string
  actor_id: string | null
  graft_id: string | null
  actor?: { username: string; display_name: string | null }
}

const TYPE_ICON: Record<string, string> = {
  follow:  '👤',
  approve: '✓',
  relay:   '↻',
  reply:   '💬',
}

const TYPE_LABEL: Record<string, string> = {
  follow:  'a commencé à vous suivre',
  approve: 'a approuvé votre graft',
  relay:   'a relayé votre graft',
  reply:   'a répondu à votre graft',
}

const TYPE_COLOR: Record<string, string> = {
  follow:  '#1D9BF0',
  approve: '#4BC94B',
  relay:   '#C9A24B',
  reply:   '#E0492F',
}

function relativeTime(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)  return 'à l\'instant'
  const m = Math.floor(s / 60)
  if (m < 60)  return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `il y a ${h}h`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [userId,  setUserId]  = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*, actor:profiles!notifications_actor_id_fkey(username, display_name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifs((data || []) as Notif[])

      // Marquer toutes comme lues
      await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))

      // Realtime
      const channel = supabase.channel('notifs-page')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifs(prev => [payload.new as Notif, ...prev])
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
      setLoading(false)
    }

    init()
    return () => { cleanup?.() }
  }, [])

  const markAllRead = async () => {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '80px', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#000E6', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ color: TEXT, fontSize: '20px', fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>Notifications</h1>
        {unread > 0 && (
          <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: RED, fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}>
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ padding: '16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#111', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: '13px', width: '60%', background: '#111', borderRadius: '6px', marginBottom: '8px' }} />
                <div style={{ height: '11px', width: '30%', background: '#0a0a0a', borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '80px 20px', textAlign: 'center' }}>
          <span style={{ fontSize: '48px' }}>🔔</span>
          <p style={{ color: TEXT, fontSize: '20px', fontWeight: 900, margin: 0 }}>Aucune notification</p>
          <p style={{ color: TEXT2, fontSize: '14px', margin: 0, maxWidth: '260px', lineHeight: 1.6 }}>
            Vos notifications apparaîtront ici quand quelqu'un vous suit, approuve ou relaie un graft.
          </p>
        </div>
      ) : (
        <div>
          {notifs.map(n => {
            const actor = n.actor as any
            const name  = actor?.display_name || actor?.username || 'Un Grafter'
            const handle = actor?.username
            const color = TYPE_COLOR[n.type] || RED
            const initiales = name.slice(0, 2).toUpperCase()

            return (
              <div
                key={n.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '14px 16px',
                  borderBottom: `1px solid ${BORDER}`,
                  background: n.read ? 'transparent' : '#0d0505',
                  transition: 'background 0.12s',
                }}
              >
                {/* Avatar + icône type */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {handle ? (
                    <Link href={`/dashboard/profil/${handle}`} style={{ textDecoration: 'none' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                        {initiales}
                      </div>
                    </Link>
                  ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
                      {initiales}
                    </div>
                  )}
                  <span style={{
                    position: 'absolute', bottom: '-2px', right: '-4px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: color, border: '2px solid #000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px',
                  }}>{TYPE_ICON[n.type]}</span>
                </div>

                {/* Texte */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: n.read ? TEXT2 : TEXT, lineHeight: 1.5 }}>
                    {handle ? (
                      <Link href={`/dashboard/profil/${handle}`} style={{ color, fontWeight: 700, textDecoration: 'none' }}>{name}</Link>
                    ) : (
                      <span style={{ color, fontWeight: 700 }}>{name}</span>
                    )}{' '}
                    {TYPE_LABEL[n.type]}
                  </div>
                  <div style={{ fontSize: '12px', color: '#444', marginTop: '4px' }}>
                    {relativeTime(n.created_at)}
                  </div>
                </div>

                {/* Point non lu */}
                {!n.read && (
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: RED, flexShrink: 0, marginTop: '6px' }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
