'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { PixelSprite, OfficeBackground } from '@/components/admin/DashboardMascot'
import { ByteSprite, NekoSprite, SpaceBackground, GardenBackground } from '@/components/admin/MascotSprites'

interface MascotSettings {
  mascotType: string
  displayName: string
  greeting: string
  systemPrompt: string
  gatewayUrl: string
  authToken: string
  agentId: string
  weightIdle: number
  weightWalking: number
  weightCoding: number
  weightWriting: number
  weightKarate: number
  weightPhone: number
  weightPresenting: number
  weightCoffee: number
  weightCalling: number
  moveSpeed: string
  primaryColor: string
  showOn: string[]
  background: string
}

const DEFAULT_SETTINGS: MascotSettings = {
  mascotType: 'clawd',
  displayName: "Claw'd",
  greeting: "Hey! I'm Claw'd. What's up?",
  systemPrompt: 'You are Claw\'d, a cheerful pixel crab assistant. You help the commander manage their site with enthusiasm and crab puns.',
  gatewayUrl: 'http://localhost:18789',
  authToken: '',
  agentId: 'main',
  weightIdle: 10,
  weightWalking: 18,
  weightCoding: 20,
  weightWriting: 12,
  weightKarate: 12,
  weightPhone: 10,
  weightPresenting: 6,
  weightCoffee: 6,
  weightCalling: 6,
  moveSpeed: 'normal',
  primaryColor: '#e8735a',
  showOn: ['dashboard', 'all'],
  background: 'office',
}

const MASCOT_TYPES = [
  { id: 'clawd', name: "Claw'd", subtitle: 'Pixel Crab', color: '#e8735a', face: ':)' },
  { id: 'byte', name: 'Byte', subtitle: 'Pixel Robot', color: '#4a90d9', face: '>_' },
  { id: 'neko', name: 'Neko', subtitle: 'Pixel Cat', color: '#8a7a9e', face: '=^.^=' },
] as const

const MAIN_WEIGHTS = [
  { key: 'weightCoding', label: 'Coding', color: '#b4762c' },
  { key: 'weightWalking', label: 'Walking', color: '#c9a96e' },
  { key: 'weightWriting', label: 'Writing', color: '#8a7a62' },
  { key: 'weightKarate', label: 'Karate', color: '#e8c84a' },
  { key: 'weightIdle', label: 'Idle', color: '#d8d2c8' },
] as const

const MINOR_WEIGHTS = [
  { key: 'weightPhone', label: 'Phone' },
  { key: 'weightPresenting', label: 'Presenting' },
  { key: 'weightCoffee', label: 'Coffee' },
  { key: 'weightCalling', label: 'Calling' },
] as const

const BG_OPTIONS = [
  { value: 'office', label: 'Office', colors: ['#f0ede8', '#d8d2c8', '#a08868'] },
  { value: 'space', label: 'Space', colors: ['#0a0a20', '#1a1a3e', '#c9a96e'] },
  { value: 'garden', label: 'Garden', colors: ['#87ceeb', '#66bb6a', '#4caf50'] },
]

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type MascotState = 'idle' | 'walking' | 'coding' | 'writing' | 'karate' | 'phone' | 'presenting' | 'coffee' | 'calling'

const PREVIEW_STATES: MascotState[] = ['idle', 'coding', 'writing', 'walking', 'karate', 'phone', 'presenting', 'coffee', 'calling']

function MascotPreview({ stateName, mascotType }: { stateName: string; mascotType: string }) {
  const [frame, setFrame] = useState(0)
  const [stateIdx, setStateIdx] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => f + 1), 200)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setStateIdx((i) => (i + 1) % PREVIEW_STATES.length)
    }, 3000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const currentState = PREVIEW_STATES[stateIdx]
  const spriteProps = {
    state: currentState, frame, karatePhase: 'ready' as const,
    presentPhase: 'point-1' as const, coffeePhase: 'sip-1' as const, callingPhase: 'wave-1' as const,
  }

  const SpriteComponent = mascotType === 'byte' ? ByteSprite
    : mascotType === 'neko' ? NekoSprite
    : PixelSprite

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div className={`adm-mascot-sprite adm-mascot-sprite--${currentState}`}
        style={{ transform: 'scale(1.5)', transformOrigin: 'center bottom' }}>
        <SpriteComponent {...spriteProps} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 8, textTransform: 'capitalize' }}>{stateName} — {currentState}</span>
    </div>
  )
}

export default function MascotSettingsPage() {
  const [settings, setSettings] = useState<MascotSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [editingWeight, setEditingWeight] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch('/api/admin/mascot')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSettings((prev) => ({ ...prev, ...data }))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/admin/mascot', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setSaveStatus('saved')
        setDirty(false)
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('error')
    }
  }, [settings])

  const testConnection = useCallback(async () => {
    setConnectionStatus('unknown')
    try {
      const res = await fetch('/api/admin/mascot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'ping' }] }),
      })
      setConnectionStatus(res.ok ? 'connected' : 'error')
    } catch {
      setConnectionStatus('error')
    }
  }, [])

  const update = (key: keyof MascotSettings, value: string | number | string[]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  const currentMascot = MASCOT_TYPES.find((m) => m.id === settings.mascotType) || MASCOT_TYPES[0]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 14 }}>Loading mascot settings...</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--admin-text-primary)', margin: 0 }}>Mascot Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>
          Customize Claw&apos;d&apos;s behavior, appearance, and chat personality
        </p>
      </div>

      {/* Main 2-column layout: Left (Selection + Appearance) | Right (existing cards) */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* LEFT COLUMN */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Choose Your Mascot */}
          <div className="admin-card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-primary)' }}>Choose Your Mascot</span>
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {MASCOT_TYPES.map((mascot) => {
                const isActive = settings.mascotType === mascot.id
                return (
                  <div
                    key={mascot.id}
                    onClick={() => update('mascotType', mascot.id)}
                    style={{
                      border: isActive ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                      borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
                      cursor: 'pointer',
                      background: isActive ? 'var(--admin-accent-soft, rgba(180,118,44,0.05))' : 'var(--admin-surface)',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{
                      width: 40, height: 40, background: mascot.color, borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: mascot.face.length > 3 ? 13 : 18, color: '#fff', fontWeight: 800 }}>{mascot.face}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-primary)' }}>{mascot.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{mascot.subtitle}</span>
                    </div>
                    {isActive && (
                      <span style={{
                        background: 'var(--admin-accent)', color: '#fff', fontSize: 10,
                        fontWeight: 500, padding: '2px 8px', borderRadius: 20, flexShrink: 0,
                      }}>Active</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Appearance */}
          <div className="admin-card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-primary)' }}>Appearance</span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Background */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text-secondary)' }}>Background</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {BG_OPTIONS.map((bg) => {
                    const active = settings.background === bg.value
                    return (
                      <div
                        key={bg.value}
                        onClick={() => update('background', bg.value)}
                        style={{
                          flex: 1, padding: '6px 0', borderRadius: 8, cursor: 'pointer',
                          border: active ? '2px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          background: 'var(--admin-surface)', transition: 'border-color 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', gap: 2 }}>
                          {bg.colors.map((c, ci) => (
                            <div key={ci} style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 10, color: active ? 'var(--admin-accent)' : 'var(--admin-text-muted)', fontWeight: active ? 600 : 400 }}>{bg.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Preview + Behavior */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Preview Card */}
            <div className="admin-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-primary)' }}>Preview</span>
                <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', background: 'var(--admin-bg)', padding: '3px 10px', borderRadius: 20, border: '1px solid var(--admin-border)' }}>Live</span>
              </div>
              <div style={{ height: 200, position: 'relative', overflow: 'hidden' }}>
                {settings.background === 'space' ? <SpaceBackground /> : settings.background === 'garden' ? <GardenBackground /> : <OfficeBackground />}
                <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
                  <MascotPreview stateName={currentMascot.name} mascotType={settings.mascotType} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, padding: '14px 18px', borderTop: '1px solid var(--admin-border)' }}>
                <div className="adm-mascot-info-pill">
                  <span className="adm-mascot-info-label">Name</span>
                  <span className="adm-mascot-info-value">{settings.displayName}</span>
                </div>
                <div className="adm-mascot-info-pill">
                  <span className="adm-mascot-info-label">Mood</span>
                  <span className="adm-mascot-info-value">Happy</span>
                </div>
                <div className="adm-mascot-info-pill">
                  <span className="adm-mascot-info-label">State</span>
                  <span className="adm-mascot-info-value" style={{ color: settings.primaryColor }}>Coding</span>
                </div>
              </div>
            </div>

            {/* Behavior Card */}
            <div className="admin-card" style={{ flex: 1, padding: 0 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-primary)' }}>Behavior &amp; Animations</span>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', letterSpacing: '0.05em' }}>ANIMATION WEIGHTS</span>
                {MAIN_WEIGHTS.map(({ key, label, color }) => (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text-primary)' }}>{label}</span>
                      {editingWeight === key ? (
                        <input
                          type="number" min={0} max={40}
                          value={settings[key] as number}
                          onChange={(e) => update(key, Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))}
                          onBlur={() => setEditingWeight(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingWeight(null)}
                          autoFocus
                          style={{
                            width: 48, textAlign: 'right', fontSize: 13, fontWeight: 600,
                            color: 'var(--admin-accent)', background: 'var(--admin-bg)',
                            border: '1px solid var(--admin-accent)', borderRadius: 4,
                            padding: '1px 6px', outline: 'none',
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingWeight(key)}
                          style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-accent)', cursor: 'pointer' }}
                        >{settings[key]}%</span>
                      )}
                    </div>
                    <div
                      style={{ height: 4, background: 'var(--admin-border)', borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const pct = Math.round(((e.clientX - rect.left) / rect.width) * 40)
                        update(key, Math.min(40, Math.max(0, pct)))
                      }}
                    >
                      <div style={{ width: `${((settings[key] as number) / 40) * 100}%`, background: color, height: '100%', borderRadius: 2, transition: 'width 0.2s' }} />
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  {MINOR_WEIGHTS.map(({ key, label }) => (
                    <span
                      key={key}
                      onClick={() => setEditingWeight(editingWeight === key ? null : key)}
                      style={{
                        fontSize: 12, color: 'var(--admin-text-secondary)', background: 'var(--admin-bg)',
                        border: '1px solid var(--admin-border)', borderRadius: 20,
                        padding: '4px 12px', cursor: 'pointer', transition: 'border-color 0.15s',
                        borderColor: editingWeight === key ? 'var(--admin-accent)' : undefined,
                      }}
                    >
                      {label} {editingWeight === key ? (
                        <input
                          type="number" min={0} max={40}
                          value={settings[key] as number}
                          onChange={(e) => update(key, Math.min(40, Math.max(0, parseInt(e.target.value) || 0)))}
                          onBlur={() => setEditingWeight(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingWeight(null)}
                          autoFocus
                          style={{
                            width: 32, textAlign: 'center', fontSize: 12,
                            color: 'var(--admin-text-primary)', background: 'transparent',
                            border: 'none', outline: 'none', fontWeight: 600,
                          }}
                        />
                      ) : <>{settings[key]}%</>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Widget + Persona */}
          <div style={{ display: 'flex', gap: 16 }}>
            <div className="admin-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-primary)' }}>Chat Widget</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', background: '#e8735a', padding: '2px 8px', borderRadius: 4 }}>OpenClaw</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }} onClick={testConnection}>
                  {connectionStatus === 'connected' && (
                    <><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} /><span style={{ fontSize: 12, color: '#22c55e', fontWeight: 500 }}>Connected</span></>
                  )}
                  {connectionStatus === 'error' && <span style={{ fontSize: 12, color: '#ef4444' }}>Connection failed</span>}
                  {connectionStatus === 'unknown' && <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>Click to test</span>}
                </div>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="adm-mascot-field">
                  <label className="admin-label">Gateway URL</label>
                  <input className="admin-input" value={settings.gatewayUrl} onChange={(e) => update('gatewayUrl', e.target.value)} placeholder="http://localhost:18789" />
                  <span className="admin-hint">OpenClaw gateway endpoint (local or Tailscale URL)</span>
                </div>
                <div className="adm-mascot-field">
                  <label className="admin-label">Auth Token</label>
                  <input className="admin-input" type="password" value={settings.authToken} onChange={(e) => update('authToken', e.target.value)} placeholder="Enter gateway auth token" />
                </div>
                <div className="adm-mascot-field">
                  <label className="admin-label">Agent ID</label>
                  <input className="admin-input" value={settings.agentId} onChange={(e) => update('agentId', e.target.value)} placeholder="main" />
                  <span className="admin-hint">Target agent for chat — uses openclaw/main by default</span>
                </div>
              </div>
            </div>

            <div className="admin-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--admin-border)' }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--admin-text-primary)' }}>Persona &amp; Personality</span>
              </div>
              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="adm-mascot-field">
                  <label className="admin-label">Display Name</label>
                  <input className="admin-input" value={settings.displayName} onChange={(e) => update('displayName', e.target.value)} />
                </div>
                <div className="adm-mascot-field">
                  <label className="admin-label">System Prompt</label>
                  <textarea className="admin-textarea" value={settings.systemPrompt} onChange={(e) => update('systemPrompt', e.target.value)} rows={4} />
                </div>
                <div className="adm-mascot-field">
                  <label className="admin-label">Greeting Message</label>
                  <input className="admin-input" value={settings.greeting} onChange={(e) => update('greeting', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating save bar */}
      {dirty && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--admin-surface)', border: '1px solid var(--admin-border)',
          borderRadius: 12, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)', zIndex: 50,
        }}>
          <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>Unsaved changes</span>
          <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saveStatus === 'saving'} style={{ fontSize: 13, padding: '6px 20px' }}>
            {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
