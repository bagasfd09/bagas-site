'use client'

import { useRef, useState, useCallback } from 'react'

interface ImageUploadProps {
  value: string
  onChange: (path: string) => void
  folder?: string
  accept?: string // e.g. "image/svg+xml" or "image/*"
  acceptHint?: string // display text for allowed types
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'projects',
  accept = 'image/*',
  acceptHint = 'PNG, JPG, WebP up to 5MB',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [uploadedMeta, setUploadedMeta] = useState<{ filename: string; size: number } | null>(null)

  const upload = useCallback(
    async (file: File) => {
      setError('')
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', folder)

        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Upload failed')
          return
        }

        onChange(data.path)
        setUploadedMeta({ filename: data.filename, size: file.size })
      } catch {
        setError('Upload failed')
      } finally {
        setUploading(false)
      }
    },
    [folder, onChange]
  )

  function handleFile(file: File) {
    // Validate against accept prop
    const allowed = accept === 'image/svg+xml'
      ? ['image/svg+xml']
      : ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowed.includes(file.type)) {
      setError(accept === 'image/svg+xml' ? 'Only SVG files are allowed' : 'Invalid file type. Allowed: JPG, PNG, WebP, GIF, SVG')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum 5MB')
      return
    }
    upload(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  if (value) {
    return (
      <div
        style={{
          border: '1px solid var(--admin-border)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'var(--admin-bg)',
        }}
      >
        <div style={{ position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            style={{
              width: '100%',
              maxHeight: '200px',
              objectFit: 'contain',
              display: 'block',
              padding: accept === 'image/svg+xml' ? '20px' : '0',
            }}
          />
          <button
            type="button"
            onClick={() => { onChange(''); setUploadedMeta(null) }}
            title="Remove"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.7)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '10px 14px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-secondary)', marginBottom: '6px' }}>
            {uploadedMeta
              ? `${uploadedMeta.filename} · ${formatBytes(uploadedMeta.size)}`
              : value.split('/').pop()}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="admin-btn admin-btn-secondary"
            style={{ fontSize: '0.8125rem', padding: '4px 12px' }}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change'}
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </div>
    )
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
          borderRadius: '12px',
          padding: '32px 20px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          background: dragOver ? 'rgba(88,166,255,0.05)' : 'transparent',
          transition: 'all 0.15s ease',
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
          {uploading ? '⏳' : accept === 'image/svg+xml' ? '🖼' : '📷'}
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-primary)', fontWeight: 500, marginBottom: '4px' }}>
          {uploading ? 'Uploading...' : 'Drop file here or click to upload'}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
          {acceptHint}
        </div>
      </div>
      {error && (
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-danger)', marginTop: '6px' }}>
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
    </div>
  )
}
