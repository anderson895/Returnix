import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui'
import { BarChart2, TrendingUp, Package, FileText, CheckCircle, Clock, XCircle, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ReportCharts from './ReportCharts'

export default async function AdminReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  // Aggregate data
  const [
    { count: totalUsers },
    { count: totalLost },
    { count: totalFound },
    { count: totalClaims },
    { count: pending },
    { count: approved },
    { count: rejected },
    { count: claimed },
    { data: lostByCategory },
    { data: foundByCategory },
    { data: claimsByMonth },
    { data: topLocationsLost },
    { data: topLocationsFound },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('lost_items').select('*', { count: 'exact', head: true }),
    supabase.from('found_items').select('*', { count: 'exact', head: true }),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('claim_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
    supabase.from('found_items').select('*', { count: 'exact', head: true }).eq('status', 'claimed'),
    supabase.from('lost_items').select('category'),
    supabase.from('found_items').select('category'),
    supabase.from('claim_requests').select('created_at, status'),
    supabase.from('lost_items').select('location_lost'),
    supabase.from('found_items').select('location_found'),
  ])

  // Aggregate category counts
  function countByKey<T extends Record<string, string>>(arr: T[], key: keyof T) {
    const map: Record<string, number> = {}
    arr?.forEach(item => { const v = item[key]; map[v] = (map[v] || 0) + 1 })
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }

  const lostCats = countByKey(lostByCategory || [], 'category')
  const foundCats = countByKey(foundByCategory || [], 'category')

  // Monthly claims
  const monthly: Record<string, { approved: number; rejected: number; pending: number }> = {}
  claimsByMonth?.forEach(c => {
    const m = new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    if (!monthly[m]) monthly[m] = { approved: 0, rejected: 0, pending: 0 }
    monthly[m][c.status as 'approved' | 'rejected' | 'pending']++
  })
  const monthlyData = Object.entries(monthly).slice(-6).map(([month, v]) => ({ month, ...v }))

  const recoveryRate = totalFound ? Math.round(((claimed || 0) / totalFound) * 100) : 0

  const summaryCards = [
    { label: 'Total Users', value: totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lost Reports', value: totalLost || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Found Items', value: totalFound || 0, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Recovery Rate', value: `${recoveryRate}%`, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Pending Claims', value: pending || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Approved Claims', value: approved || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Rejected Claims', value: rejected || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Items Returned', value: claimed || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-blue-600" /> Reports & Analytics
          </h1>
          <p className="text-gray-500 text-sm">System-wide statistics and performance metrics</p>
        </div>
        <p className="text-xs text-gray-400">Generated: {formatDate(new Date().toISOString())}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(s => (
          <Card key={s.label} className="p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Charts client component */}
      <ReportCharts
        lostCats={lostCats}
        foundCats={foundCats}
        monthlyData={monthlyData}
        claimSummary={{ pending: pending || 0, approved: approved || 0, rejected: rejected || 0 }}
      />
    </div>
  )
}
