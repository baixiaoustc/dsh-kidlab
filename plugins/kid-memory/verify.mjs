// ============================================================
// kid-memory · 本地自测（不需要 dsh，直接 `node verify.mjs`）
// 覆盖六段：
//   ① 契约：package.json 的四条硬性要求 + files 白名单
//   ② 语法：index.js / tools.js / collect.js / client.js 能被 node 解析
//   ③ host half：apply(mock ctx) 注册 4 个工具 + 一条 exact 路由
//   ③b 工具：四个工具真跑一遍 + 参数形状 / 描述逐字对照 legacy
//   ④ 路由：GET/HEAD → JSON、非 GET → 405（假 req/res，不启服务器）
//   ⑤ client half：IIFE + __ModuleLoader__.load + fetch(PATH) + 槽位注册 + 样式回收
//   ⑥ 用数据渲染组件树：折叠摘要 + 展开后的按比例横条
// 全绿退出码 0。
// ============================================================
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runInNewContext, Script } from 'node:vm'
import assert from 'node:assert/strict'
import {
  collect,
  humanBytes,
  humanKB,
  parseMemsize,
  parsePressure,
  pressureHint,
  normApp,
  parseProcList,
  aggregateByApp,
} from './collect.js'
import { apply } from './index.js'

const DIR = dirname(fileURLToPath(import.meta.url))
let failed = 0
const ok = (c, m, extra) => {
  console.log((c ? '  ✅ ' : '  ❌ ') + m + (extra === undefined ? '' : '  → ' + extra))
  if (!c) failed++
}
const check = (name, fn) => { try { fn() } catch (e) { console.log('  ❌ ' + name + ' — ' + (e && e.message ? e.message : e)); failed += 1; return } console.log('  ✅ ' + name) }

// ---------- ① 契约 ----------
console.log('\n① 契约 package.json')
const pkg = JSON.parse(readFileSync(join(DIR, 'package.json'), 'utf8'))
check('name 是 @kidlab/dsh-kid-memory', () => assert.equal(pkg.name, '@kidlab/dsh-kid-memory'))
check('version 是 0.2.0', () => assert.equal(pkg.version, '0.2.0'))
check('type: module', () => assert.equal(pkg.type, 'module'))
check('main = index.js', () => assert.equal(pkg.main, 'index.js'))
check('exports["."] = ./index.js', () => assert.equal(pkg.exports['.'], './index.js'))
check('exports 暴露 ./client', () => assert.equal(pkg.exports['./client'], './client.js'))
check('dsh.bundle.patch → cordis.patch.yml', () => assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml'))
check('dsh.client.platform = web', () => assert.equal(pkg.dsh.client.platform, 'web'))
check('keywords 含 dsh/dsh-plugin/kid/memory', () => {
  for (const k of ['dsh', 'dsh-plugin', 'kid', 'memory']) assert.ok(pkg.keywords.includes(k), 'keywords 缺 ' + k)
})
check('license = MIT', () => assert.equal(pkg.license, 'MIT'))
check('files 白名单含全部产物且文件都在', () => {
  for (const f of ['index.js', 'tools.js', 'collect.js', 'client.js', 'cordis.patch.yml', 'README.md']) {
    assert.ok(pkg.files.includes(f), 'files 缺 ' + f)
    assert.ok(existsSync(join(DIR, f)), '文件不存在 ' + f)
  }
})
check('files 不含 legacy/', () => assert.ok(!JSON.stringify(pkg.files).includes('legacy')))

// ---------- ② 语法 ----------
console.log('\n② 语法')
for (const f of ['index.js', 'tools.js', 'collect.js', 'client.js']) {
  check(f + ' 可解析', () => { execFileSync(process.execPath, ['--check', join(DIR, f)], { stdio: 'pipe' }) })
}

// ---------- ③ host half：工具 + 路由 ----------
console.log('\n③ host half：apply(mock ctx) → 工具注册 + 路由')
let route = null
let tools = []
let toolsDisposer = null
const mkCtx = () => ({
  get: (n) => (n === 'webServer' ? { register: (r) => { route = r; return () => {} } } : undefined),
  effect: (fn) => fn(),
  inject: (_deps, cb) => cb({
    effect: (fn) => { toolsDisposer = fn() },
    tools: { register: (t) => { tools.push(t); return () => {} } },
  }),
})
apply(mkCtx())
const NAMES = ['mem_workbench', 'mem_now', 'mem_top', 'mem_pressure']
ok(tools.length === 4, '注册了 4 个模型工具', tools.map((t) => t.name).join(' / '))
ok(NAMES.every((n) => tools.some((t) => t.name === n)), '工具名与旧插件一致（mem_*）', NAMES.join(' / '))
ok(!!route && route.kind === 'exact' && route.path === '/kid-memory/collect',
  '注册了精确路由 /kid-memory/collect', route && `${route.kind} ${route.path}`)
ok(typeof route.handler === 'function', '路由带 handler')
ok(typeof toolsDisposer === 'function', '工具注册在 effect 里（可回收）')
toolsDisposer()
ok(true, '工具回收函数可调用，不抛错')

// 无参工具的参数形状：与旧 defineTool({parameters:{}}) 的投影 {type:'object',properties:{}} 一致
const NO_PARAMS = JSON.stringify({ type: 'object', properties: {} })
ok(tools.every((t) => JSON.stringify(t.parameters) === NO_PARAMS),
  '四个工具的参数形状都是 {type:"object",properties:{}}（对齐旧版投影，且无 additionalProperties）',
  JSON.stringify(tools[0].parameters))
ok(tools.every((t) => !t.parameters.required && !t.parameters.additionalProperties),
  '没有 required / additionalProperties 等多余键（否则模型的调用契约会变）')

// 描述逐字保留（照抄 legacy/src/tools.ts，不改一个字符）
const WANT_DESC = {
  mem_workbench: '看看这台电脑的“工作台”有多大——也就是总内存有多少。内存就是电脑拿来“同时记住正在做的几件事”的地方，越大能同时摊开越多任务和程序，电脑就越不容易卡。免 sudo。返回总内存和一句解释。',
  mem_now: '看看这台电脑的工作台“现在摊了多少东西”——内存现在用了多少、还剩多少、占用百分之几。适合给小朋友讲“内存是用一点少一点的短期记忆，关掉不用的程序就腾出来了”。免 sudo。返回已用/空闲/占用百分比。',
  mem_top: '找出谁在占着这台电脑的工作台——内存占用最大的几个程序。带小朋友一起看看“谁是占位置最多的贪吃鬼”，通常浏览器、视频、微信这些开得多的最占内存。免 sudo。返回按内存占用排序的前 12 名。',
  mem_pressure: '看看这台电脑的工作台“挤不挤”——也就是内存压力/空闲率。如果很挤，说明打开的太多了，电脑会变卡。免 sudo。返回内存空闲百分比和一句“宽裕/有点挤/很紧张”的解读。',
}
ok(NAMES.every((n) => tools.find((t) => t.name === n).description === WANT_DESC[n]),
  '四个工具的 description 与 legacy/src/tools.ts 逐字一致')
const shape = (t) => !!t && typeof t.description === 'string' && t.description.length > 20 &&
  !!t.parameters && t.parameters.type === 'object' &&
  !!t.output && t.output.schema && t.output.schema.type === 'string' && typeof t.output.render === 'function' &&
  typeof t.execute === 'function'
ok(tools.every(shape), '每个工具都有 description / object parameters / text output / execute')

// 开关：enabled:false 只关工具，卡片数据路由照常
route = null
tools = []
apply(mkCtx(), { enabled: false })
ok(tools.length === 0, 'enabled:false 时不注册工具')
ok(!!route, 'enabled:false 时路由照常（卡片还能显示数据）')
route = null
tools = []
apply(mkCtx(), { timeoutMs: 'abc' })
ok(tools.length === 4, 'timeoutMs 不合法时退回默认值，照样注册 4 个工具')
route = null
tools = []
apply(mkCtx(), { timeoutMs: 999999 })
ok(tools.length === 4, 'timeoutMs 超上限被收敛，照样注册 4 个工具')

// 没有 tools 能力的 profile / 没有 webServer 的 headless
route = null
const bare = { get: () => undefined, effect: (fn) => fn(), inject: () => {} }
let threw = null
try { apply(bare) } catch (e) { threw = e }
ok(threw === null, '没有 tools 能力也不抛错（ctx.inject 挂着等）')
ok(route === null, '没有 webServer（headless）→ 静默跳过路由，不抛错')

// ---------- ③b 四个工具真跑一遍 ----------
console.log('\n③b 四个工具各跑一次（沙箱里被拦也给一行人话说明，不抛错）')
tools = []
apply(mkCtx())
const byName = {}
for (const t of tools) byName[t.name] = t
const wb = await byName.mem_workbench.execute()
const now = await byName.mem_now.execute()
const top = await byName.mem_top.execute()
const press = await byName.mem_pressure.execute()
ok(typeof wb === 'string' && wb.length > 0 && (wb.startsWith('【工作台 / 总内存】') || wb.startsWith('[')),
  'mem_workbench：给出总内存标题或降级说明', (wb.split('\n')[0] || '').slice(0, 40))
ok(wb.startsWith('【工作台 / 总内存】'), 'mem_workbench：本机能拿到总内存（sysctl 可用）')
ok(typeof now === 'string' && now.length > 0 && (now.startsWith('【工作台现在摊了多少】') || now.startsWith('[')),
  'mem_now：给出用量标题或降级说明', (now.split('\n')[0] || '').slice(0, 40))
ok(typeof top === 'string' && top.startsWith('【谁在占工作台 / 内存贪吃鬼 Top】'),
  'mem_top：给出占用榜标题（管道里 head 没报错，被拦时也走空表分支）', (top.split('\n')[1] || '').slice(0, 40))
ok(typeof press === 'string' && (press.startsWith('【工作台挤不挤 / 内存压力】') || press.startsWith('[')),
  'mem_pressure：给出压力标题或降级说明', (press.split('\n')[0] || '').slice(0, 40))

// ---------- ④ 路由：假 req/res ----------
console.log('\n④ 路由应答：GET / HEAD / POST')
route = null
tools = []
apply(mkCtx())
const call = async (method) => {
  let status = 0
  let headers = null
  let body = ''
  const res = { writeHead: (s, h) => { status = s; headers = h }, end: (t) => { body = t || '' } }
  const t0 = Date.now()
  await route.handler({ method }, res)
  return { status, headers, body, ms: Date.now() - t0 }
}
const got = await call('GET')
ok(got.status === 200, 'GET → 200', 'status=' + got.status)
ok(String(got.headers && got.headers['content-type']).includes('application/json'), 'content-type 是 JSON',
  String(got.headers && got.headers['content-type']))
ok(String(got.headers && got.headers['cache-control']) === 'no-store', '带 cache-control: no-store')
let parsed = null
try { parsed = JSON.parse(got.body) } catch { /* 下面断言报出来 */ }
ok(!!parsed && typeof parsed.usedPct === 'number' && Array.isArray(parsed.top) && !!parsed.total,
  'JSON 里带 total / used / free / usedPct / top',
  parsed ? `usedPct=${parsed.usedPct} top=${parsed.top.length} 项` : '解析失败')
ok(Number(got.headers['content-length']) === Buffer.byteLength(got.body), 'content-length 与实体长度一致',
  `${got.headers['content-length']} 字节，耗时 ${got.ms} ms`)
const head = await call('HEAD')
ok(head.status === 200 && head.body === '' && Number(head.headers['content-length']) > 0,
  'HEAD 只回头不回体', `content-length=${head.headers['content-length']}`)
const post = await call('POST')
ok(post.status === 405 && post.headers.allow === 'GET', '非 GET/HEAD 拒绝为 405 + allow: GET', 'status=' + post.status)

// ---------- ⑤ client half ----------
console.log('\n⑤ client half：IIFE + __ModuleLoader__ + 槽位注册')
const styleTags = []
const document = {
  querySelector: () => null,
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
ok(/(^|\n)\s*;\s*\(\s*\(\s*\)\s*=>\s*\{/.test(clientSource) && /\}\)\(\)\s*$/.test(clientSource.trimEnd()),
  '整体包在 IIFE 里（避免顶层 const 撞全页词法作用域——见迁移指南 §13）')
runInNewContext(clientSource, {
  window: Object.assign(win, { __ModuleLoader__: { load: (m) => { win.__loaded = m } } }),
  document,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  fetch: (...a) => globalThis.fetch(...a),
  Date,
  console,
})
const loaded = win.__loaded
ok(!!loaded, '已向模块表注册工厂', loaded && 'id=' + loaded.id)
ok(loaded.id === '@kidlab/dsh-kid-memory', '模块 id 等于裸包名（package.json 的 name）', loaded.id)
ok(/const PKG = '@kidlab\/dsh-kid-memory'/.test(clientSource), '源码里的 PKG 常量 = 包名')
ok(/const PATH = '\/kid-memory\/collect'/.test(clientSource), '源码里的 PATH = /kid-memory/collect')
// 去掉注释行再做负向断言：注释里为了讲清「与 0.1 动态版的差别」会提到 host.call。
const clientCode = clientSource.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n')
ok(/fetch\(PATH/.test(clientCode) && !/host\.call\(/.test(clientCode), '数据走 fetch(PATH)（不再是 host.call）')

// 迷你 React：够跑一个函数组件（useState/useEffect/createElement）
const slotsState = []
let stateIndex = 0
const React = {
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
ok(!!registration && registration.id === 'kid-memory' && registration.order === 7,
  '已注册到 conversation.input.dock（顺序 7，不与 coder5/storage6/security8/process9 撞）',
  registration && `id=${registration.id} order=${registration.order}`)
ok(registration.name === 'conversation.input.dock', '注册名就是槽位名')
ok(styleTags.length === 1 && styleTags[0].dataset.plugin === '@kidlab/dsh-kid-memory', '注入了自己的 <style data-plugin>')
ok(styleTags[0].dataset.pluginCss === '@kidlab/dsh-kid-memory/card.css',
  '样式标签打上 data-plugin-css="<包名>/card.css"', styleTags[0].dataset.pluginCss)
ok(typeof cssInjector === 'function', '样式注册在 effect 里（可回收）')
cssInjector()
ok(styleTags[0].removed === true, '样式回收函数把 <style> 摘掉（插件卸载不留痕）')

// 回归护栏：inline 的 <span> 会忽略 width，症状是「所有横条一样长」。
const cssBlock = clientSource.slice(clientSource.indexOf('const CSS ='), clientSource.indexOf('const ensureStyles'))
ok(/\.mem-gauge \.fill\{display:block/.test(cssBlock) && /\.mem-list \.fill\{display:block/.test(cssBlock),
  '两条 fill 都有 display:block（否则百分比宽度会被忽略）')
ok(/\.mem-list \.bar\{display:flex/.test(cssBlock), '横条轨道是 display:flex（给填充一个可计算的宽度）')

// ---------- ⑤b 会话门禁（只判断渲染了什么，不碰网络） ----------
console.log('\n⑤b 会话门禁：ONLY_SESSIONS 的可见范围')
const gateLine = /const ONLY_SESSIONS = \[([^\]]*)\]/.exec(clientSource)
const allowed = gateLine ? [...gateLine[1].matchAll(/'([^']*)'/g)].map((m) => m[1]) : []
const OTHER_SESSION = 'session-00000000-0000-0000-0000-000000000000'
globalThis.fetch = async () => { throw new Error('门禁测试不打网络') }
const renderAs = (props) => { stateIndex = 0; return widget(props) }
const isCard = (n) => !!n && String(n.props && n.props.className).includes('mem-card')
if (allowed.length === 0) {
  ok(isCard(renderAs({ sessionId: OTHER_SESSION, session: { sessionId: OTHER_SESSION }, input: null })),
    'ONLY_SESSIONS 为空 = 所有会话都渲染')
  ok(clientSource.includes('sessionIdOf'), '会话门禁的判定函数仍在（要限定会话时改白名单即可）')
} else {
  ok(!isCard(renderAs({ session: { sessionId: OTHER_SESSION }, input: null })),
    '别的会话：渲染 null（卡片不出现、轮询也不启动）')
  ok(!isCard(renderAs({ sessionId: OTHER_SESSION, session: { sessionId: OTHER_SESSION }, input: null })),
    '别的会话：顶层 sessionId 也照样挡住')
  ok(isCard(renderAs({ session: { sessionId: allowed[0] }, input: null })),
    '本会话：通过 owner prop session.sessionId 正常渲染卡片')
  ok(isCard(renderAs({ sessionId: allowed[0], input: null })), '本会话：通过顶层 sessionId 也认得出来')
  console.log('   · 本卡片只在 ' + allowed.join(', ') + ' 这些会话里显示')
  // 白名单写错一个字符 = 卡片在哪儿都不出现，而槽位树看起来完全正常。所以有
  // $DSH_SESSION_ID 时顺手核对；但这里**只提示不判负**，保证任何会话里跑都全绿。
  if (process.env.DSH_SESSION_ID) {
    const aligned = allowed.includes(process.env.DSH_SESSION_ID)
    console.log('   · 白名单 ←→ 本会话($DSH_SESSION_ID)：' + (aligned ? '对齐 ✅' : '不对齐（本会话里卡片不显示，属预期）'))
  }
}

// ---------- ⑥ 渲染 ----------
console.log('\n⑥ 渲染：折叠摘要 + 展开后的按比例横条')
const data = await collect()
const SYN = [
  { kb: 1000000, name: 'Big App', num: '977', unit: 'MB' },
  { kb: 250000, name: 'Mid App', num: '244', unit: 'MB' },
  { kb: 50000, name: 'Small App', num: '49', unit: 'MB' },
  { kb: 1000, name: 'Tiny App', num: '1000', unit: 'KB' },
]
const renderData = { ...data, top: SYN }
globalThis.fetch = async () => ({ ok: true, json: async () => renderData })
const VISIBLE_SESSION = allowed.length ? allowed[0] : OTHER_SESSION
const render = () => renderAs({ sessionId: VISIBLE_SESSION, session: { sessionId: VISIBLE_SESSION }, input: null })
const walk = (n, out = []) => {
  if (typeof n === 'string') { out.push(n); return out }
  if (!n || !n.props) return out
  out.push(n)
  for (const c of [].concat(n.props.children || [])) walk(c, out)
  return out
}
render()
await new Promise((r) => setTimeout(r, 30))
const collapsed = render()
const collapsedText = walk(collapsed).filter((n) => typeof n === 'string')
ok(collapsedText.some((t) => t.includes('已摊开')), '折叠摘要里有「已摊开 N%」',
  collapsedText.find((t) => t.includes('已摊开')))
ok(collapsedText.some((t) => t.includes('记忆小管家')), '标题是「记忆小管家 · 电脑的工作台」')
ok(walk(collapsed).filter((n) => n && n.props && n.props.className === 'row').length === 0,
  '默认折叠：不渲染占用榜（省开销）')

const toggle = walk(collapsed).find((n) => n && n.props && n.props.className === 'mem-toggle')
ok(!!toggle && typeof toggle.props.onClick === 'function', '折叠行可点击展开')
if (toggle) toggle.props.onClick()
const tree = render()
const nodes = walk(tree)
const texts = nodes.filter((n) => typeof n === 'string')
const rows = nodes.filter((n) => n && n.props && n.props.className === 'row')
const widths = rows.map((r) => {
  const bar = r.props.children.find((c) => c && c.props && c.props.className === 'bar')
  const fill = bar && bar.props.children.find((c) => c && c.props && c.props.className === 'fill')
  return fill ? fill.props.style.width : '?'
})
ok(rows.length === SYN.length, '展开后占用榜渲染出行', rows.length + ' 行')
ok(widths.join() === '100%,25%,5%,4%', '横条按比例（100万/25万/5万/1千 KB → 100%/25%/5%/4%）', widths.join(' / '))
ok(new Set(widths).size > 1, '横条长度彼此不同（不是全都一样长）', widths.join(' / '))
ok(texts.some((t) => t.includes('👑') && t.includes('Big App')), '榜首带皇冠标记')
ok(texts.some((t) => t.includes('挤不挤？')), '渲染出「挤不挤？」定性一栏', texts.find((t) => t.includes('挤不挤？')))
ok(texts.some((t) => t.includes('谁在占着工作台')), '渲染出占用榜标题')
ok(texts.some((t) => t.includes('每 8 秒看一眼')), '页脚带刷新节奏与时间', texts.find((t) => t.includes('每 8 秒看一眼')))

// ---------- 收尾：采集层纯函数抽检（离线可复现） ----------
console.log('\n[附] 采集层纯函数抽检')
ok(normApp('Google Chrome Helper (Renderer)') === 'Google Chrome' &&
  normApp('/Applications/Visual Studio Code.app/Contents/MacOS/Electron') === 'Visual Studio Code',
  'normApp 认得真实形态')
ok(normApp('com.apple.WebKit.WebContent') === 'WebContent', 'com.apple.* 不再被截成「com」')
ok(humanBytes(2 * 1024 * 1024 * 1024).num === '2.0' && humanBytes(2 * 1024 * 1024 * 1024).unit === 'GB', '2GiB → 2.0 GB')
ok(humanKB(2048).unit === 'MB', '2048KB → MB')
ok(parseMemsize('8589934592\n') === 8589934592 && parseMemsize('oops') === 0, 'parseMemsize 解析/降级')
ok(parsePressure('System-wide memory free percentage: 50%') === 50 && parsePressure('nope') === null, 'parsePressure 解析/降级')
ok(pressureHint(60).level === '宽裕' && pressureHint(30).level === '有点挤' && pressureHint(5).level === '很紧张',
  '三档定性阈值正确（≥50 宽裕 / ≥20 有点挤 / 否则很紧张）')
const FIXTURE = [
  '1073741824\tGoogle Chrome Helper (Renderer)',
  '536870912\tGoogle Chrome Helper (GPU)',
  '268435456\tGoogle Chrome',
  '1048576\tcom.apple.WebKit.WebContent',
  '524288 not a valid line (没有制表符)',
  '0\tZero Rss',
].join('\n')
const aggFixture = aggregateByApp(parseProcList(FIXTURE), 5)
ok(parseProcList(FIXTURE).length === 4, 'parseProcList 只认 `rss<TAB>name`，丢弃杂质行', parseProcList(FIXTURE).length + ' 行 / 输入 6 行')
ok(aggFixture.length === 2 && aggFixture[0].name === 'Google Chrome', '同一 App 的主进程与 helper 合并成一行',
  JSON.stringify(aggFixture.map((a) => [a.name, a.kb])))
ok(aggregateByApp([], 5).length === 0 && aggregateByApp(null).length === 0, '空输入不炸（返回空榜）')

console.log('\n' + (failed === 0 ? '全部通过 ✅' : failed + ' 项未通过 ❌'))
process.exit(failed === 0 ? 0 : 1)
