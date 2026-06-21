'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Message = { id: string; content: string; sender_id: string; created_at: string; lu: boolean }

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [other, setOther] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id || null)

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
      setMessages(msgs || [])

      // Mark all messages in this conversation as read
      if (user) {
        await supabase.from('messages')
          .update({ lu: true })
          .eq('conversation_id', conversationId)
          .neq('sender_id', user.id)
          .eq('lu', false)
      }

      const { data: conv } = await supabase
        .from('conversations')
        .select('participant1:profiles!conversations_participant1_id_fkey(id, username, display_name), participant2:profiles!conversations_participant2_id_fkey(id, username, display_name)')
        .eq('id', conversationId)
        .maybeSingle()

      if (conv) {
        const otherProfile = (conv.participant1 as any)?.id === user?.id ? conv.participant2 : conv.participant1
        setOther(otherProfile)
      }

      const channel = supabase.channel(`messages:${conversationId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        }, (payload) => {
          const msg = payload.new as Message
          setMessages(prev => [...prev, msg])
          // Mark incoming messages as read immediately
          if (user && msg.sender_id !== user.id) {
            supabase.from('messages').update({ lu: true }).eq('id', msg.id).then(() => {})
          }
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading || !other || !userId) return
    setLoading(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient_id: other.id, content: input.trim() })
    })
    if (res.ok) setInput('')
    setLoading(false)
  }

  const initiales = (other?.display_name || other?.username || '?').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', maxWidth: '600px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: '12px', background: '#000', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/dashboard/messages" style={{ color: '#E0492F', textDecoration: 'none', fontSize: '20px' }}>←</Link>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E0492F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff' }}>
          {initiales}
        </div>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px' }}>{other?.display_name || other?.username || '…'}</div>
          <div style={{ color: '#444', fontSize: '12px' }}>@{other?.username || '…'}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {messages.map(msg => {
          const isMe = msg.sender_id === userId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? '#E0492F' : '#111',
                color: '#fff', fontSize: '14px', lineHeight: 1.5,
                border: isMe ? 'none' : '1px solid #1a1a1a',
              }}>
                {msg.content}
                <div style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.5)' : '#333', marginTop: '4px', textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a', display: 'flex', gap: '8px', background: '#000' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Votre message..."
          style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', background: '#111', border: '1px solid #222', color: '#fff', fontSize: '14px', outline: 'none' }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading || !other || !userId}
          style={{ width: '44px', height: '44px', borderRadius: '50%', background: input.trim() ? '#E0492F' : '#1a1a1a', border: 'none', color: '#fff', fontSize: '18px', cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'background 0.15s' }}
        >↑</button>
      </div>
    </div>
  )
}
