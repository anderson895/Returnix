import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, Badge, EmptyState } from '@/components/ui'
import { ClipboardList, Calendar } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import type { ClaimRequest } from '@/types'

interface SearchParams { status?: string }

export default async function AdminClaimsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const params = await searchParams
  const { status } = params

  let query = supabase.from('claim_requests')
    .select(`*, 
      found_items(title, tracking_id, image_url, location_found),
      profiles!claim_requests_user_id_fkey(full_name, email),
      verifier:profiles!claim_requests_verified_by_fkey(full_name)
    `)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)

  const { data: claims } = await query

  const counts = {
    all: claims?.length || 0,
    pending: claims?.filter(c => c.status === 'pending').length || 0,
    approved: claims?.filter(c => c.status === 'approved').length || 0,
    rejected: claims?.filter(c => c.status === 'rejected').length || 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Claims Management</h1>
        <p className="text-gray-500 text-sm">All claim requests across the system</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <a key={s} href={s === 'all' ? '/admin/claims' : `/admin/claims?status=${s}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${(!status && s === 'all') || status === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {s} ({counts[s as keyof typeof counts]})
          </a>
        ))}
      </div>

      {!claims?.length ? (
        <EmptyState title="No claims found" icon={<ClipboardList className="w-16 h-16" />} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Found Item</th>
                  <th className="px-4 py-3 text-left">Claimant</th>
                  <th className="px-4 py-3 text-left">Submitted</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {c.found_items?.image_url && (
                          <img src={c.found_items.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{c.found_items?.title}</p>
                          <p className="text-xs font-mono text-gray-500">#{c.found_items?.tracking_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{c.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{c.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{timeAgo(c.created_at)}</div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={c.status}>{c.status}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.verifier?.full_name || (c.status === 'pending' ? '—' : 'System')}
                      {c.verified_at && <p className="text-xs">{formatDate(c.verified_at)}</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
