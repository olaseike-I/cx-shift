import { WEEKDAYS, WEEKENDS } from './dates'

export const CAT_META = {
  A: { tagBg:'#fef08a', tagColor:'#854d0e', cardBg:'#fefce8', border:'#fde047', desc:'3 workdays (1M+2E) · 2 Off · Weekends ON DUTY' },
  B: { tagBg:'#bfdbfe', tagColor:'#1e40af', cardBg:'#eff6ff', border:'#93c5fd', desc:'5 Workdays · 0 Off · Weekends Off' },
  C: { tagBg:'#bae6fd', tagColor:'#0c4a6e', cardBg:'#f0f9ff', border:'#7dd3fc', desc:'4 Workdays · 1 Off · Weekends Off' },
  D: { tagBg:'#bbf7d0', tagColor:'#14532d', cardBg:'#f0fdf4', border:'#86efac', desc:'3 Workdays (all Morning) · 2 Off · Weekends Off' },
}

export const SHIFT_LABELS = {
  morning: { label:'Morning', time:'8am–2pm',  bg:'#22c55e', color:'white' },
  evening: { label:'Evening', time:'2pm–8pm',  bg:'#15803d', color:'white' },
  weekend: { label:'On Duty', time:'10am–5pm', bg:'#f97316', color:'white' },
  off:     { label:'Off',     time:'',          bg:'#fde047', color:'#78350f' },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateSchedule(catKey) {
  const sh = shuffle([...WEEKDAYS])
  const s  = {}
  if (catKey === 'A') {
    const work = sh.slice(0, 3), off = sh.slice(3)
    WEEKDAYS.forEach(d => { s[d] = off.includes(d) ? 'off' : d === work[0] ? 'morning' : 'evening' })
    WEEKENDS.forEach(d => (s[d] = 'weekend'))
  } else if (catKey === 'B') {
    const shift = Math.random() < 0.5 ? 'morning' : 'evening'
    WEEKDAYS.forEach(d => (s[d] = shift))
    WEEKENDS.forEach(d => (s[d] = 'off'))
  } else if (catKey === 'C') {
    const shift = Math.random() < 0.5 ? 'morning' : 'evening'
    const work  = sh.slice(0, 4)
    WEEKDAYS.forEach(d => (s[d] = work.includes(d) ? shift : 'off'))
    WEEKENDS.forEach(d => (s[d] = 'off'))
  } else if (catKey === 'D') {
    const work = sh.slice(0, 3)
    WEEKDAYS.forEach(d => (s[d] = work.includes(d) ? 'morning' : 'off'))
    WEEKENDS.forEach(d => (s[d] = 'off'))
  }
  return s
}

export function generateAssignments(names) {
  const cats = ['A','B','C','D']
  const pool = []
  const per  = Math.floor(names.length / 4)
  const rem  = names.length % 4
  cats.forEach((c, i) => {
    const n = per + (i < rem ? 1 : 0)
    for (let j = 0; j < n; j++) pool.push(c)
  })
  const sn = shuffle(names)
  const sp = shuffle(pool)
  return sn.map((name, i) => ({ name, catKey: sp[i], schedule: generateSchedule(sp[i]) }))
}
