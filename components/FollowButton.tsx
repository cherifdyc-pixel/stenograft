'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function FollowButton({ targetUserId }: { targetUserId: string }) {
  const [isFollowing, setIsFollowing]     = useState(false)
  const [loading, setLoading]             = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setCurrentUserId(user.id)
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single()
      setIsFollowing(!!data)
      setLoading(false)
    }
    check()
  }, [targetUserId])

  const toggle = async () => {
    if (!currentUserId || currentUserId === targetUserId) return
    setLoading(true)
    const res = await fetch('/api/follows', {
      method: isFollowing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id: targetUserId }),
    })
    if (res.ok) setIsFollowing(!isFollowing)
    setLoading(false)
  }

  if (!currentUserId || currentUserId === targetUserId) return null

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        padding: '6px 18px',
        borderRadius: '20px',
        border: isFollowing ? '1px solid #444' : 'none',
        background: isFollowing ? 'transparent' : '#E0492F',
        color: isFollowing ? '#999' : '#fff',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '…' : isFollowing ? 'Abonné' : 'Greffer'}
    </button>
  )
}
