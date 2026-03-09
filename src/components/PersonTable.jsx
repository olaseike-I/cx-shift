import { SHIFT_LABELS } from '../utils/schedule'
import { formatDate } from '../utils/dates'

export default function PersonTable({ rangedays, assignments, categories, editMode, onCycleShift }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <table style={{ fontSize: 12, width: '100%' }}>
        <thead>
          <tr style={{ background: '#f3f4f6' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#374151', minWidth: 100, whiteSpace: 'nowrap' }}>
              Date
            </th>
            {assignments.map((p, i) => {
              const cats = categories || {}
              const m = cats[p.catKey] || Object.values(cats)[0] || { tagBg: '#e5e7eb', tagColor: '#374151' }
              return (
                <th key={i} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, color: '#374151', minWidth: 85 }}>
                  <div>{p.name}</div>
                  <span style={{
                    display: 'inline-block', padding: '1px 6px', borderRadius: 20,
                    fontSize: 10, fontWeight: 700, background: m.tagBg, color: m.tagColor, marginTop: 2,
                  }}>
                    {p.catKey}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {rangedays.map(({ dayName, dateStr, isWeekend }, rIdx) => {
            const showSep = dayName === 'Monday' && rIdx > 0
            return (
              <tr key={dateStr}>
                {showSep && (
                  <td colSpan={1 + assignments.length}
                    style={{ background: '#d1d5db', height: 5, padding: 0 }}
                  />
                )}
                {!showSep && (
                  <>
                    <td style={{
                      padding: '7px 10px', fontWeight: 600, whiteSpace: 'nowrap',
                      color:      isWeekend ? '#92400e' : '#374151',
                      background: isWeekend ? '#fff7ed' : rIdx % 2 === 0 ? 'white' : '#f9fafb',
                    }}>
                      <div>{dayName.slice(0, 3)}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>{formatDate(dateStr)}</div>
                    </td>
                    {assignments.map((p, pi) => {
                      const shiftKey = p.schedule[dateStr] || 'off'
                      const sv       = SHIFT_LABELS[shiftKey] || SHIFT_LABELS.off
                      return (
                        <td key={pi}
                          className={editMode ? 'edit-cell' : ''}
                          onClick={() => editMode && onCycleShift(pi, dateStr, isWeekend)}
                          style={{
                            background: sv.bg, color: sv.color,
                            padding: '6px 4px', textAlign: 'center',
                            cursor: editMode ? 'pointer' : 'default',
                          }}>
                          <div style={{ fontWeight: 700, fontSize: 11 }}>{sv.label}</div>
                          {sv.time && <div style={{ fontSize: 10, opacity: .85 }}>{sv.time}</div>}
                          {editMode && <div style={{ fontSize: 9, opacity: .5 }}>click</div>}
                        </td>
                      )
                    })}
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
