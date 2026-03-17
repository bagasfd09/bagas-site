'use client'

import { useState, useEffect } from 'react'

interface HeroRealisticProps {
  name: string
  heroIntro: string
  heroRealisticImage: string
  heroRealisticPills: string
  heroRealisticStat: string
  heroRealisticStatLabel: string
  cvUrl: string
  linkedin: string
}

const greetings = [
  'Hello!',
  'Halo!',
  'Horas!',
  'Sampurasun!',
  'Sugeng!',
  'Om Swastiastu!',
  'Apa Kabar!',
  'Monggo!',
  'Hay!',
  'こんにちは',
  'Bonjour!',
  '안녕하세요',
  'Hola!',
  'Ciao!',
  'Olá!',
  'Merhaba!',
  'Namaste!',
  'Xin chào!',
]

const pillPositions = ['pill-tl', 'pill-tr', 'pill-bl', 'pill-br']

export default function HeroRealistic({ name, heroIntro, heroRealisticImage, heroRealisticPills, heroRealisticStat, heroRealisticStatLabel, cvUrl, linkedin }: HeroRealisticProps) {
  const pills = heroRealisticPills.split(',').map((p, i) => ({
    label: p.trim(),
    pos: pillPositions[i % pillPositions.length],
  })).filter(p => p.label)
  const [greetIndex, setGreetIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setGreetIndex((i) => (i + 1) % greetings.length)
        setFade(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hero-realistic">
      {/* Heading */}
      <div className="hero-realistic-header">
        <div className="hero-realistic-hello-wrapper">
          <span className={`hero-realistic-hello ${fade ? 'hello-visible' : 'hello-hidden'}`}>
            {greetings[greetIndex]}
          </span>
          <svg className="hero-realistic-hello-accent" width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M10 22C14 14 18 8 24 4" stroke="#b4762c" stroke-width="3" stroke-linecap="round"/>
            <path d="M16 24C18 18 22 12 26 10" stroke="#b4762c" stroke-width="3" stroke-linecap="round"/>
            <path d="M4 18C8 12 12 8 18 6" stroke="#b4762c" stroke-width="3" stroke-linecap="round"/>
          </svg>
        </div>
        <h1 className="hero-realistic-title">
          I&apos;m{' '}
          {/* Inline avatar — visible on mobile only */}
          {heroRealisticImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroRealisticImage.includes('cloudinary.com')
                ? heroRealisticImage.replace('/upload/', '/upload/f_auto,q_auto:best,w_600/')
                : heroRealisticImage}
              alt=""
              className="hero-realistic-inline-photo"
              aria-hidden="true"
            />
          )}
          <span className="hero-realistic-name">{name}</span>,👋
          <br />
          A Software Developer
        </h1>
      </div>

      {/* Center: photo + circle + pills */}
      <div className="hero-realistic-photo-area">
        {/* Photo */}
        <div className="hero-realistic-photo-ring">
          {heroRealisticImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroRealisticImage.includes('cloudinary.com')
                ? heroRealisticImage.replace('/upload/', '/upload/f_auto,q_auto:best,w_1000/')
                : heroRealisticImage}
              alt={`${name} photo`}
              className="hero-realistic-img"
              fetchPriority="high"
            />
          )}

          {!heroRealisticImage && (
            <div className="hero-realistic-img-placeholder">
              <span>Upload your photo in Admin &rarr; Settings</span>
            </div>
          )}
        </div>

        {/* Floating tech pills */}
        <div className="hero-realistic-pills-group">
          {pills.map((pill) => (
            <span key={pill.label} className={`hero-realistic-pill ${pill.pos}`}>
              {pill.label}
            </span>
          ))}
        </div>

        {/* Years stat */}
        <div className="hero-realistic-stat">
          <span className="hero-realistic-stat-number">{heroRealisticStat}</span>
          <span className="hero-realistic-stat-label">{heroRealisticStatLabel}</span>
        </div>

        {/* Testimonial */}
        <div className="hero-realistic-quote">
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
            <path d="M0 18V10.8C0 4.7 4.03.4 10.13 0l1.12 2.7C7.2 3.6 5.4 6.3 5.4 9H10.13V18H0zm13.5 0V10.8c0-6.1 4.03-10.4 10.12-10.8L24.75 2.7c-4.05.9-5.85 3.6-5.85 6.3h4.73V18H13.5z" fill="currentColor"/>
          </svg>
          <p>{heroIntro}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="hero-realistic-cta">
        {cvUrl?.trim() && (
          <a href={cvUrl} download className="hero-realistic-btn hero-realistic-btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Grab My Resume
          </a>
        )}
        {linkedin?.trim() && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hero-realistic-btn hero-realistic-btn-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
            </svg>
            Let&apos;s Connect
          </a>
        )}
      </div>
    </div>
  )
}
