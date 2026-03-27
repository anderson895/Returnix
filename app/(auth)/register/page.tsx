'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '', confirm: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create account via API route (no email confirmation needed)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email:     form.email,
          phone:     form.phone,
          password:  form.password,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        setLoading(false)
        return
      }

      // Step 2: Auto sign in after registration
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    form.email,
        password: form.password,
      })

      if (signInError) {
        // Account created but auto-login failed — redirect to login
        toast.success('Account created! Please sign in.')
        router.push('/login')
        return
      }

      toast.success(`Welcome, ${form.full_name}! 🎉`)
      router.push('/dashboard')
      router.refresh()

    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
            { label: 'Full Name',          key: 'full_name', type: 'text',  placeholder: 'Juan Dela Cruz',    required: true  },
            { label: 'Email',              key: 'email',     type: 'email', placeholder: 'you@example.com',   required: true  },
            { label: 'Phone (optional)',   key: 'phone',     type: 'tel',   placeholder: '+63 912 345 6789',  required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key as keyof typeof form]}
                onChange={set(f.key)}
                placeholder={f.placeholder}
                required={f.required}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
              />
            </div>
          ))}

          {(['password', 'confirm'] as const).map(k => (
            <div key={k}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">
                {k === 'password' ? 'Password' : 'Confirm Password'}
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form[k]}
                  onChange={set(k)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
                />
                {k === 'password' && (
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-2"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <UserPlus className="w-4 h-4" />
            }
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}