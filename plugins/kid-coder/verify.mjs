#!/usr/bin/env node
// ============================================================
// kid-coder · 本地自测（不需要 dsh，直接 `node verify.mjs`）
// 覆盖五段：
//   ① 契约：package.json 的四条硬性要求 + files 白名单
//   ② 语法：index.js / tools.js / client.js 能被 node 解析
//   ③ host：apply(mock ctx) 注册 5 个工具 + 一条 exact 路由
//   ④ 路由：GET 返回状态 JSON、POST {code} 真跑 Python 返回 ok
//   ⑤ client：IIFE 包裹 + __ModuleLoader__.load + fetch(PATH)，无顶层声明泄漏
// 全绿退出码 0。
// ============================================================
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'

const DIR = dirname(fileURLToPath(import.meta.url))
let pass = 0
let fail = 0
const ok = (name) => { pass += 1; console.log('  ✓ ' + name) }
const bad = (name, e) => { fail += 1; console.log('  ✗ ' + name + ' — ' + (e && e.message ? e.message : e)) }
const check = (name, fn) => { try { fn() } catch (e) { bad(name, e); return } ok(name) }

console.log('① 契约 package.json')
const pkg = JSON.parse(readFileSync(join(DIR, 'package.json'), 'utf8'))
check('name 是 @kidlab/dsh-kid-coder', () => assert.equal(pkg.name, '@kidlab/dsh-kid-coder'))
check('type: module', () => assert.equal(pkg.type, 'module'))
check('exports 暴露 ./client', () => assert.equal(pkg.exports['./client'], './client.js'))
check('dsh.bundle.patch → cordis.patch.yml', () => assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml'))
check('dsh.client.platform = web', () => assert.equal(pkg.dsh.client.platform, 'web'))
check('files 白名单含产物与 patch', () => {
  for (const f of ['index.js', 'tools.js', 'client.js', 'cordis.patch.yml', 'python/kidrunner.py', 'python/kidturtle.py', 'python/kid.profile']) {
    assert.ok(pkg.files.includes(f), 'files 缺 ' + f)
    assert.ok(existsSync(join(DIR, f)), '文件不存在 ' + f)
  }
})
check('files 不含 legacy/', () => {
  assert.ok(!JSON.stringify(pkg.files).includes('legacy'))
})

console.log('② 语法')
for (const f of ['index.js', 'tools.js', 'client.js']) {
  check(f + ' 可解析', () => { execFileSync(process.execPath, ['--check', join(DIR, f)], { stdio: 'pipe' }) })
}

console.log('③ host：apply(mock ctx)')
const registered = []
const routes = []
let pageApply
const child = {
  tools: { register: (t) => { registered.push(t.name); return () => {} } },
  effect: (fn) => { fn() },
}
const ctx = {
  inject: (deps, fn) => { assert.ok(deps.includes('tools')); fn(child) },
  effect: (fn) => { fn() },
  get: (k) => (k === 'webServer' ? { register: (r) => { routes.push(r); return () => {} } } : undefined),
}
const mod = await import(join(DIR, 'index.js'))
check('导出 name/apply', () => { assert.equal(mod.name, 'kid-coder'); assert.equal(typeof mod.apply, 'function') })
mod.apply(ctx, { kidName: '想想', age: 8, enabled: true, runTimeoutSec: 8, sandbox: true })
pageApply = child
check('注册了 5 个工具', () => {
  assert.deepEqual(registered.sort(), ['kid_explain', 'kid_practice', 'kid_review', 'kid_run', 'kid_steps'])
})
check('注册了一条 exact 路由 /kid-coder/run', () => {
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'exact')
  assert.equal(routes[0].path, '/kid-coder/run')
})

console.log('④ 路由：GET / POST 真跑码')
const handler = routes[0].handler
function fakeRes() {
  const r = new EventEmitter()
  r.statusCode = 0
  r.headers = null
  r.chunks = []
  r.writeHead = (code, headers) => { r.statusCode = code; r.headers = headers; return r }
  r.end = (data) => { if (data !== undefined) r.chunks.push(Buffer.from(String(data))); r.emit('done') }
  return r
}
function fakeReq(method, body) {
  const req = new EventEmitter()
  req.method = method
  req.url = '/kid-coder/run'
  req.destroy = () => {}
  if (body !== undefined) queueMicrotask(() => { req.emit('data', Buffer.from(body)); req.emit('end') })
  else queueMicrotask(() => req.emit('end'))
  return req
}
async function call(method, body) {
  const res = fakeRes()
  const done = new Promise((resolve) => res.once('done', resolve))
  await handler(fakeReq(method, body), res)
  await done
  return { status: res.statusCode, headers: res.headers, text: Buffer.concat(res.chunks).toString('utf8') }
}

const g = await call('GET')
check('GET → 200 application/json + no-store', () => {
  assert.equal(g.status, 200)
  assert.match(g.headers['content-type'], /application\/json/)
  assert.equal(g.headers['cache-control'], 'no-store')
  assert.equal(JSON.parse(g.text).name, 'kid-coder')
})
const p = await call('POST', JSON.stringify({ code: 'print("你好", 1+1)' }))
check('POST {code} → 200 且真跑出输出', () => {
  assert.equal(p.status, 200)
  const r = JSON.parse(p.text)
  assert.equal(r.ok, true, 'ok 应为 true，实得 ' + JSON.stringify(r).slice(0, 200))
  assert.match(r.stdout, /你好 2/)
})
const t = await call('POST', JSON.stringify({ code: 'import turtle\nt = turtle.Turtle()\nfor i in range(4):\n    t.forward(50)\n    t.right(90)\nprint("box")' }))
check('POST {code} 海龟代码 → 产出一张 SVG', () => {
  const r = JSON.parse(t.text)
  assert.equal(r.ok, true)
  assert.match(r.svg, /^data:image\/svg\+xml;base64,/)
})
const badBody = await call('POST', '{not json')
check('POST 坏 body → 400', () => { assert.equal(badBody.status, 400) })

console.log('⑤ client 半部（源码静态检查）')
const cli = readFileSync(join(DIR, 'client.js'), 'utf8')
check('IIFE 包裹（存在 ;(() => { 且 })() 收尾）', () => {
  assert.match(cli, /;\n?\(\(\) => \{/)
  assert.match(cli.trimEnd(), /\}\)\(\)\s*$/)
})
check('__ModuleLoader__.load + id = 包名', () => {
  assert.match(cli, /window\.__ModuleLoader__\.load\(/)
  assert.match(cli, /id: PKG/)
})
check('数据走 fetch(PATH)（不再是 host.call）', () => {
  assert.match(cli, /fetch\(PATH/)
  assert.ok(!/host\.call\(/.test(cli), '不应再有 host.call')
})
check('模块 id 常量 = 包名', () => assert.match(cli, /const PKG = '@kidlab\/dsh-kid-coder'/))
check('注册槽位 conversation.input.dock / id kid-coder', () => {
  assert.match(cli, /conversation\.input\.dock/)
  assert.match(cli, /id: 'kid-coder'/)
})

console.log('')
console.log(`结果：${pass} 通过 / ${fail} 失败`)
process.exit(fail === 0 ? 0 : 1)
