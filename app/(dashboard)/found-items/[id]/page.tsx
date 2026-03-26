'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Badge, Card, Button, Textarea } from '@/components/ui'
import ImageUpload from '@/components/ImageUpload'
import { MapPin, Calendar, Tag, ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { FoundItem, LostItem } from '@/types'

export default function FoundItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [item, setItem] = useState<FoundItem | null>(null)
  const [myLostItems, setMyLostItems] = useState<LostItem[]>([])
  const [showClaim, setShowClaim] = useState(false)
  const [claimForm, setClaimForm] = useState({ proof_description: '', lost_item_id: '' })
  const [proofImage, setProofImage] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)
  const [existingClaim, setExistingClaim] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [{ data: itemData }, { data: lostItems }, { data: claim }] = await Promise.all([
        supabase.from('found_items').select('*, profiles(full_name)').eq('id', params.id).single(),
        supabase.from('lost_items').select('id, title, category').eq('user_id', user.id).eq('status', 'searching'),
        supabase.from('claim_requests').select('id').eq('user_id', user.id).eq('found_item_id', params.id as string).maybeSingle(),
      ])
      setItem(itemData)
      setMyLostItems(lostItems || [])
      setExistingClaim(!!claim)
    }
    load()
  }, [params.id])

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault()
    if (!claimForm.proof_description) { toast.error('Please describe your proof of ownership'); return }
    setLoading(true)
    const { data, error } = await supabase.from('claim_requests').insert({
      user_id: userId,
      found_item_id: params.id,
      lost_item_id: claimForm.lost_item_id || null,
      proof_description: claimForm.proof_description,
      proof_image_url: proofImage || null,
      status: 'pending',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Update found item status
    await supabase.from('found_items').update({ status: 'pending' }).eq('id', params.id)

    // Send notification to user
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        title: 'Claim Submitted',
        message: `Your claim for "${item?.title}" has been submitted and is pending verification.`,
        type: 'claim_submitted',
        related_item_id: data.id,
        related_type: 'claim',
      }),
    })

    toast.success('Claim submitted! Security will verify your request.')
    setShowClaim(false)
    setExistingClaim(true)
    router.push('/claims')
  }

  if (!item) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/search" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Found Item</h1>
      </div>

      <Card className="overflow-hidden">
        {item.image_url && (
          <div className="h-56"><img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /></div>
        )}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
            <Badge variant={item.status}>{item.status}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-3">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-gray-600">Tracking ID:</span>
            <span className="font-mono font-bold text-gray-900">#{item.tracking_id}</span>
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600"><Tag className="w-4 h-4 text-gray-400" />{item.category}</div>
            {item.color && <div className="flex items-center gap-2 text-gray-600"><span className="text-gray-400">🎨</span>{item.color}</div>}
            {item.brand && <div className="flex items-center gap-2 text-gray-600"><span className="text-gray-400">🏷</span>{item.brand}</div>}
            <div className="flex items-center gap-2 text-gray-600"><Calendar className="w-4 h-4 text-gray-400" />Found {formatDate(item.date_found)}</div>
            <div className="col-span-2 flex items-start gap-2 text-gray-600"><MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />{item.location_found}</div>
          </div>
          {item.description && <div><h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3><p className="text-sm text-gray-600">{item.description}</p></div>}
          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
            <p>Logged by: {item.profiles?.full_name || 'Security Personnel'}</p>
          </div>
        </div>
      </Card>

      {/* Claim section */}
      {item.status !== 'claimed' && (
        <Card className="p-5">
          {existingClaim ? (
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <div>
                <p className="font-semibold">Claim Already Submitted</p>
                <p className="text-sm text-green-600">Security is reviewing your claim request.</p>
              </div>
            </div>
          ) : !showClaim ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Is this yours?</h3>
              <p className="text-sm text-gray-500 mb-4">Submit a claim request with proof of ownership.</p>
              <Button onClick={() => setShowClaim(true)} className="w-full">Submit Claim Request</Button>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="space-y-4">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Submit Claim Request</h3>
              {myLostItems.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Link to My Lost Item (optional)</label>
                  <select value={claimForm.lost_item_id} onChange={e => setClaimForm(f => ({ ...f, lost_item_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">-- Select a reported item --</option>
                    {myLostItems.map(i => <option key={i.id} value={i.id}>{i.title} ({i.category})</option>)}
                  </select>
                </div>
              )}
              <Textarea label="Proof of Ownership *" value={claimForm.proof_description}
                onChange={e => setClaimForm(f => ({ ...f, proof_description: e.target.value }))}
                placeholder="Describe specific details only the owner would know (serial number, receipts, unique markings, contents inside, etc.)" rows={4} required />
              <ImageUpload value={proofImage} onChange={setProofImage} folder="claim-proofs" label="Supporting Photo (receipt, packaging, etc.)" />
              <div className="flex gap-3">
                <Button type="submit" loading={loading} className="flex-1">
                  {loading ? 'Submitting…' : 'Submit Claim'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowClaim(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  )
}
