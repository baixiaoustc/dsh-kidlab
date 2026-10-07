// ============================================================
// kid-security · client 半部（浏览器模块，静态客户端 bundle）
// 由客户端模块表按「包名 = 模块 id」装载：window.__ModuleLoader__.load({id, factory})。
//   React 来自模块表（require('react')），不需自带打包；
//   数据走同源只读路由 GET /kid-security/collect（由本包 host 半部注册）。
// 由 0.1 动态插件 plugin-kid-security/cordis/client.js 搬迁：
//   host.call('sec:collect') → fetch(PATH)；styles.insert(css) → 自插 <style>；
//   ctx.interval(...) → 浏览器 setInterval（并在 effect 清理里 clearInterval）。
// 主题：🏰 城堡安检卡 —— 电脑是一座小城堡，五道守卫逐一报到。
// 配色：紫罗兰（城堡/骑士），和 memory 的蓝、storage 的橙、sysmon 的绿区分。
// 交互：点击标题折叠/展开，默认只留一行摘要。
// 会话门禁：见 ONLY_SESSIONS。静态 bundle 的 client 半部是进程级模块图
//   （每个会话的页面都会装入），所以「只在某个会话显示」只能在组件里判 sessionId。
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；两个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行
//    （症状：web boot: 1 entry did not activate）。指南第 13 节。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-security'
const PATH = '/kid-security/collect'
const TAG_ID = PKG + '/card.css'
// 只在这些会话里显示这张卡；空数组 [] = 每个会话都显示。
// 会话 id 是持久的：页面刷新、重启后都还是它。取当前会话 id：终端执行 `echo $DSH_SESSION_ID`。
const ONLY_SESSIONS = ['session-0f874f0b-4256-410d-b95c-42ddae484b46']

const CSS = `
.ks-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#2c2350;
  background:linear-gradient(150deg,#f4f1ff 0%,#eae2ff 55%,#ded2ff 100%);
  border-radius:24px;padding:16px 18px 14px;
  box-shadow:0 8px 24px rgba(120,90,220,.25),inset 0 0 0 2px rgba(255,255,255,.85);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.45;position:relative;overflow:hidden}
.ks-card::after{content:"🏰";position:absolute;right:14px;top:10px;font-size:26px;opacity:.9}
.ks-toggle{cursor:pointer;user-select:none}
.ks-toggle:hover .ks-min{border-color:#a48ae0}
.ks-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(120,90,220,.4);border-radius:14px}
.ks-min .icon{font-size:24px}
.ks-min .t{font-weight:800;font-size:15px;color:#2c2350}
.ks-min .sum{font-size:12px;font-weight:600;color:#6f5cae;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.ks-min .chev{font-size:13px;color:#6f5cae;margin-left:auto}
.ks-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;color:#fff;white-space:nowrap}
/* 展开区预算：dock 是 position:sticky;bottom:0 的粘性页脚，展开向上生长。
   沿用 kid-coder 真机联调沉淀的公式（max-height = 视口 − 页脚固定高度），
   预留必须 ≥ 页脚全部固定件：composer 卡 + composer.dock + 其余折叠卡 +
   本卡标题行 ≈ 430px，取 450px 留 20px 余量；绝对上限 480px 防大屏过长。
   预留不足 = 顶部溢出视口外、只能滑会话窗口才能够到（此坑先后以 32px/190px 翻过车）。 */
.ks-detail{margin-top:12px;max-height:min(calc(100vh - 450px),480px);overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.ks-detail::-webkit-scrollbar{width:8px}
.ks-detail::-webkit-scrollbar-thumb{background:rgba(120,90,220,.35);border-radius:99px}
.ks-detail::-webkit-scrollbar-track{background:transparent}
.ks-score{background:rgba(255,255,255,.8);border-radius:18px;padding:14px 16px}
.ks-score .lbl{font-size:12px;color:#6f5cae;font-weight:600;margin-bottom:8px}
.ks-score .bar{height:14px;background:#e2d9fb;border-radius:99px;overflow:hidden}
.ks-score .fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#a48ae0,#7b5cd6)}
.ks-score .fig{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#6f5cae}
.ks-guards{background:rgba(255,255,255,.8);border-radius:16px;padding:10px 12px;margin-top:10px}
.ks-guards .t{font-size:11px;color:#6f5cae;font-weight:600;margin-bottom:6px}
.ks-guard{display:flex;align-items:flex-start;gap:10px;padding:7px 0;border-bottom:1px dashed rgba(120,90,220,.18)}
.ks-guard:last-child{border-bottom:none}
.ks-guard .ge{font-size:20px;line-height:1.2}
.ks-guard .gb{flex:1;min-width:0}
.ks-guard .gn{font-size:13px;font-weight:700;color:#2c2350}
.ks-guard .dot{display:inline-block;width:8px;height:8px;border-radius:99px;margin:0 6px 1px 4px;vertical-align:middle}
.ks-guard .gs{font-size:12px;color:#55497e;margin-top:2px;line-height:1.5}
.ks-guard .gd{font-size:11px;color:#8a7bb8;margin-top:2px;line-height:1.5}
.ks-guard .gh{font-size:11px;color:#a3541e;background:rgba(255,214,153,.35);border-radius:8px;padding:3px 8px;margin-top:5px;display:inline-block}
.ks-log{background:rgba(255,255,255,.8);border:1px dashed rgba(120,90,220,.3);border-radius:12px;
  padding:6px 10px;margin-top:6px;font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:#6f5cae;line-height:1.7}
.ks-foot{font-size:11px;color:#a493d6;margin-top:12px;text-align:right;position:relative}
.ks-empty{font-size:12px;color:#6f5cae;padding:4px 0}
`

/** 状态点 / 状态字 / 折叠摘要，三个纯展示助手。 */
const dotColor = (status) => status === 'good' ? '#3f9b5a'
  : status === 'warn' ? '#e0963a'
  : status === 'bad' ? '#e2593a' : '#8a93a8'

const statusText = (status) => status === 'good' ? '在岗'
  : status === 'warn' ? '要注意'
  : status === 'bad' ? '有缺口'
  : '看不清'

const sumText = (d) => {
  if (!d) return '安检中…'
  const s = d.score || {}
  if (!s.total) return '守卫还没集合好'
  return '守卫在岗 ' + s.good + '/' + s.total
}

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

    function SecurityPanel() {
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
        const timer = setInterval(refresh, 15000)
        return () => { alive = false; clearInterval(timer) }
      }, [])

      const d = data
      const summary = sumText(d)
      const score = d && d.score ? d.score : null
      const level = score && score.level ? score.level : null
      const time = d && d.ts
        ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '—'

      const guards = (d && d.guards) ? d.guards : []
      const guardRows = guards.map((g, i) =>
        React.createElement('div', { key: i, className: 'ks-guard' },
          React.createElement('span', { className: 'ge' }, g.emoji),
          React.createElement('div', { className: 'gb' },
            React.createElement('div', { className: 'gn' },
              g.name,
              React.createElement('span', { className: 'dot', style: { background: dotColor(g.status) } }),
              React.createElement('span', { style: { fontSize: 11, fontWeight: 700, color: dotColor(g.status) } }, statusText(g.status))),
            React.createElement('div', { className: 'gs' }, g.short),
            (g.detail && g.detail.length)
              ? g.detail.map((line, j) => React.createElement('div', { key: j, className: 'gd' }, '· ' + line))
              : null,
            (g.hint && g.status !== 'good')
              ? React.createElement('span', { className: 'gh' }, '🙋 找大人：' + g.hint)
              : null,
            (g.key === 'logbook' && g.recent && g.recent.length)
              ? React.createElement('div', { className: 'ks-log' },
                  g.recent.map((line, j) => React.createElement('div', { key: j }, line)))
              : null)))

      return React.createElement('div', { className: 'ks-card' },
        React.createElement('div', { className: 'ks-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
          React.createElement('div', { className: 'ks-min' },
            React.createElement('span', { className: 'icon' }, '🏰'),
            React.createElement('span', { className: 't' }, '城堡安检 · 电脑的守卫'),
            React.createElement('span', { className: 'sum' }, summary),
            level
              ? React.createElement('span', { className: 'badge', style: { background: level.color } }, level.emoji + ' ' + level.text)
              : React.createElement('span', { className: 'badge', style: { background: '#8a93a8' } }, '⏳ 安检中'),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'ks-detail' },

          // 安全分仪表
          React.createElement('div', { className: 'ks-score' },
            React.createElement('div', { className: 'lbl' }, '🛡️ 守卫都在岗吗？'),
            React.createElement('div', { className: 'bar' },
              React.createElement('span', { className: 'fill', style: { width: (score ? Math.max(4, score.pct) : 4) + '%' } })),
            React.createElement('div', { className: 'fig' },
              React.createElement('span', null,
                score && score.total
                  ? (score.good + ' 道守卫在岗 · 共 ' + score.total + ' 道可检查')
                  : '还没采集到守卫状态…'),
              React.createElement('span', null, score ? score.pct + '% 在岗' : ''))),

          // 五道守卫
          React.createElement('div', { className: 'ks-guards' },
            React.createElement('div', { className: 't' }, '🏰 五道守卫逐一报到'),
            (guardRows.length
              ? guardRows
              : React.createElement('div', { className: 'ks-empty' }, '守卫还没醒…稍等一下'))),

          React.createElement('div', { className: 'ks-foot' },
            '🏰 电脑 = 一座小城堡 ｜ 每 15 秒巡一次城 ｜ ' + time))
        : null)
    }

    /** 会话 id 在两种 prop 形态里都取一遍（槽位不同版本给的不一样）。 */
    const sessionIdOf = (props) => {
      if (props.sessionId) return props.sessionId
      return props.session && props.session.sessionId
    }

    // 外层包装组件不含任何 hook：不在白名单的会话直接 null，
    // 内层组件不挂载，连它的 15 秒轮询一起省掉。
    const ScopedSecurityPanel = (props) => {
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionIdOf(props)) === -1) return null
      return React.createElement(SecurityPanel, props)
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock），
    // 输入区不随对话滚动被划走，从而在页面上常驻展示。
    // 顺序 8：排在 kid-coder/network(5)、kid-storage(6)、kid-memory(7) 之后，安检压轴。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => { if (tag) tag.remove() }
        }, 'kid-security: styles')
        // 必须用 slots.inject：它会等槽位真正被声明，槽位消失时贡献自动撤下。
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'kid-security', order: 8 },
            ScopedSecurityPanel,
          ))
      },
    }
  },
})
})()
