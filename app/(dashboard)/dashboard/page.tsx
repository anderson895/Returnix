import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { FileText, Search, ClipboardList, Bell, PlusCircle, ArrowRight, Package } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import type { LostItem, ClaimRequest, Notification } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  const [{ data: myLostItems }, { data: myClaims }, { data: notifications }, { count: foundCount }] = await Promise.all([
    supabase.from('lost_items').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('claim_requests').select('*, found_items(title, tracking_id)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'unclaimed'),
  ])

  const stats = [
    { label: 'Lost Items Reported', value: myLostItems?.length || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', href: '#my-items' },
    { label: 'Claims Submitted', value: myClaims?.length || 0, icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50', href: '/claims' },
    { label: 'Available Found Items', value: foundCount || 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/dashboard/search' },
    { label: 'Unread Notifications', value: notifications?.length || 0, icon: Bell, color: 'text-orange-600', bg: 'bg-orange-50', href: '/notifications' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(' ')[0] || 'User'} 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your items</p>
        </div>
        <Link href="/lost-items/report"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" />
          Report Lost Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link key={s.label} href={s.href}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* My Lost Items */}
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Lost Items</h2>
            <Link href="/lost-items/report" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              Report new <PlusCircle className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!myLostItems?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No lost items reported yet.</div>
            ) : myLostItems.map((item: LostItem) => (
              <Link key={item.id} href={`/lost-items/${item.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-gray-400 m-2.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.category} · {formatDate(item.date_lost)}</p>
                </div>
                <Badge variant={item.status}>{item.status}</Badge>
              </Link>
            ))}
          </div>
          {(myLostItems?.length || 0) > 0 && (
            <div className="p-3 border-t border-gray-100">
              <Link href="/dashboard/my-items" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 justify-center">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>
          )}
        </Card>

        {/* My Claims */}
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Claims</h2>
            <Link href="/claims" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!myClaims?.length ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm mb-3">No claims submitted yet.</p>
                <Link href="/dashboard/search" className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1 justify-center">
                  <Search className="w-3.5 h-3.5" /> Search Found Items
                </Link>
              </div>
            ) : myClaims.map((claim: ClaimRequest & { found_items: { title: string; tracking_id: string } }) => (
              <div key={claim.id} className="flex items-center gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{claim.found_items?.title}</p>
                  <p className="text-xs text-gray-500">ID: {claim.found_items?.tracking_id} · {timeAgo(claim.created_at)}</p>
                </div>
                <Badge variant={claim.status}>{claim.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Unread Notifications */}
      {(notifications?.length || 0) > 0 && (
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              Unread Notifications
            </h2>
            <Link href="/notifications" className="text-blue-600 text-sm">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {notifications?.map((n: Notification) => (
              <div key={n.id} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center text-base flex-shrink-0">
                  {n.type === 'claim_approved' ? '✅' : n.type === 'claim_rejected' ? '❌' : '🔔'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
