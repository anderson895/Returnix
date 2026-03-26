import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, Badge, EmptyState } from '@/components/ui'
import { Package, Search } from 'lucide-react'
import { ITEM_CATEGORIES, formatDate } from '@/lib/utils'
import type { FoundItem, Profile } from '@/types'
import Link from 'next/link'

interface SearchParams { category?: string; status?: string; q?: string }

export default async function AdminFoundItemsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const { category, status, q } = params

  let query = supabase.from('found_items').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`title.ilike.%${q}%,tracking_id.ilike.%${q}%,location_found.ilike.%${q}%`)
  const { data: items } = await query

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Found Items Registry</h1>
        <p className="text-gray-500 text-sm">All found items logged by security personnel</p>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="q" defaultValue={q} placeholder="Search by name, tracking ID, location…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select name="category" defaultValue={category || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="status" defaultValue={status || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="unclaimed">Unclaimed</option>
            <option value="pending">Pending</option>
            <option value="claimed">Claimed</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Filter</button>
          {(q || category || status) && <Link href="/admin/found-items" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Clear</Link>}
        </form>
      </Card>

      <p className="text-sm text-gray-500">{items?.length || 0} items</p>

      {!items?.length ? (
        <EmptyState title="No found items" icon={<Package className="w-16 h-16" />} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Tracking ID</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Logged By</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Date Found</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: FoundItem & { profiles: Profile }) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                        <p className="font-medium text-gray-900">{item.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 text-xs">#{item.tracking_id}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3 text-gray-500">{item.profiles?.full_name || 'Security'}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{item.location_found}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.date_found)}</td>
                    <td className="px-4 py-3"><Badge variant={item.status}>{item.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
