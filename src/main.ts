import './style.css'
import { all, put, del, persist, type Task, type Done, type PlantType, type Kind } from './db'
import { T, type Lang } from './i18n'

const $ = <E extends HTMLElement>(s: string) => document.querySelector(s) as E
const params = new URLSearchParams(location.search)
const DEMO = params.has('demo')
let lang: Lang = (localStorage.getItem('u74g-lang') as Lang) || 'ja'
if (params.get('lang') === 'en' || params.get('lang') === 'ja') lang = params.get('lang') as Lang
let sound = localStorage.getItem('u74g-sound') === '1'
let tasks: Task[] = []
let done: Done[] = []
let newKind: Kind = 'habit'
let newPlant: PlantType = 'sakura'
const PLANTS: PlantType[] = ['sakura', 'matcha', 'bamboo', 'moss', 'peony', 'fern']
const EMO: Record<PlantType, string> = { sakura: '🌸', matcha: '🍵', bamboo: '🎋', moss: '🌿', peony: '🌺', fern: '🌱' }

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)
const rnd = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

function season(d = new Date()): 'spring' | 'summer' | 'autumn' | 'winter' {
  const s = params.get('season'); if (s === 'spring' || s === 'summer' || s === 'autumn' || s === 'winter') return s
  const m = d.getMonth() + 1
  return m >= 3 && m <= 5 ? 'spring' : m <= 8 && m >= 6 ? 'summer' : m >= 9 && m <= 11 ? 'autumn' : 'winter'
}
function timeOfDay(d = new Date()): 'dawn' | 'day' | 'dusk' | 'night' {
  const s = params.get('time'); if (s === 'dawn' || s === 'day' || s === 'dusk' || s === 'night') return s
  const h = d.getHours()
  return h >= 5 && h < 9 ? 'dawn' : h < 16 && h >= 9 ? 'day' : h >= 16 && h < 19 ? 'dusk' : 'night'
}

function streakOf(taskId: string | null): { cur: number; best: number } {
  const days = new Set(done.filter(d => taskId === null || d.taskId === taskId).map(d => d.day))
  let cur = 0; let d = new Date()
  if (!days.has(dayKey(d))) d = addDays(d, -1)
  while (days.has(dayKey(d))) { cur++; d = addDays(d, -1) }
  const sorted = [...days].sort(); let best = 0; let run = 0; let prev = ''
  for (const k of sorted) { run = prev && dayKey(addDays(new Date(prev + 'T12:00'), 1)) === k ? run + 1 : 1; best = Math.max(best, run); prev = k }
  return { cur, best }
}

/* ---------- sound ---------- */
let ac: AudioContext | null = null
function chime(up = true) {
  if (!sound) return
  ac ??= new AudioContext()
  const notes = up ? [659.25, 783.99, 987.77] : [523.25]
  notes.forEach((f, i) => {
    const o = ac!.createOscillator(); const g = ac!.createGain(); const t = ac!.currentTime + i * 0.09
    o.type = 'sine'; o.frequency.value = f
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.08, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
    o.connect(g).connect(ac!.destination); o.start(t); o.stop(t + 1.3)
  })
}

/* ---------- garden SVG ---------- */
const SKY = {
  dawn: ['#ffd6e4', '#ffeef2', '#e8f5d8'], day: ['#bfe8d0', '#eaf8ee', '#fff0f5'],
  dusk: ['#ff9cbd', '#ffc9a8', '#d8b4d8'], night: ['#0b1a14', '#16302a', '#3a1d33'],
}
function plantSVG(p: Done, x: number, base: number, sc: number, idx: number, fresh: boolean): string {
  const r = rnd(p.seed); const delay = (r() * 4).toFixed(2); const s = sc * (0.8 + r() * 0.45)
  const se = season()
  const pink = se === 'autumn' ? ['#f48fb1', '#e57373'] : ['#ff8fb8', '#ffc2d8']
  let g = ''
  switch (p.plant) {
    case 'sakura': {
      g += `<path d="M0 0 C -2 -20, 3 -35, 0 -55 M0 -38 C 8 -45, 14 -48, 20 -55 M0 -30 C -9 -36,-14 -40,-19 -46" stroke="#6b3e3e" stroke-width="3.2" fill="none" stroke-linecap="round"/>`
      const pts = [[0, -60], [20, -58], [-19, -50], [10, -66], [-9, -66], [24, -48], [-24, -42]]
      for (const [cx, cy] of pts) g += `<circle cx="${cx}" cy="${cy}" r="${9 + r() * 4}" fill="${r() > .5 ? pink[0] : pink[1]}" opacity=".92"/>`
      if (se === 'winter') g += `<ellipse cx="0" cy="-66" rx="18" ry="4" fill="#fff" opacity=".85"/>`
      break
    }
    case 'matcha': {
      for (let i = 0; i < 6; i++) g += `<ellipse cx="${(i - 2.5) * 6}" cy="${-10 - r() * 10}" rx="${12 + r() * 4}" ry="${10 + r() * 4}" fill="${['#2f7d4a', '#4caf6e', '#7cc98a'][i % 3]}"/>`
      g += `<circle cx="-5" cy="-20" r="2.4" fill="#fff6"/><circle cx="7" cy="-14" r="2" fill="#fff5"/>`
      break
    }
    case 'bamboo': {
      for (let k = 0; k < 3; k++) {
        const bx = (k - 1) * 7, h = 70 + r() * 25
        g += `<rect x="${bx - 2.5}" y="${-h}" width="5" height="${h}" rx="2" fill="${k % 2 ? '#5fae6b' : '#3f8f55'}"/>`
        for (let y = -14; y > -h; y -= 16) g += `<rect x="${bx - 3}" y="${y}" width="6" height="2" fill="#2e6b40"/>`
        g += `<path d="M${bx} ${-h + 8} q 14 -4 20 4 q -12 2 -20 -4 M${bx} ${-h + 20} q -14 -4 -20 4 q 12 2 20 -4" fill="#7fcf8c"/>`
      }
      break
    }
    case 'moss': {
      for (let i = 0; i < 7; i++) g += `<circle cx="${(i - 3) * 5}" cy="${-3 - r() * 5}" r="${5 + r() * 3}" fill="${['#6dbb73', '#95d59b', '#4b9a5a'][i % 3]}"/>`
      g += `<circle cx="-4" cy="-10" r="2" fill="${pink[0]}"/><circle cx="8" cy="-8" r="1.6" fill="${pink[1]}"/>`
      break
    }
    case 'peony': {
      g += `<path d="M0 0 Q 2 -18 0 -30" stroke="#3f8f55" stroke-width="3" fill="none"/><path d="M0 -14 q 10 -6 14 0 q -8 4 -14 0" fill="#5fae6b"/>`
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; g += `<ellipse cx="${Math.cos(a) * 7}" cy="${-34 + Math.sin(a) * 6}" rx="8" ry="6" fill="${i % 2 ? '#ff7aa8' : '#ff9fc1'}" transform="rotate(${i * 45} ${Math.cos(a) * 7} ${-34 + Math.sin(a) * 6})"/>` }
      g += `<circle cx="0" cy="-34" r="5" fill="#ffd1e2"/>`
      break
    }
    case 'fern': {
      for (let i = -2; i <= 2; i++) g += `<path d="M0 0 Q ${i * 8} -20 ${i * 16} -${34 - Math.abs(i) * 5}" stroke="${i % 2 ? '#4caf6e' : '#7cc98a'}" stroke-width="4" fill="none" stroke-linecap="round"/>`
      break
    }
  }
  const cls = fresh ? 'plant fresh' : 'plant'
  return `<g class="${cls}" style="--d:${delay}s;--i:${idx}" transform="translate(${x.toFixed(1)} ${base}) scale(${s.toFixed(2)})"><g class="sway">${g}</g></g>`
}
let lastFresh = ''
function gardenSVG(): string {
  const tod = timeOfDay(); const se = season(); const sky = SKY[tod]
  const W = 800, H = 420
  const recent = done.slice().sort((a, b) => a.at - b.at).slice(-60)
  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="garden">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset=".6" stop-color="${sky[1]}"/><stop offset="1" stop-color="${sky[2]}"/></linearGradient>
  <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${tod === 'night' ? '#1e4a34' : se === 'winter' ? '#e8f3ec' : se === 'autumn' ? '#9cbf6e' : '#8fd39c'}"/><stop offset="1" stop-color="${tod === 'night' ? '#0d2419' : '#3f8f55'}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="#ff9cc4" stop-opacity=".7"/><stop offset="1" stop-color="#ff9cc4" stop-opacity="0"/></radialGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>`
  if (tod === 'night') {
    const r = rnd(74)
    for (let i = 0; i < 50; i++) s += `<circle class="star" style="--d:${(r() * 3).toFixed(2)}s" cx="${r() * W}" cy="${r() * 200}" r="${r() * 1.6 + .4}" fill="#fff"/>`
    s += `<circle cx="650" cy="80" r="60" fill="url(#glow)"/><circle cx="650" cy="80" r="26" fill="#ffe6f0"/><circle cx="660" cy="74" r="24" fill="#16302a"/>`
  } else {
    const sy = tod === 'day' ? 70 : 150
    s += `<circle cx="${tod === 'dusk' ? 160 : 640}" cy="${sy}" r="80" fill="url(#glow)"/><circle cx="${tod === 'dusk' ? 160 : 640}" cy="${sy}" r="30" fill="${tod === 'day' ? '#fff7d6' : '#ffd0de'}"/>`
  }
  // futuristic torii + floating ring (Universe 74 touch)
  s += `<g opacity="${tod === 'night' ? .9 : .55}"><ellipse cx="400" cy="120" rx="120" ry="16" fill="none" stroke="#ff8fb8" stroke-width="2" class="ring"/>
  <path d="M110 300 v-90 M170 300 v-90 M95 215 h90 M100 230 h80" stroke="${tod === 'night' ? '#ff8fb8' : '#d9577f'}" stroke-width="7" stroke-linecap="round"/></g>
  <path d="M0 250 Q 200 190 400 240 T 800 220 V420 H0Z" fill="${tod === 'night' ? '#163a2a' : '#a8dcb2'}" opacity=".8"/>
  <path d="M0 300 Q 220 255 420 300 T 800 290 V420 H0Z" fill="url(#hill)"/>
  <path d="M0 380 Q 400 340 800 380 V420 H0Z" fill="${tod === 'night' ? '#0f2a1d' : '#2f7d4a'}" opacity=".6"/>`
  // plants: arrange in two rows
  recent.forEach((p, i) => {
    const row = i % 2; const base = row ? 395 : 320
    s += plantSVG(p, 30 + p.x * 740, base, row ? 1.05 : .8, i, p.id === lastFresh)
  })
  if (recent.length === 0) s += `<text x="400" y="355" text-anchor="middle" class="hint">🌱</text>`
  // season particles
  const r = rnd(7); const part = se === 'winter' ? '#ffffff' : se === 'autumn' ? '#f48f6b' : se === 'summer' ? '#c8f7a8' : '#ffb7cf'
  const n = se === 'summer' ? 14 : 22
  for (let i = 0; i < n; i++) {
    const cx = r() * W
    s += se === 'summer'
      ? `<circle class="fly" style="--d:${(r() * 6).toFixed(2)}s" cx="${cx}" cy="${180 + r() * 180}" r="2.4" fill="${part}"/>`
      : `<ellipse class="petal" style="--d:${(r() * 9).toFixed(2)}s;--x:${(r() * 120 - 60).toFixed(0)}px" cx="${cx}" cy="-10" rx="${se === 'winter' ? 2.5 : 4}" ry="${se === 'winter' ? 2.5 : 2.4}" fill="${part}"/>`
  }
  return s + '</svg>'
}

/* ---------- UI ---------- */
function render() {
  const t = T[lang]; const today = dayKey()
  document.documentElement.lang = lang; document.title = `${t.title} / ${lang === 'ja' ? 'Sakura Matcha Garden' : 'さくら抹茶の庭'}`
  const active = tasks.filter(x => !x.archived && (x.kind === 'habit' || dayKey(new Date(x.created)) === today || !done.some(d => d.taskId === x.id)))
  const doneToday = new Set(done.filter(d => d.day === today).map(d => d.taskId))
  const nDone = active.filter(x => doneToday.has(x.id)).length
  const ratio = active.length ? nDone / active.length : 0
  const msg = t.msgs[ratio >= 1 ? 3 : ratio >= .6 ? 2 : ratio > 0 ? 1 : 0]
  const all = streakOf(null)
  $('#app').innerHTML = `
  <header>
    <div class="brand"><span class="logo">🌸</span><div><h1>${t.title}</h1><p>${t.sub}</p></div></div>
    <div class="ctrls">
      <button class="pill" id="snd" aria-pressed="${sound}">♪ ${t.sound}: ${sound ? t.on : t.off}</button>
      <div class="lang"><button data-l="ja" aria-pressed="${lang === 'ja'}">日本語</button><button data-l="en" aria-pressed="${lang === 'en'}">English</button></div>
    </div>
  </header>
  <main>
    <section class="garden card">
      <div class="scene">${gardenSVG()}</div>
      <div class="badges"><span>${t.seasons[season()]} · ${t.times[timeOfDay()]}</span><span>${t.plants(done.length)}</span><span>🔥 ${t.streakAll(all.cur)}</span></div>
    </section>
    <section class="side">
      <div class="card summary">
        <h2>${t.summary}</h2>
        <div class="ringwrap"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="16" class="track"/><circle cx="21" cy="21" r="16" class="prog" style="stroke-dasharray:${(ratio * 100.5).toFixed(1)} 100.5"/></svg><b>${Math.round(ratio * 100)}%</b></div>
        <div><p class="big">${t.today(nDone, active.length)}</p><p class="msg">${msg}</p></div>
      </div>
      <div class="card tasks">
        <h2>${t.list}</h2>
        <form id="f">
          <input id="nm" maxlength="60" placeholder="${t.placeholder}" autocomplete="off" />
          <button class="go">${t.add}</button>
          <div class="opts">
            <div class="seg">${(['habit', 'todo'] as Kind[]).map(k => `<button type="button" data-k="${k}" aria-pressed="${newKind === k}">${k === 'habit' ? t.habit : t.todo}</button>`).join('')}</div>
            <div class="plants" aria-label="${t.plant}">${PLANTS.map(p => `<button type="button" title="${t.names[p]}" data-p="${p}" aria-pressed="${newPlant === p}">${EMO[p]}</button>`).join('')}</div>
          </div>
        </form>
        <ul>${active.length ? active.map(x => {
          const on = doneToday.has(x.id); const st = streakOf(x.id)
          return `<li class="${on ? 'on' : ''} ${x.kind}">
            <button class="chk" data-c="${x.id}" aria-pressed="${on}" aria-label="${x.name}">${on ? EMO[x.plant] : ''}</button>
            <div class="tx"><span class="nm">${esc(x.name)}</span><span class="meta">${x.kind === 'habit' ? `${t.names[x.plant]} · 🔥 ${t.streak(st.cur)} · ${t.best(st.best)}` : `${t.todo} · ${t.names[x.plant]}`}</span></div>
            <button class="x" data-d="${x.id}" aria-label="${t.del}">×</button></li>`
        }).join('') : `<li class="empty">${t.empty}</li>`}</ul>
      </div>
    </section>
  </main>
  <footer>${t.foot}</footer>
  <div id="toast"></div>`
  bind()
}
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))
const save = async (s: 'tasks' | 'done', v: Task | Done) => { if (!DEMO) await put(s, v) }
const remove = async (s: 'tasks' | 'done', id: string) => { if (!DEMO) await del(s, id) }

function toast(m: string) { const el = $('#toast'); el.textContent = m; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 1600) }

function bind() {
  document.querySelectorAll<HTMLButtonElement>('[data-l]').forEach(b => b.onclick = () => { lang = b.dataset.l as Lang; localStorage.setItem('u74g-lang', lang); render() })
  $('#snd').onclick = () => { sound = !sound; localStorage.setItem('u74g-sound', sound ? '1' : '0'); render(); chime(false) }
  document.querySelectorAll<HTMLButtonElement>('[data-k]').forEach(b => b.onclick = () => { newKind = b.dataset.k as Kind; keep(); render(); refocus() })
  document.querySelectorAll<HTMLButtonElement>('[data-p]').forEach(b => b.onclick = () => { newPlant = b.dataset.p as PlantType; keep(); render(); refocus() })
  $<HTMLFormElement>('#f').onsubmit = async e => {
    e.preventDefault(); const name = $<HTMLInputElement>('#nm').value.trim(); if (!name) return
    const task: Task = { id: uid(), name, kind: newKind, plant: newPlant, created: Date.now() }
    tasks.push(task); draft = ''; await save('tasks', task); render(); refocus()
  }
  document.querySelectorAll<HTMLButtonElement>('[data-c]').forEach(b => b.onclick = async () => {
    const id = b.dataset.c!; const today = dayKey(); const ex = done.find(d => d.taskId === id && d.day === today)
    if (ex) { done = done.filter(d => d !== ex); await remove('done', ex.id); chime(false) }
    else {
      const task = tasks.find(x => x.id === id)!
      const d: Done = { id: uid(), taskId: id, day: today, at: Date.now(), plant: task.plant, x: Math.random(), seed: 1 + Math.floor(Math.random() * 1e6) }
      done.push(d); lastFresh = d.id; await save('done', d); chime(true)
      render(); toast(`${EMO[task.plant]} ${T[lang].names[task.plant]} ${T[lang].grown}`); return
    }
    render()
  })
  document.querySelectorAll<HTMLButtonElement>('[data-d]').forEach(b => b.onclick = async () => {
    const task = tasks.find(x => x.id === b.dataset.d)!; task.archived = true; await save('tasks', task); render()
  })
  const nm = $<HTMLInputElement>('#nm'); nm.value = draft; nm.oninput = () => { draft = nm.value }
}
let draft = ''
const keep = () => { draft = $<HTMLInputElement>('#nm').value }
const refocus = () => $<HTMLInputElement>('#nm').focus()

function seedDemo() {
  const mk = (name: string, kind: Kind, plant: PlantType): Task => ({ id: uid(), name, kind, plant, created: Date.now() - 20 * 864e5 })
  const ja = lang === 'ja'
  tasks = [
    mk(ja ? '水を一杯のむ' : 'Drink a glass of water', 'habit', 'matcha'),
    mk(ja ? '5分ストレッチ' : '5-minute stretch', 'habit', 'sakura'),
    mk(ja ? '元気の呼吸を1回' : 'One round of Energy Breath', 'habit', 'bamboo'),
    mk(ja ? '日本語の本を10ページ' : 'Read 10 pages', 'habit', 'peony'),
    mk(ja ? 'ゴミ出し' : 'Take out the trash', 'todo', 'moss'),
    mk(ja ? '新しいアプリのアイデアをメモ' : 'Jot down a new app idea', 'todo', 'fern'),
  ]
  tasks.forEach(t => t.created = t.kind === 'todo' ? Date.now() : t.created)
  const r = rnd(42)
  for (let back = 12; back >= 0; back--) {
    const day = dayKey(addDays(new Date(), -back))
    tasks.forEach((t, i) => {
      if (t.kind === 'todo' && back) return
      if (back === 0 && i >= 3) return
      if (back > 0 && r() < (i === 0 ? .05 : .35)) return
      done.push({ id: uid(), taskId: t.id, day, at: Date.now() - back * 864e5 + i, plant: t.plant, x: r(), seed: 1 + Math.floor(r() * 1e6) })
    })
  }
}

async function start() {
  if (DEMO) seedDemo()
  else { await persist(); tasks = await all<Task>('tasks'); done = await all<Done>('done') }
  render()
  setInterval(() => { lastFresh = ''; if (!document.activeElement || document.activeElement.id !== 'nm') render() }, 10 * 60 * 1000)
}
start()
