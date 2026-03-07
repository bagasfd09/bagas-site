'use client'

import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

interface AnimateInProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  animation?: 'fade-up' | 'fade-in' | 'fade-right' | 'scale-in'
  delay?: number
  duration?: number
  threshold?: number
  as?: 'div' | 'section'
}

export default function AnimateIn({
  children,
  className = '',
  style,
  animation = 'fade-up',
  delay = 0,
  duration = 500,
  threshold = 0.1,
  as = 'div',
}: AnimateInProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('anim-visible')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add('anim-visible')
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  const props = {
    ref,
    className: `anim anim--${animation} ${className}`,
    style: { ...style, '--anim-duration': `${duration}ms` } as CSSProperties,
  }

  if (as === 'section') {
    return <section {...props}>{children}</section>
  }

  return <div {...props}>{children}</div>
}
