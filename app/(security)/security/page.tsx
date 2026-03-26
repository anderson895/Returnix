import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, Badge } from '@/components/ui'
import { Package, CheckSquare, Clock, PlusCircle, ArrowRight, Shield } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import type { FoundItem, ClaimRequest } from '@/types'

export default async function SecurityDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile || !['security', 'admin'].includes(profile.role)) redirect('/dashboard')

  const [
    { data: myFoundItems },
    { data: pendingClaims },
    { count: totalFound },
    { count: totalClaimed },
    { count: pendingCount },
  ] = await Promise.all([
    supabase.from('found_items').select('*').eq('security_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('claim_requests').select('*, found_items(title, tracking_id, image_url), profiles!claim_requests_user_id_fkey(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false }).limit(5),
    supabase.from('found_items').select('*', { count: 'exact', head: true }),
    supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'claimed'),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const stats = [
    { label: 'Total Found Items', value: totalFound || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Claims', value: pendingCount || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Items Claimed', value: totalClaimed || 0, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'My Logged Items', value: myFoundItems?.length || 0, icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
          <p className="text-gray-500 text-sm">Manage found items and verify claim requests</p>
        </div>
        <Link href="/security/found-items/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" /> Log Found Item
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label} className="p-4">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Claims */}
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Pending Claims
              {(pendingCount || 0) > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">{pendingCount}</span>
              )}
            </h2>
            <Link href="/security/claims" className="text-blue-600 text-sm flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!pendingClaims?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No pending claims to verify.</div>
            ) : pendingClaims.map((claim: ClaimRequest & { found_items: { title: string; tracking_id: string; image_url: string }; profiles: { full_name: string; email: string } }) => (
              <Link key={claim.id} href={`/security/claims`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{claim.found_items?.title}</p>
                  <p className="text-xs text-gray-500">By {claim.profiles?.full_name} · {timeAgo(claim.created_at)}</p>
                </div>
                <Badge variant="pending">pending</Badge>
              </Link>
            ))}
          </div>
        </Card>

        {/* My Recent Found Items */}
        <Card>
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">My Recent Logged Items</h2>
            <Link href="/security/found-items/new" className="text-emerald-600 text-sm flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5" /> New
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!myFoundItems?.length ? (
              <div className="p-8 text-center text-gray-400 text-sm">No items logged yet.</div>
            ) : myFoundItems.map((item: FoundItem) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image_url
                    ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    : <Package className="w-5 h-5 text-gray-400 m-2.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                  <p className="text-xs font-mono text-gray-500">#{item.tracking_id} · {formatDate(item.date_found)}</p>
                </div>
                <Badge variant={item.status}>{item.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
