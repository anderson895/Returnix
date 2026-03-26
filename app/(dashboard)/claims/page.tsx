import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge, Card, EmptyState } from '@/components/ui'
import { ClipboardList, Calendar, Shield } from 'lucide-react'
import { formatDate, timeAgo } from '@/lib/utils'
import Link from 'next/link'
import type { ClaimRequest } from '@/types'

export default async function ClaimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: claims } = await supabase
    .from('claim_requests')
    .select('*, found_items(id, title, tracking_id, image_url, location_found, date_found), profiles!claim_requests_verified_by_fkey(full_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const counts = {
    all: claims?.length || 0,
    pending: claims?.filter(c => c.status === 'pending').length || 0,
    approved: claims?.filter(c => c.status === 'approved').length || 0,
    rejected: claims?.filter(c => c.status === 'rejected').length || 0,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
        <p className="text-gray-500 text-sm">Track all your claim requests for found items</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(counts).map(([k, v]) => (
          <Card key={k} className="p-3 text-center">
            <div className="text-xl font-bold text-gray-900">{v}</div>
            <div className="text-xs text-gray-500 capitalize">{k === 'all' ? 'Total' : k}</div>
          </Card>
        ))}
      </div>

      {/* Claims list */}
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-gray-500" />
          <h2 className="font-semibold text-gray-900">All Claims ({counts.all})</h2>
        </div>
        {!claims?.length ? (
          <EmptyState
            title="No claims yet"
            desc="Browse found items and submit a claim if you find yours."
            icon={<ClipboardList className="w-12 h-12" />}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {claims.map((claim: ClaimRequest & { found_items: { id: string; title: string; tracking_id: string; image_url: string; location_found: string; date_found: string }; profiles: { full_name: string } | null }) => (
              <div key={claim.id} className="p-4 flex gap-4">
                {/* Item image */}
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {claim.found_items?.image_url
                    ? <img src={claim.found_items.image_url} alt="" className="w-full h-full object-cover" />
                    : <Shield className="w-8 h-8 text-gray-300 m-4" />
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <Link href={`/found-items/${claim.found_items?.id}`} className="font-semibold text-gray-900 hover:text-blue-600 truncate">
                      {claim.found_items?.title}
                    </Link>
                    <Badge variant={claim.status}>{claim.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mb-2">Tracking #{claim.found_items?.tracking_id}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Submitted {timeAgo(claim.created_at)}</span>
                    {claim.found_items?.location_found && <span>📍 {claim.found_items.location_found}</span>}
                  </div>
                  {claim.status === 'approved' && (
                    <div className="mt-2 text-xs text-green-700 bg-green-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1">
                      ✅ Approved by {claim.profiles?.full_name || 'Security'} on {claim.verified_at ? formatDate(claim.verified_at) : '—'}
                    </div>
                  )}
                  {claim.status === 'rejected' && claim.rejection_reason && (
                    <div className="mt-2 text-xs text-red-700 bg-red-50 rounded-lg px-3 py-1.5">
                      ❌ Rejected: {claim.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
