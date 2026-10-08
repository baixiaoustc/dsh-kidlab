// ============================================================
// kid-coder · client 半部（浏览器模块，静态客户端 bundle）
// 由客户端模块表按「包名 = 模块 id」装载：window.__ModuleLoader__.load({id, factory})。
//   React 来自模块表（require('react')），不需自带打包；
//   数据走同源路由 POST /kid-coder/run（由本包 host 半部注册）：
//     点「跑一下」→ 提交 {code} → 就地显示控制台输出 + 海龟图 SVG / matplotlib PNG。
// 主题：🐵 小教室 —— 可折叠。默认示例打开即自动跑一遍，
//   让小朋友一打开就看到“哇，出图了”。
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；两个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行
//    （症状：web boot: 1 entry did not activate）。指南第 13 节。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-coder'
const PATH = '/kid-coder/run'
const TAG_ID = PKG + '/card.css'
// 只在这些会话里显示这张卡；空数组 [] = 每个会话都显示。
// 会话 id 是持久的：页面刷新、重启后都还是它。取当前会话 id：终端执行 `echo $DSH_SESSION_ID`。
const ONLY_SESSIONS = []

const CSS = `
.kc-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#2e3a4d;
  background:linear-gradient(150deg,#f4f8ff 0%,#e8f0ff 55%,#dce9ff 100%);
  border-radius:24px;padding:16px 18px 14px;
  box-shadow:0 8px 24px rgba(70,120,220,.22),inset 0 0 0 2px rgba(255,255,255,.85);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.5;position:relative;overflow:hidden}
.kc-toggle{cursor:pointer;user-select:none}
.kc-toggle:hover .kc-min{border-color:#5a8ee0}
.kc-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(90,142,224,.4);border-radius:14px}
.kc-min .icon{font-size:24px}
.kc-min .t{font-weight:800;font-size:15px;color:#2e3a4d}
.kc-min .sum{font-size:12px;font-weight:600;color:#6d84ad;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.kc-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;color:#fff;background:#5a8ee0;white-space:nowrap}
.kc-min .chev{font-size:13px;color:#4a6fc0;margin-left:auto}
/* 展开区预算：dock 是 position:sticky;bottom:0 的粘性页脚，展开向上生长。
   max-height = 视口 − 页脚固定件（约 450px），绝对上限 480px 防大屏过长；
   预留不足 = 顶部溢出视口外，只能滑会话窗口才能够到（真机联调踩过）。 */
.kc-detail{margin-top:12px;max-height:min(calc(100vh - 450px),480px);overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.kc-detail::-webkit-scrollbar{width:8px}
.kc-detail::-webkit-scrollbar-thumb{background:rgba(90,142,224,.35);border-radius:99px}
.kc-detail::-webkit-scrollbar-track{background:transparent}
.kc-area{width:100%;box-sizing:border-box;border-radius:14px;border:2px solid #cdddfa;
  background:#fff;padding:10px 12px;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;
  color:#2e3a4d;resize:vertical;min-height:120px;outline:none}
.kc-area:focus{border-color:#5a8ee0}
.kc-row{display:flex;align-items:center;gap:8px;margin-top:10px}
.kc-btn{cursor:pointer;border:none;border-radius:12px;padding:8px 18px;font-weight:800;font-size:13px;
  background:linear-gradient(90deg,#5a8ee0,#3f6fc7);color:#fff;box-shadow:0 4px 10px rgba(70,120,220,.3)}
.kc-btn:disabled{opacity:.55;cursor:wait}
.kc-hint{font-size:11px;color:#6d84ad}
.kc-status{font-size:12px;font-weight:700;color:#5a8ee0;margin:8px 2px 0}
.kc-out{background:#10131a;color:#d7e3ff;border-radius:12px;padding:10px 12px;
  font:12px/1.6 ui-monospace,Menlo,monospace;white-space:pre-wrap;word-break:break-word;margin-top:10px;max-height:220px;overflow:auto}
.kc-err{background:#2a1414;color:#ffb4b4}
.kc-img{display:block;background:#fff;border-radius:14px;margin-top:12px;max-width:100%;border:2px solid #cdddfa}
.kc-foot{font-size:11px;color:#94a7c9;margin-top:12px;text-align:right;position:relative}
.kc-meta{font-size:11px;color:#6d84ad;margin-top:8px}
`

const DEFAULT_CODE = `import turtle
t = turtle.Turtle()
t.speed(4)
t.color("#3a86a8")
# 画一个五角星
for i in range(5):
    t.forward(120)
    t.right(144)
t.penup()
t.goto(-60, 90)
t.pendown()
t.color("#e0665a")
t.circle(30)
print("我的五角星画好啦 ⭐")
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

    function KidPanel(props) {
      const [expanded, setExpanded] = React.useState(true)
      const [code, setCode] = React.useState(DEFAULT_CODE)
      const [running, setRunning] = React.useState(false)
      const [res, setRes] = React.useState(null)

      const run = (src) => {
        setRunning(true)
        setRes({ running: true, ok: false, timeout: false, stdout: '', stderr: '', svg: '', png: '', err: '', dur_ms: 0 })
        fetch(PATH, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: src }),
        })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
          .then((rv) => { setRes(rv || { ok: false }); setRunning(false) })
          .catch((e) => {
            setRes({ ok: false, timeout: false, stdout: '', stderr: String((e && e.message) || e), svg: '', png: '', err: '', dur_ms: 0 })
            setRunning(false)
          })
      }

      // 打开即自动跑一遍示例，让图形马上出现
      React.useEffect(() => { run(DEFAULT_CODE) }, [])

      const changed = (e) => setCode(e.target.value)
      const summary = res ? (res.running ? '🐢 小海龟正在画…' : (res.ok ? '✅ 跑完啦' : '🔁 再试一次')) : '开跑前…'

      return React.createElement('div', { className: 'kc-card' },
        React.createElement('div', { className: 'kc-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起' : '展开' },
          React.createElement('div', { className: 'kc-min' },
            React.createElement('span', { className: 'icon' }, '🐵'),
            React.createElement('span', { className: 't' }, '小教室 · 跑代码'),
            React.createElement('span', { className: 'sum' }, summary),
            React.createElement('span', { className: 'badge' }, running ? '…' : (res && res.svg ? '图' : 'code')),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'kc-detail' },
          React.createElement('textarea', {
            className: 'kc-area', value: code, onChange: changed, spellCheck: false,
            placeholder: '在这里写 Python，可以 import turtle 画图～',
          }),
          React.createElement('div', { className: 'kc-row' },
            React.createElement('button', { className: 'kc-btn', disabled: running, onClick: () => run(code) },
              running ? '🐢 跑着呢…' : '✅ 跑一下'),
            React.createElement('span', { className: 'kc-hint' }, 'macOS 上用沙箱隔离 · 最多 8 秒自动叫停')),
          (res && res.running)
            ? React.createElement('div', { className: 'kc-status' }, '🐢 小海龟正在画图，稍等…')
            : null,
          (res && res.err)
            ? React.createElement('pre', { className: 'kc-out kc-err' }, res.err.trim())
            : null,
          (res && res.stderr)
            ? React.createElement('pre', { className: 'kc-out kc-err' }, res.stderr.trim())
            : null,
          (res && res.stdout)
            ? React.createElement('pre', { className: 'kc-out' }, res.stdout.trimEnd())
            : null,
          (res && res.svg)
            ? React.createElement('img', { className: 'kc-img', src: res.svg, alt: '海龟画的图' })
            : null,
          (res && res.png)
            ? React.createElement('img', { className: 'kc-img', src: res.png, alt: 'matplotlib 图形' })
            : null,
          res
            ? React.createElement('div', { className: 'kc-meta' },
                '运行 ' + (res.dur_ms || 0) + 'ms' + (res.timeout ? ' · ⏱️ 超时被叫停' : ''))
            : null,
          React.createElement('div', { className: 'kc-foot' }, '每点一次「跑一下」就刷新输出和图形 ｜ 沙箱隔离'))
          : null)
    }

    /** 会话 id 在两种 prop 形态里都取一遍（槽位不同版本给的不一样）。 */
    const sessionIdOf = (props) => {
      if (props.sessionId) return props.sessionId
      return props.session && props.session.sessionId
    }

    // 外层包装组件不含任何 hook：不在白名单的会话直接 null，
    // 内层组件不挂载，连它的自动跑示例一起省掉。
    const ScopedKidPanel = (props) => {
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionIdOf(props)) === -1) return null
      return React.createElement(KidPanel, props)
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock）。
    // 顺序 5：全套卡片里排第一（后面依次 sysmon(6)、network(7)、storage(8)、memory(9)、security(10)、process(11)）。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => { if (tag) tag.remove() }
        }, 'kid-coder: styles')
        // 必须用 slots.inject：它会等槽位真正被声明，槽位消失时贡献自动撤下。
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'kid-coder', order: 5 },
            ScopedKidPanel,
          ))
      },
    }
  },
})
})()
