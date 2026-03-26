'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, EmptyState, Button } from '@/components/ui'
import { Bell, CheckCheck } from 'lucide-react'
import { timeAgo, NOTIFICATION_ICONS } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Notification } from '@/types'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  async function markAllRead() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications(n => n.map(x => ({ ...x, is_read: true })))
    toast.success('All notifications marked as read')
  }

  async function markOneRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x))
  }

  useEffect(() => { load() }, [])

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 text-sm">{unread} unread</p>
        </div>
        {unread > 0 && (
          <Button variant="secondary" onClick={markAllRead} className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>
        ) : !notifications.length ? (
          <EmptyState title="No notifications" desc="You'll be notified about claim updates and item matches." icon={<Bell className="w-12 h-12" />} />
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map(n => (
              <div key={n.id} onClick={() => !n.is_read && markOneRead(n.id)}
                className={cn('flex items-start gap-4 p-4 transition-colors', !n.is_read ? 'bg-blue-50/50 hover:bg-blue-50 cursor-pointer' : 'hover:bg-gray-50')}>
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0',
                  !n.is_read ? 'bg-blue-100' : 'bg-gray-100')}>
                  {NOTIFICATION_ICONS[n.type] || '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold', !n.is_read ? 'text-gray-900' : 'text-gray-700')}>{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
