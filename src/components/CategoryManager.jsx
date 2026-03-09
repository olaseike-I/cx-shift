import { useState } from 'react'

const PALETTE = [
  { tagBg: '#fef08a', tagColor: '#854d0e', cardBg: '#fefce8', border: '#fde047' },
  { tagBg: '#bfdbfe', tagColor: '#1e40af', cardBg: '#eff6ff', border: '#93c5fd' },
  { tagBg: '#bae6fd', tagColor: '#0c4a6e', cardBg: '#f0f9ff', border: '#7dd3fc' },
  { tagBg: '#bbf7d0', tagColor: '#14532d', cardBg: '#f0fdf4', border: '#86efac' },
  { tagBg: '#fecaca', tagColor: '#7f1d1d', cardBg: '#fef2f2', border: '#f87171' },
  { tagBg: '#e9d5ff', tagColor: '#4c1d95', cardBg: '#faf5ff', border: '#a78bfa' },
  { tagBg: '#fed7aa', tagColor: '#7c2d12', cardBg: '#fff7ed', border: '#fb923c' },
  { tagBg: '#d1fae5', tagColor: '#064e3b', cardBg: '#ecfdf5', border: '#34d399' },
]

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Find closest palette index for a given tagBg colour
function paletteIndexFor(cat) {
  const idx = PALETTE.findIndex(p => p.tagBg === cat.tagBg)
  return idx >= 0 ? idx : 0
}

function buildDesc(offDays, workShift, weekendStatus) {
  const workCount  = WEEKDAY_NAMES.filter(d => !offDays.includes(d)).length
  const offLabel   = offDays.length ? `${offDays.join(' & ')} Off` : '0 Off'
  const wkndLabel  =
    weekendStatus === 'duty'   ? 'Weekends ON DUTY' :
    weekendStatus === 'wrapup' ? 'Weekends Wrap-up' : 'Weekends Off'
  const shiftLabel =
    workShift === 'morning' ? 'Morning only' :
    workShift === 'evening' ? 'Evening only' :
    workShift === 'mixed'   ? '1M+rest E'    : 'Fixed shift'
  return `${workCount} Workdays (${shiftLabel}) · ${offLabel} · ${wkndLabel}`
}

// Reusable form fields for both New and Edit modes
function CategoryForm({ form, setForm, submitLabel, onSubmit, onCancel }) {
  function toggleOffDay(day) {
    setForm(prev => ({
      ...prev,
      offDays: prev.offDays.includes(day)
        ? prev.offDays.filter(d => d !== day)
        : [...prev.offDays, day],
    }))
  }

  return (
    <div>
      {/* Key field — only shown when creating */}
      {form.showKey && (
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            Key / Label
          </label>
          <input
            placeholder="e.g. E  or  FLOAT"
            value={form.key}
            onChange={e => setForm(p => ({ ...p, key: e.target.value }))}
            style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none' }}
          />
        </div>
      )}

      {/* Colour picker */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
          Colour
        </label>
        <div style={{ display: 'flex', gap: 5 }}>
          {PALETTE.map((p, i) => (
            <div key={i} onClick={() => setForm(prev => ({ ...prev, colorIdx: i }))} style={{
              width: 22, height: 22, borderRadius: '50%',
              background: p.tagBg, border: `2px solid ${p.border}`,
              cursor: 'pointer',
              outline: form.colorIdx === i ? `3px solid ${p.tagColor}` : 'none',
              outlineOffset: 2,
            }} />
          ))}
        </div>
      </div>

      {/* Off days */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 6 }}>
          Fixed Off Days
        </label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {WEEKDAY_NAMES.map(d => (
            <button key={d} onClick={() => toggleOffDay(d)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 600,
              background: form.offDays.includes(d) ? '#1f2937' : '#f3f4f6',
              color:      form.offDays.includes(d) ? 'white'   : '#374151',
              border: '1px solid #e5e7eb',
            }}>
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Shift type + Weekend status */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            Shift Type
          </label>
          <select value={form.workShift} onChange={e => setForm(p => ({ ...p, workShift: e.target.value }))}
            style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none' }}>
            <option value="morning">Morning only (8am–2pm)</option>
            <option value="evening">Evening only (2pm–8pm)</option>
            <option value="fixed">Fixed per person (M or E)</option>
            <option value="mixed">Mixed (1 morning + rest evenings)</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 4 }}>
            Weekend Status
          </label>
          <select value={form.weekendStatus} onChange={e => setForm(p => ({ ...p, weekendStatus: e.target.value }))}
            style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '6px 10px', fontSize: 13, width: '100%', outline: 'none' }}>
            <option value="duty">On Duty (10am–5pm)</option>
            <option value="wrapup">Wrap-up</option>
            <option value="off">Off</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSubmit} className="btn btn-green" style={{ flex: 1 }}>{submitLabel}</button>
        <button onClick={onCancel} className="btn btn-outline">Cancel</button>
      </div>
    </div>
  )
}

export default function CategoryManager({ names, categories, categoryAssignments, onUpdate, onClose }) {
  const [assignments, setAssignments] = useState({ ...categoryAssignments })
  const [editingKey,  setEditingKey]  = useState(null)   // key of category being edited
  const [editForm,    setEditForm]    = useState(null)
  const [showNewCat,  setShowNewCat]  = useState(false)
  const [newCatForm,  setNewCatForm]  = useState({
    showKey: true, key: '', colorIdx: 0, offDays: [], workShift: 'fixed', weekendStatus: 'wrapup',
  })

  const catKeys = Object.keys(categories)

  function startEdit(key) {
    const cat = categories[key]
    setEditingKey(key)
    setEditForm({
      showKey:       false,
      colorIdx:      paletteIndexFor(cat),
      offDays:       cat.rules?.offDays       || [],
      workShift:     cat.rules?.workShift     || 'fixed',
      weekendStatus: cat.rules?.weekendStatus || 'wrapup',
    })
    setShowNewCat(false)
  }

  function saveEdit() {
    const color = PALETTE[editForm.colorIdx]
    const desc  = buildDesc(editForm.offDays, editForm.workShift, editForm.weekendStatus)
    onUpdate({
      type: 'editCategory',
      key:  editingKey,
      data: {
        ...color,
        desc,
        rules: {
          offDays:       editForm.offDays,
          workShift:     editForm.workShift,
          weekendStatus: editForm.weekendStatus,
        },
      },
    })
    setEditingKey(null)
    setEditForm(null)
  }

  function addCategory() {
    const key = newCatForm.key.trim().toUpperCase().replace(/\s+/g, '_')
    if (!key || categories[key]) return
    const color = PALETTE[newCatForm.colorIdx]
    const desc  = buildDesc(newCatForm.offDays, newCatForm.workShift, newCatForm.weekendStatus)
    onUpdate({
      type: 'newCategory',
      key,
      data: {
        ...color,
        desc,
        rules: {
          offDays:       newCatForm.offDays,
          workShift:     newCatForm.workShift,
          weekendStatus: newCatForm.weekendStatus,
        },
      },
    })
    setNewCatForm({ showKey: true, key: '', colorIdx: 0, offDays: [], workShift: 'fixed', weekendStatus: 'wrapup' })
    setShowNewCat(false)
  }

  function save() {
    onUpdate({ type: 'assignments', assignments })
    onClose()
  }

  const unassigned = names.filter(n => !assignments[n])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: 24,
        width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>Category Manager</h2>
          <button onClick={onClose}
            style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>
            ✕
          </button>
        </div>

        {/* ── Assign people ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          Assign People to Categories
        </p>
        {names.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Enter team members in the admin panel first.</p>
        ) : (
          <>
            {unassigned.length > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#92400e' }}>
                  ⚠️ {unassigned.length} person{unassigned.length > 1 ? 's' : ''} not yet assigned: {unassigned.join(', ')}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {names.map(name => {
                const catKey = assignments[name] || ''
                const cat    = categories[catKey]
                return (
                  <div key={name} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: cat ? cat.cardBg : '#f9fafb',
                    border: `1px solid ${cat ? cat.border : '#e5e7eb'}`,
                    borderRadius: 8, padding: '8px 12px',
                  }}>
                    <span style={{ fontWeight: 600, color: '#374151', flex: 1 }}>{name}</span>
                    <select
                      value={catKey}
                      onChange={e => setAssignments(prev => ({ ...prev, [name]: e.target.value }))}
                      style={{
                        border: '1px solid #d1d5db', borderRadius: 6,
                        padding: '4px 8px', fontSize: 13, outline: 'none',
                        background: cat ? cat.cardBg : 'white', color: '#374151',
                      }}
                    >
                      <option value="">— Assign —</option>
                      {catKeys.map(k => (
                        <option key={k} value={k}>Category {k}</option>
                      ))}
                    </select>
                    {cat && (
                      <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cat.tagBg, color: cat.tagColor }}>
                        {catKey}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Categories ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
          Categories
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {Object.entries(categories).map(([k, m]) => (
            <div key={k}>
              {/* Category row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: m.cardBg, border: `1px solid ${m.border}`,
                borderRadius: editingKey === k ? '8px 8px 0 0' : 8,
                padding: '8px 12px',
              }}>
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.tagBg, color: m.tagColor, whiteSpace: 'nowrap' }}>
                  Cat {k}
                </span>
                <span style={{ fontSize: 12, color: '#4b5563', flex: 1 }}>{m.desc}</span>
                <button
                  onClick={() => editingKey === k ? setEditingKey(null) : startEdit(k)}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
                    background: editingKey === k ? '#1f2937' : 'white',
                    color:      editingKey === k ? 'white'   : '#374151',
                    border: '1px solid #d1d5db',
                  }}
                >
                  {editingKey === k ? 'Cancel' : '✏️ Edit'}
                </button>
              </div>

              {/* Inline edit form */}
              {editingKey === k && editForm && (
                <div style={{
                  border: `1px solid ${m.border}`, borderTop: 'none',
                  borderRadius: '0 0 8px 8px', padding: 16, background: '#fafafa',
                }}>
                  <CategoryForm
                    form={editForm}
                    setForm={setEditForm}
                    submitLabel="Save Changes"
                    onSubmit={saveEdit}
                    onCancel={() => setEditingKey(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Add new category ── */}
        {!showNewCat ? (
          <button onClick={() => { setShowNewCat(true); setEditingKey(null) }}
            className="btn btn-outline" style={{ width: '100%', marginBottom: 20 }}>
            + New Category
          </button>
        ) : (
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 14 }}>New Category</p>
            <CategoryForm
              form={newCatForm}
              setForm={setNewCatForm}
              submitLabel="Add Category"
              onSubmit={addCategory}
              onCancel={() => setShowNewCat(false)}
            />
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-outline">Cancel</button>
          <button onClick={save} className="btn btn-green">Save Assignments</button>
        </div>
      </div>
    </div>
  )
}
