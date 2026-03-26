'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, FileText, Search, ClipboardList, Bell,
  Shield, Package, CheckSquare, Users, BarChart2, LogOut, Settings
} from 'lucide-react'
import type { Profile } from '@/types'

interface SidebarProps {
  profile: Profile
  unreadCount?: number
}

const userNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/lost-items/report', label: 'Report Lost Item', icon: FileText },
  { href: '/dashboard/search', label: 'Search Found Items', icon: Search },
  { href: '/claims', label: 'My Claims', icon: ClipboardList },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

const securityNav = [
  { href: '/security', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/security/found-items/new', label: 'Log Found Item', icon: Package },
  { href: '/security/found-items', label: 'Found Items', icon: Search },
  { href: '/security/claims', label: 'Verify Claims', icon: CheckSquare },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/lost-items', label: 'Lost Items', icon: FileText },
  { href: '/admin/found-items', label: 'Found Items', icon: Package },
  { href: '/admin/claims', label: 'Claims', icon: CheckSquare },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

export default function Sidebar({ profile, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const nav = profile.role === 'admin' ? adminNav : profile.role === 'security' ? securityNav : userNav
  const roleColor = { admin: 'text-purple-600 bg-purple-100', security: 'text-emerald-600 bg-emerald-100', user: 'text-blue-600 bg-blue-100' }

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">LostFound</span>
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
            {profile.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{profile.full_name || 'User'}</p>
            <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full capitalize', roleColor[profile.role])}>
              {profile.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/security' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}>
              <item.icon className={cn('w-4 h-4', active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600')} />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
          <Settings className="w-4 h-4 text-gray-400" />
          Settings
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </aside>
  )
}
