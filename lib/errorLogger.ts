// ── Centralized Error Logging & Handling ──────────────────────
// Place: lib/errorLogger.ts
// Covers: API routes, server actions, and client-side components

import { createServiceClient } from '@/lib/supabase/server'

export type ErrorSeverity = 'error' | 'warning' | 'info'

export interface ErrorLog {
  id?: string
  message: string
  stack?: string
  route?: string
  action?: string
  userId?: string
  userEmail?: string
  userRole?: string
  severity: ErrorSeverity
  metadata?: Record<string, any>
  timestamp?: string
}

// ── Core logging function (Server-side) ──────────────────────
// Logs to Supabase `error_logs` table and console.
export async function logError(params: {
  message: string
  error?: any
  route?: string
  action?: string
  userId?: string
  userEmail?: string
  userRole?: string
  severity?: ErrorSeverity
  metadata?: Record<string, any>
}): Promise<void> {
  const entry: ErrorLog = {
    message: params.message,
    stack: params.error?.stack || String(params.error ?? ''),
    route: params.route,
    action: params.action,
    userId: params.userId,
    userEmail: params.userEmail,
    userRole: params.userRole,
    severity: params.severity ?? 'error',
    metadata: params.metadata,
    timestamp: new Date().toISOString(),
  }

  // Console output
  const tag = `[${entry.severity.toUpperCase()}]`
  const ctx = entry.route ? ` [${entry.route}]` : ''
  if (entry.severity === 'error') {
    console.error(`${tag}${ctx} ${entry.message}`, params.error ?? '')
  } else if (entry.severity === 'warning') {
    console.warn(`${tag}${ctx} ${entry.message}`, params.error ?? '')
  } else {
    console.info(`${tag}${ctx} ${entry.message}`)
  }

  // Persist to Supabase (best-effort — never throws)
  try {
    const supabase = await createServiceClient()
    await supabase.from('error_logs').insert({
      message: entry.message,
      stack: entry.stack || null,
      route: entry.route || null,
      action: entry.action || null,
      user_id: entry.userId || null,
      user_email: entry.userEmail || null,
      user_role: entry.userRole || null,
      severity: entry.severity,
      metadata: entry.metadata || null,
      created_at: entry.timestamp,
    })
  } catch (dbErr) {
    console.error('[ErrorLogger] Failed to persist to Supabase:', dbErr)
  }
}

// ── Convenience wrappers ──────────────────────────────────────
export const logWarning = (
  message: string,
  opts?: Partial<Omit<Parameters<typeof logError>[0], 'message' | 'severity'>>
) => logError({ ...opts, message, severity: 'warning' })

export const logInfo = (
  message: string,
  opts?: Partial<Omit<Parameters<typeof logError>[0], 'message' | 'severity'>>
) => logError({ ...opts, message, severity: 'info' })

// ── Safe async wrapper for API routes ────────────────────────
// Wraps your route handler; catches unhandled errors automatically.
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: { route: string; action: string; userId?: string; userRole?: string }
): Promise<T> {
  try {
    return await fn()
  } catch (err: any) {
    await logError({
      message: err?.message || 'Unexpected error',
      error: err,
      ...context,
    })
    throw err
  }
}
