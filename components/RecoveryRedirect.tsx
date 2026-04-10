'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RecoveryRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash.includes('type=recovery')) return

    // Next.js router.replace strips hash fragments, so save tokens
    // to sessionStorage before navigating to the reset-password page
    const params = new URLSearchParams(hash.replace('#', ''))
    const access_token  = params.get('access_token')
    const refresh_token = params.get('refresh_token')

    if (access_token && refresh_token) {
      sessionStorage.setItem('recovery_access_token',  access_token)
      sessionStorage.setItem('recovery_refresh_token', refresh_token)
    }

    router.replace('/reset-password')
  }, [router])

  return null
}