export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getYear(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.getFullYear()
}

export function groupByYear<T extends { createdAt: Date | string }>(
  items: T[]
): Record<number, T[]> {
  return items.reduce((acc, item) => {
    const year = getYear(item.createdAt)
    if (!acc[year]) acc[year] = []
    acc[year].push(item)
    return acc
  }, {} as Record<number, T[]>)
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

const TZ = 'Asia/Jakarta'

/** Format a Date as YYYY-MM-DD in WIB (Asia/Jakarta) */
export function toDateKeyWIB(date: Date): string {
  return date.toLocaleDateString('sv-SE', { timeZone: TZ })
}

/** Get "start of today" in WIB as a UTC Date */
export function startOfDayWIB(date: Date): Date {
  const wibStr = date.toLocaleString('sv-SE', { timeZone: TZ })
  const dayStr = wibStr.slice(0, 10)
  // Parse as WIB midnight → convert to UTC
  const utc = new Date(dayStr + 'T00:00:00+07:00')
  return utc
}
