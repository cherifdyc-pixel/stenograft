'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Message = { id: string; content: string; sender_id: string; created_at: string; lu: boolean }

export default function ConversationPage() {
  const params = useParams()
  const conversationId = params.conversationId as string
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState('')
  const [userId,    setUserId]    = useState<string | null>(null)
  const [other,     setOther]     = useState<any>(null)
  const [loading,   setLoading]   = useState(false)
  const [isMobile,  setIsMobile]  = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

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

  // On mobile: input bar is fixed above BottomNav (56px)
  // Messages area gets paddingBottom to scroll above the fixed input bar
  const inputBarHeight = 64
  const bottomNavHeight = 56
  const inputBarBottom = isMobile ? `calc(${bottomNavHeight}px + env(safe-area-inset-bottom))` : '0'

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: isMobile ? '100dvh' : 'calc(100vh - 80px)',
      maxWidth: '600px',
      margin: '0 auto',
      position: 'relative',
    }}>

      {/* Header */}
      <div style={{
        padding: isMobile ? '10px 12px' : '16px',
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: '#000',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        flexShrink: 0,
      }}>
        <Link href="/dashboard/messages" style={{ color: '#E0492F', textDecoration: 'none', fontSize: '20px', lineHeight: 1, flexShrink: 0 }}>←</Link>
        <div style={{ width: isMobile ? '34px' : '40px', height: isMobile ? '34px' : '40px', borderRadius: '50%', background: '#E0492F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '12px' : '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {initiales}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: isMobile ? '13px' : '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.display_name || other?.username || '…'}</div>
          <div style={{ color: '#444', fontSize: '11px' }}>@{other?.username || '…'}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        // On mobile, leave room for the fixed input bar above BottomNav
        paddingBottom: isMobile ? `calc(${inputBarHeight}px + ${bottomNavHeight}px + env(safe-area-inset-bottom) + 8px)` : '12px',
      }}>
        {messages.map(msg => {
          const isMe = msg.sender_id === userId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: isMobile ? '80%' : '75%',
                padding: isMobile ? '8px 12px' : '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? '#E0492F' : '#111',
                color: '#fff',
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: 1.5,
                border: isMe ? 'none' : '1px solid #1a1a1a',
              }}>
                {msg.content}
                <div style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.5)' : '#333', marginTop: '3px', textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — fixed above BottomNav on mobile, sticky at bottom on desktop */}
      <div style={{
        padding: isMobile ? '10px 12px' : '12px 16px',
        borderTop: '1px solid #1a1a1a',
        display: 'flex',
        gap: '8px',
        background: '#000',
        // Mobile: fixed above BottomNav; Desktop: sticky at bottom of flex column
        position: isMobile ? 'fixed' : 'sticky',
        bottom: isMobile ? inputBarBottom : 0,
        left: isMobile ? 0 : undefined,
        right: isMobile ? 0 : undefined,
        zIndex: isMobile ? 100 : 1,
        maxWidth: isMobile ? '100%' : '600px',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Votre message…"
          style={{
            flex: 1,
            padding: isMobile ? '10px 14px' : '12px 16px',
            borderRadius: '24px',
            background: '#111',
            border: '1px solid #222',
            color: '#fff',
            fontSize: isMobile ? '13px' : '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading || !other || !userId}
          style={{
            width: isMobile ? '40px' : '44px',
            height: isMobile ? '40px' : '44px',
            borderRadius: '50%',
            background: input.trim() ? '#E0492F' : '#1a1a1a',
            border: 'none',
            color: '#fff',
            fontSize: '18px',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >↑</button>
      </div>
    </div>
  )
}
