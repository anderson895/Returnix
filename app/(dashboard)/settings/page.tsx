'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, Input, Button } from '@/components/ui'
import { User, Lock, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState({ full_name: '', phone: '' })
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [savingPass, setSavingPass] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) { setProfile(data); setForm({ full_name: data.full_name || '', phone: data.phone || '' }) }
    }
    load()
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone, updated_at: new Date().toISOString() }).eq('id', user.id)
    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
    setSaving(false)
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwords.newPass !== passwords.confirm) { toast.error('Passwords do not match'); return }
    if (passwords.newPass.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setSavingPass(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
    if (error) toast.error(error.message)
    else { toast.success('Password changed!'); setPasswords({ current: '', newPass: '', confirm: '' }) }
    setSavingPass(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account preferences</p>
      </div>

      {/* Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
          <User className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Profile Information</h2>
        </div>
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl">
              {profile?.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.full_name || 'No name set'}</p>
              <p className="text-sm text-gray-500">{profile?.email}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${profile?.role === 'admin' ? 'bg-purple-100 text-purple-700' : profile?.role === 'security' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {profile?.role}
              </span>
            </div>
          </div>
          <Input label="Full Name" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Your full name" required />
          <Input label="Phone (optional)" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+63 912 345 6789" />
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      {/* Password */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5 pb-3 border-b border-gray-100">
          <Lock className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-800">Change Password</h2>
        </div>
        <form onSubmit={changePassword} className="space-y-4">
          <Input label="New Password" type="password" value={passwords.newPass} onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))} placeholder="••••••••" minLength={6} required />
          <Input label="Confirm New Password" type="password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" required />
          <Button type="submit" loading={savingPass} variant="secondary">
            <Lock className="w-4 h-4" /> {savingPass ? 'Updating…' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
