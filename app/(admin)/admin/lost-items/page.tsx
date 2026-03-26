import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, Badge, EmptyState } from '@/components/ui'
import { FileText, Search } from 'lucide-react'
import { ITEM_CATEGORIES, formatDate } from '@/lib/utils'
import type { LostItem, Profile } from '@/types'
import Link from 'next/link'

interface SearchParams { category?: string; status?: string; q?: string }

export default async function AdminLostItemsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const { category, status, q } = params

  let query = supabase.from('lost_items').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)
  if (q) query = query.or(`title.ilike.%${q}%,location_lost.ilike.%${q}%`)
  const { data: items } = await query

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lost Item Reports</h1>
        <p className="text-gray-500 text-sm">All lost item reports submitted by users</p>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input name="q" defaultValue={q} placeholder="Search items…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select name="category" defaultValue={category || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Categories</option>
            {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="status" defaultValue={status || ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Status</option>
            <option value="searching">Searching</option>
            <option value="found">Found</option>
            <option value="claimed">Claimed</option>
            <option value="closed">Closed</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Filter</button>
          {(q || category || status) && <Link href="/admin/lost-items" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600">Clear</Link>}
        </form>
      </Card>

      <p className="text-sm text-gray-500">{items?.length || 0} reports</p>

      {!items?.length ? (
        <EmptyState title="No lost items found" icon={<FileText className="w-16 h-16" />} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Item</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Reported By</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Date Lost</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item: LostItem & { profiles: Profile }) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.image_url && <img src={item.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />}
                        <div>
                          <p className="font-medium text-gray-900">{item.title}</p>
                          {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{item.profiles?.full_name}</p>
                      <p className="text-xs text-gray-500">{item.profiles?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{item.location_lost}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(item.date_lost)}</td>
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
