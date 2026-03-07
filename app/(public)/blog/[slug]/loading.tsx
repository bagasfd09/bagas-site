export default function PostLoading() {
  return (
    <article>
      <div className="skeleton" style={{ width: '72px', height: '0.8rem', marginBottom: '2rem' }} />
      <div className="skeleton" style={{ width: '85%', height: '2.2rem', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ width: '70%', height: '2.2rem', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: '90px', height: '0.8rem' }} />
        <div className="skeleton" style={{ width: '58px', height: '22px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ width: '68px', height: '22px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ width: '48px', height: '22px', borderRadius: '12px' }} />
      </div>

      {[
        [100, 95, 88, 72],
        [100, 97, 80],
        [100, 92, 100, 85, 60],
        [100, 90, 75],
      ].map((lines, pi) => (
        <div key={pi} style={{ marginBottom: '1.5rem' }}>
          {lines.map((w, li) => (
            <div key={li} className="skeleton" style={{ width: `${w}%`, height: '0.9rem', marginBottom: '0.5rem' }} />
          ))}
        </div>
      ))}

      <div className="skeleton" style={{ width: '100%', height: '120px', borderRadius: '8px', marginBottom: '1.5rem' }} />

      <div>
        {[100, 88, 65].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: `${w}%`, height: '0.9rem', marginBottom: '0.5rem' }} />
        ))}
      </div>
    </article>
  )
}
