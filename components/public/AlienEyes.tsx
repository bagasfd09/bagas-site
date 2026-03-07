'use client'

import { useEffect, useRef, useState } from 'react'

export default function AlienEyes() {
  const svgRef = useRef<SVGSVGElement>(null)
  const leftEyeRef = useRef<SVGCircleElement>(null)
  const rightEyeRef = useRef<SVGCircleElement>(null)
  const [excited, setExcited] = useState(false)

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const svg = svgRef.current
      const leftPupil = leftEyeRef.current
      const rightPupil = rightEyeRef.current
      if (!svg || !leftPupil || !rightPupil) return

      const rect = svg.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const angle = Math.atan2(dy, dx)
      const dist = Math.min(Math.sqrt(dx * dx + dy * dy) / 30, 1.8)

      const moveX = Math.cos(angle) * dist
      const moveY = Math.sin(angle) * dist

      leftPupil.setAttribute('cx', String(25 + moveX))
      leftPupil.setAttribute('cy', String(34 + moveY))
      rightPupil.setAttribute('cx', String(41 + moveX))
      rightPupil.setAttribute('cy', String(34 + moveY))

      // Check if hovering a hero button
      const target = e.target as HTMLElement
      const isOnBtn = !!target.closest('.hero-btn')
      setExcited(isOnBtn)

      // Toggle turbo class on the mascot circle for rocket
      const circle = svg.closest('.hero-mascot-circle')
      if (circle) {
        circle.classList.toggle('hero-turbo', isOnBtn)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <svg ref={svgRef} width="40" height="40" viewBox="0 0 64 64" fill="none">
      {/* Body */}
      <ellipse cx="32" cy="38" rx="16" ry="18" fill="#4ade80" />
      <ellipse cx="32" cy="38" rx="13" ry="15" fill="#86efac" />
      {/* Eye whites — grow when excited */}
      <ellipse cx="24" cy="34" rx={excited ? 6 : 5} ry={excited ? 7 : 6} fill="#fff" style={{ transition: 'all 0.2s ease' }} />
      <ellipse cx="40" cy="34" rx={excited ? 6 : 5} ry={excited ? 7 : 6} fill="#fff" style={{ transition: 'all 0.2s ease' }} />
      {/* Pupils */}
      <circle ref={leftEyeRef} cx="25" cy="34" r={excited ? 3 : 2.5} fill="#1a1a1a" style={{ transition: 'r 0.2s ease' }} />
      <circle ref={rightEyeRef} cx="41" cy="34" r={excited ? 3 : 2.5} fill="#1a1a1a" style={{ transition: 'r 0.2s ease' }} />
      {/* Mouth — small oval normally, big smile when excited */}
      {excited ? (
        <path
          d="M24 43 Q28 52 32 52 Q36 52 40 43"
          stroke="#16a34a"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          style={{ transition: 'all 0.2s ease' }}
        />
      ) : (
        <ellipse cx="32" cy="44" rx="4" ry="2" fill="#16a34a" opacity="0.6" />
      )}
      {/* Cheek blush when excited */}
      {excited && (
        <>
          <ellipse cx="18" cy="40" rx="3" ry="2" fill="#f9a8d4" opacity="0.5" />
          <ellipse cx="46" cy="40" rx="3" ry="2" fill="#f9a8d4" opacity="0.5" />
        </>
      )}
      {/* Antennae — bounce when excited */}
      <line x1="22" y1="20" x2="20" y2={excited ? 8 : 12} stroke="#4ade80" strokeWidth="3" strokeLinecap="round" style={{ transition: 'all 0.2s ease' }} />
      <circle cx="20" cy={excited ? 6 : 10} r={excited ? 4 : 3} fill="#4ade80" style={{ transition: 'all 0.2s ease' }} />
      <line x1="42" y1="20" x2="44" y2={excited ? 8 : 12} stroke="#4ade80" strokeWidth="3" strokeLinecap="round" style={{ transition: 'all 0.2s ease' }} />
      <circle cx="44" cy={excited ? 6 : 10} r={excited ? 4 : 3} fill="#4ade80" style={{ transition: 'all 0.2s ease' }} />
    </svg>
  )
}
