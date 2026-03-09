export default function ScheduleTable({ dayRows, maxM, maxE }) {
  return (
    <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <table style={{ fontSize: 13, width: '100%' }}>
        <thead>
          <tr>
            <th style={{ background: '#f3f4f6', padding: '10px 12px', textAlign: 'left', width: 110, fontWeight: 700, color: '#374151' }} />
            <th style={{ background: '#bbf7d0', padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#14532d' }} colSpan={maxM}>
              8 am – 2 pm / On Duty
            </th>
            <th style={{ background: '#86efac', padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#14532d' }} colSpan={maxE}>
              2 pm – 8 pm / Wrap-up
            </th>
            <th style={{ background: '#fef9c3', padding: '10px 8px', textAlign: 'center', fontWeight: 700, color: '#713f12' }}>
              Off
            </th>
          </tr>
        </thead>
        {dayRows.map((row, idx) => {
            const { day, dateStr, isWeekend, morning, evening, weekend, wrapup, off } = row
            const showSep = day === 'Monday' && idx > 0

            const bgRow = isWeekend ? '#fff7ed' : idx % 2 === 0 ? 'white' : '#f9fafb'

            // For weekend rows: morning-cols = On Duty, evening-cols = Wrap-up
            const morningSlots = isWeekend ? weekend : morning
            const eveningSlots = isWeekend ? wrapup  : evening
            const offSlots     = isWeekend ? off     : off

            return (
              <tbody key={dateStr}>
                {showSep && (
                  <tr>
                    <td colSpan={1 + maxM + maxE + 1}
                      style={{ background: '#d1d5db', height: 5, padding: 0 }}
                    />
                  </tr>
                )}
              <tr>
                {/* Date cell */}
                <td style={{
                  padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap',
                  color:      isWeekend ? '#92400e' : '#374151',
                  background: bgRow,
                }}>
                  <div>{day.slice(0, 3)}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>
                    {dateStr.slice(5).replace('-', '/')}
                  </div>
                </td>

                {/* Morning / On Duty columns */}
                {Array.from({ length: maxM }).map((_, i) => {
                  const name = morningSlots[i]
                  const bg   = name
                    ? (isWeekend ? '#f97316' : '#22c55e')
                    : bgRow
                  const color = name ? 'white' : '#d1d5db'
                  return (
                    <td key={i} style={{ padding: '6px', textAlign: 'center', background: bg, color }}>
                      {name
                        ? <>
                            <div style={{ fontWeight: 700 }}>{name}</div>
                            <div style={{ fontSize: 10, opacity: .85 }}>
                              {isWeekend ? '10am–5pm' : '8am–2pm'}
                            </div>
                          </>
                        : '—'
                      }
                    </td>
                  )
                })}

                {/* Evening / Wrap-up columns */}
                {Array.from({ length: maxE }).map((_, i) => {
                  const name = eveningSlots[i]
                  const bg   = name
                    ? (isWeekend ? '#e5e7eb' : '#15803d')
                    : bgRow
                  const color = name
                    ? (isWeekend ? '#6b7280' : 'white')
                    : '#d1d5db'
                  return (
                    <td key={i} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, background: bg, color }}>
                      {name
                        ? <>
                            <div style={{ fontWeight: 700 }}>{name}</div>
                            {!isWeekend && <div style={{ fontSize: 10, opacity: .85 }}>2pm–8pm</div>}
                            {isWeekend && <div style={{ fontSize: 10, opacity: .75 }}>Wrap-up</div>}
                          </>
                        : '—'
                      }
                    </td>
                  )
                })}

                {/* Off column */}
                <td style={{
                  padding: '8px 6px', textAlign: 'center', fontWeight: 600,
                  background: offSlots.length ? '#fde047' : bgRow,
                  color:      offSlots.length ? '#78350f' : '#d1d5db',
                }}>
                  {offSlots.length ? offSlots.join(', ') : '—'}
                </td>
              </tr>
              </tbody>
            )
        })}
      </table>
    </div>
  )
}
