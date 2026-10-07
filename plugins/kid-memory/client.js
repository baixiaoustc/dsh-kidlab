// ============================================================
// kid-memory · client 半部
//
// ⚠️ 这不是原生 ESM：页面通过 window.__ModuleLoader__.load({ id, factory }) 装载，
//    id 必须**等于裸包名**（模块表的身份就是它），factory 返回 { inject, apply(ctx) }。
//    能 require 的外部依赖只有平台白名单（这里只用 react）；组件没有 JSX 编译，
//    统一用 React.createElement。
//
// 与 0.1 动态版的差别：
//   host.call('mem:collect')      → fetch('/kid-memory/collect')
//   styles.insert(CSS)            → 自己插 <style data-plugin-css="…/card.css">，
//                                   并在 ctx.effect 的 disposer 里移除
//   ctx.interval(refresh, 8000)   → useEffect 里 setInterval + 清理函数 clearInterval
//
// 主题：🦉 记忆小管家 —— 内存 = 电脑的「工作台 / 短期记忆」。
// 和 kid-storage 的「🧳 大仓库 / 长期记忆」配对讲：内存管正在做的，硬盘管长期存的。
//
// ⚠️ 整个文件必须包在 IIFE 里：本文件作为 classic script 直接执行，顶层 const
//    会进入全页共享的全局词法作用域；多个插件 bundle 都声明 `const PKG` 就会
//    SyntaxError: Identifier 'PKG' has already been declared，整个 bundle 不执行。
//    官方模板 templates/decoration/client.js 把所有声明都放进 factory，等效于此。
// ============================================================
;(() => {
const PKG = '@kidlab/dsh-kid-memory'
const PATH = '/kid-memory/collect'
const TAG_ID = PKG + '/card.css'

// 会话门禁：只有列在这里的会话才渲染这张卡片。
//   [] = 所有会话都显示。
// 本卡片按用户要求只在本会话可见——当前会话 id 取自 `echo $DSH_SESSION_ID`，
// 它是持久的（刷新、重启都不变），所以这个判断能长期生效。
// 判定必须在**组件里**做：client 半部是进程级模块图，注册层没有 session 维度，
// conversation.input.dock 能给的注册参数只有 { id, order, label }。
// 代价须知：模块照旧在每个会话里装载、slot 也照旧注册（槽位树里一直能看到
// kid-memory），只是白名单外的会话渲染成 null，连内层的 8 秒轮询一起省掉。
const ONLY_SESSIONS = []

const CSS = `
.mem-card{font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB",sans-serif;
  color:#20304a;background:linear-gradient(150deg,#eff6ff 0%,#e0ecff 55%,#d3e3ff 100%);
  border-radius:24px;padding:16px 18px 14px;width:100%;max-width:100%;box-sizing:border-box;
  line-height:1.45;position:relative;overflow:hidden;
  box-shadow:0 8px 24px rgba(90,140,230,.25),inset 0 0 0 2px rgba(255,255,255,.85)}
.mem-toggle{cursor:pointer;user-select:none}
.mem-min{display:flex;align-items:center;gap:10px;padding:6px 2px;
  border:2px dashed rgba(90,140,230,.4);border-radius:14px}
.mem-min .icon{font-size:24px;line-height:1}
.mem-min .t{font-weight:800;font-size:15px;color:#20304a;white-space:nowrap}
.mem-min .sum{font-size:12px;font-weight:600;color:#5f7fb8;flex:1;min-width:0;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mem-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;
  color:#fff;white-space:nowrap}
.mem-min .chev{font-size:13px;color:#5f7fb8}
.mem-detail{margin-top:12px}
.mem-gauge{background:rgba(255,255,255,.78);border-radius:18px;padding:14px 16px}
.mem-gauge .lbl{font-size:12px;color:#5f7fb8;font-weight:600;margin-bottom:8px}
.mem-gauge .bar{display:flex;width:100%;height:14px;background:#dbe7fb;border-radius:99px;overflow:hidden}
/* display:block 是必须的：<span> 是 inline 元素，width 会被直接忽略，
   症状是「所有横条一样长」。轨道 display:flex + 填充 display:block 才吃百分比宽度。 */
.mem-gauge .fill{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,#7db0ff,#3f7bff)}
.mem-gauge .fig{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#5f7fb8}
.mem-press{background:rgba(255,255,255,.78);border-radius:16px;padding:10px 14px;margin-top:10px;
  display:flex;align-items:center;gap:12px}
.mem-press .pe{font-size:22px;line-height:1}
.mem-press .pl{flex:1;min-width:0}
.mem-press .pl .t{font-size:12px;font-weight:700;color:#20304a}
.mem-press .pl .s{font-size:11px;color:#5f7fb8;margin-top:2px}
.mem-press .pct{font-size:16px;font-weight:800;white-space:nowrap}
.mem-press .pct small{font-size:11px;font-weight:600}
.mem-list{background:rgba(255,255,255,.78);border-radius:16px;padding:10px 12px;margin-top:10px}
.mem-list .t{font-size:11px;color:#5f7fb8;font-weight:600;margin-bottom:6px}
.mem-list .row{display:flex;align-items:center;gap:8px;font-size:13px;line-height:2.1}
.mem-list .nm{font-weight:700;color:#20304a;width:104px;flex:none;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mem-list .bar{display:flex;flex:1 1 0%;min-width:0;height:8px;background:#dbe7fb;
  border-radius:99px;overflow:hidden}
.mem-list .fill{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,#7db0ff,#3f7bff)}
.mem-list .sz{color:#3f7bff;font-weight:800;font-size:12px;width:66px;flex:none;text-align:right;
  white-space:nowrap}
.mem-hint{font-size:11px;color:#9ab3e0;margin-top:6px}
.mem-empty{font-size:12px;color:#5f7fb8;padding:4px 0}
.mem-foot{font-size:11px;color:#9ab3e0;margin-top:12px;text-align:right}
`

/**
 * 注入本卡片样式；已存在则复用（HMR 重挂载不会叠加多份）。
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

window.__ModuleLoader__.load({
  id: PKG,
  factory(require) {
    const React = require('react')

    /**
     * 占用榜横条宽度：按比例（占得最多的那个 = 100%）。
     * 留 4% 下限只是为了让最小的那几项还看得见；它同时也是「谁比谁大」的
     * 单调保序映射，所以比较关系不会被这点偏差破坏。
     */
    const relW = (kb, maxKb) => {
      if (!kb || !maxKb || maxKb <= 0) return 0
      return Math.max(4, Math.min(100, Math.round((kb / maxKb) * 100)))
    }

    /** 仪表条宽度：百分比字符串 → 4%~100%。 */
    const barW = (pct) => {
      if (pct === null || pct === undefined) return 0
      const n = parseFloat(String(pct).replace('%', ''))
      return isFinite(n) ? Math.max(4, Math.min(100, n)) : 0
    }

    /** 折叠态的摘要：一句话说清工作台摊开了多少。 */
    const sumText = (d, err) => {
      if (!d) return err ? '暂时读不到数据（每 8 秒重试）' : '读脑中…'
      if (typeof d.usedPct !== 'number') return '工作台信息就绪'
      return '已摊开 ' + d.usedPct + '%'
    }

    /** 徽章文案与底色：跟着「挤不挤」走。 */
    const badgeOf = (d) => {
      const lv = d && d.pressure && d.pressure.level
      if (lv === '很紧张') return { bg: '#e2593a', text: '😅 很紧张' }
      if (lv === '有点挤') return { bg: '#d9883a', text: '🙂 有点挤' }
      if (lv === '宽裕') return { bg: '#3f9b5a', text: '😊 宽裕' }
      return { bg: '#8fa9d6', text: '…' }
    }

    /** 定性 → 颜色（徽章与百分比数字共用一套）。 */
    const levelColor = (lv) =>
      lv === '很紧张' ? '#e2593a' : lv === '有点挤' ? '#d9883a' : lv === '宽裕' ? '#3f9b5a' : '#8fa9d6'

    const MemoryPanel = () => {
      const [data, setData] = React.useState(null)
      const [err, setErr] = React.useState(null)
      const [expanded, setExpanded] = React.useState(false)

      // 定时器必须在清理函数里 clearInterval，否则每次重挂载都会叠加一个 8 秒轮询。
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
      const press = d && d.pressure ? d.pressure : null
      const pct = d && typeof d.usedPct === 'number' ? d.usedPct : 0
      const badge = badgeOf(d)
      const time = d && d.ts ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

      // 占用榜：取前 8 个，横条相对榜首按比例；榜首加一顶小皇冠。
      const shown = ((d && d.top) || []).slice(0, 8)
      const maxKb = shown.length ? shown[0].kb : 1
      const rows = shown.map((p, i) =>
        React.createElement('div', { key: p.name + '-' + i, className: 'row' },
          React.createElement('span', { className: 'nm', title: p.name }, (i === 0 ? '👑 ' : '') + p.name),
          React.createElement('span', { className: 'bar' },
            React.createElement('span', { className: 'fill', style: { width: relW(p.kb, maxKb) + '%' } })),
          React.createElement('span', { className: 'sz' }, p.num + ' ' + p.unit)))

      const head = React.createElement('div', { className: 'mem-toggle', onClick: () => setExpanded(!expanded) },
        React.createElement('div', { className: 'mem-min' },
          React.createElement('span', { className: 'icon' }, '🦉'),
          React.createElement('span', { className: 't' }, '记忆小管家 · 电脑的工作台'),
          React.createElement('span', { className: 'sum' }, sumText(d, err)),
          React.createElement('span', { className: 'badge', style: { background: badge.bg } }, badge.text),
          React.createElement('span', { className: 'chev' }, expanded ? '▾' : '▸')))

      // 默认折叠，只留一行摘要；展开才渲染明细（也就省下每次重挂载的开销）。
      if (!expanded) return React.createElement('div', { className: 'mem-card' }, head)

      const num = (k, unit) => (d && d[k] ? d[k].num + ' ' + d[k].unit : '—')

      const detail = React.createElement('div', { className: 'mem-detail' },
        React.createElement('div', { className: 'mem-gauge' },
          React.createElement('div', { className: 'lbl' }, '工作台现在摊开了多少？（内存占用）'),
          React.createElement('div', { className: 'bar' },
            React.createElement('span', { className: 'fill', style: { width: barW(pct) + '%' } })),
          React.createElement('div', { className: 'fig' },
            React.createElement('span', null, '已用 ' + num('used')),
            React.createElement('span', null, '空闲 ' + num('free')),
            React.createElement('span', null, '共 ' + num('total')))),

        (press
          ? React.createElement('div', { className: 'mem-press' },
            React.createElement('span', { className: 'pe' }, press.emoji),
            React.createElement('span', { className: 'pl' },
              React.createElement('div', { className: 't' }, '挤不挤？' + press.level),
              React.createElement('div', { className: 's' }, press.text)),
            React.createElement('span', { className: 'pct', style: { color: levelColor(press.level) } },
              String(press.freePct), React.createElement('small', null, '% 空')))
          : null),

        React.createElement('div', { className: 'mem-list' },
          React.createElement('div', { className: 't' }, '🏃 谁在占着工作台'),
          (rows.length ? rows : React.createElement('div', { className: 'mem-empty' }, '还没有扫描到数据…')),
          (rows.length
            ? React.createElement('div', { className: 'mem-hint' }, '横条长度按比例：最长的那条就是占得最多的那个 ~')
            : null)),

        React.createElement('div', { className: 'mem-foot' },
          '每 8 秒看一眼 ｜ ' + time + (err ? ' ｜ ' + err : '')))

      return React.createElement('div', { className: 'mem-card' }, head, detail)
    }

    // 会话门禁：dock 槽位 scope=session，组件会拿到 sessionId（也可能挂在
    // owner prop 的 session.sessionId 上）。外层组件不调用任何 hook，所以
    // 「这里不渲染」不会改变内层组件的 hook 顺序；被挡下的会话里连 8 秒轮询
    // 都不会启动。
    const sessionIdOf = (props) => {
      if (!props) return undefined
      if (props.sessionId) return props.sessionId
      return props.session && props.session.sessionId
    }

    const ScopedMemoryPanel = (props) => {
      if (ONLY_SESSIONS.length && ONLY_SESSIONS.indexOf(sessionIdOf(props)) === -1) return null
      return React.createElement(MemoryPanel, props)
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(() => {
          const tag = ensureStyles()
          return () => {
            if (tag) tag.remove()
          }
        }, 'kid-memory: styles')
        // 必须用 slots.inject：它会等槽位真正被声明，槽位消失时贡献自动撤下。
        // 槽位已有占用者：todo=0、kid-storage=6、goal=10、queue=20，本卡片取 7。
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register(
            { name: 'conversation.input.dock', id: 'kid-memory', order: 7 },
            ScopedMemoryPanel,
          ))
      },
    }
  },
})
})()
