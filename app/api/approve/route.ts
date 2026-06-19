import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function getAuthedClient() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { graft_id } = await request.json()

  const { error } = await supabase
    .from('approvals')
    .insert({ user_id: user.id, graft_id })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { graft_id } = await request.json()

  const { error } = await supabase
    .from('approvals')
    .delete()
    .eq('user_id', user.id)
    .eq('graft_id', graft_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
