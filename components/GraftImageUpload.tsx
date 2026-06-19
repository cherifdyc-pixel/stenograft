'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function GraftImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { alert('Image trop lourde (max 5MB)'); return }
    setLoading(true)
    setPreview(URL.createObjectURL(file))
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    await supabase.storage.from('grafts-images').upload(path, file, { contentType: file.type })
    const { data: { publicUrl } } = supabase.storage.from('grafts-images').getPublicUrl(path)
    onUpload(publicUrl)
    setLoading(false)
  }

  const removeImage = () => {
    setPreview(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      {!preview ? (
        <button onClick={() => inputRef.current?.click()} disabled={loading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '20px', padding: '4px 8px' }}
          title="Ajouter une photo">🖼️</button>
      ) : (
        <div style={{ position: 'relative', marginTop: '8px', display: 'inline-block' }}>
          <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', display: 'block' }} />
          <button onClick={removeImage} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          {loading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px' }}>Upload...</div>}
        </div>
      )}
    </div>
  )
}
