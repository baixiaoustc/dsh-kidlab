// ============================================================
// kid-process · host 侧取数（卡片的数据源）
//
// 与 tools.js 的关系：tools.js 是四个模型工具，输出文本跟 0.1 版**逐字一致**
// （见 verify-legacy-equivalence.mjs）；本文件只服务 🧑🏭 卡片，命令重新挑过——
// 每条都多带一个 pid 字段，这样卡片上的名字能直接对上工具里的「工号」。
// 两边各自独立，谁都不 import 谁：bundle 走 link: 安装，包内相对路径最稳，
// 而 tools.js 要保持「一个字没动」，不适合被抽公共层。
//
// 主题：🧑🏭 车间点名 —— 进程 = 在这台电脑（工作台）上干活的小工人。
//   ps -axo stat=,pid=,comm=  → 点名：一共有多少、几个在卖力、几个在打盹、几个是僵尸
//   ps -axo pcpu=,pid=,comm=  → 卖力榜：谁这会儿最忙
//   ps -axo pid=,ppid=,comm=  → 家族：总管 launchd（工号 1）带了多少徒弟
// 全部免 sudo、只读、命令硬编码常量，不拼用户输入。
//
// 测试友好：assemble() 是纯函数（吃原始文本、吐卡片 JSON），
//   verify.mjs 用它注入假文本做离线断言，不必依赖本机此刻的进程表。
// ============================================================
import { execFile } from 'node:child_process'

/** 采集结果缓存时长：卡片 15 秒轮询一次，5 秒缓存足够挡住重复刷新。 */
export const CACHE_MS = 5000
/** 单条命令超时。 */
export const TIMEOUT_MS = 8000

/** 三条只读命令（免 sudo）。 */
export const CMD = {
  roll: 'ps -axo stat=,pid=,comm=',
  busiest: 'ps -axo pcpu=,pid=,comm= | sort -rn | head -n 24',
  table: 'ps -axo pid=,ppid=,comm=',
}

/** 卖力榜最多留几个（客户端也只画前几名）。 */
export const BUSIEST_N = 24
/** 卖力榜按程序名合并后，最多展示几行。 */
export const TOP_N = 6
/** 家族里最多点名几个徒弟。 */
export const KIDS_N = 5

/**
 * 跑一条只读命令，返回 stdout 文本；失败返回空串（由各段降级成 unknown）。
 * @param {string} cmd shell 命令
 * @param {number} timeoutMs 超时毫秒
 * @returns {Promise<string>}
 */
export const run = (cmd, timeoutMs = TIMEOUT_MS) => new Promise((resolve) => {
  execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (_err, stdout) => {
    resolve(typeof stdout === 'string' ? stdout : '')
  })
})

/**
 * 从进程的可执行路径里抽出「小朋友能看懂的名字」（App 名 / 程序名）。
 * 与 tools.js 里的同名函数判据一致：先认 .app 包，再去掉 Helper 后缀。
 * @param {string} comm ps 的 comm 字段（通常是完整路径）
 * @returns {string}
 */
export const prettyName = (comm) => {
  const raw = String(comm || '').trim()
  if (!raw) return 'unknown'
  const app = raw.match(/^(?:.*\/)?(.+?)\.app\//) || raw.match(/^(?:.*\/)?(.+?)\.app$/)
  if (app) return app[1].replace(/\s+Helper.*$/, '')
  const last = raw.split('/').pop() || raw
  return last.replace(/\s+\(.*\)$/, '') || 'unknown'
}

/** 把 ps 的状态缩写翻译成小朋友能懂的话（与 tools.js 同义，卡片上用短版本）。 */
export const statCN = (stat) => {
  const s = String(stat || '').trim()
  if (s.startsWith('R')) return '正在卖力干活'
  if (s.startsWith('S')) return '在打盹等活儿'
  if (s.startsWith('Z')) return '僵尸工人（活干完了，工牌还没被收走）'
  if (s.startsWith('T')) return '被按了暂停键'
  if (s.startsWith('U')) return '在忙等不出来的活儿'
  return '待着（其他状态）'
}

/** 一行 `STAT  PID COMM` 拆成 {stat, pid, comm}；不像就 null。 */
const parseRoll = (line) => {
  const m = String(line || '').trim().match(/^([A-Za-z<>+NslE]+)\s+(\d+)\s+(.+)$/)
  return m ? { stat: m[1], pid: Number(m[2]), comm: m[3] } : null
}

/**
 * 点名：数一数一共有多少小工人、各是什么状态。
 * @param {string} raw `ps -axo stat=,pid=,comm=` 的原始输出
 * @returns {{total:number, running:number, sleeping:number, zombie:number, other:number, parsed:boolean}}
 */
export const countRoll = (raw) => {
  const rows = String(raw || '').split('\n').map(parseRoll).filter(Boolean)
  const out = { total: 0, running: 0, sleeping: 0, zombie: 0, other: 0, parsed: rows.length > 0 }
  for (const r of rows) {
    out.total += 1
    if (r.stat.startsWith('R')) out.running += 1
    else if (r.stat.startsWith('S')) out.sleeping += 1
    else if (r.stat.startsWith('Z')) out.zombie += 1
    else out.other += 1
  }
  return out
}

/**
 * 僵尸名单：活干完了、工牌还没被收走的小工人。
 * @param {string} raw 同上
 * @returns {{pid:number, name:string, stat:string}[]}
 */
export const zombieList = (raw) =>
  String(raw || '').split('\n').map(parseRoll).filter(Boolean)
    .filter((r) => r.stat.startsWith('Z'))
    .map((r) => ({ pid: r.pid, name: prettyName(r.comm), stat: 'Z' }))

/**
 * 卖力榜：按程序名合并同名的小工人（Chrome 会派一大群），
 * 加起来看「哪个程序最占 CPU」，再取前 TOP_N 名。
 * @param {string} raw `ps -axo pcpu=,pid=,comm=` 的原始输出
 * @returns {{name:string, cpu:number, n:number, pid:number}[]} 已按 cpu 从大到小排好
 */
export const parseBusiest = (raw, topN = TOP_N) => {
  const byName = new Map()
  for (const line of String(raw || '').split('\n')) {
    const m = line.trim().match(/^([\d.]+)\s+(\d+)\s+(.+)$/)
    if (!m) continue
    const cpu = Number(m[1])
    if (!Number.isFinite(cpu)) continue
    const pid = Number(m[2])
    const name = prettyName(m[3])
    const hit = byName.get(name)
    if (hit) {
      hit.cpu += cpu
      hit.n += 1
      if (cpu > hit._top) { hit._top = cpu; hit.pid = pid }
    } else {
      byName.set(name, { name, cpu, n: 1, pid, _top: cpu })
    }
  }
  return [...byName.values()]
    .map((x) => ({ name: x.name, cpu: Math.round(x.cpu * 10) / 10, n: x.n, pid: x.pid }))
    .sort((a, b) => b.cpu - a.cpu || a.name.localeCompare(b.name))
    .slice(0, topN)
}

/**
 * 家族：总管（工号 1，launchd）直接带了多少徒弟，徒弟们都叫什么。
 * @param {string} raw `ps -axo pid=,ppid=,comm=` 的原始输出
 * @returns {{pid:number, name:string, kids:number, top:{name:string,n:number}[]}|null}
 */
export const foremanOf = (raw, topN = KIDS_N) => {
  const kids = new Map()
  let name = 'launchd'
  let kidsCount = 0
  for (const line of String(raw || '').split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/)
    if (!m) continue
    const pid = Number(m[1])
    const ppid = Number(m[2])
    if (pid === 1) { name = prettyName(m[3]); continue }
    if (ppid !== 1) continue
    kidsCount += 1
    const n = prettyName(m[3])
    kids.set(n, (kids.get(n) || 0) + 1)
  }
  if (!kidsCount) return null
  const top = [...kids.entries()]
    .map(([n, c]) => ({ name: n, n: c }))
    .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name))
    .slice(0, topN)
  return { pid: 1, name, kids: kidsCount, top }
}

/** 等级：四档，只看车间秩序（僵尸越多越该收工牌）。 */
export const levelOf = (headcount) => {
  const h = headcount || {}
  if (!h.total) return { key: 'unknown', emoji: '❓', text: '看不清', color: '#8a93a8' }
  if (h.zombie >= 5) return { key: 'dirty', emoji: '😅', text: '僵尸有点多', color: '#e2593a' }
  if (h.zombie >= 1) return { key: 'few', emoji: '🙂', text: '有几个僵尸', color: '#e0963a' }
  if (!h.running) return { key: 'idle', emoji: '😴', text: '都歇了', color: '#8a93a8' }
  return { key: 'tidy', emoji: '😄', text: '车间整洁', color: '#3f9b5a' }
}

/**
 * 把三段原始文本拼成卡片要的 JSON（纯函数，离线可测）。
 * @param {{roll?:string, busiest?:string, table?:string}} raws
 * @returns {object}
 */
export const assemble = (raws) => {
  const r = raws || {}
  const headcount = countRoll(r.roll)
  return {
    headcount,
    zombies: zombieList(r.roll).slice(0, 12),
    busiest: parseBusiest(r.busiest),
    foreman: foremanOf(r.table),
    level: levelOf(headcount),
    ts: Date.now(),
  }
}

/** 真机采集一次。 */
export const collect = async () => {
  const [roll, busiest, table] = await Promise.all([
    run(CMD.roll), run(CMD.busiest), run(CMD.table),
  ])
  return assemble({ roll, busiest, table })
}

let cache = null

/** 带 5 秒缓存的采集：卡片轮询和手工 curl 都不会反复敲系统命令。 */
export const collectCached = async () => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data
  const data = await collect()
  cache = { at: Date.now(), data }
  return data
}
