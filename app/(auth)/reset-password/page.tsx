'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react'

const fieldBase = {
  background: 'rgba(242,229,197,0.1)',
  border: '1px solid rgba(242,229,197,0.22)',
  color: '#F2E5C5',
}
const FOCUS_BORDER  = 'rgba(242,229,197,0.6)'
const NORMAL_BORDER = 'rgba(242,229,197,0.22)'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConf, setShowConf]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [done, setDone]               = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase puts the user in a recovery session after the callback
  // exchange — we just need to wait for onAuthStateChange to fire
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    // Also check if already in recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setDone(true)
    // Sign out so user logs in fresh with new password
    await supabase.auth.signOut()
    setTimeout(() => router.push('/login'), 3000)
  }

  // ── Success state ──
  if (done) {
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
            Password Updated!
          </h2>
          <p className="text-sm text-center mb-5" style={{ color: 'rgba(242,229,197,0.6)' }}>
            Your password has been changed successfully. Redirecting you to the sign-in page…
          </p>
          <Link
            href="/login"
            className="w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            style={{ background: '#F2E5C5', color: '#3A000C' }}
          >
            Go to Sign In
          </Link>
        </Card>
      </div>
    )
  }

  // ── Reset form ──
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader
          title="Set New Password"
          sub="Choose a strong password for your account"
        />
        <form onSubmit={handleReset} className="space-y-4">
          <Field label="New Password">
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition"
                style={fieldBase}
                onFocus={e => { e.currentTarget.style.borderColor = FOCUS_BORDER }}
                onBlur={e  => { e.currentTarget.style.borderColor = NORMAL_BORDER }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(242,229,197,0.45)' }}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          <Field label="Confirm Password">
            <div className="relative">
              <input
                type={showConf ? 'text' : 'password'}
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-lg px-4 py-2.5 pr-10 text-sm outline-none transition"
                style={fieldBase}
                onFocus={e => { e.currentTarget.style.borderColor = FOCUS_BORDER }}
                onBlur={e  => { e.currentTarget.style.borderColor = NORMAL_BORDER }}
              />
              <button
                type="button"
                onClick={() => setShowConf(!showConf)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(242,229,197,0.45)' }}
              >
                {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>

          {/* Strength hint */}
          {password.length > 0 && (
            <PasswordStrength password={password} />
          )}

          <button
            type="submit"
            disabled={loading || !sessionReady}
            className="w-full font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            style={{ background: '#F2E5C5', color: '#3A000C', opacity: (loading || !sessionReady) ? 0.7 : 1 }}
          >
            {loading ? <Spinner dark /> : <KeyRound className="w-4 h-4" />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Card>
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a number',     ok: /\d/.test(password) },
    { label: 'Contains uppercase',    ok: /[A-Z]/.test(password) },
  ]
  return (
    <div className="space-y-1">
      {checks.map(c => (
        <p key={c.label} className="text-xs flex items-center gap-1.5"
          style={{ color: c.ok ? '#86efac' : 'rgba(242,229,197,0.4)' }}>
          <span>{c.ok ? '✓' : '○'}</span> {c.label}
        </p>
      ))}
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
