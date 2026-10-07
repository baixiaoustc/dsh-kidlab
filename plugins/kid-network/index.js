// ============================================================
// kid-network · host half（静态 bundle 的宿主半边）
// 一个包同时提供两样东西：
//   1) 五个模型工具 net_my_identity / net_trace_trip / net_test_speed /
//      net_who_is_home / net_dns（见 tools.js）
//   2) 同源只读 JSON 路由 GET /kid-network/collect，供浏览器里的 🕊️ 信鸽邮局
//      卡片定时拉数据（采集逻辑由旧的 cordis/host.js 搬来，存档在
//      legacy/old-dynamic-plugin/cordis/host.js）
// 旧的 host.js 走沙箱 ctx.shell 采数、用 harness.handle('net:collect') 开 RPC；
// 静态 bundle 是普通 Node 模块，直接 import node:child_process（迁移指南 5.1 / #5）。
// 刻意只 import 本包内的文件和 node 内置模块：bundle 从 profile 的 node_modules
// 解析，link: 安装时只有包内相对路径和 node 内置模块一定解析得到。
// 没有 tools 能力的 profile：卡片照常，只是没有工具。
// 没有 webServer（headless）：工具照常，只是没有卡片的数据源。
// ============================================================
import { execFile } from 'node:child_process'
import { buildNetworkTools } from './tools.js'

export const name = 'kid-network'

/** 卡片拉数据的路径；与 client.js 里的 fetch 保持一致。 */
const PATH = '/kid-network/collect'

/** 采集命令超时（毫秒）。与旧 src/config.ts 的默认值/上下限一致。 */
const DEFAULT_TIMEOUT_MS = 12000
const MIN_TIMEOUT_MS = 2000
const MAX_TIMEOUT_MS = 30000

/** 采集结果缓存时长：卡片 8 秒轮询一次，5 秒缓存足够挡住重复刷新。 */
const CACHE_MS = 5000

/** 出网命令（cip.cc / 测速）最少给足的窗口，避免被小 timeoutMs 抢先杀掉。 */
const NET_MIN_TIMEOUT_MS = 15000

/** 把行里的 config.timeoutMs 收敛到合法区间；不合法就用默认值。（导出供离线自测。） */
export function timeoutMsOf(config) {
  const n = Number(config && config.timeoutMs)
  if (!Number.isFinite(n)) return DEFAULT_TIMEOUT_MS
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(n)))
}

// ------------------------------------------------------------
// 采集层（旧 cordis/host.js 的 collect）
// ------------------------------------------------------------

/** 信鸽要送的几封信（固定国内站点，方便小朋友认），硬编码常量。 */
export const LETTERS = [
  { key: 'baidu', label: '北京 · 百度', host: 'www.baidu.com' },
  { key: 'aliyun', label: '杭州 · 阿里云', host: 'www.aliyun.com' },
  { key: 'qq', label: '深圳 · 腾讯', host: 'www.qq.com' },
]

/**
 * 跑一条只读命令，返回 stdout 文本；失败返回空串（由各段降级成 null）。
 * @param {string} cmd shell 命令
 * @param {number} timeoutMs 超时毫秒
 * @returns {Promise<string>}
 */
const run = (cmd, timeoutMs) => new Promise((resolve) => {
  execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8' }, (_err, stdout) => {
    resolve(typeof stdout === 'string' ? stdout : '')
  })
})

/** 取第一行非空文本。 */
export const firstLine = (s) => (String(s || '').split('\n').map((x) => x.trim()).find(Boolean)) || ''

/**
 * macOS ping 汇总行: `round-trip min/avg/max/stddev = a/b/c/d ms`
 * @returns {number|null} 平均延迟毫秒
 */
export const parsePingMs = (s) => {
  const m = String(s || '').match(/round-trip.*= ([\d.]+)\/([\d.]+)\/[\d.]+\/([\d.]+)/)
  if (!m) return null
  return Math.round(parseFloat(m[2]))
}

/** 解析 cip.cc 的输出：IP / 地址（城市） / 运营商。 */
export const parseCip = (s) => {
  const ip = String(s || '').match(/IP\s*:\s*([\d.]+)/)
  const addr = String(s || '').match(/地址\s*:\s*([^\n]+)/)
  const isp = String(s || '').match(/运营商\s*:\s*([^\n]+)/)
  return {
    ip: ip ? ip[1].trim() : null,
    city: addr ? addr[1].trim() : null,
    isp: isp ? isp[1].trim() : null,
  }
}

/**
 * 把各段原始文本拼成卡片要的 JSON（纯函数，离线可测）。
 * @param {{lanRaw?:string, gwRaw?:string, dnsRaw?:string, arpRaw?:string,
 *          pubRaw?:string, speedRaw?:string, pingRaws?:string[]}} raws
 * @returns {object}
 */
export const assemble = (raws) => {
  const r = raws || {}
  const speedNum = parseFloat(String(r.speedRaw || '').trim())
  return {
    lan: firstLine(r.lanRaw) || null,
    gw: firstLine(r.gwRaw) || null,
    dns: String(r.dnsRaw || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 3),
    neighbors: parseInt(String(r.arpRaw || '').trim(), 10) || null,
    pub: parseCip(r.pubRaw),
    speedKBps: isFinite(speedNum) && speedNum > 0 ? Math.round(speedNum / 1024) : null, // KB/s
    letters: LETTERS.map((L, i) => ({
      key: L.key, label: L.label, ms: parsePingMs((r.pingRaws || [])[i]),
    })),
    ts: Date.now(),
  }
}

/**
 * 真机采集一次。本地命令与出网命令分开跑：出网失败就降级成 null，
 * 不拖垮整张卡片（旧 host.js 的同一策略）。
 * @param {number} timeoutMs
 */
export const collect = async (timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const t = timeoutMs
  const netT = Math.max(t, NET_MIN_TIMEOUT_MS)
  // 本地命令（大概率放行）
  const [lanRaw, gwRaw, dnsRaw, arpRaw] = await Promise.all([
    run('ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null', t),
    run("netstat -rn | awk '/default/ && $1==\"default\" && $2 ~ /^[0-9]/ {print $2; exit}'", t),
    run("scutil --dns | awk '/nameserver\\[/ {print $3}' | sort -u | head -3", t),
    run("arp -a | grep -c '\\['", t),
  ])
  // 出网命令
  const pubRaw = await run('curl -s --max-time 5 cip.cc', netT)
  // 测速：单独给足超时（curl 自己 --max-time 8，外层不抢先杀），2MB 更快完成
  const speedRaw = await run("curl -s -o /dev/null -w '%{speed_download}' --max-time 8 'https://speed.cloudflare.com/__down?bytes=2000000'", netT)
  // 信鸽逐站送信延迟（并行）
  const pingRaws = await Promise.all(LETTERS.map((L) =>
    run(`ping -c 3 -t 4 ${L.host} 2>&1 | tail -1`, t)))
  return assemble({ lanRaw, gwRaw, dnsRaw, arpRaw, pubRaw, speedRaw, pingRaws })
}

let cache = null

/**
 * 带 5 秒缓存的采集入口：卡片轮询和手工 curl 都不会反复敲系统命令。
 * @param {number} timeoutMs
 */
export const collectCached = async (timeoutMs = DEFAULT_TIMEOUT_MS) => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data
  const data = await collect(timeoutMs)
  cache = { at: Date.now(), data }
  return data
}

// ------------------------------------------------------------
// 卡片数据路由
// ------------------------------------------------------------

/**
 * 造一个应答 /kid-network/collect 的 handler。
 * 采集函数可注入，便于离线自测（verify.mjs 用假数据，不打网络）。
 * @param {() => Promise<object>} collectFn
 */
export function makeHandler(collectFn) {
  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET' })
      res.end('method not allowed')
      return
    }
    let body
    let status = 200
    try {
      body = await collectFn()
    } catch (e) {
      status = 500
      body = { error: String((e && e.message) || e) }
    }
    const text = JSON.stringify(body)
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(text),
      'cache-control': 'no-store',
    })
    res.end(req.method === 'HEAD' ? undefined : text)
  }
}

/**
 * 装载插件。
 * @param ctx cordis 上下文
 * @param config 行配置：`enabled`（默认 true，只关工具）、`timeoutMs`（默认 12000，2000~30000）
 */
export function apply(ctx, config) {
  const t = timeoutMsOf(config)

  // 1) 模型工具：等 tools 能力出现才注册；这个 profile 没有 tools 也不影响卡片。
  if (!config || config.enabled !== false) {
    ctx.inject(['tools'], (child) => {
      child.effect(() => {
        const offs = buildNetworkTools({ timeoutMs: t }).map((tool) => child.tools.register(tool))
        return () => {
          for (const off of offs) if (typeof off === 'function') off()
        }
      }, 'kid-network: net_my_identity / net_trace_trip / net_test_speed / net_who_is_home / net_dns')
    })
  }

  // 2) 卡片的数据路由：没有 webServer（headless 启动）就静默跳过。
  const webServer = ctx.get('webServer')
  if (!webServer) return
  const handler = makeHandler(() => collectCached(t))
  ctx.effect(() => webServer.register({ kind: 'exact', path: PATH, handler }), 'kid-network: collect route')
}
