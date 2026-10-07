// ============================================================
// kid-process 自检（离线为主，不依赖本机此刻的进程表）
//
//   [1]  collect() 真机采集一次（本机 ps 可用时断言真实数字）
//   [1b] 离线断言：喂假文本 → countRoll / zombieList / parseBusiest / foremanOf / levelOf / assemble
//   [2]  host half：apply() 装载 → 路由 + 4 个工具 + 开关行为 + 模拟 HTTP 应答
//   [2b] 四个工具真跑一遍（ps 可用时核对完整输出；沙箱里核对降级文案）
//   [3]  client half：__ModuleLoader__ 装载 → apply → conversation.input.dock 槽位
//   [3b] 会话门禁：只有 ONLY_SESSIONS 里的会话才渲染
//   [4]  用假数据渲染卡片：折叠摘要 → 展开 → 点名板 / 堆叠条 / 卖力榜 / 家族 / 僵尸 / 页脚
//
// 跑法：node verify.mjs   → 全 ✅ 且 EXIT=0
// 说明：本仓库的 bash 沙箱会拦 /bin/ps（Operation not permitted），
//   所以真机断言会自动降级；插件在 dsh 进程里跑（不受该沙箱限制）时才看得到真数字。
// ============================================================
import { readFileSync } from 'node:fs'
import { runInNewContext, Script } from 'node:vm'
import {
  CMD, BUSIEST_N, TOP_N, KIDS_N,
  countRoll, zombieList, parseBusiest, foremanOf, levelOf, assemble, collect, prettyName, statCN,
} from './collect.js'
import { apply } from './index.js'

let failed = 0
const ok = (c, m, extra) => {
  console.log((c ? '  ✅ ' : '  ❌ ') + m + (extra === undefined ? '' : '  → ' + extra))
  if (!c) failed++
}

// ---------- 假文本（离线断言的唯一输入） ----------
// 点名：10 个小工人 = 3 卖力(R) + 4 打盹(S) + 2 僵尸(Z) + 1 其他(U)
const FAKE_ROLL = [
  'S      1 /sbin/launchd',
  'S    412 /usr/libexec/UserEventAgent',
  'R    884 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'S    885 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'S    886 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'R   1201 /usr/local/bin/node',
  'R   1300 /usr/bin/bash',
  'U   1402 /usr/libexec/busything',
  'Z   1500 /Applications/Ghost.app/Contents/MacOS/Ghost',
  'Z   1501 defunct',
].join('\n')
// 卖力榜：Chrome 三个分身合起来最卖力（45.2 + 12.0 = 57.2）
const FAKE_BUSIEST = [
  ' 45.2   884 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ' 12.0   885 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ' 20.5  1201 /usr/local/bin/node',
  '  8.0   412 /usr/libexec/UserEventAgent',
  '  3.3  1300 /usr/bin/bash',
].join('\n')
// 家族：总管 launchd 直接带 5 个徒弟（UserEventAgent 派了两个分身）
const FAKE_TABLE = [
  '    1     0 /sbin/launchd',
  '  412     1 /usr/libexec/UserEventAgent',
  '  884     1 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '  885   884 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '  886   884 /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ' 1201     1 /usr/local/bin/node',
  ' 1300  1201 /usr/bin/bash',
  ' 1402     1 /usr/libexec/UserEventAgent',
  ' 1500     1 /Applications/Ghost.app/Contents/MacOS/Ghost',
].join('\n')
const FAKE = { roll: FAKE_ROLL, busiest: FAKE_BUSIEST, table: FAKE_TABLE }
const FAKE_DATA = assemble(FAKE)

// 先探一下本机 ps 到底能不能用（沙箱里会被拦）。
const probe = await collect()
const HAS_PS = probe.headcount.parsed
console.log(HAS_PS
  ? `本机 ps 可用：真机断言开启（此刻 ${probe.headcount.total} 个小工人在册）`
  : '⚠️  当前环境 /bin/ps 被拦（沙箱）：真机断言降级为「形状 + 降级文案」核对')

// ---------- 1) 真机采集 ----------
console.log('\n[1] collect() 真机采集一次')
const real = await collect()
ok(typeof real === 'object' && !!real.headcount && !!real.level && typeof real.ts === 'number',
  'collect() 返回 { headcount, zombies, busiest, foreman, level, ts }')
ok(typeof real.headcount.total === 'number' && real.headcount.total >= 0,
  'headcount.total 是数字', String(real.headcount.total))
ok(real.headcount.total === real.headcount.running + real.headcount.sleeping + real.headcount.zombie + real.headcount.other,
  '四类状态加起来正好等于总数',
  `${real.headcount.running}+${real.headcount.sleeping}+${real.headcount.zombie}+${real.headcount.other}=${real.headcount.total}`)
if (HAS_PS) {
  ok(real.headcount.total > 10, '真机上至少十来个进程', String(real.headcount.total))
  ok(real.headcount.sleeping > 0, '总有在打盹等活儿的', String(real.headcount.sleeping))
  ok(real.busiest.length > 0 && real.busiest[0].cpu > 0, '卖力榜不是空的', real.busiest[0] && `${real.busiest[0].name} ${real.busiest[0].cpu}%`)
  ok(!!real.foreman && real.foreman.pid === 1 && real.foreman.kids > 0, '总管 launchd（工号 1）带了徒弟',
    real.foreman && `${real.foreman.name} 带了 ${real.foreman.kids} 个`)
  ok(Array.isArray(real.zombies) && real.zombies.length <= 12, '僵尸名单最多留 12 个', String(real.zombies.length))
} else {
  ok(real.headcount.total === 0 && real.foreman === null && real.busiest.length === 0,
    '被拦时降级成空数据（不抛错）', JSON.stringify(real.headcount))
  ok(real.level.key === 'unknown' && real.level.emoji === '❓', '降级时卡片等级是「❓ 看不清」', real.level.text)
}

// ---------- 1b) 假文本离线断言 ----------
console.log('\n[1b] 喂假文本：纯函数解析（离线可重现）')
const hc = countRoll(FAKE_ROLL)
ok(hc.total === 10 && hc.running === 3 && hc.sleeping === 4 && hc.zombie === 2 && hc.other === 1,
  'countRoll：10 = 3 卖力 + 4 打盹 + 2 僵尸 + 1 其他', JSON.stringify(hc))
ok(hc.parsed === true, 'countRoll：parsed 标记为 true')
ok(countRoll('').parsed === false && countRoll('').total === 0, '空文本 → parsed=false / total=0（不抛错）')
ok(countRoll('这不是 ps 的输出\n乱码一行').total === 0, '不像的行整行丢掉，不误数')
ok(zombieList(FAKE_ROLL).length === 2 && zombieList(FAKE_ROLL)[0].name === 'Ghost',
  'zombieList：只挑 Z 状态，App 名取到 Ghost', JSON.stringify(zombieList(FAKE_ROLL)))
ok(prettyName('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') === 'Google Chrome',
  'prettyName：从 .app 路径里认出 App 名')
ok(prettyName('/usr/local/bin/node') === 'node' && prettyName('') === 'unknown',
  'prettyName：普通程序取最后一段；空串给 unknown')
ok(statCN('R').includes('卖力') && statCN('S').includes('打盹') && statCN('Z').includes('僵尸'),
  'statCN：R/S/Z 分别翻成卖力 / 打盹 / 僵尸')
const bus = parseBusiest(FAKE_BUSIEST)
ok(bus.length === 4, 'parseBusiest：按程序名合并后只剩 4 行（Chrome 三行并成一行）', String(bus.length))
ok(bus[0].name === 'Google Chrome' && bus[0].n === 2 && bus[0].cpu === 57.2 && bus[0].pid === 884,
  '最卖力的是 Chrome：两个分身加了 57.2%，工号留最重的那个', JSON.stringify(bus[0]))
ok(bus[1].name === 'node' && bus[1].cpu === 20.5, '第二名是 node 20.5%', JSON.stringify(bus[1]))
ok(bus.every((b, i) => i === 0 || bus[i - 1].cpu >= b.cpu), '榜单按 CPU 从大到小排好')
ok(parseBusiest(FAKE_BUSIEST, 2).length === 2 && BUSIEST_N === 24 && TOP_N === 6,
  'parseBusiest 尊重 topN；BUSIEST_N=24 / TOP_N=6', `topN=2 → ${parseBusiest(FAKE_BUSIEST, 2).length} 行`)
const fam = foremanOf(FAKE_TABLE)
ok(fam.pid === 1 && fam.name === 'launchd' && fam.kids === 5,
  'foremanOf：总管 launchd 直接带 5 个徒弟', JSON.stringify(fam))
ok(fam.top[0].name === 'UserEventAgent' && fam.top[0].n === 2,
  '徒弟里分身最多的是 UserEventAgent（2 个）', JSON.stringify(fam.top[0]))
ok(fam.top.length <= KIDS_N && KIDS_N === 5, '家族榜最多点名 KIDS_N=5 个')
ok(foremanOf('  412     9 /usr/bin/x') === null, '没有直接徒弟 → 家族返回 null（卡片不画这块）')
ok(levelOf({ total: 10, running: 3, zombie: 2 }).text === '有几个僵尸', 'levelOf：有僵尸 → 🙂 有几个僵尸')
ok(levelOf({ total: 10, running: 3, zombie: 0 }).key === 'tidy', 'levelOf：零僵尸且有在干活 → 😄 车间整洁')
ok(levelOf({ total: 10, running: 0, zombie: 0 }).key === 'idle', 'levelOf：都睡着了 → 😴 都歇了')
ok(levelOf({ total: 10, running: 3, zombie: 9 }).key === 'dirty', 'levelOf：僵尸≥5 → 😅 僵尸有点多')
ok(levelOf({ total: 0 }).key === 'unknown', 'levelOf：没点到名 → ❓ 看不清')
ok(FAKE_DATA.headcount.total === 10 && FAKE_DATA.zombies.length === 2 && FAKE_DATA.busiest.length === 4 &&
  FAKE_DATA.foreman.kids === 5 && FAKE_DATA.level.key === 'few' && typeof FAKE_DATA.ts === 'number',
  'assemble：三段原始文本拼成完整卡片 JSON', JSON.stringify(FAKE_DATA.headcount))
ok(CMD.roll === 'ps -axo stat=,pid=,comm=' && CMD.table === 'ps -axo pid=,ppid=,comm=' &&
  CMD.busiest === 'ps -axo pcpu=,pid=,comm= | sort -rn | head -n 24',
  '三条命令都是硬编码常量、只读、免 sudo')

// ---------- 2) host half ----------
console.log('\n[2] host half：apply() → 路由 + 工具注册')
let route = null
const mkCtx = () => ({
  get: (n) => (n === 'webServer' ? { register: (r) => { route = r; return () => {} } } : undefined),
  effect: (fn) => fn(),
  inject: (_deps, cb) => cb({
    effect: (fn) => { toolsDisposer = fn() },
    tools: { register: (t) => { tools.push(t); return () => {} } },
  }),
})
let tools = []
let toolsDisposer = null
apply(mkCtx())
ok(!!route && route.kind === 'exact' && route.path === '/kid-process/collect',
  '注册了精确路由 /kid-process/collect', route && `${route.kind} ${route.path}`)
ok(typeof route.handler === 'function', '路由带 handler')

const NAMES = ['proc_count', 'proc_busiest', 'proc_family', 'proc_badge']
ok(tools.length === 4, '注册了 4 个模型工具', tools.map((t) => t.name).join(' / '))
ok(NAMES.every((n) => tools.some((t) => t.name === n)), '工具名与旧插件一致', NAMES.join(' / '))
const shape = (t) => !!t && typeof t.description === 'string' && t.description.length > 20 &&
  !!t.parameters && t.parameters.type === 'object' &&
  !!t.output && t.output.schema && t.output.schema.type === 'string' && typeof t.output.render === 'function' &&
  typeof t.execute === 'function'
ok(tools.every(shape), '每个工具都有 description / object parameters / text output / execute')
ok(JSON.stringify(tools.find((t) => t.name === 'proc_count').parameters) === JSON.stringify({ type: 'object', properties: {} }),
  'proc_count 的参数形状是无参 {type:"object",properties:{}}')
ok(JSON.stringify(tools.find((t) => t.name === 'proc_badge').parameters.required) === JSON.stringify(['pid']),
  'proc_badge 用 JSON Schema 顶层的 required:["pid"]')
ok(tools.find((t) => t.name === 'proc_family').parameters.required === undefined,
  'proc_family 的 pid 是可选参数（不写 required）')
ok(typeof toolsDisposer === 'function', '工具注册在 effect 里（可回收）')
toolsDisposer()
ok(true, '回收函数可调用，不抛错')

// 模拟一次 HTTP 应答（真路由，不启服务器）
const mkRes = () => {
  const r = { status: 0, headers: null, body: undefined }
  r.writeHead = (s, h) => { r.status = s; r.headers = h }
  r.end = (b) => { r.body = b }
  return r
}
const post = mkRes()
await route.handler({ method: 'POST' }, post)
ok(post.status === 405 && post.headers.allow === 'GET', '非 GET/HEAD → 405 + allow: GET', String(post.status))
const get = mkRes()
await route.handler({ method: 'GET' }, get)
ok(get.status === 200 && get.headers['content-type'] === 'application/json; charset=utf-8',
  'GET → 200 + application/json; charset=utf-8', get.headers['content-type'])
ok(get.headers['cache-control'] === 'no-store', 'GET → cache-control: no-store（卡片要的是此刻）')
ok(Number(get.headers['content-length']) === Buffer.byteLength(get.body), 'content-length 与正文长度一致')
let parsed = null
try { parsed = JSON.parse(get.body) } catch (e) { parsed = null }
ok(!!parsed && !!parsed.headcount && !!parsed.level, 'GET 正文是能解析的卡片 JSON',
  parsed && `${parsed.headcount.total} 个工人 / ${parsed.level.text}`)
const head = mkRes()
await route.handler({ method: 'HEAD' }, head)
ok(head.status === 200 && head.body === undefined && Number(head.headers['content-length']) > 0,
  'HEAD → 200、不写正文、但仍给出 content-length')

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

// 没有 tools 能力的 profile：不报错，只有卡片
route = null
const bare = { get: () => undefined, effect: (fn) => fn(), inject: () => {} }
let threw = null
try { apply(bare) } catch (e) { threw = e }
ok(threw === null, '没有 tools 能力也不抛错（ctx.inject 挂着等）')
ok(route === null, '没有 webServer（headless）→ 静默跳过路由，不抛错')

// ---------- 2b) 四个工具真跑一遍 ----------
console.log('\n[2b] 四个工具真跑一遍（' + (HAS_PS ? '真机 ps' : '沙箱降级') + '）')
tools = []
apply(mkCtx())
const byName = {}
for (const t of tools) byName[t.name] = t
const countText = await byName.proc_count.execute()
const busyText = await byName.proc_busiest.execute()
const famText = await byName.proc_family.execute()
if (HAS_PS) {
  ok(countText.includes('【现在有多少小工人】'), 'proc_count：给出点名标题', countText.split('\n')[0])
  ok(/这台电脑上一共有 \d+ 个小工人在册/.test(countText), 'proc_count：给出总数',
    (countText.split('\n')[1] || '').slice(0, 40))
  ok(countText.includes('- 赖着不走的僵尸：'), 'proc_count：分状态列出')
  ok(busyText.includes('【谁最卖力 / 干活强度 Top】'), 'proc_busiest：给出卖力榜标题')
  ok(/^\s*1\.\s+[\d.]+%\s+\S/m.test(busyText), 'proc_busiest：榜单形如「名次. CPU% 程序名」',
    (busyText.split('\n')[1] || '').slice(0, 40))
  ok(famText.includes('【工人家族 / 谁带了谁】'), 'proc_family：给出家族标题')
  ok(famText.includes('，总管'), 'proc_family：链顶标出总管 launchd', (famText.split('\n')[1] || '').slice(0, 40))
  ok(/直接带来了 \d+ 个小工人|没有直接带徒弟/.test(famText), 'proc_family：给出直接徒弟数')
  const badge = await byName.proc_badge.execute({ pid: process.pid })
  ok(badge.includes('【小工人工牌】'), 'proc_badge：给出工牌标题')
  ok(badge.includes(`工号（PID）：${process.pid}`), 'proc_badge：工号就是被查的那个', String(process.pid))
  ok(badge.includes('工种（程序名）：node'), 'proc_badge：认出工种是 node')
  ok(/占工作台：[\d.]+% 的内存 ≈ /.test(badge), 'proc_badge：给出内存占用',
    (badge.split('\n').find((l) => l.startsWith('占工作台')) || '').slice(0, 40))
} else {
  ok(countText.startsWith('[工人点名 采集失败]'), 'proc_count：被拦时给一行人话说明，不抛错',
    countText.slice(0, 40))
  ok(busyText.startsWith('【谁最卖力 / 干活强度 Top】') && busyText.includes('暂时没有可读取的进程信息'),
    'proc_busiest：被拦时给标题 + 一句人话说明（管道里的 head 没报错，所以走的是「空表」分支）',
    busyText.split('\n')[1])
  ok(famText.startsWith('[进程表 采集失败]'), 'proc_family：被拦时给一行人话说明')
  const badge = await byName.proc_badge.execute({ pid: process.pid })
  ok(badge.includes('没找到工号') && badge.includes(String(process.pid)),
    'proc_badge：被拦时降级成「没找到工号」，不抛错', badge.slice(0, 30))
}
// 参数校验（与 ps 可用与否无关）
const badPid = await byName.proc_badge.execute({ pid: -3 })
ok(badPid.startsWith('[工牌校验失败]'), 'proc_badge：非法工号（-3）被挡住', badPid.slice(0, 24))
const noPid = await byName.proc_badge.execute({})
ok(noPid.startsWith('[工牌校验失败]'), 'proc_badge：不给工号也挡住（required）')
const missing = await byName.proc_family.execute({ pid: 4194304 })
ok(HAS_PS ? missing.includes('没找到工号 4194304') : missing.startsWith('[进程表 采集失败]'),
  HAS_PS ? 'proc_family：合法但不存在的工号 → 说它下班了' : 'proc_family：被拦时整条命令降级成一行说明（不是解析失败）',
  missing.slice(0, 32))
const zeroPid = await byName.proc_family.execute({ pid: 0 })
ok(HAS_PS ? zeroPid.includes('【工人家族 / 谁带了谁】') : zeroPid.startsWith('[进程表 采集失败]'),
  'proc_family：非法工号（0）被忽略，退回默认看总管（工号 1）', zeroPid.slice(0, 32))
const defaultFam = await byName.proc_family.execute({})
ok(HAS_PS ? defaultFam.includes('【工人家族 / 谁带了谁】') : defaultFam.startsWith('[进程表 采集失败]'),
  'proc_family：不填工号默认看总管那一支')

// ---------- 3) client half ----------
console.log('\n[3] client half：__ModuleLoader__ 装载 → apply → 槽位注册')
const styleTags = []
const document = {
  querySelector: () => null,
  createElement: () => ({
    dataset: {},
    removed: false,
    // 照真 DOM 的规矩：data-plugin-css ↔ dataset.pluginCss（连字符转驼峰）
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
ok(loaded.id === '@kidlab/dsh-kid-process', '模块 id 等于包名（package.json 的 name）')

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
ok(!!registration && registration.id === 'kid-process' && registration.order === 9,
  '已注册到 conversation.input.dock（顺序 9，排在 storage 6 / memory 7 / security 8 之后）',
  registration && `id=${registration.id} order=${registration.order}`)
ok(registration.name === 'conversation.input.dock', '注册名就是槽位名')
ok(styleTags.length === 1 && styleTags[0].dataset.plugin === '@kidlab/dsh-kid-process', '注入了自己的 <style data-plugin>')
ok(styleTags[0].dataset.pluginCss === '@kidlab/dsh-kid-process/card.css', '样式表带 data-plugin-css 标记（可回收）')
ok(typeof cssInjector === 'function', '样式注册在 effect 里（可回收）')
cssInjector()
ok(styleTags[0].removed === true, '样式回收函数把 <style> 摘掉（插件卸载不留痕）')

// ---------- 3b) 会话门禁 ----------
console.log('\n[3b] 会话门禁：只有 ONLY_SESSIONS 里的会话才渲染')
const gateLine = /const ONLY_SESSIONS = \[([^\]]*)\]/.exec(clientSource)
const allowedSessions = gateLine ? [...gateLine[1].matchAll(/'([^']*)'/g)].map((m) => m[1]) : []
const OTHER_SESSION = 'session-00000000-0000-0000-0000-000000000000'
const HERE = allowedSessions[0] || OTHER_SESSION
// 门禁测试只判断“渲染了什么”，不碰网络：沙箱里真去 fetch 会直接段错误（exit 139）。
globalThis.fetch = async () => { throw new Error('门禁测试不打网络') }
const renderAs = (props) => { stateIndex = 0; return widget(props) }
ok(allowedSessions.length > 0, 'client.js 里配了 ONLY_SESSIONS（非空 = 限定会话）', JSON.stringify(allowedSessions))
ok(renderAs({ session: { sessionId: OTHER_SESSION }, input: null }) === null,
  '别的会话：渲染 null（卡片不出现、轮询也不启动）')
ok(renderAs({ sessionId: OTHER_SESSION, session: { sessionId: OTHER_SESSION }, input: null }) === null,
  '别的会话：顶层 sessionId 也照样挡住')
const hereNode = renderAs({ session: { sessionId: HERE }, input: null })
ok(!!hereNode && String(hereNode.props.className).includes('kp-card'),
  '本会话：通过 owner prop session.sessionId 正常渲染卡片',
  hereNode ? 'className=' + hereNode.props.className : String(hereNode))
const hereFlat = renderAs({ sessionId: HERE, input: null })
ok(!!hereFlat && String(hereFlat.props.className).includes('kp-card'),
  '本会话：通过顶层 sessionId 也认得出来')

// ---------- 4) 用假数据渲染 ----------
console.log('\n[4] 用假数据渲染卡片（折叠摘要 → 展开明细）')
globalThis.fetch = async () => ({ ok: true, json: async () => FAKE_DATA })
const walk = (n, out = []) => {
  if (typeof n === 'string') { out.push(n); return out }
  if (!n || !n.props) return out
  out.push(n)
  for (const c of [].concat(n.props.children || [])) walk(c, out)
  return out
}
const nodesIn = (tree, cls) => walk(tree).filter((n) => n && n.props && n.props.className === cls)
const textIn = (node) => walk(node).filter((s) => typeof s === 'string').join('')
const render = () => renderAs({ sessionId: HERE, session: { sessionId: HERE }, input: null })

render()                                       // 首次：data=null
await new Promise((r) => setTimeout(r, 30))     // 等 effect 里的 fetch 落地
const collapsed = render()                      // 再渲染：折叠态，应带上数据摘要
const collapsedText = walk(collapsed).filter((n) => typeof n === 'string')
ok(collapsedText.includes('10 个工人在册 · 3 个在卖力'), '折叠摘要：总数 + 几个在卖力',
  collapsedText.find((t) => t.includes('个工人在册')))
ok(nodesIn(collapsed, 'kp-detail').length === 0, '默认折叠：明细区还没渲染（省算力）')
ok(collapsedText.includes('🙂 有几个僵尸'), '徽章用 collect 给的等级文案', collapsedText.find((t) => t.includes('僵尸')))
ok(nodesIn(collapsed, 'kp-card').length === 1 && nodesIn(collapsed, 'kp-toggle').length === 1,
  '卡片骨架 + 可点标题都在')

// 点标题展开
const toggle = nodesIn(collapsed, 'kp-toggle')[0]
toggle.props.onClick()
const tree = render()
const texts = walk(tree).filter((n) => typeof n === 'string')
ok(nodesIn(tree, 'kp-detail').length === 1, '点一下标题：明细区出现')

const cells = nodesIn(tree, 'kp-cell')
ok(cells.length === 3, '点名板：三格（卖力 / 打盹 / 僵尸）', String(cells.length))
const nums = cells.map((c) => textIn(nodesIn(c, 'num')[0]))
ok(JSON.stringify(nums) === JSON.stringify(['3', '4', '2']), '点名板三个数字就是假数据里的 3 / 4 / 2', nums.join(' / '))
ok(cells.map(textIn).join('|').includes('赖着不走的僵尸'), '第三格点明僵尸（和 memory 的工作台隐喻一致）')

const segs = nodesIn(tree, 'kp-seg')
const widths = segs.map((s) => parseFloat(s.props.style.width))
ok(segs.length === 4, '堆叠条：四种状态各一段（其他状态也画）', String(segs.length))
ok(new Set(widths).size === 4 && widths.reduce((a, b) => a + b, 0) > 99.5 && widths.reduce((a, b) => a + b, 0) < 100.5,
  '堆叠条宽度各不相同、加起来 100%', widths.join(' + ') + ' = ' + Math.round(widths.reduce((a, b) => a + b, 0)))
ok(Math.max(...widths) === 40 && widths[1] === 40, '最宽的一段是「打盹等活儿」（40%）——大部分工人其实在等活儿')

const rows = nodesIn(tree, 'kp-row')
ok(rows.length === 4, '卖力榜：4 行（Chrome 的分身已合并）', String(rows.length))
ok(textIn(nodesIn(rows[0], 'nm')[0]) === 'Google Chrome', '第一名是 Google Chrome')
ok(textIn(nodesIn(rows[0], 'pct')[0]) === '57.2%', '第一名 CPU 57.2%（两个分身相加）', textIn(nodesIn(rows[0], 'pct')[0]))
ok(textIn(nodesIn(rows[0], 'n')[0]) === '×2', '分身数标在名字后面：×2')
const barW = rows.map((r) => parseFloat(nodesIn(r, 'bfill')[0].props.style.width))
ok(barW[0] === 100, '横条按「本榜最卖力的那个」归一化：第一名满格', barW.join(' / '))
ok(new Set(barW).size === barW.length && barW.every((w, i) => i === 0 || barW[i - 1] > w),
  '横条长度严格递减（一眼看出谁比谁卖力）')
ok(rows.every((r) => nodesIn(r, 'bwrap').length === 1), '每行都有横条容器')
ok(nodesIn(rows[0], 'nm')[0].props.title === '工号 884', '名字上的悬停提示给出工号（对上工具里的「工号」）')

ok(texts.join('').includes('总管 launchd（工号 1）带了 5 个直接徒弟'), '家族：总管 + 直接徒弟数',
  texts.join('').slice(texts.join('').indexOf('总管'), texts.join('').indexOf('总管') + 22))
const chips = nodesIn(tree, 'kp-chip').map(textIn)
ok(chips.length === 4 && chips[0] === 'UserEventAgent ×2',
  '徒弟小标签：分身合并成 ×2，按人数排序', chips.join(' / '))

const zombieBox = nodesIn(tree, 'kp-zombie')
ok(zombieBox.length === 1, '有僵尸时才画僵尸名单', String(zombieBox.length))
const zText = textIn(zombieBox[0])
ok(zText.includes('Ghost（工号 1500）') && zText.includes('defunct（工号 1501）'),
  '僵尸名单点出名字和工号', zText.slice(0, 60))
ok(zText.includes('不用怕'), '僵尸那句给出安抚（启蒙向）')
ok(texts.join('').includes('每 15 秒点一次名'), '页脚写明轮询节奏')
ok(texts.join('').includes('进程 = 在这台电脑上干活的小工人'), '页脚重申隐喻')

// 没有僵尸时：那块不画（用同一套渲染再跑一遍空僵尸数据）
const NO_ZOMBIE = assemble({ roll: FAKE_ROLL.replace(/\nZ.*/g, ''), busiest: FAKE_BUSIEST, table: FAKE_TABLE })
globalThis.fetch = async () => ({ ok: true, json: async () => NO_ZOMBIE })
stateIndex = 0
slotsState.length = 0
render()
await new Promise((r) => setTimeout(r, 30))
const clean = render()
nodesIn(clean, 'kp-toggle')[0].props.onClick()
const cleanTree = render()
ok(nodesIn(cleanTree, 'kp-zombie').length === 0, '零僵尸时：僵尸名单整块不画')
ok(walk(cleanTree).filter((n) => typeof n === 'string').join('').includes('😄 车间整洁'),
  '零僵尸且有在卖力 → 徽章变「😄 车间整洁」')

console.log('\n' + (failed === 0 ? '全部通过 ✅' : failed + ' 项未通过 ❌'))
process.exit(failed === 0 ? 0 : 1)
