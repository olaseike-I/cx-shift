const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const JS_DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export const WEEKDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday']
export const WEEKENDS = ['Saturday','Sunday']

export function toLocalDateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const n = d.getDate()
  const s = n===1||n===21||n===31 ? 'st' : n===2||n===22 ? 'nd' : n===3||n===23 ? 'rd' : 'th'
  return `${n}${s} ${MONTHS[d.getMonth()]}`
}

export function getMondayStr(ds) {
  const d = new Date(ds + 'T00:00:00')
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return toLocalDateStr(d)
}

export function getDaysInRange(startStr, endStr) {
  const days = []
  const start = new Date(startStr + 'T00:00:00')
  const end   = new Date(endStr   + 'T00:00:00')
  let d = new Date(start)
  while (d <= end) {
    const dayName = JS_DAY_NAMES[d.getDay()]
    days.push({ dateStr: toLocalDateStr(d), dayName, isWeekend: WEEKENDS.includes(dayName) })
    d.setDate(d.getDate() + 1)
  }
  return days
}
