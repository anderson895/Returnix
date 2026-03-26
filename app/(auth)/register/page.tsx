'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, phone: form.phone, role: 'user' },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success('Account created! Please check your email to confirm.')
    router.push('/login')
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create Account</h1>
          <p className="text-slate-400 text-sm">Start recovering lost items today</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Juan Dela Cruz' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com' },
            { label: 'Phone (optional)', key: 'phone', type: 'tel', placeholder: '+63 912 345 6789' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">{f.label}</label>
              <input type={f.type} value={form[f.key as keyof typeof form]} onChange={set(f.key)}
                placeholder={f.placeholder} required={f.key !== 'phone'}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition" />
            </div>
          ))}
          {(['password', 'confirm'] as const).map(k => (
            <div key={k}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                {k === 'password' ? 'Password' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form[k]} onChange={set(k)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition" />
                {k === 'password' && (
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-2">
            {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
