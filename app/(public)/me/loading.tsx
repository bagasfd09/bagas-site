export default function AboutLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: '140px', height: '2.2rem', marginBottom: '2rem' }} />
      {[
        [100, 95, 88, 72],
        [100, 92, 100, 85, 60],
        [100, 90, 75],
        [100, 97, 88, 80],
        [100, 85, 65],
      ].map((lines, pi) => (
        <div key={pi} style={{ marginBottom: '1.25rem' }}>
          {lines.map((w, li) => (
            <div key={li} className="skeleton" style={{ width: `${w}%`, height: '0.9rem', marginBottom: '0.5rem' }} />
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: '75px', height: '0.9rem' }} />
        <div className="skeleton" style={{ width: '80px', height: '0.9rem' }} />
        <div className="skeleton" style={{ width: '65px', height: '0.9rem' }} />
        <div className="skeleton" style={{ width: '55px', height: '0.9rem' }} />
      </div>
    </div>
  )
}
