'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select, Button, Card } from '@/components/ui'
import ImageUpload from '@/components/ImageUpload'
import { ITEM_CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'
import { FileText, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ReportLostItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [form, setForm] = useState({
    title: '', description: '', category: '', date_lost: '', location_lost: '', color: '', brand: ''
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.category || !form.date_lost || !form.location_lost) {
      toast.error('Please fill in all required fields'); return
    }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); setLoading(false); return }

    const { data, error } = await supabase.from('lost_items').insert({
      ...form, user_id: user.id, image_url: imageUrl || null, status: 'searching'
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Lost item reported successfully!')
    router.push(`/lost-items/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Lost Item</h1>
          <p className="text-gray-500 text-sm">Provide as much detail as possible to help identify your item</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <FileText className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-800">Item Details</h2>
          </div>

          <Input label="Item Name *" value={form.title} onChange={set('title')} placeholder="e.g. Black iPhone 14 Pro" required />

          <Select label="Category *" value={form.category} onChange={set('category')} required>
            <option value="">Select a category</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Date Lost *" type="date" value={form.date_lost} onChange={set('date_lost')} required
              max={new Date().toISOString().split('T')[0]} />
            <Input label="Color" value={form.color} onChange={set('color')} placeholder="e.g. Black, Silver" />
          </div>

          <Input label="Location Lost *" value={form.location_lost} onChange={set('location_lost')}
            placeholder="e.g. Library 2nd floor, Cafeteria" required />

          <Input label="Brand / Model" value={form.brand} onChange={set('brand')} placeholder="e.g. Apple, Samsung" />

          <Textarea label="Description" value={form.description} onChange={set('description')}
            placeholder="Any distinguishing features, serial numbers, stickers, damage, etc." rows={4} />

          <ImageUpload value={imageUrl} onChange={setImageUrl} folder="lost-items" label="Photo of Item (optional)" />

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} className="flex-1">
              {loading ? 'Submitting…' : 'Submit Report'}
            </Button>
            <Link href="/dashboard">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
