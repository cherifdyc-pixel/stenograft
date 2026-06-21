'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function GraftActions({ graftId }: { graftId: string }) {
  const [approved,      setApproved]      = useState(false)
  const [relayed,       setRelayed]       = useState(false)
  const [approvalCount, setApprovalCount] = useState(0)
  const [relayCount,    setRelayCount]    = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [userId,        setUserId]        = useState<string | null>(null)
  const approvingRef = useRef(false)
  const relayingRef  = useRef(false)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const [{ data: apr }, { data: rel }, { count: aprCount }, { count: relCount }] = await Promise.all([
        supabase.from('approvals').select('id').eq('user_id', user.id).eq('graft_id', graftId).maybeSingle(),
        supabase.from('relays').select('id').eq('user_id', user.id).eq('graft_id', graftId).maybeSingle(),
        supabase.from('approvals').select('*', { count: 'exact', head: true }).eq('graft_id', graftId),
        supabase.from('relays').select('*', { count: 'exact', head: true }).eq('graft_id', graftId),
      ])

      setApproved(!!apr)
      setRelayed(!!rel)
      setApprovalCount(aprCount || 0)
      setRelayCount(relCount || 0)
      setLoading(false)
    }
    init()
  }, [graftId])

  const toggleApprove = async () => {
    if (!userId || approvingRef.current) return
    approvingRef.current = true
    const prev = approved
    setApproved(!prev)
    setApprovalCount(c => prev ? c - 1 : c + 1)
    const res = await fetch('/api/approve', {
      method: prev ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graft_id: graftId }),
    })
    if (!res.ok) { setApproved(prev); setApprovalCount(c => prev ? c + 1 : c - 1) }
    approvingRef.current = false
  }

  const toggleRelay = async () => {
    if (!userId || relayingRef.current) return
    relayingRef.current = true
    const prev = relayed
    setRelayed(!prev)
    setRelayCount(c => prev ? c - 1 : c + 1)
    const res = await fetch('/api/relay', {
      method: prev ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graft_id: graftId }),
    })
    if (!res.ok) { setRelayed(prev); setRelayCount(c => prev ? c + 1 : c - 1) }
    relayingRef.current = false
  }

  if (loading) return null

  return (
    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
      <button onClick={toggleApprove} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'none', border: 'none', cursor: userId ? 'pointer' : 'default',
        color: approved ? '#E0492F' : '#666', fontSize: '13px', padding: '4px 0',
        transition: 'color 0.15s',
      }}>
        <span style={{ fontSize: '16px' }}>{approved ? '✓' : '○'}</span>
        Approuver · {approvalCount}
      </button>
      <button onClick={toggleRelay} style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        background: 'none', border: 'none', cursor: userId ? 'pointer' : 'default',
        color: relayed ? '#C9A24B' : '#666', fontSize: '13px', padding: '4px 0',
        transition: 'color 0.15s',
      }}>
        <span style={{ fontSize: '16px' }}>{relayed ? '⟳' : '↻'}</span>
        Relayer · {relayCount}
      </button>
    </div>
  )
}
