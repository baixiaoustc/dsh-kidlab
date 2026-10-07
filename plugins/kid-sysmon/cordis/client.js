// ============================================================
// kid-sysmon · pkg-12 client half（第五圈「最忙」）
// ============================================================
const CSS = `
.kb-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#4a3f35;
  background:linear-gradient(150deg,#fff6ec 0%,#ffe9d6 100%);border-radius:24px;
  padding:18px 20px 16px;box-shadow:0 6px 20px rgba(212,150,90,.18),inset 0 0 0 2px rgba(255,255,255,.7);
  max-width:620px;line-height:1.4}
.kb-head{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;letter-spacing:.5px}
.kb-bear{font-size:24px}
.kb-score{font-size:13px;font-weight:700;padding:3px 10px;border-radius:999px;margin-left:auto}
.kb-score.ok{background:#7ed29b;color:#fff}
.kb-score.mid{background:#f6c563;color:#7a5412}
.kb-score.bad{background:#ef8f8f;color:#fff}
.kb-sub{font-size:12px;color:#a08a74;margin-top:2px}
.kb-rings{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:14px}
.kb-ring{background:rgba(255,255,255,.65);border-radius:18px;padding:10px 8px;text-align:center}
.kb-ring svg{display:block;margin:0 auto}
.kb-ring .t{font-size:12px;color:#7a6a58;font-weight:600}
.kb-top{font-size:12px;margin-top:12px;color:#7a6a58;background:rgba(255,255,255,.6);border-radius:14px;padding:8px 12px}
.kb-top .row{display:flex;justify-content:space-between;line-height:1.7}
.kb-top .c{color:#5b8dd6;font-weight:600;margin-right:8px}
.kb-foot{font-size:11px;color:#b8a38d;margin-top:10px;text-align:right}
`

const ring = (label, pct, emoji, hi, color) => {
  const R = 40, C = 2 * Math.PI * R
  const val = (typeof pct === 'number' && pct >= 0) ? Math.min(100, Math.round(pct)) : null
  const track = React.createElement('circle', {
    cx: 52, cy: 52, r: R, fill: 'none',
    stroke: '#efe2d2', strokeWidth: 12,
  })
  const dot = val === null ? null : React.createElement('circle', {
    cx: 52, cy: 52, r: R, fill: 'none',
    stroke: color, strokeWidth: 12, strokeLinecap: 'round',
    strokeDasharray: `${(val / 100) * C} ${C}`,
    transform: 'rotate(-90 52 52)',
    style: { filter: `drop-shadow(0 2px 3px ${color}66)` },
  })
  const txt = React.createElement('text', {
    x: 52, y: 57, textAnchor: 'middle', fontSize: 18, fontWeight: 800, fill: color,
  }, val === null ? '?' : val + '%')
  const emo = React.createElement('text', { x: 52, y: 26, textAnchor: 'middle', fontSize: 14 }, emoji)
  const svg = React.createElement('svg', { viewBox: '0 0 104 104', width: 88, height: 88 },
    track, dot, emo, txt)
  return React.createElement('div', { className: 'kb-ring' }, svg,
    React.createElement('div', { className: 't' }, label))
}

const emoticon = (score) => {
  if (score >= 80) return '🐻 超健康！电脑精神棒棒哒 ✨'
  if (score >= 55) return '🐻 还行～它有点累，注意休息 💤'
  return '🐻 唔…它好累呀，快让它歇歇 🔥'
}

const CutePanel = (props) => {
  const ctx = props.ctx
  const [data, setData] = React.useState(null)
  React.useEffect(() => {
    let alive = true
    const refresh = () => host.call('sysmon:collect', { scope: 'all' })
      .then((d) => { if (alive && d) setData(d) })
      .catch(() => {})
    refresh()
    const stop = ctx.interval(refresh, 5000)
    return () => { alive = false; if (stop) stop() }
  }, [])

  const d = data
  const cpu = d && d.cpu ? (typeof d.cpu.pct === 'number' ? d.cpu.pct : null) : null
  const mem = d && d.mem ? (typeof d.mem.pct === 'number' ? d.mem.pct : null) : null
  const disk = d && d.disk ? d.disk.pct : null
  const batt = d && d.batt ? d.batt.pct : null
  const busy = d && d.topProc ? d.topProc : null
  const score = (cpu !== null && mem !== null && disk !== null)
    ? Math.round((100 - cpu) * 0.5 + (100 - mem) * 0.3 + (100 - disk) * 0.2)
    : null
  const scoreCls = score === null ? '' : (score >= 80 ? 'ok' : (score >= 55 ? 'mid' : 'bad'))
  const time = d && d.ts ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

  const cpuColor = cpu === null ? '#c9b8a8' : (cpu < 60 ? '#5ec876' : (cpu < 85 ? '#f2a94e' : '#ef6f6f'))
  const memColor = mem === null ? '#c9b8a8' : (mem < 75 ? '#5b9bf0' : (mem < 90 ? '#f2a94e' : '#ef6f6f'))
  const diskColor = disk === null ? '#c9b8a8' : (disk < 80 ? '#a97ff0' : (disk < 92 ? '#f2a94e' : '#ef6f6f'))
  const battColor = batt === null ? '#c9b8a8' : (batt < 20 ? '#ef6f6f' : '#7ed29b')
  const busyColor = !busy || typeof busy.pct !== 'number' ? '#c9b8a8'
    : (busy.pct < 40 ? '#5ec876' : (busy.pct < 70 ? '#f2a94e' : '#ef6f6f'))

  const topRows = d && d.top && d.top.length
    ? d.top.slice(0, 4).map((l, i) => {
        const parts = l.trim().split(/\s+/)
        const pid = parts[0], cp = parts[1], cmd = parts.slice(3).join(' ') || parts[2]
        return React.createElement('div', { key: i, className: 'row' },
          React.createElement('span', null,
            React.createElement('span', { className: 'c' }, cp + '%'), cmd || '—'),
          React.createElement('span', null, 'PID ' + pid))
      })
    : null

  return React.createElement('div', { className: 'kb-card' },
    React.createElement('div', { className: 'kb-head' },
      React.createElement('span', { className: 'kb-bear' }, '🐻'),
      React.createElement('span', null, '小熊体检 · 这台电脑'),
      React.createElement('span', { className: 'kb-score ' + scoreCls },
        score === null ? '…' : '健康 ' + score)),
    React.createElement('div', { className: 'kb-sub' },
      emoticon(score) +
      (d && d.cpu && d.cpu.model ? ' ｜ ' + d.cpu.model.replace(/\(R\)|\(TM\)|CPU @.*$/g, '') : '')),
    React.createElement('div', { className: 'kb-rings' },
      ring('CPU', cpu, cpu !== null && cpu < 60 ? '🙂' : (cpu !== null && cpu < 85 ? '😅' : '🥵'), true, cpuColor),
      ring('内存', mem, mem < 80 ? '🍮' : '🫙', true, memColor),
      ring('磁盘', disk, disk < 85 ? '🗄️' : '📦', true, diskColor),
      ring('电池', batt, batt !== null && batt < 20 ? '🔋' : '🔌', true, battColor),
      ring('最忙', busy ? busy.pct : null, busy ? '🏃' : '?', true, busyColor)),
    React.createElement('div', { className: 'kb-foot' },
      (busy && busy.name ? '最忙：' + busy.name + ' ' + (typeof busy.pct === 'number' ? busy.pct + '%' : '') + ' ｜ ' : '') +
      '每 5 秒偷偷看一眼 ｜ ' + time),
    topRows ? React.createElement('div', { className: 'kb-top' },
      React.createElement('div', { style: { fontWeight: 700, marginBottom: 4 } }, '谁在用电脑呢？'),
      topRows) : null)
}

return {
  inject: ['slots', 'timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (!slots) return
    ctx.effect(() => styles.insert(CSS), 'kid-sysmon: styles')
    slots.inject('tool.view.cordis', () => slots.register(
      { name: 'tool.view.cordis', key: 'self' },
      (props) => React.createElement(CutePanel, Object.assign({}, props, { ctx })),
    ))
  },
}