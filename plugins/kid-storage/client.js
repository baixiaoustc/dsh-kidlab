// ============================================================
// kid-storage · client half（浏览器模块，静态客户端 bundle）
// 由客户端模块表按「包名 = 模块 id」装载：window.__ModuleLoader__.load({id, factory})。
//   React 来自模块表（require('react')），不需自带打包；
//   数据走同源只读路由 GET /kid-storage/collect（由本包 host half 注册）。
// 主题：🧳 仓库大管家 —— 把硬盘空间讲成“大仓库/行李箱”的小故事。
// 交互：点击标题折叠/展开，默认只留一行摘要。
// 刻度：文件夹占用条走对数刻度，否则 GB 级目录与 KB 级目录差 5 个数量级，
//       线性刻度会把小目录全压成同一条。
// 会话门禁：见 ONLY_SESSIONS。模块本身是进程级装载的（每个会话的页面都会装入），
//       所以“只在某个会话显示”靠组件里的 sessionId 判断实现，不靠装载层面。
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；两个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行
//    （症状：web boot: 1 entry did not activate）。官方模板 templates/decoration/client.js
//    把所有声明都放进 factory，等效于此。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-storage'
const PATH = '/kid-storage/collect'
const TAG_ID = PKG + '/card.css'
// 只在这些会话里显示这张卡；空数组 [] = 每个会话都显示。
// 会话 id 持久的：页面刷新、重启后都还是它。取当前会话 id：终端执行 `echo $DSH_SESSION_ID`。
const ONLY_SESSIONS = []

const CSS = `
.st-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#43321f;
  background:linear-gradient(150deg,#fff8ec 0%,#ffeecd 55%,#ffe3b3 100%);
  border-radius:24px;padding:16px 18px 14px;
  box-shadow:0 8px 24px rgba(230,160,60,.25),inset 0 0 0 2px rgba(255,255,255,.85);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.45;position:relative;overflow:hidden}
.st-card::after{content:"🧳";position:absolute;right:14px;top:10px;font-size:26px;opacity:.9}
.st-toggle{cursor:pointer;user-select:none}
.st-toggle:hover .st-min{border-color:#e0973a}
.st-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(224,151,58,.4);border-radius:14px}
.st-min .icon{font-size:24px}
.st-min .t{font-weight:800;font-size:15px;color:#43321f}
.st-min .sum{font-size:12px;font-weight:600;color:#a0763c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.st-min .chev{font-size:13px;color:#b07f3a;margin-left:auto}
.st-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;color:#fff;white-space:nowrap}
.st-detail{margin-top:12px}
.st-gauge{background:rgba(255,255,255,.78);border-radius:18px;padding:14px 16px}
.st-gauge .lbl{font-size:12px;color:#a0763c;font-weight:600;margin-bottom:8px}
.st-gauge .bar{display:flex;width:100%;height:14px;background:#f3dfc0;border-radius:99px;overflow:hidden}
.st-gauge .fill{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,#ffd98a,#ffa63e)}
.st-gauge .fig{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#8a6a38}
.st-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px}
.st-cell{background:rgba(255,255,255,.7);border-radius:16px;padding:10px 12px}
.st-cell .t{font-size:11px;color:#b08b52;font-weight:600}
.st-cell .v{font-size:15px;font-weight:800;color:#43321f;word-break:break-all}
.st-cell .s{font-size:11px;color:#a0763c;margin-top:2px}
.st-list{background:rgba(255,255,255,.7);border-radius:16px;padding:10px 12px;margin-top:10px}
.st-list .t{font-size:11px;color:#b08b52;font-weight:600;margin-bottom:6px}
.st-list .row{display:flex;align-items:center;gap:8px;font-size:13px;line-height:2.1}
.st-list .nm{font-weight:700;color:#43321f;white-space:nowrap;width:64px;flex:none}
.st-list .bar{display:flex;flex:1 1 0%;min-width:0;height:8px;background:#f3dfc0;border-radius:99px;overflow:hidden}
.st-list .fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#ffd98a,#ffa63e)}
.st-list .sz{color:#e0932a;font-weight:800;font-size:12px;white-space:nowrap;width:70px;text-align:right;flex:none}
.st-hint{font-size:11px;color:#c6a36b;margin-top:6px}
.st-imgs{background:rgba(255,255,255,.55);border-radius:14px;padding:9px 12px;margin-top:10px;font-size:11px;color:#a0763c;line-height:1.55}
.st-imgs .hd{font-weight:700;color:#8a6a38}
.st-imgs .nm{color:#43321f;font-weight:600}
.st-foot{font-size:11px;color:#c6a36b;margin-top:12px;text-align:right;position:relative}
.st-empty{font-size:12px;color:#b08b52;padding:4px 0}
`

/**
 * 注入本卡片样式；已存在则复用（HMR 重挂载不会叠加）。
 * @returns {HTMLStyleElement|null} 本次真正插入的标签，复用时为 null
 */
const ensureStyles = () => {
  if (document.querySelector('style[data-plugin-css=' + JSON.stringify(TAG_ID) + ']') !== null) return null
  const tag = document.createElement('style')
  tag.dataset.plugin = PKG
  tag.dataset.pluginCss = TAG_ID
  tag.textContent = CSS
  document.head.appendChild(tag)
  return tag
}

/** 仪表条宽度：pct 字符串 → 4%~100%。 */
const barW = (pct) => {
  if (pct === null || pct === undefined) return 0
  const n = parseFloat(String(pct).replace('%', ''))
  return isFinite(n) ? Math.max(4, Math.min(100, n)) : 0
}

// 对数刻度：把 [minKb, maxKb] 映射到 [6%, 100%]。
const logW = (kb, minKb, maxKb) => {
  if (!kb || kb <= 0) return 6
  const lo = Math.log10(1 + Math.max(1, minKb))
  const hi = Math.log10(1 + Math.max(1, maxKb))
  if (hi <= lo) return 100
  const t = (Math.log10(1 + kb) - lo) / (hi - lo)
  return Math.round(Math.max(6, Math.min(100, 6 + t * 94)))
}

window.__ModuleLoader__.load({
  id: PKG,
  factory(require) {
    const React = require('react')

    const rootOf = (d) => (d && d.volumes ? d.volumes.find((v) => v.key === 'root') : null)

    const sumText = (d, err) => {
      if (!d) return err ? '暂时读不到数据（每 8 秒重试）' : '读箱中…'
      const root = rootOf(d)
      if (root) return '还剩 ' + root.avail + ' 空间'
      return '仓库信息就绪'
    }

    const badgeText = (d) => {
      const root = rootOf(d)
      if (root) return root.pct
      return d ? '🚚' : '…'
    }

    const StoragePanel = () => {
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState(null)
      const [expanded, setExpanded] = React.useState(false)

      React.useEffect(() => {
        let alive = true
        const refresh = () => {
          fetch(PATH, { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
            .then((dd) => {
              if (!alive) return
              if (dd && !dd.error) {
                setData(dd)
                setErr(null)
              } else {
                setErr('采集失败')
              }
            })
            .catch(() => {
              if (alive) setErr('读不到数据')
            })
        }
        refresh()
        const id = setInterval(refresh, 8000)
        return () => {
          alive = false
          clearInterval(id)
        }
      }, [])

      const d = data
      const root = rootOf(d)
      const time = d && d.ts ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'
      const vols = (d && d.volumes) || []
      // 挂着的安装包映像（.dmg）单独报一行：它们不算占地方，不能混进分区格子。
      const imgs = (d && d.images) || []

      // 主目录占用榜（最多 6 条，取有值的），横条按对数刻度
      const folds = d && d.folders ? d.folders.filter((f) => f.kb && f.kb > 0) : []
      const shown = folds.slice(0, 6)
      const maxKb = shown.length ? shown[0].kb : 1
      const minKb = shown.length ? shown[shown.length - 1].kb : 1
      const folderRows = shown.map((f) =>
        React.createElement('div', { key: f.key, className: 'row' },
          React.createElement('span', { className: 'nm' }, '📦 ' + f.label),
          React.createElement('span', { className: 'bar' },
            React.createElement('span', { className: 'fill', style: { width: logW(f.kb, minKb, maxKb) + '%' } })),
          React.createElement('span', { className: 'sz' }, f.num === '—' ? '0 ' + (f.unit || 'KB') : f.num + ' ' + f.unit)))

      return React.createElement('div', { className: 'st-card' },
        React.createElement('div', { className: 'st-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
          React.createElement('div', { className: 'st-min' },
            React.createElement('span', { className: 'icon' }, '🧳'),
            React.createElement('span', { className: 't' }, '仓库大管家 · 电脑的东西装哪了'),
            React.createElement('span', { className: 'sum' }, sumText(d, err)),
            React.createElement('span', { className: 'badge', style: { background: '#e0932a' } }, badgeText(d)),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'st-detail' },

          // 根卷空间仪表
          React.createElement('div', { className: 'st-gauge' },
            React.createElement('div', { className: 'lbl' }, '🧳 大仓库还剩多少空位？'),
            React.createElement('div', { className: 'bar' },
              React.createElement('span', { className: 'fill', style: { width: barW(root && root.pct) + '%' } })),
            React.createElement('div', { className: 'fig' },
              React.createElement('span', null, root ? '已用 ' + root.pct + ' · 还能放 ' + root.avail : (err ? '读不到（' + err + '）' : '读取中…')),
              React.createElement('span', null, root ? '总共 ' + root.total : ''))),

          // 分区/数据卷
          React.createElement('div', { className: 'st-grid' },
            (vols.length
              ? vols.slice(0, 4).map((v, i) =>
                  React.createElement('div', { key: i, className: 'st-cell' },
                    React.createElement('div', { className: 't' }, '🗄️ ' + v.label),
                    React.createElement('div', { className: 'v' }, v.avail + ' 空'),
                    React.createElement('div', { className: 's' }, '总 ' + v.total + ' · 已用 ' + v.pct)))
              : React.createElement('div', { className: 'st-cell' },
                  React.createElement('div', { className: 't' }, '🗄️ 分区'),
                  React.createElement('div', { className: 'v' }, d ? '没读到分区' : '读取中…'),
                  React.createElement('div', { className: 's' }, ' ')))),

          // 挂着的安装包映像：只报个数和名字，不参与空间统计
          (imgs.length
            ? React.createElement('div', { className: 'st-imgs' },
                React.createElement('div', { className: 'hd' }, '📀 还挂着 ' + imgs.length + ' 个安装包映像'),
                React.createElement('div', { className: 'nm' }, imgs.map((i) => i.label).join('、')),
                React.createElement('div', null, '就像拆完快递还没扔的纸箱～ 装好软件后可以「推出」它们，不占地方。'))
            : null),

          // 主目录占用榜
          React.createElement('div', { className: 'st-list' },
            React.createElement('div', { className: 't' }, '📦 “我的家”里什么最占地方'),
            (folderRows.length
              ? folderRows
              : React.createElement('div', { className: 'st-empty' }, '还没有扫描到数据…')),
            (folderRows.length
              ? React.createElement('div', { className: 'st-hint' }, '横条按对数刻度，小的也能看清 ~')
              : null)),

          React.createElement('div', { className: 'st-foot' }, '每 8 秒清点一次 ｜ ' + time + (err ? ' ｜ ' + err : '')))
        : null)
    }

    // 会话门禁：dock 槽位 scope=session，组件会拿到 sessionId（也可从 owner prop
    // session.sessionId 读）。外层组件不调用任何 hook，所以“这里不渲染”不会改变
    // 内层组件的 hook 顺序；被挡下的会话里连 8 秒轮询都不会启动。
    const sessionIdOf = (props) => {
      if (!props) return undefined
      if (props.sessionId) return props.sessionId
      return props.session && props.session.sessionId
    }

    const ScopedStoragePanel = (props) => {
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionIdOf(props)) === -1) return null
      return React.createElement(StoragePanel, props)
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock），
    // 输入区不随对话滚动被划走，从而在页面上常驻展示。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => {
            if (tag) tag.remove()
          }
        }, 'kid-storage: styles')
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register({ name: 'conversation.input.dock', id: 'kid-storage', order: 6 }, ScopedStoragePanel))
      },
    }
  },
})
})()
