// ============================================================
// kid-3d · client 半部（浏览器模块，静态客户端 bundle）
//
// 一个包 = 插件行 + 卡片：host 半部 `lib/index.js` 既注册 7 个 kid3d_* 工具，
// 也把卡片要的两条只读路由挂到 Web 服务器上；client 半部（本文件）在输入框
// 上方画那张「🧱 小小 3D 积木工坊」卡片。两半同属 @kidlab/dsh-kid-3d，
// 和合并后的 🧳 kid-storage 一个套路（见迁移指南 §14）。
//
// 装载方式：页面按「包名 = 模块 id」把它当 classic script 执行，调用
//   window.__ModuleLoader__.load({ id, factory })；factory 返回 { inject, apply(ctx) }。
//   React 从模块表里 require('react')，本文件不自带打包。
//   ⚠️ 模块 id 必须**正好等于包名**：client 模块表就是按包名列的。
// 数据来源：host 半部注册的两条同源只读路由（实现在 src/card.ts → lib/card.js）
//   GET /kid-3d/state         —— 工坊现状（作品名/件数/颜色/形状/占地/存档/文件）
//   GET /kid-3d/preview.svg   —— 现场渲一张等距小图（当作 <img> 显示）
//   会话 id 通过 ?session= 传给路由，路由再问 sessions 服务要这个会话的工作目录。
//
// 主题：🧱 积木工坊 —— 和 🧳 大仓库（kid-storage）、🦉 工作台（kid-memory）配对，
//   那两张讲电脑自己，这张讲小朋友刚搭出来的作品。
// 交互：点标题折叠/展开，默认只留一行摘要；展开后左边是作品小图，右边是清单。
//
// 会话门禁：见 ONLY_SESSIONS。这里是**所有会话可见**（空数组），和系列其它 7 张卡一致。
//   模块本身是进程级装载的（每个会话的页面都装），判断只能在组件里做，
//   注册层没有 session 维度。
//
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；两个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行
//    （症状：web boot: 1 entry did not activate）。官方模板 templates/decoration/client.js
//    把所有声明都放进 factory，等效于此。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-3d'
const PATH_STATE = '/kid-3d/state'
const PATH_PREVIEW = '/kid-3d/preview.svg'
const TAG_ID = PKG + '/card.css'
// 只在这些会话里显示这张卡；空数组 [] = 每个会话都显示（系列统一口径）。
// 会话 id 是持久的，页面刷新、dsh web 重启后都还是它。当前会话 id 从终端 `echo $DSH_SESSION_ID` 取。
const ONLY_SESSIONS = []
// 小图尺寸（像素）：只是给 <img> 的渲染尺寸，真正画多大由服务端按这个参数渲。
const SHOT_W = 520
const SHOT_H = 380

const CSS = `
.k3-card{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB",sans-serif;
  color:#22392c;background:linear-gradient(150deg,#f2fbf4 0%,#e3f6e8 55%,#d2efdc 100%);
  border-radius:24px;padding:16px 18px 14px;width:100%;max-width:100%;box-sizing:border-box;
  line-height:1.45;position:relative;overflow:hidden;
  box-shadow:0 8px 24px rgba(70,170,110,.22),inset 0 0 0 2px rgba(255,255,255,.85)}
.k3-toggle{cursor:pointer;user-select:none}
.k3-min{display:flex;align-items:center;gap:10px;padding:6px 2px;
  border:2px dashed rgba(70,170,110,.4);border-radius:14px}
.k3-min:hover{border-color:#4caf50}
.k3-min .icon{font-size:24px;line-height:1}
.k3-min .t{font-weight:800;font-size:15px;color:#22392c;white-space:nowrap}
.k3-min .sum{font-size:12px;font-weight:600;color:#5d8a6e;flex:1;min-width:0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.k3-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;
  color:#fff;white-space:nowrap;background:#4caf50}
.k3-min .chev{font-size:13px;color:#5d8a6e}
.k3-detail{margin-top:12px}
.k3-main{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}
.k3-shot{flex:1 1 260px;min-width:0;background:rgba(255,255,255,.78);border-radius:18px;padding:10px}
.k3-shot img{display:block;width:100%;height:auto;border-radius:12px}
.k3-shot .cap{font-size:11px;color:#7ba189;font-weight:600;margin-top:6px;text-align:center}
.k3-shot .none{font-size:12px;color:#7ba189;padding:24px 4px;text-align:center}
.k3-grid{flex:1 1 300px;min-width:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
.k3-cell{background:rgba(255,255,255,.7);border-radius:16px;padding:10px 12px;min-width:0}
.k3-cell .t{font-size:11px;color:#7ba189;font-weight:600}
.k3-cell .v{font-size:15px;font-weight:800;color:#22392c;word-break:break-word}
.k3-cell .s{font-size:11px;color:#5d8a6e;margin-top:2px}
.k3-row{background:rgba(255,255,255,.7);border-radius:16px;padding:10px 12px;margin-top:10px}
.k3-row .t{font-size:11px;color:#7ba189;font-weight:600;margin-bottom:6px}
.k3-chips{display:flex;flex-wrap:wrap;gap:6px}
.k3-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:#22392c;
  background:rgba(255,255,255,.85);border-radius:999px;padding:3px 10px}
.k3-chip .dot{width:11px;height:11px;border-radius:50%;display:inline-block;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}
.k3-files{font-size:12px;color:#3c6b4f;line-height:1.7;word-break:break-all}
.k3-files .nm{font-weight:700;color:#22392c}
.k3-empty{font-size:12px;color:#7ba189;padding:4px 0}
.k3-foot{font-size:11px;color:#8fb79d;margin-top:12px;text-align:right}
.k3-err{font-size:12px;color:#c0563c;font-weight:700}
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

/** 时间戳 → HH:MM(:SS)。 */
const clock = (value, withSeconds) => {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], withSeconds ? { hour: '2-digit', minute: '2-digit', second: '2-digit' } : { hour: '2-digit', minute: '2-digit' })
}

/** 数字 → 去掉多余的 .0，比如 45.0 → 45、12.5 → 12.5。 */
const num = (value) => (typeof value === 'number' ? String(Math.round(value * 10) / 10) : '—')

window.__ModuleLoader__.load({
  id: PKG,
  factory(require) {
    const React = require('react')

    const sumText = (d, err) => {
      if (d && d.exists) return d.summary || (d.name + ' · ' + d.pieces + ' 件积木')
      if (err) return '暂时读不到工坊（每 8 秒重试）'
      return '看看工坊…'
    }

    const WorkshopPanel = (props) => {
      const sessionId = props && props.sessionId ? props.sessionId : null
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState(null)
      const [expanded, setExpanded] = React.useState(false)

      const url = (path) => path + (sessionId ? '?session=' + encodeURIComponent(sessionId) : '')

      React.useEffect(() => {
        let alive = true
        const refresh = () => {
          fetch(url(PATH_STATE), { cache: 'no-store' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('http ' + r.status))))
            .then((dd) => {
              if (!alive) return
              if (dd && !dd.error) {
                setData(dd)
                setErr(null)
              } else {
                setErr('读不到工坊')
              }
            })
            .catch(() => {
              if (alive) setErr('读不到工坊')
            })
        }
        refresh()
        const id = setInterval(refresh, 8000)
        return () => {
          alive = false
          clearInterval(id)
        }
      }, [sessionId])

      const d = data
      if (!d) return err ? React.createElement('div', { className: 'k3-card' }, React.createElement('div', { className: 'k3-err' }, '🧱 积木工坊：' + err)) : null
      if (!d.exists) return null

      const time = clock(d.updatedAt, false)
      const shapes = (d.shapes || []).slice(0, 6)
      const colors = (d.colors || []).slice(0, 10)
      const files = (d.files || []).slice(0, 8)
      const shot = url(PATH_PREVIEW) + (d.rev ? (sessionId ? '&' : '?') + 'rev=' + encodeURIComponent(d.rev) : '') + '&w=' + SHOT_W + '&h=' + SHOT_H

      return React.createElement('div', { className: 'k3-card' },
        React.createElement('div', { className: 'k3-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
          React.createElement('div', { className: 'k3-min' },
            React.createElement('span', { className: 'icon' }, '🧱'),
            React.createElement('span', { className: 't' }, '积木工坊 · ' + (d.name || '我的作品')),
            React.createElement('span', { className: 'sum' }, sumText(d, err)),
            React.createElement('span', { className: 'badge' }, d.pieces + ' 件'),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'k3-detail' },
          React.createElement('div', { className: 'k3-main' },
            // 作品小图：服务端按作品现画一张等距 SVG，rev = 作品文件 mtime，
            // 作品一变 rev 就变，<img> 才会重新取图。
            React.createElement('div', { className: 'k3-shot' },
              React.createElement('img', { src: shot, width: SHOT_W, height: SHOT_H, alt: (d.name || '作品') + ' 的立体图' }),
              React.createElement('div', { className: 'cap' }, '👀 现在长这样（等距视角）')),

            React.createElement('div', { className: 'k3-grid' },
              React.createElement('div', { className: 'k3-cell' },
                React.createElement('div', { className: 't' }, '🏷️ 作品名'),
                React.createElement('div', { className: 'v' }, d.name || '我的作品'),
                React.createElement('div', { className: 's' }, '最近一次动它 ' + time)),
              React.createElement('div', { className: 'k3-cell' },
                React.createElement('div', { className: 't' }, '🧱 积木'),
                React.createElement('div', { className: 'v' }, d.pieces + ' 件'),
                React.createElement('div', { className: 's' }, shapes.length ? '最多的是' + shapes[0].label : ' ')),
              React.createElement('div', { className: 'k3-cell' },
                React.createElement('div', { className: 't' }, '📐 占了多大地方'),
                React.createElement('div', { className: 'v' }, d.footprint ? num(d.footprint.w) + ' × ' + num(d.footprint.d) + ' 格' : '—'),
                React.createElement('div', { className: 's' }, d.print ? '打出来约 ' + num(d.print.long) + '×' + num(d.print.wide) + '×' + num(d.print.tall) + ' 毫米' : ' ')),
              React.createElement('div', { className: 'k3-cell' },
                React.createElement('div', { className: 't' }, '🌿 地面'),
                React.createElement('div', { className: 'v' }, d.groundLabel || '—'),
                React.createElement('div', { className: 's' }, d.workshop ? d.workshop + '×' + d.workshop + '×' + d.workshop + ' 格的工坊' : ' ')))),

          // 颜色：直接用作品里真实的色号，看卡片就等于看积木
          React.createElement('div', { className: 'k3-row' },
            React.createElement('div', { className: 't' }, '🎨 用了哪些颜色'),
            React.createElement('div', { className: 'k3-chips' },
              (colors.length
                ? colors.map((c, i) =>
                    React.createElement('span', { key: i, className: 'k3-chip' },
                      React.createElement('span', { className: 'dot', style: { background: c.hex } }),
                      c.name + (c.count > 1 ? ' ×' + c.count : '')))
                : React.createElement('div', { className: 'k3-empty' }, '还没有积木～')))),

          React.createElement('div', { className: 'k3-row' },
            React.createElement('div', { className: 't' }, '🧩 都有哪些形状'),
            React.createElement('div', { className: 'k3-chips' },
              (shapes.length
                ? shapes.map((s, i) => React.createElement('span', { key: i, className: 'k3-chip' }, s.label + ' ×' + s.count))
                : React.createElement('div', { className: 'k3-empty' }, '还没有积木～')))),

          React.createElement('div', { className: 'k3-row' },
            React.createElement('div', { className: 't' }, '🎁 已经画好 / 导出的文件 · 存档'),
            React.createElement('div', { className: 'k3-files' },
              (files.length
                ? files.map((f, i) => React.createElement('div', { key: i }, React.createElement('span', { className: 'nm' }, '· ' + f)))
                : React.createElement('div', { className: 'k3-empty' }, '还没画过图，用 kid3d_view 就会有一张')),
              React.createElement('div', null, '· 存档/ 里还收着 ' + (d.archive === null || d.archive === undefined ? '—' : d.archive) + ' 件旧作品'))),

          React.createElement('div', { className: 'k3-foot' }, '每 8 秒看一次 ｜ ' + clock(Date.now(), true) + (err ? ' ｜ ' + err : '')))
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

    const ScopedWorkshopPanel = (props) => {
      const sessionId = sessionIdOf(props)
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionId) === -1) return null
      return React.createElement(WorkshopPanel, { sessionId })
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock），
    // 和 仓库大管家(6) / 记忆小管家(7) 同一排，order 5 排在它们前面。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => {
            if (tag) tag.remove()
          }
        }, 'kid-3d: styles')
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register({ name: 'conversation.input.dock', id: 'kid-3d', order: 12 }, ScopedWorkshopPanel))
      },
    }
  },
})
})()
