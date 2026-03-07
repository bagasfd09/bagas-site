import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'bagas.dev — Software Engineer & Backend Developer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 80px',
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2218 100%)',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#b4762c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '24px',
              fontWeight: 700,
            }}
          >
            B
          </div>
          <span style={{ fontSize: '24px', color: '#b4762c', fontWeight: 600 }}>
            bagas.dev
          </span>
        </div>
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#e8e8e8',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
          }}
        >
          Software Engineer &
          <br />
          Backend Developer
        </h1>
        <p
          style={{
            fontSize: '22px',
            color: '#888',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Go &bull; TypeScript &bull; Node.js &bull; React &bull; PostgreSQL
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            fontSize: '18px',
            color: '#666',
          }}
        >
          <span>Indonesia</span>
          <span style={{ color: '#444' }}>&bull;</span>
          <span>Open Source</span>
          <span style={{ color: '#444' }}>&bull;</span>
          <span>Backend Engineering</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
