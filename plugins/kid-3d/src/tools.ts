/** kid-3d 的八个工具：开新工坊、放积木、拆积木、刷颜色、套装模板、打开存档、看图、导出打印文件。 */
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { Kid3dConfig } from './config.ts'
import { buildObj, buildStl } from './export.ts'
import { buildMesh, modelBounds } from './geometry.ts'
import {
  colorCounts,
  describePiece,
  emptyModel,
  makePiece,
  normalizeName,
  piecesTouching,
  shapeCounts,
  touch,
} from './model.ts'
import { renderHtml } from './render-html.ts'
import { VIEW_LABEL, VIEW_NAMES, modelSummary, renderSvg } from './render-svg.ts'
import type { SvgStats, ViewName } from './render-svg.ts'
import { archiveModel, ensureDirs, fileFor, listArchive, pathsFor, readArchive, readModel, writeBinary, writeModel, writeText } from './state.ts'
import type { ArchiveEntry, Paths } from './state.ts'
import { TEMPLATES, buildTemplate, findTemplate, templateList } from './templates.ts'
import {
  AXES,
  GROUNDS,
  GROUND_LABEL,
  SHAPES,
  SHAPE_LABEL,
  clamp,
  colorName,
  paletteList,
  resolveColor,
  round,
} from './types.ts'
import type { Ground, Model, Vec3 } from './types.ts'

/** 工坊最小/最大边长（格）。 */
const MIN_SIZE = 8
const MAX_SIZE = 32
/** 会转圈的网页转一圈要几秒。 */
const SPIN_SECONDS = 16
/** 模板作品需要的工坊边长，至少这么大才放得下。 */
const TEMPLATE_SIZE = 16

type ExportFormat = 'stl' | 'obj' | 'html' | 'all'
const FORMATS: readonly ExportFormat[] = ['stl', 'obj', 'html', 'all']

function pick<T extends string>(input: unknown, allowed: readonly T[], fallback: T): T {
  const text = typeof input === 'string' ? input.trim().toLowerCase() : ''
  for (const value of allowed) {
    if (value.toLowerCase() === text) return value
  }
  return fallback
}

function numbers3(input: unknown): Vec3 | undefined {
  if (!Array.isArray(input)) return undefined
  const out: number[] = []
  for (const item of input.slice(0, 3)) {
    const value = typeof item === 'number' ? item : Number(item)
    if (!Number.isFinite(value)) return undefined
    out.push(value)
  }
  if (out.length !== 3) return undefined
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0]
}

function vec3(input: unknown, fallback: Vec3): Vec3 {
  return numbers3(input) ?? fallback
}

function intOr(input: unknown, fallback: number): number {
  const value = typeof input === 'number' ? input : Number(input)
  return Number.isFinite(value) ? Math.round(value) : fallback
}

function numOr(input: unknown, fallback: number): number {
  const value = typeof input === 'number' ? input : Number(input)
  return Number.isFinite(value) ? value : fallback
}

function truthy(input: unknown, fallback: boolean): boolean {
  return typeof input === 'boolean' ? input : fallback
}

/** 认得出这个颜色名/色号吗？认不出就返回 undefined（好给小朋友提个醒）。 */
function knownColor(input: unknown): string | undefined {
  if (typeof input !== 'string' || input.trim() === '') return undefined
  const hex = resolveColor(input, '')
  return hex === '' ? undefined : hex
}

/** 小朋友看得懂的一句话：现在一共几件、都是什么。 */
function pieceSummary(model: Model): string {
  if (model.pieces.length === 0) return '现在一件积木都还没有'
  const shapes = shapeCounts(model)
    .map((row) => `${row.count} 个${SHAPE_LABEL[row.shape]}`)
    .join('、')
  const colors = colorCounts(model)
    .map((row) => `${row.count} 件${colorName(row.color)}`)
    .join('、')
  return `现在一共 ${model.pieces.length} 件积木（${shapes}；${colors}）`
}

function filesHint(...files: string[]): string {
  return `文件：${files.join('、')}`
}

function presentHint(file: string): string {
  return `提示：想看这张图，就用 present 把 ${file} 发给小朋友；他看到的是一张会转圈的图，转起来更像真的。`
}

interface RenderInfo {
  file: string
  htmlFile: string
  stats: SvgStats
  interactive: boolean
  slow: boolean
}

function viewFileName(model: Model, view: ViewName, spin: number, zoom: number, grid: boolean): string {
  const canonical = view === 'iso' && spin === 0 && zoom === 1 && grid
  // 非主视图才加后缀；名字先截短，免得 normalizeName 的 24 字上限把后缀吃掉。
  const base = model.name.slice(0, 18)
  return canonical ? model.name : `${base}-${view}`
}

/** 画一张图（并顺手更新会转圈的网页），返回文件名。 */
async function draw(
  paths: Paths,
  model: Model,
  config: Kid3dConfig,
  view: ViewName,
  spin: number,
  zoom: number,
  grid: boolean,
): Promise<RenderInfo> {
  const started = Date.now()
  const mesh = buildMesh(model)
  const svg = renderSvg(model, mesh, { view, spin, zoom, grid })
  const html = renderHtml(model, mesh, {
    spinSeconds: SPIN_SECONDS,
    interactiveMaxFaces: config.interactiveMaxFaces,
    dragOrbit: config.dragOrbit,
    svgFallback: svg.svg,
  })
  const svgPath = fileFor(paths, viewFileName(model, view, spin, zoom, grid), 'svg')
  const htmlPath = fileFor(paths, model.name, 'html')
  await writeText(paths, svgPath, svg.svg)
  await writeText(paths, htmlPath, html.html)
  return {
    file: svgPath,
    htmlFile: htmlPath,
    stats: svg.stats,
    interactive: html.interactive,
    slow: Date.now() - started > config.timeoutMs,
  }
}

async function openPaths(cwd: string | undefined, config: Kid3dConfig): Promise<Paths> {
  const paths = pathsFor(cwd ?? process.cwd(), config.workDir)
  await ensureDirs(paths)
  return paths
}

/** 读作品；没有就现开一间默认工坊，并在返回值里说明。 */
async function loadOrCreate(
  paths: Paths,
  config: Kid3dConfig,
): Promise<{ model: Model; created: boolean }> {
  const existing = await readModel(paths)
  if (existing !== undefined) return { model: existing, created: false }
  const model = emptyModel('我的作品', config.defaultSize, 'grass')
  await writeModel(paths, model)
  return { model, created: true }
}

function slowNote(info: RenderInfo): string {
  return info.slow ? '（这次算得慢了一点，积木太多的话可以少放几件）' : ''
}

function htmlNote(info: RenderInfo, config: Kid3dConfig): string {
  return info.interactive
    ? `会转圈的网页：${info.htmlFile}（面数 ${info.stats.faces}。预览里它会自己转；用真浏览器打开这个文件，就能按住拖动转视角、滚轮远近、双击回正面）`
    : `会转圈的网页：${info.htmlFile}（这个作品有 ${info.stats.faces} 个面，比 ${config.interactiveMaxFaces} 多，网页里先放静态图）`
}

/** 存档清单里一行一件：文件名（可原样点名）+ 里面有几件积木 + 什么时候存的。 */
function archiveLines(entries: ArchiveEntry[], max = 10): string {
  const shown = entries.slice(0, max)
  const lines = shown.map((entry) => `· ${entry.file} ｜ ${entry.pieces} 件积木 ｜ ${stampText(entry.time)}`)
  if (entries.length > shown.length) {
    lines.push(`（还有 ${entries.length - shown.length} 件更早的，没列出来）`)
  }
  return lines.join('\n')
}

function stampText(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '时间不详'
  const date = new Date(ms)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** 造出八个工具。 */
export function buildKid3dTools(config: Kid3dConfig): ToolDefinition[] {
  return [
    defineTool({
      name: 'kid3d_new',
      description:
        '给小朋友开一间新的「3D 积木工坊」（空白作品），并顺手把上一件作品存进 存档/ 里。之后用 kid3d_build 往里放积木、kid3d_view 看立体图。工坊有固定大小，积木出了墙就会被挡住。',
      parameters: {
        name: {
          type: 'string',
          description: '作品名字，比如「我的小房子」。不写就叫「我的作品」。',
        },
        size: {
          type: 'integer',
          description: `工坊有多大（格），${MIN_SIZE}~${MAX_SIZE}，不写就是 ${config.defaultSize} 格。`,
        },
        ground: {
          type: 'string',
          enum: [...GROUNDS],
          description: `地面是什么：${GROUNDS.map((g) => `${g}（${GROUND_LABEL[g]}）`).join('、')}。不写就是草地 grass。`,
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const previous = await readModel(paths)
        let archived = ''
        if (previous !== undefined && previous.pieces.length > 0) {
          const file = await archiveModel(paths, previous)
          if (file !== undefined) archived = `\n上一件作品「${previous.name}」已经收进 存档/：${file}`
        }
        const name = normalizeName(typeof args.name === 'string' ? args.name : undefined, '我的作品')
        const size = clamp(intOr(args.size, config.defaultSize), MIN_SIZE, MAX_SIZE)
        const ground = pick<Ground>(args.ground, GROUNDS, 'grass')
        const model = emptyModel(name, size, ground)
        await writeModel(paths, model)
        const info = await draw(paths, model, config, 'iso', 0, 1, true)
        return [
          '【工坊开好了】',
          `名字：${model.name}`,
          `大小：${size}×${size}×${size} 格（左右 x、上下 y、前后 z 都从 0 数到 ${size - 1}）`,
          `地面：${GROUND_LABEL[ground]}`,
          '现在里面空空的，第一件积木等着你放。',
          '',
          `比如：kid3d_build shape box at [6,0,6] size [4,4,4] color 红`,
          '',
          presentHint(info.file),
          filesHint(info.file, info.htmlFile) + archived,
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_build',
      description:
        '往工坊里放一块积木。at 是这块积木最小角的坐标 [左右,上下,前后]（格子），size 是它三个方向各占几格。方块只能用整数格，球/圆柱/圆锥/棱锥/圆环可以用小数。积木可以叠、可以重叠，重叠的地方谁后放就用谁的颜色。放好会自动更新作品图。',
      parameters: {
        shape: {
          type: 'string',
          enum: [...SHAPES],
          description: `形状：${SHAPES.map((s) => `${s}（${SHAPE_LABEL[s]}）`).join('、')}。不写就是方块 box。`,
        },
        at: {
          type: 'array',
          items: { type: 'number' },
          description: '放在哪里：三个数字 [x,y,z]，是这块积木最小角的格子坐标，比如 [6,0,6]。',
        },
        size: {
          type: 'array',
          items: { type: 'number' },
          description: '多大：三个数字 [宽,高,深]，各占几格，比如 [4,4,4]。',
        },
        color: {
          type: 'string',
          description: `颜色：${paletteList()}，也可以直接写 #ff8800 这样的色号。不写就是蓝色。`,
        },
        axis: {
          type: 'string',
          enum: [...AXES],
          description: '躺着的方向（只有圆柱/圆锥/圆环用得上）：x 朝左右躺、y 竖着站、z 朝前后躺。不写就是 y。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const { model, created } = await loadOrCreate(paths, config)
        if (model.pieces.length >= config.maxPieces) {
          return `【积木太多啦】这间工坊已经放了 ${model.pieces.length} 件（上限 ${config.maxPieces} 件），先拆掉几件再放吧：kid3d_erase at [x,y,z] size [宽,高,深]。`
        }
        const result = makePiece(
          { shape: args.shape, at: args.at, size: args.size, color: args.color, axis: args.axis },
          model,
          model.pieces.length + 1,
        )
        if (!result.ok) return result.message
        const piece = result.piece
        const stacked = piecesTouching(model, piece.at, piece.size)
        model.pieces.push(piece)
        touch(model)
        await writeModel(paths, model)
        const info = await draw(paths, model, config, 'iso', 0, 1, true)
        const overlap = stacked.length > 0 ? `\n它和 ${stacked.length} 件积木贴在一起/叠在一起，会连成一块。` : ''
        const opened = created ? '\n（工坊还没开，我先替你开了一间草地工坊。）' : ''
        return [
          '【放好了】',
          `${describePiece(piece)}`,
          pieceSummary(model),
          overlap + opened,
          '',
          presentHint(info.file),
          filesHint(info.file) + slowNote(info),
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_erase',
      description:
        '拆掉和某块区域有接触的积木（整件整件地拆，不是切一半）。at 是要拆的位置，size 是这块区域的大小；不写 size 就是 1 格，正好点到哪件拆哪件。拆完会自动更新作品图。',
      parameters: {
        at: {
          type: 'array',
          items: { type: 'number' },
          description: '要拆哪里：三个数字 [x,y,z]，用积木左下前角的坐标。',
        },
        size: {
          type: 'array',
          items: { type: 'number' },
          description: '要拆的范围有多大：[宽,高,深]，不写就是 [1,1,1]。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const model = await readModel(paths)
        if (model === undefined) return '【还没开工坊】先调 kid3d_new 开一间，或者直接调 kid3d_build 放积木，我会自动开一间。'
        if (model.pieces.length === 0) return '【工坊是空的】现在没有积木可以拆，先放一件吧：kid3d_build at [6,0,6] size [4,4,4]。'
        const at = numbers3(args.at)
        if (at === undefined) {
          return `【要告诉我拆哪里】at 要写三个数字，比如 at [6,0,0]。现在里面有：\n${model.pieces
            .slice(0, 5)
            .map((piece) => `· ${describePiece(piece)}`)
            .join('\n')}`
        }
        const size = vec3(args.size, [1, 1, 1])
        const targets = piecesTouching(model, at, size)
        if (targets.length === 0) {
          return `【那儿没有积木】(${at.map((n) => round(n, 2)).join(', ')}) 附近是空的。现在里面有：\n${model.pieces
            .slice(0, 5)
            .map((piece) => `· ${describePiece(piece)}`)
            .join('\n')}`
        }
        const removed = new Set(targets.map((piece) => piece.id))
        model.pieces = model.pieces.filter((piece) => !removed.has(piece.id))
        touch(model)
        await writeModel(paths, model)
        const info = await draw(paths, model, config, 'iso', 0, 1, true)
        return [
          `【拆掉了 ${targets.length} 件】`,
          targets
            .slice(0, 4)
            .map((piece) => `· ${describePiece(piece)}`)
            .join('\n'),
          pieceSummary(model),
          '',
          presentHint(info.file),
          filesHint(info.file) + slowNote(info),
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_paint',
      description:
        '给和某块区域有接触的积木换颜色（整件换）。at/size 和 kid3d_erase 一样；写上 from 就只换本来是这个颜色的那些。换完会自动更新作品图。',
      parameters: {
        at: {
          type: 'array',
          items: { type: 'number' },
          description: '刷哪里：三个数字 [x,y,z]。不写就是把整个作品都刷一遍。',
        },
        size: {
          type: 'array',
          items: { type: 'number' },
          description: '刷多大范围：[宽,高,深]，不写就是 [1,1,1]。',
        },
        color: {
          type: 'string',
          description: `刷成什么颜色：${paletteList()}，也可以写 #ff8800。`,
        },
        from: {
          type: 'string',
          description: '只刷本来是这个颜色的积木，比如 from 红。不写就是全都刷。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const model = await readModel(paths)
        if (model === undefined || model.pieces.length === 0) {
          return '【工坊是空的】没有积木可以刷，先放一件吧：kid3d_build at [6,0,6] size [4,4,4] color 红。'
        }
        if (typeof args.color !== 'string' || args.color.trim() === '') {
          return `【要刷成什么颜色】在 color 里写一个颜色，比如 color 红。现在能用的颜色有：${paletteList()}。`
        }
        const color = knownColor(args.color)
        if (color === undefined) {
          return `【不认识「${args.color}」这个颜色】可以写这些名字：${paletteList()}；也可以写 #ff8800 这样的色号。`
        }
        const at = numbers3(args.at) ?? ([0, 0, 0] as Vec3)
        const size = numbers3(args.size) ?? ([model.size[0], model.size[1], model.size[2]] as Vec3)
        const fromText = typeof args.from === 'string' ? args.from.trim() : ''
        const from = fromText === '' ? undefined : knownColor(fromText)
        if (fromText !== '' && from === undefined) {
          return `【不认识「${fromText}」这个颜色】from 要写积木现在的颜色，比如 from 红；能用的颜色有：${paletteList()}。`
        }
        const targets = piecesTouching(model, at, size).filter(
          (piece) => from === undefined || piece.color === from,
        )
        if (targets.length === 0) {
          return `【没找到要刷的积木】${
            from === undefined ? '那块地方是空的' : `那里没有${colorName(from)}的积木`
          }。${pieceSummary(model)}。`
        }
        for (const piece of targets) piece.color = color
        touch(model)
        await writeModel(paths, model)
        const info = await draw(paths, model, config, 'iso', 0, 1, true)
        return [
          `【刷好了】把 ${targets.length} 件积木刷成了${colorName(color)}`,
          pieceSummary(model),
          '',
          presentHint(info.file),
          filesHint(info.file) + slowNote(info),
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_template',
      description:
        '一键搭出一个现成的作品（小房子、小城堡、小火箭、大树、雪人、小汽车、小船、爱心、小猫、机器人），会开一间新工坊、把里面的积木摆好。注意：这会换掉现在工坊里的作品，旧的那件会先存进 存档/。',
      parameters: {
        template: {
          type: 'string',
          enum: TEMPLATES.map((template) => template.key),
          description: `要哪一个：${templateList()}。`,
        },
        name: {
          type: 'string',
          description: '作品名字，不写就用模板自己的名字，比如「小房子」。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const key = typeof args.template === 'string' ? args.template : ''
        const template = findTemplate(key)
        if (template === undefined) {
          return `【没有这个模板】能一键搭出来的有：\n${TEMPLATES.map(
            (item) => `· ${item.key}（${item.name}）：${item.hint}`,
          ).join('\n')}`
        }
        const previous = await readModel(paths)
        let archived = ''
        if (previous !== undefined && previous.pieces.length > 0) {
          const file = await archiveModel(paths, previous)
          if (file !== undefined) archived = `\n上一件作品「${previous.name}」已经收进 存档/：${file}`
        }
        const name = normalizeName(typeof args.name === 'string' ? args.name : template.name, template.name)
        const size = Math.max(config.defaultSize, TEMPLATE_SIZE)
        const model = emptyModel(name, size, template.ground)
        const built = buildTemplate(template, model, 1)
        if (!built.ok) return built.message
        model.pieces = built.pieces
        touch(model)
        await writeModel(paths, model)
        const info = await draw(paths, model, config, 'iso', 0, 1, true)
        const note =
          size === config.defaultSize
            ? ''
            : `\n（为了放下它，工坊开成了 ${size}×${size}×${size} 格。）`
        return [
          `【${template.name}做好了】`,
          `${template.hint}`,
          `${built.pieces.length} 件积木，${pieceSummary(model)}`,
          note + archived,
          '',
          presentHint(info.file),
          filesHint(info.file, info.htmlFile) + slowNote(info),
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_open',
      description:
        '打开 存档/ 里以前收起来的作品接着玩（现在这间工坊里的作品会先自动收进 存档/，不会丢），并且画一张新的立体图。不写 name 就只把存档清单念给小朋友听：有哪些作品、各几件积木、什么时候存的。',
      parameters: {
        name: {
          type: 'string',
          description:
            '要打开哪一件：作品名字，或者清单里那一整行文件名（同名有几件时就写文件名）。不写就只列清单。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const entries = await listArchive(paths)
        const raw = typeof args.name === 'string' ? args.name.trim() : ''
        if (entries.length === 0) {
          return [
            '【存档里还空着】',
            '每次用 kid3d_new 开新工坊、或者换作品时，上一件会自动收进 存档/。',
            '现在这间工坊里的作品，直接用 kid3d_view 就能看。',
          ].join('\n')
        }
        if (raw === '') {
          return [
            `【存档里有 ${entries.length} 件作品】（最新的排前面）`,
            archiveLines(entries),
            '',
            '要接着玩哪一件，就把它的名字（或者那一整行文件名）写进 name。',
          ].join('\n')
        }
        const bare = normalizeName(raw, '')
        const matches = entries.filter(
          (entry) => entry.file === raw || entry.file.includes(raw) || (bare !== '' && entry.name.includes(bare)),
        )
        const target = matches[0]
        if (target === undefined) {
          return [
            `【存档里没找到「${raw}」】`,
            archiveLines(entries),
            '',
            '想打开哪一件，把那一整行文件名原样写进 name 就行。',
          ].join('\n')
        }
        if (matches.length > 1) {
          return [
            `【有 ${matches.length} 件都叫「${raw}」，要哪一件？】`,
            archiveLines(matches),
            '',
            '把你要的那一行文件名原样写进 name。',
          ].join('\n')
        }
        const model = await readArchive(paths, target.file)
        if (model === undefined) {
          return `【这件打不开】存档文件 ${target.file} 读不出来（可能已经删掉或者坏了）。可以不带 name 再看一遍清单。`
        }
        const current = await readModel(paths)
        let archived = ''
        if (current !== undefined && current.pieces.length > 0) {
          const file = await archiveModel(paths, current)
          if (file !== undefined) archived = `\n刚才那件「${current.name}」也收进 存档/ 了：${file}`
        }
        await writeModel(paths, model)
        const info = await draw(paths, model, config, 'iso', 0, 1, true)
        return [
          `【打开啦】「${model.name}」回来了（${stampText(target.time)} 存的）`,
          `${modelSummary(model)}${archived}`,
          '',
          presentHint(info.file),
          htmlNote(info, config),
          filesHint(info.file) + slowNote(info),
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_view',
      description:
        '看现在的作品：画一张平面立体图（SVG，一定有），并且更新会转圈的网页（HTML）。view 选角度：iso 斜着看（默认）、front 正面、side 侧面、top 从上面看、quad 四个角度拼一张。想看得更立体就调 spin，让画面转一个角度。画完把文件 present 给小朋友看。',
      parameters: {
        view: {
          type: 'string',
          enum: [...VIEW_NAMES],
          description: `从哪个角度画：${VIEW_NAMES.map((view) => `${view}（${VIEW_LABEL[view]}）`).join('、')}。不写就是 iso。`,
        },
        spin: {
          type: 'number',
          description: '多转一点角度（0~360 度），不写就是 0。quad 拼图模式下只有斜视图会转。',
        },
        zoom: {
          type: 'number',
          description: '放大倍数 0.5~2，不写就是 1。作品太小看不清时可以放大。',
        },
        grid: {
          type: 'boolean',
          description: '要不要画地上的格子，默认要（true）。不想要就写 false。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const model = await readModel(paths)
        if (model === undefined) {
          return '【还没开工坊】先调 kid3d_new 开一间，或者 kid3d_template 一键搭一个。'
        }
        const view = pick<ViewName>(args.view, VIEW_NAMES, 'iso')
        const spin = clamp(numOr(args.spin, 0), 0, 360)
        const zoom = clamp(numOr(args.zoom, 1), 0.5, 2)
        const grid = truthy(args.grid, true)
        const info = await draw(paths, model, config, view, spin, zoom, grid)
        const empty = model.pieces.length === 0 ? '\n（工坊里还是空的，图上只有地面。先放几件积木就更像样了。）' : ''
        return [
          `【画好了】${VIEW_LABEL[view]}${spin === 0 ? '' : ` · 转了 ${round(spin, 1)}°`}${zoom === 1 ? '' : ` · 放大 ${round(zoom, 2)} 倍`}`,
          `${modelSummary(model)}`,
          `这幅画有 ${info.stats.faces} 个面，画出来 ${info.stats.drawn} 个（背面的被挡住了，看不见就不画）。`,
          empty,
          '',
          presentHint(info.file),
          htmlNote(info, config),
          filesHint(info.file) + slowNote(info),
        ].join('\n')
      },
    }),

    defineTool({
      name: 'kid3d_export',
      description:
        '把作品打包成能带走的文件：stl（3D 打印用的立体模型，单位毫米）、obj（3D 软件能打开的样子）、html（会转圈的网页，可以直接发给别人）。format 写 all 就三个都要。',
      parameters: {
        format: {
          type: 'string',
          enum: [...FORMATS],
          description: '要哪种：stl、obj、html，或者 all（全都要，默认）。',
        },
      },
      output: {
        schema: { type: 'string' },
        render: (_args, value) => [{ type: 'text', text: value }],
      },
      async execute(args, exec) {
        const paths = await openPaths(exec.agent?.session.header.cwd, config)
        const model = await readModel(paths)
        if (model === undefined || model.pieces.length === 0) {
          return '【工坊是空的】还没有东西可以打包，先放几件积木：kid3d_build at [6,0,6] size [4,4,4]。'
        }
        const wanted = pick<ExportFormat>(args.format, FORMATS, 'all')
        const mesh = buildMesh(model)
        const bounds = modelBounds(model)
        const lines: string[] = [`【打包好了】${model.name}`]
        if (wanted === 'stl' || wanted === 'all') {
          const stl = buildStl(mesh, config.unitMm)
          const file = fileFor(paths, model.name, 'stl')
          await writeBinary(paths, file, stl)
          const size = ([0, 1, 2] as const).map(
            (axis) => round(((bounds.max[axis] ?? 0) - (bounds.min[axis] ?? 0)) * config.unitMm, 1),
          )
          lines.push(
            `· ${file}（${Math.round(stl.byteLength / 1024)} KB，${stl.readUInt32LE(80)} 个三角面）`,
            `  这是 3D 打印用的文件，1 格 = ${config.unitMm} 毫米，所以打出来大约是 ${size[0]}×${size[2]}×${size[1]} 毫米（长×宽×高，y 轴朝上）。`,
          )
        }
        if (wanted === 'obj' || wanted === 'all') {
          const obj = buildObj(model, mesh, config.unitMm)
          const file = fileFor(paths, model.name, 'obj')
          await writeText(paths, file, obj)
          lines.push(`· ${file}（${Math.round(obj.length / 1024)} KB，3D 软件能打开，颜色也一起带上了）`)
        }
        if (wanted === 'html' || wanted === 'all') {
          const info = await draw(paths, model, config, 'iso', 0, 1, true)
          lines.push(`· ${info.htmlFile}（会转圈的网页，不用装任何东西，谁都能打开看）`)
        }
        lines.push(
          '',
          '关键一句：STL 是给打印机看的，OBJ 是给建模软件看的，HTML 是给人看的。',
          '提示：把文件 present 给小朋友，他就能拿着去打印或者发给朋友。',
        )
        return lines.join('\n')
      },
    }),
  ]
}
