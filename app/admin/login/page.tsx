'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function FloatingStars() {
  return (
    <div className="login-stars" aria-hidden="true">
      {[...Array(12)].map((_, i) => (
        <span
          key={i}
          className="login-star"
          style={{
            left: `${8 + Math.random() * 84}%`,
            top: `${5 + Math.random() * 90}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
          }}
        />
      ))}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      router.push('/admin')
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <FloatingStars />

      <div className="login-card">
        {/* Mascot */}
        <div className="login-mascot">
          <div className="login-mascot-circle">
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none">
              {/* Beam light */}
              <path d="M24 42L16 58H48L40 42" fill="#fde68a" opacity="0.25" />
              {/* UFO body — dome */}
              <ellipse cx="32" cy="30" rx="10" ry="8" fill="#86efac" />
              <ellipse cx="32" cy="30" rx="7" ry="5.5" fill="#bbf7d0" opacity="0.6" />
              {/* Alien inside dome */}
              <circle cx="29" cy="29" r="1.5" fill="#1a1a1a" />
              <circle cx="35" cy="29" r="1.5" fill="#1a1a1a" />
              {/* UFO saucer */}
              <ellipse cx="32" cy="36" rx="20" ry="6" fill="#4ade80" />
              <ellipse cx="32" cy="36" rx="20" ry="6" fill="url(#ufoGrad)" />
              <ellipse cx="32" cy="35" rx="16" ry="4" fill="#86efac" opacity="0.4" />
              {/* Lights on saucer */}
              <circle cx="18" cy="36" r="2" fill="#fbbf24" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" repeatCount="indefinite" />
              </circle>
              <circle cx="26" cy="38" r="1.5" fill="#f97316" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s" begin="0.3s" repeatCount="indefinite" />
              </circle>
              <circle cx="38" cy="38" r="1.5" fill="#f97316" opacity="0.7">
                <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1s" begin="0.6s" repeatCount="indefinite" />
              </circle>
              <circle cx="46" cy="36" r="2" fill="#fbbf24" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
              </circle>
              {/* Antenna */}
              <line x1="32" y1="22" x2="32" y2="16" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
              <circle cx="32" cy="14" r="2.5" fill="#fbbf24">
                <animate attributeName="r" values="2.5;3.5;2.5" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <defs>
                <linearGradient id="ufoGrad" x1="12" y1="30" x2="12" y2="42">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="login-header">
          <h1 className="login-title">
            bagas.dev
          </h1>
          <p className="login-subtitle">
            {focused === 'username' ? 'Who goes there?' :
             focused === 'password' ? 'Whisper the secret...' :
             'Welcome back, commander'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label className="login-label">Username</label>
            <div className={`login-input-wrap${focused === 'username' ? ' login-input-focused' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.4">
                <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 14s-1 0-1-1 1-4 7-4 7 3 7 4-1 1-1 1H2z" />
              </svg>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused(null)}
                placeholder="admin"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <div className={`login-input-wrap${focused === 'password' ? ' login-input-focused' : ''}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" opacity="0.4">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              </svg>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0-1A6 6 0 1 0 8 2a6 6 0 0 0 0 12zM7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.553.553 0 0 1-1.1 0L7.1 4.995z" />
              </svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="login-btn"
          >
            {loading ? (
              <span className="login-btn-loading">
                <svg width="16" height="16" viewBox="0 0 64 74" fill="none" className="login-btn-rocket-fly">
                  <path d="M32 4c0 0-16 12-16 36h8l8 16 8-16h8C48 16 32 4 32 4z" fill="#fff" opacity="0.3"/>
                  <path d="M32 4c0 0-10 10-14 28h10l4 12 4-12h10C42 14 32 4 32 4z" fill="#fff" opacity="0.5"/>
                  <path d="M28 56l4-12 4 12" fill="#fbbf24"/>
                  <path d="M30 56l2-8 2 8" fill="#fff" opacity="0.7"/>
                </svg>
                3... 2... 1... Liftoff!
              </span>
            ) : (
              <span className="login-btn-content">
                <svg width="16" height="16" viewBox="0 0 64 74" fill="none" className="login-btn-rocket">
                  <path d="M32 4c0 0-16 12-16 36h8l8 16 8-16h8C48 16 32 4 32 4z" fill="#fff" opacity="0.4"/>
                  <path d="M32 4c0 0-10 10-14 28h10l4 12 4-12h10C42 14 32 4 32 4z" fill="#fff" opacity="0.7"/>
                  <circle cx="32" cy="28" r="4" fill="#fff" opacity="0.3"/>
                  <path d="M28 56l4-12 4 12" fill="#fbbf24" opacity="0.6"/>
                </svg>
                Let&apos;s Launch
              </span>
            )}
          </button>
        </form>

        <p className="login-footer">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" opacity="0.4">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412l-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.399l-.422.006.067-.376 2.275-.417z" />
            <circle cx="8" cy="4.5" r="1" />
          </svg>
          Authorized personnel only
        </p>
      </div>
    </div>
  )
}
