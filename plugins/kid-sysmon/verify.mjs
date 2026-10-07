#!/usr/bin/env node
// ============================================================
// kid-sysmon · 本地自测（不需要 dsh，直接 `node verify.mjs`）
//   ① 契约 package.json  ② 语法  ③ host：apply(mock ctx) 注册 1 工具 + 1 路由
//   ④ 路由：GET /kid-sysmon/collect 返回带 cpu/mem/disk/batt 的 JSON
//   ⑤ client：IIFE + __ModuleLoader__.load + fetch(PATH)，无 host.call
// 全绿退出码 0。
// ============================================================
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'

const DIR = dirname(fileURLToPath(import.meta.url))
let pass = 0, fail = 0
const ok = (n) => { pass += 1; console.log('  ✓ ' + n) }
const bad = (n, e) => { fail += 1; console.log('  ✗ ' + n + ' — ' + (e && e.message ? e.message : e)) }
const check = (n, fn) => { try { fn() } catch (e) { bad(n, e); return } ok(n) }

console.log('① 契约 package.json')
const pkg = JSON.parse(readFileSync(join(DIR, 'package.json'), 'utf8'))
check('name @kidlab/dsh-kid-sysmon', () => assert.equal(pkg.name, '@kidlab/dsh-kid-sysmon'))
check('type module', () => assert.equal(pkg.type, 'module'))
check('exports 暴露 ./client', () => assert.equal(pkg.exports['./client'], './client.js'))
check('dsh.bundle.patch', () => assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml'))
check('dsh.client.platform = web', () => assert.equal(pkg.dsh.client.platform, 'web'))
check('files 白名单齐全且存在', () => {
  for (const f of ['index.js', 'tools.js', 'collect.js', 'client.js', 'cordis.patch.yml']) {
    assert.ok(pkg.files.includes(f), 'files 缺 ' + f)
    assert.ok(existsSync(join(DIR, f)), '文件不存在 ' + f)
  }
})
check('files 不含 legacy/', () => assert.ok(!JSON.stringify(pkg.files).includes('legacy')))

console.log('② 语法')
for (const f of ['index.js', 'tools.js', 'collect.js', 'client.js']) {
  check(f + ' 可解析', () => execFileSync(process.execPath, ['--check', join(DIR, f)], { stdio: 'pipe' }))
}

console.log('③ host：apply(mock ctx)')
const registered = [], routes = []
const child = { tools: { register: (t) => { registered.push(t.name); return () => {} } }, effect: (fn) => { fn() } }
const ctx = {
  inject: (deps, fn) => { assert.ok(deps.includes('tools')); fn(child) },
  effect: (fn) => { fn() },
  get: (k) => (k === 'webServer' ? { register: (r) => { routes.push(r); return () => {} } } : undefined),
}
const mod = await import(join(DIR, 'index.js'))
check('导出 name/apply', () => { assert.equal(mod.name, 'kid-sysmon'); assert.equal(typeof mod.apply, 'function') })
mod.apply(ctx, { enabled: true, verbose: false, timeoutMs: 8000 })
check('注册了 system_status', () => assert.deepEqual(registered, ['system_status']))
check('注册了 exact 路由 /kid-sysmon/collect', () => {
  assert.equal(routes.length, 1)
  assert.equal(routes[0].kind, 'exact')
  assert.equal(routes[0].path, '/kid-sysmon/collect')
})

console.log('④ 路由：GET 真采集')
const handler = routes[0].handler
function fakeRes() {
  const r = new EventEmitter()
  r.statusCode = 0; r.headers = null; r.chunks = []
  r.writeHead = (c, h) => { r.statusCode = c; r.headers = h; return r }
  r.end = (d) => { if (d !== undefined) r.chunks.push(Buffer.from(String(d))); r.emit('done') }
  return r
}
function fakeReq() { const q = new EventEmitter(); q.method = 'GET'; q.url = '/kid-sysmon/collect'; q.destroy = () => {}; return q }
async function call() {
  const res = fakeRes()
  const done = new Promise((r) => res.once('done', r))
  await handler(fakeReq(), res)
  await done
  return { status: res.statusCode, headers: res.headers, json: JSON.parse(Buffer.concat(res.chunks).toString('utf8')) }
}
const g = await call()
check('GET → 200 application/json + no-store', () => {
  assert.equal(g.status, 200)
  assert.match(g.headers['content-type'], /application\/json/)
  assert.equal(g.headers['cache-control'], 'no-store')
})
check('返回体含 cpu/mem/disk/batt/load/top 字段', () => {
  for (const k of ['cpu', 'mem', 'disk', 'batt', 'load', 'top']) assert.ok(k in g.json, '缺字段 ' + k)
  assert.equal(typeof g.json.ts, 'number')
})

console.log('⑤ client 半部（源码静态检查）')
const cli = readFileSync(join(DIR, 'client.js'), 'utf8')
check('IIFE 包裹', () => { assert.match(cli, /;\n?\(\(\) => \{/); assert.match(cli.trimEnd(), /\}\)\(\)\s*$/) })
check('__ModuleLoader__.load + id = PKG', () => {
  assert.match(cli, /window\.__ModuleLoader__\.load\(/)
  assert.match(cli, /id: PKG/)
  assert.match(cli, /const PKG = '@kidlab\/dsh-kid-sysmon'/)
})
check('数据走 fetch(PATH)（不再 host.call）', () => {
  assert.match(cli, /fetch\(PATH/)
  assert.ok(!/host\.call\(/.test(cli), '不应再有 host.call')
})
check('槽位 conversation.input.dock / id kid-sysmon', () => {
  assert.match(cli, /conversation\.input\.dock/)
  assert.match(cli, /id: 'kid-sysmon'/)
})

console.log('')
console.log(`结果：${pass} 通过 / ${fail} 失败`)
process.exit(fail === 0 ? 0 : 1)
