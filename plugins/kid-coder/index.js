// ============================================================
// kid-coder · host half（静态 bundle 的宿主半边）
// 一个包同时提供三样东西：
//   1) 五个模型工具 kid_run / kid_explain / kid_practice / kid_review / kid_steps（见 tools.js）
//   2) 同源 HTTP 路由 /kid-coder/run，供浏览器里的 🧑‍🏫 小教室卡片提交代码、就地取回运行结果
//   3) （随包携带）python/ 目录：kidrunner.py + kidturtle.py，kid_run 与卡片都靠它跑码
// 刻意只 import 本包内的文件和 node 内置模块：bundle 从 profile 的 node_modules
// 解析，link: 安装时只有包内相对路径和 node 内置模块一定解析得到。
// 没有 tools 能力的 profile：卡片照常，只是没有工具。
// 没有 webServer（headless）：工具照常，只是没有卡片的数据源。
// ============================================================
import { buildKidTools, runKidPython } from './tools.js'

export const name = 'kid-coder'

/** 卡片提交/取数的路径；与 client.js 里的 fetch 保持一致。 */
const PATH = '/kid-coder/run'

/** 请求体上限（防超大 payload）。 */
const MAX_BODY = 1 << 20

/** 把行里的 config 收敛到合法默认值（缺省即旧 Config 的默认值）。 */
function normalize(config) {
  const c = config || {}
  const num = (v, dflt, lo, hi) => {
    const n = Number(v)
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt
  }
  return {
    kidName: typeof c.kidName === 'string' && c.kidName ? c.kidName : '小伙伴',
    age: num(c.age, 8, 5, 18),
    language: c.language === 'en' ? 'en' : 'zh',
    level: c.level === 'intermediate' ? 'intermediate' : 'beginner',
    gamified: c.gamified !== false,
    favoriteTopic: typeof c.favoriteTopic === 'string' ? c.favoriteTopic : '',
    enabled: c.enabled !== false,
    runTimeoutSec: num(c.runTimeoutSec, 8, 1, 30),
    sandbox: c.sandbox !== false,
  }
}

/** 读完整请求体（有上限）。 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
      if (data.length > MAX_BODY) {
        reject(new Error('request body too large'))
        req.destroy()
      }
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/** 发一段 JSON。 */
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
 * 应答一次 /kid-coder/run 请求。
 *   GET  /kid-coder/run        → 200 一行状态 JSON（给链路自检用）
 *   POST /kid-coder/run {code} → 200 运行结果 JSON（同 kidrunner.py 的字段）
 */
function makeHandler(config) {
  return async (req, res) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      sendJson(req, res, 200, { name: 'kid-coder', ready: true, hint: 'POST {"code":"..."} 运行 Python' })
      return
    }
    if (req.method !== 'POST') {
      res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8', allow: 'GET, POST' })
      res.end('method not allowed')
      return
    }
    let code = ''
    try {
      const raw = await readBody(req)
      const parsed = raw ? JSON.parse(raw) : {}
      code = typeof parsed.code === 'string' ? parsed.code : String(parsed.code || '')
    } catch (e) {
      sendJson(req, res, 400, { ok: false, err: '请求体解析失败：' + String((e && e.message) || e) })
      return
    }
    try {
      const result = await runKidPython(config, code)
      sendJson(req, res, 200, result)
    } catch (e) {
      sendJson(req, res, 500, { ok: false, err: String((e && e.message) || e) })
    }
  }
}

/**
 * 装载插件。
 * @param ctx cordis 上下文
 * @param config 行配置：kidName/age/level/gamified/runTimeoutSec/sandbox/enabled…
 */
export function apply(ctx, config) {
  const cfg = normalize(config)

  // 1) 模型工具：等 tools 能力出现才注册；这个 profile 没有 tools 也不影响卡片。
  if (cfg.enabled) {
    ctx.inject(['tools'], (child) => {
      child.effect(() => {
        const offs = buildKidTools(cfg).map((tool) => child.tools.register(tool))
        return () => {
          for (const off of offs) if (typeof off === 'function') off()
        }
      }, 'kid-coder: kid_run / kid_explain / kid_practice / kid_review / kid_steps')
    })
  }

  // 2) 卡片的数据路由：没有 webServer（headless 启动）就静默跳过。
  const webServer = ctx.get('webServer')
  if (!webServer) return
  ctx.effect(() => webServer.register({ kind: 'exact', path: PATH, handler: makeHandler(cfg) }), 'kid-coder: run route')
}
