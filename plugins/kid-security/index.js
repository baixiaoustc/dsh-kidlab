// ============================================================
// kid-security · host half（静态 bundle 的宿主半边）
// 一个包同时提供两样东西：
//   1) 模型工具 sec_wall / sec_locker / sec_lock / sec_door / sec_login（见 tools.js）
//   2) 同源只读 JSON 路由 GET /kid-security/collect，供浏览器里的 🏰 卡片定时拉数据
// 刻意只 import 本包内的文件和 node 内置模块：bundle 从 profile 的 node_modules
// 解析，link: 安装时只有包内相对路径和 node 内置模块一定解析得到。
// 没有 tools 能力的 profile：卡片照常，只是没有工具。
// 没有 webServer（headless）：工具照常，只是没有卡片的数据源。
// ============================================================
import { collectCached } from './collect.js'
import { buildSecurityTools } from './tools.js'

export const name = 'kid-security'

/** 卡片拉数据的路径；与 client.js 里的 fetch 保持一致。 */
const PATH = '/kid-security/collect'

/** 采集命令超时（毫秒）。与旧插件的 Config 默认值/上下限一致。 */
const DEFAULT_TIMEOUT_MS = 8000
const MIN_TIMEOUT_MS = 1000
const MAX_TIMEOUT_MS = 30000

/** 把行里的 config.timeoutMs 收敛到合法区间；不合法就用默认值。 */
function timeoutMsOf(config) {
  const n = Number(config && config.timeoutMs)
  if (!Number.isFinite(n)) return DEFAULT_TIMEOUT_MS
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, Math.round(n)))
}

/**
 * 应答一次采集请求。
 * @param req node:http 请求
 * @param res node:http 应答
 */
const handler = async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET' })
    res.end('method not allowed')
    return
  }
  let body
  let status = 200
  try {
    body = await collectCached()
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

/**
 * 装载插件。
 * @param ctx cordis 上下文
 * @param config 行配置：`enabled`（默认 true，只关工具）、`timeoutMs`（默认 8000）
 */
export function apply(ctx, config) {
  // 1) 模型工具：等 tools 能力出现才注册；这个 profile 没有 tools 也不影响卡片。
  if (!config || config.enabled !== false) {
    ctx.inject(['tools'], (child) => {
      child.effect(() => {
        const offs = buildSecurityTools({ timeoutMs: timeoutMsOf(config) })
          .map((tool) => child.tools.register(tool))
        return () => {
          for (const off of offs) if (typeof off === 'function') off()
        }
      }, 'kid-security: sec_wall / sec_locker / sec_lock / sec_door / sec_login')
    })
  }

  // 2) 卡片的数据路由：没有 webServer（headless 启动）就静默跳过。
  const webServer = ctx.get('webServer')
  if (!webServer) return
  ctx.effect(() => webServer.register({ kind: 'exact', path: PATH, handler }), 'kid-security: collect route')
}
