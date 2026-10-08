// ============================================================
// kid-sysmon · client 半部（浏览器模块，静态客户端 bundle）
// 由客户端模块表按「包名 = 模块 id」装载：window.__ModuleLoader__.load({id, factory})。
//   React 来自模块表（require('react')）；
//   数据走同源只读路由 GET /kid-sysmon/collect（由本包 host 半部注册）。
// 主题：🐻 小熊体检 —— 四个圆环（CPU/内存/磁盘/电池）+ 最忙进程 + 谁在用电脑。
// 交互：点击标题折叠/展开，默认只留一行摘要。
// ⚠️ 整个文件必须包在 IIFE 里（本文件作为 classic script 直接执行，顶层 const 会进
//    全页共享的全局词法作用域；两个 bundle 都声明 `const PKG` 会 SyntaxError，
//    整包不执行 → 症状 web boot: 1 entry did not activate）。指南第 13 节。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-sysmon'
const PATH = '/kid-sysmon/collect'
const TAG_ID = PKG + '/card.css'
// 只在这些会话里显示这张卡；空数组 [] = 每个会话都显示。
// 会话 id 是持久的：页面刷新、重启后都还是它。取当前会话 id：终端执行 `echo $DSH_SESSION_ID`。
const ONLY_SESSIONS = []

const CSS = `
.kb-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#4a3f35;
  background:linear-gradient(150deg,#fff6ec 0%,#ffe9d6 100%);border-radius:24px;
  padding:16px 18px 14px;box-shadow:0 6px 20px rgba(212,150,90,.18),inset 0 0 0 2px rgba(255,255,255,.7);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.4;position:relative;overflow:hidden}
.kb-toggle{cursor:pointer;user-select:none}
.kb-toggle:hover .kb-min{border-color:#d4964e}
.kb-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(212,150,90,.4);border-radius:14px}
.kb-min .icon{font-size:24px}
.kb-min .t{font-weight:800;font-size:15px;color:#4a3f35}
.kb-min .sum{font-size:12px;font-weight:600;color:#a08a74;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.kb-min .chev{font-size:13px;color:#b07a3e;margin-left:auto}
.kb-score{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;white-space:nowrap}
.kb-score.ok{background:#7ed29b;color:#fff}
.kb-score.mid{background:#f6c563;color:#7a5412}
.kb-score.bad{background:#ef8f8f;color:#fff}
/* 展开区预算：dock 是 position:sticky;bottom:0 的粘性页脚，展开向上生长。
   max-height = 视口 − 页脚固定件（约 450px），绝对上限 480px 防大屏过长。 */
.kb-detail{margin-top:12px;max-height:min(calc(100vh - 450px),480px);overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.kb-detail::-webkit-scrollbar{width:8px}
.kb-detail::-webkit-scrollbar-thumb{background:rgba(212,150,90,.35);border-radius:99px}
.kb-detail::-webkit-scrollbar-track{background:transparent}
.kb-sub{font-size:12px;color:#a08a74;margin-top:2px}
.kb-rings{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-top:12px}
.kb-ring{background:rgba(255,255,255,.65);border-radius:18px;padding:10px 8px;text-align:center}
.kb-ring svg{display:block;margin:0 auto}
.kb-ring .t{font-size:12px;color:#7a6a58;font-weight:600}
.kb-top{font-size:12px;margin-top:12px;color:#7a6a58;background:rgba(255,255,255,.6);border-radius:14px;padding:8px 12px}
.kb-top .row{display:flex;justify-content:space-between;line-height:1.7}
.kb-top .c{color:#5b8dd6;font-weight:600;margin-right:8px}
.kb-foot{font-size:11px;color:#b8a38d;margin-top:10px;text-align:right}
`

/** 插入本卡片样式；已插过就返回 null。 */
const ensureStyles = () => {
  if (document.querySelector('style[data-plugin-css="' + TAG_ID + '"]')) return null
  const el = document.createElement('style')
  el.setAttribute('data-plugin-css', TAG_ID)
  el.setAttribute('data-plugin', PKG)
  el.textContent = CSS
  document.head.appendChild(el)
  return el
}

window.__ModuleLoader__.load({
  // ★ 这里的 id 必须是「裸包名」，要和 package.json 的 name 一模一样。
  id: PKG,
  factory(require) {
    const React = require('react')

    const ring = (label, pct, emoji, color) => {
      const R = 40, C = 2 * Math.PI * R
      const val = (typeof pct === 'number' && pct >= 0) ? Math.min(100, Math.round(pct)) : null
      const track = React.createElement('circle', { cx: 52, cy: 52, r: R, fill: 'none', stroke: '#efe2d2', strokeWidth: 12 })
      const dot = val === null ? null : React.createElement('circle', {
        cx: 52, cy: 52, r: R, fill: 'none', stroke: color, strokeWidth: 12, strokeLinecap: 'round',
        strokeDasharray: `${(val / 100) * C} ${C}`, transform: 'rotate(-90 52 52)',
        style: { filter: `drop-shadow(0 2px 3px ${color}66)` },
      })
      const txt = React.createElement('text', { x: 52, y: 57, textAnchor: 'middle', fontSize: 18, fontWeight: 800, fill: color }, val === null ? '?' : val + '%')
      const emo = React.createElement('text', { x: 52, y: 26, textAnchor: 'middle', fontSize: 14 }, emoji)
      const svg = React.createElement('svg', { viewBox: '0 0 104 104', width: 88, height: 88 }, track, dot, emo, txt)
      return React.createElement('div', { className: 'kb-ring' }, svg, React.createElement('div', { className: 't' }, label))
    }

    const emoticon = (score) => {
      if (score === null) return '量一量中…'
      if (score >= 80) return '🐻 超健康！电脑精神棒棒哒 ✨'
      if (score >= 55) return '🐻 还行～它有点累，注意休息 💤'
      return '🐻 唔…它好累呀，快让它歇歇 🔥'
    }

    function SysmonPanel() {
      const [data, setData] = React.useState(null)
      const [expanded, setExpanded] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        const refresh = () => {
          fetch(PATH, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
            .then((d) => { if (alive && d && !d.error) setData(d) })
            .catch(() => {})
        }
        refresh()
        const timer = setInterval(refresh, 8000)
        return () => { alive = false; clearInterval(timer) }
      }, [])

      const d = data
      const cpu = d && d.cpu && typeof d.cpu.pct === 'number' ? d.cpu.pct : null
      const mem = d && d.mem && typeof d.mem.pct === 'number' ? d.mem.pct : null
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

      const sum = score === null
        ? '量一量中…'
        : ('健康 ' + score + (cpu !== null ? ' · CPU ' + cpu + '%' : '') + (mem !== null ? ' · 内存 ' + mem + '%' : ''))

      const topRows = d && d.top && d.top.length
        ? d.top.slice(0, 4).map((l, i) => {
            const parts = l.trim().split(/\s+/)
            const pid = parts[0], cp = parts[1], cmd = parts.slice(3).join(' ') || parts[2]
            return React.createElement('div', { key: i, className: 'row' },
              React.createElement('span', null, React.createElement('span', { className: 'c' }, cp + '%'), cmd || '—'),
              React.createElement('span', null, 'PID ' + pid))
          })
        : null

      return React.createElement('div', { className: 'kb-card' },
        React.createElement('div', { className: 'kb-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
          React.createElement('div', { className: 'kb-min' },
            React.createElement('span', { className: 'icon' }, '🐻'),
            React.createElement('span', { className: 't' }, '小熊体检 · 这台电脑'),
            React.createElement('span', { className: 'sum' }, sum),
            React.createElement('span', { className: 'kb-score ' + scoreCls }, score === null ? '…' : '健康 ' + score),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'kb-detail' },
          React.createElement('div', { className: 'kb-sub' },
            emoticon(score) + (d && d.cpu && d.cpu.model ? ' ｜ ' + d.cpu.model.replace(/\(R\)|\(TM\)|CPU @.*$/g, '') : '')),
          React.createElement('div', { className: 'kb-rings' },
            ring('CPU', cpu, cpu !== null && cpu < 60 ? '🙂' : (cpu !== null && cpu < 85 ? '😅' : '🥵'), cpuColor),
            ring('内存', mem, mem === null ? '🍮' : (mem < 80 ? '🍮' : '🫙'), memColor),
            ring('磁盘', disk, disk === null ? '🗄️' : (disk < 85 ? '🗄️' : '📦'), diskColor),
            ring('电池', batt, batt !== null && batt < 20 ? '🔋' : '🔌', battColor),
            ring('最忙', busy ? busy.pct : null, busy ? '🏃' : '?', busyColor)),
          topRows ? React.createElement('div', { className: 'kb-top' },
            React.createElement('div', { style: { fontWeight: 700, marginBottom: 4 } }, '谁在用电脑呢？'),
            topRows) : null,
          React.createElement('div', { className: 'kb-foot' },
            (busy && busy.name ? '最忙：' + busy.name + ' ' + (typeof busy.pct === 'number' ? busy.pct + '%' : '') + ' ｜ ' : '') +
            '🐻 每 8 秒偷偷看一眼 ｜ ' + time))
          : null)
    }

    /** 会话 id 在两种 prop 形态里都取一遍（槽位不同版本给的不一样）。 */
    const sessionIdOf = (props) => {
      if (props.sessionId) return props.sessionId
      return props.session && props.session.sessionId
    }

    // 外层包装组件不含任何 hook：不在白名单的会话直接 null。
    const ScopedSysmonPanel = (props) => {
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionIdOf(props)) === -1) return null
      return React.createElement(SysmonPanel, props)
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock）。
    // 顺序 6：坐在 coder(5) 之后，network(7)/storage(8)/memory(9)/security(10)/process(11) 之前。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => { if (tag) tag.remove() }
        }, 'kid-sysmon: styles')
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'kid-sysmon', order: 6 },
            ScopedSysmonPanel,
          ))
      },
    }
  },
})
})()
