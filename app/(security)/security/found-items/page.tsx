import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, Badge, EmptyState } from '@/components/ui'
import { Package, PlusCircle, MapPin, Calendar, Search } from 'lucide-react'
import { ITEM_CATEGORIES, formatDate } from '@/lib/utils'
import type { FoundItem } from '@/types'

interface SearchParams { category?: string; status?: string; q?: string }

export default async function SecurityFoundItemsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const { category, status, q } = params

  let query = supabase.from('found_items').select('*, profiles(full_name)').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`title.ilike.%${q}%,tracking_id.ilike.%${q}%,location_found.ilike.%${q}%`)

  const { data: items } = await query

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Found Items Registry</h1>
          <p className="text-gray-500 text-sm">All items logged by security personnel</p>
        </div>
        <Link href="/security/found-items/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" /> Log New Item
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="q" defaultValue={q} placeholder="Search by name, tracking ID, location…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select name="category" defaultValue={category || ''}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="status" defaultValue={status || ''}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="pending">Pending Claim</option>
            <option value="claimed">Claimed</option>
          </select>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Filter
          </button>
          {(q || category || status) && (
            <Link href="/security/found-items" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Clear</Link>
          )}
        </form>
      </Card>

      <p className="text-sm text-gray-500">{items?.length || 0} items</p>

      {!items?.length ? (
        <EmptyState title="No found items" desc="Start logging found items using the button above." icon={<Package className="w-16 h-16" />} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: FoundItem & { profiles: { full_name: string } }) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-36 bg-gray-100 overflow-hidden relative">
                {item.image_url
                  ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-gray-300" /></div>}
                <div className="absolute top-2 right-2"><Badge variant={item.status}>{item.status}</Badge></div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-mono px-2 py-1 rounded">#{item.tracking_id}</div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 truncate">{item.title}</h3>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location_found}</div>
                  <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Found {formatDate(item.date_found)}</div>
                  <div>By: {item.profiles?.full_name || 'Security'}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
