'use client'

import { useEffect, useState } from 'react'

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check for CSS scroll-timeline support
    const supportsScrollTimeline = CSS.supports('animation-timeline', 'scroll()')
    if (supportsScrollTimeline) {
      setVisible(true)
      return
    }

    // JS fallback
    const onScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setProgress(Math.min((scrollTop / docHeight) * 100, 100))
        setVisible(scrollTop > 100)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Check for prefers-reduced-motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }

  return (
    <div
      className="reading-progress-bar"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Reading progress"
      style={{
        opacity: visible ? 1 : 0,
        // JS fallback width - CSS animation-timeline overrides when supported
        '--progress-width': `${progress}%`,
      } as React.CSSProperties}
    />
  )
}
