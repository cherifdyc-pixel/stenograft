import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { recipient_id } = await request.json()

  if (!recipient_id || recipient_id === user.id)
    return NextResponse.json({ error: 'Destinataire invalide' }, { status: 400 })

  let { data: conv } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant1_id.eq.${user.id},participant2_id.eq.${recipient_id}),and(participant1_id.eq.${recipient_id},participant2_id.eq.${user.id})`)
    .single()

  if (!conv) {
    const { data: newConv, error } = await supabase
      .from('conversations')
      .insert({ participant1_id: user.id, participant2_id: recipient_id })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    conv = newConv
  }

  return NextResponse.json({ conversation_id: conv!.id })
}
