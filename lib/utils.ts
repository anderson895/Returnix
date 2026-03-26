import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const ITEM_CATEGORIES = [
  'Electronics',
  'Clothing & Accessories',
  'Bags & Wallets',
  'Documents & IDs',
  'Jewelry',
  'Keys',
  'Glasses & Eyewear',
  'Sports Equipment',
  'Books & Stationery',
  'Others',
] as const

export const STATUS_COLORS = {
  // Lost item status
  searching: 'bg-blue-100 text-blue-800',
  found: 'bg-green-100 text-green-800',
  claimed: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
  // Found item status
  unclaimed: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-orange-100 text-orange-800',
  // Claim status
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(dateStr)
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  claim_approved: '✅',
  claim_rejected: '❌',
  item_found: '🔍',
  claim_submitted: '📋',
  info: 'ℹ️',
  system: '🔔',
}
