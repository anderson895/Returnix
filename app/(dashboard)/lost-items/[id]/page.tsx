import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Badge, Card, Button } from '@/components/ui'
import { MapPin, Calendar, Tag, ArrowLeft, Edit, Package } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import type { LostItem } from '@/types'

export default async function LostItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params
  const { data: item } = await supabase.from('lost_items').select('*, profiles(full_name, email, phone)').eq('id', id).single()
  if (!item) notFound()

  const isOwner = item.user_id === user.id
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Lost Item Report</h1>
      </div>

      <Card className="overflow-hidden">
        {item.image_url && (
          <div className="h-56 overflow-hidden">
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
            <Badge variant={item.status}>{item.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Tag className="w-4 h-4 text-gray-400" />
              <span>{item.category}</span>
            </div>
            {item.color && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400">🎨</span>
                <span>{item.color}</span>
              </div>
            )}
            {item.brand && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="text-gray-400">🏷</span>
                <span>{item.brand}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Lost on {formatDate(item.date_lost)}</span>
            </div>
            <div className="col-span-2 flex items-start gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span>{item.location_lost}</span>
            </div>
          </div>

          {item.description && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
            <p>Reported by: {item.profiles?.full_name}</p>
            <p>Submitted: {formatDateTime(item.created_at)}</p>
          </div>
        </div>
      </Card>

      {/* Browse found items */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Check Found Items</h3>
            <p className="text-sm text-gray-500">Search our database for your item</p>
          </div>
        </div>
        <Link href="/dashboard/search">
          <Button className="w-full">Browse Found Items</Button>
        </Link>
      </Card>
    </div>
  )
}
