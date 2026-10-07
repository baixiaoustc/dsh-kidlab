// ============================================================
// kid-network · client 半部（浏览器模块，静态客户端 bundle）
// 由客户端模块表按「包名 = 模块 id」装载：window.__ModuleLoader__.load({id, factory})。
//   React 来自模块表（require('react')），不需自带打包；
//   数据走同源路由 GET /kid-network/collect（由本包 host 半部注册）：
//     fetch(PATH) → 取回 {lan,gw,dns,neighbors,pub,speedKBps,letters,ts} → 每 8 秒自动刷新。
// 主题：🕊️ 信鸽邮局 —— 把网络数据讲成“信鸽送信”的小故事（沿用旧版卡片）。
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；两个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行
//    （症状：web boot: 1 entry did not activate）。迁移指南第 13 节。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-network'
const PATH = '/kid-network/collect'
const TAG_ID = PKG + '/card.css'
// 卡片刷新节奏（毫秒）：与旧版 host.js 的 8 秒轮询一致。
const REFRESH_MS = 8000

const CSS = `
.pg-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#24425c;
  background:linear-gradient(150deg,#eef7ff 0%,#d9efff 55%,#cfe8ff 100%);
  border-radius:24px;padding:18px 20px 16px;
  box-shadow:0 8px 24px rgba(90,160,230,.22),inset 0 0 0 2px rgba(255,255,255,.8);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.45;position:relative;overflow:hidden}
.pg-card::after{content:"☁️";position:absolute;right:14px;top:10px;font-size:26px;opacity:.9}
.pg-head{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;letter-spacing:.5px}
.pg-bird{font-size:26px}
.pg-badge{font-size:12px;font-weight:800;padding:3px 11px;border-radius:999px;margin-left:auto}
.pg-badge.ok{background:#5ec876;color:#fff}
.pg-badge.mid{background:#7fc4ff;color:#fff}
.pg-badge.off{background:#cddae6;color:#5b6f82}
.pg-sub{font-size:12px;color:#5f7d99;margin-top:2px}
.pg-speed{background:rgba(255,255,255,.72);border-radius:20px;padding:14px 16px;margin-top:12px;
  display:flex;align-items:center;gap:14px}
.pg-speed .num{font-size:34px;font-weight:900;color:#2f7de0;line-height:1}
.pg-speed .unit{font-size:13px;font-weight:700;color:#5f8fc0}
.pg-speed .lbl{font-size:12px;color:#5f7d99}
.pg-speed .bird{font-size:30px}
.pg-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
.pg-cell{background:rgba(255,255,255,.66);border-radius:16px;padding:10px 12px}
.pg-cell .t{font-size:11px;color:#7a97b3;font-weight:600}
.pg-cell .v{font-size:14px;font-weight:800;color:#24425c;word-break:break-all}
.pg-cell .s{font-size:11px;color:#6f8ba6;margin-top:2px}
.pg-mail{background:rgba(255,255,255,.66);border-radius:16px;padding:10px 12px;margin-top:10px}
.pg-mail .t{font-size:11px;color:#7a97b3;font-weight:600;margin-bottom:6px}
.pg-mail .row{display:flex;align-items:center;gap:8px;font-size:13px;line-height:2}
.pg-mail .dst{font-weight:700;color:#24425c;white-space:nowrap}
.pg-mail .bar{flex:1;height:7px;background:#dcebfa;border-radius:99px;overflow:hidden}
.pg-mail .fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#7fc4ff,#2f7de0)}
.pg-mail .ms{color:#2f7de0;font-weight:800;font-size:12px;white-space:nowrap}
.pg-foot{font-size:11px;color:#9db8d1;margin-top:12px;text-align:right;position:relative}
.pg-toggle{cursor:pointer;user-select:none}
.pg-toggle:hover .pg-min{border-color:#2f7de0}
.pg-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(47,125,224,.35);border-radius:14px}
.pg-min .chev{font-size:13px;color:#5f8fc0}
.pg-min .sum{font-size:12px;font-weight:600;color:#5f7d99;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pg-detail{margin-top:12px;max-height:min(calc(100vh - 450px),480px);overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.pg-detail::-webkit-scrollbar{width:8px}
.pg-detail::-webkit-scrollbar-thumb{background:rgba(47,125,224,.35);border-radius:99px}
.pg-detail::-webkit-scrollbar-track{background:transparent}
`

/** 把 KB/s 变成 {num, unit}。 */
const fmtKBps = (kb) => {
  if (kb === null || kb === undefined) return null
  if (kb >= 1024) return { num: (kb / 1024).toFixed(2), unit: 'MB/s' }
  return { num: String(kb), unit: 'KB/s' }
}

// 延迟 → 进度条宽度（0~200ms 映射，越快越满）
const barW = (ms) => (ms === null || ms === undefined) ? 0 : Math.max(6, Math.min(100, Math.round((1 - ms / 200) * 100)))

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

    function PigeonPanel() {
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
        const timer = setInterval(refresh, REFRESH_MS)
        return () => { alive = false; clearInterval(timer) }
      }, [])

      const d = data
      const speed = d ? fmtKBps(d.speedKBps) : null
      const pub = d && d.pub ? d.pub : null
      const badgeClass = !d ? 'pg-badge off' : (speed ? 'pg-badge ok' : 'pg-badge mid')
      const badgeText = !d ? '…' : (speed ? '🟢 快递很顺' : '🟠 在找路')
      const who = pub && pub.ip ? `互联网上的身份证：${pub.ip}` : '互联网上的身份证：待联网确认'
      const whoCity = pub && pub.city ? pub.city : ''
      const whoIsp = pub && pub.isp ? pub.isp : ''

      const time = d && d.ts ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

      const letters = d && d.letters && d.letters.length
        ? d.letters.map((L, i) => React.createElement('div', { key: i, className: 'row' },
            React.createElement('span', { className: 'dst' }, '✉️ ' + L.label),
            React.createElement('span', { className: 'bar' },
              React.createElement('span', { className: 'fill', style: { width: barW(L.ms) + '%' } })),
            React.createElement('span', { className: 'ms' },
              L.ms === null ? '找不到路' : L.ms + ' ms')))
        : React.createElement('div', { className: 'row' }, '信鸽还没出发…')

      const summary = !d ? '读信中…'
        : (speed ? '网速 ' + speed.num + ' ' + speed.unit
          : (pub && pub.ip ? 'IP ' + pub.ip : '在找路…'))

      return React.createElement('div', { className: 'pg-card' },
        React.createElement('div', { className: 'pg-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
          React.createElement('div', { className: 'pg-min' },
            React.createElement('span', { className: 'pg-bird' }, '🕊️'),
            React.createElement('span', { style: { fontWeight: 800, fontSize: 15, color: '#24425c' } }, '信鸽邮局 · 网络小探险'),
            React.createElement('span', { className: 'sum' }, summary),
            React.createElement('span', { className: badgeClass }, badgeText),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'pg-detail' },
          React.createElement('div', { className: 'pg-sub' },
            '窝在：' + (d && d.lan ? d.lan : '…') + '（这台电脑在小区的门牌号）'),

          React.createElement('div', { className: 'pg-speed' },
            React.createElement('span', { className: 'bird' }, speed ? '🚀' : '🕊️'),
            React.createElement('div', null,
              React.createElement('div', null,
                React.createElement('span', { className: 'num' }, speed ? speed.num : '…'),
                React.createElement('span', { className: 'unit' }, speed ? ' ' + speed.unit : '')),
              React.createElement('div', { className: 'lbl' },
                speed ? '信鸽一秒钟能驮这么多信！' : '正在量信鸽飞多快…'))),

          React.createElement('div', { className: 'pg-grid' },
            React.createElement('div', { className: 'pg-cell' },
              React.createElement('div', { className: 't' }, '🏠 小区里的家'),
              React.createElement('div', { className: 'v' }, d && d.lan ? d.lan : '…'),
              React.createElement('div', { className: 's' }, '出了门先到保安' + (d && d.gw ? ' ' + d.gw : ''))),
            React.createElement('div', { className: 'pg-cell' },
              React.createElement('div', { className: 't' }, '📮 互联网身份证'),
              React.createElement('div', { className: 'v' }, who),
              React.createElement('div', { className: 's' }, [whoCity, whoIsp].filter(Boolean).join(' · ') || ' ')),
            React.createElement('div', { className: 'pg-cell' },
              React.createElement('div', { className: 't' }, '👨‍👩‍👧‍👦 家里的邻居'),
              React.createElement('div', { className: 'v' }, d && d.neighbors ? d.neighbors + ' 个设备' : '…'),
              React.createElement('div', { className: 's' }, '同一 WiFi 下认识的小伙伴'))),

          React.createElement('div', { className: 'pg-mail' },
            React.createElement('div', { className: 't' }, '✈️ 送信到三站 · 越快越好'),
            letters),

          React.createElement('div', { className: 'pg-foot' },
            '每 8 秒信鸽飞一圈 ｜ ' + time))
        : null)
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock）。
    // 顺序 11：排在 goal(10) 之后、queue(20) 之前，
    // 且不与 coder(5)/storage(6)/memory(7)/security(8)/process(9) 撞。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => { if (tag) tag.remove() }
        }, 'kid-network: styles')
        // 必须用 slots.inject：它会等槽位真正被声明，槽位消失时贡献自动撤下。
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'kid-network', order: 7 },
            PigeonPanel,
          ))
      },
    }
  },
})
})()
