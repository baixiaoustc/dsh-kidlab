// ============================================================
// kid-memory · client half  (code.client 函数体)
// 供 cordis_define 使用。纯 JS（无 JSX/TS），运行在浏览器闭包：
//   可用符号: React / styles / host / console
//   styles.insert(css) 注入样式；host.call('mem:collect') 拉数据
// 主题：🧠 记忆小管家 —— 把内存讲成“电脑的工作台/短期记忆”的小故事。
// 与 kid-storage 的“🧳 大仓库/长期记忆”配对。
// 交互：点击标题折叠/展开。
// ============================================================
const CSS = `
.md-card{font-family:-apple-system,"PingFang SC","Segoe UI",sans-serif;color:#20304a;
  background:linear-gradient(150deg,#eff6ff 0%,#e0ecff 55%,#d3e3ff 100%);
  border-radius:24px;padding:16px 18px 14px;
  box-shadow:0 8px 24px rgba(90,140,230,.25),inset 0 0 0 2px rgba(255,255,255,.85);
  width:100%;max-width:100%;box-sizing:border-box;line-height:1.45;position:relative;overflow:hidden}
.md-toggle{cursor:pointer;user-select:none}
.md-toggle:hover .md-min{border-color:#7ea4e8}
.md-min{display:flex;align-items:center;gap:10px;padding:6px 2px;border:2px dashed rgba(90,140,230,.4);border-radius:14px}
.md-min .icon{font-size:24px}
.md-min .t{font-weight:800;font-size:15px;color:#20304a}
.md-min .sum{font-size:12px;font-weight:600;color:#5f7fb8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.md-min .chev{font-size:13px;color:#5f7fb8;margin-left:auto}
.md-min .badge{font-size:11px;font-weight:800;padding:3px 10px;border-radius:999px;color:#fff;white-space:nowrap}
.md-detail{margin-top:12px}
.md-gauge{background:rgba(255,255,255,.8);border-radius:18px;padding:14px 16px}
.md-gauge .lbl{font-size:12px;color:#5f7fb8;font-weight:600;margin-bottom:8px}
.md-gauge .bar{height:14px;background:#dbe7fb;border-radius:99px;overflow:hidden}
.md-gauge .fill{display:block;height:100%;border-radius:99px;
  background:linear-gradient(90deg,#7db0ff,#3f7bff)}
.md-gauge .fig{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#5f7fb8}
.md-press{background:rgba(255,255,255,.8);border-radius:16px;padding:10px 14px;margin-top:10px;
  display:flex;align-items:center;gap:12px}
.md-press .pe{font-size:22px}
.md-press .pl{flex:1}
.md-press .pl .t{font-size:12px;font-weight:700;color:#20304a}
.md-press .pl .s{font-size:11px;color:#5f7fb8;margin-top:2px}
.md-press .pct{font-size:16px;font-weight:800}
.md-press .pct small{font-size:11px;font-weight:600}
.md-list{background:rgba(255,255,255,.8);border-radius:16px;padding:10px 12px;margin-top:10px}
.md-list .t{font-size:11px;color:#5f7fb8;font-weight:600;margin-bottom:6px}
.md-list .row{display:flex;align-items:center;gap:8px;font-size:13px;line-height:2.1}
.md-list .nm{font-weight:700;color:#20304a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:56%}
.md-list .bar{flex:1;height:8px;background:#dbe7fb;border-radius:99px;overflow:hidden;min-width:30px}
.md-list .fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#7db0ff,#3f7bff)}
.md-list .sz{color:#3f7bff;font-weight:800;font-size:12px;white-space:nowrap}
.md-foot{font-size:11px;color:#9ab3e0;margin-top:12px;text-align:right;position:relative}
.md-empty{font-size:12px;color:#5f7fb8;padding:4px 0}
`

const barW = (pct) => {
  if (pct === null || pct === undefined) return 0
  const n = parseFloat(String(pct).replace('%', ''))
  return isFinite(n) ? Math.max(4, Math.min(100, n)) : 0
}

const sumText = (d) => {
  if (!d) return '读脑中…'
  if (d.usedPct === null || d.usedPct === undefined) return '工作台信息就绪'
  return '已摊开 ' + d.usedPct + '%'
}

const badgeStyle = (d) => {
  const lv = d && d.pressure && d.pressure.level
  if (lv === '很紧张') return { background: '#e2593a', text: '😅 紧张' }
  if (lv === '有点挤') return { background: '#e0963a', text: '🙂 有点挤' }
  return { background: '#3f9b5a', text: '😊 宽裕' }
}

const MemoryPanel = (props) => {
  const ctx = props.ctx
  const [data, setData] = React.useState(null)
  const [expanded, setExpanded] = React.useState(false)
  React.useEffect(() => {
    let alive = true
    const refresh = () => host.call('mem:collect', {})
      .then((dd) => { if (alive && dd && !dd.error) setData(dd) })
      .catch(() => {})
    refresh()
    const stop = ctx.interval(refresh, 8000)
    return () => { alive = false; if (stop) stop() }
  }, [])

  const d = data
  const summary = sumText(d)
  const badge = badgeStyle(d)
  const time = d && d.ts ? new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'

  // 占用榜（最多 8 条）
  const top = d && d.top ? d.top : []
  const maxKb = top.length ? top[0].kb : 1

  const topRows = top.slice(0, 8).map((p, i) =>
    React.createElement('div', { key: i, className: 'row' },
      React.createElement('span', { className: 'nm', title: p.name }, (i === 0 ? '👑 ' : '') + p.name),
      React.createElement('span', { className: 'bar' },
        React.createElement('span', { className: 'fill', style: { width: Math.max(4, Math.round((p.kb / maxKb) * 100)) + '%' } })),
      React.createElement('span', { className: 'sz' }, p.num + ' ' + p.unit)))

  return React.createElement('div', { className: 'md-card' },
    React.createElement('div', { className: 'md-toggle', onClick: () => setExpanded(!expanded), title: expanded ? '收起详情' : '展开详情' },
      React.createElement('div', { className: 'md-min' },
        React.createElement('span', { className: 'icon' }, '🦉'),
        React.createElement('span', { className: 't' }, '记忆小管家 · 电脑的工作台'),
        React.createElement('span', { className: 'sum' }, summary),
        React.createElement('span', { className: 'badge', style: { background: badge.background } }, badge.text),
        React.createElement('span', { className: 'chev' }, expanded ? '▼ 收起' : '▶ 展开'))),

    expanded ? React.createElement('div', { className: 'md-detail' },

      // 工作台已用仪表
      React.createElement('div', { className: 'md-gauge' },
        React.createElement('div', { className: 'lbl' }, '🪑 工作台现在摊开了多少？'),
        React.createElement('div', { className: 'bar' },
          React.createElement('span', { className: 'fill', style: { width: barW(d && d.usedPct) + '%' } })),
        React.createElement('div', { className: 'fig' },
          React.createElement('span', null,
            d ? ('已用 ' + (d.used ? d.used.num + ' ' + d.used.unit : '—') + ' · 空闲 ' + (d.free ? d.free.num + ' ' + d.free.unit : '—')) : '读取中…'),
          React.createElement('span', null, d && d.total ? ('共 ' + d.total.num + ' ' + d.total.unit) : ''))),

      // 压力状态
      d && d.pressure
        ? React.createElement('div', { className: 'md-press' },
            React.createElement('span', { className: 'pe' }, d.pressure.emoji),
            React.createElement('div', { className: 'pl' },
              React.createElement('div', { className: 't' }, '工作台挤不挤？'),
              React.createElement('div', { className: 's' }, d.pressure.text)),
            React.createElement('div', { className: 'pct', style: { color: badge.background } },
              d.pressure.freePct + '%', React.createElement('small', null, ' 空闲')))
        : React.createElement('div', { className: 'md-press' },
            React.createElement('span', { className: 'pe' }, '⏳'),
            React.createElement('div', { className: 'pl' },
              React.createElement('div', { className: 't' }, '工作台挤不挤？'),
              React.createElement('div', { className: 's' }, '正在读取空闲率…'))),

      // 谁在占工作台
      React.createElement('div', { className: 'md-list' },
        React.createElement('div', { className: 't' }, '🏃 “谁”在占着工作台（占用最多的）'),
        (topRows.length
          ? topRows
          : React.createElement('div', { className: 'md-empty' }, '还没有扫描到数据…'))),

      React.createElement('div', { className: 'md-foot' },
        '🦉 内存 = 工作台/短期记忆 ｜ 每 8 秒看一次 ｜ ' + time))
    : null)
}

// 卡片常驻：注册到输入条上方的 full-width 槽（conversation.input.dock），
// 输入区不会随对话滚动被划走，从而在页面上常驻展示。
return {
  inject: ['slots', 'timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (!slots) return
    ctx.effect(() => styles.insert(CSS), 'kid-memory: styles')
    slots.inject('conversation.input.dock', () => slots.register(
      { name: 'conversation.input.dock', id: 'kid-memory', order: 7 },
      (props) => React.createElement(MemoryPanel, Object.assign({}, props, { ctx })),
    ))
  },
}