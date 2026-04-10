'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export function RecoveryRedirect() {
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Only intercept the recovery hash when we're on the root page.
    // Other pages (forgot-password, login, etc.) must never be redirected.
    if (pathname !== '/') return

    const hash = window.location.hash
    if (!hash.includes('type=recovery')) return

    const params        = new URLSearchParams(hash.replace('#', ''))
    const access_token  = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      sessionStorage.setItem('recovery_access_token',  access_token)
      sessionStorage.setItem('recovery_refresh_token', refresh_token)
      router.replace('/reset-password')
    }
  }, [pathname, router])

  return null
}