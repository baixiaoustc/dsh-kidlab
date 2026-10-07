#!/usr/bin/env node
// ============================================================
// kid-network · 本地自测（不需要 dsh，直接 `node verify.mjs`）
// 覆盖五段：
//   ① 契约：package.json 的硬性要求 + files 白名单 + patch 行
//   ② 语法：index.js / tools.js / client.js 能被 node 解析
//   ③ host：apply(mock ctx) 注册 5 个工具 + 一条 exact 路由，开关/降级行为
//   ④ 采集与路由：assemble/parse 纯函数（离线）+ GET/POST/HEAD 路由应答
//   ⑤ client：IIFE 包裹 + __ModuleLoader__.load + fetch(PATH)，无顶层声明泄漏；
//      再用迷你 React 用假数据渲染一次卡片
// 全绿退出码 0。
// ============================================================
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { runInNewContext, Script } from 'node:vm'
import { EventEmitter } from 'node:events'
import assert from 'node:assert/strict'

import {
  apply, makeHandler, assemble, parseCip, parsePingMs, firstLine, timeoutMsOf,
} from './index.js'

const DIR = dirname(fileURLToPath(import.meta.url))
let pass = 0
let fail = 0
const ok = (name) => { pass += 1; console.log('  ✓ ' + name) }
const bad = (name, e) => { fail += 1; console.log('  ✗ ' + name + ' — ' + (e && e.message ? e.message : e)) }
const check = (name, fn) => { try { fn() } catch (e) { bad(name, e); return } ok(name) }

const NAMES = ['net_dns', 'net_my_identity', 'net_test_speed', 'net_trace_trip', 'net_who_is_home']

// ---------- 假数据（离线断言的输入） ----------
const FAKE_RAW = {
  lanRaw: '192.168.1.23\n',
  gwRaw: '192.168.1.1\n',
  dnsRaw: '223.5.5.5\n119.29.29.29\n8.8.8.8\n1.1.1.1\n',
  arpRaw: '12\n',
  pubRaw: 'IP      : 1.2.3.4\n地址    : 中国  四川  成都\n运营商  : 电信\n',
  speedRaw: '1048576\n',
  pingRaws: [
    'round-trip min/avg/max/stddev = 10.123/12.456/15.789/1.234 ms',
    '',
    'round-trip min/avg/max/stddev = 30.1/40.9/50.2/2.0 ms',
  ],
}
const FAKE = assemble(FAKE_RAW)

console.log('① 契约 package.json')
const pkg = JSON.parse(readFileSync(join(DIR, 'package.json'), 'utf8'))
check('name 是 @kidlab/dsh-kid-network', () => assert.equal(pkg.name, '@kidlab/dsh-kid-network'))
check('version 0.2.0', () => assert.equal(pkg.version, '0.2.0'))
check('type: module', () => assert.equal(pkg.type, 'module'))
check('main: index.js', () => assert.equal(pkg.main, 'index.js'))
check('exports "." → index.js', () => assert.equal(pkg.exports['.'], './index.js'))
check('exports 暴露 ./client', () => assert.equal(pkg.exports['./client'], './client.js'))
check('dsh.bundle.patch → cordis.patch.yml', () => assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml'))
check('dsh.client.platform = web', () => assert.equal(pkg.dsh.client.platform, 'web'))
check('keywords 含 dsh/dsh-plugin/kid/network', () => {
  for (const k of ['dsh', 'dsh-plugin', 'kid', 'network']) assert.ok(pkg.keywords.includes(k), 'keywords 缺 ' + k)
})
check('license MIT', () => assert.equal(pkg.license, 'MIT'))
check('files 白名单含产物与 patch', () => {
  for (const f of ['index.js', 'tools.js', 'client.js', 'cordis.patch.yml', 'README.md']) {
    assert.ok(pkg.files.includes(f), 'files 缺 ' + f)
    assert.ok(existsSync(join(DIR, f)), '文件不存在 ' + f)
  }
})
check('files 不含 legacy/', () => { assert.ok(!JSON.stringify(pkg.files).includes('legacy')) })
check('cordis.patch.yml 插的是 kid-network 一行', () => {
  const y = readFileSync(join(DIR, 'cordis.patch.yml'), 'utf8')
  assert.match(y, /id:\s*kid-network/)
  assert.match(y, /name:\s*'@kidlab\/dsh-kid-network'/)
})

console.log('② 语法')
for (const f of ['index.js', 'tools.js', 'client.js']) {
  check(f + ' 可解析', () => { execFileSync(process.execPath, ['--check', join(DIR, f)], { stdio: 'pipe' }) })
}

console.log('③ 采集纯函数（离线可重现）')
check('firstLine：取第一行非空', () => {
  assert.equal(firstLine('  \n hello \n world'), 'hello')
  assert.equal(firstLine(''), '')
})
check('parsePingMs：从汇总行取平均延迟', () => {
  assert.equal(parsePingMs('round-trip min/avg/max/stddev = 10.123/12.456/15.789/1.234 ms'), 12)
  assert.equal(parsePingMs(''), null)
  assert.equal(parsePingMs('request timeout'), null)
})
check('parseCip：拆出 IP / 城市 / 运营商', () => {
  const p = parseCip('IP      : 1.2.3.4\n地址    : 中国  四川  成都\n运营商  : 电信\n')
  assert.deepEqual(p, { ip: '1.2.3.4', city: '中国  四川  成都', isp: '电信' })
  assert.deepEqual(parseCip(''), { ip: null, city: null, isp: null })
})
check('assemble：拼出卡片 JSON（含降级与截断）', () => {
  assert.equal(FAKE.lan, '192.168.1.23')
  assert.equal(FAKE.gw, '192.168.1.1')
  assert.deepEqual(FAKE.dns, ['223.5.5.5', '119.29.29.29', '8.8.8.8']) // 最多 3 条
  assert.equal(FAKE.neighbors, 12)
  assert.deepEqual(FAKE.pub, { ip: '1.2.3.4', city: '中国  四川  成都', isp: '电信' })
  assert.equal(FAKE.speedKBps, 1024) // 1048576 B/s ÷ 1024
  assert.deepEqual(FAKE.letters.map((L) => L.ms), [12, null, 41])
  assert.equal(FAKE.letters[0].label, '北京 · 百度')
  assert.equal(typeof FAKE.ts, 'number')
})
check('assemble：空白输入全部降级为 null / 空，不抛错', () => {
  const e = assemble({})
  assert.equal(e.lan, null)
  assert.equal(e.gw, null)
  assert.deepEqual(e.dns, [])
  assert.equal(e.neighbors, null)
  assert.equal(e.speedKBps, null)
  assert.deepEqual(e.pub, { ip: null, city: null, isp: null })
  assert.deepEqual(e.letters.map((L) => L.ms), [null, null, null])
})
check('timeoutMsOf：默认 12000 / 区间 2000~30000 / 取整', () => {
  assert.equal(timeoutMsOf(undefined), 12000)
  assert.equal(timeoutMsOf({ timeoutMs: 'abc' }), 12000)
  assert.equal(timeoutMsOf({ timeoutMs: 100 }), 2000)
  assert.equal(timeoutMsOf({ timeoutMs: 999999 }), 30000)
  assert.equal(timeoutMsOf({ timeoutMs: 8000.6 }), 8001)
})

console.log('④ host：apply(mock ctx)')
let route = null
let hostInjectDeps = null
let tools = []
let toolsDisposer = null
const mkCtx = () => ({
  get: (n) => (n === 'webServer' ? { register: (r) => { route = r; return () => {} } } : undefined),
  effect: (fn) => fn(),
  inject: (deps, cb) => {
    hostInjectDeps = deps
    cb({
      effect: (fn) => { toolsDisposer = fn() },
      tools: { register: (t) => { tools.push(t); return () => {} } },
    })
  },
})
const mod = await import(join(DIR, 'index.js'))
check('导出 name/apply', () => { assert.equal(mod.name, 'kid-network'); assert.equal(typeof mod.apply, 'function') })

apply(mkCtx())
check('tools 走子注入（不拖住路由）', () => assert.equal(hostInjectDeps.join(','), 'tools'))
check('注册了 5 个工具', () => assert.deepEqual(tools.map((t) => t.name).sort(), NAMES))
check('注册了一条 exact 路由 /kid-network/collect', () => {
  assert.ok(route, 'route 未注册')
  assert.equal(route.kind, 'exact')
  assert.equal(route.path, '/kid-network/collect')
  assert.equal(typeof route.handler, 'function')
})
const shape = (t) => !!t && typeof t.description === 'string' && t.description.length > 20 &&
  !!t.parameters && t.parameters.type === 'object' &&
  !!t.output && t.output.schema && t.output.schema.type === 'string' && typeof t.output.render === 'function' &&
  typeof t.execute === 'function'
const byName = {}
for (const t of tools) byName[t.name] = t
check('每个工具都有 description / object parameters / text output / execute', () => {
  assert.ok(tools.every(shape))
})
check('net_my_identity 参数形状是无参 {type:"object",properties:{}}', () => {
  assert.deepEqual(byName.net_my_identity.parameters, { type: 'object', properties: {} })
  assert.deepEqual(byName.net_test_speed.parameters, { type: 'object', properties: {} })
  assert.deepEqual(byName.net_who_is_home.parameters, { type: 'object', properties: {} })
})
check('net_trace_trip / net_dns 的 target 是可选枚举（5 项，无 required）', () => {
  for (const n of ['net_trace_trip', 'net_dns']) {
    const p = byName[n].parameters
    assert.equal(p.required, undefined)
    assert.deepEqual(p.properties.target.enum, ['baidu', 'taobao', 'aliyun', 'qq', 'bilibili'])
  }
})
check('工具注册在 effect 里（可回收）', () => assert.equal(typeof toolsDisposer, 'function'))
toolsDisposer()
ok('回收函数可调用，不抛错')

// 开关：enabled:false 只关工具，卡片数据路由照常
route = null; tools = []
apply(mkCtx(), { enabled: false })
check('enabled:false 时不注册工具', () => assert.equal(tools.length, 0))
check('enabled:false 时路由照常（卡片还能显示数据）', () => assert.ok(!!route))

// 没有 tools 能力的 profile：不报错，只有卡片
route = null; tools = []
let threw = null
const bare = { get: () => undefined, effect: (fn) => fn(), inject: () => {} }
try { apply(bare) } catch (e) { threw = e }
check('没有 tools 能力也不抛错（ctx.inject 挂着等）', () => assert.equal(threw, null))
check('没有 webServer（headless）→ 静默跳过路由，不抛错', () => assert.equal(route, null))

console.log('⑤ 路由：GET / POST / HEAD（注入假采集，不打网络）')
const rHandler = makeHandler(async () => FAKE)
function fakeRes() {
  const r = new EventEmitter()
  r.statusCode = 0; r.headers = null; r.chunks = []
  r.writeHead = (code, headers) => { r.statusCode = code; r.headers = headers; return r }
  r.end = (data) => { if (data !== undefined) r.chunks.push(Buffer.from(String(data))); r.emit('done') }
  return r
}
function fakeReq(method) {
  const req = new EventEmitter(); req.method = method; req.destroy = () => {}
  queueMicrotask(() => req.emit('end'))
  return req
}
async function call(handler, method) {
  const res = fakeRes()
  const done = new Promise((resolve) => res.once('done', resolve))
  await handler(fakeReq(method), res)
  await done
  return { status: res.statusCode, headers: res.headers, text: Buffer.concat(res.chunks).toString('utf8') }
}

const g = await call(rHandler, 'GET')
check('GET → 200 application/json + no-store', () => {
  assert.equal(g.status, 200)
  assert.match(g.headers['content-type'], /application\/json/)
  assert.equal(g.headers['cache-control'], 'no-store')
})
check('GET → content-length 与正文一致，正文是假数据', () => {
  assert.equal(Number(g.headers['content-length']), Buffer.byteLength(g.text))
  assert.deepEqual(JSON.parse(g.text).pub.ip, '1.2.3.4')
})
const p = await call(rHandler, 'POST')
check('POST → 405 + allow: GET', () => {
  assert.equal(p.status, 405)
  assert.equal(p.headers.allow, 'GET')
})
const h = await call(rHandler, 'HEAD')
check('HEAD → 200、不写正文、仍给 content-length', () => {
  assert.equal(h.status, 200)
  assert.equal(h.text, '')
  assert.ok(Number(h.headers['content-length']) > 0)
})
const errHandler = makeHandler(async () => { throw new Error('boom') })
const e5 = await call(errHandler, 'GET')
check('采集抛错 → 500 + { error }', () => {
  assert.equal(e5.status, 500)
  assert.match(JSON.parse(e5.text).error, /boom/)
})

console.log('⑥ client 半部（源码静态检查）')
const cli = readFileSync(join(DIR, 'client.js'), 'utf8')
check('顶层只有 IIFE 一个语句（声明全落在函数作用域）', () => {
  const firstIdx = cli.indexOf(';(() => {')
  const lastIdx = cli.lastIndexOf('})()')
  assert.ok(firstIdx >= 0 && lastIdx > firstIdx, '未找到完整的 IIFE 包裹')
  // IIFE 之前只允许注释/空白；之后不允许任何代码
  assert.ok(/^(\s|\/\/[^\n]*\n)*$/.test(cli.slice(0, firstIdx)), 'IIFE 之前有代码')
  assert.equal(cli.slice(lastIdx + 4).trim(), '', 'IIFE 之后有代码')
})
check('IIFE 包裹（存在 ;(() => { 且 })() 收尾）', () => {
  assert.match(cli, /;\n?\(\(\) => \{/)
  assert.match(cli.trimEnd(), /\}\)\(\)\s*$/)
})
check('__ModuleLoader__.load + id = 包名', () => {
  assert.match(cli, /window\.__ModuleLoader__\.load\(/)
  assert.match(cli, /id: PKG/)
})
check('模块 id 常量 = 包名', () => assert.match(cli, /const PKG = '@kidlab\/dsh-kid-network'/))
check('数据走 fetch(PATH)（不再是 host.call / ctx.interval）', () => {
  assert.match(cli, /fetch\(PATH, \{ cache: 'no-store' \}\)/)
  assert.ok(!/host\.call\(/.test(cli), '不应再有 host.call')
  assert.ok(!/ctx\.interval\(/.test(cli), '不应再有沙箱 ctx.interval')
})
check('注册槽位 conversation.input.dock / id kid-network / order 11', () => {
  assert.match(cli, /conversation\.input\.dock/)
  assert.match(cli, /id: 'kid-network'/)
  assert.match(cli, /order: 11/)
})
check('保留 🕊️ 信鸽邮局的视觉与字段', () => {
  for (const s of ['信鸽邮局 · 网络小探险', 'pg-card', 'pg-speed', 'pg-mail', '互联网身份证', '送信到三站']) {
    assert.ok(cli.includes(s), '缺片段 ' + s)
  }
})

console.log('⑦ client 半部：装载 + 渲染（迷你 React + 假 fetch）')
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
let fetchImpl = async () => { throw new Error('未设置 fetch') }
const win = {}
let parses = true
try { new Script(cli) } catch (e) { parses = false; console.log('    ' + e.message) }
check('client.js 能当作 classic script 解析', () => assert.ok(parses))
runInNewContext(cli, {
  window: Object.assign(win, { __ModuleLoader__: { load: (m) => { win.__loaded = m } } }),
  document,
  setInterval: () => 1,
  clearInterval: () => {},
  setTimeout: (fn, ms) => globalThis.setTimeout(fn, ms),
  fetch: (...a) => fetchImpl(...a),
  Date,
  console,
})
const loaded = win.__loaded
check('已向模块表注册工厂', () => assert.ok(loaded))
check('模块 id 等于包名', () => assert.equal(loaded.id, '@kidlab/dsh-kid-network'))

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
const clientMod = loaded.factory((name) => { if (name === 'react') return React; throw new Error('unexpected require ' + name) })
check('declare inject: [slots]', () => assert.ok(Array.isArray(clientMod.inject) && clientMod.inject.join(',') === 'slots'))
clientMod.apply(ctxClient)
check('已注册到 conversation.input.dock（id kid-network / order 11）', () => {
  assert.ok(registration)
  assert.equal(registration.name, 'conversation.input.dock')
  assert.equal(registration.id, 'kid-network')
  assert.equal(registration.order, 11)
})
check('注入了自己的 <style data-plugin-css="…/card.css">', () => {
  assert.equal(styleTags.length, 1)
  assert.equal(styleTags[0].dataset.plugin, '@kidlab/dsh-kid-network')
  assert.equal(styleTags[0].dataset.pluginCss, '@kidlab/dsh-kid-network/card.css')
})
check('样式注册在 effect 里（可回收）', () => assert.equal(typeof cssInjector, 'function'))
cssInjector()
check('样式回收函数把 <style> 摘掉', () => assert.equal(styleTags[0].removed, true))

// 用假数据渲染一次
const walk = (n, out = []) => {
  if (typeof n === 'string') { out.push(n); return out }
  if (!n || !n.props) return out
  out.push(n)
  for (const c of [].concat(n.props.children || [])) walk(c, out)
  return out
}
const nodesIn = (tree, cls) => walk(tree).filter((n) => n && n.props && n.props.className === cls)
const render = () => { stateIndex = 0; return widget() }

fetchImpl = async () => ({ ok: true, json: async () => FAKE })
render() // 首次：data=null
await new Promise((r) => setTimeout(r, 20))
const collapsed = render() // 再渲染：折叠态，应带上数据摘要
const collapsedText = walk(collapsed).filter((n) => typeof n === 'string')
check('折叠摘要：出现实测网速', () => {
  assert.ok(collapsedText.some((t) => t.includes('网速 1.00 MB/s')), collapsedText.join(' | '))
})
check('默认折叠：明细区还没渲染', () => assert.equal(nodesIn(collapsed, 'pg-detail').length, 0))
const toggle = nodesIn(collapsed, 'pg-toggle')[0]
toggle.props.onClick()
const tree = render()
const texts = walk(tree).filter((n) => typeof n === 'string').join('|')
check('点一下标题：明细区出现', () => assert.equal(nodesIn(tree, 'pg-detail').length, 1))
check('明细含局域网门牌号 / 网关 / 公网身份证', () => {
  assert.ok(texts.includes('192.168.1.23'), texts)
  assert.ok(texts.includes('192.168.1.1'), texts)
  assert.ok(texts.includes('互联网上的身份证：1.2.3.4'), texts)
})
check('明细含邻居设备数 + 三站送信延迟', () => {
  assert.ok(texts.includes('12 个设备'), texts)
  assert.ok(texts.includes('✉️ 北京 · 百度'), texts)
  assert.ok(texts.includes('12 ms'), texts)
  assert.ok(texts.includes('找不到路'), texts)
})
check('页脚写明 8 秒轮询', () => assert.ok(texts.includes('每 8 秒信鸽飞一圈'), texts))

console.log('')
console.log(`结果：${pass} 通过 / ${fail} 失败`)
process.exit(fail === 0 ? 0 : 1)
