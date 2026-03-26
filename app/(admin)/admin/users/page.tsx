'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, EmptyState } from '@/components/ui'
import { Users, Search, Mail, Phone, Shield, UserCheck, Ban } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Profile, UserRole } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setFiltered(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let f = users
    if (search) f = f.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    if (roleFilter) f = f.filter(u => u.role === roleFilter)
    setFiltered(f)
  }, [search, roleFilter, users])

  async function updateRole(userId: string, role: UserRole) {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
    toast.success(`Role updated to ${role}`)
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    const { error } = await supabase.from('profiles').update({ is_active: !currentActive }).eq('id', userId)
    if (error) { toast.error(error.message); return }
    setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: !currentActive } : x))
    toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}`)
  }

  const counts = { all: users.length, user: users.filter(u => u.role === 'user').length, security: users.filter(u => u.role === 'security').length, admin: users.filter(u => u.role === 'admin').length }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 text-sm">Manage all registered users and their roles</p>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(counts).map(([k, v]) => (
          <Card key={k} className="p-3 text-center cursor-pointer hover:shadow-md transition-shadow" onClick={() => setRoleFilter(k === 'all' ? '' : k)}>
            <div className="text-xl font-bold text-gray-900">{v}</div>
            <div className="text-xs text-gray-500 capitalize">{k === 'all' ? 'Total Users' : `${k}s`}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="security">Security</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </Card>

      <p className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" /></div>
      ) : !filtered.length ? (
        <EmptyState title="No users found" icon={<Users className="w-16 h-16" />} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u: Profile) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-gray-900">{u.full_name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{u.email}</div>
                      {u.phone && <div className="flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" />{u.phone}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge variant={u.role}>{u.role}</Badge></td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select value={u.role} onChange={e => updateRole(u.id, e.target.value as UserRole)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white">
                          <option value="user">User</option>
                          <option value="security">Security</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button onClick={() => toggleActive(u.id, u.is_active)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${u.is_active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          title={u.is_active ? 'Deactivate' : 'Activate'}>
                          {u.is_active ? <Ban className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
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
