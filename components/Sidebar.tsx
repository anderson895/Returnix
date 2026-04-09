'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, FileText, Search, ClipboardList, Bell,
  Shield, Package, CheckSquare, Users, BarChart2, LogOut, Settings
} from 'lucide-react'
import type { Profile } from '@/types'

// ── Palette ──────────────────────────────────────────────────────────────
// burgundy   #75162E  →  sidebar base, nav header, footer
// darkBurg   #550B18  →  logo bar (slightly darker strip)
// deepMaroon #3A000C  →  active nav item bg
// cream      #F2E5C5  →  all text, icons, accents
// ─────────────────────────────────────────────────────────────────────────

interface SidebarProps { profile: Profile; unreadCount?: number }

const userNav = [
  { href: '/dashboard',         label: 'Dashboard',          icon: LayoutDashboard },
  { href: '/lost-items/report', label: 'Report Lost Item',   icon: FileText },
  { href: '/dashboard/search',  label: 'Search Found Items', icon: Search },
  { href: '/claims',            label: 'My Claims',          icon: ClipboardList },
  { href: '/notifications',     label: 'Notifications',      icon: Bell },
]
const securityNav = [
  { href: '/security',                 label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/security/found-items/new', label: 'Log Found Item', icon: Package },
  { href: '/security/found-items',     label: 'Found Items',  icon: Search },
  { href: '/security/claims',          label: 'Verify Claims',icon: CheckSquare },
  { href: '/notifications',            label: 'Notifications',icon: Bell },
]
const adminNav = [
  { href: '/admin',             label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/users',       label: 'Users',        icon: Users },
  { href: '/admin/lost-items',  label: 'Lost Items',   icon: FileText },
  { href: '/admin/found-items', label: 'Found Items',  icon: Package },
  { href: '/admin/claims',      label: 'Claims',       icon: CheckSquare },
  { href: '/admin/reports',     label: 'Reports',      icon: BarChart2 },
  { href: '/notifications',     label: 'Notifications',icon: Bell },
]
const roleLabels: Record<string, string> = {
  admin: 'Administrator', security: 'Security Staff', user: 'Student / Staff',
}

export default function Sidebar({ profile, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const nav = profile.role === 'admin' ? adminNav : profile.role === 'security' ? securityNav : userNav

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logged out')
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col fixed left-0 top-0 z-20"
      style={{ background: '#75162E', fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* Top cream accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />

      {/* ── Logo bar — slightly darker strip ── */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ background: '#550B18', borderBottom: '1px solid rgba(242,229,197,0.12)' }}>
        {/* School logo only */}
        <Image
          src="/school_logo.png"
          alt="Marinduque State University"
          width={36}
          height={36}
          className="rounded-lg object-contain flex-shrink-0"
          style={{ background: 'rgba(242,229,197,0.92)', padding: '3px' }}
        />
        <div className="min-w-0">
          <div className="font-bold text-base truncate" style={{ color: '#F2E5C5', letterSpacing: '0.05em' }}>Back2U</div>
          <div style={{ color: 'rgba(242,229,197,0.5)', fontSize: '8px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            MarSU Lost & Found
          </div>
        </div>
      </div>

      {/* ── Profile ── */}
      <div className="px-4 py-3 flex items-center gap-3"
        style={{ borderBottom: '1px solid rgba(242,229,197,0.1)' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: 'rgba(242,229,197,0.18)', color: '#F2E5C5', border: '1.5px solid rgba(242,229,197,0.3)' }}>
          {profile.full_name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: '#F2E5C5' }}>
            {profile.full_name || 'User'}
          </p>
          <span className="text-xs px-2 py-0.5 rounded-full capitalize inline-block mt-0.5"
            style={{ background: 'rgba(242,229,197,0.18)', color: '#F2E5C5', fontSize: '10px' }}>
            {roleLabels[profile.role] ?? profile.role}
          </span>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(item => {
          const exactMatch = nav.some(n => n.href === pathname)
          const active =
            pathname === item.href ||
            (!exactMatch &&
             item.href !== '/dashboard' && item.href !== '/admin' && item.href !== '/security' &&
             pathname.startsWith(item.href))

          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
              style={active
                ? { background: '#550B18', color: '#F2E5C5', borderLeft: '3px solid #F2E5C5', paddingLeft: '9px' }
                : { color: 'rgba(242,229,197,0.7)' }
              }
              onMouseOver={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(242,229,197,0.1)' }}
              onMouseOut={e =>  { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <item.icon className="w-4 h-4 flex-shrink-0"
                style={{ color: active ? '#F2E5C5' : 'rgba(242,229,197,0.5)' }} />
              <span className="flex-1">{item.label}</span>
              {item.label === 'Notifications' && unreadCount > 0 && (
                <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0"
                  style={{ background: '#F2E5C5', color: '#75162E', fontSize: '10px' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-3 py-3 space-y-0.5" style={{ borderTop: '1px solid rgba(242,229,197,0.1)' }}>
        <Link href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: 'rgba(242,229,197,0.7)' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(242,229,197,0.1)' }}
          onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <Settings className="w-4 h-4" style={{ color: 'rgba(242,229,197,0.5)' }} />
          Settings
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          style={{ color: 'rgba(242,229,197,0.7)' }}
          onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(242,229,197,0.1)' }}
          onMouseOut={e =>  { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
          <LogOut className="w-4 h-4" style={{ color: 'rgba(242,229,197,0.5)' }} />
          Log Out
        </button>
      </div>

      {/* Bottom cream accent line */}
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
    </aside>
  )
}