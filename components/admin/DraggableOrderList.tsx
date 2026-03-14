'use client'

import { useState, useEffect, useRef } from 'react'
import { Reorder, useDragControls } from 'motion/react'
import { GripVertical } from 'lucide-react'

export interface DraggableItem {
  key: string
  label: string
  desc?: string
  icon: React.ComponentType<Record<string, unknown>>
  checked: boolean
  onToggle: () => void
}

interface DraggableOrderListProps {
  items: DraggableItem[]
  onReorder: (fromIndex: number, toIndex: number) => void
}

const springTransition = { type: 'spring' as const, bounce: 0.15, duration: 0.4 }

function DraggableRow({ item, index }: { item: DraggableItem; index: number }) {
  const controls = useDragControls()
  const Icon = item.icon

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      transition={springTransition}
      whileDrag={{
        scale: 1.03,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 50,
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '10px',
        border: `1px solid var(--admin-border)`,
        background: item.checked
          ? 'var(--admin-surface, #fff)'
          : 'var(--admin-bg, #f5f3ef)',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        cursor: 'default',
        listStyle: 'none',
      }}
    >
      {/* Grip handle — only this triggers drag */}
      <div
        onPointerDown={(e) => controls.start(e)}
        style={{ cursor: 'grab', touchAction: 'none', flexShrink: 0, display: 'flex' }}
      >
        <GripVertical
          size={16}
          style={{
            color: 'var(--admin-text-muted)',
            opacity: 0.5,
          }}
        />
      </div>

      {/* Order number */}
      <span style={{
        width: '22px',
        height: '22px',
        borderRadius: '6px',
        background: item.checked ? 'var(--admin-accent)' : 'var(--admin-text-muted, #999)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: 700,
        flexShrink: 0,
        opacity: item.checked ? 1 : 0.5,
        transition: 'background 0.2s ease',
      }}>
        {index + 1}
      </span>

      {/* Icon */}
      <div
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          background: item.checked ? 'rgba(88,166,255,0.1)' : 'var(--admin-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} style={{ color: item.checked ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }} />
      </div>

      {/* Label + desc */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: item.checked ? 'var(--admin-text-primary)' : 'var(--admin-text-muted)',
        }}>
          {item.label}
          {!item.checked && (
            <span style={{ fontSize: '0.7rem', fontWeight: 400, marginLeft: '8px', opacity: 0.6 }}>Hidden</span>
          )}
        </div>
        {item.desc && (
          <div style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted)', marginTop: '1px' }}>
            {item.desc}
          </div>
        )}
      </div>

      {/* Toggle */}
      <div
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); item.onToggle() }}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          width: '42px',
          height: '24px',
          borderRadius: '12px',
          background: item.checked ? 'var(--admin-accent)' : 'var(--admin-border)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#fff',
            position: 'absolute',
            top: '3px',
            left: item.checked ? '21px' : '3px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          }}
        />
      </div>
    </Reorder.Item>
  )
}

export default function DraggableOrderList({ items, onReorder }: DraggableOrderListProps) {
  const [localItems, setLocalItems] = useState(items)
  const [isDragging, setIsDragging] = useState(false)
  const prevOrderRef = useRef<string[]>(items.map(i => i.key))

  // Sync with parent when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalItems(items)
      prevOrderRef.current = items.map(i => i.key)
    }
  }, [items, isDragging])

  const handleReorder = (newOrder: DraggableItem[]) => {
    setLocalItems(newOrder)
    setIsDragging(true)
  }

  // Detect drag end via pointer events on the container
  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Find the from/to indices by comparing previous order to new order
    const prevKeys = prevOrderRef.current
    const newKeys = localItems.map(i => i.key)

    // Find which item moved
    for (let i = 0; i < prevKeys.length; i++) {
      if (prevKeys[i] !== newKeys[i]) {
        // Find where the old item at index i went
        const movedKey = prevKeys[i]
        const newIndex = newKeys.indexOf(movedKey)
        // But we need to find the actual dragged item — it's the one whose
        // position changed in a way consistent with a single move
        // Simpler: find the item that was removed from one position and inserted at another
        for (let from = 0; from < prevKeys.length; from++) {
          const simulated = [...prevKeys]
          const [moved] = simulated.splice(from, 1)
          const to = newKeys.indexOf(moved)
          simulated.splice(to, 0, moved)
          if (simulated.every((k, idx) => k === newKeys[idx])) {
            onReorder(from, to)
            prevOrderRef.current = newKeys
            return
          }
        }
        // Fallback: just report the first difference
        onReorder(i, newIndex)
        prevOrderRef.current = newKeys
        return
      }
    }
  }

  return (
    <Reorder.Group
      axis="y"
      values={localItems}
      onReorder={handleReorder}
      onPointerUp={handlePointerUp}
      style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}
    >
      {localItems.map((item, index) => (
        <DraggableRow key={item.key} item={item} index={index} />
      ))}
    </Reorder.Group>
  )
}
