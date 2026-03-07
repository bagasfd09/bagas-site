'use client'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  loading?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(3px)',
        }}
        onClick={onCancel}
      />
      <div
        style={{
          position: 'relative',
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: '12px',
          padding: '24px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'var(--admin-text-primary)',
            marginBottom: '8px',
          }}
        >
          🗑 {title}
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--admin-text-secondary)',
            lineHeight: 1.6,
            marginBottom: '24px',
          }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} disabled={loading} className="admin-btn admin-btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className="admin-btn admin-btn-danger">
            {loading ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
