import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import type { Profile } from '@/types'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { count } = await supabase.from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id).eq('is_read', false)

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar profile={profile as Profile} unreadCount={count || 0} />
      <main className="flex-1 ml-64 min-h-screen">
        <div className="max-w-7xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
