'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

type Notification = {
  id: string
  type: 'follow' | 'approve' | 'relay' | 'reply'
  read: boolean
  created_at: string
  actor_id: string | null
  graft_id: string | null
}

const typeLabel = (type: string) => {
  if (type === 'follow')  return 'a commencé à vous suivre'
  if (type === 'approve') return 'a approuvé votre graft'
  if (type === 'relay')   return 'a relayé votre graft'
  if (type === 'reply')   return 'a répondu à votre graft'
  return ''
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open,   setOpen]   = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      setNotifs(data || [])

      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifs(prev => [payload.new as Notification, ...prev])
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markAllRead = async () => {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next && unread > 0) markAllRead()
        }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#999', fontSize: '20px', position: 'relative', padding: '4px',
        }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} non lues)` : ''}`}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#E0492F', color: '#fff',
            borderRadius: '50%', fontSize: '10px', fontWeight: 700,
            width: '16px', height: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', left: 0, top: '36px',
          width: '320px', maxHeight: '400px', overflowY: 'auto',
          background: '#111', border: '1px solid #222',
          borderRadius: '12px', zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          scrollbarWidth: 'none',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #222', fontSize: '13px', fontWeight: 700, color: '#E7E9EA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Notifications</span>
            {notifs.some(n => !n.read) && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#E0492F', fontSize: '11px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                Tout marquer lu
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: '#555', fontSize: '13px' }}>
              Aucune notification
            </div>
          ) : notifs.map(n => (
            <div key={n.id} style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1a1a1a',
              background: n.read ? 'transparent' : '#1a0808',
              fontSize: '13px',
              color: n.read ? '#666' : '#ccc',
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
            }}>
              {!n.read && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E0492F', flexShrink: 0, marginTop: '4px' }} />
              )}
              <div style={{ flex: 1 }}>
                <span style={{ color: '#E0492F', fontWeight: 600 }}>Un Grafter</span>{' '}
                {typeLabel(n.type)}
                <div style={{ fontSize: '11px', color: '#444', marginTop: '3px' }}>
                  {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
