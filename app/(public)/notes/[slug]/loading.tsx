export default function NoteLoading() {
  return (
    <article>
      <div className="skeleton" style={{ width: '72px', height: '0.8rem', marginBottom: '2rem' }} />
      <div className="skeleton" style={{ width: '75%', height: '2rem', marginBottom: '0.5rem' }} />
      <div className="skeleton" style={{ width: '55%', height: '2rem', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
        <div className="skeleton" style={{ width: '90px', height: '0.8rem' }} />
        <div className="skeleton" style={{ width: '58px', height: '22px', borderRadius: '12px' }} />
        <div className="skeleton" style={{ width: '50px', height: '22px', borderRadius: '12px' }} />
      </div>
      {[
        [100, 92, 80],
        [100, 95, 88, 65],
        [100, 85, 70],
      ].map((lines, pi) => (
        <div key={pi} style={{ marginBottom: '1.5rem' }}>
          {lines.map((w, li) => (
            <div key={li} className="skeleton" style={{ width: `${w}%`, height: '0.9rem', marginBottom: '0.5rem' }} />
          ))}
        </div>
      ))}
    </article>
  )
}
