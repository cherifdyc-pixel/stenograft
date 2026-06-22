import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MessagesPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/connexion')

  const { data: conversations } = await supabase
    .from('conversations')
    .select(`
      id, created_at,
      participant1:profiles!conversations_participant1_id_fkey(id, username, display_name),
      participant2:profiles!conversations_participant2_id_fkey(id, username, display_name)
    `)
    .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <>
      <style>{`
        @media (max-width: 639px) {
          .msg-avatar { width: 40px !important; height: 40px !important; font-size: 13px !important; }
          .msg-card   { padding: 10px 12px !important; }
          .msg-name   { font-size: 13px !important; }
          .msg-sub    { font-size: 11px !important; }
        }
      `}</style>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px 110px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', margin: 0 }}>Messages</h1>
          <p style={{ color: '#555', fontSize: '13px', marginTop: '4px' }}>Vos conversations privées</p>
        </div>

        {!conversations?.length ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#333', fontSize: '14px' }}>
            💬 Aucune conversation.<br />
            <span style={{ fontSize: '12px', color: '#222', marginTop: '8px', display: 'block' }}>
              Visitez le profil d'un Grafter pour lui envoyer un message.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {conversations.map((conv: any) => {
              const other = conv.participant1?.id === user.id ? conv.participant2 : conv.participant1
              const initiales = (other?.display_name || other?.username || '?').slice(0, 2).toUpperCase()
              return (
                <Link key={conv.id} href={`/dashboard/messages/${conv.id}`} style={{ textDecoration: 'none' }}>
                  <div className="msg-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#0a0a0a', borderRadius: '12px', border: '1px solid #111' }}>
                    <div className="msg-avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#E0492F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {initiales}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="msg-name" style={{ color: '#fff', fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.display_name || other?.username}</div>
                      <div className="msg-sub" style={{ color: '#444', fontSize: '12px' }}>@{other?.username}</div>
                    </div>
                    <div style={{ color: '#333', fontSize: '18px', flexShrink: 0 }}>›</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
