import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// Hash IP for privacy — we never store raw IPs
function hashIP(ip: string): string {
  // Daily salt so hashes rotate — prevents long-term tracking
  const daySalt = new Date().toISOString().slice(0, 10)
  return crypto.createHash('sha256').update(`${ip}:${daySalt}`).digest('hex').slice(0, 16)
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  )
}

// Geo-IP lookup using free ip-api.com (45 req/min, no key needed)
async function getCountryFromIP(ip: string): Promise<{ country: string; countryCode: string }> {
  // Skip for localhost/private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { country: 'Local', countryCode: 'XX' }
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    if (data.status === 'success') {
      return { country: data.country, countryCode: data.countryCode }
    }
  } catch {
    // Geo lookup failed — not critical
  }

  return { country: 'Unknown', countryCode: 'XX' }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : '/'
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null

    const ip = getClientIP(request)
    const ipHash = hashIP(ip)
    const userAgent = request.headers.get('user-agent')?.slice(0, 300) || null

    // Rate limit: max 1 view per IP-hash per path per 5 minutes
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    const recent = await prisma.pageView.findFirst({
      where: {
        ipHash,
        path,
        createdAt: { gte: fiveMinAgo },
      },
    })

    if (recent) {
      return NextResponse.json({ ok: true, deduplicated: true })
    }

    // Geo lookup (non-blocking — we still save even if it fails)
    const geo = await getCountryFromIP(ip)

    await prisma.pageView.create({
      data: {
        path,
        ipHash,
        country: geo.country,
        countryCode: geo.countryCode,
        referrer,
        userAgent,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never fail the user's page load over analytics
    return NextResponse.json({ ok: true })
  }
}
