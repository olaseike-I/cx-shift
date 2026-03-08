import { useState } from 'react'
import { ADMIN_PIN } from '../lib/supabase'

export default function PinModal({ onSuccess, onClose }) {
  const [pin,   setPin]   = useState('')
  const [error, setError] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('shift_admin', '1')
      onSuccess()
      onClose()
    } else {
      setError(true)
      setPin('')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 360 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>🔒 Admin Access</h3>
        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          Enter your admin PIN to unlock schedule management.
        </p>
        <form onSubmit={submit}>
          <input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false) }}
            autoFocus
            style={{
              width: '100%', border: `1px solid ${error ? '#dc2626' : '#d1d5db'}`,
              borderRadius: 8, padding: '10px 12px', fontSize: 16,
              marginBottom: 8, outline: 'none', letterSpacing: 4,
            }}
          />
          {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 10 }}>Incorrect PIN. Try again.</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="submit" className="btn btn-green" style={{ flex: 1 }}>Unlock</button>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
