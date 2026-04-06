'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge } from '@/components/ui'
import { ArrowLeft, MapPin, Calendar, Tag, FileText } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { LostItem } from '@/types'

export default function LostItemDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [item, setItem] = useState<LostItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('lost_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (!data) { toast.error('Item not found'); router.push('/dashboard'); return }
      setItem(data)
      setLoading(false)
    }
    load()
  }, [id])

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
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{item.title}</h1>
          <p className="text-gray-500 text-sm">Lost item details</p>
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
          <FileText className="w-4 h-4 text-blue-600" /> Item Details
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Category</span>
            <p className="font-medium text-gray-900">{item.category}</p>
          </div>
          <div>
            <span className="text-gray-500">Date Lost</span>
            <p className="font-medium text-gray-900 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(item.date_lost)}</p>
          </div>
          <div>
            <span className="text-gray-500">Location Lost</span>
            <p className="font-medium text-gray-900 flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.location_lost}</p>
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

      <Card className="p-4 text-center">
        <p className="text-sm text-gray-500 mb-3">Think you spotted a matching found item?</p>
        <Link href="/dashboard/search" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Browse Found Items →
        </Link>
      </Card>
    </div>
  )
}
