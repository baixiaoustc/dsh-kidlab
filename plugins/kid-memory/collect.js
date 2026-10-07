// ============================================================
// kid-memory · 采集层（只用 node 内置模块，可单独 node 运行验证）
//
// 主题：🦉 记忆小管家 —— 把内存讲成「电脑的工作台 / 短期记忆」的小故事。
// 与 kid-storage 的「🧳 大仓库 / 长期记忆」配对：
//   内存管**正在做的**事（摊开就占地方，关掉程序=收回空位），
//   硬盘管**长期存的**东西。
//
// 为什么不用 top / ps：
//   agent 的 bash 沙箱会拦掉 /usr/bin/top 与 /bin/ps（Operation not permitted）。
//   静态 bundle 的 host 半部是普通 Node 模块，改用两条更稳、全部免 sudo 的路：
//     · 总量 / 空闲 → sysctl -n hw.memsize + memory_pressure -Q（只读）
//     · 占用榜     → python3 + ctypes/libproc 逐进程读 RSS（不受 top 限制）
//
// 单位口径：hw.memsize 是字节、RSS 是字节、memory_pressure 给百分比，
// 统一换算成给小朋友看的 GB / MB（humanBytes / humanKB）。
// ============================================================
import { execFile } from 'node:child_process'

/** python3 候选路径（按可靠性排序；execFile 不经 shell，逐个试）。 */
const PYTHONS = ['/usr/local/bin/python3', 'python3', '/usr/bin/python3']

/** sysctl 候选路径（macOS 上它在 /usr/sbin，不在默认 PATH 的 /usr/bin 里）。 */
const SYSCTLS = ['/usr/sbin/sysctl', 'sysctl']

/**
 * 跑一条命令，只取 stdout。
 * 失败时不抛错而是返回 { ok, out }：不少系统命令即使退出码非 0 也已把有用内容
 * 打到 stdout（例如某参数不被支持），这类部分结果仍然可用。
 * @param {string} file 可执行文件
 * @param {string[]} args 参数数组（不经 shell，路径含空格也安全）
 * @param {number} timeoutMs 超时毫秒
 * @returns {Promise<{ok: boolean, out: string}>}
 */
const run = (file, args, timeoutMs) =>
  new Promise((resolve) => {
    execFile(file, args, { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }, (error, stdout) => {
      resolve({ ok: !error, out: error && !stdout ? '' : (stdout ?? '') })
    })
  })

/** 依次尝试候选路径，返回第一个成功执行者的 stdout。 */
const runFirst = async (candidates, args, timeoutMs) => {
  let last = ''
  for (const bin of candidates) {
    const r = await run(bin, args, timeoutMs)
    if (r.ok) return r.out
    last = r.out
  }
  return last
}

/**
 * 列出每个进程的 RSS 与名字（python3 + libproc，全部只读、免 sudo）。
 *
 * 三个关键点（都是真机踩出来的）：
 *   1. `proc_taskinfo` 结构必须声明**完整 18 个字段**——只声明前 2 个字段会被内核
 *      判为尺寸不符、整批返回 0，症状是「扫不到任何进程」；
 *   2. 第 1、2 个字段依次是 virtual size 与 resident size，都是 uint64；
 *   3. 这里**不做聚合、不做名字净化**，原样打印后交给 JS（于是聚合逻辑可以离线单测）。
 *
 * 用 chr(9) 拼分隔符而不是字面量，避免在 JS 模板字符串里嵌套转义。
 */
const PY_SCRIPT = `import ctypes
lib = ctypes.CDLL('/usr/lib/libproc.dylib', use_errno=True)
lib.proc_listpids.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_void_p, ctypes.c_int]
lib.proc_listpids.restype = ctypes.c_int
class TI(ctypes.Structure):
  _fields_ = [("v", ctypes.c_uint64), ("rss", ctypes.c_uint64), ("tu", ctypes.c_uint64), ("ts", ctypes.c_uint64), ("thu", ctypes.c_uint64), ("ths", ctypes.c_uint64), ("po", ctypes.c_int32), ("fa", ctypes.c_int32), ("pi", ctypes.c_int32), ("cf", ctypes.c_int32), ("ms", ctypes.c_int32), ("mr", ctypes.c_int32), ("sma", ctypes.c_int32), ("snu", ctypes.c_int32), ("csw", ctypes.c_int32), ("tn", ctypes.c_int32), ("nr", ctypes.c_int32), ("pr", ctypes.c_int32)]
lib.proc_pidinfo.argtypes = [ctypes.c_int, ctypes.c_int, ctypes.c_uint64, ctypes.c_void_p, ctypes.c_int]
lib.proc_pidinfo.restype = ctypes.c_int
lib.proc_name.argtypes = [ctypes.c_int, ctypes.c_void_p, ctypes.c_uint32]
lib.proc_name.restype = ctypes.c_int
B = (ctypes.c_int * 65536)()
n = lib.proc_listpids(1, 0, B, 65536 * 4)
out = []
for i in range(n):
  pid = B[i]
  if pid <= 0:
    continue
  ti = TI()
  if lib.proc_pidinfo(pid, 4, 0, ctypes.byref(ti), ctypes.sizeof(ti)) <= 0:
    continue
  if ti.rss <= 0:
    continue
  nb = ctypes.create_string_buffer(512)
  try:
    lib.proc_name(pid, nb, 512)
  except Exception:
    pass
  nm = nb.value.decode('utf-8', 'replace') or str(pid)
  out.append((ti.rss, nm.replace(chr(9), ' ')))
for rss, nm in sorted(out, reverse=True):
  print(str(rss) + chr(9) + nm)`

/** 字节 → { num, unit }（1GB = 1024MB，与系统显示口径一致）。 */
export const humanBytes = (b) => {
  if (!b || isNaN(b)) return { num: '—', unit: '' }
  if (b >= 1024 * 1024 * 1024) return { num: (b / 1024 / 1024 / 1024).toFixed(1), unit: 'GB' }
  if (b >= 1024 * 1024) return { num: (b / 1024 / 1024).toFixed(0), unit: 'MB' }
  return { num: String(Math.round(b / 1024)), unit: 'KB' }
}

/** KB → { num, unit }。 */
export const humanKB = (kb) => {
  if (!kb || isNaN(kb)) return { num: '—', unit: '' }
  if (kb >= 1024 * 1024) return { num: (kb / 1024 / 1024).toFixed(1), unit: 'GB' }
  if (kb >= 1024) return { num: (kb / 1024).toFixed(0), unit: 'MB' }
  return { num: String(Math.round(kb)), unit: 'KB' }
}

/** 解析 `sysctl -n hw.memsize`（字节）；拿不到返回 0。 */
export const parseMemsize = (text) => {
  const n = Number(String(text || '').trim())
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** 解析 `memory_pressure -Q` 里的空闲百分比；拿不到返回 null。 */
export const parsePressure = (text) => {
  const m = /free percentage:\s*(\d+)/i.exec(String(text || ''))
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) ? n : null
}

/**
 * 空闲率 → 给小朋友的定性（阈值与 kid-memory 工具半部保持一致）。
 * @param {number} freePct 空闲百分比
 */
export const pressureHint = (freePct) => {
  if (freePct >= 50) return { level: '宽裕', text: '很宽敞，工作台空位多，电脑不卡。', emoji: '😊' }
  if (freePct >= 20) return { level: '有点挤', text: '工作台用了不少，开太多东西可能会慢。', emoji: '🙂' }
  return { level: '很紧张', text: '工作台快占满了，建议关掉一些不用的程序。', emoji: '😅' }
}

/**
 * 把可执行名净化成小朋友看得懂的 App 名。
 *
 * 必须照顾到的真实形态：
 *   · `Google Chrome Helper (Renderer)`            → `Google Chrome`（先剥 Helper 及其后全部内容）
 *   · `/Applications/Visual Studio Code.app/…/Electron` → `Visual Studio Code`
 *   · `com.apple.WebKit.WebContent`                → `WebContent`（整串没人看得懂）
 *
 * ⚠️ `.app` 必须**以 `/` 或字符串结尾收口**，且要在按 `/` 取名之前先试一次。
 *    早先用 `s.find('.app')` 会把 `com.apple.foo` 里的 `.app` 也当 App 后缀，
 *    榜单上于是出现一个叫「com」的残渣（11 个守护进程合计约 72MB）。
 * @param {string} raw 进程名或可执行路径
 * @returns {string} 净化后的名字，空则 'unknown'
 */
export const normApp = (raw) => {
  let s = String(raw || '').trim()
  const app = /(?:^|\/)([^/]+?)\.app(?:\/|$)/.exec(s)
  if (app) s = app[1]
  else if (s.includes('/')) s = s.split('/').pop()
  s = s.replace(/\s+Helper.*$/, '')
  s = s.replace(/\(.*\)$/, '').trim()
  if (!s) return 'unknown'
  if (s.startsWith('com.apple.')) {
    const parts = s.split('.')
    if (parts.length > 2) s = parts[parts.length - 1]
  }
  return s
}

/**
 * 解析 python 打印的 `rss<TAB>name` 列表。
 * @param {string} text python stdout
 * @returns {{kb: number, name: string}[]}
 */
export const parseProcList = (text) => {
  const rows = []
  for (const line of String(text || '').split('\n')) {
    const m = /^(\d+)\t(.+)$/.exec(line.trim())
    if (!m) continue
    const kb = Math.round(parseInt(m[1], 10) / 1024)
    if (!kb) continue
    rows.push({ kb, name: m[2].trim() })
  }
  return rows
}

/**
 * 按 App 聚合 RSS 并降序排名。
 *
 * 为什么必须聚合：Chrome / VS Code / Lark 都会派生一串体量相近的 helper 进程，
 * 逐进程排名时榜首全是同量级的 helper，横条看起来「都差不多长」，反而看不出
 * 究竟谁占地方；把同一 App 的主进程 + 全部 helper 求和后，差异才是真的。
 * @param {{kb: number, name: string}[]} entries parseProcList 的结果
 * @param {number} limit 最多保留多少名
 * @returns {{name: string, kb: number, num: string, unit: string}[]}
 */
export const aggregateByApp = (entries, limit = 12) => {
  const agg = new Map()
  for (const e of entries || []) {
    const kb = e && e.kb > 0 ? e.kb : 0
    if (!kb) continue
    const app = normApp(e.name)
    agg.set(app, (agg.get(app) || 0) + kb)
  }
  return [...agg.entries()]
    .map(([name, kb]) => ({ name, kb, ...humanKB(kb) }))
    .sort((a, b) => b.kb - a.kb || a.name.localeCompare(b.name))
    .slice(0, limit)
}

/**
 * 一次完整采集。任何单项失败都优雅降级（字段为 0 / null / []），不抛错。
 * @returns {Promise<object>} { total, used, free, usedPct, top, pressure, ts }
 */
export async function collect() {
  // 1) 总内存（字节）
  const total = parseMemsize(await runFirst(SYSCTLS, ['-n', 'hw.memsize'], 5000))

  // 2) 空闲率 → 已用 / 空闲（不依赖被沙箱拦的 top）
  const freePct = parsePressure(await runFirst(['/usr/bin/memory_pressure', 'memory_pressure'], ['-Q'], 8000))

  const baseMB = total ? total / 1024 / 1024 : 0
  let usedMB = 0
  let freeMB = 0
  let usedPct = 0
  if (baseMB > 0 && freePct !== null) {
    freeMB = Math.round((baseMB * freePct) / 100)
    usedMB = baseMB - freeMB
    usedPct = 100 - freePct
  }

  // 3) 谁在占工作台（按 App 聚合）
  const top = aggregateByApp(parseProcList(await runFirst(PYTHONS, ['-c', PY_SCRIPT], 12000)))

  return {
    total: { ...humanBytes(total), bytes: total },
    used: { ...humanBytes(usedMB * 1024 * 1024), mb: usedMB },
    free: { ...humanBytes(freeMB * 1024 * 1024), mb: freeMB },
    usedPct,
    top,
    pressure: freePct === null ? null : { freePct, ...pressureHint(freePct) },
    ts: Date.now(),
  }
}

/**
 * 最近一次结果 + 在途请求。
 * 卡片每 8 秒轮询一次，而一次采集要起 python 扫全部进程（约 0.3~2 秒），
 * 所以 5 秒内复用同一份，并且多个页面同时打进来时共用同一个在途 Promise
 * （否则每开一个页面就多一轮全量扫描）。
 */
let cache = { at: 0, data: null }
let inflight = null

/** 带 5 秒缓存与在途合并的采集入口（host 半部只调它）。 */
export async function collectCached() {
  const now = Date.now()
  if (cache.data && now - cache.at < 5000) return cache.data
  if (inflight) return inflight
  inflight = collect()
    .then((data) => {
      cache = { at: Date.now(), data }
      return data
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
