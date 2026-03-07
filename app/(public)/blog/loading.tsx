export default function BlogLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: '80px', height: '2.2rem', marginBottom: '0.4rem' }} />
      <div className="skeleton" style={{ width: '220px', height: '0.85rem', marginBottom: '1.5rem' }} />
      <div className="skeleton" style={{ width: '100%', height: '42px', borderRadius: '6px', marginBottom: '2.5rem' }} />

      <div className="skeleton" style={{ width: '55px', height: '1.3rem', marginBottom: '0.75rem' }} />
      {[74, 86, 55].map((w, i) => (
        <div key={`a${i}`} className="skeleton-row">
          <div className="skeleton" style={{ width: '82px', height: '0.82rem', flexShrink: 0 }} />
          <div className="skeleton" style={{ width: `${w}%`, height: '0.82rem' }} />
        </div>
      ))}

      <div className="skeleton" style={{ width: '55px', height: '1.3rem', marginTop: '2rem', marginBottom: '0.75rem' }} />
      {[62, 91, 48, 78].map((w, i) => (
        <div key={`b${i}`} className="skeleton-row">
          <div className="skeleton" style={{ width: '82px', height: '0.82rem', flexShrink: 0 }} />
          <div className="skeleton" style={{ width: `${w}%`, height: '0.82rem' }} />
        </div>
      ))}
    </div>
  )
}
