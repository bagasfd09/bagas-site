'use client'

/* ── Additional Mascot Pixel Sprites ──────────────────────────
   Byte (Robot), Kitsune (Fox), Neko (Cat)
   Same interface as PixelSprite from DashboardMascot.tsx
   ──────────────────────────────────────────────────────────── */

type MascotState = 'idle' | 'walking' | 'coding' | 'writing' | 'karate' | 'phone' | 'presenting' | 'coffee' | 'calling'
type KaratePhase = 'ready' | 'punch-l' | 'punch-r' | 'kick' | 'spin' | 'chop' | 'bow'
type PresentPhase = 'walk' | 'point-1' | 'point-2' | 'point-3' | 'draw' | 'done'
type CoffeePhase = 'walk' | 'pour' | 'sip-1' | 'sip-2' | 'done'
type CallingPhase = 'wave-1' | 'jump' | 'wave-2' | 'jump-2' | 'wave-3'

interface SpriteProps {
  state: MascotState
  frame: number
  karatePhase: KaratePhase
  presentPhase: PresentPhase
  coffeePhase: CoffeePhase
  callingPhase: CallingPhase
}

// ─── BYTE — Pixel Robot ──────────────────────────────────────
export function ByteSprite({ state, frame, karatePhase, callingPhase }: SpriteProps) {
  const s = 5
  const needsWide = state === 'coding' || state === 'writing' || state === 'phone' || state === 'presenting' || state === 'coffee'
  const gridW = needsWide ? 22 : 16
  const gridH = 16
  const w = gridW * s
  const h = gridH * s

  const body = '#4a90d9'
  const bodyDark = '#3670b0'
  const bodyLight = '#6aade8'
  const screen = '#1a1a2e'
  const screenGlow = '#4fc3f7'
  const screenGreen = '#81c784'
  const antenna = '#ffcc02'
  const eye = '#4fc3f7'
  const arm = '#3670b0'
  const legColor = '#3670b0'
  const bolt = '#ffcc02'

  const legPhase = state === 'walking' ? (frame % 4) : 0
  const bounce = (state === 'karate' && (karatePhase === 'kick' || karatePhase === 'spin'))
    ? (frame % 2 === 0 ? -2 : 0)
    : (state === 'calling' && (callingPhase === 'jump' || callingPhase === 'jump-2'))
    ? (frame % 2 === 0 ? -3 : 0) : 0
  const blink = state === 'idle' && frame % 10 === 0
  const armWave = frame % 6 < 3

  const px = (x: number, y: number, color: string, key?: string) => (
    <rect key={key || `${x}-${y}`} x={x * s} y={(y + bounce) * s} width={s} height={s} fill={color} />
  )

  const pixels: JSX.Element[] = []

  // Antenna
  pixels.push(px(7, 0, antenna, 'ant1'))
  pixels.push(px(8, 0, antenna, 'ant2'))
  pixels.push(px(7, 1, antenna, 'ant3'))
  pixels.push(px(8, 1, antenna, 'ant4'))

  // Head (boxy robot head) — rows 2-7
  for (let x = 4; x <= 11; x++) {
    pixels.push(px(x, 2, bodyDark, `ht-${x}`))
    pixels.push(px(x, 7, bodyDark, `hb-${x}`))
  }
  for (let y = 3; y <= 6; y++) {
    pixels.push(px(4, y, bodyDark, `hl-${y}`))
    pixels.push(px(11, y, bodyDark, `hr-${y}`))
  }
  // Face screen
  for (let x = 5; x <= 10; x++) {
    for (let y = 3; y <= 6; y++) {
      pixels.push(px(x, y, screen, `face-${x}-${y}`))
    }
  }
  // Eyes (LED dots)
  if (!blink) {
    pixels.push(px(6, 4, eye, 'eye-l'))
    pixels.push(px(7, 4, eye, 'eye-l2'))
    pixels.push(px(9, 4, eye, 'eye-r'))
    pixels.push(px(8, 4, eye, 'eye-r2'))
  }
  // Mouth (LED bar)
  pixels.push(px(6, 6, screenGlow, 'mouth1'))
  pixels.push(px(7, 6, screenGlow, 'mouth2'))
  pixels.push(px(8, 6, screenGlow, 'mouth3'))
  pixels.push(px(9, 6, screenGlow, 'mouth4'))

  // Body — rows 8-11
  for (let x = 5; x <= 10; x++) {
    pixels.push(px(x, 8, body, `body-t-${x}`))
    pixels.push(px(x, 11, bodyDark, `body-b-${x}`))
  }
  for (let y = 9; y <= 10; y++) {
    pixels.push(px(5, y, body, `bl-${y}`))
    pixels.push(px(10, y, body, `br-${y}`))
    for (let x = 6; x <= 9; x++) {
      pixels.push(px(x, y, bodyLight, `bc-${x}-${y}`))
    }
  }
  // Chest bolt
  pixels.push(px(7, 9, bolt, 'bolt1'))
  pixels.push(px(8, 9, bolt, 'bolt2'))
  pixels.push(px(7, 10, bolt, 'bolt3'))
  pixels.push(px(8, 10, bolt, 'bolt4'))

  // Arms
  if (state === 'coding') {
    // Arms on laptop
    pixels.push(px(4, 9, arm, 'arm-l1'))
    pixels.push(px(3, 9, arm, 'arm-l2'))
    pixels.push(px(11, 9, arm, 'arm-r1'))
    pixels.push(px(12, 9, arm, 'arm-r2'))
    // Laptop
    for (let x = 13; x <= 18; x++) {
      pixels.push(px(x, 10, '#555', `lap-${x}`))
      pixels.push(px(x, 11, '#444', `lapb-${x}`))
    }
    for (let x = 13; x <= 18; x++) {
      pixels.push(px(x, 8, '#555', `laps-${x}`))
      pixels.push(px(x, 9, screen, `lapsc-${x}`))
    }
    pixels.push(px(14, 9, screenGlow, 'code1'))
    pixels.push(px(15, 9, screenGreen, 'code2'))
    pixels.push(px(16, 9, screenGlow, 'code3'))
    pixels.push(px(17, 9, screenGreen, 'code4'))
  } else if (state === 'calling') {
    // Waving arms
    const up = callingPhase === 'wave-1' || callingPhase === 'wave-3'
    pixels.push(px(4, up ? 6 : 8, arm, 'arm-l1'))
    pixels.push(px(3, up ? 5 : 7, arm, 'arm-l2'))
    pixels.push(px(11, up ? 8 : 6, arm, 'arm-r1'))
    pixels.push(px(12, up ? 7 : 5, arm, 'arm-r2'))
  } else {
    // Default arms
    pixels.push(px(4, 9, arm, 'arm-l1'))
    pixels.push(px(3, 10, arm, 'arm-l2'))
    pixels.push(px(11, 9, arm, 'arm-r1'))
    pixels.push(px(12, armWave ? 9 : 10, arm, 'arm-r2'))
  }

  // Legs
  const legOff1 = legPhase === 0 ? 0 : legPhase === 1 ? -1 : legPhase === 2 ? 0 : 1
  const legOff2 = legPhase === 0 ? 0 : legPhase === 1 ? 1 : legPhase === 2 ? 0 : -1
  pixels.push(px(6 + legOff1, 12, legColor, 'leg-l1'))
  pixels.push(px(6 + legOff1, 13, legColor, 'leg-l2'))
  pixels.push(px(9 + legOff2, 12, legColor, 'leg-r1'))
  pixels.push(px(9 + legOff2, 13, legColor, 'leg-r2'))
  // Feet
  pixels.push(px(5 + legOff1, 14, bodyDark, 'foot-l'))
  pixels.push(px(6 + legOff1, 14, bodyDark, 'foot-l2'))
  pixels.push(px(9 + legOff2, 14, bodyDark, 'foot-r'))
  pixels.push(px(10 + legOff2, 14, bodyDark, 'foot-r2'))

  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges">{pixels}</svg>
}

// ─── KITSUNE — Pixel Fox ─────────────────────────────────────
export function KitsuneSprite({ state, frame, karatePhase, callingPhase }: SpriteProps) {
  const s = 5
  const needsWide = state === 'coding' || state === 'writing' || state === 'phone' || state === 'presenting' || state === 'coffee'
  const gridW = needsWide ? 22 : 16
  const gridH = 16
  const w = gridW * s
  const h = gridH * s

  const fur = '#e8a34e'
  const furDark = '#c4822a'
  const furLight = '#f2c47a'
  const belly = '#faf0d8'
  const earInner = '#f2c47a'
  const nose = '#3b3225'
  const eye = '#3b3225'
  const tail = '#e8a34e'
  const tailTip = '#faf0d8'

  const legPhase = state === 'walking' ? (frame % 4) : 0
  const bounce = (state === 'karate' && (karatePhase === 'kick' || karatePhase === 'spin'))
    ? (frame % 2 === 0 ? -2 : 0)
    : (state === 'calling' && (callingPhase === 'jump' || callingPhase === 'jump-2'))
    ? (frame % 2 === 0 ? -3 : 0) : 0
  const blink = state === 'idle' && frame % 12 === 0
  const tailWag = frame % 4 < 2

  const px = (x: number, y: number, color: string, key?: string) => (
    <rect key={key || `${x}-${y}`} x={x * s} y={(y + bounce) * s} width={s} height={s} fill={color} />
  )

  const pixels: JSX.Element[] = []

  // Ears (tall pointed)
  pixels.push(px(4, 0, fur, 'ear-l1'))
  pixels.push(px(4, 1, fur, 'ear-l2'))
  pixels.push(px(5, 1, earInner, 'ear-li'))
  pixels.push(px(5, 2, fur, 'ear-l3'))
  pixels.push(px(11, 0, fur, 'ear-r1'))
  pixels.push(px(11, 1, fur, 'ear-r2'))
  pixels.push(px(10, 1, earInner, 'ear-ri'))
  pixels.push(px(10, 2, fur, 'ear-r3'))

  // Head — rows 2-6
  for (let x = 5; x <= 10; x++) {
    pixels.push(px(x, 2, fur, `ht-${x}`))
  }
  for (let y = 3; y <= 5; y++) {
    pixels.push(px(4, y, fur, `hl-${y}`))
    pixels.push(px(11, y, fur, `hr-${y}`))
    for (let x = 5; x <= 10; x++) {
      pixels.push(px(x, y, furLight, `hf-${x}-${y}`))
    }
  }
  for (let x = 4; x <= 11; x++) {
    pixels.push(px(x, 6, fur, `hb-${x}`))
  }

  // Snout/muzzle
  pixels.push(px(7, 5, belly, 'snout1'))
  pixels.push(px(8, 5, belly, 'snout2'))
  pixels.push(px(7, 6, belly, 'snout3'))
  pixels.push(px(8, 6, belly, 'snout4'))

  // Eyes
  if (!blink) {
    pixels.push(px(6, 4, eye, 'eye-l'))
    pixels.push(px(9, 4, eye, 'eye-r'))
  }
  // Nose
  pixels.push(px(7, 4, nose, 'nose1'))
  pixels.push(px(8, 4, nose, 'nose2'))

  // Body — rows 7-10
  for (let x = 5; x <= 10; x++) {
    pixels.push(px(x, 7, fur, `bt-${x}`))
  }
  for (let y = 8; y <= 10; y++) {
    pixels.push(px(5, y, fur, `bl-${y}`))
    pixels.push(px(10, y, fur, `br-${y}`))
    // Belly
    for (let x = 6; x <= 9; x++) {
      pixels.push(px(x, y, belly, `belly-${x}-${y}`))
    }
  }
  pixels.push(px(5, 11, fur, 'bb-l'))
  pixels.push(px(10, 11, fur, 'bb-r'))

  // Arms/front legs
  if (state === 'coding') {
    pixels.push(px(4, 9, furDark, 'arm-l'))
    pixels.push(px(3, 9, furDark, 'arm-l2'))
    pixels.push(px(11, 9, furDark, 'arm-r'))
    pixels.push(px(12, 9, furDark, 'arm-r2'))
    // Laptop
    for (let x = 13; x <= 18; x++) {
      pixels.push(px(x, 10, '#555', `lap-${x}`))
      pixels.push(px(x, 8, '#555', `laps-${x}`))
      pixels.push(px(x, 9, '#1a1a2e', `lapsc-${x}`))
    }
    pixels.push(px(14, 9, '#4fc3f7', 'code1'))
    pixels.push(px(15, 9, '#81c784', 'code2'))
    pixels.push(px(16, 9, '#4fc3f7', 'code3'))
  } else {
    pixels.push(px(4, 9, furDark, 'arm-l'))
    pixels.push(px(4, 10, furDark, 'arm-l2'))
    pixels.push(px(11, 9, furDark, 'arm-r'))
    pixels.push(px(11, 10, furDark, 'arm-r2'))
  }

  // Tail (bushy, behind body)
  const ty = tailWag ? 7 : 8
  pixels.push(px(12, ty, tail, 'tail1'))
  pixels.push(px(13, ty, tail, 'tail2'))
  pixels.push(px(13, ty - 1, tail, 'tail3'))
  pixels.push(px(14, ty - 1, tailTip, 'tail4'))
  pixels.push(px(14, ty - 2, tailTip, 'tail5'))

  // Legs
  const legOff1 = legPhase === 0 ? 0 : legPhase === 1 ? -1 : legPhase === 2 ? 0 : 1
  const legOff2 = legPhase === 0 ? 0 : legPhase === 1 ? 1 : legPhase === 2 ? 0 : -1
  pixels.push(px(6 + legOff1, 11, furDark, 'leg-l1'))
  pixels.push(px(6 + legOff1, 12, furDark, 'leg-l2'))
  pixels.push(px(6 + legOff1, 13, belly, 'paw-l'))
  pixels.push(px(9 + legOff2, 11, furDark, 'leg-r1'))
  pixels.push(px(9 + legOff2, 12, furDark, 'leg-r2'))
  pixels.push(px(9 + legOff2, 13, belly, 'paw-r'))

  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges">{pixels}</svg>
}

// ─── NEKO — Pixel Cat ────────────────────────────────────────
export function NekoSprite({ state, frame, karatePhase, callingPhase }: SpriteProps) {
  const s = 5
  const needsWide = state === 'coding' || state === 'writing' || state === 'phone' || state === 'presenting' || state === 'coffee'
  const gridW = needsWide ? 22 : 16
  const gridH = 16
  const w = gridW * s
  const h = gridH * s

  const fur = '#8a7a9e'
  const furDark = '#6a5a7e'
  const furLight = '#a89bbe'
  const belly = '#e8e0f0'
  const earInner = '#c4a0d0'
  const nose = '#e8a0b0'
  const eye = '#50c878'     // green cat eyes
  const pupil = '#1a1a1a'
  const whisker = '#b0a0c0'
  const tail = '#8a7a9e'

  const legPhase = state === 'walking' ? (frame % 4) : 0
  const bounce = (state === 'karate' && (karatePhase === 'kick' || karatePhase === 'spin'))
    ? (frame % 2 === 0 ? -2 : 0)
    : (state === 'calling' && (callingPhase === 'jump' || callingPhase === 'jump-2'))
    ? (frame % 2 === 0 ? -3 : 0) : 0
  const blink = state === 'idle' && frame % 11 === 0
  const tailSwish = frame % 6

  const px = (x: number, y: number, color: string, key?: string) => (
    <rect key={key || `${x}-${y}`} x={x * s} y={(y + bounce) * s} width={s} height={s} fill={color} />
  )

  const pixels: JSX.Element[] = []

  // Ears (rounded triangles)
  pixels.push(px(4, 1, fur, 'ear-l1'))
  pixels.push(px(5, 0, fur, 'ear-l2'))
  pixels.push(px(5, 1, earInner, 'ear-li'))
  pixels.push(px(10, 0, fur, 'ear-r2'))
  pixels.push(px(11, 1, fur, 'ear-r1'))
  pixels.push(px(10, 1, earInner, 'ear-ri'))

  // Head — rows 2-6
  for (let x = 4; x <= 11; x++) {
    pixels.push(px(x, 2, fur, `ht-${x}`))
  }
  for (let y = 3; y <= 5; y++) {
    pixels.push(px(4, y, fur, `hl-${y}`))
    pixels.push(px(11, y, fur, `hr-${y}`))
    for (let x = 5; x <= 10; x++) {
      pixels.push(px(x, y, furLight, `hf-${x}-${y}`))
    }
  }
  for (let x = 4; x <= 11; x++) {
    pixels.push(px(x, 6, fur, `hb-${x}`))
  }

  // Eyes
  if (!blink) {
    pixels.push(px(6, 4, eye, 'eye-l'))
    pixels.push(px(9, 4, eye, 'eye-r'))
    // Pupils (slit)
    pixels.push(px(6, 4, pupil, 'pupil-l'))
    pixels.push(px(9, 4, pupil, 'pupil-r'))
    // Actually make eyes visible with glow
    pixels.push(px(6, 3, eye, 'eye-lt'))
    pixels.push(px(9, 3, eye, 'eye-rt'))
  }
  // Nose
  pixels.push(px(7, 5, nose, 'nose1'))
  pixels.push(px(8, 5, nose, 'nose2'))

  // Whiskers
  pixels.push(px(3, 5, whisker, 'wh-l1'))
  pixels.push(px(2, 4, whisker, 'wh-l2'))
  pixels.push(px(3, 4, whisker, 'wh-l3'))
  pixels.push(px(12, 5, whisker, 'wh-r1'))
  pixels.push(px(13, 4, whisker, 'wh-r2'))
  pixels.push(px(12, 4, whisker, 'wh-r3'))

  // Mouth
  pixels.push(px(7, 6, belly, 'mouth1'))
  pixels.push(px(8, 6, belly, 'mouth2'))

  // Body — rows 7-10
  for (let x = 5; x <= 10; x++) {
    pixels.push(px(x, 7, fur, `bt-${x}`))
  }
  for (let y = 8; y <= 10; y++) {
    pixels.push(px(5, y, fur, `bl-${y}`))
    pixels.push(px(10, y, fur, `br-${y}`))
    for (let x = 6; x <= 9; x++) {
      pixels.push(px(x, y, belly, `belly-${x}-${y}`))
    }
  }

  // Arms
  if (state === 'coding') {
    pixels.push(px(4, 9, furDark, 'arm-l'))
    pixels.push(px(3, 9, furDark, 'arm-l2'))
    pixels.push(px(11, 9, furDark, 'arm-r'))
    pixels.push(px(12, 9, furDark, 'arm-r2'))
    // Laptop
    for (let x = 13; x <= 18; x++) {
      pixels.push(px(x, 10, '#555', `lap-${x}`))
      pixels.push(px(x, 8, '#555', `laps-${x}`))
      pixels.push(px(x, 9, '#1a1a2e', `lapsc-${x}`))
    }
    pixels.push(px(14, 9, '#4fc3f7', 'code1'))
    pixels.push(px(16, 9, '#81c784', 'code2'))
  } else if (state === 'calling') {
    const up = callingPhase === 'wave-1' || callingPhase === 'wave-3'
    pixels.push(px(4, up ? 6 : 8, furDark, 'arm-l'))
    pixels.push(px(3, up ? 5 : 7, furDark, 'arm-l2'))
    pixels.push(px(11, up ? 8 : 6, furDark, 'arm-r'))
    pixels.push(px(12, up ? 7 : 5, furDark, 'arm-r2'))
  } else {
    pixels.push(px(4, 9, furDark, 'arm-l'))
    pixels.push(px(4, 10, furDark, 'arm-l2'))
    pixels.push(px(11, 9, furDark, 'arm-r'))
    pixels.push(px(11, 10, furDark, 'arm-r2'))
  }

  // Tail (curvy, swishing)
  const tx = tailSwish < 3 ? 12 : 13
  pixels.push(px(tx, 8, tail, 'tail1'))
  pixels.push(px(tx + 1, 7, tail, 'tail2'))
  pixels.push(px(tx + 2, 7, tail, 'tail3'))
  pixels.push(px(tx + 2, 6, furDark, 'tail4'))

  // Legs
  const legOff1 = legPhase === 0 ? 0 : legPhase === 1 ? -1 : legPhase === 2 ? 0 : 1
  const legOff2 = legPhase === 0 ? 0 : legPhase === 1 ? 1 : legPhase === 2 ? 0 : -1
  pixels.push(px(6 + legOff1, 11, furDark, 'leg-l1'))
  pixels.push(px(6 + legOff1, 12, furDark, 'leg-l2'))
  pixels.push(px(6 + legOff1, 13, belly, 'paw-l'))
  pixels.push(px(9 + legOff2, 11, furDark, 'leg-r1'))
  pixels.push(px(9 + legOff2, 12, furDark, 'leg-r2'))
  pixels.push(px(9 + legOff2, 13, belly, 'paw-r'))

  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges">{pixels}</svg>
}

// ─── BACKGROUNDS ─────────────────────────────────────────────

export function SpaceBackground() {
  return (
    <svg className="adm-office-bg" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="space-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a0a20" />
          <stop offset="60%" stopColor="#12122e" />
          <stop offset="100%" stopColor="#1a1a3e" />
        </linearGradient>
      </defs>
      <rect width="600" height="250" fill="url(#space-grad)" />
      {[
        [45,20],[120,35],[200,12],[280,45],[350,18],[420,55],[490,25],[560,40],
        [30,70],[90,90],[170,65],[240,85],[320,72],[400,95],[470,60],[540,80],
        [60,130],[140,110],[220,140],[310,120],[380,135],[450,115],[530,145],
        [15,160],[100,170],[190,155],[270,175],[360,160],[440,180],[520,165],
        [75,45],[155,85],[250,30],[340,95],[430,40],[510,90],[580,15],
      ].map(([x,y],i) => (
        <circle key={`s-${i}`} cx={x} cy={y} r={i%5===0?1.5:i%3===0?1:0.6}
          fill="#fff" opacity={i%4===0?0.9:i%3===0?0.7:0.4} />
      ))}
      {[[150,30],[350,50],[500,20],[80,120],[420,140]].map(([x,y],i) => (
        <g key={`tw-${i}`}>
          <circle cx={x} cy={y} r="2" fill="#fff" opacity="0.8" />
          <line x1={x-4} y1={y} x2={x+4} y2={y} stroke="#fff" strokeWidth="0.5" opacity="0.4" />
          <line x1={x} y1={y-4} x2={x} y2={y+4} stroke="#fff" strokeWidth="0.5" opacity="0.4" />
        </g>
      ))}
      <circle cx="500" cy="80" r="20" fill="#c9a96e" />
      <ellipse cx="500" cy="80" rx="35" ry="6" fill="none" stroke="#d4b87a" strokeWidth="2" opacity="0.6" />
      <circle cx="100" cy="50" r="8" fill="#4a90d9" opacity="0.7" />
      <circle cx="97" cy="48" r="2" fill="#6aade8" opacity="0.5" />
      <ellipse cx="300" cy="100" rx="120" ry="50" fill="#8a4a9e" opacity="0.06" />
      <rect x="0" y="194" width="600" height="56" fill="#2a2a3e" />
      <rect x="0" y="188" width="600" height="6" fill="#3a3a4e" />
      <ellipse cx="80" cy="220" rx="20" ry="8" fill="#222238" stroke="#3a3a4e" strokeWidth="0.5" />
      <ellipse cx="250" cy="215" rx="12" ry="5" fill="#222238" stroke="#3a3a4e" strokeWidth="0.5" />
      <ellipse cx="450" cy="225" rx="25" ry="9" fill="#222238" stroke="#3a3a4e" strokeWidth="0.5" />
      <rect x="350" y="170" width="2" height="24" fill="#c0c0c0" />
      <rect x="352" y="170" width="16" height="10" fill="#e8735a" rx="1" />
    </svg>
  )
}

export function GardenBackground() {
  return (
    <svg className="adm-office-bg" viewBox="0 0 600 250" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#87ceeb" />
          <stop offset="60%" stopColor="#b8e4f0" />
          <stop offset="100%" stopColor="#d8f0f8" />
        </linearGradient>
      </defs>
      <rect width="600" height="250" fill="url(#sky-grad)" />
      <g opacity="0.7">
        <ellipse cx="120" cy="40" rx="40" ry="16" fill="#fff" />
        <ellipse cx="100" cy="36" rx="25" ry="12" fill="#fff" />
        <ellipse cx="145" cy="38" rx="22" ry="10" fill="#fff" />
      </g>
      <g opacity="0.5">
        <ellipse cx="420" cy="55" rx="35" ry="14" fill="#fff" />
        <ellipse cx="400" cy="50" rx="20" ry="10" fill="#fff" />
      </g>
      <circle cx="540" cy="45" r="22" fill="#ffeb3b" opacity="0.3" />
      <circle cx="540" cy="45" r="14" fill="#fff176" opacity="0.6" />
      <circle cx="540" cy="45" r="8" fill="#fff" opacity="0.8" />
      <ellipse cx="150" cy="194" rx="160" ry="50" fill="#7cb342" opacity="0.4" />
      <ellipse cx="400" cy="194" rx="200" ry="60" fill="#689f38" opacity="0.3" />
      <rect x="0" y="188" width="600" height="62" fill="#66bb6a" />
      <rect x="0" y="188" width="600" height="4" fill="#81c784" />
      {[20,60,110,170,230,290,340,400,460,520,570].map((gx,i) => (
        <g key={`g-${i}`}>
          <line x1={gx} y1="188" x2={gx-2} y2="181" stroke="#43a047" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={gx+3} y1="188" x2={gx+4} y2="180" stroke="#388e3c" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={gx+6} y1="188" x2={gx+5} y2="182" stroke="#43a047" strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}
      <rect x="60" y="120" width="8" height="68" fill="#795548" rx="2" />
      <ellipse cx="64" cy="110" rx="28" ry="25" fill="#4caf50" />
      <ellipse cx="52" cy="105" rx="18" ry="18" fill="#66bb6a" />
      <ellipse cx="78" cy="108" rx="16" ry="16" fill="#43a047" />
      <rect x="490" y="130" width="7" height="58" fill="#6d4c41" rx="2" />
      <ellipse cx="493" cy="120" rx="24" ry="22" fill="#388e3c" />
      <ellipse cx="505" cy="115" rx="16" ry="16" fill="#4caf50" />
      {[
        [180,182,'#e53935'],[210,184,'#ff9800'],[250,180,'#e91e63'],
        [330,183,'#ffeb3b'],[370,181,'#9c27b0'],[410,185,'#e53935'],
        [150,185,'#ff9800'],[450,182,'#e91e63'],
      ].map(([fx,fy,fc],i) => (
        <g key={`fl-${i}`}>
          <line x1={fx as number} y1={fy as number} x2={fx as number} y2={(fy as number)+8} stroke="#388e3c" strokeWidth="1.5" />
          <circle cx={fx as number} cy={fy as number} r="3.5" fill={fc as string} />
          <circle cx={fx as number} cy={fy as number} r="1.5" fill="#ffeb3b" />
        </g>
      ))}
      {[0,30,60,90,120,150].map((fx) => (
        <g key={`f-${fx}`}>
          <rect x={200+fx} y="160" width="3" height="28" fill="#d7ccc8" rx="1" />
        </g>
      ))}
      <rect x="200" y="168" width="153" height="3" fill="#d7ccc8" rx="1" />
      <rect x="200" y="178" width="153" height="3" fill="#d7ccc8" rx="1" />
      <g transform="translate(280,140)">
        <ellipse cx="0" cy="0" rx="1" ry="3" fill="#3b3225" />
        <ellipse cx="-4" cy="-1" rx="4" ry="3" fill="#e91e63" opacity="0.7" />
        <ellipse cx="4" cy="-1" rx="4" ry="3" fill="#e91e63" opacity="0.7" />
      </g>
    </svg>
  )
}
