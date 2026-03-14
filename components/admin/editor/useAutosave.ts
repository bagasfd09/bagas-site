import { useEffect, useRef, useState, useCallback } from 'react'

interface AutosaveData {
  title: string
  content: string
  description: string
  thumbnail: string
  tags: string[]
  category: string
  series: string
  seriesOrder: number | null
  published: boolean
  featured: boolean
}

interface UseAutosaveOptions {
  postId?: string
  data: AutosaveData
  debounceMs?: number
}

interface UseAutosaveReturn {
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error'
  lastSavedAt: Date | null
  clearAutosave: () => void
  hasAutosave: boolean
  restoreAutosave: () => AutosaveData | null
}

function getStorageKey(postId?: string): string {
  return postId ? `post-autosave-${postId}` : 'post-autosave-new'
}

export function useAutosave({ postId, data, debounceMs = 2000 }: UseAutosaveOptions): UseAutosaveReturn {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevDataRef = useRef<string>('')
  const key = getStorageKey(postId)

  // Check if there's an existing autosave on mount
  const [hasAutosave] = useState(() => {
    try {
      return !!localStorage.getItem(key)
    } catch {
      return false
    }
  })

  // Debounced autosave
  useEffect(() => {
    const serialized = JSON.stringify(data)

    // Skip if data hasn't changed
    if (serialized === prevDataRef.current) return

    // Skip initial render (don't mark as unsaved on load)
    if (!prevDataRef.current) {
      prevDataRef.current = serialized
      return
    }

    prevDataRef.current = serialized
    setSaveStatus('unsaved')

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      try {
        setSaveStatus('saving')
        localStorage.setItem(key, serialized)
        localStorage.setItem(`${key}-timestamp`, new Date().toISOString())
        setSaveStatus('saved')
        setLastSavedAt(new Date())
      } catch {
        setSaveStatus('error')
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [data, key, debounceMs])

  // Intercept Ctrl+S
  useEffect(() => {
    const handleSave = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        // Force immediate save
        try {
          const serialized = JSON.stringify(data)
          localStorage.setItem(key, serialized)
          localStorage.setItem(`${key}-timestamp`, new Date().toISOString())
          setSaveStatus('saved')
          setLastSavedAt(new Date())
        } catch {
          setSaveStatus('error')
        }
      }
    }
    document.addEventListener('keydown', handleSave)
    return () => document.removeEventListener('keydown', handleSave)
  }, [data, key])

  // Update "saved X ago" display periodically
  useEffect(() => {
    if (!lastSavedAt) return
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastSavedAt(prev => prev ? new Date(prev.getTime()) : null)
    }, 10000)
    return () => clearInterval(interval)
  }, [lastSavedAt])

  const clearAutosave = useCallback(() => {
    try {
      localStorage.removeItem(key)
      localStorage.removeItem(`${key}-timestamp`)
    } catch { /* ignore */ }
  }, [key])

  const restoreAutosave = useCallback((): AutosaveData | null => {
    try {
      const saved = localStorage.getItem(key)
      if (!saved) return null
      return JSON.parse(saved) as AutosaveData
    } catch {
      return null
    }
  }, [key])

  return { saveStatus, lastSavedAt, clearAutosave, hasAutosave, restoreAutosave }
}
