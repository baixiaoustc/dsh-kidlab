/**
 * 作品的数据模型 + 所有「小朋友说错了」的友好检查。
 *
 * 一件积木 = 形状 + 位置（最小角）+ 大小 + 颜色 +（圆柱类才有的）朝向。
 * 位置和大小都用「格」作单位；方块会对齐到整数格（像真的乐高），
 * 圆球/圆柱这些允许小数，方便做斜的和圆的。
 */

import {
  AXES,
  GROUNDS,
  SHAPES,
  SHAPE_LABEL,
  colorName,
  paletteList,
  resolveColor,
  round,
} from './types.ts'
import type { Axis, Ground, Model, Piece, Shape, Vec3 } from './types.ts'

export const MODEL_VERSION = 1 as const

const EPS = 1e-6

/** 把名字收拾干净：去掉路径符号、限制长度。 */
export function normalizeName(input: string | undefined, fallback: string): string {
  const raw = (input ?? '').trim()
  const cleaned = raw
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\.+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned === '' || cleaned === '.' || cleaned === '..') return fallback
  return cleaned.slice(0, 24)
}

export function emptyModel(name: string, size: number, ground: Ground): Model {
  return {
    version: MODEL_VERSION,
    name: normalizeName(name, '我的作品'),
    size: [size, size, size],
    ground,
    pieces: [],
    updatedAt: new Date().toISOString(),
  }
}

export function touch(model: Model): Model {
  model.updatedAt = new Date().toISOString()
  return model
}

/** 从磁盘读回来的东西不一定是干净的，逐项检查一遍。 */
export function parseModel(text: string): Model | undefined {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return undefined
  }
  if (typeof data !== 'object' || data === null) return undefined
  const raw = data as Record<string, unknown>
  const sizeRaw = Array.isArray(raw['size']) ? (raw['size'] as unknown[]) : []
  const size = Number(sizeRaw[0] ?? 16)
  if (!Number.isFinite(size) || size < 8 || size > 32) return undefined
  const groundRaw = String(raw['ground'] ?? 'grass')
  const ground = (GROUNDS as readonly string[]).includes(groundRaw) ? (groundRaw as Ground) : 'grass'
  const model = emptyModel(typeof raw['name'] === 'string' ? raw['name'] : '我的作品', Math.round(size), ground)
  const piecesRaw = Array.isArray(raw['pieces']) ? (raw['pieces'] as unknown[]) : []
  let nextId = 1
  for (const item of piecesRaw) {
    if (typeof item !== 'object' || item === null) continue
    const result = makePiece(item as PieceInput, model, nextId, Math.round(size))
    if (result.ok) {
      model.pieces.push(result.piece)
      nextId = result.piece.id + 1
    }
  }
  if (typeof raw['updatedAt'] === 'string') model.updatedAt = raw['updatedAt']
  return model
}

export interface PieceInput {
  shape?: unknown
  at?: unknown
  size?: unknown
  color?: unknown
  axis?: unknown
}

export type PieceResult = { ok: true; piece: Piece } | { ok: false; message: string }

function numbers(input: unknown): Vec3 | undefined {
  if (!Array.isArray(input)) return undefined
  const out: number[] = []
  for (const item of input.slice(0, 3)) {
    const n = typeof item === 'number' ? item : Number(item)
    if (!Number.isFinite(n)) return undefined
    out.push(n)
  }
  if (out.length !== 3) return undefined
  return [out[0] ?? 0, out[1] ?? 0, out[2] ?? 0]
}

function fmtSize(model: Model): string {
  return `${model.size[0]}×${model.size[1]}×${model.size[2]}`
}

/**
 * 把一段「积木描述」变成真积木，说得不对就返回一句小朋友看得懂的话。
 * position 用来提示「放不下的时候可以挪到哪里」。
 */
export function makePiece(input: PieceInput, model: Model, id: number, fallbackExtent = 4): PieceResult {
  const shapeText = String(input.shape ?? 'box')
  if (!(SHAPES as readonly string[]).includes(shapeText)) {
    return {
      ok: false,
      message: `【不认识这个形状】「${shapeText}」我没做过。现在会做的有：${SHAPES.map((s) => `${s}（${SHAPE_LABEL[s]}）`).join('、')}。`,
    }
  }
  const shape = shapeText as Shape

  const colorText = typeof input.color === 'string' ? input.color.trim() : ''
  if (colorText !== '' && resolveColor(colorText, '') === '') {
    return {
      ok: false,
      message: `【不认识「${colorText}」这个颜色】可以写这些名字：${paletteList()}；也可以写 #ff8800 这样的色号。不写就是蓝色。`,
    }
  }

  const atRaw = numbers(input.at)
  if (atRaw === undefined) {
    return { ok: false, message: '【位置没看懂】要用三个数字说「放在哪儿」，比如 at:[0,0,0] 或 at:[2,0,3]（左右、上下、前后）。' }
  }
  const sizeRaw = numbers(input.size)
  const size: Vec3 = sizeRaw ?? [fallbackExtent, fallbackExtent, fallbackExtent]
  for (const value of size) {
    if (value <= 0) {
      return { ok: false, message: '【大小不能是 0 或负数】比如 size:[4,4,4] 表示长宽高各 4 格。' }
    }
  }

  const box = shape === 'box'
  const at: Vec3 = box
    ? [Math.round(atRaw[0]), Math.round(atRaw[1]), Math.round(atRaw[2])]
    : [atRaw[0], atRaw[1], atRaw[2]]
  const fixed: Vec3 = box
    ? [Math.max(1, Math.round(size[0])), Math.max(1, Math.round(size[1])), Math.max(1, Math.round(size[2]))]
    : [size[0], size[1], size[2]]

  const names = ['左右 x', '上下 y', '前后 z']
  for (let axis = 0; axis < 3; axis += 1) {
    const lo = at[axis] ?? 0
    const hi = lo + (fixed[axis] ?? 0)
    if (lo < -EPS) {
      return {
        ok: false,
        message: `【放到地下去了】${names[axis]} 不能是负数（${round(lo, 2)}）。工坊的地板在 0，往上才是正数。`,
      }
    }
    if (hi > (model.size[axis] ?? 0) + EPS) {
      const limit = model.size[axis] ?? 0
      const room = Math.max(0, round(limit - lo, 2))
      return {
        ok: false,
        message:
          `【放不下】这件积木朝 ${names[axis]} 会伸到工坊外面（工坊是 ${fmtSize(model)}，你说从 ${round(lo, 2)} 开始放 ${round(fixed[axis] ?? 0, 2)} 格，最远到 ${round(hi, 2)}，可墙在 ${limit}）。` +
          (room >= 1
            ? `可以试试把它改小到 ${room} 格以内，位置也往回收一点。`
            : '这个位置已经贴着墙了，要么换个地方，要么用 kid3d_new size 24 换一间更大的工坊。'),
      }
    }
  }

  const axisText = String(input.axis ?? 'y').toLowerCase()
  if (!(AXES as readonly string[]).includes(axisText)) {
    return { ok: false, message: `【朝向只认 x / y / z】「${axisText}」不行。躺着放用 axis:"x" 或 axis:"z"，站着放不用写。` }
  }

  return {
    ok: true,
    piece: {
      id,
      shape,
      at,
      size: fixed,
      color: resolveColor(colorText, '#3b82f6'),
      axis: axisText as Axis,
    },
  }
}

export function pieceBounds(piece: Piece): { min: Vec3; max: Vec3 } {
  return {
    min: [piece.at[0], piece.at[1], piece.at[2]],
    max: [piece.at[0] + piece.size[0], piece.at[1] + piece.size[1], piece.at[2] + piece.size[2]],
  }
}

/** 两个盒子有没有叠在一起（只是用来提示，叠着放是允许的）。 */
export function overlaps(a: Piece, b: Piece): boolean {
  const ba = pieceBounds(a)
  const bb = pieceBounds(b)
  for (let axis = 0; axis < 3; axis += 1) {
    if ((ba.max[axis] ?? 0) <= (bb.min[axis] ?? 0) + EPS) return false
    if ((bb.max[axis] ?? 0) <= (ba.min[axis] ?? 0) + EPS) return false
  }
  return true
}

function regionBounds(at: Vec3, size: Vec3): { min: Vec3; max: Vec3 } {
  return {
    min: [at[0], at[1], at[2]],
    max: [at[0] + size[0], at[1] + size[1], at[2] + size[2]],
  }
}

/** 找出所有和这块区域有接触的积木。 */
export function piecesTouching(model: Model, at: Vec3, size: Vec3): Piece[] {
  const region = regionBounds(at, size)
  return model.pieces.filter((piece) => {
    const b = pieceBounds(piece)
    for (let axis = 0; axis < 3; axis += 1) {
      if ((b.max[axis] ?? 0) <= (region.min[axis] ?? 0) + EPS) return false
      if ((region.max[axis] ?? 0) <= (b.min[axis] ?? 0) + EPS) return false
    }
    return true
  })
}

/** 「红色的方块」这样的一句话描述。 */
export function describePiece(piece: Piece): string {
  const axisNote = piece.axis === 'y' ? '' : piece.axis === 'x' ? '（朝左右躺着）' : '（朝前后躺着）'
  const curved = piece.shape === 'cylinder' || piece.shape === 'cone' || piece.shape === 'torus'
  const size = piece.size.map((n) => round(n, 2)).join('×')
  return `${colorName(piece.color)}的${SHAPE_LABEL[piece.shape]}${curved ? axisNote : ''} ${size} 格，放在 (${piece.at
    .map((n) => round(n, 2))
    .join(', ')})`
}

/** 数一数每种颜色各多少件。 */
export function colorCounts(model: Model): Array<{ color: string; count: number }> {
  const map = new Map<string, number>()
  for (const piece of model.pieces) {
    map.set(piece.color, (map.get(piece.color) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([color, count]) => ({ color, count }))
    .sort((a, b) => b.count - a.count)
}

/** 数一数每种形状各多少件。 */
export function shapeCounts(model: Model): Array<{ shape: Shape; count: number }> {
  const map = new Map<Shape, number>()
  for (const piece of model.pieces) {
    map.set(piece.shape, (map.get(piece.shape) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([shape, count]) => ({ shape, count }))
    .sort((a, b) => b.count - a.count)
}
