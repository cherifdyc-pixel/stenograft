import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getAuthedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { recipient_id, content } = await request.json()

  if (!recipient_id || recipient_id === user.id || !UUID_RE.test(recipient_id))
    return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })

  if (!content?.trim())
    return NextResponse.json({ error: 'Message vide' }, { status: 400 })
  if (content.length > 4000)
    return NextResponse.json({ error: 'Message trop long (max 4000 caractères)' }, { status: 400 })

  // Trouver ou créer la conversation
  let { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${recipient_id}),and(participant1_id.eq.${recipient_id},participant2_id.eq.${user.id})`)
    .maybeSingle()

  if (!conv) {
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ participant1_id: user.id, participant2_id: recipient_id })
      .select()
      .maybeSingle()
    if (error) { console.error("[messages] create conv:", error.message); return NextResponse.json({ error: 'Impossible de créer la conversation' }, { status: 500 }) }
    if (!newConv) return NextResponse.json({ error: 'Impossible de créer la conversation' }, { status: 500 })
    conv = newConv
  }

  if (!conv) return NextResponse.json({ error: 'Impossible de créer la conversation' }, { status: 500 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conv.id, sender_id: user.id, content })
    .select()
    .maybeSingle()

  if (error) { console.error("[messages] insert:", error.message); return NextResponse.json({ error: 'Erreur envoi message' }, { status: 500 }) }
  return NextResponse.json({ message, conversation_id: conv.id })
}
