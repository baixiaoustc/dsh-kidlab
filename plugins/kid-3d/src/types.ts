/** kid-3d 的共用类型、颜色表和小工具。 */

/** 三维坐标/尺寸：[x, y, z]；y 向上，地面在 y=0；单位是「格」。 */
export type Vec3 = [number, number, number]

/** 一件积木的形状。 */
export type Shape = 'box' | 'sphere' | 'cylinder' | 'cone' | 'pyramid' | 'torus'

/** 圆柱/圆锥/圆环「躺下」的方向：它的轴指向哪个世界坐标轴。 */
export type Axis = 'x' | 'y' | 'z'

/** 地面材质。 */
export type Ground = 'grass' | 'snow' | 'sand' | 'water' | 'none'

export const SHAPES: readonly Shape[] = ['box', 'sphere', 'cylinder', 'cone', 'pyramid', 'torus']
export const AXES: readonly Axis[] = ['x', 'y', 'z']
export const GROUNDS: readonly Ground[] = ['grass', 'snow', 'sand', 'water', 'none']

export const SHAPE_LABEL: Record<Shape, string> = {
  box: '方块',
  sphere: '圆球',
  cylinder: '圆柱',
  cone: '圆锥',
  pyramid: '尖顶',
  torus: '圆环',
}

export const GROUND_LABEL: Record<Ground, string> = {
  grass: '草地',
  snow: '雪地',
  sand: '沙地',
  water: '水面',
  none: '没有地面',
}

/** 一件积木：位置 at 是它的最小角（最靠里、最靠下、最靠后的那个角）。 */
export interface Piece {
  id: number
  shape: Shape
  at: Vec3
  size: Vec3
  /** 已解析成 #rrggbb 的颜色 */
  color: string
  /** 只对 cylinder/cone/torus 有意义 */
  axis: Axis
}

/** 一个作品（整个工坊）。 */
export interface Model {
  version: 1
  name: string
  /** 工坊的边长（格），立方体 */
  size: Vec3
  ground: Ground
  pieces: Piece[]
  updatedAt: string
}

/** 颜色，分量 0~255。 */
export type RGB = [number, number, number]

/** 一个多边形面片：3 或 4 个顶点，rgb 已经算好光照。 */
export interface Face {
  v: Vec3[]
  rgb: RGB
  /** 外法线（单位向量），用于背面剔除 */
  n: Vec3
}

export interface Mesh {
  faces: Face[]
}

/** 16 种积木颜色：小朋友常用的中文名 + 英文别名。 */
export const PALETTE: ReadonlyArray<{ name: string; hex: string; alias: string[] }> = [
  { name: '红', hex: '#e8453c', alias: ['红色', 'red', '大红'] },
  { name: '橙', hex: '#f5a03c', alias: ['橙色', 'orange', '桔色', '橘子色'] },
  { name: '黄', hex: '#f7d94c', alias: ['黄色', 'yellow'] },
  { name: '绿', hex: '#4caf50', alias: ['绿色', 'green', '草绿'] },
  { name: '青', hex: '#35c4d0', alias: ['青色', 'cyan', 'teal', '蓝绿'] },
  { name: '蓝', hex: '#3b82f6', alias: ['蓝色', 'blue', '深蓝'] },
  { name: '天蓝', hex: '#7ec8f7', alias: ['sky', 'skyblue', 'lightblue', '浅蓝', '天空蓝'] },
  { name: '紫', hex: '#9b5de5', alias: ['紫色', 'purple', 'violet'] },
  { name: '粉', hex: '#f492b6', alias: ['粉色', 'pink', '桃红'] },
  { name: '棕', hex: '#9c6b4f', alias: ['棕色', '咖啡色', '褐色', 'brown'] },
  { name: '米', hex: '#e8d5b7', alias: ['米色', 'beige', '米黄', 'sand', '肤色'] },
  { name: '白', hex: '#f7f7f7', alias: ['白色', 'white'] },
  { name: '灰', hex: '#9aa0a6', alias: ['灰色', 'gray', 'grey'] },
  { name: '黑', hex: '#2f3437', alias: ['黑色', 'black'] },
  { name: '金', hex: '#e0b154', alias: ['金色', 'gold', '金黄'] },
  { name: '银', hex: '#c9d1d9', alias: ['银色', 'silver'] },
]

const HEX_TO_NAME = new Map<string, string>(PALETTE.map((c) => [c.hex, c.name]))
const ALIAS_TO_HEX = new Map<string, string>()
for (const color of PALETTE) {
  ALIAS_TO_HEX.set(color.name, color.hex)
  for (const alias of color.alias) ALIAS_TO_HEX.set(alias, color.hex)
}

function expandShortHex(text: string): string {
  const body = text.slice(1)
  if (body.length !== 3) return text.toLowerCase()
  const [r, g, b] = [body[0] ?? '0', body[1] ?? '0', body[2] ?? '0']
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
}

/**
 * 把小朋友/模型说的颜色变成 #rrggbb。
 * 认「红 / 红色 / red / #e8453c / #f00」，认不出来返回 undefined。
 */
export function resolveColor(input: string | undefined, fallback: string): string {
  const raw = (input ?? '').trim()
  if (raw === '') return fallback
  const lower = raw.toLowerCase()
  const alias = ALIAS_TO_HEX.get(raw) ?? ALIAS_TO_HEX.get(lower)
  if (alias !== undefined) return alias
  if (lower.startsWith('#')) {
    const fixed = lower.length === 4 ? expandShortHex(lower) : lower
    if (/^#[0-9a-f]{6}$/.test(fixed)) return fixed
  }
  return fallback
}

/** 颜色的中文名（认不出来就还它本身）。 */
export function colorName(hex: string): string {
  return HEX_TO_NAME.get(hex) ?? hex
}

/** 提示里用的颜色清单：中文名 + 一个最好记的别名。 */
export function paletteList(): string {
  return PALETTE.map((color) => `${color.name}(${color.alias[0] ?? color.name})`).join('、')
}

export function hexToRgb(hex: string): RGB {
  const fixed = hex.length === 4 ? expandShortHex(hex) : hex
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(fixed)
  if (m === null) return [200, 200, 200]
  return [parseInt(m[1] ?? 'c8', 16), parseInt(m[2] ?? 'c8', 16), parseInt(m[3] ?? 'c8', 16)]
}

export function rgbToHex(rgb: RGB): string {
  const part = (n: number): string => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${part(rgb[0])}${part(rgb[1])}${part(rgb[2])}`
}

/** 阳光方向（从物体指向太阳）：左上前方。 */
const LIGHT: Vec3 = [-0.42, 0.78, 0.46]
const LIGHT_LEN = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2])

/** 环境光 + 漫反射，得到这个面的颜色。 */
export function shade(rgb: RGB, n: Vec3): RGB {
  const dot = (n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) / LIGHT_LEN
  const k = 0.62 + 0.38 * Math.max(0, dot)
  return [rgb[0] * k, rgb[1] * k, rgb[2] * k]
}

/** 地面配色：底色 / 网格线 / 天空上下两端。 */
export interface GroundStyle {
  fill: string
  line: string
  skyTop: string
  skyBottom: string
}

export const GROUND_STYLE: Record<Ground, GroundStyle> = {
  grass: { fill: '#a9d98a', line: '#8cc46b', skyTop: '#bfe6ff', skyBottom: '#f2fbff' },
  snow: { fill: '#eef6ff', line: '#d3e4f5', skyTop: '#c8e4ff', skyBottom: '#fbfdff' },
  sand: { fill: '#f0dcae', line: '#e0c68c', skyTop: '#cdeaff', skyBottom: '#fff9ec' },
  water: { fill: '#a8d8f0', line: '#8ec7e6', skyTop: '#c6e8ff', skyBottom: '#f0fbff' },
  none: { fill: '#e9eef3', line: '#dbe2e9', skyTop: '#e8f2fb', skyBottom: '#ffffff' },
}

/** 数值裁剪。 */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** 四舍五入到 n 位小数，去掉浮点噪声（0.30000000000000004 → 0.3）。 */
export function round(v: number, digits = 4): number {
  const k = 10 ** digits
  return Math.round(v * k) / k
}

/** 数组里出现最多的那个（用于统计主色）。 */
export function mode<T>(items: readonly T[]): T | undefined {
  const counts = new Map<T, number>()
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
  let best: T | undefined
  let bestCount = -1
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item
      bestCount = count
    }
  }
  return best
}
