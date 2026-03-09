import { getDaysInRange, WEEKDAYS, WEEKENDS, toLocalDateStr } from './dates'

// ── Default categories ────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = {
  A: {
    tagBg: '#fef08a', tagColor: '#854d0e', cardBg: '#fefce8', border: '#fde047',
    desc: '3 workdays (1M+2E) · Thu & Fri Off · Weekends ON DUTY',
    rules: { offDays: ['Thursday', 'Friday'], workShift: 'mixed', weekendStatus: 'duty' },
  },
  B: {
    tagBg: '#bfdbfe', tagColor: '#1e40af', cardBg: '#eff6ff', border: '#93c5fd',
    desc: '5 Workdays · 0 Off · Weekends Wrap-up',
    rules: { offDays: [], workShift: 'fixed', weekendStatus: 'wrapup' },
  },
  C: {
    tagBg: '#bae6fd', tagColor: '#0c4a6e', cardBg: '#f0f9ff', border: '#7dd3fc',
    desc: '4 Workdays · Wed Off · Weekends Wrap-up',
    rules: { offDays: ['Wednesday'], workShift: 'fixed', weekendStatus: 'wrapup' },
  },
  D: {
    tagBg: '#bbf7d0', tagColor: '#14532d', cardBg: '#f0fdf4', border: '#86efac',
    desc: '3 Workdays (all Morning) · Mon & Tue Off · Weekends Wrap-up',
    rules: { offDays: ['Monday', 'Tuesday'], workShift: 'morning', weekendStatus: 'wrapup' },
  },
}

// CAT_META alias kept for any components still referencing it
export const CAT_META = DEFAULT_CATEGORIES

// ── Shift display config ──────────────────────────────────────────────────────
export const SHIFT_LABELS = {
  morning: { label: 'Morning',  time: '8am–2pm',   bg: '#22c55e', color: 'white'   },
  evening: { label: 'Evening',  time: '2pm–8pm',   bg: '#15803d', color: 'white'   },
  weekend: { label: 'On Duty',  time: '10am–5pm',  bg: '#f97316', color: 'white'   },
  wrapup:  { label: 'Wrap-up',  time: '',           bg: '#e5e7eb', color: '#6b7280' },
  off:     { label: 'Off',      time: '',           bg: '#fde047', color: '#78350f' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function mondayOf(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const dow = d.getDay()
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1))
  return toLocalDateStr(d)
}

// ── Main generator ────────────────────────────────────────────────────────────
/**
 * @param {string[]}  names               – ordered list of team member names
 * @param {Object}    categoryAssignments – { name: catKey }
 * @param {Object}    customCategories    – any extra categories beyond defaults
 * @param {string}    weekStart           – YYYY-MM-DD
 * @param {string}    weekEnd             – YYYY-MM-DD
 */
export function generateAssignments(names, categoryAssignments, customCategories, weekStart, weekEnd) {
  const allCats = { ...DEFAULT_CATEGORIES, ...(customCategories || {}) }
  const allDays = getDaysInRange(weekStart, weekEnd)

  // ── Build base schedule per person ──────────────────────────────────────────
  const people = names.map(name => {
    const catKey = categoryAssignments?.[name] || 'B'
    const cat    = allCats[catKey] || allCats['B']
    const { offDays, workShift, weekendStatus } = cat.rules

    // For 'fixed' shift type: each person gets one consistent shift (M or E)
    const fixedShift = workShift === 'fixed'
      ? (Math.random() < 0.5 ? 'morning' : 'evening')
      : null

    const schedule = {}
    allDays.forEach(({ dateStr, dayName, isWeekend }) => {
      if (isWeekend) {
        // Weekends for duty-category people are resolved later
        schedule[dateStr] = weekendStatus === 'duty' ? '__pending__' : (weekendStatus || 'wrapup')
      } else {
        if (offDays.includes(dayName)) {
          schedule[dateStr] = 'off'
        } else if (workShift === 'morning') {
          schedule[dateStr] = 'morning'
        } else if (workShift === 'evening') {
          schedule[dateStr] = 'evening'
        } else if (workShift === 'fixed') {
          schedule[dateStr] = fixedShift
        } else if (workShift === 'mixed') {
          schedule[dateStr] = '__mixed__'   // resolved per-week below
        } else {
          schedule[dateStr] = 'morning'
        }
      }
    })

    return { name, catKey, schedule, rules: cat.rules }
  })

  // ── Resolve 'mixed' shifts: 1 morning per week, rest evenings ───────────────
  const mixedPeople = people.filter(p => p.rules.workShift === 'mixed')

  // Collect unique week-start (Monday) values
  const uniqueWeeks = [...new Set(
    allDays.filter(d => !d.isWeekend).map(d => mondayOf(d.dateStr))
  )]

  mixedPeople.forEach(person => {
    const { offDays } = person.rules
    uniqueWeeks.forEach(wkMonday => {
      const workDays = allDays.filter(({ dateStr, dayName, isWeekend }) =>
        !isWeekend &&
        !offDays.includes(dayName) &&
        mondayOf(dateStr) === wkMonday
      )
      if (!workDays.length) return
      const morningIdx = Math.floor(Math.random() * workDays.length)
      workDays.forEach(({ dateStr }, i) => {
        person.schedule[dateStr] = i === morningIdx ? 'morning' : 'evening'
      })
    })
  })

  // ── Weekend rotation for duty-category people ───────────────────────────────
  const dutyPeople = people.filter(p => p.rules.weekendStatus === 'duty')

  // Initialise all their weekends to 'off'
  dutyPeople.forEach(person => {
    allDays.filter(d => d.isWeekend).forEach(({ dateStr }) => {
      person.schedule[dateStr] = 'off'
    })
  })

  // Build list of weekend pairs [satStr, sunStr]
  const weekendPairs = allDays
    .filter(d => d.dayName === 'Saturday')
    .map(sat => {
      const d = new Date(sat.dateStr + 'T00:00:00')
      d.setDate(d.getDate() + 1)
      return [sat.dateStr, toLocalDateStr(d)]
    })

  if (dutyPeople.length >= 2) {
    const lastAssignedAtIdx = {}  // name → last weekend-pair index they worked
    let lastPairNames       = []

    weekendPairs.forEach((pair, wkIdx) => {
      // Constraint 1: 2-week gap
      let eligible = dutyPeople.filter(p => {
        const last = lastAssignedAtIdx[p.name]
        return last === undefined || (wkIdx - last) >= 2
      })
      // Relax to 1-week gap if not enough
      if (eligible.length < 2) {
        eligible = dutyPeople.filter(p => {
          const last = lastAssignedAtIdx[p.name]
          return last === undefined || (wkIdx - last) >= 1
        })
      }
      // Final fallback
      if (eligible.length < 2) eligible = [...dutyPeople]

      // Constraint 2: no same pair back-to-back
      let pool = [...eligible]
      if (lastPairNames.length === 2 && pool.length > 2) {
        const fresh = pool.filter(p => !lastPairNames.includes(p.name))
        if (fresh.length >= 2) {
          pool = fresh
        } else if (fresh.length === 1) {
          // Allow one repeat, but not both
          const oneRepeat = pool.find(p => lastPairNames.includes(p.name))
          pool = oneRepeat ? [fresh[0], oneRepeat] : fresh
        }
      }

      const chosen = shuffle(pool).slice(0, 2)
      chosen.forEach(person => {
        pair.forEach(dateStr => {
          if (dateStr in person.schedule) person.schedule[dateStr] = 'weekend'
        })
        lastAssignedAtIdx[person.name] = wkIdx
      })
      lastPairNames = chosen.map(p => p.name)
    })

  } else if (dutyPeople.length === 1) {
    // Assign every-other weekend when only one duty person
    weekendPairs.forEach((pair, idx) => {
      if (idx % 2 === 0) {
        pair.forEach(dateStr => {
          dutyPeople[0].schedule[dateStr] = 'weekend'
        })
      }
    })
  }

  // ── Clean up placeholders ────────────────────────────────────────────────────
  people.forEach(person => {
    Object.keys(person.schedule).forEach(dateStr => {
      if (person.schedule[dateStr] === '__pending__' || person.schedule[dateStr] === '__mixed__') {
        person.schedule[dateStr] = 'off'
      }
    })
  })

  return people.map(({ name, catKey, schedule }) => ({ name, catKey, schedule }))
}
