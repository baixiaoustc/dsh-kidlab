// ============================================================
// kid-process · client 半部（浏览器模块，静态客户端 bundle）
// 由客户端模块表按「包名 = 模块 id」装载：window.__ModuleLoader__.load({id, factory})。
//   React 来自模块表（require('react')），不需自带打包；
//   数据走同源只读路由 GET /kid-process/collect（由本包 host 半部注册）。
// 主题：🐝 车间点名 —— 进程 = 在这台电脑（工作台）上干活的小工人。
//   点名（总数 / 卖力 / 打盹 / 僵尸）+ 卖力榜 + 家族（总管 launchd 的徒弟们）。
// 配色：青绿（车间/工装），和 memory 的蓝、storage 的橙、security 的紫、sysmon 的橘区分。
// 交互：点击标题折叠/展开，默认只留一行摘要。
// 会话门禁：见 ONLY_SESSIONS。静态 bundle 的 client 半部是进程级模块图
//   （每个会话的页面都会装入），所以「只在某个会话显示」只能在组件里判 sessionId。
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；两个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行
//    （症状：web boot: 1 entry did not activate）。指南第 13 节。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-process'
const PATH = '/kid-process/collect'
const TAG_ID = PKG + '/card.css'
// 只在这些会话里显示这张卡；空数组 [] = 每个会话都显示。
// 会话 id 是持久的：页面刷新、重启后都还是它。取当前会话 id：终端执行 `echo $DSH_SESSION_ID`。
const ONLY_SESSIONS = []

const CSS = `
.kp-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#16302f;
  background:linear-gradient(150deg,#effbf9 0%,#dff5f1 55%,#cdece7 100%);
  border-radius:24px;padding:16px 18px 14px;
  box-shadow:0 8px 24px rgba(40,140,130,.22),inset 0 0 0 2px rgba(255,255,255,.85);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.45;position:relative;overflow:hidden}
.kp-toggle{cursor:pointer;user-select:none}
.kp-toggle:hover .kp-min{border-color:#6fc0b6}
.kp-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(47,143,136,.4);border-radius:14px}
.kp-min .icon{font-size:24px}
.kp-min .t{font-weight:800;font-size:15px;color:#16302f}
.kp-min .sum{font-size:12px;font-weight:600;color:#3d7d78;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.kp-min .chev{font-size:13px;color:#3d7d78;margin-left:auto}
.kp-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;color:#fff;white-space:nowrap}
/* 展开区预算：dock 是 position:sticky;bottom:0 的粘性页脚，展开向上生长。
   沿用 kid-coder 真机联调沉淀的公式（max-height = 视口 − 页脚固定高度），
   预留必须 ≥ 页脚全部固定件：composer 卡 + composer.dock + 其余折叠卡 +
   本卡标题行 ≈ 430px，取 450px 留 20px 余量；绝对上限 480px 防大屏过长。
   预留不足 = 顶部溢出视口外、只能滑会话窗口才能够到（此坑先后以 32px/190px 翻过车）。 */
.kp-detail{margin-top:12px;max-height:min(calc(100vh - 450px),480px);overflow-y:auto;overscroll-behavior:contain;padding-right:2px}
.kp-detail::-webkit-scrollbar{width:8px}
.kp-detail::-webkit-scrollbar-thumb{background:rgba(47,143,136,.35);border-radius:99px}
.kp-detail::-webkit-scrollbar-track{background:transparent}
.kp-roll{background:rgba(255,255,255,.82);border-radius:18px;padding:14px 16px}
.kp-roll .lbl{font-size:12px;color:#3d7d78;font-weight:600;margin-bottom:8px}
.kp-cells{display:flex;gap:10px}
.kp-cell{flex:1;text-align:center;background:rgba(255,255,255,.7);border-radius:14px;padding:8px 4px}
.kp-cell .num{font-size:22px;font-weight:800;line-height:1.1}
.kp-cell .cap{font-size:11px;color:#3d7d78;font-weight:600;margin-top:2px}
.kp-stack{display:flex;height:14px;border-radius:99px;overflow:hidden;margin-top:10px;background:#d8ece9}
.kp-seg{display:block;height:100%}
.kp-top{background:rgba(255,255,255,.82);border-radius:16px;padding:12px 14px;margin-top:10px}
.kp-top .t{font-size:11px;color:#3d7d78;font-weight:600;margin-bottom:4px}
.kp-row{display:flex;align-items:center;gap:8px;padding:5px 0}
.kp-row .rk{font-size:11px;font-weight:800;color:#8aa8a4;width:16px}
.kp-row .nm{font-size:12.5px;font-weight:700;color:#16302f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:38%}
.kp-row .n{font-size:10px;font-weight:800;color:#2f8f88;background:rgba(47,143,136,.14);border-radius:99px;padding:1px 6px}
.kp-row .bwrap{flex:1;min-width:30px;height:10px;background:#dcefec;border-radius:99px;overflow:hidden}
.kp-row .bfill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#6fc0b6,#2f8f88)}
.kp-row .pct{font-size:11px;font-weight:700;color:#2f8f88;width:46px;text-align:right}
.kp-fam{background:rgba(255,255,255,.82);border-radius:16px;padding:12px 14px;margin-top:10px}
.kp-fam .t{font-size:11px;color:#3d7d78;font-weight:600;margin-bottom:6px}
.kp-fam .big{font-size:13px;font-weight:700;color:#16302f}
.kp-fam .big b{color:#2f8f88;font-size:16px}
.kp-chips{margin-top:6px;display:flex;flex-wrap:wrap;gap:5px}
.kp-chip{font-size:11px;color:#206f6a;background:rgba(47,143,136,.12);border-radius:99px;padding:2px 9px}
.kp-zombie{background:rgba(255,244,232,.9);border:1px dashed rgba(224,150,58,.5);border-radius:14px;
  padding:9px 12px;margin-top:10px;font-size:12px;color:#8a5a1e;line-height:1.6}
.kp-zombie .t{font-weight:700;margin-bottom:2px}
.kp-foot{font-size:11px;color:#8bb3af;margin-top:12px;text-align:right;position:relative}
.kp-empty{font-size:12px;color:#3d7d78;padding:4px 0}
`

/** 折叠摘要 + 三个纯展示助手。 */
const sumText = (d) => {
  if (!d || !d.headcount) return '点名中…'
  const h = d.headcount
  if (!h.total) return '没点到名…'
  return h.total + ' 个工人在册 · ' + h.running + ' 个在卖力'
}

/** 占比（防 0 除）：给堆叠条和横条算宽度。 */
const pctOf = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0)

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

    function ProcessPanel() {
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
      const h = (d && d.headcount) || null
      const level = d && d.level ? d.level : null
      const time = d && d.ts
        ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '—'

      // 点名板的三格：卖力 / 打盹 / 僵尸（颜色和堆叠条一致）
      const CELLS = h ? [
        { key: 'running', n: h.running, cap: '在卖力干活', color: '#2f8f88' },
        { key: 'sleeping', n: h.sleeping, cap: '在打盹等活儿', color: '#7fb8d4' },
        { key: 'zombie', n: h.zombie, cap: '赖着不走的僵尸', color: '#e0963a' },
      ] : []
      const cells = CELLS.map((c) => React.createElement('div', { key: c.key, className: 'kp-cell' },
        React.createElement('div', { className: 'num', style: { color: c.color } }, String(c.n)),
        React.createElement('div', { className: 'cap' }, c.cap)))
      const segs = h ? [
        { key: 'r', n: h.running, color: '#2f8f88' },
        { key: 's', n: h.sleeping, color: '#7fb8d4' },
        { key: 'z', n: h.zombie, color: '#e0963a' },
        { key: 'o', n: h.other, color: '#c9d8d6' },
      ].filter((s) => s.n > 0).map((s) => React.createElement('span', {
        key: s.key, className: 'kp-seg',
        style: { width: pctOf(s.n, h.total) + '%', background: s.color },
      })) : []

      // 卖力榜：横条长度按「本榜最卖力的那个」归一化，不然全都短得看不见
      const busiest = (d && d.busiest) || []
      const maxCpu = busiest.reduce((m, b) => Math.max(m, b.cpu), 0)
      const topRows = busiest.map((b, i) => React.createElement('div', { key: b.name + i, className: 'kp-row' },
        React.createElement('span', { className: 'rk' }, String(i + 1)),
        React.createElement('span', { className: 'nm', title: '工号 ' + b.pid }, b.name),
        b.n > 1 ? React.createElement('span', { className: 'n' }, '×' + b.n) : null,
        React.createElement('div', { className: 'bwrap' },
          React.createElement('span', { className: 'bfill', style: { width: Math.max(3, pctOf(b.cpu, maxCpu)) + '%' } })),
        React.createElement('span', { className: 'pct' }, b.cpu.toFixed(1) + '%')))

      const fam = (d && d.foreman) || null
      const zombies = (d && d.zombies) || []

      return React.createElement('div', { className: 'kp-card' },
        React.createElement('div', { className: 'kp-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
          React.createElement('div', { className: 'kp-min' },
            React.createElement('span', { className: 'icon' }, '🐝'),
            React.createElement('span', { className: 't' }, '工人点名 · 进程小工人'),
            React.createElement('span', { className: 'sum' }, sumText(d)),
            level
              ? React.createElement('span', { className: 'badge', style: { background: level.color } }, level.emoji + ' ' + level.text)
              : React.createElement('span', { className: 'badge', style: { background: '#8a93a8' } }, '⏳ 点名中'),
            React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

        expanded ? React.createElement('div', { className: 'kp-detail' },

          // 点名板
          React.createElement('div', { className: 'kp-roll' },
            React.createElement('div', { className: 'lbl' }, '📋 现在有多少小工人？（工号 PID 是它们的身份证）'),
            (cells.length
              ? React.createElement('div', { className: 'kp-cells' }, cells)
              : React.createElement('div', { className: 'kp-empty' }, '还没点到名…稍等一下')),
            (segs.length
              ? React.createElement('div', { className: 'kp-stack' }, segs)
              : null),
            (h
              ? React.createElement('div', { className: 'lbl', style: { marginTop: 8, marginBottom: 0 } },
                  '一共 ' + h.total + ' 个在册（其他状态 ' + h.other + ' 个）——每打开一个程序，电脑就派一个小工人上场')
              : null)),

          // 卖力榜
          React.createElement('div', { className: 'kp-top' },
            React.createElement('div', { className: 't' }, '💪 谁这会儿最卖力？（干活强度 = CPU）'),
            (topRows.length
              ? topRows
              : React.createElement('div', { className: 'kp-empty' }, '暂时没读到卖力的小工人…'))),

          // 家族
          fam ? React.createElement('div', { className: 'kp-fam' },
            React.createElement('div', { className: 't' }, '👨‍👧 家族：谁带来了谁？'),
            React.createElement('div', { className: 'big' },
              '总管 ' + fam.name + '（工号 ' + fam.pid + '）带了 ',
              React.createElement('b', null, String(fam.kids)),
              ' 个直接徒弟'),
            (fam.top && fam.top.length
              ? React.createElement('div', { className: 'kp-chips' },
                  fam.top.map((k, i) => React.createElement('span', { key: i, className: 'kp-chip' },
                    k.name + (k.n > 1 ? ' ×' + k.n : ''))))
              : null)) : null,

          // 僵尸名单（有才显示）
          (zombies.length
            ? React.createElement('div', { className: 'kp-zombie' },
                React.createElement('div', { className: 't' }, '🧟 赖着不走的小工人（活干完了，工牌还没被收走）'),
                zombies.map((z, i) => React.createElement('span', { key: i },
                  z.name + '（工号 ' + z.pid + '）' + (i === zombies.length - 1 ? '' : ' · '))),
                React.createElement('div', null, '一般一会儿就被总管清理掉啦，不用怕。'))
            : null),

          // 注意：kp-detail 这个 createElement 的调用必须在 `: null` 之前闭合——
          // `expanded ? createElement(…) : null` 的 `:` 不能出现在参数表里面。
          React.createElement('div', { className: 'kp-foot' },
            '🐝 进程 = 在这台电脑上干活的小工人 ｜ 每 15 秒点一次名 ｜ ' + time)
        ) : null)
    }

    /** 会话 id 在两种 prop 形态里都取一遍（槽位不同版本给的不一样）。 */
    const sessionIdOf = (props) => {
      if (props.sessionId) return props.sessionId
      return props.session && props.session.sessionId
    }

    // 外层包装组件不含任何 hook：不在白名单的会话直接 null，
    // 内层组件不挂载，连它的 15 秒轮询一起省掉。
    const ScopedProcessPanel = (props) => {
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionIdOf(props)) === -1) return null
      return React.createElement(ProcessPanel, props)
    }

    // 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock），
    // 输入区不随对话滚动被划走，从而在页面上常驻展示。
    // 顺序 9：排在 kid-coder/network/3d(5)、kid-storage(6)、kid-memory(7)、kid-security(8) 之后。
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => { if (tag) tag.remove() }
        }, 'kid-process: styles')
        // 必须用 slots.inject：它会等槽位真正被声明，槽位消失时贡献自动撤下。
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'kid-process', order: 11 },
            ScopedProcessPanel,
          ))
      },
    }
  },
})
})()
