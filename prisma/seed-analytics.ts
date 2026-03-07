import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

const COUNTRIES = [
  { country: 'Indonesia', code: 'ID', weight: 35 },
  { country: 'United States', code: 'US', weight: 20 },
  { country: 'India', code: 'IN', weight: 8 },
  { country: 'Germany', code: 'DE', weight: 6 },
  { country: 'United Kingdom', code: 'GB', weight: 5 },
  { country: 'Japan', code: 'JP', weight: 4 },
  { country: 'Singapore', code: 'SG', weight: 4 },
  { country: 'Netherlands', code: 'NL', weight: 3 },
  { country: 'Australia', code: 'AU', weight: 3 },
  { country: 'Canada', code: 'CA', weight: 3 },
  { country: 'Brazil', code: 'BR', weight: 2 },
  { country: 'France', code: 'FR', weight: 2 },
  { country: 'South Korea', code: 'KR', weight: 2 },
  { country: 'Malaysia', code: 'MY', weight: 2 },
  { country: 'Philippines', code: 'PH', weight: 1 },
]

const PATHS = [
  { path: '/', weight: 25 },
  { path: '/blog', weight: 15 },
  { path: '/notes', weight: 10 },
  { path: '/projects', weight: 10 },
  { path: '/skills', weight: 8 },
  { path: '/me', weight: 5 },
  { path: '/blog/building-qa-dashboard', weight: 8 },
  { path: '/blog/fastify-over-express', weight: 5 },
  { path: '/blog/auth-patterns', weight: 4 },
  { path: '/blog/prisma-orm-guide', weight: 4 },
  { path: '/notes/ts-utility-types', weight: 3 },
  { path: '/notes/docker-compose-local', weight: 3 },
]

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

function randomHash(): string {
  return crypto.randomBytes(16).toString('hex')
}

async function main() {
  console.log('Seeding analytics data...')

  // Delete existing dummy data
  const deleted = await prisma.pageView.deleteMany({})
  console.log(`Cleared ${deleted.count} existing page views`)

  const now = new Date()
  const records: Array<{
    path: string
    ipHash: string
    country: string
    countryCode: string
    referrer: string | null
    userAgent: string | null
    createdAt: Date
  }> = []

  // Generate ~50 unique "visitors" (IP hashes)
  const visitors = Array.from({ length: 50 }, () => ({
    hash: randomHash(),
    country: weightedRandom(COUNTRIES),
  }))

  // Generate data for the last 35 days
  for (let daysAgo = 0; daysAgo < 35; daysAgo++) {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    // More recent days get more traffic; weekends get less
    const recencyBoost = Math.max(1, 10 - daysAgo * 0.2)
    const baseViews = isWeekend ? 8 : 15
    const viewCount = Math.round(baseViews * recencyBoost * (0.7 + Math.random() * 0.6))

    for (let v = 0; v < viewCount; v++) {
      const visitor = visitors[Math.floor(Math.random() * visitors.length)]
      const page = weightedRandom(PATHS)

      // Random time during the day
      const hour = Math.floor(Math.random() * 24)
      const minute = Math.floor(Math.random() * 60)
      const second = Math.floor(Math.random() * 60)
      const timestamp = new Date(date)
      timestamp.setHours(hour, minute, second, 0)

      records.push({
        path: page.path,
        ipHash: visitor.hash,
        country: visitor.country.country,
        countryCode: visitor.country.code,
        referrer: Math.random() > 0.7 ? 'https://google.com' : null,
        userAgent: 'Mozilla/5.0 (seed-data)',
        createdAt: timestamp,
      })
    }
  }

  // Batch insert
  const result = await prisma.pageView.createMany({ data: records })
  console.log(`Created ${result.count} page view records`)

  // Show summary
  const byCountry = new Map<string, number>()
  for (const r of records) {
    byCountry.set(r.country, (byCountry.get(r.country) || 0) + 1)
  }
  console.log('\nTop countries:')
  Array.from(byCountry.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([c, n]) => console.log(`  ${c}: ${n} views`))

  console.log('\nDone! Analytics dashboard should now show data.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
