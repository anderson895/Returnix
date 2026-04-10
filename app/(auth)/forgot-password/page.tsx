'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

const fieldBase = {
  background: '#ffffff',
  border: '1px solid rgba(242,229,197,0.4)',
  color: '#3A000C',
}
const FOCUS_BORDER  = '#F2E5C5'
const NORMAL_BORDER = 'rgba(242,229,197,0.22)'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Email sent success state ──
  if (sent) {
    return (
      <div className="w-full max-w-md">
        <Card>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'rgba(242,229,197,0.15)', border: '1px solid rgba(242,229,197,0.35)' }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: '#F2E5C5' }} />
          </div>
          <h2 className="text-xl font-bold mb-2 text-center" style={{ color: '#F2E5C5' }}>
            Check Your Email
          </h2>
          <p className="text-sm text-center mb-2" style={{ color: 'rgba(242,229,197,0.6)' }}>
            We&apos;ve sent a password reset link to:
          </p>
          <p className="text-sm text-center font-semibold mb-5" style={{ color: '#F2E5C5' }}>
            {email}
          </p>
          <p className="text-xs text-center mb-6" style={{ color: 'rgba(242,229,197,0.45)' }}>
            Didn&apos;t receive the email? Check your spam folder or try again with a different email.
          </p>
          <button
            onClick={() => { setSent(false); setEmail('') }}
            className="w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition mb-3"
            style={{ background: '#F2E5C5', color: '#3A000C' }}
          >
            <Mail className="w-4 h-4" />
            Try Another Email
          </button>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm transition inline-flex items-center gap-1"
              style={{ color: 'rgba(242,229,197,0.5)' }}
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  // ── Email input form ──
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader
          title="Forgot Password"
          sub="Enter your email and we'll send you a reset link"
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email Address">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition"
              style={fieldBase}
              onFocus={e => { e.currentTarget.style.borderColor = FOCUS_BORDER }}
              onBlur={e  => { e.currentTarget.style.borderColor = NORMAL_BORDER }}
            />
          </Field>

          <button
            type="submit"
            disabled={loading}
            className="w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            style={{ background: '#F2E5C5', color: '#3A000C', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Spinner dark /> : <Mail className="w-4 h-4" />}
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <Link
            href="/login"
            className="text-sm transition inline-flex items-center gap-1"
            style={{ color: 'rgba(242,229,197,0.5)' }}
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Sign In
          </Link>
        </div>
      </Card>
    </div>
  )
}

// ── Shared UI pieces ──────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: '#75162E', border: '1px solid rgba(242,229,197,0.18)', boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }}
    >
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
      <div className="p-7">{children}</div>
      <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #F2E5C5, transparent)' }} />
    </div>
  )
}

function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="text-center mb-6">
      <div className="flex justify-center mb-4">
        <Image src="/system_logo.png" alt="Back2U" width={72} height={72} className="object-contain drop-shadow" />
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
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'rgba(242,229,197,0.85)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span
      className="w-4 h-4 border-2 rounded-full animate-spin"
      style={{
        borderColor: dark ? 'rgba(58,0,12,0.15)' : 'rgba(242,229,197,0.25)',
        borderTopColor: dark ? '#3A000C' : '#F2E5C5',
      }}
    />
  )
}