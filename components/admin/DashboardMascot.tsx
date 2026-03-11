'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { ByteSprite, NekoSprite, SpaceBackground, GardenBackground } from '@/components/admin/MascotSprites'

/* ── Claw'd Pixel Mascot ─────────────────────────────────────
   A coral pixel crab that wanders above the traffic legend.
   ──────────────────────────────────────────────────────────── */

type MascotState = 'idle' | 'walking' | 'coding' | 'writing' | 'karate' | 'phone' | 'presenting' | 'coffee' | 'calling'

// Karate has multiple phases for a long animated sequence
type KaratePhase = 'ready' | 'punch-l' | 'punch-r' | 'kick' | 'spin' | 'chop' | 'bow'

// Presenting phases
type PresentPhase = 'walk' | 'point-1' | 'point-2' | 'point-3' | 'draw' | 'done'

// Coffee break phases
type CoffeePhase = 'walk' | 'pour' | 'sip-1' | 'sip-2' | 'done'

// Calling commander phases
type CallingPhase = 'wave-1' | 'jump' | 'wave-2' | 'jump-2' | 'wave-3'

// Pixel art rendered as SVG for crisp scaling — Claw'd the crab!
export function PixelSprite({ state, frame, karatePhase, presentPhase, coffeePhase, callingPhase }: {
  state: MascotState; frame: number; karatePhase: KaratePhase;
  presentPhase: PresentPhase; coffeePhase: CoffeePhase; callingPhase: CallingPhase
}) {
  // Grid widens for props
  const s = 5
  const needsWideGrid = state === 'coding' || state === 'writing' || state === 'phone' || state === 'presenting' || state === 'coffee'
  const gridW = needsWideGrid ? 22 : 16
  const gridH = 16
  const w = gridW * s
  const h = gridH * s

  // Color palette — coral/salmon crab
  const shell = '#e8735a'    // coral shell
  const shellDark = '#c4573f' // darker coral (shadow/detail)
  const shellLight = '#f2a08a' // lighter coral (highlights)
  const eye = '#1a1a1a'      // black eyes
  const eyeWhite = '#ffffff'
  const claw = '#e8735a'     // claw color (same as shell)
  const legTip = '#ffffff'   // white leg tips
  const antenna = '#c4573f'  // antenna color

  const laptop = '#555555'     // laptop body
  const laptopScreen = '#1e3a5f' // dark screen
  const screenGlow = '#4fc3f7'  // code on screen
  const screenGlow2 = '#81c784' // green code line
  const glasses = '#4a90d9'    // blue glasses frames
  const paper = '#f5f0e0'      // paper color
  const paperLine = '#c8c1b4'  // paper lines
  const pencil = '#e8c84a'     // yellow pencil
  const pencilTip = '#3b3225'  // pencil tip (graphite)
  const pencilEraser = '#e8735a' // eraser (matches shell!)

  const headband = '#e8c84a'   // yellow headband for karate
  const impactStar = '#ffeb3b' // impact star flash
  const phoneBody = '#2a2a2a'
  const phoneScreen = '#4fc3f7'
  const coffeeCup = '#ffffff'
  const coffeeLiquid = '#6d4c41'
  const pointerStick = '#8a7458'

  // Animation helpers
  const legPhase = state === 'walking' ? (frame % 4) : 0
  const bounce = (state === 'karate' && (karatePhase === 'kick' || karatePhase === 'spin'))
    ? (frame % 2 === 0 ? -2 : 0)
    : (state === 'calling' && (callingPhase === 'jump' || callingPhase === 'jump-2'))
    ? (frame % 2 === 0 ? -3 : 0) : 0
  const sitSquash = state === 'coding' || state === 'writing' || state === 'phone' ? 1 : 0
  const blink = state === 'idle' && frame % 12 === 0
  const clawWave = state === 'karate' ? false : state === 'calling' ? true : (frame % 6 < 3)

  // Helper to draw a pixel
  const px = (x: number, y: number, color: string, key?: string) => (
    <rect key={key || `${x}-${y}`} x={x * s} y={(y + bounce) * s} width={s} height={s} fill={color} />
  )

  const pixels: JSX.Element[] = []

  // ── Claw'd the Crab ──

  // Antennae (row 1-3)
  pixels.push(px(5, 1, antenna, 'a1'), px(10, 1, antenna, 'a2'))
  pixels.push(px(6, 2, antenna, 'a3'), px(9, 2, antenna, 'a4'))
  // Antenna tips wiggle
  if (frame % 8 < 4) {
    pixels.push(px(4, 0, antenna, 'at1'), px(11, 0, antenna, 'at2'))
  } else {
    pixels.push(px(5, 0, antenna, 'at1'), px(10, 0, antenna, 'at2'))
  }

  // Shell / Head (row 3-7) — rounded dome shape
  pixels.push(px(6, 3, shell), px(7, 3, shell), px(8, 3, shell), px(9, 3, shell))
  for (let x = 5; x <= 10; x++) pixels.push(px(x, 4, shell))
  for (let x = 4; x <= 11; x++) pixels.push(px(x, 5, x === 4 || x === 11 ? shellDark : shell))

  // Eyes row (row 6) — with glasses in writing state
  const hasGlasses = state === 'writing'
  for (let x = 4; x <= 11; x++) {
    if (x === 5 || x === 10) pixels.push(px(x, 6, blink ? shell : eyeWhite))
    else if (x === 6 || x === 9) pixels.push(px(x, 6, blink ? shell : eye))
    else pixels.push(px(x, 6, x === 4 || x === 11 ? shellDark : shell))
  }
  // Glasses overlay — blue frames around eyes
  if (hasGlasses) {
    // Left lens frame (around eye at 5-6)
    pixels.push(px(4, 5, glasses, 'gl1'), px(5, 5, glasses, 'gl2'), px(6, 5, glasses, 'gl3'), px(7, 5, glasses, 'gl4'))
    pixels.push(px(4, 7, glasses, 'gl5'), px(7, 7, glasses, 'gl6'))
    // Bridge
    pixels.push(px(7, 6, glasses, 'gl7'), px(8, 6, glasses, 'gl8'))
    // Right lens frame (around eye at 9-10)
    pixels.push(px(8, 5, glasses, 'gr1'), px(9, 5, glasses, 'gr2'), px(10, 5, glasses, 'gr3'), px(11, 5, glasses, 'gr4'))
    pixels.push(px(8, 7, glasses, 'gr5'), px(11, 7, glasses, 'gr6'))
    // Temple arms
    pixels.push(px(3, 6, glasses, 'gt1'), px(12, 6, glasses, 'gt2'))
  }

  // Lower face / mouth (row 7)
  for (let x = 4; x <= 11; x++) {
    if (x === 7 || x === 8) pixels.push(px(x, 7, shellDark)) // little mouth
    else pixels.push(px(x, 7, shell))
  }

  // Body (row 8-9) — wider, crab-like
  for (let x = 3; x <= 12; x++) {
    const isEdge = x === 3 || x === 12
    pixels.push(px(x, 8, isEdge ? shellDark : shell))
  }
  for (let x = 3; x <= 12; x++) {
    const isEdge = x === 3 || x === 12
    const isCenter = x >= 6 && x <= 9
    pixels.push(px(x, 9, isEdge ? shellDark : isCenter ? shellLight : shell))
  }

  // Body bottom (row 10)
  const bodyEnd = 10 + sitSquash
  for (let y = 10; y <= bodyEnd; y++) {
    for (let x = 4; x <= 11; x++) {
      pixels.push(px(x, y, x >= 6 && x <= 9 ? shellLight : shell))
    }
  }

  // ── Karate headband (row 3, over top of shell) ──
  if (state === 'karate') {
    pixels.push(px(5, 3, headband, 'hb1'), px(6, 3, headband, 'hb2'), px(7, 3, headband, 'hb3'))
    pixels.push(px(8, 3, headband, 'hb4'), px(9, 3, headband, 'hb5'), px(10, 3, headband, 'hb6'))
    // Headband tails flowing behind
    const tailWag = frame % 4
    if (tailWag < 2) {
      pixels.push(px(11, 2, headband, 'hbt1'), px(12, 1, headband, 'hbt2'))
    } else {
      pixels.push(px(11, 3, headband, 'hbt1'), px(12, 2, headband, 'hbt2'))
    }
  }

  // ── Claws — different poses per state ──
  if (state === 'karate') {
    // Karate claw poses per phase
    if (karatePhase === 'punch-l') {
      // Left claw punching forward (extended far left)
      pixels.push(px(2, 7, claw, 'lc1'), px(1, 7, claw, 'lc2'), px(0, 7, claw, 'lc3'))
      pixels.push(px(-1, 6, claw, 'lc4'), px(-1, 7, claw, 'lc5'), px(-1, 8, claw, 'lc6'))
      // Right claw guard position (tucked)
      pixels.push(px(13, 8, claw, 'rc1'), px(14, 8, claw, 'rc2'))
      pixels.push(px(14, 7, claw, 'rc3'))
      // Impact star
      if (frame % 2 === 0) {
        pixels.push(px(-2, 6, impactStar, 'is1'), px(-2, 8, impactStar, 'is2'))
        pixels.push(px(-3, 7, impactStar, 'is3'))
      }
    } else if (karatePhase === 'punch-r') {
      // Left claw guard
      pixels.push(px(2, 8, claw, 'lc1'), px(1, 8, claw, 'lc2'))
      pixels.push(px(1, 7, claw, 'lc3'))
      // Right claw punching forward (extended far right)
      pixels.push(px(13, 7, claw, 'rc1'), px(14, 7, claw, 'rc2'), px(15, 7, claw, 'rc3'))
      pixels.push(px(16, 6, claw, 'rc4'), px(16, 7, claw, 'rc5'), px(16, 8, claw, 'rc6'))
      // Impact star
      if (frame % 2 === 0) {
        pixels.push(px(17, 6, impactStar, 'is1'), px(17, 8, impactStar, 'is2'))
        pixels.push(px(18, 7, impactStar, 'is3'))
      }
    } else if (karatePhase === 'chop') {
      // Both claws up for downward chop
      pixels.push(px(2, 5, claw, 'lc1'), px(1, 4, claw, 'lc2'), px(0, 3, claw, 'lc3'))
      pixels.push(px(1, 5, claw, 'lc4'))
      pixels.push(px(13, 5, claw, 'rc1'), px(14, 4, claw, 'rc2'), px(15, 3, claw, 'rc3'))
      pixels.push(px(14, 5, claw, 'rc4'))
      // Impact lines below
      if (frame % 2 === 0) {
        pixels.push(px(7, 14, impactStar, 'is1'), px(8, 14, impactStar, 'is2'))
        pixels.push(px(6, 15, impactStar, 'is3'), px(9, 15, impactStar, 'is4'))
      }
    } else if (karatePhase === 'spin') {
      // Claws spread wide during spin
      const spinFrame = frame % 4
      if (spinFrame < 2) {
        pixels.push(px(1, 5, claw, 'lc1'), px(0, 4, claw, 'lc2'))
        pixels.push(px(14, 5, claw, 'rc1'), px(15, 4, claw, 'rc2'))
      } else {
        pixels.push(px(1, 9, claw, 'lc1'), px(0, 10, claw, 'lc2'))
        pixels.push(px(14, 9, claw, 'rc1'), px(15, 10, claw, 'rc2'))
      }
    } else if (karatePhase === 'kick') {
      // Left claw guard, one leg kicks out
      pixels.push(px(2, 7, claw, 'lc1'), px(1, 7, claw, 'lc2'))
      pixels.push(px(1, 6, claw, 'lc3'), px(0, 6, claw, 'lc4'))
      pixels.push(px(13, 7, claw, 'rc1'), px(14, 7, claw, 'rc2'))
      pixels.push(px(14, 6, claw, 'rc3'), px(15, 6, claw, 'rc4'))
    } else if (karatePhase === 'bow') {
      // Claws together in front, bowing
      pixels.push(px(5, 9, claw, 'lc1'), px(6, 9, claw, 'lc2'))
      pixels.push(px(9, 9, claw, 'rc1'), px(10, 9, claw, 'rc2'))
      pixels.push(px(7, 9, claw, 'bc1'), px(8, 9, claw, 'bc2'))
    } else {
      // Ready stance — claws in guard position
      pixels.push(px(2, 6, claw, 'lc1'), px(1, 6, claw, 'lc2'), px(0, 5, claw, 'lc3'))
      pixels.push(px(1, 7, claw, 'lc4'))
      pixels.push(px(13, 6, claw, 'rc1'), px(14, 6, claw, 'rc2'), px(15, 5, claw, 'rc3'))
      pixels.push(px(14, 7, claw, 'rc4'))
    }
  } else if (state === 'phone') {
    pixels.push(px(2, 7, claw, 'lc1'), px(1, 7, claw, 'lc2'))
    if (clawWave) { pixels.push(px(0, 6, claw, 'lc3'), px(1, 6, claw, 'lc4'), px(0, 8, claw, 'lc5')) }
    else { pixels.push(px(0, 7, claw, 'lc3'), px(1, 6, claw, 'lc4')) }
  } else if (state === 'presenting') {
    pixels.push(px(2, 7, claw, 'lc1'), px(1, 7, claw, 'lc2'), px(0, 6, claw, 'lc3'), px(1, 6, claw, 'lc4'))
    pixels.push(px(13, 7, claw, 'rc1'), px(14, 7, claw, 'rc2'))
  } else if (state === 'coffee') {
    pixels.push(px(2, 7, claw, 'lc1'), px(1, 7, claw, 'lc2'), px(0, 7, claw, 'lc3'), px(1, 6, claw, 'lc4'))
    pixels.push(px(13, 7, claw, 'rc1'), px(13, 8, claw, 'rc2'))
  } else if (state === 'calling') {
    const waveFrame = frame % 4
    if (waveFrame < 2) { pixels.push(px(2, 5, claw, 'lc1'), px(1, 4, claw, 'lc2'), px(0, 3, claw, 'lc3'), px(1, 5, claw, 'lc4')) }
    else { pixels.push(px(2, 6, claw, 'lc1'), px(1, 5, claw, 'lc2'), px(0, 4, claw, 'lc3'), px(1, 6, claw, 'lc4')) }
    if (waveFrame >= 2) { pixels.push(px(13, 5, claw, 'rc1'), px(14, 4, claw, 'rc2'), px(15, 3, claw, 'rc3'), px(14, 5, claw, 'rc4')) }
    else { pixels.push(px(13, 6, claw, 'rc1'), px(14, 5, claw, 'rc2'), px(15, 4, claw, 'rc3'), px(14, 6, claw, 'rc4')) }
  } else {
    // Normal claws (idle, walking, coding, writing)
    pixels.push(px(2, 7, claw, 'lc1'), px(1, 7, claw, 'lc2'))
    if (clawWave) { pixels.push(px(0, 6, claw, 'lc3'), px(1, 6, claw, 'lc4'), px(0, 8, claw, 'lc5'), px(1, 8, claw, 'lc6')) }
    else { pixels.push(px(0, 7, claw, 'lc3'), px(1, 6, claw, 'lc4'), px(0, 7, claw, 'lc5')) }
    pixels.push(px(13, 7, claw, 'rc1'), px(14, 7, claw, 'rc2'))
    if (clawWave) { pixels.push(px(15, 6, claw, 'rc3'), px(14, 6, claw, 'rc4'), px(15, 8, claw, 'rc5'), px(14, 8, claw, 'rc6')) }
    else { pixels.push(px(15, 7, claw, 'rc3'), px(14, 6, claw, 'rc4'), px(15, 7, claw, 'rc5')) }
  }

  // ── Coding state: tiny pixel laptop in front ──
  if (state === 'coding') {
    const lx = 14
    pixels.push(px(lx, 10, laptop, 'lb1'), px(lx + 1, 10, laptop, 'lb2'), px(lx + 2, 10, laptop, 'lb3'), px(lx + 3, 10, laptop, 'lb4'), px(lx + 4, 10, laptop, 'lb5'))
    pixels.push(px(lx, 11, laptop, 'lb6'), px(lx + 1, 11, laptop, 'lb7'), px(lx + 2, 11, laptop, 'lb8'), px(lx + 3, 11, laptop, 'lb9'), px(lx + 4, 11, laptop, 'lb10'))
    pixels.push(px(lx, 7, laptop, 'ls1'), px(lx + 1, 7, laptop, 'ls2'), px(lx + 2, 7, laptop, 'ls3'), px(lx + 3, 7, laptop, 'ls4'), px(lx + 4, 7, laptop, 'ls5'))
    pixels.push(px(lx, 8, laptopScreen, 'lsc1'), px(lx + 1, 8, laptopScreen, 'lsc2'), px(lx + 2, 8, laptopScreen, 'lsc3'), px(lx + 3, 8, laptopScreen, 'lsc4'), px(lx + 4, 8, laptop, 'ls6'))
    pixels.push(px(lx, 9, laptopScreen, 'lsc5'), px(lx + 1, 9, laptopScreen, 'lsc6'), px(lx + 2, 9, laptopScreen, 'lsc7'), px(lx + 3, 9, laptopScreen, 'lsc8'), px(lx + 4, 9, laptop, 'ls7'))
    const codeLine = frame % 4
    if (codeLine === 0) {
      pixels.push(px(lx + 1, 8, screenGlow, 'cd1'), px(lx + 2, 8, screenGlow, 'cd2'))
      pixels.push(px(lx + 1, 9, screenGlow2, 'cd3'))
    } else if (codeLine === 1) {
      pixels.push(px(lx + 1, 8, screenGlow, 'cd1'), px(lx + 2, 8, screenGlow, 'cd2'), px(lx + 3, 8, screenGlow, 'cd3'))
      pixels.push(px(lx + 1, 9, screenGlow2, 'cd4'), px(lx + 2, 9, screenGlow2, 'cd5'))
    } else if (codeLine === 2) {
      pixels.push(px(lx + 1, 8, screenGlow2, 'cd1'))
      pixels.push(px(lx + 1, 9, screenGlow, 'cd2'), px(lx + 2, 9, screenGlow, 'cd3'), px(lx + 3, 9, screenGlow, 'cd4'))
    } else {
      pixels.push(px(lx + 1, 8, screenGlow, 'cd1'), px(lx + 3, 8, screenGlow2, 'cd2'))
      pixels.push(px(lx + 2, 9, screenGlow, 'cd3'))
    }
  }

  // ── Writing state: paper + pencil to the right ──
  if (state === 'writing') {
    const px0 = 14
    for (let py = 7; py <= 13; py++) {
      for (let ppx = px0; ppx <= px0 + 5; ppx++) {
        pixels.push(px(ppx, py, paper, `pp${ppx}-${py}`))
      }
    }
    const writePhase = frame % 6
    pixels.push(px(px0 + 1, 8, paperLine, 'pl1'), px(px0 + 2, 8, paperLine, 'pl2'), px(px0 + 3, 8, paperLine, 'pl3'))
    if (writePhase >= 2) {
      pixels.push(px(px0 + 1, 10, paperLine, 'pl4'), px(px0 + 2, 10, paperLine, 'pl5'))
    }
    if (writePhase >= 4) {
      pixels.push(px(px0 + 1, 12, paperLine, 'pl6'), px(px0 + 2, 12, paperLine, 'pl7'), px(px0 + 3, 12, paperLine, 'pl8'), px(px0 + 4, 12, paperLine, 'pl9'))
    }
    const pencilBob = frame % 4 < 2 ? 0 : 1
    pixels.push(px(px0 + 5, 9 + pencilBob, pencilEraser, 'pe1'))
    pixels.push(px(px0 + 4, 10 + pencilBob, pencil, 'pc1'))
    pixels.push(px(px0 + 3, 11 + pencilBob, pencil, 'pc2'))
    pixels.push(px(px0 + 2, 12 + pencilBob, pencilTip, 'pt1'))
  }

  // ── Phone call state ──
  if (state === 'phone') {
    const phoneBob = frame % 4 < 2 ? 0 : 1
    pixels.push(px(14, 4 + phoneBob, phoneBody, 'ph1'), px(15, 4 + phoneBob, phoneBody, 'ph2'))
    pixels.push(px(14, 5 + phoneBob, phoneScreen, 'ph3'), px(15, 5 + phoneBob, phoneScreen, 'ph4'))
    pixels.push(px(14, 6 + phoneBob, phoneBody, 'ph5'), px(15, 6 + phoneBob, phoneBody, 'ph6'))
    pixels.push(px(13, 5 + phoneBob, claw, 'phc1'), px(13, 6 + phoneBob, claw, 'phc2'))
    if (frame % 6 < 3) pixels.push(px(5, 1, antenna, 'nod1'), px(10, 1, antenna, 'nod2'))
  }

  // ── Presenting state ──
  if (state === 'presenting') {
    const pointY = presentPhase === 'point-1' ? 5 : presentPhase === 'point-2' ? 7 : presentPhase === 'point-3' ? 9 : 6
    pixels.push(px(14, 7, pointerStick, 'ptr1'), px(15, 6, pointerStick, 'ptr2'))
    pixels.push(px(16, 5, pointerStick, 'ptr3'), px(17, pointY > 6 ? 5 : 4, pointerStick, 'ptr4'))
    pixels.push(px(18, pointY > 7 ? 4 : 3, '#e53935', 'ptip'))
    if (presentPhase === 'draw') {
      const drawFrame = frame % 6
      pixels.push(px(16, 8, '#1e88e5', 'dr1'))
      if (drawFrame >= 2) pixels.push(px(17, 8, '#1e88e5', 'dr2'), px(18, 8, '#1e88e5', 'dr3'))
      if (drawFrame >= 4) pixels.push(px(16, 9, '#e53935', 'dr4'), px(17, 9, '#e53935', 'dr5'))
    }
  }

  // ── Coffee break ──
  if (state === 'coffee') {
    if (coffeePhase === 'sip-1' || coffeePhase === 'sip-2') {
      const sipBob = coffeePhase === 'sip-2' ? 1 : 0
      pixels.push(px(14, 5 + sipBob, coffeeCup, 'cup1'), px(15, 5 + sipBob, coffeeCup, 'cup2'), px(16, 5 + sipBob, coffeeCup, 'cup3'))
      pixels.push(px(14, 6 + sipBob, coffeeCup, 'cup4'), px(15, 6 + sipBob, coffeeLiquid, 'cup5'), px(16, 6 + sipBob, coffeeCup, 'cup6'))
      if (frame % 4 < 2) {
        pixels.push(px(15, 3 + sipBob, '#c8c0b4', 'stm1'), px(14, 2 + sipBob, '#c8c0b4', 'stm2'))
      }
    } else if (coffeePhase === 'pour') {
      pixels.push(px(15, 9, coffeeCup, 'cup1'), px(16, 9, coffeeCup, 'cup2'), px(17, 9, coffeeCup, 'cup3'))
      pixels.push(px(15, 10, coffeeCup, 'cup4'), px(16, 10, coffeeLiquid, 'cup5'), px(17, 10, coffeeCup, 'cup6'))
      if (frame % 2 === 0) pixels.push(px(16, 8, '#4fc3f7', 'wtr1'), px(16, 7, '#4fc3f7', 'wtr2'))
    }
  }

  // ── Legs (4 pairs) ──
  const legRow = bodyEnd + 1
  if (state === 'walking') {
    const offset = legPhase < 2 ? 0 : 1
    pixels.push(px(4 - offset, legRow, shellDark, 'l1a'), px(4 - offset, legRow + 1, legTip, 'l1b'))
    pixels.push(px(5 + offset, legRow, shellDark, 'l2a'), px(5 + offset, legRow + 1, legTip, 'l2b'))
    pixels.push(px(10 + offset, legRow, shellDark, 'l3a'), px(10 + offset, legRow + 1, legTip, 'l3b'))
    pixels.push(px(11 - offset, legRow, shellDark, 'l4a'), px(11 - offset, legRow + 1, legTip, 'l4b'))
  } else if (state === 'coding' || state === 'writing' || state === 'phone') {
    pixels.push(px(3, legRow, shellDark, 'l1a'), px(5, legRow, shellDark, 'l2a'))
    pixels.push(px(10, legRow, shellDark, 'l3a'), px(12, legRow, shellDark, 'l4a'))
  } else if (state === 'calling') {
    const callLeg = frame % 2
    pixels.push(px(4 - callLeg, legRow, shellDark, 'l1a'), px(4 - callLeg, legRow + 1, legTip, 'l1b'))
    pixels.push(px(6 + callLeg, legRow, shellDark, 'l2a'), px(6 + callLeg, legRow + 1, legTip, 'l2b'))
    pixels.push(px(9 + callLeg, legRow, shellDark, 'l3a'), px(9 + callLeg, legRow + 1, legTip, 'l3b'))
    pixels.push(px(11 - callLeg, legRow, shellDark, 'l4a'), px(11 - callLeg, legRow + 1, legTip, 'l4b'))
  } else if (state === 'karate') {
    if (karatePhase === 'kick') {
      // One leg kicks out to the right
      pixels.push(px(4, legRow, shellDark, 'l1a'), px(4, legRow + 1, legTip, 'l1b'))
      pixels.push(px(6, legRow, shellDark, 'l2a'), px(6, legRow + 1, legTip, 'l2b'))
      // Kick leg extended
      pixels.push(px(11, legRow, shellDark, 'l3a'), px(12, legRow, shellDark, 'l3b'))
      pixels.push(px(13, legRow, shellDark, 'l3c'), px(14, legRow, legTip, 'l3d'))
      // Impact
      if (frame % 2 === 0) {
        pixels.push(px(15, legRow - 1, impactStar, 'ki1'), px(15, legRow + 1, impactStar, 'ki2'))
      }
    } else if (karatePhase === 'spin') {
      // Legs tucked during spin
      const spinF = frame % 4
      if (spinF < 2) {
        pixels.push(px(5, legRow, shellDark, 'l1a'), px(10, legRow, shellDark, 'l3a'))
      } else {
        pixels.push(px(6, legRow, shellDark, 'l1a'), px(9, legRow, shellDark, 'l3a'))
      }
    } else if (karatePhase === 'bow') {
      // Legs together, standing straight
      pixels.push(px(5, legRow, shellDark, 'l1a'), px(6, legRow, shellDark, 'l2a'))
      pixels.push(px(9, legRow, shellDark, 'l3a'), px(10, legRow, shellDark, 'l4a'))
    } else {
      // Ready / punch — wide stance
      pixels.push(px(3, legRow, shellDark, 'l1a'), px(3, legRow + 1, legTip, 'l1b'))
      pixels.push(px(5, legRow, shellDark, 'l2a'), px(5, legRow + 1, legTip, 'l2b'))
      pixels.push(px(10, legRow, shellDark, 'l3a'), px(10, legRow + 1, legTip, 'l3b'))
      pixels.push(px(12, legRow, shellDark, 'l4a'), px(12, legRow + 1, legTip, 'l4b'))
    }
  } else {
    // Idle — legs down with white tips
    pixels.push(px(4, legRow, shellDark, 'l1a'), px(4, legRow + 1, legTip, 'l1b'))
    pixels.push(px(6, legRow, shellDark, 'l2a'), px(6, legRow + 1, legTip, 'l2b'))
    pixels.push(px(9, legRow, shellDark, 'l3a'), px(9, legRow + 1, legTip, 'l3b'))
    pixels.push(px(11, legRow, shellDark, 'l4a'), px(11, legRow + 1, legTip, 'l4b'))
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ imageRendering: 'pixelated' }}>
      {pixels}
    </svg>
  )
}

// Mini static Claw'd — for chat avatars and FAB
function MiniClawd({ size = 24 }: { size?: number }) {
  const s = size / 12
  const px = (x: number, y: number, c: string) => (
    <rect key={`${x}-${y}`} x={x * s} y={y * s} width={s} height={s} fill={c} />
  )
  const sh = '#e8735a', sd = '#c4573f', sl = '#f2a08a', ey = '#1a1a1a', ew = '#fff', an = '#c4573f'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ imageRendering: 'pixelated', display: 'block' }}>
      {px(3, 0, an)}{px(8, 0, an)}{px(4, 1, an)}{px(7, 1, an)}
      {px(4, 2, sh)}{px(5, 2, sh)}{px(6, 2, sh)}{px(7, 2, sh)}
      {px(3, 3, sh)}{px(4, 3, sh)}{px(5, 3, sh)}{px(6, 3, sh)}{px(7, 3, sh)}{px(8, 3, sh)}
      {px(3, 4, sd)}{px(4, 4, ew)}{px(5, 4, ey)}{px(6, 4, ey)}{px(7, 4, ew)}{px(8, 4, sd)}
      {px(3, 5, sh)}{px(4, 5, sh)}{px(5, 5, sd)}{px(6, 5, sd)}{px(7, 5, sh)}{px(8, 5, sh)}
      {px(2, 6, sd)}{px(3, 6, sh)}{px(4, 6, sh)}{px(5, 6, sl)}{px(6, 6, sl)}{px(7, 6, sh)}{px(8, 6, sh)}{px(9, 6, sd)}
      {px(2, 7, sd)}{px(3, 7, sh)}{px(4, 7, sl)}{px(5, 7, sl)}{px(6, 7, sl)}{px(7, 7, sl)}{px(8, 7, sh)}{px(9, 7, sd)}
      {px(0, 5, sh)}{px(1, 5, sh)}{px(1, 4, sh)}{px(10, 5, sh)}{px(11, 5, sh)}{px(10, 4, sh)}
      {px(3, 8, sd)}{px(5, 8, sd)}{px(6, 8, sd)}{px(8, 8, sd)}
      {px(3, 9, ew)}{px(5, 9, ew)}{px(6, 9, ew)}{px(8, 9, ew)}
    </svg>
  )
}

// Speech bubbles that appear occasionally
const THOUGHTS: Record<string, string[]> = {
  coding: ['</>', '{…}', 'fn()', '$ _', '0x1', '>>>'],
  writing: ['hmm', '✏️', 'note', 'idea!', 'draft', '📝'],
  karate: ['HYA!', 'KIA!', '🥋', 'HAH!', 'OSS!', '👊'],
  phone: ['mhm', 'yes', 'ok!', 'got it', 'right', '📞'],
  presenting: ['so...', 'next!', 'here!', '📊', 'tada!', '→'],
  coffee: ['☕', 'aahh', 'sip~', 'nice', 'refuel', '☕'],
  calling: ['hey!', 'hello?', 'hi hi!', 'psst!', 'cmdr!', 'yo!'],
  thinking: ['hmm...', '🤔', 'let me think...', '...', 'processing...', '💭', 'wait...', 'uhh...', '🧠'],
  replying: ['bip bup!', 'bzzt!', 'beep boop!', 'whirr~', 'click click!', 'brrrr!', 'zap zap!', 'pip pip!', 'bzzp!', 'woop!', '⚡', '🤖'],
  default: ['☕', '🎵', '👀', '🦀'],
}

// Karate combo sequence — each phase with its duration in ms
const KARATE_SEQUENCE: { phase: KaratePhase; duration: number }[] = [
  { phase: 'ready', duration: 800 },
  { phase: 'punch-l', duration: 500 },
  { phase: 'ready', duration: 400 },
  { phase: 'punch-r', duration: 500 },
  { phase: 'ready', duration: 400 },
  { phase: 'kick', duration: 700 },
  { phase: 'ready', duration: 300 },
  { phase: 'spin', duration: 900 },
  { phase: 'ready', duration: 300 },
  { phase: 'punch-l', duration: 400 },
  { phase: 'punch-r', duration: 400 },
  { phase: 'chop', duration: 800 },
  { phase: 'ready', duration: 500 },
  { phase: 'kick', duration: 700 },
  { phase: 'spin', duration: 900 },
  { phase: 'chop', duration: 600 },
  { phase: 'bow', duration: 1200 },
]

const PRESENT_SEQUENCE: { phase: PresentPhase; duration: number }[] = [
  { phase: 'walk', duration: 1200 }, { phase: 'point-1', duration: 1000 }, { phase: 'point-2', duration: 1000 },
  { phase: 'point-3', duration: 1000 }, { phase: 'draw', duration: 2000 }, { phase: 'point-1', duration: 800 }, { phase: 'done', duration: 600 },
]

const COFFEE_SEQUENCE: { phase: CoffeePhase; duration: number }[] = [
  { phase: 'walk', duration: 1500 }, { phase: 'pour', duration: 1200 },
  { phase: 'sip-1', duration: 1000 }, { phase: 'sip-2', duration: 800 },
  { phase: 'sip-1', duration: 1000 }, { phase: 'sip-2', duration: 800 }, { phase: 'done', duration: 500 },
]

const CALLING_SEQUENCE: { phase: CallingPhase; duration: number }[] = [
  { phase: 'wave-1', duration: 1000 }, { phase: 'jump', duration: 600 }, { phase: 'wave-2', duration: 1200 },
  { phase: 'jump-2', duration: 600 }, { phase: 'wave-3', duration: 1500 }, { phase: 'jump', duration: 500 },
  { phase: 'wave-1', duration: 1000 }, { phase: 'jump-2', duration: 500 }, { phase: 'wave-3', duration: 800 },
]

// Office background — pixel art scene
export function OfficeBackground() {
  return (
    <svg className="adm-office-bg" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice">
      {/* Wall — light gray office wall */}
      <rect width="600" height="250" fill="#f0ede8" />
      {/* Baseboard */}
      <rect x="0" y="188" width="600" height="6" fill="#c8c0b4" />

      {/* Floor — gray carpet tiles */}
      <rect x="0" y="194" width="600" height="56" fill="#d8d2c8" />
      <line x1="0" y1="220" x2="600" y2="220" stroke="#cec8bc" strokeWidth="0.4" />
      {[0, 75, 150, 225, 300, 375, 450, 525].map((lx) => (
        <line key={lx} x1={lx} y1="194" x2={lx} y2="250" stroke="#cec8bc" strokeWidth="0.4" />
      ))}

      {/* === LEFT: Desk with monitor === */}
      {/* Desk surface */}
      <rect x="20" y="140" width="160" height="6" rx="1" fill="#a08868" />
      {/* Desk legs */}
      <rect x="25" y="146" width="4" height="48" fill="#8a7458" />
      <rect x="171" y="146" width="4" height="48" fill="#8a7458" />
      {/* Desk panel */}
      <rect x="25" y="146" width="150" height="3" fill="#9a8268" />
      {/* Keyboard tray */}
      <rect x="50" y="152" width="80" height="2" fill="#8a7458" />

      {/* Monitor */}
      <rect x="60" y="85" width="70" height="50" rx="3" fill="#2a2a2a" />
      <rect x="64" y="89" width="62" height="42" rx="1" fill="#1a2a3a" />
      {/* Screen content — code editor look */}
      <rect x="66" y="92" width="14" height="2" rx="1" fill="#4fc3f7" opacity="0.7" />
      <rect x="82" y="92" width="20" height="2" rx="1" fill="#81c784" opacity="0.6" />
      <rect x="70" y="97" width="22" height="2" rx="1" fill="#ce93d8" opacity="0.5" />
      <rect x="66" y="102" width="30" height="2" rx="1" fill="#4fc3f7" opacity="0.6" />
      <rect x="70" y="107" width="18" height="2" rx="1" fill="#ffb74d" opacity="0.5" />
      <rect x="66" y="112" width="25" height="2" rx="1" fill="#81c784" opacity="0.6" />
      <rect x="70" y="117" width="12" height="2" rx="1" fill="#4fc3f7" opacity="0.5" />
      <rect x="66" y="122" width="28" height="2" rx="1" fill="#ce93d8" opacity="0.5" />
      {/* Monitor stand */}
      <rect x="88" y="135" width="14" height="5" fill="#2a2a2a" />
      <rect x="82" y="138" width="26" height="3" rx="1" fill="#3a3a3a" />

      {/* Keyboard */}
      <rect x="58" y="143" width="50" height="8" rx="2" fill="#d0d0d0" stroke="#b0b0b0" strokeWidth="0.5" />
      {/* Key rows */}
      {[0, 1, 2].map((row) => (
        [0, 1, 2, 3, 4, 5, 6, 7, 8].map((col) => (
          <rect key={`k${row}-${col}`} x={61 + col * 5} y={144.5 + row * 2.5} width="3.5" height="1.8" rx="0.3" fill="#e8e8e8" />
        ))
      ))}
      {/* Mouse */}
      <ellipse cx="120" cy="148" rx="5" ry="7" fill="#d0d0d0" stroke="#b0b0b0" strokeWidth="0.5" />

      {/* Coffee mug on desk */}
      <rect x="140" y="131" width="10" height="9" rx="2" fill="#ffffff" stroke="#b0b0b0" strokeWidth="0.8" />
      <path d="M150 133 Q153 133 153 136 Q153 139 150 139" fill="none" stroke="#b0b0b0" strokeWidth="0.8" />
      <path d="M143 129 Q145 126 143 123" fill="none" stroke="#c8c0b4" strokeWidth="0.6" strokeLinecap="round" opacity="0.5" />

      {/* Sticky notes on desk */}
      <rect x="30" y="131" width="14" height="12" fill="#fff176" rx="1" />
      <rect x="28" y="129" width="14" height="12" fill="#80deea" rx="1" transform="rotate(-5 35 135)" />
      <line x1="30" y1="133" x2="40" y2="133" stroke="#e0c850" strokeWidth="0.5" />
      <line x1="30" y1="136" x2="38" y2="136" stroke="#e0c850" strokeWidth="0.5" />

      {/* === CENTER: Whiteboard on wall === */}
      <rect x="220" y="20" width="150" height="100" rx="3" fill="#ffffff" stroke="#c0b8aa" strokeWidth="2" />
      {/* Whiteboard tray */}
      <rect x="225" y="118" width="140" height="4" rx="1" fill="#c0b8aa" />
      {/* Markers in tray */}
      <rect x="235" y="115" width="3" height="7" rx="1" fill="#e53935" />
      <rect x="241" y="115" width="3" height="7" rx="1" fill="#1e88e5" />
      <rect x="247" y="115" width="3" height="7" rx="1" fill="#2e7d32" />
      <rect x="253" y="115" width="3" height="7" rx="1" fill="#1a1a1a" />
      {/* Whiteboard content — sprint board style */}
      <line x1="290" y1="30" x2="290" y2="115" stroke="#e0dcd4" strokeWidth="0.8" />
      <line x1="340" y1="30" x2="340" y2="115" stroke="#e0dcd4" strokeWidth="0.8" />
      {/* Column headers */}
      <text x="255" y="38" fontSize="5" fill="#9a917f" fontFamily="inherit">TODO</text>
      <text x="302" y="38" fontSize="5" fill="#9a917f" fontFamily="inherit">DOING</text>
      <text x="352" y="38" fontSize="5" fill="#9a917f" fontFamily="inherit">DONE</text>
      {/* Sticky cards */}
      <rect x="235" y="44" width="45" height="14" rx="2" fill="#fff9c4" />
      <rect x="235" y="62" width="45" height="14" rx="2" fill="#fff9c4" />
      <rect x="235" y="80" width="45" height="14" rx="2" fill="#fff9c4" />
      <rect x="298" y="44" width="35" height="14" rx="2" fill="#bbdefb" />
      <rect x="298" y="62" width="35" height="14" rx="2" fill="#bbdefb" />
      <rect x="345" y="44" width="18" height="14" rx="2" fill="#c8e6c9" />
      <rect x="345" y="62" width="18" height="14" rx="2" fill="#c8e6c9" />
      <rect x="345" y="80" width="18" height="14" rx="2" fill="#c8e6c9" />
      <rect x="345" y="98" width="18" height="14" rx="2" fill="#c8e6c9" />
      {/* Tiny text on cards */}
      <line x1="239" y1="50" x2="270" y2="50" stroke="#d4c080" strokeWidth="1" />
      <line x1="239" y1="68" x2="265" y2="68" stroke="#d4c080" strokeWidth="1" />
      <line x1="302" y1="50" x2="325" y2="50" stroke="#90b8d8" strokeWidth="1" />

      {/* === RIGHT: Filing cabinet + water cooler === */}
      {/* Filing cabinet */}
      <rect x="440" y="100" width="50" height="94" rx="2" fill="#b0b0b0" stroke="#909090" strokeWidth="1" />
      {/* Drawers */}
      <rect x="444" y="105" width="42" height="20" rx="1" fill="#c0c0c0" stroke="#a0a0a0" strokeWidth="0.5" />
      <rect x="444" y="128" width="42" height="20" rx="1" fill="#c0c0c0" stroke="#a0a0a0" strokeWidth="0.5" />
      <rect x="444" y="151" width="42" height="20" rx="1" fill="#c0c0c0" stroke="#a0a0a0" strokeWidth="0.5" />
      <rect x="444" y="174" width="42" height="16" rx="1" fill="#c0c0c0" stroke="#a0a0a0" strokeWidth="0.5" />
      {/* Drawer handles */}
      <rect x="460" y="113" width="10" height="2" rx="1" fill="#888888" />
      <rect x="460" y="136" width="10" height="2" rx="1" fill="#888888" />
      <rect x="460" y="159" width="10" height="2" rx="1" fill="#888888" />
      <rect x="460" y="181" width="10" height="2" rx="1" fill="#888888" />
      {/* Label on top drawer */}
      <rect x="456" y="108" width="18" height="5" rx="1" fill="#ffffff" stroke="#c0c0c0" strokeWidth="0.3" />

      {/* Water cooler */}
      <rect x="520" y="120" width="30" height="74" rx="3" fill="#e0e0e0" stroke="#c0c0c0" strokeWidth="1" />
      {/* Water jug */}
      <rect x="525" y="98" width="20" height="24" rx="3" fill="#d4eef7" stroke="#a0c8e0" strokeWidth="0.8" />
      <ellipse cx="535" cy="98" rx="10" ry="3" fill="#c0dce8" />
      {/* Water level */}
      <rect x="527" y="105" width="16" height="14" rx="2" fill="#b0d8f0" opacity="0.5" />
      {/* Taps */}
      <rect x="526" y="136" width="8" height="4" rx="1" fill="#4fc3f7" />
      <rect x="536" y="136" width="8" height="4" rx="1" fill="#ef5350" />
      {/* Drip tray */}
      <rect x="524" y="165" width="22" height="3" rx="1" fill="#c8c8c8" />

      {/* Potted plant on filing cabinet */}
      <rect x="450" y="88" width="16" height="12" rx="3" fill="#5a5a5a" />
      <ellipse cx="458" cy="84" rx="10" ry="8" fill="#4caf50" />
      <ellipse cx="454" cy="80" rx="6" ry="6" fill="#66bb6a" />
      <ellipse cx="463" cy="81" rx="6" ry="5" fill="#43a047" />

      {/* Wall clock */}
      <circle cx="420" cy="45" r="16" fill="#ffffff" stroke="#c0b8aa" strokeWidth="1.5" />
      <circle cx="420" cy="45" r="13" fill="#fafafa" />
      {/* Hour markers */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <line
          key={deg}
          x1={420 + 11 * Math.cos((deg - 90) * Math.PI / 180)}
          y1={45 + 11 * Math.sin((deg - 90) * Math.PI / 180)}
          x2={420 + 13 * Math.cos((deg - 90) * Math.PI / 180)}
          y2={45 + 13 * Math.sin((deg - 90) * Math.PI / 180)}
          stroke="#909090" strokeWidth="0.8"
        />
      ))}
      <line x1="420" y1="45" x2="420" y2="36" stroke="#3b3225" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="420" y1="45" x2="427" y2="43" stroke="#3b3225" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="420" cy="45" r="1.2" fill="#b4762c" />

      {/* Ceiling light */}
      <rect x="250" y="0" width="100" height="4" fill="#e0dcd4" />
      <rect x="260" y="4" width="80" height="6" rx="1" fill="#f5f5f5" stroke="#d0d0d0" strokeWidth="0.5" />
      <rect x="265" y="5" width="70" height="4" rx="1" fill="#fffde7" opacity="0.6" />
    </svg>
  )
}

interface ChatMessage {
  id: number
  role: 'user' | 'clawd'
  text: string
}

// Simple markdown parser for chat bubbles
function ChatMarkdown({ text }: { text: string }) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const Tag = listType
      elements.push(
        <Tag key={`list-${elements.length}`}>
          {listItems.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
        </Tag>
      )
      listItems = []
      listType = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Unordered list
    if (/^[-*]\s+/.test(line)) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(line.replace(/^[-*]\s+/, ''))
      continue
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(line.replace(/^\d+\.\s+/, ''))
      continue
    }

    flushList()

    // Code block (```)
    if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(<pre key={`code-${elements.length}`}><code>{codeLines.join('\n')}</code></pre>)
      continue
    }

    // Empty line
    if (!line.trim()) continue

    // Regular paragraph
    elements.push(<p key={`p-${elements.length}`}>{parseInline(line)}</p>)
  }

  flushList()
  return <>{elements}</>
}

// Parse inline markdown: **bold**, `code`, *italic*
function parseInline(text: string): (string | JSX.Element)[] {
  const parts: (string | JSX.Element)[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // Code: `...`
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)
    if (codeMatch) {
      if (codeMatch[1]) parts.push(...parseInline(codeMatch[1]))
      parts.push(<code key={`c${keyIdx++}`}>{codeMatch[2]}</code>)
      remaining = codeMatch[3]
      continue
    }

    // Bold: **...**
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/)
    if (boldMatch) {
      if (boldMatch[1]) parts.push(boldMatch[1])
      parts.push(<strong key={`b${keyIdx++}`}>{boldMatch[2]}</strong>)
      remaining = boldMatch[3]
      continue
    }

    parts.push(remaining)
    break
  }

  return parts
}

export default function DashboardMascot() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [x, setX] = useState(50) // percentage position
  const [targetX, setTargetX] = useState(50)
  const [flipped, setFlipped] = useState(false)
  const [mascotState, setMascotState] = useState<MascotState>('idle')
  const [frame, setFrame] = useState(0)
  const [thought, setThought] = useState<string | null>(null)
  const [karatePhase, setKaratePhase] = useState<KaratePhase>('ready')
  const [presentPhase, setPresentPhase] = useState<PresentPhase>('walk')
  const [coffeePhase, setCoffeePhase] = useState<CoffeePhase>('walk')
  const [callingPhase, setCallingPhase] = useState<CallingPhase>('wave-1')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const karateRef = useRef<NodeJS.Timeout | null>(null)
  const seqRef = useRef<NodeJS.Timeout | null>(null)
  const thinkingRef = useRef<NodeJS.Timeout | null>(null)
  const replyBubbleRef = useRef<NodeJS.Timeout | null>(null)

  // Mascot settings from DB
  const [mascotType, setMascotType] = useState('clawd')
  const [bgType, setBgType] = useState('office')
  const [displayName, setDisplayName] = useState("Claw'd")

  useEffect(() => {
    fetch('/api/admin/mascot')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (data.mascotType) setMascotType(data.mascotType)
          if (data.background) setBgType(data.background)
          if (data.displayName) setDisplayName(data.displayName)
        }
      })
      .catch(console.error)
  }, [])

  // Chat state
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [{ id: 0, role: 'clawd', text: "Hey! I'm Claw'd 🦀 What's up?" }]
    try {
      const saved = localStorage.getItem('mascot-chat-history')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        if (parsed.length > 0) return parsed
      }
    } catch { /* ignore */ }
    return [{ id: 0, role: 'clawd', text: "Hey! I'm Claw'd 🦀 What's up?" }]
  })
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const msgIdRef = useRef((() => {
    if (typeof window === 'undefined') return 1
    try {
      const saved = localStorage.getItem('mascot-chat-history')
      if (saved) {
        const parsed = JSON.parse(saved) as ChatMessage[]
        return Math.max(...parsed.map(m => m.id), 0) + 1
      }
    } catch { /* ignore */ }
    return 1
  })())

  // Persist chat history to localStorage
  useEffect(() => {
    localStorage.setItem('mascot-chat-history', JSON.stringify(messages))
  }, [messages])

  const clearChat = useCallback(() => {
    const greeting: ChatMessage = { id: 0, role: 'clawd', text: `Hey! I'm ${displayName} 🦀 What's up?` }
    setMessages([greeting])
    msgIdRef.current = 1
    localStorage.removeItem('mascot-chat-history')
  }, [displayName])

  // Start mascot "thinking" mode — idle with cycling thought bubbles
  const startThinking = useCallback(() => {
    setMascotState('idle')
    const cycle = () => {
      const pool = THOUGHTS.thinking
      setThought(pool[Math.floor(Math.random() * pool.length)])
      thinkingRef.current = setTimeout(() => {
        setThought(null)
        thinkingRef.current = setTimeout(cycle, 400 + Math.random() * 300)
      }, 1200 + Math.random() * 800)
    }
    cycle()
  }, [])

  const stopThinking = useCallback(() => {
    if (thinkingRef.current) clearTimeout(thinkingRef.current)
    setThought(null)
  }, [])

  // Show robot babble bubbles while streaming response
  const startReplyBubbles = useCallback(() => {
    setMascotState('coding')
    let count = 0
    const cycle = () => {
      if (count >= 6) { // max 6 bubbles then stop
        setThought(null)
        return
      }
      const pool = THOUGHTS.replying
      setThought(pool[Math.floor(Math.random() * pool.length)])
      count++
      replyBubbleRef.current = setTimeout(() => {
        setThought(null)
        replyBubbleRef.current = setTimeout(cycle, 300 + Math.random() * 400)
      }, 800 + Math.random() * 600)
    }
    cycle()
  }, [])

  const stopReplyBubbles = useCallback(() => {
    if (replyBubbleRef.current) clearTimeout(replyBubbleRef.current)
    setThought(null)
  }, [])

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Send message to OpenClaw API with SSE streaming
  const handleSend = useCallback(async () => {
    const text = chatInput.trim()
    if (!text) return
    const userMsg: ChatMessage = { id: msgIdRef.current++, role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setChatInput('')
    setIsTyping(true)

    // Mascot enters thinking mode
    startThinking()

    // Build message history for API (exclude the initial greeting)
    const apiMessages = [...messages.filter(m => m.role === 'user' || m.role === 'clawd').map(m => ({
      role: m.role === 'user' ? 'user' as const : 'assistant' as const,
      content: m.text,
    })), { role: 'user' as const, content: text }]

    try {
      const res = await fetch('/api/admin/mascot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Connection failed' }))
        setMessages((prev) => [...prev, {
          id: msgIdRef.current++, role: 'clawd',
          text: `⚠️ ${err.error || 'Failed to connect to OpenClaw'}`,
        }])
        setIsTyping(false)
        stopThinking()
        return
      }

      // Parse SSE stream
      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const replyId = msgIdRef.current++
      setMessages((prev) => [...prev, { id: replyId, role: 'clawd', text: '' }])
      setIsTyping(false)

      // Switch from thinking to replying mode — robot babble!
      stopThinking()
      startReplyBubbles()

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              setMessages((prev) => prev.map(m =>
                m.id === replyId ? { ...m, text: m.text + delta } : m
              ))
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      // Done streaming — back to normal
      stopReplyBubbles()
    } catch {
      setMessages((prev) => [...prev, {
        id: msgIdRef.current++, role: 'clawd',
        text: '⚠️ Failed to connect to OpenClaw gateway',
      }])
      setIsTyping(false)
      stopThinking()
      stopReplyBubbles()
    }
  }, [chatInput, messages, startThinking, stopThinking, startReplyBubbles, stopReplyBubbles])

  // Animation frame ticker
  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => f + 1), 200)
    return () => clearInterval(interval)
  }, [])

  // Show a thought bubble for a given action
  const showThought = useCallback((action: MascotState) => {
    const pool = THOUGHTS[action] || THOUGHTS.default
    const bubble = pool[Math.floor(Math.random() * pool.length)]
    setThought(bubble)
    setTimeout(() => setThought(null), 1800)
  }, [])

  // Run the full karate combo sequence
  const runKarateSequence = useCallback((onDone: () => void) => {
    let i = 0
    function nextPhase() {
      if (i >= KARATE_SEQUENCE.length) {
        onDone()
        return
      }
      const step = KARATE_SEQUENCE[i]
      setKaratePhase(step.phase)
      // Show thought on action phases
      if (step.phase === 'punch-l' || step.phase === 'punch-r' || step.phase === 'kick' || step.phase === 'chop') {
        const pool = THOUGHTS.karate
        setThought(pool[Math.floor(Math.random() * pool.length)])
        setTimeout(() => setThought(null), step.duration - 100)
      }
      i++
      karateRef.current = setTimeout(nextPhase, step.duration)
    }
    nextPhase()
  }, [])

  // Generic sequence runner
  const runSequence = useCallback(<T,>(
    sequence: { phase: T; duration: number }[], setter: (phase: T) => void, thoughtKey: string, onDone: () => void
  ) => {
    let i = 0
    function nextPhase() {
      if (i >= sequence.length) { onDone(); return }
      const step = sequence[i]
      setter(step.phase)
      if (i % 2 === 0) {
        const pool = THOUGHTS[thoughtKey] || THOUGHTS.default
        setThought(pool[Math.floor(Math.random() * pool.length)])
        setTimeout(() => setThought(null), Math.min(step.duration - 100, 1500))
      }
      i++
      seqRef.current = setTimeout(nextPhase, step.duration)
    }
    nextPhase()
  }, [])

  // Random behavior loop
  const pickAction = useCallback(() => {
    const actions: MascotState[] = ['idle', 'walking', 'coding', 'writing', 'karate', 'phone', 'presenting', 'coffee', 'calling']
    const weights = [10, 18, 20, 12, 12, 10, 6, 6, 6]
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    let action: MascotState = 'idle'
    for (let i = 0; i < actions.length; i++) {
      r -= weights[i]
      if (r <= 0) { action = actions[i]; break }
    }

    setMascotState(action)

    if (action === 'walking') {
      const newTarget = Math.random() * 80 + 10
      setTargetX(newTarget)
      setFlipped(newTarget < x)
    } else if (action === 'coding') {
      showThought('coding')
      setFlipped(false)
    } else if (action === 'writing') {
      showThought('writing')
      setFlipped(false)
    } else if (action === 'phone') {
      showThought('phone')
      setFlipped(false)
    } else if (action === 'karate') {
      setFlipped(false)
      runKarateSequence(() => { timeoutRef.current = setTimeout(pickAction, 500) })
      return
    } else if (action === 'presenting') {
      setFlipped(false)
      runSequence(PRESENT_SEQUENCE, setPresentPhase, 'presenting', () => { timeoutRef.current = setTimeout(pickAction, 500) })
      return
    } else if (action === 'coffee') {
      setFlipped(false)
      runSequence(COFFEE_SEQUENCE, setCoffeePhase, 'coffee', () => { timeoutRef.current = setTimeout(pickAction, 500) })
      return
    } else if (action === 'calling') {
      setFlipped(false)
      runSequence(CALLING_SEQUENCE, setCallingPhase, 'calling', () => { timeoutRef.current = setTimeout(pickAction, 500) })
      return
    }

    const duration = action === 'walking' ? 2000 + Math.random() * 3000
      : action === 'coding' ? 4000 + Math.random() * 5000
      : action === 'writing' ? 4000 + Math.random() * 4000
      : action === 'phone' ? 3000 + Math.random() * 4000
      : 1500 + Math.random() * 2500

    timeoutRef.current = setTimeout(pickAction, duration)
  }, [x, showThought, runKarateSequence, runSequence])

  useEffect(() => {
    timeoutRef.current = setTimeout(pickAction, 1000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (karateRef.current) clearTimeout(karateRef.current)
      if (seqRef.current) clearTimeout(seqRef.current)
      if (thinkingRef.current) clearTimeout(thinkingRef.current)
      if (replyBubbleRef.current) clearTimeout(replyBubbleRef.current)
    }
  }, [pickAction])

  // Smooth movement
  useEffect(() => {
    if (mascotState !== 'walking') return
    const interval = setInterval(() => {
      setX((prev) => {
        const diff = targetX - prev
        if (Math.abs(diff) < 0.5) {
          setMascotState('idle')
          return targetX
        }
        const step = Math.sign(diff) * Math.min(Math.abs(diff), 0.8)
        setFlipped(diff < 0)
        return prev + step
      })
    }, 30)
    return () => clearInterval(interval)
  }, [mascotState, targetX])

  return (
    <>
      {/* Mascot roaming area with office background */}
      <div
        ref={containerRef}
        className="adm-mascot-area"
      >
        {bgType === 'space' ? <SpaceBackground /> : bgType === 'garden' ? <GardenBackground /> : <OfficeBackground />}
        <div
          className="adm-mascot"
          style={{
            left: `${x}%`,
            transform: `translateX(-50%) scaleX(${flipped ? -1 : 1})`,
          }}
        >
          {thought && (
            <div className="adm-mascot-thought">
              {thought}
            </div>
          )}
          <div className={`adm-mascot-sprite adm-mascot-sprite--${mascotState}`}>
            {mascotType === 'byte' ? (
              <ByteSprite state={mascotState} frame={frame} karatePhase={karatePhase} presentPhase={presentPhase} coffeePhase={coffeePhase} callingPhase={callingPhase} />
            ) : mascotType === 'neko' ? (
              <NekoSprite state={mascotState} frame={frame} karatePhase={karatePhase} presentPhase={presentPhase} coffeePhase={coffeePhase} callingPhase={callingPhase} />
            ) : (
              <PixelSprite state={mascotState} frame={frame} karatePhase={karatePhase} presentPhase={presentPhase} coffeePhase={coffeePhase} callingPhase={callingPhase} />
            )}
          </div>
          <div className="adm-mascot-shadow" />
        </div>
      </div>

      {/* Fixed chat widget — bottom right */}
      <div className="adm-chat-widget">
        {/* Toggle FAB */}
        {!chatOpen && (
          <button className="adm-chat-fab" onClick={() => setChatOpen(true)}>
            <span className="adm-chat-fab-emoji"><MiniClawd size={28} /></span>
          </button>
        )}

        {/* Chat panel */}
        {chatOpen && (
          <div className="adm-chat">
            <div className="adm-chat-header">
              <div className="adm-chat-header-info">
                <span className="adm-chat-avatar"><MiniClawd size={22} /></span>
                <div>
                  <span className="adm-chat-name">{displayName}</span>
                  <span className="adm-chat-status">
                    <span className="adm-chat-status-dot" />
                    Online
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button className="adm-chat-clear" onClick={clearChat} title="Clear chat">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 4h12M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button className="adm-chat-close" onClick={() => setChatOpen(false)}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="adm-chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`adm-chat-msg adm-chat-msg--${msg.role}`}>
                  {msg.role === 'clawd' && <span className="adm-chat-msg-avatar"><MiniClawd size={18} /></span>}
                  <div className={`adm-chat-bubble adm-chat-bubble--${msg.role}`}>
                    <ChatMarkdown text={msg.text} />
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="adm-chat-msg adm-chat-msg--clawd">
                  <span className="adm-chat-msg-avatar"><MiniClawd size={18} /></span>
                  <div className="adm-chat-bubble adm-chat-bubble--clawd adm-chat-typing">
                    <span className="adm-chat-dot" />
                    <span className="adm-chat-dot" />
                    <span className="adm-chat-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form
              className="adm-chat-input-wrap"
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
            >
              <input
                className="adm-chat-input"
                type="text"
                placeholder="Say something to Claw'd..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                autoFocus
              />
              <button
                type="submit"
                className="adm-chat-send"
                disabled={!chatInput.trim()}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2L7 9M14 2l-5 12-2-5-5-2 12-5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
