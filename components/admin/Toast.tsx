'use client'

import { useEffect } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  onDismiss: () => void
}

export default function Toast({ message, type, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const accentColor =
    type === 'success'
      ? 'var(--admin-success)'
      : type === 'error'
      ? 'var(--admin-danger)'
      : 'var(--admin-info)'

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        background: 'var(--admin-surface)',
        border: '1px solid var(--admin-border)',
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: '10px',
        fontSize: '0.8125rem',
        color: 'var(--admin-text-primary)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        zIndex: 9999,
        animation: 'admin-toast-in 0.25s ease',
        maxWidth: '360px',
      }}
    >
      <span style={{ color: accentColor, fontWeight: 600, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--admin-text-muted)',
          cursor: 'pointer',
          padding: '2px 4px',
          fontSize: '13px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
