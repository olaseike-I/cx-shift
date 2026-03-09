import { getDaysInRange, formatDate } from './dates'

const LABELS = {
  morning: 'Morning (8am–2pm)',
  evening: 'Evening (2pm–8pm)',
  weekend: 'On Duty (10am–5pm)',
  wrapup:  'Wrap-up',
  off:     'Off',
}

export function exportCSV(assignments, weekStart, weekEnd) {
  const rd     = getDaysInRange(weekStart, weekEnd)
  const header = ['Name', 'Category', ...rd.map(({ dayName, dateStr }) => `${dayName} ${formatDate(dateStr)}`)]
  const rows   = assignments.map(p => [
    p.name,
    `Category ${p.catKey}`,
    ...rd.map(({ dateStr }) => LABELS[p.schedule[dateStr]] || ''),
  ])
  const csv  = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `shift-schedule-${weekStart}-to-${weekEnd}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
