'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)

  // Show "resend verification" prompt if email not confirmed
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUnverifiedEmail(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)

      // Email not confirmed → show resend option
      if (
        error.message.toLowerCase().includes('email not confirmed') ||
        error.message.toLowerCase().includes('not confirmed')
      ) {
        setUnverifiedEmail(email)
        return
      }

      // Wrong credentials
      if (
        error.message.toLowerCase().includes('invalid login') ||
        error.message.toLowerCase().includes('invalid credentials')
      ) {
        toast.error('Incorrect email or password.')
        return
      }

      toast.error(error.message)
      return
    }

    // Get profile for role-based redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = profile?.role
    if (role === 'admin')         window.location.href = '/admin'
    else if (role === 'security') window.location.href = '/security'
    else                          window.location.href = '/dashboard'
  }

  // ── Email Not Verified Banner ────────────────────────
  if (unverifiedEmail) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-yellow-500/20 border border-yellow-400/30 rounded-full flex items-center justify-center mx-auto mb-5">
            <Mail className="w-8 h-8 text-yellow-400" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Email Not Verified</h2>
          <p className="text-slate-400 text-sm mb-2">
            You need to verify your email before signing in.
          </p>
          <p className="text-blue-400 font-semibold text-sm mb-6 break-all">{unverifiedEmail}</p>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-6 text-left">
            <p className="text-yellow-300 text-xs">
              💡 Check your inbox for the verification email. If you can&apos;t find it, check your spam folder or resend below.
            </p>
          </div>

          <div className="space-y-3">
            <ResendVerificationButton email={unverifiedEmail} password={password} />
            <button
              onClick={() => setUnverifiedEmail(null)}
              className="w-full border border-white/20 text-slate-300 hover:text-white hover:border-white/40 font-medium py-2.5 rounded-lg transition text-sm">
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Login Form ───────────────────────────────────────
  return (
    <div className="w-full max-w-md">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2.5 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <LogIn className="w-4 h-4" />}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

// ── Resend Verification Button ────────────────────────
function ResendVerificationButton({ email, password }: { email: string; password: string }) {
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleResend() {
    if (cooldown > 0) return
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type:  'signup',
      email,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })
    setSending(false)
    if (error) { toast.error(error.message); return }

    setSent(true)
    toast.success('Verification email sent!')
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) { clearInterval(timer); return 0 }
        return c - 1
      })
    }, 1000)
  }

  return (
    <button onClick={handleResend} disabled={sending || cooldown > 0}
      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2">
      {sending
        ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : <Mail className="w-4 h-4" />}
      {sending
        ? 'Sending…'
        : cooldown > 0
          ? `Resend in ${cooldown}s`
          : sent
            ? '✓ Sent! Check your inbox'
            : 'Resend Verification Email'}
    </button>
  )
}