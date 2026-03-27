import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

// Badge
export function Badge({ children, variant = 'default' }: { children: ReactNode, variant?: string }) {
  const styles: Record<string, string> = {
    default:   'bg-gray-100 text-gray-700',
    searching: 'bg-blue-100 text-blue-700',
    found:     'bg-green-100 text-green-700',
    claimed:   'bg-purple-100 text-purple-700',
    closed:    'bg-gray-100 text-gray-500',
    unclaimed: 'bg-yellow-100 text-yellow-700',
    pending:   'bg-orange-100 text-orange-700',
    approved:  'bg-green-100 text-green-700',
    rejected:  'bg-red-100 text-red-700',
    user:      'bg-blue-100 text-blue-700',
    security:  'bg-emerald-100 text-emerald-700',
    admin:     'bg-purple-100 text-purple-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize', styles[variant] || styles.default)}>
      {children}
    </span>
  )
}

// Card — supports onClick for clickable cards
export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn('bg-white rounded-xl border border-gray-200 shadow-sm', className)}
    >
      {children}
    </div>
  )
}

// Spinner
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return <div className={cn('border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin', s[size])} />
}

// Input
export function Input({
  label,
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={cn(
          'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Textarea
export function Textarea({
  label,
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        className={cn(
          'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none',
          error && 'border-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Select
export function Select({
  label,
  error,
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={cn(
          'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

// Button
export function Button({
  children,
  variant = 'primary',
  loading,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  loading?: boolean
}) {
  const styles = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'hover:bg-gray-100 text-gray-600',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        styles[variant],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

// Empty state
export function EmptyState({
  title,
  desc,
  icon,
}: {
  title: string
  desc?: string
  icon?: ReactNode
}) {
  return (
    <div className="text-center py-16">
      {icon && <div className="flex justify-center mb-4 text-gray-300">{icon}</div>}
      <h3 className="text-gray-500 font-semibold mb-1">{title}</h3>
      {desc && <p className="text-gray-400 text-sm">{desc}</p>}
    </div>
  )
}