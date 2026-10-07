// ============================================================
// kid-sysmon · host half（静态 bundle 的宿主半边）
// 一个包同时提供：
//   1) 一个模型工具 system_status（见 tools.js）
//   2) 同源只读 HTTP 路由 GET /kid-sysmon/collect，供 🐻 体检卡片取数（见 collect.js）
// 只 import 本包内的文件与 node 内置模块：bundle 从 profile 的 node_modules 解析，
// link: 安装时只有包内相对路径和 node 内置模块一定解析得到。
// 没有 tools 能力的 profile：卡片照常，只是没有工具。
// 没有 webServer（headless）：工具照常，只是没有卡片的数据源。
// ============================================================
import { buildSysmonTools } from './tools.js'
import { collect } from './collect.js'

export const name = 'kid-sysmon'

const PATH = '/kid-sysmon/collect'

/** 把行里的 config 收敛到合法默认值（对齐旧版 src/config.ts）。 */
function normalize(config) {
  const c = config || {}
  const n = Number(c.timeoutMs)
  return {
    enabled: c.enabled !== false,
    verbose: c.verbose === true,
    timeoutMs: Number.isFinite(n) ? Math.min(30000, Math.max(1000, Math.round(n))) : 8000,
  }
}

function sendJson(req, res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
  })
  res.end(req.method === 'HEAD' ? undefined : text)
}

/**
 * GET /kid-sysmon/collect[?scope=all] → 体检数据 JSON
 * 只读；非 GET/HEAD 返回 405。
 */
function makeHandler(config) {
  return async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET' })
      res.end('method not allowed')
      return
    }
    const url = new URL(req.url || PATH, 'http://127.0.0.1')
    const scope = url.searchParams.get('scope') || 'all'
    try {
      sendJson(req, res, 200, await collect(config, scope))
    } catch (e) {
      sendJson(req, res, 500, { error: String((e && e.message) || e) })
    }
  }
}

export function apply(ctx, config) {
  const cfg = normalize(config)

  if (cfg.enabled) {
    ctx.inject(['tools'], (child) => {
      child.effect(() => {
        const offs = buildSysmonTools(cfg).map((tool) => child.tools.register(tool))
        return () => {
          for (const off of offs) if (typeof off === 'function') off()
        }
      }, 'kid-sysmon: system_status')
    })
  }

  const webServer = ctx.get('webServer')
  if (!webServer) return
  ctx.effect(() => webServer.register({ kind: 'exact', path: PATH, handler: makeHandler(cfg) }), 'kid-sysmon: collect route')
}
