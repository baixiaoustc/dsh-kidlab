/**
 * 把「一堆积木」变成「一堆三角/四边形面片」。
 *
 * 两条互相配合的路：
 *  1) 方块（box）→ 体素化：把每件方块按整数格填进一张三维小格子表，
 *     后放的盖住先放的；只保留露在外面的面，再把同一平面上同色的相邻格子
 *     合并成一个大多边形。于是 10×6 的一面墙只有 1 个面，而不是 60 个。
 *  2) 圆球/圆柱/圆锥/尖顶/圆环 → 三角化：按半径给足够的段数，圆滑又不爆面数。
 *
 * 每个面片都带外法线和算好光照的颜色，后面的 SVG / 网页 / STL / OBJ 都直接用。
 */

import {
  hexToRgb,
  shade,
} from './types.ts'
import type {
  Face,
  Mesh,
  Model,
  Piece,
  RGB,
  Vec3,
} from './types.ts'

interface RawFace {
  v: Vec3[]
  color: string
}

type VecOp = (a: Vec3, b: Vec3) => Vec3

const sub: VecOp = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross: VecOp = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2])
  if (len < 1e-9) return [0, 1, 0]
  return [v[0] / len, v[1] / len, v[2] / len]
}

const EPS = 1e-7

function samePoint(a: Vec3, b: Vec3): boolean {
  return Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS && Math.abs(a[2] - b[2]) < EPS
}

/** 加一个面（自动去掉重合的顶点，退化成少于 3 个点就丢掉）。 */
function pushFace(list: RawFace[], verts: Vec3[], color: string): void {
  const clean: Vec3[] = []
  for (const v of verts) {
    const last = clean[clean.length - 1]
    if (last !== undefined && samePoint(last, v)) continue
    clean.push(v)
  }
  while (clean.length > 1) {
    const first = clean[0]
    const last = clean[clean.length - 1]
    if (first !== undefined && last !== undefined && samePoint(first, last)) clean.pop()
    else break
  }
  if (clean.length < 3) return
  list.push({ v: clean, color })
}

/**
 * 闭合网格的有向体积（散度定理）。为正说明面片都是朝外的；
 * 负数说明绕向反了，我们会自动翻回来，保证光照和 STL 的朝向永远正确。
 */
export function rawVolume(faces: readonly RawFace[]): number {
  let total = 0
  for (const face of faces) {
    for (let i = 1; i + 1 < face.v.length; i += 1) {
      const a = face.v[0]
      const b = face.v[i]
      const c = face.v[i + 1]
      if (a === undefined || b === undefined || c === undefined) continue
      total +=
        a[0] * (b[1] * c[2] - b[2] * c[1]) -
        a[1] * (b[0] * c[2] - b[2] * c[0]) +
        a[2] * (b[0] * c[1] - b[1] * c[0])
    }
  }
  return total / 6
}

/** 某个形状在解析意义上的体积，测试时拿来比。 */
export function analyticVolume(piece: Piece): number {
  const [sx, sy, sz] = piece.size
  switch (piece.shape) {
    case 'box':
      return sx * sy * sz
    case 'sphere':
      return (4 / 3) * Math.PI * (sx / 2) * (sy / 2) * (sz / 2)
    case 'cylinder':
      return Math.PI * (sx / 2) * (sz / 2) * sy
    case 'cone':
      return (Math.PI * (sx / 2) * (sz / 2) * sy) / 3
    case 'pyramid':
      return (sx * sz * sy) / 3
    case 'torus': {
      const rt = Math.min(sy / 2, Math.min(sx, sz) / 4)
      const R = Math.max(rt * 0.5, Math.min(sx, sz) / 2 - rt)
      return 2 * Math.PI * Math.PI * R * rt * rt
    }
    default:
      return 0
  }
}

// ────────────────────────────── 方块：体素化 ──────────────────────────────

const PATTERN_OUT: ReadonlyArray<readonly [number, number]> = [[0, 0], [0, 1], [1, 1], [1, 0]]
const PATTERN_IN: ReadonlyArray<readonly [number, number]> = [[0, 0], [1, 0], [1, 1], [0, 1]]

interface DirSpec {
  axis: 0 | 1 | 2
  sign: 1 | -1
  iAxis: 0 | 1 | 2
  jAxis: 0 | 1 | 2
  pattern: ReadonlyArray<readonly [number, number]>
}

const DIRS: readonly DirSpec[] = [
  { axis: 0, sign: 1, iAxis: 2, jAxis: 1, pattern: PATTERN_OUT }, // +x
  { axis: 0, sign: -1, iAxis: 2, jAxis: 1, pattern: PATTERN_IN }, // -x
  { axis: 1, sign: 1, iAxis: 0, jAxis: 2, pattern: PATTERN_OUT }, // +y 顶面
  { axis: 1, sign: -1, iAxis: 0, jAxis: 2, pattern: PATTERN_IN }, // -y 底面
  { axis: 2, sign: 1, iAxis: 0, jAxis: 1, pattern: PATTERN_IN }, // +z
  { axis: 2, sign: -1, iAxis: 0, jAxis: 1, pattern: PATTERN_OUT }, // -z
]

function pointAt(axis: 0 | 1 | 2, plane: number, iAxis: 0 | 1 | 2, jAxis: 0 | 1 | 2, i: number, j: number): Vec3 {
  const v: Vec3 = [0, 0, 0]
  v[axis] = plane
  v[iAxis] = i
  v[jAxis] = j
  return v
}

/**
 * 同一平面上的同色格子贪心合并成大矩形。
 * grid 的 key 是 "i,j"。
 */
function mergeRect(
  grid: ReadonlyMap<string, string>,
  emit: (i0: number, i1: number, j0: number, j1: number, color: string) => void,
): void {
  const used = new Set<string>()
  const keys = [...grid.keys()]
  const cells: Array<[number, number]> = []
  for (const key of keys) {
    const [iText, jText] = key.split(',')
    const i = Number(iText)
    const j = Number(jText)
    if (Number.isFinite(i) && Number.isFinite(j)) cells.push([i, j])
  }
  // 先按 j 再按 i 排序，保证贪心稳定
  cells.sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]))
  for (const [i, j] of cells) {
    if (used.has(`${i},${j}`)) continue
    const color = grid.get(`${i},${j}`)
    if (color === undefined) continue
    let i1 = i + 1
    while (grid.get(`${i1},${j}`) === color && !used.has(`${i1},${j}`)) i1 += 1
    let j1 = j + 1
    for (;;) {
      let ok = true
      for (let k = i; k < i1; k += 1) {
        if (grid.get(`${k},${j1}`) !== color || used.has(`${k},${j1}`)) {
          ok = false
          break
        }
      }
      if (!ok) break
      j1 += 1
    }
    for (let k = i; k < i1; k += 1) {
      for (let m = j; m < j1; m += 1) used.add(`${k},${m}`)
    }
    emit(i, i1, j, j1, color)
  }
}

/** 所有方块 → 只留外表面的面片（已合并共面）。 */
function voxelFaces(model: Model): RawFace[] {
  const [W, H, D] = model.size
  const w = Math.max(1, Math.round(W))
  const h = Math.max(1, Math.round(H))
  const d = Math.max(1, Math.round(D))
  const key = (x: number, y: number, z: number): number => (y * d + z) * w + x

  const cells = new Map<number, string>()
  for (const piece of model.pieces) {
    if (piece.shape !== 'box') continue
    const x0 = Math.round(piece.at[0])
    const y0 = Math.round(piece.at[1])
    const z0 = Math.round(piece.at[2])
    const sx = Math.max(1, Math.round(piece.size[0]))
    const sy = Math.max(1, Math.round(piece.size[1]))
    const sz = Math.max(1, Math.round(piece.size[2]))
    for (let x = x0; x < x0 + sx; x += 1) {
      if (x < 0 || x >= w) continue
      for (let y = y0; y < y0 + sy; y += 1) {
        if (y < 0 || y >= h) continue
        for (let z = z0; z < z0 + sz; z += 1) {
          if (z < 0 || z >= d) continue
          cells.set(key(x, y, z), piece.color)
        }
      }
    }
  }

  const out: RawFace[] = []
  const decode = (k: number): Vec3 => {
    const x = k % w
    const rest = (k - x) / w
    const z = rest % d
    const y = (rest - z) / d
    return [x, y, z]
  }

  for (const dir of DIRS) {
    const planes = new Map<number, Map<string, string>>()
    for (const [k, color] of cells) {
      const [x, y, z] = decode(k)
      const nb = [x, y, z]
      const along = (nb[dir.axis] ?? 0) + dir.sign
      if (along >= 0 && along < ([w, h, d][dir.axis] ?? 0)) {
        nb[dir.axis] = along
        const nk = nb[0] ?? 0
        const ny = nb[1] ?? 0
        const nz = nb[2] ?? 0
        if (cells.has(key(nk, ny, nz))) continue
      }
      const cell = [x, y, z]
      const plane = (cell[dir.axis] ?? 0) + (dir.sign > 0 ? 1 : 0)
      let grid = planes.get(plane)
      if (grid === undefined) {
        grid = new Map<string, string>()
        planes.set(plane, grid)
      }
      grid.set(`${cell[dir.iAxis] ?? 0},${cell[dir.jAxis] ?? 0}`, color)
    }
    for (const [plane, grid] of planes) {
      mergeRect(grid, (i0, i1, j0, j1, color) => {
        const verts = dir.pattern.map(([di, dj]) =>
          pointAt(dir.axis, plane, dir.iAxis, dir.jAxis, di === 0 ? i0 : i1, dj === 0 ? j0 : j1),
        )
        pushFace(out, verts, color)
      })
    }
  }
  return out
}

// ────────────────────────────── 曲面形状 ──────────────────────────────

interface Polar {
  toWorld: (local: Vec3) => Vec3
  la: number
  lb: number
  lc: number
}

function polarOf(piece: Piece): Polar {
  const [sx, sy, sz] = piece.size
  switch (piece.axis) {
    case 'x':
      return { toWorld: (p) => [-p[1], p[0], p[2]], la: sy / 2, lb: sx / 2, lc: sz / 2 }
    case 'z':
      return { toWorld: (p) => [p[0], -p[2], p[1]], la: sx / 2, lb: sz / 2, lc: sy / 2 }
    default:
      return { toWorld: (p) => p, la: sx / 2, lb: sy / 2, lc: sz / 2 }
  }
}

/** 段数：半径越大越圆，但封顶，免得面数爆炸。 */
function segments(radius: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(radius * 4)))
}

function emitSphere(out: RawFace[], piece: Piece, center: Vec3): void {
  const [rx, ry, rz] = [piece.size[0] / 2, piece.size[1] / 2, piece.size[2] / 2]
  const nLat = segments(Math.max(rx, ry, rz), 6, 16)
  const nLon = Math.max(8, nLat * 2)
  const at = (i: number, j: number): Vec3 => {
    const theta = (Math.PI * i) / nLat
    const phi = (2 * Math.PI * j) / nLon
    return [
      center[0] + rx * Math.sin(theta) * Math.cos(phi),
      center[1] + ry * Math.cos(theta),
      center[2] + rz * Math.sin(theta) * Math.sin(phi),
    ]
  }
  for (let i = 0; i < nLat; i += 1) {
    for (let j = 0; j < nLon; j += 1) {
      pushFace(
        out,
        [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)],
        piece.color,
      )
    }
  }
}

function emitCylinder(out: RawFace[], piece: Piece, center: Vec3, polar: Polar): void {
  const { la, lb, lc, toWorld } = polar
  const n = segments(Math.max(la, lc), 8, 24)
  const base = (j: number, up: boolean): Vec3 => {
    const phi = (2 * Math.PI * j) / n
    const local: Vec3 = [la * Math.cos(phi), up ? lb : -lb, lc * Math.sin(phi)]
    const w = toWorld(local)
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]]
  }
  const mid = (up: boolean): Vec3 => {
    const w = toWorld([0, up ? lb : -lb, 0])
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]]
  }
  for (let j = 0; j < n; j += 1) {
    pushFace(out, [base(j, false), base(j, true), base(j + 1, true), base(j + 1, false)], piece.color)
    pushFace(out, [mid(true), base(j + 1, true), base(j, true)], piece.color)
    pushFace(out, [mid(false), base(j, false), base(j + 1, false)], piece.color)
  }
}

function emitCone(out: RawFace[], piece: Piece, center: Vec3, polar: Polar): void {
  const { la, lb, lc, toWorld } = polar
  const n = segments(Math.max(la, lc), 8, 24)
  const place = (local: Vec3): Vec3 => {
    const w = toWorld(local)
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]]
  }
  const rim = (j: number): Vec3 => {
    const phi = (2 * Math.PI * j) / n
    return place([la * Math.cos(phi), -lb, lc * Math.sin(phi)])
  }
  const apex = place([0, lb, 0])
  const foot = place([0, -lb, 0])
  for (let j = 0; j < n; j += 1) {
    pushFace(out, [apex, rim(j + 1), rim(j)], piece.color)
    pushFace(out, [foot, rim(j), rim(j + 1)], piece.color)
  }
}

function emitPyramid(out: RawFace[], piece: Piece): void {
  const [x0, y0, z0] = piece.at
  const [sx, sy, sz] = piece.size
  const x1 = x0 + sx
  const y1 = y0 + sy
  const z1 = z0 + sz
  const apex: Vec3 = [(x0 + x1) / 2, y1, (z0 + z1) / 2]
  const corners: Vec3[] = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y0, z1],
    [x0, y0, z1],
  ]
  for (let i = 0; i < 4; i += 1) {
    const a = corners[i]
    const b = corners[(i + 1) % 4]
    if (a === undefined || b === undefined) continue
    pushFace(out, [apex, a, b], piece.color)
  }
  pushFace(out, [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], piece.color)
}

function emitTorus(out: RawFace[], piece: Piece, center: Vec3, polar: Polar): void {
  const { la, lb, lc, toWorld } = polar
  const rt = Math.max(0.05, lb)
  const R = Math.max(rt * 0.5, Math.min(la, lc) - rt)
  const nMajor = segments(R + rt, 12, 28)
  const nTube = segments(rt, 6, 14)
  const at = (i: number, j: number): Vec3 => {
    const theta = (2 * Math.PI * i) / nMajor
    const phi = (2 * Math.PI * j) / nTube
    const rr = R + rt * Math.cos(phi)
    const local: Vec3 = [rr * Math.cos(theta), rt * Math.sin(phi), rr * Math.sin(theta)]
    const w = toWorld(local)
    return [center[0] + w[0], center[1] + w[1], center[2] + w[2]]
  }
  for (let i = 0; i < nMajor; i += 1) {
    for (let j = 0; j < nTube; j += 1) {
      pushFace(out, [at(i, j), at(i, j + 1), at(i + 1, j + 1), at(i + 1, j)], piece.color)
    }
  }
}

/** 一件曲面形状 → 面片（绕向已修正成朝外）。 */
export function curveFaces(piece: Piece): RawFace[] {
  const raw: RawFace[] = []
  const center: Vec3 = [
    piece.at[0] + piece.size[0] / 2,
    piece.at[1] + piece.size[1] / 2,
    piece.at[2] + piece.size[2] / 2,
  ]
  const polar = polarOf(piece)
  switch (piece.shape) {
    case 'sphere':
      emitSphere(raw, piece, center)
      break
    case 'cylinder':
      emitCylinder(raw, piece, center, polar)
      break
    case 'cone':
      emitCone(raw, piece, center, polar)
      break
    case 'pyramid':
      emitPyramid(raw, piece)
      break
    case 'torus':
      emitTorus(raw, piece, center, polar)
      break
    default:
      break
  }
  if (rawVolume(raw) < 0) {
    return raw.map((face) => ({ v: [...face.v].reverse(), color: face.color }))
  }
  return raw
}

function toFace(raw: RawFace): Face {
  const a = raw.v[0]
  const b = raw.v[1]
  const c = raw.v[2]
  const n = a !== undefined && b !== undefined && c !== undefined
    ? normalize(cross(sub(b, a), sub(c, a)))
    : [0, 1, 0] as Vec3
  const base: RGB = hexToRgb(raw.color)
  return { v: raw.v, rgb: shade(base, n), n }
}

/** 模型 → 网格。方块走体素合并，曲面形状走三角化。 */
export function buildMesh(model: Model): Mesh {
  const raw: RawFace[] = voxelFaces(model)
  for (const piece of model.pieces) {
    if (piece.shape === 'box') continue
    for (const face of curveFaces(piece)) raw.push(face)
  }
  return { faces: raw.map(toFace) }
}

/** 模型外框（所有积木的包围盒），没有积木时返回地板范围。 */
export function modelBounds(model: Model): { min: Vec3; max: Vec3 } {
  if (model.pieces.length === 0) {
    return { min: [0, 0, 0], max: [model.size[0], model.size[1], model.size[2]] }
  }
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const piece of model.pieces) {
    for (let axis = 0; axis < 3; axis += 1) {
      const lo = piece.at[axis] ?? 0
      const hi = lo + (piece.size[axis] ?? 0)
      min[axis] = Math.min(min[axis] ?? 0, lo)
      max[axis] = Math.max(max[axis] ?? 0, hi)
    }
  }
  return { min, max }
}
