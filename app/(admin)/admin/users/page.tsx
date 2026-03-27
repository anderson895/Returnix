'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Badge, EmptyState } from '@/components/ui'
import {
  Users, Search, Mail, Phone, UserCheck, Ban,
  PlusCircle, X, Edit2, Eye, EyeOff, Save
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Profile, UserRole } from '@/types'

interface AddUserForm {
  full_name: string; email: string; phone: string
  password: string; confirm: string; role: UserRole
}
interface EditUserForm { full_name: string; phone: string; role: UserRole }

const EMPTY_ADD: AddUserForm = {
  full_name: '', email: '', phone: '', password: '', confirm: '', role: 'user',
}

const roleColor: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  security: 'bg-emerald-100 text-emerald-700',
  user: 'bg-blue-100 text-blue-700',
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers]       = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [showAdd, setShowAdd]       = useState(false)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [viewTarget, setViewTarget] = useState<Profile | null>(null)

  const [addForm, setAddForm]   = useState<AddUserForm>(EMPTY_ADD)
  const [editForm, setEditForm] = useState<EditUserForm>({ full_name: '', phone: '', role: 'user' })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving]     = useState(false)

  // ── Load all users ────────────────────────────────────
  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) toast.error('Failed to load users: ' + error.message)
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // ── Filter ────────────────────────────────────────────
  useEffect(() => {
    let f = users
    if (search)
      f = f.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    if (roleFilter) f = f.filter(u => u.role === roleFilter)
    setFiltered(f)
  }, [search, roleFilter, users])

  // ── Add User via API route (no email confirmation) ────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (addForm.password !== addForm.confirm) { toast.error('Passwords do not match'); return }
    if (addForm.password.length < 6) { toast.error('Min. 6 characters for password'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: addForm.full_name,
          email:     addForm.email,
          phone:     addForm.phone,
          password:  addForm.password,
          role:      addForm.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create user')

      toast.success(`✅ ${addForm.full_name} created — no email confirmation needed!`)
      setShowAdd(false)
      setAddForm(EMPTY_ADD)
      setShowPass(false)
      setTimeout(load, 600)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Edit User ─────────────────────────────────────────
  function openEdit(u: Profile) {
    setEditTarget(u)
    setEditForm({ full_name: u.full_name || '', phone: u.phone || '', role: u.role })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      full_name:  editForm.full_name,
      phone:      editForm.phone,
      role:       editForm.role,
      updated_at: new Date().toISOString(),
    }).eq('id', editTarget.id)

    if (error) { toast.error(error.message); setSaving(false); return }
    setUsers(u => u.map(x => x.id === editTarget.id
      ? { ...x, full_name: editForm.full_name, phone: editForm.phone, role: editForm.role }
      : x
    ))
    toast.success('User updated!')
    setEditTarget(null)
    setSaving(false)
  }

  // ── Toggle Active ─────────────────────────────────────
  async function toggleActive(u: Profile) {
    const next = !u.is_active
    const { error } = await supabase.from('profiles').update({ is_active: next }).eq('id', u.id)
    if (error) { toast.error(error.message); return }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: next } : x))
    toast.success(`User ${next ? 'activated' : 'deactivated'}`)
  }

  const counts = {
    all:      users.length,
    user:     users.filter(u => u.role === 'user').length,
    security: users.filter(u => u.role === 'security').length,
    admin:    users.filter(u => u.role === 'admin').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Add, edit, and manage all system users</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <PlusCircle className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-4 gap-3">
        {(Object.entries(counts) as [string, number][]).map(([k, v]) => (
          <Card key={k}
            className={`p-3 text-center cursor-pointer hover:shadow-md transition-all ${roleFilter === (k === 'all' ? '' : k) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setRoleFilter(k === 'all' ? '' : k)}>
            <div className="text-xl font-bold text-gray-900">{v}</div>
            <div className="text-xs text-gray-500 capitalize">{k === 'all' ? 'Total Users' : `${k}s`}</div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="security">Security</option>
            <option value="admin">Admin</option>
          </select>
          {(search || roleFilter) && (
            <button onClick={() => { setSearch(''); setRoleFilter('') }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
              Clear
            </button>
          )}
        </div>
      </Card>

      <p className="text-sm text-gray-500">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
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
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name || 'Unnamed'}</p>
                          <p className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <div className="flex items-center gap-1 text-xs"><Mail className="w-3 h-3" />{u.email}</div>
                      {u.phone && <div className="flex items-center gap-1 mt-0.5 text-xs"><Phone className="w-3 h-3" />{u.phone}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge variant={u.role}>{u.role}</Badge></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setViewTarget(u)} title="View"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => openEdit(u)} title="Edit"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleActive(u)}
                          title={u.is_active ? 'Deactivate' : 'Activate'}
                          className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
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

      {/* ── ADD USER MODAL ──────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Add New User</h2>
                <p className="text-xs text-gray-400 mt-0.5">No email confirmation required</p>
              </div>
              <button onClick={() => { setShowAdd(false); setAddForm(EMPTY_ADD); setShowPass(false) }}
                className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={addForm.full_name}
                  onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="Juan Dela Cruz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input required type="email" value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input type="tel" value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+63 912 345 6789"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={addForm.role}
                  onChange={e => setAddForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="user">User</option>
                  <option value="security">Security Personnel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input required type={showPass ? 'text' : 'password'} value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters" minLength={6}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input required type={showPass ? 'text' : 'password'} value={addForm.confirm}
                  onChange={e => setAddForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Repeat password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {addForm.role !== 'user' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  ⚠️ This account will have <strong>{addForm.role}</strong> role with elevated access.
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {saving ? 'Creating…' : 'Create User'}
                </button>
                <button type="button" onClick={() => { setShowAdd(false); setAddForm(EMPTY_ADD); setShowPass(false) }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ─────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">Edit User</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEdit} className="p-5 space-y-4">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                  {editTarget.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{editTarget.full_name}</p>
                  <p className="text-xs text-gray-500">{editTarget.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required value={editForm.full_name}
                  onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={editForm.phone}
                  onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+63 912 345 6789"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select value={editForm.role}
                  onChange={e => setEditForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="user">User</option>
                  <option value="security">Security Personnel</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setEditTarget(null)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW USER MODAL ─────────────────────────────── */}
      {viewTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">User Details</h2>
              <button onClick={() => setViewTarget(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl">
                  {viewTarget.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <p className="font-bold text-gray-900 text-lg">{viewTarget.full_name || 'Unnamed'}</p>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${roleColor[viewTarget.role]}`}>
                  {viewTarget.role}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                {[
                  { label: 'Email',   value: viewTarget.email },
                  { label: 'Phone',   value: viewTarget.phone || '—' },
                  { label: 'Joined',  value: formatDate(viewTarget.created_at) },
                  { label: 'Updated', value: formatDate(viewTarget.updated_at) },
                  { label: 'User ID', value: viewTarget.id.slice(0, 16) + '…' },
                ].map(row => (
                  <div key={row.label} className="flex items-start justify-between gap-4 py-2 border-b border-gray-50">
                    <span className="text-gray-400 font-medium shrink-0">{row.label}</span>
                    <span className="text-gray-700 text-right break-all text-xs">{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-400 font-medium">Status</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${viewTarget.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {viewTarget.is_active ? '● Active' : '○ Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => { setViewTarget(null); openEdit(viewTarget) }}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { toggleActive(viewTarget); setViewTarget(null) }}
                  className={`flex-1 flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition ${viewTarget.is_active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'}`}>
                  {viewTarget.is_active
                    ? <><Ban className="w-3.5 h-3.5" /> Deactivate</>
                    : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}