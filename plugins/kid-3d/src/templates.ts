/**
 * 10 个现成的作品配方。
 *
 * 每个配方都在「16 格工坊」的坐标里写好，用的时候会先量一下包围盒，
 * 自动挪到工坊正中间、贴在地板上；如果工坊太小就返回一句
 * 「换间大工坊」的提示，而不是硬塞进去。
 */

import { makePiece } from './model.ts'
import type { Axis, Ground, Model, Piece, Shape, Vec3 } from './types.ts'

export interface TemplateSpec {
  shape: Shape
  at: Vec3
  size: Vec3
  color: string
  axis?: Axis
}

export interface Template {
  key: string
  name: string
  ground: Ground
  /** 一句话介绍，讲清楚用了哪些形状 */
  hint: string
  specs: TemplateSpec[]
}

function box(at: Vec3, size: Vec3, color: string): TemplateSpec {
  return { shape: 'box', at, size, color }
}
function ball(at: Vec3, size: Vec3, color: string): TemplateSpec {
  return { shape: 'sphere', at, size, color }
}
function cyl(at: Vec3, size: Vec3, color: string, axis: Axis = 'y'): TemplateSpec {
  return { shape: 'cylinder', at, size, color, axis }
}
function cone(at: Vec3, size: Vec3, color: string, axis: Axis = 'y'): TemplateSpec {
  return { shape: 'cone', at, size, color, axis }
}
function pyramid(at: Vec3, size: Vec3, color: string): TemplateSpec {
  return { shape: 'pyramid', at, size, color }
}

export const TEMPLATES: readonly Template[] = [
  {
    key: 'house',
    name: '小房子',
    ground: 'grass',
    hint: '墙用方块、屋顶用尖顶，还有门、两扇窗和一根烟囱',
    specs: [
      box([2, 0, 2], [10, 7, 10], '米'),
      pyramid([1, 7, 1], [12, 4, 12], '红'),
      box([6, 0, 12], [3, 4, 1], '棕'),
      box([3, 4, 12], [2, 2, 1], '天蓝'),
      box([10, 4, 12], [2, 2, 1], '天蓝'),
      box([9, 8, 3], [2, 4, 2], '灰'),
      box([5, 0, 13], [5, 1, 1], '灰'),
    ],
  },
  {
    key: 'castle',
    name: '小城堡',
    ground: 'grass',
    hint: '中间一座大楼，四角四座塔，塔顶是红色的圆锥，还有一扇大门',
    specs: [
      box([5, 0, 5], [6, 8, 6], '米'),
      box([2, 0, 2], [4, 9, 4], '灰'),
      box([10, 0, 2], [4, 9, 4], '灰'),
      box([2, 0, 10], [4, 9, 4], '灰'),
      box([10, 0, 10], [4, 9, 4], '灰'),
      cone([2, 9, 2], [4, 4, 4], '红'),
      cone([10, 9, 2], [4, 4, 4], '红'),
      cone([2, 9, 10], [4, 4, 4], '红'),
      cone([10, 9, 10], [4, 4, 4], '红'),
      box([7, 0, 11], [2, 5, 1], '棕'),
    ],
  },
  {
    key: 'rocket',
    name: '小火箭',
    ground: 'none',
    hint: '白圆柱当箭身、红圆锥当箭头、蓝小球当窗户，尾巴上四片尾翼',
    specs: [
      cyl([6, 0, 6], [4, 10, 4], '白'),
      cone([6, 10, 6], [4, 4, 4], '红'),
      ball([7, 5, 9], [2, 2, 2], '天蓝'),
      box([4, 0, 7], [2, 3, 2], '红'),
      box([10, 0, 7], [2, 3, 2], '红'),
      box([7, 0, 4], [2, 3, 2], '红'),
      box([7, 0, 10], [2, 3, 2], '红'),
    ],
  },
  {
    key: 'tree',
    name: '大树',
    ground: 'grass',
    hint: '棕色圆柱当树干，三个绿球堆成树冠',
    specs: [
      cyl([7, 0, 7], [2, 6, 2], '棕'),
      ball([4, 6, 4], [8, 7, 8], '绿'),
      ball([2, 8, 6], [6, 6, 6], '绿'),
      ball([9, 7, 7], [5, 5, 5], '绿'),
    ],
  },
  {
    key: 'snowman',
    name: '雪人',
    ground: 'snow',
    hint: '三个白球摞起来，黑眼睛、胡萝卜鼻子、黑帽子、红围巾',
    specs: [
      ball([5, 0, 5], [7, 5, 7], '白'),
      ball([6, 4, 6], [6, 5, 6], '白'),
      ball([7, 9, 7], [5, 4, 5], '白'),
      ball([7.4, 10.8, 10.2], [1.2, 1.2, 1.2], '黑'),
      ball([9.4, 10.8, 10.2], [1.2, 1.2, 1.2], '黑'),
      cone([8.5, 10.4, 11], [1.2, 1.2, 2.4], '橙', 'z'),
      box([6, 13, 6], [7, 1, 7], '黑'),
      box([8, 14, 8], [3, 2, 3], '黑'),
      box([6, 9, 6], [6, 1, 6], '红'),
      ball([8.4, 6, 11], [1.2, 1.2, 1.2], '黑'),
      ball([8.4, 7.6, 10.8], [1.2, 1.2, 1.2], '黑'),
    ],
  },
  {
    key: 'car',
    name: '小汽车',
    ground: 'grass',
    hint: '红色车身、蓝色驾驶室，四个黑轮子是「躺着的圆柱」',
    specs: [
      box([2, 1, 4], [12, 3, 7], '红'),
      box([4, 4, 5], [6, 3, 5], '天蓝'),
      box([4, 7, 5], [6, 1, 5], '红'),
      cyl([1, 0, 2], [2, 4, 4], '黑', 'x'),
      cyl([13, 0, 2], [2, 4, 4], '黑', 'x'),
      cyl([1, 0, 7], [2, 4, 4], '黑', 'x'),
      cyl([13, 0, 7], [2, 4, 4], '黑', 'x'),
      box([10, 4, 5], [1, 2, 5], '白'),
      box([13, 2, 4], [1, 1, 1], '黄'),
      box([13, 2, 10], [1, 1, 1], '黄'),
    ],
  },
  {
    key: 'boat',
    name: '小船',
    ground: 'water',
    hint: '棕色船身、圆锥做的尖船头、圆柱桅杆，还有白帆和红旗',
    specs: [
      box([2, 0, 4], [12, 4, 8], '棕'),
      cone([2, 0, 12], [12, 4, 4], '棕', 'z'),
      cyl([7, 4, 7], [1, 6, 1], '棕'),
      box([7, 5, 7], [1, 5, 5], '白'),
      box([7, 10, 8], [1, 1, 3], '红'),
    ],
  },
  {
    key: 'heart',
    name: '爱心',
    ground: 'grass',
    hint: '方块一层层搭出来的爱心，上面中间有个小缺口，底下收成尖的',
    specs: [
      box([3, 6, 6], [4, 1, 2], '红'),
      box([9, 6, 6], [4, 1, 2], '红'),
      box([3, 5, 6], [10, 1, 2], '红'),
      box([3, 4, 6], [10, 1, 2], '红'),
      box([4, 3, 6], [8, 1, 2], '粉'),
      box([5, 2, 6], [6, 1, 2], '粉'),
      box([6, 1, 6], [4, 1, 2], '粉'),
      box([7, 0, 6], [2, 1, 2], '粉'),
    ],
  },
  {
    key: 'cat',
    name: '小猫',
    ground: 'grass',
    hint: '橙色圆球做身体和头，两个圆锥耳朵、黑眼睛、粉鼻子，还有一条躺着的圆柱尾巴',
    specs: [
      ball([4, 0, 5], [8, 7, 8], '橙'),
      ball([5.5, 6, 5.5], [7, 7, 7], '橙'),
      cone([5.5, 12, 7], [2, 3, 2], '橙'),
      cone([10.5, 12, 7], [2, 3, 2], '橙'),
      ball([7, 9, 11.5], [1.2, 1.2, 1.2], '黑'),
      ball([9.8, 9, 11.5], [1.2, 1.2, 1.2], '黑'),
      ball([8.4, 8, 12], [1.2, 1.2, 1.2], '粉'),
      cyl([9, 1, 12.5], [1.5, 1.5, 3], '橙', 'z'),
    ],
  },
  {
    key: 'robot',
    name: '机器人',
    ground: 'grass',
    hint: '方块身体和脑袋、躺着的圆柱手臂、方块腿，头顶还有一根天线',
    specs: [
      box([5, 2, 6], [6, 6, 4], '灰'),
      box([6, 8, 6], [4, 4, 4], '银'),
      ball([6.5, 10, 10], [1.2, 1.2, 1.2], '天蓝'),
      ball([8.8, 10, 10], [1.2, 1.2, 1.2], '天蓝'),
      cyl([2, 5, 7], [3, 2, 2], '银', 'x'),
      cyl([11, 5, 7], [3, 2, 2], '银', 'x'),
      box([5, 0, 6], [2, 2, 4], '灰'),
      box([9, 0, 6], [2, 2, 4], '灰'),
      cyl([7.5, 12, 7.5], [1, 2, 1], '银'),
      ball([7.5, 14, 7.5], [1.5, 1.5, 1.5], '红'),
      box([6, 3, 10], [1, 1, 1], '红'),
      box([8, 3, 10], [1, 1, 1], '黄'),
    ],
  },
]

export function templateKeys(): string[] {
  return TEMPLATES.map((t) => t.key)
}

export function findTemplate(key: string): Template | undefined {
  const lower = key.trim().toLowerCase()
  return TEMPLATES.find((t) => t.key === lower || t.name === key.trim())
}

export function templateList(): string {
  return TEMPLATES.map((t) => `${t.key}（${t.name}）`).join('、')
}

export type TemplateResult =
  | { ok: true; pieces: Piece[]; template: Template }
  | { ok: false; message: string }

/** 把配方里的积木量一量、挪到工坊正中间，然后真正造出来。 */
export function buildTemplate(template: Template, model: Model, startId: number): TemplateResult {
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const spec of template.specs) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis] ?? 0, spec.at[axis] ?? 0)
      max[axis] = Math.max(max[axis] ?? 0, (spec.at[axis] ?? 0) + (spec.size[axis] ?? 0))
    }
  }
  const need: Vec3 = [(max[0] - min[0]), (max[1] - min[1]), (max[2] - min[2])]
  for (let axis = 0; axis < 3; axis += 1) {
    if ((need[axis] ?? 0) > (model.size[axis] ?? 0) + 1e-6) {
      const names = ['左右', '上下', '前后']
      return {
        ok: false,
        message:
          `【这间工坊放不下「${template.name}」】它需要 ${names[axis]} 方向 ${Math.ceil(need[axis] ?? 0)} 格，` +
          `现在工坊只有 ${model.size[axis]} 格。用 kid3d_new size ${Math.max(16, Math.ceil(need[axis] ?? 16))} 换间大工坊就行。`,
      }
    }
  }
  const shift: Vec3 = [
    Math.round((model.size[0] - need[0]) / 2 - min[0]),
    Math.round(-min[1]),
    Math.round((model.size[2] - need[2]) / 2 - min[2]),
  ]

  const pieces: Piece[] = []
  let id = startId
  for (const spec of template.specs) {
    const at: Vec3 = [(spec.at[0] + shift[0]), (spec.at[1] + shift[1]), (spec.at[2] + shift[2])]
    const input = {
      shape: spec.shape as unknown,
      at: at as unknown,
      size: spec.size as unknown,
      color: spec.color as unknown,
      axis: (spec.axis ?? 'y') as unknown,
    }
    const result = makePiece(input, model, id, 4)
    if (!result.ok) return { ok: false, message: result.message }
    pieces.push(result.piece)
    id += 1
  }
  return { ok: true, pieces, template }
}
