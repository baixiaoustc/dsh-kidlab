// ============================================================
// kid-security · 本地端到端自检（无需浏览器、不依赖本机此刻的安全设置）
//   1)  守卫判定：往 assemble 注入假文本，五道守卫四态（good/warn/bad/unknown）全覆盖
//   1b) 真机采集：execFile 的七条只读命令是否出值
//   2)  host half：webServer 路由注册，假 req/res 走一次 GET / POST / HEAD
//   3)  client half：模块表注册 → apply → 槽位注册 → 样式可回收
//   3b) 会话门禁：白名单外的会话渲染 null
//   3c) 共存：把本卡片与已合并的 kid-storage 卡片装进「同一个全局作用域」——
//       复现指南第 13 节那个「顶层 const 重名 → 整包不执行」的坑
//   4)  用真实数据渲染：折叠摘要 / 仪表 / 五道守卫 / 找大人提示 / 登记簿 / 滚动预算
//   5)  host half 的工具：子注入 tools → 注册五个普通对象工具；enabled:false 时不注册
// 用法：node verify.mjs
// ============================================================
import { runInNewContext, createContext, Script } from 'node:vm'
import { readFileSync } from 'node:fs'
import {
  collect, assemble, buildWall, buildLocker, buildLock, buildDoor, buildLogbook, scoreOf,
  humanDuration, CMD,
} from './collect.js'
import { apply } from './index.js'

let failed = 0
const ok = (cond, msg, extra) => {
  console.log((cond ? '  ✅ ' : '  ❌ ') + msg + (extra === undefined ? '' : '  → ' + extra))
  if (!cond) failed++
}

// ---------- 1) 守卫判定（离线，注入假文本） ----------
console.log('\n[1] 五道守卫判定（离线注入，与真机设置无关）')
const wall0 = buildWall('0')
const wall1 = buildWall('1')
const wall2 = buildWall('2')
ok(wall0.status === 'bad' && !!wall0.hint, '防火墙 globalstate=0 → bad，且给出「找大人」指引', wall0.short)
ok(wall1.status === 'good' && wall2.status === 'good', 'globalstate=1 / 2 都算 good')
ok(/阻止所有传入/.test(wall2.short), 'globalstate=2 单独讲「阻止所有传入」', wall2.short)
ok(buildWall('').status === 'unknown' && buildWall('oops').status === 'unknown', '读不到 / 非数字 → unknown（不算失败）')

const lockerOn = buildLocker('FileVault is On.')
const lockerOff = buildLocker('FileVault is Off.')
ok(lockerOn.status === 'good' && lockerOff.status === 'bad' && !!lockerOff.hint, 'FileVault On→good / Off→bad+指引')
ok(buildLocker('').status === 'unknown', 'FileVault 读不到 → unknown')

ok(buildLock('0', '1').status === 'bad', '没设自动锁屏 → bad', buildLock('0', '1').short)
ok(buildLock('120', '1').status === 'good', '120 秒自动锁屏 → good', buildLock('120', '1').short)
const lockSlow = buildLock('1200', '1')
ok(lockSlow.status === 'warn' && lockSlow.detail.some((t) => t.includes('20 分钟')), '1200 秒 → warn 且明细里带人类可读时长',
  lockSlow.detail.join(' / '))
const lockNoPwd = buildLock('120', '0')
ok(lockNoPwd.status === 'warn' && lockNoPwd.detail.some((t) => t.includes('不用输密码')), '锁屏但不要密码 → warn',
  lockNoPwd.detail.join(' / '))
ok(humanDuration(45) === '45 秒' && humanDuration(90) === '2 分钟' && humanDuration(7200) === '2 小时',
  'humanDuration 秒/分/时换算', [humanDuration(45), humanDuration(90), humanDuration(7200)].join(' / '))

const fakeListen = [
  'tcp4       0      0  127.0.0.1.22           *.*                    LISTEN',
  'tcp4       0      0  *.5900                 *.*                    LISTEN',
  'tcp6       0      0  ::1.631                *.*                    LISTEN',
].join('\n')
const door = buildDoor(fakeListen)
ok(door.status === 'warn' && /22/.test(door.short) && /5900/.test(door.short), '开着 22/5900 → warn 并点名端口',
  door.short)
ok(buildDoor('tcp4 0 0 127.0.0.1.631 *.* LISTEN').status === 'good', '只有 631 之类的本地端口 → good')
ok(buildDoor('').status === 'good', 'netstat 读不到（空）→ good（没有暗门证据）')

const me = 'kid'
const lastMine = ['kid  console  Mon Oct  6 09:00   still logged in', 'reboot  ~  Mon Oct  6 08:58'].join('\n')
const lastOther = ['stranger  console  Mon Oct  6 09:00   still logged in', lastMine].join('\n')
ok(buildLogbook(lastMine, me).status === 'good', '登记簿只有主人 → good', buildLogbook(lastMine, me).short)
const logOther = buildLogbook(lastOther, me)
ok(logOther.status === 'warn' && /stranger/.test(logOther.short) && !!logOther.hint, '登记簿出现陌生名字 → warn+指引',
  logOther.short)
ok(buildLogbook(lastOther, me).recent.length === 3 && buildLogbook(lastOther, me).recent[0].startsWith('stranger'),
  'recent 保留前几行原文（含 reboot 行，交给卡片原样展示）',
  buildLogbook(lastOther, me).recent.length + ' 行')
ok(buildLogbook('', me).status === 'unknown', 'last 读不到 → unknown')

const s3 = scoreOf([buildWall('1'), buildLocker('is On.'), buildDoor(''), buildLock('120', '0'), buildLogbook('', me)])
ok(s3.good === 3 && s3.total === 4 && s3.pct === 75 && s3.level.text === '有小缺口',
  'unknown 不计入分母：3/4 = 75% 有小缺口', `${s3.good}/${s3.total} ${s3.pct}% ${s3.level.text}`)
ok(scoreOf([buildWall('1'), buildLocker('is On.')]).level.text === '安全城堡', '全在岗 → 安全城堡 😄')
ok(scoreOf([buildWall(''), buildLocker('')]).total === 0 && scoreOf([]).level.text === '看不清', '全看不清 → 分母 0 / 看不清')

const assembled = assemble({ wall: '1', locker: 'is On.', idle: '120', pwd: '1', me, listen: '', last: lastMine })
ok(assembled.guards.length === 5, 'assemble 出五道守卫（不会多也不会少）', assembled.guards.length + ' 道')
ok(assembled.guards.map((g) => g.key).join(',') === 'wall,locker,lock,door,logbook',
  '守卫顺序固定：wall→locker→lock→door→logbook', assembled.guards.map((g) => g.key).join(','))
ok(assembled.guards.every((g) => g.emoji && g.name && g.short && Array.isArray(g.detail)),
  '每道守卫都带 emoji / name / short / detail[]')

// ---------- 1b) 真机采集 ----------
console.log('\n[1b] 真机采集（七条只读命令，免 sudo）')
ok((await Promise.all([CMD.wall, CMD.locker, CMD.idle, CMD.pwd, CMD.me, CMD.listen, CMD.last])).length === 7,
  '命令表有 7 条', Object.keys(CMD).join(','))
const data = await collect()
ok(Array.isArray(data.guards) && data.guards.length === 5, '真机 collect 出五道守卫',
  data.guards.map((g) => g.key + '=' + g.status).join(' '))
ok(data.score.total >= 1, '至少有一道守卫是可判定的（不是全 unknown）',
  `${data.score.good}/${data.score.total} ${data.score.pct}% ${data.score.level.text}`)
ok(data.guards.every((g) => ['good', 'warn', 'bad', 'unknown'].includes(g.status)), '状态值都在四态之内')

// ---------- 2) host half 的 HTTP 路由 ----------
console.log('\n[2] host half：注册路由并用假 req/res 走一次')
let route = null
let hostInjectDeps = null
const ctxHost = {
  get: (name) => (name === 'webServer' ? { register: (r) => { route = r; return () => {} } } : undefined),
  effect: (fn) => fn(),
  // 故意让回调不执行：模拟「这个 profile 一直没有 tools 服务」。
  inject: (deps) => { hostInjectDeps = deps },
}
apply(ctxHost)
ok(!!route, '已在 webServer 上注册路由', route && `${route.kind} ${route.path}`)
ok(route && route.path === '/kid-security/collect' && route.kind === 'exact', '路径与 client.js 的 PATH 一致')
ok(hostInjectDeps && hostInjectDeps.join(',') === 'tools',
  'tools 一直不出现时也走了子注入（路由照旧注册，工具不装）', JSON.stringify(hostInjectDeps))

const call = async (method) => {
  let status = 0
  let headers = null
  let body = ''
  const res = { writeHead: (s, h) => { status = s; headers = h }, end: (t) => { body = t || '' } }
  await route.handler({ method }, res)
  return { status, headers, body }
}
const got = await call('GET')
let parsed = null
try { parsed = JSON.parse(got.body) } catch { /* 下面的断言会报出来 */ }
ok(got.status === 200, 'GET 返回 200', 'status=' + got.status)
ok(got.headers && String(got.headers['content-type']).includes('application/json'), 'content-type 是 JSON')
ok(got.headers && String(got.headers['cache-control']) === 'no-store', 'cache-control: no-store（卡片要新鲜数据）')
ok(!!parsed && Array.isArray(parsed.guards) && parsed.score, 'JSON 里带 guards / score',
  parsed ? `guards=${parsed.guards.length} pct=${parsed.score.pct}` : '解析失败')
const notAllowed = await call('POST')
ok(notAllowed.status === 405, 'POST 被拒（405，只读路由）', 'status=' + notAllowed.status)
const head = await call('HEAD')
ok(head.status === 200 && head.body === '', 'HEAD 返回 200 且无 body')

// ---------- 3) client half：装载 + 注册 ----------
console.log('\n[3] client half：__ModuleLoader__ 装载 → apply → 槽位注册')
const styleTags = []
const document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, attrs: {}, setAttribute(k, v) { this.attrs[k] = v }, textContent: '', remove() {} }),
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
runInNewContext(clientSource, {
  window: Object.assign(win, { __ModuleLoader__: { load: (m) => { win.__loaded = m } } }),
  document,
  setInterval: () => 1,
  clearInterval: () => {},
  // 转发到宿主 fetch：后面的用例靠替换 globalThis.fetch 来控制数据 / 断网，
  // 这里写死一个箭头函数会把后面的替换挡在门外（组件拿到的永远是这一个）。
  fetch: (...a) => globalThis.fetch(...a),
  console,
})
const loaded = win.__loaded
ok(!!loaded, '已向模块表注册工厂', loaded && 'id=' + loaded.id)
ok(loaded.id === '@kidlab/dsh-kid-security', '模块 id 等于包名')

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
ok(!!registration && registration.id === 'kid-security' && registration.order === 8, '已注册到 conversation.input.dock',
  registration && `id=${registration.id} order=${registration.order}`)
ok(styleTags.length === 1 && styleTags[0].attrs['data-plugin-css'] === '@kidlab/dsh-kid-security/card.css',
  '注入了自己的 <style data-plugin-css="…/card.css">', JSON.stringify(styleTags[0].attrs))
ok(typeof cssInjector === 'function', '样式注册在 effect 里（可回收）')

// ---------- 3b) 会话门禁 ----------
console.log('\n[3b] 会话门禁：只有 ONLY_SESSIONS 里的会话才渲染')
const gateLine = /const ONLY_SESSIONS = \[([^\]]*)\]/.exec(clientSource)
const allowedSessions = gateLine ? [...gateLine[1].matchAll(/'([^']*)'/g)].map((m) => m[1]) : []
const OTHER_SESSION = 'session-00000000-0000-0000-0000-000000000000'
const HERE = allowedSessions[0] || OTHER_SESSION
globalThis.fetch = async () => { throw new Error('门禁测试不打网络') }
const renderAs = (props) => { stateIndex = 0; return widget(props) }
ok(allowedSessions.length > 0, 'client.js 里配了 ONLY_SESSIONS（非空 = 限定会话）', JSON.stringify(allowedSessions))
ok(renderAs({ session: { sessionId: OTHER_SESSION }, input: null }) === null,
  '别的会话：渲染 null（卡片不出现、轮询也不启动）')
ok(renderAs({ sessionId: OTHER_SESSION, session: { sessionId: OTHER_SESSION }, input: null }) === null,
  '别的会话：顶层 sessionId 也照样挡住')
const hereNode = renderAs({ session: { sessionId: HERE }, input: null })
ok(!!hereNode && String(hereNode.props.className).includes('ks-card'), '本会话：通过 session.sessionId 正常渲染卡片',
  hereNode ? 'className=' + hereNode.props.className : String(hereNode))
ok(!!renderAs({ sessionId: HERE, input: null }), '本会话：通过顶层 sessionId 也认得出来')

// ---------- 3c) 与已装卡片共存（指南第 13 节的坑） ----------
console.log('\n[3c] 共存：本卡片 + kid-storage（已合并版）装进同一个全局作用域')
const sharedWin = { __ModuleLoader__: { loads: [], load(m) { this.loads.push(m) } } }
const sharedSandbox = {
  window: sharedWin, document,
  setInterval: () => 1, clearInterval: () => {}, fetch: () => Promise.reject(new Error('不打网络')), console,
}
const sharedCtx = createContext(sharedSandbox)
let coexErr = ''
try {
  for (const file of ['./client.js', '../plugin-kid-storage/client.js']) {
    const src = readFileSync(new URL(file, import.meta.url), 'utf8')
    new Script(src).runInContext(sharedCtx)
  }
} catch (e) { coexErr = String((e && e.message) || e) }
ok(coexErr === '', '两张卡片的 client.js 先后执行不抛错（无顶层标识符冲突）', coexErr || '无异常')
ok(sharedWin.__ModuleLoader__.loads.length === 2 &&
  sharedWin.__ModuleLoader__.loads.map((m) => m.id).join(',') === '@kidlab/dsh-kid-security,@kidlab/dsh-kid-storage',
  '两张卡片的工厂都注册成功', sharedWin.__ModuleLoader__.loads.map((m) => m.id).join(' , '))

// ---------- 4) 用真实数据渲染 ----------
console.log('\n[4] 渲染结果（真实数据）')
globalThis.fetch = async () => ({ ok: true, json: async () => parsed })
const render = () => renderAs({ sessionId: HERE, session: { sessionId: HERE }, input: null })
const walk = (n, out = []) => {
  if (typeof n === 'string') { out.push(n); return out }
  if (!n || !n.props) return out
  out.push(n)
  for (const c of [].concat(n.props.children || [])) walk(c, out)
  return out
}

render()                                   // 首次：data=null
await new Promise((r) => setTimeout(r, 30)) // 等 effect 里的 fetch 落地
const collapsed = render()                 // 再渲染：折叠态，应带上数据摘要
const collapsedNodes = walk(collapsed)
const collapsedText = collapsedNodes.filter((n) => typeof n === 'string')
const summary = collapsedText.find((t) => /^守卫在岗 \d+\/\d+$/.test(t))
ok(!!summary, '折叠摘要形如「守卫在岗 N/M」', summary)
ok(collapsedText.some((t) => t === parsed.score.level.emoji + ' ' + parsed.score.level.text), '徽标显示等级',
  parsed.score.level.emoji + ' ' + parsed.score.level.text)
ok(!collapsedNodes.some((n) => n && n.props && n.props.className === 'ks-detail'), '默认折叠：详情区不挂载')

// 点标题展开后，明细（仪表 + 五道守卫 + 登记簿）才会渲染
const toggle = collapsedNodes.find((n) => n && n.props && n.props.className === 'ks-toggle')
if (toggle) toggle.props.onClick()
const tree = render()
const nodes = walk(tree)
const texts = nodes.filter((n) => typeof n === 'string')
const rows = nodes.filter((n) => n && n.props && n.props.className === 'ks-guard')
ok(!!nodes.find((n) => n && n.props && n.props.className === 'ks-detail'), '展开后详情区挂载，并带滚动预算类名')
ok(rows.length === 5, '五道守卫逐行渲染', rows.length + ' 行')
const statusText = { good: '在岗', warn: '要注意', bad: '有缺口', unknown: '看不清' }
const missStatus = parsed.guards.filter((g) => {
  const rowTexts = walk(rows[parsed.guards.indexOf(g)]).filter((t) => typeof t === 'string')
  return !rowTexts.includes(statusText[g.status]) || !rowTexts.includes(g.name)
})
ok(missStatus.length === 0, '每行都带守卫名 + 对应状态字（在岗/要注意/有缺口/看不清）',
  missStatus.map((g) => g.key).join(',') || '全对')
const expectHints = parsed.guards.filter((g) => g.hint && g.status !== 'good').length
const hints = nodes.filter((n) => n && n.props && n.props.className === 'gh')
ok(hints.length === expectHints && hints.every((h) => String(h.props.children).startsWith('🙋 找大人：')),
  '只有「非在岗且有指引」的守卫才出「🙋 找大人」条', `${hints.length} 条 / 期望 ${expectHints}`)
const log = parsed.guards.find((g) => g.key === 'logbook')
const logNode = nodes.find((n) => n && n.props && n.props.className === 'ks-log')
ok(!!logNode === !!(log.recent && log.recent.length), '登记簿原文行数随数据出现/消失',
  logNode ? walk(logNode).filter((t) => typeof t === 'string').length + ' 行' : '无')
const fill = nodes.find((n) => n && n.props && n.props.className === 'fill')
ok(fill && fill.props.style.width === Math.max(4, parsed.score.pct) + '%', '仪表条宽度 = 在岗百分比',
  fill && fill.props.style.width)
ok(texts.some((t) => t.includes('五道守卫逐一报到')) && texts.some((t) => t.includes('每 15 秒巡一次城')),
  '标题与页脚文案在位')

// 展开高度预算：dock 是粘性页脚，预留必须 ≥ 页脚固定件（否则顶部出视口、只能滑会话窗口）
const detailRule = /\.ks-detail\{([^}]*)\}/.exec(clientSource)
const rule = detailRule ? detailRule[1] : ''
ok(/max-height:min\(calc\(100vh - 450px\),480px\)/.test(rule), '展开区预算 = min(视口−450px, 480px)', rule.slice(0, 60))
ok(/overflow-y:auto/.test(rule) && /overscroll-behavior:contain/.test(rule),
  '展开区自己滚，且不把滚动链传给会话窗口（overscroll-behavior:contain）')

// ---------- 5) host half 的工具（合并后新增：与卡片同一个包） ----------
console.log('\n[5] host half：子注入 tools → 注册五个普通对象工具')
const secNames = ['sec_wall', 'sec_locker', 'sec_lock', 'sec_door', 'sec_login']
const registered = []
const toolsCtx = {
  get: () => undefined, // 没有 webServer（headless）：工具也要装得上
  effect: (fn) => fn(),
  inject: (deps, cb) => cb({ effect: (fn) => fn(), tools: { register: (t) => { registered.push(t); return () => {} } } }),
}
apply(toolsCtx, { enabled: true, timeoutMs: 5000 })
ok(registered.map((t) => t.name).join(',') === secNames.join(','), '五个工具按固定顺序注册',
  registered.map((t) => t.name).join(','))
ok(registered.every((t) => t.parameters && t.parameters.type === 'object' &&
  Object.keys(t.parameters.properties).length === 0 && !('additionalProperties' in t.parameters)),
  '参数投影 = {type:"object",properties:{}}（与旧 defineTool({parameters:{}}) 逐字节相同）',
  JSON.stringify(registered[0] && registered[0].parameters))
ok(registered.every((t) => typeof t.description === 'string' && t.description.length > 20 &&
  t.output && t.output.schema.type === 'string' && typeof t.output.render === 'function' &&
  typeof t.execute === 'function'),
  '每个工具都带 description / output.schema / render / execute')
const wallText = await registered[0].execute({})
ok(typeof wallText === 'string' && wallText.startsWith('【护城河 / 防火墙】'),
  'sec_wall 真机跑一次出文本（免 sudo 只读命令）', String(wallText).split('\n')[0])
const rendered = registered[0].output.render({}, wallText)
ok(Array.isArray(rendered) && rendered.length === 1 && rendered[0].type === 'text' && rendered[0].text === wallText,
  'render 把文本包成 [{type:"text", text}]（与旧 output.render 同形）')
const noneRegistered = []
apply({ get: () => undefined, effect: (fn) => fn(), inject: (d, cb) => cb({ effect: (fn) => fn(), tools: { register: (t) => { noneRegistered.push(t); return () => {} } } }) },
  { enabled: false })
ok(noneRegistered.length === 0, 'config.enabled=false → 一个工具都不注册（卡片不受它控制）')

console.log('\n' + (failed === 0 ? '全部通过 ✅' : failed + ' 项未通过 ❌'))
process.exit(failed === 0 ? 0 : 1)
