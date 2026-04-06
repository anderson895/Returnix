'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus, Mail, CheckCircle } from 'lucide-react'

// Same palette as login + sidebar + landing
const fieldBase = {
  background: '#ffffff',
  border: '1px solid rgba(242,229,197,0.4)',
  color: '#3A000C',
}
const FOCUS_BORDER  = '#F2E5C5'
const NORMAL_BORDER = 'rgba(242,229,197,0.4)'
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = FOCUS_BORDER }
const onBlur  = (e: React.FocusEvent<HTMLInputElement>) => { e.currentTarget.style.borderColor = NORMAL_BORDER }

export default function RegisterPage() {
  const [form, setForm]       = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' })
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

  // ── Verify email state ──
  if (submitted) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(242,229,197,0.15)', border: '1px solid rgba(242,229,197,0.35)' }}>
            <Mail className="w-8 h-8" style={{ color: '#F2E5C5' }} />
          </div>
          <h1 className="text-xl font-bold mb-1 text-center" style={{ color: '#F2E5C5' }}>Verify Your Email</h1>
          <p className="text-sm mb-1 text-center" style={{ color: 'rgba(242,229,197,0.6)' }}>We sent a link to:</p>
          <p className="font-semibold mb-5 text-center break-all" style={{ color: '#F2E5C5' }}>{form.email}</p>
          <div className="rounded-xl p-4 space-y-2.5 mb-5"
            style={{ background: 'rgba(242,229,197,0.08)', border: '1px solid rgba(242,229,197,0.15)' }}>
            {['Open your email inbox', 'Click the "Confirm your mail" link', 'You will be redirected to the app', 'Sign in with your credentials'].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: '#F2E5C5', color: '#75162E' }}>{i + 1}</div>
                <p className="text-sm" style={{ color: 'rgba(242,229,197,0.65)' }}>{step}</p>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <ResendButton email={form.email} />
            <Link href="/login" className="block w-full font-medium py-2.5 rounded-lg text-sm text-center transition"
              style={{ border: '1px solid rgba(242,229,197,0.22)', color: 'rgba(242,229,197,0.65)' }}>
              Back to Sign In
            </Link>
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: 'rgba(242,229,197,0.35)' }}>
            Check spam/junk if you did not receive it.
          </p>
        </Card>
      </div>
    )
  }

  // ── Register form ──
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader title="Create Account" sub="Start recovering lost items today" />
        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { label: 'Full Name',        key: 'full_name', type: 'text',  placeholder: 'Juan Dela Cruz',  required: true },
            { label: 'Email',            key: 'email',     type: 'email', placeholder: 'you@example.com', required: true },
            { label: 'Phone (optional)', key: 'phone',     type: 'tel',   placeholder: '+63 912 345 6789',required: false },
          ].map(f => (
            <Field key={f.key} label={f.label}>
              <input type={f.type} value={form[f.key as keyof typeof form]} onChange={set(f.key)}
                placeholder={f.placeholder} required={f.required}
                className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition" style={fieldBase}
                onFocus={onFocus} onBlur={onBlur} />
            </Field>
          ))}

          {(['password', 'confirm'] as const).map(k => (
            <Field key={k} label={k === 'password' ? 'Password' : 'Confirm Password'}>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={form[k]} onChange={set(k)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition" style={fieldBase}
                  onFocus={onFocus} onBlur={onBlur} />
                {k === 'password' && (
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'rgba(242,229,197,0.45)' }}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </Field>
          ))}

          <button type="submit" disabled={loading}
            className="w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition mt-1"
            style={{ background: '#F2E5C5', color: '#3A000C', opacity: loading ? 0.7 : 1 }}>
            {loading ? <Spinner dark /> : <UserPlus className="w-4 h-4" />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: 'rgba(242,229,197,0.55)' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold" style={{ color: '#F2E5C5' }}>Sign in</Link>
        </p>
      </Card>
      <p className="text-center text-xs mt-4"
        style={{ color: 'rgba(242,229,197,0.4)', letterSpacing: '0.1em', fontFamily: "'Georgia', serif" }}>
        MARINDUQUE STATE UNIVERSITY
      </p>
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
      className="w-full font-semibold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition"
      style={{ background: '#F2E5C5', color: '#3A000C', opacity: sending || cooldown > 0 ? 0.65 : 1 }}>
      {sending ? <Spinner dark /> : sent ? <CheckCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
      {sending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : sent ? 'Sent! Check your inbox' : 'Resend Verification Email'}
    </button>
  )
}

// ── Shared UI ─────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: '#75162E', border: '1px solid rgba(242,229,197,0.18)', boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }}>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
      <div className="p-7">{children}</div>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
    </div>
  )
}

function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center mb-6">
      {/* System logo */}
      <div className="flex justify-center mb-4">
        <Image
          src="/system_logo.png"
          alt="Back2U"
          width={72}
          height={72}
          className="object-contain drop-shadow"
        />
      </div>
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

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span className="w-4 h-4 border-2 rounded-full animate-spin"
      style={{
        borderColor: dark ? 'rgba(58,0,12,0.15)' : 'rgba(242,229,197,0.25)',
        borderTopColor: dark ? '#3A000C' : '#F2E5C5',
      }} />
  )
}