import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function fmtMoney(n: number, dp = 0): string {
  if (n >= 1000) return '€' + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k'
  return '€' + n.toLocaleString()
}

export function fmtMoneyFull(n: number): string {
  return '€' + n.toLocaleString('en-IE')
}

export function fmtPct(n: number): string {
  return (n > 0 ? '+' : '') + Math.round(n * 100) + '%'
}

export function fmtNum(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'k'
  return n.toLocaleString()
}

export function fmtDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function healthColor(score: number): string {
  if (score < 65) return 'var(--red)'
  if (score < 80) return 'var(--amber)'
  return 'var(--lime)'
}

export function healthLabel(score: number): string {
  if (score < 65) return 'At risk'
  if (score < 80) return 'Watch'
  return 'Healthy'
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return fmtDate(d)
}
