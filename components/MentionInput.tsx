'use client'
import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

type Profile = { id: string; username: string; display_name: string | null }

export default function MentionInput({
  value, onChange, placeholder
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [cursorPos, setCursorPos] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (mentionQuery === null) return
    if (mentionQuery.length < 1) { setSuggestions([]); return }

    const search = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .ilike('username', `${mentionQuery}%`)
        .limit(5)
      setSuggestions(data || [])
    }
    const t = setTimeout(search, 200)
    return () => clearTimeout(t)
  }, [mentionQuery])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    const cursor = e.target.selectionStart
    onChange(val)
    setCursorPos(cursor)

    const textBeforeCursor = val.slice(0, cursor)
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/)
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1])
    } else {
      setMentionQuery(null)
      setSuggestions([])
    }
  }

  const selectMention = (username: string) => {
    const textBeforeCursor = value.slice(0, cursorPos)
    const textAfterCursor = value.slice(cursorPos)
    const newText = textBeforeCursor.replace(/@\w*$/, `@${username} `) + textAfterCursor
    onChange(newText)
    setSuggestions([])
    setMentionQuery(null)
    textareaRef.current?.focus()
  }

  return (
    <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder || "Quoi de neuf ? Utilisez @ pour mentionner un Grafter..."}
        rows={4}
        style={{
          width: '100%', padding: '12px 16px', borderRadius: '10px',
          background: '#111', border: '1px solid #222', color: '#fff',
          fontSize: '15px', outline: 'none', resize: 'none',
          fontFamily: 'inherit', lineHeight: '1.6', boxSizing: 'border-box'
        }}
      />

      {suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#111', border: '1px solid #222', borderRadius: '10px',
          overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', marginTop: '4px'
        }}>
          {suggestions.map(p => (
            <button
              key={p.id}
              onMouseDown={e => { e.preventDefault(); selectMention(p.username) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 14px', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                borderBottom: '1px solid #1a1a1a'
              }}
            >
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#E0492F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {(p.display_name || p.username).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{p.display_name || p.username}</div>
                <div style={{ color: '#555', fontSize: '11px' }}>@{p.username}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
