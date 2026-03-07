'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTracker() {
  const pathname = usePathname()

  useEffect(() => {
    // Small delay to not block page render
    const timer = setTimeout(() => {
      fetch('/api/public/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || null,
        }),
      }).catch(() => {
        // Silently fail — analytics should never break the site
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
