'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, Mail } from 'lucide-react'

// ── Palette (matches landing page + sidebar exactly) ─────────────────────
// burgundy   #75162E  →  card background
// darkBurg   #550B18  →  card header strip
// deepMaroon #3A000C  →  primary btn text
// cream      #F2E5C5  →  all text, btn bg, accents
// ─────────────────────────────────────────────────────────────────────────

const fieldBase = {
  background: 'rgba(242,229,197,0.1)',
  border: '1px solid rgba(242,229,197,0.22)',
  color: '#F2E5C5',
}
const FOCUS_BORDER  = 'rgba(242,229,197,0.6)'
const NORMAL_BORDER = 'rgba(242,229,197,0.22)'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setUnverifiedEmail(null)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false)
      if (error.message.toLowerCase().includes('email not confirmed') || error.message.toLowerCase().includes('not confirmed')) {
        setUnverifiedEmail(email); return
      }
      if (error.message.toLowerCase().includes('invalid login') || error.message.toLowerCase().includes('invalid credentials')) {
        toast.error('Incorrect email or password.'); return
      }
      toast.error(error.message); return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const role = profile?.role
    if (role === 'admin')         window.location.href = '/admin'
    else if (role === 'security') window.location.href = '/security'
    else                          window.location.href = '/dashboard'
  }

  // ── Unverified state ──
  if (unverifiedEmail) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(242,229,197,0.15)', border: '1px solid rgba(242,229,197,0.35)' }}>
            <Mail className="w-8 h-8" style={{ color: '#F2E5C5' }} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: '#F2E5C5' }}>Email Not Verified</h2>
          <p className="text-sm mb-2 text-center" style={{ color: 'rgba(242,229,197,0.6)' }}>
            Verify your email before signing in.
          </p>
          <p className="font-semibold text-sm mb-5 text-center break-all" style={{ color: '#F2E5C5' }}>
            {unverifiedEmail}
          </p>
          <div className="rounded-xl p-3 mb-5"
            style={{ background: 'rgba(242,229,197,0.08)', border: '1px solid rgba(242,229,197,0.15)' }}>
            <p className="text-xs" style={{ color: 'rgba(242,229,197,0.6)' }}>
              Check your inbox for the verification link. Can&apos;t find it? Check spam or resend below.
            </p>
          </div>
          <div className="space-y-3">
            <ResendVerificationButton email={unverifiedEmail} password={password} />
            <button onClick={() => setUnverifiedEmail(null)}
              className="w-full font-medium py-2.5 rounded-lg text-sm transition"
              style={{ border: '1px solid rgba(242,229,197,0.22)', color: 'rgba(242,229,197,0.65)' }}>
              ← Back to Sign In
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Login form ──
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader title="Welcome back" sub="Sign in to your account" />
        <form onSubmit={handleLogin} className="space-y-4">
          <Field label="Email">
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition" style={fieldBase}
              onFocus={e => { e.currentTarget.style.borderColor = FOCUS_BORDER }}
              onBlur={e =>  { e.currentTarget.style.borderColor = NORMAL_BORDER }} />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} required value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition" style={fieldBase}
                onFocus={e => { e.currentTarget.style.borderColor = FOCUS_BORDER }}
                onBlur={e =>  { e.currentTarget.style.borderColor = NORMAL_BORDER }} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(242,229,197,0.45)' }}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
          <PrimaryBtn loading={loading} icon={<LogIn className="w-4 h-4" />}
            label="Sign In" loadingLabel="Signing in..." />
        </form>
        <p className="text-center text-sm mt-5" style={{ color: 'rgba(242,229,197,0.55)' }}>
          No account?{' '}
          <Link href="/register" className="font-semibold" style={{ color: '#F2E5C5' }}>Create one</Link>
        </p>
      </Card>
      <p className="text-center text-xs mt-4"
        style={{ color: 'rgba(242,229,197,0.4)', letterSpacing: '0.1em', fontFamily: "'Georgia', serif" }}>
        MARINDUQUE STATE UNIVERSITY
      </p>
    </div>
  )
}

function ResendVerificationButton({ email, password }: { email: string; password: string }) {
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleResend() {
    if (cooldown > 0) return
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({
      type: 'signup', email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    setSending(false)
    if (error) { toast.error(error.message); return }
    setSent(true)
    toast.success('Verification email sent!')
    setCooldown(60)
    const timer = setInterval(() => {
      setCooldown(c => { if (c <= 1) { clearInterval(timer); return 0 } return c - 1 })
    }, 1000)
  }

  return (
    <button onClick={handleResend} disabled={sending || cooldown > 0}
      className="w-full font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
      style={{ background: '#F2E5C5', color: '#3A000C', opacity: sending || cooldown > 0 ? 0.65 : 1 }}>
      {sending ? <Spinner dark /> : <Mail className="w-4 h-4" />}
      {sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : sent ? 'Sent! Check your inbox' : 'Resend Verification Email'}
    </button>
  )
}

// ── Shared UI pieces ──────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#75162E', border: '1px solid rgba(242,229,197,0.18)', boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }}>
      {/* Top cream accent line */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
      <div className="p-7">{children}</div>
      {/* Bottom cream accent line */}
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
    </div>
  )
}

function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center mb-6">
      <div className="flex items-center gap-3 justify-center mb-3">
        <div className="h-px w-14" style={{ background: 'rgba(242,229,197,0.2)' }} />
        <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(242,229,197,0.5)' }} />
        <div className="h-px w-14" style={{ background: 'rgba(242,229,197,0.2)' }} />
      </div>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#F2E5C5' }}>{title}</h1>
      <p className="text-sm" style={{ color: 'rgba(242,229,197,0.55)' }}>{sub}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5"
        style={{ color: 'rgba(242,229,197,0.85)' }}>{label}</label>
      {children}
    </div>
  )
}

function PrimaryBtn({ loading, icon, label, loadingLabel }: {
  loading: boolean; icon: React.ReactNode; label: string; loadingLabel: string
}) {
  return (
    <button type="submit" disabled={loading}
      className="w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
      style={{ background: '#F2E5C5', color: '#3A000C', opacity: loading ? 0.7 : 1 }}>
      {loading ? <Spinner dark /> : icon}
      {loading ? loadingLabel : label}
    </button>
  )
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span className="w-4 h-4 border-2 rounded-full animate-spin"
      style={{
        borderColor: dark ? 'rgba(58,0,12,0.15)' : 'rgba(242,229,197,0.25)',
        borderTopColor: dark ? '#3A000C' : '#F2E5C5',
      }} />
  )
}