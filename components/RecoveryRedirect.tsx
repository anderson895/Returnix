'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RecoveryRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      // Preserve the full hash so reset-password page can pick up the access_token
      router.replace('/reset-password' + window.location.hash)
    }
  }, [router])

  return null
}