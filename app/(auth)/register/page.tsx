'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus, Mail, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Registration failed'); return }
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-blue-500/20 border border-blue-400/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify Your Email</h1>
          <p className="text-slate-400 text-sm mb-1">We sent a verification link to:</p>
          <p className="text-blue-400 font-semibold mb-6 break-all">{form.email}</p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left space-y-3 mb-6">
            {['Open your email inbox','Click the "Confirm your mail" link','You will be redirected back to the app','Sign in with your credentials'].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">{i + 1}</div>
                <p className="text-slate-300 text-sm">{step}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <ResendButton email={form.email} />
            <Link href="/login" className="block w-full border border-white/20 text-slate-300 hover:text-white hover:border-white/40 font-medium py-2.5 rounded-lg transition text-sm text-center">
              Back to Sign In
            </Link>
          </div>
          <p className="text-slate-500 text-xs mt-5">Didn&apos;t receive it? Check your spam/junk folder.</p>
        </div>
      </div>
    )
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
            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Juan Dela Cruz', required: true },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'you@example.com', required: true },
            { label: 'Phone (optional)', key: 'phone', type: 'tel', placeholder: '+63 912 345 6789', required: false },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">{f.label}</label>
              <input type={f.type} value={form[f.key as keyof typeof form]} onChange={set(f.key)}
                placeholder={f.placeholder} required={f.required}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition" />
            </div>
          ))}
          {(['password', 'confirm'] as const).map(k => (
            <div key={k}>
              <label className="block text-slate-300 text-sm font-medium mb-1.5">{k === 'password' ? 'Password' : 'Confirm Password'}</label>
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
            {loading ? 'Creating account…' : 'Create Account'}
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

function ResendButton({ email }: { email: string }) {
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleResend() {
    if (cooldown > 0) return
    setSending(true)
    const res = await fetch('/api/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setSending(false)
    if (!res.ok) { toast.error(data.error || 'Failed to resend'); return }
    setSent(true)
    toast.success('Verification email resent!')
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 })
    }, 1000)
  }

  return (
    <button onClick={handleResend} disabled={sending || cooldown > 0}
      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2">
      {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : sent ? <CheckCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
      {sending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : sent ? '✓ Sent! Check your inbox' : 'Resend Verification Email'}
    </button>
  )
}