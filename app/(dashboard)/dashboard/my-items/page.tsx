import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, Badge, EmptyState } from '@/components/ui'
import { FileText, Calendar, MapPin, PlusCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import type { LostItem } from '@/types'

export default async function MyItemsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: items } = await supabase
    .from('lost_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lost Items</h1>
          <p className="text-gray-500 text-sm">All items you have reported as lost</p>
        </div>
        <Link href="/lost-items/report"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" />
          Report New
        </Link>
      </div>

      <Card>
        {!items?.length ? (
          <EmptyState
            title="No lost items"
            desc="You haven't reported any lost items yet."
            icon={<FileText className="w-12 h-12" />}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item: LostItem) => (
              <Link key={item.id} href={`/lost-items/${item.id}`}
                className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    : <FileText className="w-6 h-6 text-gray-400 m-3" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(item.date_lost)}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.location_lost}</span>
                  </div>
                </div>
                <Badge variant={item.status}>{item.status}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
