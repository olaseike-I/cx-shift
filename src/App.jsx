import { useState, useEffect } from 'react'
import { supabase, IS_DB_CONFIGURED, ADMIN_PIN } from './lib/supabase'
import { toLocalDateStr, formatDate, getMondayStr, getDaysInRange, WEEKENDS } from './utils/dates'
import { DEFAULT_CATEGORIES, SHIFT_LABELS, generateAssignments } from './utils/schedule'
import { exportCSV } from './utils/export'
import ScheduleTable   from './components/ScheduleTable'
import PersonTable     from './components/PersonTable'
import PinModal        from './components/PinModal'
import HistoryModal    from './components/HistoryModal'
import SlackModal      from './components/SlackModal'
import CategoryManager from './components/CategoryManager'

const todayMonday = getMondayStr(toLocalDateStr(new Date()))

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return toLocalDateStr(d)
}

export default function App() {
  // ── Date range ──────────────────────────────────────────────────────────────
  const [weekStart, setWeekStart] = useState(todayMonday)
  const [weekEnd,   setWeekEnd]   = useState(() => addDays(todayMonday, 6))

  function handleStartChange(val) {
    setWeekStart(val)
    if (val) setWeekEnd(addDays(val, 6))
  }

  // ── Categories & assignments ────────────────────────────────────────────────
  const [categories,          setCategories]          = useState(DEFAULT_CATEGORIES)
  const [categoryAssignments, setCategoryAssignments] = useState({})  // { name: catKey }
  const [showCatManager,      setShowCatManager]      = useState(false)

  // ── Schedule data ───────────────────────────────────────────────────────────
  const [namesInput,  setNamesInput]  = useState('')
  const [assignments, setAssignments] = useState([])
  const [generated,   setGenerated]   = useState(false)
  const [view,        setView]        = useState('schedule')

  // ── Edit mode ───────────────────────────────────────────────────────────────
  const [editMode,  setEditMode]  = useState(false)
  const [editCount, setEditCount] = useState(0)

  // ── Admin ───────────────────────────────────────────────────────────────────
  const [adminMode,    setAdminMode]    = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)

  // ── DB / loading ────────────────────────────────────────────────────────────
  const [loadingDB,  setLoadingDB]  = useState(IS_DB_CONFIGURED)
  const [noSchedule, setNoSchedule] = useState(false)

  // ── Publish ─────────────────────────────────────────────────────────────────
  const [publishing,    setPublishing]    = useState(false)
  const [publishStatus, setPublishStatus] = useState(null)

  // ── History ─────────────────────────────────────────────────────────────────
  const [showHistory,    setShowHistory]    = useState(false)
  const [savedSchedules, setSavedSchedules] = useState([])

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [showSlack, setShowSlack] = useState(false)

  // ── On mount ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem('shift_admin') === '1') setAdminMode(true)
    if (IS_DB_CONFIGURED) {
      loadLatestSchedule()
    } else {
      setLoadingDB(false)
    }
  }, [])

  // ── Derived names list from textarea ────────────────────────────────────────
  const namesList = namesInput.split('\n').map(n => n.trim()).filter(Boolean)

  // ── Supabase helpers ─────────────────────────────────────────────────────────
  async function loadLatestSchedule() {
    setLoadingDB(true)
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
    if (data && data.length > 0) {
      applyScheduleData(data[0])
      setNoSchedule(false)
    } else {
      setNoSchedule(true)
    }
    setLoadingDB(false)
  }

  function applyScheduleData(s) {
    // Support both v1 (array) and v2 (object with metadata)
    const raw = s.assignments
    if (Array.isArray(raw)) {
      // v1 legacy format
      setAssignments(raw)
    } else if (raw?.v === 2) {
      setAssignments(raw.people || [])
      if (raw.customCategories) setCategories({ ...DEFAULT_CATEGORIES, ...raw.customCategories })
      if (raw.categoryAssignments) setCategoryAssignments(raw.categoryAssignments)
      if (raw.namesInput) setNamesInput(raw.namesInput)
    }
    setWeekStart(s.start_date)
    setWeekEnd(s.end_date)
    setGenerated(true)
    setEditCount(0)
  }

  async function publishSchedule() {
    if (!supabase || !assignments.length) return
    setPublishing(true)
    const customCategories = Object.fromEntries(
      Object.entries(categories).filter(([k]) => !DEFAULT_CATEGORIES[k])
    )
    await supabase.from('schedules').update({ is_active: false }).not('id', 'is', null)
    const { error } = await supabase.from('schedules').insert({
      start_date: weekStart,
      end_date:   weekEnd,
      assignments: {
        v: 2,
        people:             assignments,
        customCategories,
        categoryAssignments,
        namesInput,
      },
      is_active: true,
    })
    setPublishing(false)
    setPublishStatus(error ? 'error' : 'success')
    setTimeout(() => setPublishStatus(null), 4000)
  }

  async function loadHistory() {
    if (!supabase) return
    const { data } = await supabase
      .from('schedules')
      .select('id, start_date, end_date, created_at, is_active, assignments')
      .order('created_at', { ascending: false })
      .limit(20)
    setSavedSchedules(data || [])
    setShowHistory(true)
  }

  async function setActiveSchedule(id) {
    await supabase.from('schedules').update({ is_active: false }).not('id', 'is', null)
    await supabase.from('schedules').update({ is_active: true }).eq('id', id)
    setShowHistory(false)
    loadLatestSchedule()
  }

  // ── Generate ─────────────────────────────────────────────────────────────────
  function generate() {
    if (!namesList.length) return
    setAssignments(generateAssignments(namesList, categoryAssignments, customCategoriesOnly(), weekStart, weekEnd))
    setGenerated(true)
    setEditMode(false)
    setEditCount(0)
  }

  function customCategoriesOnly() {
    return Object.fromEntries(
      Object.entries(categories).filter(([k]) => !DEFAULT_CATEGORIES[k])
    )
  }

  // ── Category manager callbacks ────────────────────────────────────────────
  function handleCategoryUpdate(payload) {
    if (payload.type === 'assignments') {
      setCategoryAssignments(payload.assignments)
    } else if (payload.type === 'newCategory') {
      setCategories(prev => ({ ...prev, [payload.key]: payload.data }))
    } else if (payload.type === 'editCategory') {
      setCategories(prev => ({ ...prev, [payload.key]: { ...prev[payload.key], ...payload.data } }))
    }
  }

  // ── Edit mode: cycle shift on click ─────────────────────────────────────────
  function cycleShift(personIdx, dateStr, isWeekend) {
    setAssignments(prev => prev.map((p, i) => {
      if (i !== personIdx) return p
      const cur = p.schedule[dateStr]
      let next
      if (isWeekend) {
        const cycle = ['weekend', 'wrapup', 'off']
        next = cycle[(cycle.indexOf(cur) + 1) % cycle.length]
      } else {
        const cycle = ['morning', 'evening', 'off']
        next = cycle[(cycle.indexOf(cur) + 1) % cycle.length]
      }
      return { ...p, schedule: { ...p.schedule, [dateStr]: next } }
    }))
    setEditCount(c => c + 1)
  }

  function signOut() {
    setAdminMode(false)
    sessionStorage.removeItem('shift_admin')
  }

  // ── Derived display data ─────────────────────────────────────────────────────
  const weekLabel = `${formatDate(weekStart)} – ${formatDate(weekEnd)}`
  const rangedays = weekStart && weekEnd ? getDaysInRange(weekStart, weekEnd) : []

  const dayRows = rangedays.map(({ dateStr, dayName, isWeekend }) => ({
    day:      dayName,
    dateStr,
    isWeekend,
    morning:  assignments.filter(p => p.schedule[dateStr] === 'morning').map(p => p.name),
    evening:  assignments.filter(p => p.schedule[dateStr] === 'evening').map(p => p.name),
    weekend:  assignments.filter(p => p.schedule[dateStr] === 'weekend').map(p => p.name),
    wrapup:   assignments.filter(p => p.schedule[dateStr] === 'wrapup').map(p => p.name),
    off:      assignments.filter(p => p.schedule[dateStr] === 'off').map(p => p.name),
  }))

  const maxM = Math.max(2, ...dayRows.map(r => r.morning.length + r.weekend.length))
  const maxE = Math.max(2, ...dayRows.map(r => Math.max(r.evening.length, r.wrapup.length)))

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '16px' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* ── Top bar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1f2937' }}>CS Team Shift Tracker</h1>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Weekdays 8am–8pm · Weekends 10am–5pm</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} className="no-print">
            {IS_DB_CONFIGURED && (
              <button className="btn btn-outline btn-sm" onClick={loadLatestSchedule}>🔄 Refresh</button>
            )}
            {adminMode ? (
              <button className="btn btn-outline btn-sm" onClick={signOut}
                style={{ color: '#dc2626', borderColor: '#dc2626' }}>
                🔓 Admin — Sign Out
              </button>
            ) : (
              <button className="btn btn-outline btn-sm" onClick={() => setShowPinModal(true)}>
                🔒 Admin Login
              </button>
            )}
          </div>
        </div>

        {/* ── DB not configured banner ── */}
        {!IS_DB_CONFIGURED && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }} className="no-print">
            <strong style={{ color: '#92400e' }}>⚠️ Database not connected.</strong>
            <span style={{ color: '#78350f', fontSize: 13, marginLeft: 6 }}>
              See <strong>SETUP.md</strong> in the project folder to connect Supabase. Schedules won't be saved until then.
            </span>
          </div>
        )}

        {/* ── Category legend ── */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Object.keys(categories).length, 4)},1fr)`, gap: 10, marginBottom: 14 }} className="no-print">
          {Object.entries(categories).map(([k, m]) => (
            <div key={k} style={{ background: m.cardBg, border: `1px solid ${m.border}`, borderRadius: 10, padding: '10px 12px' }}>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.tagBg, color: m.tagColor, marginBottom: 4 }}>
                Category {k}
              </span>
              <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.4 }}>{m.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Admin panel ── */}
        {adminMode && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: 20, marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }} className="no-print">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
              ✏️ Admin Panel
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {/* Names */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  Team Members <span style={{ fontWeight: 400, color: '#9ca3af' }}>(one per line)</span>
                </label>
                <textarea
                  style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 13, height: 120, resize: 'vertical', fontFamily: 'monospace', outline: 'none' }}
                  placeholder={'Bridget\nDee\nGlory\nLucky\nLola\nBernard\nHosea'}
                  value={namesInput}
                  onChange={e => setNamesInput(e.target.value)}
                />
                {namesList.length > 0 && (
                  <button className="btn btn-outline btn-sm" style={{ marginTop: 8 }}
                    onClick={() => setShowCatManager(true)}>
                    👥 Assign Categories ({Object.values(categoryAssignments).filter(Boolean).length}/{namesList.length} assigned)
                  </button>
                )}
              </div>

              {/* Date pickers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 170 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Schedule Starting</label>
                  <input type="date" value={weekStart} onChange={e => handleStartChange(e.target.value)}
                    style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Schedule Ending</label>
                  <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)}
                    style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 10px', fontSize: 13, width: '100%', outline: 'none' }} />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-green" onClick={generate}>⚡ Generate Schedule</button>
              {generated && <button className="btn btn-outline" onClick={generate}>🔀 Reshuffle</button>}
              {generated && (
                <button className="btn btn-outline"
                  onClick={() => { setEditMode(e => !e); if (!editMode) setView('byPerson') }}
                  style={editMode ? { border: '2px solid #dc2626', color: '#dc2626' } : {}}>
                  {editMode ? `✏️ Editing (${editCount} change${editCount !== 1 ? 's' : ''})` : '✏️ Manual Edit'}
                </button>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {IS_DB_CONFIGURED && generated && (
                  <>
                    <button className="btn btn-green" onClick={publishSchedule} disabled={publishing}>
                      {publishing ? '⏳ Publishing…' : '📤 Publish Schedule'}
                    </button>
                    <button className="btn btn-outline" onClick={loadHistory}>📋 History</button>
                  </>
                )}
                {generated && <button className="btn btn-outline" onClick={() => exportCSV(assignments, weekStart, weekEnd)}>📥 CSV</button>}
                {generated && <button className="btn btn-outline" style={{ color: '#4a154b' }} onClick={() => setShowSlack(true)}>💬 Slack</button>}
              </div>
            </div>

            {/* Publish status */}
            {publishStatus === 'success' && (
              <p style={{ color: '#16a34a', fontSize: 13, marginTop: 10, fontWeight: 600 }}>
                ✅ Schedule published! The team will see it when they refresh.
              </p>
            )}
            {publishStatus === 'error' && (
              <p style={{ color: '#dc2626', fontSize: 13, marginTop: 10 }}>❌ Publish failed. Check your Supabase connection.</p>
            )}
          </div>
        )}

        {/* ── Edit mode banner ── */}
        {editMode && (
          <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }} className="no-print">
            <span style={{ fontSize: 18 }}>✏️</span>
            <p style={{ fontSize: 13, color: '#78350f' }}>
              <strong>Edit Mode</strong> — click any cell to cycle shifts. {editCount > 0 && `${editCount} change${editCount !== 1 ? 's' : ''} made.`}
            </p>
            <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setEditMode(false)}>Done</button>
          </div>
        )}

        {/* ── Loading state ── */}
        {loadingDB && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <p style={{ fontSize: 18 }}>⏳</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>Loading latest schedule…</p>
          </div>
        )}

        {/* ── No schedule state ── */}
        {!loadingDB && noSchedule && !adminMode && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <p style={{ fontSize: 32 }}>📅</p>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginTop: 12 }}>No schedule published yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Check back soon — your manager will publish the schedule here shortly.</p>
          </div>
        )}

        {/* ── Schedule output ── */}
        {!loadingDB && generated && (
          <>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: '#374151' }}>{weekLabel}</h2>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Starting:</span> {formatDate(weekStart)}
                  &nbsp;&nbsp;→&nbsp;&nbsp;
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Ending:</span> {formatDate(weekEnd)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }} className="no-print">
                {!adminMode && (
                  <button className="btn btn-outline btn-sm" onClick={() => exportCSV(assignments, weekStart, weekEnd)}>📥 CSV</button>
                )}
                {['schedule', 'byPerson'].map(v => (
                  <button key={v} onClick={() => setView(v)} style={{
                    borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600,
                    border:      view === v ? 'none' : '1px solid #d1d5db',
                    background:  view === v ? '#1f2937' : 'white',
                    color:       view === v ? 'white'   : '#4b5563',
                    cursor: 'pointer',
                  }}>
                    {v === 'schedule' ? 'Schedule' : 'Per Person'}
                  </button>
                ))}
              </div>
            </div>

            {/* Shift legend */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }} className="no-print">
              {Object.entries(SHIFT_LABELS).map(([k, v]) => (
                <span key={k} style={{ background: v.bg, color: v.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                  {v.label}{v.time ? ` · ${v.time}` : ''}
                </span>
              ))}
            </div>

            {/* Tables */}
            {view === 'schedule' && <ScheduleTable dayRows={dayRows} maxM={maxM} maxE={maxE} />}
            {view === 'byPerson' && (
              <PersonTable
                rangedays={rangedays}
                assignments={assignments}
                categories={categories}
                editMode={editMode}
                onCycleShift={cycleShift}
              />
            )}

            {/* Category assignment pills */}
            <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 16px', marginTop: 14, boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
                Category Assignments
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {assignments.map((p, i) => {
                  const m = categories[p.catKey] || Object.values(categories)[0]
                  return (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: m.cardBg, border: `1px solid ${m.border}`, borderRadius: 20, padding: '4px 12px', fontSize: 13 }}>
                      <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: m.tagBg, color: m.tagColor }}>{p.catKey}</span>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{p.name}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showPinModal    && <PinModal onSuccess={() => { setAdminMode(true); sessionStorage.setItem('shift_admin', '1') }} onClose={() => setShowPinModal(false)} />}
      {showSlack       && <SlackModal weekLabel={weekLabel} dayRows={dayRows} assignments={assignments} onClose={() => setShowSlack(false)} />}
      {showHistory     && <HistoryModal schedules={savedSchedules} onLoad={s => { applyScheduleData(s); setShowHistory(false) }} onSetActive={setActiveSchedule} onClose={() => setShowHistory(false)} />}
      {showCatManager  && (
        <CategoryManager
          names={namesList}
          categories={categories}
          categoryAssignments={categoryAssignments}
          onUpdate={handleCategoryUpdate}
          onClose={() => setShowCatManager(false)}
        />
      )}
    </div>
  )
}
