'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MessageButton({ recipientId }: { recipientId: string }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)
  const router = useRouter()

  const handleClick = async () => {
    setLoading(true)
    setError(false)
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: recipientId }),
    })
    if (res.ok) {
      const { conversation_id } = await res.json()
      router.push(`/dashboard/messages/${conversation_id}`)
      return
    }
    setError(true)
    setLoading(false)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: '8px 16px', borderRadius: '100px',
        background: 'transparent', border: `1px solid ${error ? '#E0492F' : '#333'}`,
        color: error ? '#E0492F' : '#E7E9EA', fontSize: '14px', fontWeight: 600,
        cursor: loading ? 'default' : 'pointer',
        transition: 'border-color 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { if (!loading && !error) e.currentTarget.style.borderColor = '#E0492F' }}
      onMouseLeave={e => { if (!error) e.currentTarget.style.borderColor = '#333' }}
    >
      {loading ? '…' : error ? '✕ Erreur' : '💬 Message'}
    </button>
  )
}
