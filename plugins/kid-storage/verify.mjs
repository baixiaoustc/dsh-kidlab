// ============================================================
// kid-storage · 本地端到端自检（无需浏览器、无需 harness）
//   1) 真机采集：df / du 是否出值，映像是怎么被单拎出来的
//   2) host half：路由注册 + 三个工具注册的形状（普通对象，不用 defineTool）
//   2b) 三个工具真跑一遍，看输出抬头对不对
//   3) client half：模块表注册 → apply → 槽位注册 → 用真实数据渲染组件树
//   4) 断言：折叠摘要含“还剩”，占用榜横条宽度互不相同（并非全都是 100%）
// 用法：node verify.mjs
// ============================================================
import { runInNewContext, Script } from 'node:vm'
import { readFileSync } from 'node:fs'
import { collect, parseDf, isDiskImage, classifyVolumes } from './collect.js'
import { apply } from './index.js'

let failed = 0
const ok = (cond, msg, extra) => {
  console.log((cond ? '  ✅ ' : '  ❌ ') + msg + (extra === undefined ? '' : '  → ' + extra))
  if (!cond) failed++
}

// ---------- 1) 真机采集 ----------
console.log('\n[1] 真机采集（df / du）')
const data = await collect()
const root = (data.volumes || []).find((v) => v.key === 'root')
ok(!!root, '系统盘分区行存在', root ? `${root.label} 总 ${root.total} 已用 ${root.pct} 剩 ${root.avail}` : '缺失')
ok((data.folders || []).some((f) => f.kb > 0), '主目录占用榜有非零项',
  data.folders.filter((f) => f.kb > 0).map((f) => `${f.label} ${f.num}${f.unit}`).join(' / ') || '全为 0')
ok(Array.isArray(data.images), '映像卷被单独归类（images 数组存在）',
  `真磁盘 ${(data.volumes || []).length} 个 / 映像 ${(data.images || []).length} 个` +
  ((data.images || []).length ? '：' + data.images.map((i) => i.label).join('、') : ''))
ok(!(data.volumes || []).some((v) => (data.images || []).some((i) => i.mount === v.mount)),
  '同一个卷没有既进分区格子又进映像行')

// ---------- 1b) 映像识别：注入假探测器，离线可复现 ----------
console.log('\n[1b] 映像识别（离线，不依赖本机此刻是否挂着映像）')
const fakeDf = [
  'Filesystem     1K-blocks      Used Available Capacity Mounted on',
  '/dev/disk1s5   121000000  95000000   6000000      95%   /System/Volumes/Data',
  '/dev/disk3s1     1500000   1100000    420000      73%   /Volumes/Trae CN',
  '/dev/disk9s1    64000000   1000000  60000000       2%   /Volumes/我的U盘',
].join('\n')
const IMAGE_INFO = '   Protocol:                  Disk Image\n   Media Read-Only:           Yes\n   Volume Read-Only:          Yes (read-only mount flag set)'
const DISK_INFO = '   Protocol:                  USB\n   Media Read-Only:           No\n   Volume Read-Only:          No'
const fakeRows = parseDf(fakeDf)
const cls = await classifyVolumes(fakeRows, (mount) => Promise.resolve(mount.includes('Trae') ? IMAGE_INFO : DISK_INFO))
ok(isDiskImage(IMAGE_INFO) === true && isDiskImage(DISK_INFO) === false, 'isDiskImage 认映像、不误判普通盘')
ok(cls.images.length === 1 && cls.images[0].label === 'Trae CN', '映像卷归入 images', JSON.stringify(cls.images))
ok(cls.volumes.some((v) => v.label === '我的U盘'), '真 U 盘留在 volumes')
ok(cls.volumes.some((v) => v.key === 'root'), '系统盘留在 volumes')
ok(cls.volumes.length === 2 && !cls.volumes.some((v) => v.label === 'Trae CN'),
  '映像卷没有混进分区格子', cls.volumes.map((v) => v.label).join('、'))
ok(fakeRows.every((r) => typeof r.mount === 'string' && r.mount.startsWith('/')), '每行都带 mount，供 diskutil 点名检查')

// ---------- 2) host half：路由 + 三个工具 ----------
console.log('\n[2] host half：注册路由与模型工具')
let route = null
let tools = []
let toolsDisposer = null
const mkCtx = () => ({
  get: (name) => (name === 'webServer' ? { register: (r) => { route = r; return () => {} } } : undefined),
  effect: (fn) => fn(),
  inject: (deps, cb) => cb({
    effect: (fn) => { toolsDisposer = fn() },
    tools: { register: (t) => { tools.push(t); return () => {} } },
  }),
})
apply(mkCtx())
ok(!!route, '已在 webServer 上注册路由', route && `${route.kind} ${route.path}`)
const NAMES = ['storage_boxes', 'storage_home', 'storage_heavy']
ok(tools.length === 3, '注册了 3 个模型工具', tools.map((t) => t.name).join(' / '))
ok(NAMES.every((n) => tools.some((t) => t.name === n)), '工具名与旧插件一致', NAMES.join(' / '))
const shape = (t) => !!t && typeof t.description === 'string' && t.description.length > 20 &&
  JSON.stringify(t.parameters) === JSON.stringify({ type: 'object', properties: {} }) &&
  !!t.output && t.output.schema && t.output.schema.type === 'string' && typeof t.output.render === 'function' &&
  typeof t.execute === 'function'
ok(tools.every(shape), '每个工具都有 description / 无参 parameters（与线上投影一致）/ text output / execute')
ok(typeof toolsDisposer === 'function', '工具注册在 effect 里（可回收）')
const off = toolsDisposer; off()
ok(true, '回收函数可调用，不抛错')

let routeWhenDisabled = null
tools = []
const ctxOff = mkCtx()
apply(ctxOff, { enabled: false })
routeWhenDisabled = route
ok(tools.length === 0, 'enabled:false 时不注册工具')
ok(!!routeWhenDisabled, 'enabled:false 时路由照常（卡片还能显示数据）')

// ---------- 2b) 三个工具真跑一遍 ----------
console.log('\n[2b] 三个工具真跑一遍（真机 df / du）')
const byName = {}
tools = []
apply(mkCtx())
for (const t of tools) byName[t.name] = t
const boxText = await byName.storage_boxes.execute()
ok(boxText.includes('【分区 / 大仓库的格子】'), 'storage_boxes：给出分区表格头', boxText.split('\n')[0])
ok(boxText.includes('关键一句：'), 'storage_boxes：汇总系统盘可用空间',
  (boxText.split('\n').find((l) => l.startsWith('关键一句：')) || '缺').slice(0, 60))
const homeText = await byName.storage_home.execute()
ok(homeText.includes('【主目录里谁最占地方】'), 'storage_home：给出主目录占用榜')
ok(/^\s*\d+\s+KB\s+~\//m.test(homeText), 'storage_home：榜单是「KB + ~/路径」两列',
  (homeText.split('\n').find((l) => /KB/.test(l)) || '缺').trim())
const heavyText = await byName.storage_heavy.execute()
ok(heavyText.includes('【最重的大件行李 Top 12】'), 'storage_heavy：给出大件行李榜')
ok(/^\s*\d+\s+KB\s+~\//m.test(heavyText), 'storage_heavy：榜单是「KB + ~/路径」两列',
  (heavyText.split('\n').find((l) => /KB/.test(l)) || '缺').trim())

// ---------- 3) client half：装载 + 注册 ----------
console.log('\n[3] client half：__ModuleLoader__ 装载 → apply → 槽位注册')
const styleTags = []
const document = {
  querySelector: () => null,
  // 完整模拟 <style> 元素：既支持 client 直接写 dataset，也支持 setAttribute（两种写法都常见）。
  createElement: () => ({
    dataset: {},
    removed: false,
    setAttribute(k, v) { this.dataset[k.replace(/^data-/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = v },
    textContent: '',
    remove() { this.removed = true },
  }),
  head: { appendChild: (t) => styleTags.push(t) },
}
let registration = null
let widget = null
let cssInjector = null
const ctxClient = {
  effect: (fn) => { cssInjector = fn() },
  slots: {
    inject: (name, cb) => cb(),
    register: (options, component) => { registration = options; widget = component },
  },
}
const win = {}
const clientSource = readFileSync(new URL('./client.js', import.meta.url), 'utf8')
let parses = true
try { new Script(clientSource) } catch (e) { parses = false; console.log('    ' + e.message) }
ok(parses, 'client.js 能当作 classic script 解析（顶层声明没有语法错）')
runInNewContext(clientSource, {
  window: Object.assign(win, { __ModuleLoader__: { load: (m) => { win.__loaded = m } } }),
  document,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  fetch: (...a) => globalThis.fetch(...a),
  console,
})
const loaded = win.__loaded
ok(!!loaded, '已向模块表注册工厂', loaded && 'id=' + loaded.id)
ok(loaded.id === '@kidlab/dsh-kid-storage', '模块 id 等于合并后的包名')

// 迷你 React：够跑一个函数组件（useState/useEffect/createElement）
const slotsState = []
let stateIndex = 0
const React = {
  // 函数组件就地调用（和真 React 一致）：会话门禁的外层包装组件靠这条被展开。
  createElement: (type, props, ...children) => {
    const merged = Object.assign({}, props, { children: children.flat(Infinity).filter((c) => c !== null && c !== undefined) })
    return typeof type === 'function' ? type(merged) : { type, props: merged }
  },
  useState: (init) => {
    const i = stateIndex++
    if (slotsState[i] === undefined) slotsState[i] = init
    return [slotsState[i], (v) => { slotsState[i] = typeof v === 'function' ? v(slotsState[i]) : v }]
  },
  useEffect: (fn) => { fn() },
}
const mod = loaded.factory((name) => { if (name === 'react') return React; throw new Error('unexpected require ' + name) })
ok(Array.isArray(mod.inject) && mod.inject.includes('slots'), 'declare inject: [slots]', JSON.stringify(mod.inject))
mod.apply(ctxClient)
ok(!!registration && registration.id === 'kid-storage' && registration.order === 8, '已注册到 conversation.input.dock',
  registration && `id=${registration.id} order=${registration.order}`)
ok(styleTags.length === 1 && styleTags[0].dataset.plugin === '@kidlab/dsh-kid-storage', '注入了自己的 <style data-plugin>')
ok(styleTags[0].dataset.pluginCss === '@kidlab/dsh-kid-storage/card.css', '样式表带 data-plugin-css 标记（可回收）')
ok(typeof cssInjector === 'function', '样式注册在 effect 里（可回收）')

// ---------- 3b) 会话门禁 ----------
// 允许列表直接从源码里读，避免测试里再抄一份会话 id（抄了就会与插件配置脱节）。
console.log('\n[3b] 会话门禁：ONLY_SESSIONS 的可见范围')
// 允许列表直接从源码里读，避免测试里再抄一份（抄了就会与插件配置脱节）。
// 两种情况都要绿：白名单为空 = 所有会话渲染；非空 = 只放行白名单（当前是空数组，见 3a2c3ed）。
const gateLine = /const ONLY_SESSIONS = \[([^\]]*)\]/.exec(clientSource)
const allowedSessions = gateLine ? [...gateLine[1].matchAll(/'([^']*)'/g)].map((m) => m[1]) : []
const OTHER_SESSION = 'session-00000000-0000-0000-0000-000000000000'
const HERE = allowedSessions[0] || OTHER_SESSION
// 门禁测试只要判断“渲染了什么”，不碰网络：沙箱里真去 fetch 会直接段错误（exit 139）。
globalThis.fetch = async () => { throw new Error('门禁测试不打网络') }
const renderAs = (props) => { stateIndex = 0; return widget(props) }
const isCard = (n) => !!n && String(n.props && n.props.className).includes('st-card')
if (allowedSessions.length === 0) {
  ok(isCard(renderAs({ sessionId: OTHER_SESSION, session: { sessionId: OTHER_SESSION }, input: null })),
    'ONLY_SESSIONS 为空 = 所有会话都渲染')
  ok(clientSource.includes('sessionIdOf'), '会话门禁的判定函数仍在（要限定会话时改白名单即可）')
} else {
  ok(!isCard(renderAs({ session: { sessionId: OTHER_SESSION }, input: null })),
    '别的会话：渲染 null（卡片不出现、轮询也不启动）')
  ok(!isCard(renderAs({ sessionId: OTHER_SESSION, session: { sessionId: OTHER_SESSION }, input: null })),
    '别的会话：顶层 sessionId 也照样挡住')
  ok(isCard(renderAs({ session: { sessionId: allowedSessions[0] }, input: null })),
    '本会话：通过 owner prop session.sessionId 正常渲染卡片')
  ok(isCard(renderAs({ sessionId: allowedSessions[0], input: null })), '本会话：通过顶层 sessionId 也认得出来')
  console.log('   · 本卡片只在 ' + allowedSessions.join(', ') + ' 这些会话里显示')
}

// ---------- 4) 用真实数据渲染 ----------
// 渲染用的数据里塞两个假映像：这样「映像行」在任何一台机器上都能被测到，
// 不会被「本机此刻没挂映像」掩盖。
data.images = [{ label: 'Trae CN', mount: '/Volumes/Trae CN' }, { label: 'VS Code', mount: '/Volumes/VS Code' }]
globalThis.fetch = async () => ({ ok: true, json: async () => data })
const render = () => renderAs({ sessionId: HERE, session: { sessionId: HERE }, input: null })
const walk = (n, out = []) => {
  if (typeof n === 'string') { out.push(n); return out }
  if (!n || !n.props) return out
  out.push(n)
  for (const c of [].concat(n.props.children || [])) walk(c, out)
  return out
}

render()                     // 首次：data=null
await new Promise((r) => setTimeout(r, 30))   // 等 effect 里的 fetch 落地
const collapsed = render()   // 再渲染：折叠态，应带上数据摘要
const collapsedNodes = walk(collapsed)
const collapsedText = collapsedNodes.filter((n) => typeof n === 'string')
const summary = collapsedText.find((t) => t.includes('还剩'))

// 默认折叠：点标题展开后，明细（含占用榜横条）才会渲染
const toggle = collapsedNodes.find((n) => n && n.props && n.props.className === 'st-toggle')
if (toggle) toggle.props.onClick()
const tree = render()

const rows = walk(tree).filter((n) => n && n.props && n.props.className === 'row')
const widths = rows.map((r) => {
  const bar = r.props.children.find((c) => c && c.props && c.props.className === 'bar')
  const fill = bar && bar.props.children.find((c) => c && c.props && c.props.className === 'fill')
  return fill ? fill.props.style.width : '?'
})
const texts = walk(tree).filter((n) => typeof n === 'string')
console.log('\n[4] 渲染结果（真实数据）')
ok(!!summary, '折叠摘要里有「系统盘剩余空间」', summary)
ok(rows.length > 0, '展开后占用榜渲染出横条行数', rows.length + ' 行：' + rows.map((r) => r.props.children[0].props.children.join('')).join(', '))
ok(widths.length > 0 && new Set(widths).size > 1, '横条长度彼此不同（不是全都一样长）', widths.join(' / '))
ok(texts.some((t) => /\d/.test(t) && /GB|MB|KB/.test(t)), '榜单里带人类可读体积', texts.filter((t) => /GB|MB|KB/.test(t)).slice(0, 4).join(' / '))

const imgLine = texts.find((t) => t.includes('安装包映像'))
ok(!!imgLine, '渲染出「还挂着 N 个安装包映像」一行', imgLine)
ok(texts.some((t) => t.includes('Trae CN')), '映像行里列出了映像名字')
const volCells = walk(tree).filter((n) => n && n.props && n.props.className === 'st-cell')
  .flatMap((c) => walk(c).filter((n) => typeof n === 'string'))
ok(!volCells.some((t) => t.includes('Trae CN')), '映像没有被画成分区格子', volCells.join(' | '))

console.log('\n' + (failed === 0 ? '全部通过 ✅' : failed + ' 项未通过 ❌'))
process.exit(failed === 0 ? 0 : 1)
