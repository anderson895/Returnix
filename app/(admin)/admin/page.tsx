import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, Badge } from '@/components/ui'
import { Users, FileText, Package, ClipboardList, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, timeAgo } from '@/lib/utils'
import type { Profile, LostItem, FoundItem, ClaimRequest } from '@/types'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const [
    { count: totalUsers },
    { count: totalLost },
    { count: totalFound },
    { count: totalClaims },
    { count: pendingClaims },
    { count: approvedClaims },
    { count: rejectedClaims },
    { count: claimedItems },
    { data: recentUsers },
    { data: recentClaims },
    { data: recentLost },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('lost_items').select('*', { count: 'exact', head: true }),
    supabase.from('found_items').select('*', { count: 'exact', head: true }),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'claimed'),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('claim_requests').select('*, found_items(title, tracking_id), profiles!claim_requests_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('lost_items').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(5),
  ])

  const recoveryRate = totalFound ? Math.round(((claimedItems || 0) / totalFound) * 100) : 0

  const statsCards = [
    { label: 'Total Users', value: totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/users' },
    { label: 'Lost Reports', value: totalLost || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/lost-items' },
    { label: 'Found Items', value: totalFound || 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/admin/found-items' },
    { label: 'Total Claims', value: totalClaims || 0, icon: ClipboardList, color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/claims' },
  ]

  const claimStats = [
    { label: 'Pending', value: pendingClaims || 0, icon: Clock, color: 'text-orange-600 bg-orange-50' },
    { label: 'Approved', value: approvedClaims || 0, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Rejected', value: rejectedClaims || 0, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: 'Recovery Rate', value: `${recoveryRate}%`, icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">System-wide overview of the Lost & Found platform</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map(s => (
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

      {/* Claim Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {claimStats.map(s => {
          const [textColor, bgColor] = s.color.split(' ')
          return (
            <Card key={s.label} className="p-4">
              <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center mb-2`}>
                <s.icon className={`w-4 h-4 ${textColor}`} />
              </div>
              <div className="text-xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </Card>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Claims */}
        <Card className="lg:col-span-2">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Claims</h2>
            <Link href="/admin/claims" className="text-blue-600 text-sm hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!recentClaims?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No claims yet.</div>
            ) : recentClaims.map((c: any) => (
              <div key={c.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.found_items?.title}</p>
                  <p className="text-xs text-gray-500">By {c.profiles?.full_name} · {timeAgo(c.created_at)}</p>
                </div>
                <Badge variant={c.status}>{c.status}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Users */}
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">New Users</h2>
            <Link href="/admin/users" className="text-blue-600 text-sm hover:text-blue-700">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map((u: Profile) => (
              <div key={u.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {u.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <Badge variant={u.role}>{u.role}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Lost Items */}
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Lost Item Reports</h2>
          <Link href="/admin/lost-items" className="text-blue-600 text-sm hover:text-blue-700">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="px-4 py-3 text-left">Item</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Reported By</th>
                <th className="px-4 py-3 text-left">Date Lost</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentLost?.map((item: LostItem & { profiles: Profile }) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.title}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category}</td>
                  <td className="px-4 py-3 text-gray-500">{item.profiles?.full_name}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(item.date_lost)}</td>
                  <td className="px-4 py-3"><Badge variant={item.status}>{item.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
