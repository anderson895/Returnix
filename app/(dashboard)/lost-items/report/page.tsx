'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select, Button, Card } from '@/components/ui'
import ImageUpload from '@/components/ImageUpload'
import { ITEM_CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Package, ArrowLeft, Shield } from 'lucide-react'
import Link from 'next/link'

export default function LogFoundItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [submittedItem, setSubmittedItem] = useState<{ tracking_id: string; title: string } | null>(null)
  const [form, setForm] = useState({
    title: '', description: '', category: '', date_found: '', location_found: '', color: '', brand: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.date_found || !form.location_found) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    const { data, error } = await supabase.from('found_items').insert({
      ...form,
      security_id: user.id,
      image_url: imageUrl || null,
      status: 'unclaimed',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Found item logged successfully!')

    // Notify users who reported a lost item in the same category
    const { data: matchingLostItems } = await supabase
      .from('lost_items')
      .select('id, title, user_id, profiles(email, full_name)')
      .eq('category', form.category)
      .eq('status', 'searching')

    if (matchingLostItems && matchingLostItems.length > 0) {
      const notifyPromises = matchingLostItems.map(async (lostItem: any) => {
        const userEmail = lostItem.profiles?.email
        const userName = lostItem.profiles?.full_name || 'User'
        if (!userEmail) return

        // Send in-app notification
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: lostItem.user_id,
            title: '🎉 Possible Match Found!',
            message: `A new found item "${data.title}" may match your lost item "${lostItem.title}". Check it out!`,
            type: 'match_found',
            related_item_id: data.id,
            related_type: 'found_item',
          }),
        })

        // Send email notification
        await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'match_found',
            to: userEmail,
            userName,
            itemTitle: lostItem.title,
            foundItemTitle: data.title,
            trackingId: data.tracking_id,
            location: data.location_found,
          }),
        })
      })
      await Promise.allSettled(notifyPromises)
    }

    setSubmittedItem({ tracking_id: data.tracking_id, title: data.title })
    setLoading(false)
  }

  if (submittedItem) {
    return (
      <div className="max-w-md mx-auto animate-fade-in">
        <Card className="p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Item Logged Successfully!</h2>
          <p className="text-gray-500 text-sm mb-6">The found item has been recorded. Share this Tracking ID with the owner:</p>
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500 mb-1">Tracking ID</p>
            <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest">#{submittedItem.tracking_id}</p>
            <p className="text-sm text-gray-600 mt-1">{submittedItem.title}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => { setSubmittedItem(null); setForm({ title: '', description: '', category: '', date_found: '', location_found: '', color: '', brand: '' }); setImageUrl(undefined) }} className="flex-1">
              Log Another Item
            </Button>
            <Link href="/security" className="flex-1">
              <Button variant="secondary" className="w-full">Back to Dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/security" className="text-gray-400 hover:text-gray-600"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log Found Item</h1>
          <p className="text-gray-500 text-sm">Record details of an item found on the premises</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Package className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-800">Found Item Details</h2>
          </div>

          <Input label="Item Name *" value={form.title} onChange={set('title')} placeholder="e.g. Black Wallet, iPhone 13, Blue Backpack" required />

          <Select label="Category *" value={form.category} onChange={set('category')} required>
            <option value="">Select a category</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date Found *" type="date" value={form.date_found} onChange={set('date_found')} required max={new Date().toISOString().split('T')[0]} />
            <Input label="Color" value={form.color} onChange={set('color')} placeholder="e.g. Black, Brown" />
          </div>

          <Input label="Location Found *" value={form.location_found} onChange={set('location_found')} placeholder="e.g. Main entrance, Parking lot B, Room 204" required />

          <Input label="Brand / Model" value={form.brand} onChange={set('brand')} placeholder="e.g. Samsung, Adidas" />

          <Textarea label="Description" value={form.description} onChange={set('description')} placeholder="Condition of item, distinguishing marks, contents (if applicable), etc." rows={3} />

          <ImageUpload value={imageUrl} onChange={setImageUrl} folder="found-items" label="Item Photo" />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            💡 A unique <strong>Tracking ID</strong> will be automatically generated and shown after submission.
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {loading ? 'Logging…' : 'Log Found Item'}
            </Button>
            <Link href="/security"><Button type="button" variant="secondary">Cancel</Button></Link>
          </div>
        </form>
      </Card>
    </div>
  )
}