'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, Button, EmptyState } from '@/components/ui'
import { CheckSquare, X, CheckCircle, Clock, Eye, MapPin, Calendar } from 'lucide-react'
import { timeAgo, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ClaimRequest } from '@/types'

export default function SecurityClaimsPage() {
  const [claims, setClaims] = useState<ClaimRequest[]>([])
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<ClaimRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processingAction, setProcessingAction] = useState<'approved' | 'rejected' | null>(null)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    let query = supabase.from('claim_requests')
      .select(`*, 
        found_items(id, title, tracking_id, image_url, location_found, date_found, category, color),
        profiles!claim_requests_user_id_fkey(full_name, email, phone),
        lost_items(title, category, date_lost, location_lost, description)
      `)
      .order('created_at', { ascending: false })
    if (filter !== 'all') query = query.eq('status', filter)
    const { data } = await query
    setClaims(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [filter])

  async function handleVerify(claim: ClaimRequest, action: 'approved' | 'rejected') {
    if (action === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }
    setProcessingAction(action)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('claim_requests').update({
      status: action,
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
      rejection_reason: action === 'rejected' ? rejectionReason : null,
    }).eq('id', claim.id)

    if (error) { toast.error(error.message); setProcessingAction(null); return }

    // Update found item status
    if (action === 'approved') {
      const { error: foundItemError } = await supabase
        .from('found_items')
        .update({ status: 'claimed' })
        .eq('id', claim.found_item_id)

      if (foundItemError) {
        toast.error('Claim approved but failed to update item status: ' + foundItemError.message)
        setProcessingAction(null)
        return
      }

      // Update lost item if linked
      if (claim.lost_item_id) {
        await supabase.from('lost_items').update({ status: 'claimed' }).eq('id', claim.lost_item_id)
      }
    } else {
      // Reset found item back to unclaimed
      const { error: resetError } = await supabase
        .from('found_items')
        .update({ status: 'unclaimed' })
        .eq('id', claim.found_item_id)

      if (resetError) {
        toast.error('Failed to reset item status: ' + resetError.message)
        setProcessingAction(null)
        return
      }
    }

    // Notify user (in-app)
    const notifData = action === 'approved'
      ? { title: 'Claim Approved! 🎉', message: `Your claim for the item has been approved. Please visit the security office to retrieve your item.`, type: 'claim_approved' }
      : { title: 'Claim Rejected', message: `Your claim was rejected. Reason: ${rejectionReason}`, type: 'claim_rejected' }

    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: claim.user_id, ...notifData, related_item_id: claim.id, related_type: 'claim' }),
    })

    // Notify user via email
    const claimantEmail = (claim as any).profiles?.email
    const claimantName = (claim as any).profiles?.full_name || 'User'
    const itemTitle = (claim as any).found_items?.title || 'your item'
    const trackingId = (claim as any).found_items?.tracking_id || ''

    if (claimantEmail) {
      await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: action === 'approved' ? 'claim_approved' : 'claim_rejected',
          to: claimantEmail,
          userName: claimantName,
          itemTitle,
          trackingId,
          ...(action === 'rejected' && { rejectionReason }),
        }),
      })
    }

    toast.success(`Claim ${action} successfully!`)
    setSelected(null)
    setRejectionReason('')
    load()
    setProcessingAction(null)
  }

  const tabs = ['pending', 'approved', 'rejected', 'all'] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Claim Verification</h1>
        <p className="text-gray-500 text-sm">Review and verify user claim requests for found items</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>
      ) : !claims.length ? (
        <EmptyState title={`No ${filter === 'all' ? '' : filter} claims`} desc="Check back later for new submissions." icon={<CheckSquare className="w-16 h-16" />} />
      ) : (
        <div className="space-y-4">
          {claims.map((claim: any) => (
            <Card key={claim.id} className="overflow-hidden">
              <div className="p-4 flex gap-4">
                {/* Found item image */}
                <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {claim.found_items?.image_url
                    ? <img src={claim.found_items.image_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><CheckSquare className="w-8 h-8 text-gray-300" /></div>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-semibold text-gray-900">{claim.found_items?.title}</h3>
                      <p className="text-xs font-mono text-gray-500">#{claim.found_items?.tracking_id}</p>
                    </div>
                    <Badge variant={claim.status}>{claim.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                    <span>👤 Claimed by: <strong className="text-gray-700">{claim.profiles?.full_name}</strong></span>
                    <span>📧 {claim.profiles?.email}</span>
                    {claim.profiles?.phone && <span>📞 {claim.profiles.phone}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Submitted {timeAgo(claim.created_at)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Found at: {claim.found_items?.location_found}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button variant="secondary" onClick={() => setSelected(claim)} className="flex items-center gap-1 text-xs px-3 py-1.5">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">Review Claim Request</h2>
              <button onClick={() => { setSelected(null); setRejectionReason('') }}
                className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Found Item */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Found Item</p>
                <div className="flex gap-3">
                  {(selected as any).found_items?.image_url && (
                    <img src={(selected as any).found_items.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{(selected as any).found_items?.title}</p>
                    <p className="text-xs font-mono text-gray-500">#{(selected as any).found_items?.tracking_id}</p>
                    <p className="text-xs text-gray-500">Found at: {(selected as any).found_items?.location_found}</p>
                    {(selected as any).found_items?.color && <p className="text-xs text-gray-500">Color: {(selected as any).found_items.color}</p>}
                  </div>
                </div>
              </div>

              {/* Claimant Info */}
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Claimant</p>
                <p className="font-semibold text-gray-900">{(selected as any).profiles?.full_name}</p>
                <p className="text-sm text-gray-600">{(selected as any).profiles?.email}</p>
                {(selected as any).profiles?.phone && <p className="text-sm text-gray-600">{(selected as any).profiles.phone}</p>}
              </div>

              {/* Linked Lost Item */}
              {(selected as any).lost_items && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-yellow-700 uppercase mb-2">Linked Lost Item Report</p>
                  <p className="font-semibold text-gray-900">{(selected as any).lost_items.title}</p>
                  <p className="text-xs text-gray-500">Lost on {formatDate((selected as any).lost_items.date_lost)} at {(selected as any).lost_items.location_lost}</p>
                  {(selected as any).lost_items.description && <p className="text-xs text-gray-500 mt-1">{(selected as any).lost_items.description}</p>}
                </div>
              )}

              {/* Proof */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Proof of Ownership</p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{selected.proof_description}</p>
                {selected.proof_image_url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Supporting Photo:</p>
                    <img src={selected.proof_image_url} alt="Proof" className="rounded-lg max-h-48 object-cover" />
                  </div>
                )}
              </div>

              {/* Actions */}
              {selected.status === 'pending' && (
                <div className="space-y-3 border-t pt-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Rejection Reason (required if rejecting)
                    </label>
                    <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                      placeholder="Explain why the claim is being rejected…"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleVerify(selected, 'approved')} disabled={processingAction !== null}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                      {processingAction === 'approved' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve Claim
                    </button>
                    <button type="button" onClick={() => handleVerify(selected, 'rejected')} disabled={processingAction !== null}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                      {processingAction === 'rejected' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <X className="w-4 h-4" />}
                      Reject Claim
                    </button>
                  </div>
                </div>
              )}
              {selected.status !== 'pending' && (
                <div className={`rounded-xl p-3 text-sm font-medium text-center ${selected.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  This claim has been <strong>{selected.status}</strong>.
                  {selected.status === 'rejected' && selected.rejection_reason && <p className="font-normal mt-1">{selected.rejection_reason}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}