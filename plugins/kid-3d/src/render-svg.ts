/**
 * 静态立体图：把网格画成一张 SVG（矢量图，放大也不糊）。
 *
 * 做法是最经典的「画家算法」：先按离镜头的远近排序，远的先画、近的后画盖上去。
 * 完全不透明的东西，背面还可以直接丢掉（背面剔除），省一半的活。
 * 光是在建网格时就烤进颜色里的，所以这里不需要再算光照。
 */

import {
  GROUND_LABEL,
  GROUND_STYLE,
  SHAPE_LABEL,
  colorName,
  mode,
  round,
} from './types.ts'
import type { Face, Model, Mesh, Vec3 } from './types.ts'
import { modelBounds } from './geometry.ts'

export type ViewName = 'iso' | 'front' | 'side' | 'top' | 'quad'

export const VIEW_NAMES: readonly ViewName[] = ['iso', 'front', 'side', 'top', 'quad']

export const VIEW_LABEL: Record<ViewName, string> = {
  iso: '等距视角',
  front: '正面',
  side: '侧面',
  top: '俯视',
  quad: '四视图',
}

interface Camera {
  az: number
  el: number
}

const BASE_CAMERA: Record<Exclude<ViewName, 'quad'>, Camera> = {
  iso: { az: 35, el: 30 },
  front: { az: 0, el: 8 },
  side: { az: 90, el: 8 },
  top: { az: 0, el: 88 },
}

const DEG = Math.PI / 180

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

interface Projector {
  right: Vec3
  up: Vec3
  dir: Vec3
  /** 世界坐标 → 相机平面的 (横, 纵, 远近)；远近越大越靠近镜头 */
  project: (p: Vec3) => [number, number, number]
}

function projector(cam: Camera): Projector {
  const az = cam.az * DEG
  const el = cam.el * DEG
  const right: Vec3 = [Math.cos(az), 0, -Math.sin(az)]
  const up: Vec3 = [-Math.sin(el) * Math.sin(az), Math.cos(el), -Math.sin(el) * Math.cos(az)]
  const dir: Vec3 = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)]
  return {
    right,
    up,
    dir,
    project: (p) => [dot(p, right), dot(p, up), dot(p, dir)],
  }
}

function fmt(n: number): string {
  const v = round(n, 1)
  return Object.is(v, -0) ? '0' : String(v)
}

export interface SvgOptions {
  view: ViewName
  /** 额外转动角度（0~360） */
  spin: number
  /** 缩放倍数 */
  zoom: number
  /** 是否画地面网格 */
  grid: boolean
  width?: number
  height?: number
}

export interface SvgStats {
  panels: number
  faces: number
  drawn: number
}

interface PanelBox {
  x: number
  y: number
  w: number
  h: number
}

interface PanelInput {
  id: string
  label: string
  camera: Camera
  box: PanelBox
}

function panelMarkup(
  model: Model,
  mesh: Mesh,
  input: PanelInput,
  opts: SvgOptions,
): { markup: string; drawn: number } {
  const style = GROUND_STYLE[model.ground]
  const cam = projector(input.camera)
  const { box } = input

  // 1) 定比例：按「积木本身的投影范围」来适配，地面则一直铺满整格面板。
  const bounds = modelBounds(model)
  const corners: Vec3[] = []
  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) corners.push([x, y, z])
    }
  }
  let loX = Infinity
  let hiX = -Infinity
  let loY = Infinity
  let hiY = -Infinity
  for (const c of corners) {
    const [sx, sy] = cam.project(c)
    loX = Math.min(loX, sx)
    hiX = Math.max(hiX, sx)
    loY = Math.min(loY, sy)
    hiY = Math.max(hiY, sy)
  }
  const spanX = Math.max(1e-3, hiX - loX)
  const spanY = Math.max(1e-3, hiY - loY)
  const margin = 34
  const base = Math.min((box.w - margin * 2) / spanX, (box.h - margin * 2) / spanY)
  const scale = Math.max(1, base * opts.zoom)
  const midX = (loX + hiX) / 2
  const midY = (loY + hiY) / 2
  const centerX = box.w / 2
  const centerY = box.h / 2
  const toScreen = (p: Vec3): [number, number] => {
    const [sx, sy] = cam.project(p)
    return [centerX + (sx - midX) * scale, centerY - (sy - midY) * scale]
  }

  const parts: string[] = []

  // 2) 背景 + 地面
  parts.push(`<rect x="0" y="0" width="${fmt(box.w)}" height="${fmt(box.h)}" rx="18" fill="url(#sky-${input.id})"/>`)
  if (model.ground !== 'none') {
    const [W, , D] = model.size
    const floor: Vec3[] = [[0, 0, 0], [W, 0, 0], [W, 0, D], [0, 0, D]]
    const floorPath = floor.map((p) => toScreen(p))
      .map(([x, y]) => `${fmt(x)},${fmt(y)}`)
      .join(' ')
    parts.push(
      `<clipPath id="panel-${input.id}"><rect x="0" y="0" width="${fmt(box.w)}" height="${fmt(box.h)}" rx="18"/></clipPath>`,
    )
    parts.push(`<g clip-path="url(#panel-${input.id})">`)
    parts.push(`<polygon points="${floorPath}" fill="${style.fill}"/>`)
    if (opts.grid) {
      const lines: string[] = []
      const step = W > 24 || D > 24 ? 2 : 1
      for (let x = 0; x <= W; x += step) {
        const a = toScreen([x, 0, 0])
        const b = toScreen([x, 0, D])
        lines.push(`M${fmt(a[0])},${fmt(a[1])}L${fmt(b[0])},${fmt(b[1])}`)
      }
      for (let z = 0; z <= D; z += step) {
        const a = toScreen([0, 0, z])
        const b = toScreen([W, 0, z])
        lines.push(`M${fmt(a[0])},${fmt(a[1])}L${fmt(b[0])},${fmt(b[1])}`)
      }
      parts.push(`<path d="${lines.join('')}" stroke="${style.line}" stroke-width="1.2" fill="none"/>`)
    }
    parts.push(`<polygon points="${floorPath}" fill="none" stroke="${style.line}" stroke-width="2"/>`)
    parts.push('</g>')
  }

  // 3) 积木：背面剔除 + 由远到近
  const visible: Array<{ face: Face; depth: number }> = []
  for (const face of mesh.faces) {
    if (dot(face.n, cam.dir) <= 0.0001) continue
    let depth = 0
    for (const v of face.v) depth += cam.project(v)[2]
    visible.push({ face, depth: depth / Math.max(1, face.v.length) })
  }
  visible.sort((a, b) => a.depth - b.depth)
  for (const item of visible) {
    const points = item.face.v.map((v) => toScreen(v)).map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(' ')
    const color = `rgb(${Math.round(item.face.rgb[0])},${Math.round(item.face.rgb[1])},${Math.round(item.face.rgb[2])})`
    parts.push(
      `<polygon points="${points}" fill="${color}" stroke="${color}" stroke-width="1" stroke-linejoin="round"/>`,
    )
  }

  // 4) 面板标题（四视图时才有）
  if (input.label !== '') {
    parts.push(
      `<text x="16" y="26" font-size="15" font-weight="600" fill="#41536a">${input.label}</text>`,
    )
  }

  return {
    markup: `<g transform="translate(${fmt(box.x)},${fmt(box.y)})">${parts.join('')}</g>`,
    drawn: visible.length,
  }
}

/** 一句话信息条：名字 / 工坊大小 / 件数 / 主色 / 地面。 */
export function modelSummary(model: Model): string {
  const count = model.pieces.length
  const colors = model.pieces.map((p) => colorName(p.color))
  const shapes = model.pieces.map((p) => SHAPE_LABEL[p.shape])
  const topColor = mode(colors)
  const topShape = mode(shapes)
  const bits = [
    `${model.size[0]}×${model.size[1]}×${model.size[2]} 格工坊`,
    `${count} 件积木`,
    `地面：${GROUND_LABEL[model.ground]}`,
  ]
  if (topColor !== undefined) bits.splice(2, 0, `主色：${topColor}`)
  if (topShape !== undefined) bits.splice(3, 0, `最多的形状：${topShape}`)
  return bits.join(' · ')
}

/** 渲染成一张 SVG 图。 */
export function renderSvg(model: Model, mesh: Mesh, opts: SvgOptions): { svg: string; stats: SvgStats } {
  const titleH = 72
  const width = opts.width ?? 960
  const isQuad = opts.view === 'quad'
  const height = opts.height ?? (isQuad ? 880 : 700)
  const inner: PanelBox = { x: 16, y: titleH, w: width - 32, h: height - titleH - 16 }

  const panels: PanelInput[] = []
  if (isQuad) {
    const gap = 14
    const halfW = (inner.w - gap) / 2
    const halfH = (inner.h - gap) / 2
    const names: Array<Exclude<ViewName, 'quad'>> = ['iso', 'front', 'side', 'top']
    names.forEach((name, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const baseCam = BASE_CAMERA[name]
      panels.push({
        id: `${name}`,
        label: VIEW_LABEL[name],
        // 四视图里只有「等距视角」跟着 spin 转，另外三个保持正/侧/俯的标准角度，标签才不骗人
        camera: { az: baseCam.az + (name === 'iso' ? opts.spin : 0), el: baseCam.el },
        box: { x: inner.x + col * (halfW + gap), y: inner.y + row * (halfH + gap), w: halfW, h: halfH },
      })
    })
  } else {
    const name = opts.view === 'quad' ? 'iso' : opts.view
    const baseCam = BASE_CAMERA[name]
    panels.push({
      id: name,
      label: '',
      camera: { az: baseCam.az + opts.spin, el: baseCam.el },
      box: inner,
    })
  }

  const defs: string[] = []
  for (const panel of panels) {
    defs.push(
      `<linearGradient id="sky-${panel.id}" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0%" stop-color="${GROUND_STYLE[model.ground].skyTop}"/>` +
        `<stop offset="100%" stop-color="${GROUND_STYLE[model.ground].skyBottom}"/>` +
        `</linearGradient>`,
    )
  }

  let drawn = 0
  const body: string[] = []
  for (const panel of panels) {
    const result = panelMarkup(model, mesh, panel, opts)
    body.push(result.markup)
    drawn += result.drawn
  }

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fmt(width)} ${fmt(height)}" width="${fmt(width)}" height="${fmt(height)}"`,
    ` font-family="-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif">`,
    `<defs>${defs.join('')}</defs>`,
    `<rect x="0" y="0" width="${fmt(width)}" height="${fmt(height)}" fill="#fbfdff"/>`,
    `<text x="${fmt(width / 2)}" y="32" text-anchor="middle" font-size="24" font-weight="700" fill="#26364a">${escapeXml(model.name)}</text>`,
    `<text x="${fmt(width / 2)}" y="56" text-anchor="middle" font-size="15" fill="#61758c">${escapeXml(modelSummary(model))}</text>`,
    body.join(''),
    `</svg>`,
  ].join('')

  return { svg, stats: { panels: panels.length, faces: mesh.faces.length, drawn } }
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
