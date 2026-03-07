export default function ProjectsLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: '120px', height: '2.2rem', marginBottom: '0.4rem' }} />
      <div className="skeleton" style={{ width: '300px', height: '0.85rem', marginBottom: '2rem' }} />
      <div className="skeleton-grid-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '1.25rem' }}>
            <div className="skeleton" style={{ width: '38px', height: '0.72rem', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '65%', height: '1rem', marginBottom: '0.4rem' }} />
            <div className="skeleton" style={{ width: '92%', height: '0.8rem', marginBottom: '0.3rem' }} />
            <div className="skeleton" style={{ width: '75%', height: '0.8rem', marginBottom: '1.25rem' }} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="skeleton" style={{ width: '55px', height: '22px', borderRadius: '4px' }} />
              <div className="skeleton" style={{ width: '50px', height: '22px', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
