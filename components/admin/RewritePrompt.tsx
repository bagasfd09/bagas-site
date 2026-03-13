'use client'

import { useState, useRef, useEffect } from 'react'

interface RewritePromptProps {
  position: { top: number; left: number }
  onSubmit: (instruction: string) => void
  onCancel: () => void
}

const CHIPS = ['Shorter', 'Formal', 'Fix grammar', 'Simplify']

export default function RewritePrompt({ position, onSubmit, onCancel }: RewritePromptProps) {
  const [instruction, setInstruction] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const handleSubmit = () => {
    const text = instruction.trim()
    if (text) onSubmit(text)
  }

  const handleChip = (chip: string) => {
    onSubmit(chip)
  }

  return (
    <div
      className="pe-rewrite-prompt"
      style={{ top: position.top, left: position.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="pe-rewrite-prompt-label">Rewrite with Claw&apos;d</span>
      <input
        ref={inputRef}
        type="text"
        className="pe-rewrite-prompt-input"
        placeholder="What should I do with this text?"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
          }
          if (e.key === 'Escape') onCancel()
        }}
      />
      <div className="pe-rewrite-chips">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            type="button"
            className="pe-rewrite-chip"
            onClick={() => handleChip(chip)}
          >
            {chip}
          </button>
        ))}
      </div>
      <div className="pe-rewrite-prompt-actions">
        <button type="button" className="pe-rewrite-cancel" onClick={onCancel}>Cancel</button>
        <button type="button" className="pe-rewrite-send" onClick={handleSubmit} disabled={!instruction.trim()}>
          Rewrite
        </button>
      </div>
    </div>
  )
}
