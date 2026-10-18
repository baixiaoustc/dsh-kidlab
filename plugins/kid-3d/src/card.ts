import type { IncomingMessage, ServerResponse } from 'node:http'
import { readdir, stat } from 'node:fs/promises'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { buildMesh, modelBounds } from './geometry.ts'
import { colorCounts, shapeCounts } from './model.ts'
import { modelSummary, renderSvg, VIEW_NAMES, type ViewName } from './render-svg.ts'
import { pathsFor, readModel, type Paths } from './state.ts'
import { colorName, GROUND_LABEL, SHAPE_LABEL } from './types.ts'

/**
 * kid-3d 的前端卡片（client half 的同源数据源）。
 *
 * 卡片是浏览器里的一块 React 组件，它读不到进程里的事，所以由这里注册两条
 * 只读同源路由给它喂数据：
 *   GET /kid-3d/state         —— 工坊现状（作品名/件数/颜色/形状/占地/存档/文件）
 *   GET /kid-3d/preview.svg   —— 现场渲一张等距小图，卡片当图片显示
 * 两条都只读：不改文件、不执行命令、只认会话 id 对应工作目录下的作品目录。
 *
 * 注册动作由本包的 host 半部发起（`src/index.ts` 的 apply 直接调用
 * `registerKid3dCard`）：合并成「一个包 = 插件行 + 卡片」之后（迁移指南 §14），
 * 卡片和工具同生共死，装一次就齐活，也不会有两个包抢同一条路由。
 */

/**
 * 卡片真正用到的两项配置（其余工具配置与卡片无关）。
 * 默认值和工具包一致：`workDir` = 'kid3d'、`unitMm` = 5。
 */
export interface CardConfig {
  /** 工坊目录名（会话工作目录下的子目录）。 */
  workDir: string
  /** 一格多少毫米，用来把格数换算成打印尺寸。 */
  unitMm: number
}

/** 卡片数据路由。 */
export const STATE_PATH = '/kid-3d/state'
/** 卡片小图路由（按需渲染 SVG）。 */
export const PREVIEW_PATH = '/kid-3d/preview.svg'

/** 小图尺寸夹取范围（像素），别让卡片要一张巨大的图。 */
const MIN_WIDTH = 240
const MAX_WIDTH = 1200
const MIN_HEIGHT = 200
const MAX_HEIGHT = 900

/** 算作「成品文件」的后缀：kid3d_view / kid3d_export 会写出这些。 */
const ARTIFACT_EXTENSIONS = new Set(['svg', 'html', 'stl', 'obj'])

/** 卡片要显示的工坊现状；模型还没建时 exists=false，其余字段为 null。 */
interface CardState {
  exists: boolean
  /** 作品目录绝对路径（卡片脚本没权限时，看这里就知道该去哪儿找） */
  dir: string
  /** dir 来自会话工作目录还是兜底的进程工作目录 */
  resolvedFrom: 'session' | 'process'
  name: string | null
  summary: string | null
  pieces: number | null
  /** 工坊边长（格），立方体 */
  workshop: number | null
  ground: string | null
  groundLabel: string | null
  shapes: Array<{ shape: string; label: string; count: number }>
  colors: Array<{ hex: string; name: string; count: number }>
  /** 打印出来多大（毫米，长×宽×高，y 轴朝上） */
  print: { long: number; wide: number; tall: number } | null
  /** 占地（格，x×z） */
  footprint: { w: number; d: number } | null
  /** 已经画/导出过的成品文件名 */
  files: string[]
  /** 存档/ 里收着几件作品 */
  archive: number | null
  updatedAt: string | null
  /** 作品文件 mtime，当图片缓存键用 */
  rev: string | null
}

/** 读作品文件之外的东西：成品文件清单、存档件数、作品文件 mtime。 */
async function readSidecar(paths: Paths): Promise<{
  files: string[]
  archive: number | null
  mtimeMs: number | null
}> {
  let files: string[] = []
  try {
    const entries = await readdir(paths.dir, { withFileTypes: true })
    files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => ARTIFACT_EXTENSIONS.has(name.split('.').pop() ?? ''))
      .sort()
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  let archive: number | null = null
  try {
    archive = (await readdir(paths.archiveDir)).length
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  let mtimeMs: number | null = null
  try {
    mtimeMs = (await stat(paths.modelFile)).mtimeMs
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
  }
  return { files, archive, mtimeMs }
}

/**
 * 采集卡片要显示的一整份工坊现状。
 * @param paths - 作品目录
 * @param config - 卡片用到的配置（workDir/unitMm；用 unitMm 把格子换算成毫米）
 * @param resolvedFrom - dir 的来路，便于排查「卡片怎么读错目录了」
 * @returns 卡片状态；作品不存在时 exists=false
 */
export async function collectCardState(
  paths: Paths,
  config: CardConfig,
  resolvedFrom: 'session' | 'process',
): Promise<CardState> {
  const model = await readModel(paths)
  const sidecar = await readSidecar(paths)
  const base = {
    dir: paths.dir,
    resolvedFrom,
    files: sidecar.files,
    archive: sidecar.archive,
  }
  if (model === undefined) {
    return {
      exists: false,
      ...base,
      name: null,
      summary: null,
      pieces: null,
      workshop: null,
      ground: null,
      groundLabel: null,
      shapes: [],
      colors: [],
      print: null,
      footprint: null,
      updatedAt: null,
      rev: null,
    }
  }
  const bounds = modelBounds(model)
  const span = [0, 1, 2].map((axis) => (bounds.max[axis] ?? 0) - (bounds.min[axis] ?? 0))
  return {
    exists: true,
    ...base,
    name: model.name,
    summary: modelSummary(model),
    pieces: model.pieces.length,
    workshop: model.size[0],
    ground: model.ground,
    groundLabel: GROUND_LABEL[model.ground],
    shapes: shapeCounts(model).map((row) => ({
      shape: row.shape,
      label: SHAPE_LABEL[row.shape],
      count: row.count,
    })),
    colors: colorCounts(model).map((row) => ({
      hex: row.color,
      name: colorName(row.color),
      count: row.count,
    })),
    // 和 kid3d_export 同一套口径：长×宽×高，y 轴朝上
    print: {
      long: round1((span[0] ?? 0) * config.unitMm),
      wide: round1((span[2] ?? 0) * config.unitMm),
      tall: round1((span[1] ?? 0) * config.unitMm),
    },
    footprint: { w: round1(span[0] ?? 0), d: round1(span[2] ?? 0) },
    updatedAt: model.updatedAt,
    rev: sidecar.mtimeMs === null ? null : String(Math.round(sidecar.mtimeMs)),
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clamp(value: number, low: number, high: number): number {
  return Math.max(low, Math.min(high, value))
}

/** 只放行 GET/HEAD；其它方法回 405 并说明允许的方法。 */
function methodAllowed(req: IncomingMessage, res: ServerResponse): boolean {
  if (req.method === 'GET' || req.method === 'HEAD') return true
  res.writeHead(405, { allow: 'GET', 'content-type': 'text/plain; charset=utf-8' })
  res.end('method not allowed')
  return false
}

function send(req: IncomingMessage, res: ServerResponse, status: number, type: string, text: string): void {
  res.writeHead(status, {
    'content-type': type,
    'content-length': Buffer.byteLength(text),
    'cache-control': 'no-store',
  })
  res.end(req.method === 'HEAD' ? undefined : text)
}

function query(req: IncomingMessage): URLSearchParams {
  return new URL(req.url ?? '/', 'http://localhost').searchParams
}

function numberParam(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key)
  // 注意 Number(null) === 0：没传参数时必须走 fallback，否则尺寸全被夹到最小值
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

/**
 * 注册卡片的两条只读路由。
 *
 * 会话 → 作品目录的解析：卡片只会拿到会话 id，工作目录得问 `sessions` 服务
 * （`session.header.cwd`）。查不到就退回进程工作目录，并在响应里标出来。
 * @param ctx - 插件上下文
 * @param config - 卡片用到的配置（workDir/unitMm）
 */
export function registerKid3dCard(ctx: Context, config: CardConfig): void {
  // webServer 由 dsh-web-app 提供，插件挂载顺序不保证 apply 时它已就位；
  // 用 inject 等它就绪再挂路由（headless 启动没有 webServer，回调不触发 = 静默跳过）。
  ctx.inject(['webServer'], (child) => {
    const webServer = child.get('webServer')
    if (webServer === undefined) return
    const sessions = child.get('sessions')

  const at = (sessionId: string | null): { paths: Paths; from: 'session' | 'process' } => {
    const cwd = sessionId === null ? undefined : sessions?.get(sessionId as SessionId)?.header.cwd
    if (cwd === undefined) return { paths: pathsFor(process.cwd(), config.workDir), from: 'process' }
    return { paths: pathsFor(cwd, config.workDir), from: 'session' }
  }

  const stateRoute: WebRoute = {
    kind: 'exact',
    path: STATE_PATH,
    async handler(req, res) {
      if (!methodAllowed(req, res)) return
      const { paths, from } = at(query(req).get('session'))
      try {
        const state = await collectCardState(paths, config, from)
        send(req, res, 200, 'application/json; charset=utf-8', JSON.stringify(state))
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        send(req, res, 500, 'application/json; charset=utf-8', JSON.stringify({ error: message }))
      }
    },
  }

  const previewRoute: WebRoute = {
    kind: 'exact',
    path: PREVIEW_PATH,
    async handler(req, res) {
      if (!methodAllowed(req, res)) return
      const params = query(req)
      const { paths } = at(params.get('session'))
      try {
        const model = await readModel(paths)
        if (model === undefined) {
          send(req, res, 404, 'application/json; charset=utf-8', JSON.stringify({ error: '还没开工坊' }))
          return
        }
        const rawView = params.get('view') ?? ''
        const view: ViewName = VIEW_NAMES.includes(rawView as ViewName) ? (rawView as ViewName) : 'iso'
        const svg = renderSvg(model, buildMesh(model), {
          view,
          spin: clamp(numberParam(params, 'spin', 0), 0, 360),
          zoom: 1,
          grid: params.get('grid') === '1',
          width: clamp(numberParam(params, 'w', 560), MIN_WIDTH, MAX_WIDTH),
          height: clamp(numberParam(params, 'h', 400), MIN_HEIGHT, MAX_HEIGHT),
        })
        send(req, res, 200, 'image/svg+xml; charset=utf-8', svg.svg)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        send(req, res, 500, 'application/json; charset=utf-8', JSON.stringify({ error: message }))
      }
    },
  }

    child.effect(() => webServer.register(stateRoute), 'kid-3d: card state route')
    child.effect(() => webServer.register(previewRoute), 'kid-3d: card preview route')
  })
}
