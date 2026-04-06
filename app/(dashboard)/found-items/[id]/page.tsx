'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button, Card, Badge, Textarea } from '@/components/ui'
import ImageUpload from '@/components/ImageUpload'
import { ArrowLeft, MapPin, Calendar, Tag, Shield, ClipboardList } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { FoundItem } from '@/types'

export default function FoundItemDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [item, setItem] = useState<FoundItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [showClaimForm, setShowClaimForm] = useState(false)
  const [proofDescription, setProofDescription] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState<string | undefined>()
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: foundItem } = await supabase
        .from('found_items')
        .select('*, profiles(full_name)')
        .eq('id', id)
        .single()

      if (!foundItem) { toast.error('Item not found'); router.push('/dashboard/search'); return }
      setItem(foundItem)

      const { data: existingClaim } = await supabase
        .from('claim_requests')
        .select('id, status')
        .eq('found_item_id', id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingClaim) setAlreadyClaimed(true)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleClaim() {
    if (!proofDescription.trim()) { toast.error('Please describe proof of ownership'); return }
    setClaiming(true)

    const { error } = await supabase.from('claim_requests').insert({
      user_id: userId,
      found_item_id: id,
      proof_description: proofDescription,
      proof_image_url: proofImageUrl || null,
      status: 'pending',
    })

    if (error) { toast.error(error.message); setClaiming(false); return }

    await supabase.from('found_items').update({ status: 'pending' }).eq('id', id)

    const { data: securityUsers } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['security', 'admin'])

    if (securityUsers) {
      const notifications = securityUsers.map(s => ({
        user_id: s.id,
        title: 'New Claim Request',
        message: `A user has submitted a claim for "${item?.title}"`,
        type: 'claim_submitted' as const,
        related_item_id: id as string,
        related_type: 'found_item',
        is_read: false,
      }))
      await supabase.from('notifications').insert(notifications)
    }

    toast.success('Claim submitted successfully! Security will review it.')
    router.push('/claims')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/search" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
          <p className="text-gray-500 text-sm font-mono">Tracking #{item.tracking_id}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={item.status}>{item.status}</Badge>
        </div>
      </div>

      {item.image_url && (
        <Card className="overflow-hidden">
          <img src={item.image_url} alt={item.title} className="w-full max-h-80 object-cover" />
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" /> Item Details
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Category</span>
            <p className="font-medium text-gray-900">{item.category}</p>
          </div>
          <div>
            <span className="text-gray-500">Date Found</span>
            <p className="font-medium text-gray-900 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.date_found)}</p>
          </div>
          <div>
            <span className="text-gray-500">Location Found</span>
            <p className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location_found}</p>
          </div>
          {item.color && (
            <div>
              <span className="text-gray-500">Color</span>
              <p className="font-medium text-gray-900">{item.color}</p>
            </div>
          )}
          {item.brand && (
            <div>
              <span className="text-gray-500">Brand</span>
              <p className="font-medium text-gray-900">{item.brand}</p>
            </div>
          )}
        </div>
        {item.description && (
          <div>
            <span className="text-gray-500 text-sm">Description</span>
            <p className="text-gray-900 text-sm mt-1">{item.description}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        {alreadyClaimed ? (
          <div className="text-center py-4">
            <ClipboardList className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">You already submitted a claim</p>
            <p className="text-sm text-gray-500 mb-3">Check the status in your claims page.</p>
            <Link href="/claims"><Button variant="secondary">View My Claims</Button></Link>
          </div>
        ) : item.status === 'claimed' ? (
          <div className="text-center py-4">
            <Shield className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">This item has been claimed</p>
          </div>
        ) : !showClaimForm ? (
          <div className="text-center py-4">
            <p className="text-gray-600 text-sm mb-4">Is this your item? Submit a claim to get it back.</p>
            <Button onClick={() => setShowClaimForm(true)} className="px-8">
              Claim This Item
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-blue-600" /> Submit Claim
            </h2>
            <Textarea
              label="Proof of Ownership *"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Describe how you can prove this item is yours (e.g., serial number, unique marks, what's inside, purchase receipt, etc.)"
              rows={4}
            />
            <ImageUpload value={proofImageUrl} onChange={setProofImageUrl} folder="claims" label="Proof Image (optional)" />
            <div className="flex gap-3">
              <Button onClick={handleClaim} loading={claiming} className="flex-1">
                {claiming ? 'Submitting…' : 'Submit Claim'}
              </Button>
              <Button variant="secondary" onClick={() => setShowClaimForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
