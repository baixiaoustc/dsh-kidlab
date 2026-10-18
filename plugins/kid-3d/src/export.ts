/**
 * 导出成真正的 3D 打印文件。
 *
 * STL：二进制格式，打印软件都认。里面的三角形必须「从外面看是逆时针」，
 *      而且打印机把 z 轴当高度，所以我们把 y（向上）换到 z 上。
 *      换轴会让左右手系反掉，所以每个三角形的顶点顺序要跟着翻一下。
 * OBJ：纯文本，按颜色分组，方便在别的 3D 软件里继续加工；朝向保持和作品一致。
 */

import { round } from './types.ts'
import type { Mesh, Model, Vec3 } from './types.ts'

/** 每个面拆成三角形（扇形拆法）。 */
function triangles(mesh: Mesh): Vec3[][] {
  const out: Vec3[][] = []
  for (const face of mesh.faces) {
    const first = face.v[0]
    if (first === undefined) continue
    for (let i = 1; i + 1 < face.v.length; i += 1) {
      const b = face.v[i]
      const c = face.v[i + 1]
      if (b === undefined || c === undefined) continue
      out.push([first, b, c])
    }
  }
  return out
}

/** 世界坐标（y 朝上）→ 打印坐标（z 朝上）。 */
function toPrint(v: Vec3, unitMm: number): Vec3 {
  return [(v[0] * unitMm), (v[2] * unitMm), (v[1] * unitMm)]
}

function normalOf(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const len = Math.hypot(n[0], n[1], n[2])
  if (len < 1e-9) return [0, 0, 0]
  return [n[0] / len, n[1] / len, n[2] / len]
}

/** 二进制 STL。 */
export function buildStl(mesh: Mesh, unitMm: number): Buffer {
  const tris = triangles(mesh)
  const buffer = Buffer.alloc(84 + tris.length * 50)
  // 80 字节的文件头是给人看的注释，必须是纯 ASCII
  buffer.write(`kid-3d by DeepSeek Harness  1 grid = ${round(unitMm, 4)} mm`, 0, 'ascii')
  buffer.writeUInt32LE(tris.length, 80)
  let at = 84
  for (const tri of tris) {
    const a = tri[0]
    const b = tri[1]
    const c = tri[2]
    if (a === undefined || b === undefined || c === undefined) continue
    // 顶点顺序翻转：换轴是镜像，翻回来法线才是朝外的
    const p0 = toPrint(a, unitMm)
    const p1 = toPrint(c, unitMm)
    const p2 = toPrint(b, unitMm)
    const n = normalOf(p0, p1, p2)
    for (const value of [n[0], n[1], n[2], p0[0], p0[1], p0[2], p1[0], p1[1], p1[2], p2[0], p2[1], p2[2]]) {
      buffer.writeFloatLE(value, at)
      at += 4
    }
    buffer.writeUInt16LE(0, at)
    at += 2
  }
  return buffer
}

/** 文本 OBJ，按颜色分组、顶点去重。 */
export function buildObj(model: Model, mesh: Mesh, unitMm: number): string {
  const lines: string[] = []
  lines.push(`# ${model.name} — 由 DeepSeek Harness 的 kid-3d 积木工坊导出`)
  lines.push(`# 单位：1 格 = ${unitMm} 毫米；朝向：和作品里一样，y 轴朝上`)
  const vertexIndex = new Map<string, number>()
  const vertices: Vec3[] = []
  const groups = new Map<string, string[]>()
  const vIndex = (v: Vec3): number => {
    const x = round(v[0] * unitMm, 4)
    const y = round(v[1] * unitMm, 4)
    const z = round(v[2] * unitMm, 4)
    const key = `${x},${y},${z}`
    const found = vertexIndex.get(key)
    if (found !== undefined) return found
    vertices.push([x, y, z])
    const index = vertices.length
    vertexIndex.set(key, index)
    return index
  }

  for (const face of mesh.faces) {
    const hex = `#${[face.rgb[0], face.rgb[1], face.rgb[2]]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')}`
    let list = groups.get(hex)
    if (list === undefined) {
      list = []
      groups.set(hex, list)
    }
    const ids = face.v.map((v) => vIndex(v))
    if (ids.length < 3) continue
    const first = ids[0]
    if (first === undefined) continue
    for (let i = 1; i + 1 < ids.length; i += 1) {
      const b = ids[i]
      const c = ids[i + 1]
      if (b === undefined || c === undefined) continue
      list.push(`f ${first} ${b} ${c}`)
    }
  }

  for (const v of vertices) lines.push(`v ${round(v[0], 4)} ${round(v[1], 4)} ${round(v[2], 4)}`)
  for (const [hex, faces] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`g 颜色_${hex.slice(1)}`)
    lines.push(`usemtl 颜色_${hex.slice(1)}`)
    for (const face of faces) lines.push(face)
  }
  return `${lines.join('\n')}\n`
}
