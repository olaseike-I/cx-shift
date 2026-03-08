import { useState } from 'react'
import { formatDate } from '../utils/dates'
import { WEEKENDS } from '../utils/dates'

export default function SlackModal({ weekLabel, dayRows, assignments, onClose }) {
  const [webhook, setWebhook] = useState('')
  const [status,  setStatus]  = useState(null)

  function buildMessage() {
    let msg = `📅 *CS Team Schedule — ${weekLabel}*\n\n`
    dayRows.filter(r => !r.isWeekend).forEach(({ day, morning, evening, off, dateStr }) => {
      msg += `*${day}* (${formatDate(dateStr)})\n`
      if (morning.length) msg += `  🌅 Morning (8am–2pm): ${morning.join(', ')}\n`
      if (evening.length) msg += `  🌆 Evening (2pm–8pm): ${evening.join(', ')}\n`
      if (off.length)     msg += `  🚫 Off: ${off.join(', ')}\n`
      msg += '\n'
    })
    const wkRows = dayRows.filter(r => r.isWeekend)
    const hasWkDuty = wkRows.some(r => r.weekend.length > 0)
    if (hasWkDuty) {
      msg += `*Weekend Duty (10am–5pm)*\n`
      wkRows.forEach(({ day, weekend, dateStr }) => {
        if (weekend.length) msg += `  📅 ${day} (${formatDate(dateStr)}): ${weekend.join(', ')}\n`
      })
    }
    return msg
  }

  async function send() {
    if (!webhook.trim()) { setStatus('nourl'); return }
    setStatus('sending')
    try {
      await fetch(webhook.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: buildMessage() }),
      })
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  function copyText() {
    navigator.clipboard.writeText(buildMessage())
      .then(() => setStatus('copied'))
      .catch(() => setStatus('copied'))
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:17, fontWeight:700 }}>💬 Share to Slack</h3>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Close</button>
        </div>
        <p style={{ fontSize:13, color:'#6b7280', marginBottom:14, lineHeight:1.5 }}>
          Paste your Slack <strong>Incoming Webhook URL</strong> to post directly, or copy the text to paste manually.
        </p>
        <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>
          Webhook URL
        </label>
        <input
          type="url"
          placeholder="https://hooks.slack.com/services/..."
          value={webhook}
          onChange={e => setWebhook(e.target.value)}
          style={{ width:'100%', border:'1px solid #d1d5db', borderRadius:8, padding:'9px 12px', fontSize:13, marginBottom:12, outline:'none' }}
        />
        <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:12, marginBottom:16, maxHeight:160, overflowY:'auto' }}>
          <pre style={{ fontSize:11, color:'#374151', whiteSpace:'pre-wrap', lineHeight:1.6 }}>{buildMessage()}</pre>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn btn-blue" onClick={send} disabled={status === 'sending'}>
            {status === 'sending' ? '⏳ Sending…' : '🚀 Post to Slack'}
          </button>
          <button className="btn btn-outline" onClick={copyText}>📋 Copy Text</button>
        </div>
        {status === 'success' && <p style={{ color:'#16a34a', fontSize:13, marginTop:10, fontWeight:600 }}>✅ Posted successfully!</p>}
        {status === 'copied'  && <p style={{ color:'#2563eb', fontSize:13, marginTop:10, fontWeight:600 }}>✅ Copied to clipboard!</p>}
        {status === 'error'   && <p style={{ color:'#dc2626', fontSize:13, marginTop:10 }}>❌ Could not connect — use Copy Text instead.</p>}
        {status === 'nourl'   && <p style={{ color:'#d97706', fontSize:13, marginTop:10 }}>⚠️ Enter a webhook URL or use Copy Text.</p>}
      </div>
    </div>
  )
}
