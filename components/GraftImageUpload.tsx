'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

const RED = '#E0492F'

export default function GraftImageUpload({ onUpload }: { onUpload: (url: string) => void }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) { setError('Image trop lourde (max 5 Mo)'); return }

    setLoading(true)
    setError(null)
    setPreview(URL.createObjectURL(file))

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); setPreview(null); return }

    const ext  = file.name.split('.').pop() ?? 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('grafts-images')
      .upload(path, file, { contentType: file.type })

    if (uploadErr) {
      setError(`Upload échoué : ${uploadErr.message}`)
      setPreview(null)
      setLoading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('grafts-images').getPublicUrl(path)
    onUpload(publicUrl)
    setLoading(false)
  }

  const removeImage = () => {
    setPreview(null)
    setError(null)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {error && (
        <div style={{ color: RED, fontSize: '11px', marginBottom: '4px' }}>{error}</div>
      )}

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: '20px', padding: '4px 8px' }}
          title="Ajouter une photo"
        >🖼️</button>
      ) : (
        <div style={{ position: 'relative', marginTop: '8px', display: 'inline-block', width: '100%' }}>
          <img
            src={preview}
            alt="Aperçu"
            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', display: 'block', objectFit: 'cover' }}
          />
          <button
            onClick={removeImage}
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', color: '#fff', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
          >✕</button>
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700 }}>
              Upload…
            </div>
          )}
        </div>
      )}
    </div>
  )
}
