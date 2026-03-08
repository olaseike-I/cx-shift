export default function ScheduleTable({ dayRows, maxM, maxE }) {
  return (
    <div style={{ background:'white', borderRadius:12, border:'1px solid #e5e7eb', overflowX:'auto', boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
      <table style={{ fontSize:13, width:'100%' }}>
        <thead>
          <tr>
            <th style={{ background:'#f3f4f6', padding:'10px 12px', textAlign:'left', width:110, fontWeight:700, color:'#374151' }} />
            <th style={{ background:'#bbf7d0', padding:'10px 8px', textAlign:'center', fontWeight:700, color:'#14532d' }} colSpan={maxM}>
              8 am – 2 pm
            </th>
            <th style={{ background:'#86efac', padding:'10px 8px', textAlign:'center', fontWeight:700, color:'#14532d' }} colSpan={maxE}>
              2 pm – 8 pm
            </th>
            <th style={{ background:'#fef9c3', padding:'10px 8px', textAlign:'center', fontWeight:700, color:'#713f12' }}>
              Off Days
            </th>
          </tr>
        </thead>
        <tbody>
          {dayRows.map((row, idx) => {
            const { day, dateStr, isWeekend, morning, evening, weekend, off } = row
            const showSep = day === 'Monday' && idx > 0
            return (
              <tr key={dateStr} style={{ display: showSep ? undefined : undefined }}>
                {showSep && (
                  <td colSpan={1 + maxM + maxE + 1}
                    style={{ background:'#d1d5db', height:5, padding:0, display:'table-cell' }}
                  />
                )}
                {!showSep && (
                  <>
                    <td style={{ padding:'8px 10px', fontWeight:600, color: isWeekend ? '#92400e' : '#374151', whiteSpace:'nowrap',
                      background: isWeekend ? '#fff7ed' : idx % 2 === 0 ? 'white' : '#f9fafb' }}>
                      <div>{day.slice(0,3)}</div>
                      <div style={{ fontSize:11, color:'#9ca3af', fontWeight:400 }}>{dateStr.slice(5).replace('-','/')}</div>
                    </td>
                    {isWeekend
                      ? Array.from({ length: maxM }).map((_, i) => (
                          <td key={i} style={{ padding:'6px', textAlign:'center', background: weekend[i] ? '#f97316' : '#fff7ed', color: weekend[i] ? 'white' : '#d1d5db' }}>
                            {weekend[i] ? <><div style={{ fontWeight:700 }}>{weekend[i]}</div><div style={{ fontSize:10, opacity:.85 }}>10am–5pm</div></> : '—'}
                          </td>
                        ))
                      : Array.from({ length: maxM }).map((_, i) => (
                          <td key={i} style={{ padding:'8px 6px', textAlign:'center', fontWeight:600,
                            background: morning[i] ? '#22c55e' : '#f9fafb', color: morning[i] ? 'white' : '#d1d5db' }}>
                            {morning[i] || '—'}
                          </td>
                        ))
                    }
                    {isWeekend
                      ? Array.from({ length: maxE }).map((_, i) => (
                          <td key={i} style={{ background:'#fff7ed', color:'#d1d5db', padding:'8px', textAlign:'center' }}>—</td>
                        ))
                      : Array.from({ length: maxE }).map((_, i) => (
                          <td key={i} style={{ padding:'8px 6px', textAlign:'center', fontWeight:600,
                            background: evening[i] ? '#15803d' : '#f9fafb', color: evening[i] ? 'white' : '#d1d5db' }}>
                            {evening[i] || '—'}
                          </td>
                        ))
                    }
                    <td style={{ padding:'8px 6px', textAlign:'center', fontWeight:600,
                      background: isWeekend ? '#fff7ed' : off.length ? '#fde047' : '#f9fafb',
                      color: isWeekend ? '#d1d5db' : off.length ? '#78350f' : '#d1d5db' }}>
                      {!isWeekend && off.length ? off.join(', ') : '—'}
                    </td>
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
