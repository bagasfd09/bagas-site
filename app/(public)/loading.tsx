export default function HomeLoading() {
  return (
    <div>
      {/* Hero */}
      <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', marginBottom: '3.5rem' }}>
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ width: '55%', height: '2.5rem', marginBottom: '1.25rem' }} />
          <div className="skeleton" style={{ width: '100%', height: '0.95rem', marginBottom: '0.6rem' }} />
          <div className="skeleton" style={{ width: '90%', height: '0.95rem', marginBottom: '0.6rem' }} />
          <div className="skeleton" style={{ width: '75%', height: '0.95rem', marginBottom: '1rem' }} />
          <div className="skeleton" style={{ width: '65%', height: '0.95rem', marginBottom: '1.5rem' }} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: '120px', height: '38px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '155px', height: '38px', borderRadius: '6px' }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '190px', height: '210px', borderRadius: '12px', flexShrink: 0 }} />
      </section>

      {/* Blog */}
      <section style={{ marginBottom: '3rem' }}>
        <div className="skeleton" style={{ width: '70px', height: '1.75rem', marginBottom: '0.4rem' }} />
        <div className="skeleton" style={{ width: '240px', height: '0.85rem', marginBottom: '1.1rem' }} />
        {[85, 92, 62, 78, 55].map((w, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton" style={{ width: '82px', height: '0.82rem', flexShrink: 0 }} />
            <div className="skeleton" style={{ width: `${w}%`, height: '0.82rem' }} />
          </div>
        ))}
      </section>

      {/* Notes */}
      <section style={{ marginBottom: '3rem' }}>
        <div className="skeleton" style={{ width: '85px', height: '1.75rem', marginBottom: '0.4rem' }} />
        <div className="skeleton" style={{ width: '280px', height: '0.85rem', marginBottom: '1.1rem' }} />
        {[90, 58, 76, 65, 82].map((w, i) => (
          <div key={i} className="skeleton-row">
            <div className="skeleton" style={{ width: '82px', height: '0.82rem', flexShrink: 0 }} />
            <div className="skeleton" style={{ width: `${w}%`, height: '0.82rem' }} />
          </div>
        ))}
      </section>

      {/* Skills */}
      <section style={{ marginBottom: '3rem' }}>
        <div className="skeleton" style={{ width: '80px', height: '1.75rem', marginBottom: '0.4rem' }} />
        <div className="skeleton" style={{ width: '280px', height: '0.85rem', marginBottom: '1.1rem' }} />
        <div className="skill-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
              <div className="skeleton" style={{ width: '70px', height: '0.85rem' }} />
              <div className="skeleton" style={{ width: '50px', height: '0.6rem' }} />
            </div>
          ))}
        </div>
      </section>

      {/* Projects */}
      <section>
        <div className="skeleton" style={{ width: '110px', height: '1.75rem', marginBottom: '0.4rem' }} />
        <div className="skeleton" style={{ width: '340px', height: '0.85rem', marginBottom: '1.1rem' }} />
        <div className="skeleton-grid-3">
          {[1, 2, 3, 4].map((i) => (
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
      </section>
    </div>
  )
}
