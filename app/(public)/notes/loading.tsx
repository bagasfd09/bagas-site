export default function NotesLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: '90px', height: '2.2rem', marginBottom: '0.4rem' }} />
      <div className="skeleton" style={{ width: '260px', height: '0.85rem', marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ width: '100%', height: '42px', borderRadius: '6px', marginBottom: '2.5rem' }} />

      <div className="skeleton" style={{ width: '55px', height: '1.3rem', marginBottom: '0.75rem' }} />
      {[88, 64, 76].map((w, i) => (
        <div key={`a${i}`} className="skeleton-row">
          <div className="skeleton" style={{ width: '82px', height: '0.82rem', flexShrink: 0 }} />
          <div className="skeleton" style={{ width: `${w}%`, height: '0.82rem' }} />
        </div>
      ))}

      <div className="skeleton" style={{ width: '55px', height: '1.3rem', marginTop: '2rem', marginBottom: '0.75rem' }} />
      {[55, 82, 70].map((w, i) => (
        <div key={`b${i}`} className="skeleton-row">
          <div className="skeleton" style={{ width: '82px', height: '0.82rem', flexShrink: 0 }} />
          <div className="skeleton" style={{ width: `${w}%`, height: '0.82rem' }} />
        </div>
      ))}
    </div>
  )
}
