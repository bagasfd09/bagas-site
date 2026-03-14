import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const paths = ['/', '/blog/docker-tips', '/projects', '/experience', '/blog/nextjs-guide', '/skills', '/notes/git-cheatsheet']
const referrers = ['https://google.com/search?q=bagas+dev', 'https://github.com/bagasfd09', 'https://linkedin.com/in/bagas', null, null, 'https://twitter.com/bagas', null]
const countries = [
  { country: 'Indonesia', code: 'ID' },
  { country: 'United States', code: 'US' },
  { country: 'Germany', code: 'DE' },
  { country: 'Japan', code: 'JP' },
  { country: 'Singapore', code: 'SG' },
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomHash(): string {
  return Math.random().toString(36).slice(2, 14)
}

async function main() {
  const now = Date.now()
  const records = []

  // Generate ~60 page views spread across last 30 minutes
  // More views in recent minutes (weighted towards "now")
  for (let i = 0; i < 60; i++) {
    // Bias towards recent: square root distribution
    const minutesAgo = Math.floor(Math.pow(Math.random(), 0.7) * 30)
    const secondsOffset = Math.floor(Math.random() * 60)
    const createdAt = new Date(now - (minutesAgo * 60 + secondsOffset) * 1000)
    const c = randomItem(countries)

    records.push({
      path: randomItem(paths),
      ipHash: randomHash(),
      country: c.country,
      countryCode: c.code,
      referrer: randomItem(referrers),
      userAgent: 'Mozilla/5.0 (seed-data)',
      createdAt,
    })
  }

  // Add a few "active now" visitors (last 5 min) with same IP to show repeat visits
  const activeIps = [randomHash(), randomHash(), randomHash()]
  for (const ip of activeIps) {
    for (let j = 0; j < 3; j++) {
      const minutesAgo = Math.floor(Math.random() * 4)
      const createdAt = new Date(now - minutesAgo * 60 * 1000)
      const c = randomItem(countries)
      records.push({
        path: randomItem(paths),
        ipHash: ip,
        country: c.country,
        countryCode: c.code,
        referrer: randomItem(referrers),
        userAgent: 'Mozilla/5.0 (seed-data)',
        createdAt,
      })
    }
  }

  const result = await prisma.pageView.createMany({ data: records })
  console.log(`Seeded ${result.count} real-time PageView records`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
