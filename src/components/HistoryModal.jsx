import { formatDate } from '../utils/dates'

export default function HistoryModal({ schedules, onLoad, onSetActive, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ width: 560, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 700 }}>📋 Schedule History</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        {schedules.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>No saved schedules yet.</p>
        ) : (
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {schedules.map(s => (
              <div key={s.id} style={{
                border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px',
                marginBottom: 10, background: s.is_active ? '#f0fdf4' : 'white',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                      {formatDate(s.start_date)} – {formatDate(s.end_date)}
                    </p>
                    <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                      Saved {new Date(s.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                      &nbsp;·&nbsp; {s.assignments?.length ?? 0} team members
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {s.is_active && (
                      <span style={{ background: '#bbf7d0', color: '#14532d', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        ACTIVE
                      </span>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => onLoad(s)}>Load</button>
                    {!s.is_active && (
                      <button className="btn btn-green btn-sm" onClick={() => onSetActive(s.id)}>Set Active</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
