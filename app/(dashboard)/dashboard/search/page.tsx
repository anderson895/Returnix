import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, Badge, EmptyState } from '@/components/ui'
import { Search, MapPin, Calendar, Tag } from 'lucide-react'
import { ITEM_CATEGORIES, formatDate } from '@/lib/utils'
import type { FoundItem } from '@/types'

interface SearchParams { category?: string; q?: string; status?: string }

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const params = await searchParams
  const { category, q, status } = params

  let query = supabase.from('found_items').select('*, profiles(full_name)').order('created_at', { ascending: false })

  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)
  else query = query.in('status', ['unclaimed', 'pending'])
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,location_found.ilike.%${q}%`)

  const { data: items } = await query

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Found Items</h1>
        <p className="text-gray-500 text-sm">Browse items found by security personnel. Find yours and submit a claim.</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="q" defaultValue={q} placeholder="Search by name, description, location…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select name="category" defaultValue={category || ''}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="status" defaultValue={status || ''}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Available Only</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="pending">Pending Claim</option>
            <option value="claimed">Claimed</option>
          </select>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Search
          </button>
          {(q || category || status) && (
            <Link href="/dashboard/search" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Clear
            </Link>
          )}
        </form>
      </Card>

      {/* Results */}
      <div>
        <p className="text-sm text-gray-500 mb-4">{items?.length || 0} item{items?.length !== 1 ? 's' : ''} found</p>
        {!items?.length ? (
          <EmptyState
            title="No items found"
            desc="Try adjusting your search filters or check back later."
            icon={<Search className="w-16 h-16" />}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: FoundItem) => (
              <Link key={item.id} href={`/found-items/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="h-40 bg-gray-100 overflow-hidden relative">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Tag className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={item.status}>{item.status}</Badge>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{item.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <Tag className="w-3 h-3" /> {item.category}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                      <MapPin className="w-3 h-3" /> {item.location_found}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <Calendar className="w-3 h-3" /> Found {formatDate(item.date_found)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
                        #{item.tracking_id}
                      </span>
                      {item.color && <span className="text-xs text-gray-500">{item.color}</span>}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
