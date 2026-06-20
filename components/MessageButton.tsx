'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MessageButton({ recipientId }: { recipientId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId }),
    })
    if (res.ok) {
      const { conversation_id } = await res.json()
      router.push(`/dashboard/messages/${conversation_id}`)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: '8px 16px', borderRadius: '100px',
        background: 'transparent', border: '1px solid #333',
        color: '#E7E9EA', fontSize: '14px', fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = '#E0492F' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#333' }}
    >
      {loading ? '…' : '💬 Message'}
    </button>
  )
}
