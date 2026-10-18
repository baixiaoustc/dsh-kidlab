/**
 * 会转圈的网页：一份文件，两种活法。
 *
 * 1）没有 JavaScript 时（Harness 里给小朋友看网页时脚本是被安全策略挡住的，
 *    script-src 'none'）：纯 CSS 3D 自己慢慢转，鼠标放上去停住。
 *    每个面都是一个 1×1 像素的小方块，用 matrix3d 把它「贴」进三维空间，
 *    再给整个模型套一个 rotateY 动画；浏览器会自己按真实前后关系遮挡。
 * 2）JavaScript 跑得起来时（用真浏览器打开这个文件）：接管成可拖动的视角，
 *    按住拖动转、松手有惯性、滚轮缩放、双击回正面，闲下来 6 秒又自己转起来。
 *
 * 两种活法共用同一套面数据，所以预览和真浏览器里看到的是同一个模型。
 */

import { GROUND_STYLE } from './types.ts'
import type { Model, Mesh, Vec3 } from './types.ts'
import { modelBounds } from './geometry.ts'
import { escapeXml, modelSummary } from './render-svg.ts'

export interface HtmlOptions {
  /** 转一圈要几秒 */
  spinSeconds: number
  /** 超过这个面数就用静态图代替（面太密浏览器会卡） */
  interactiveMaxFaces: number
  /** 面数太多时退回的静态 SVG */
  svgFallback: string
  /** 是否带上「按住拖动转视角」的交互脚本 */
  dragOrbit: boolean
}

export interface HtmlResult {
  html: string
  interactive: boolean
  faces: number
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2])
  if (len < 1e-9) return [0, 1, 0]
  return [v[0] / len, v[1] / len, v[2] / len]
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2)
}

/**
 * 拖动视角的脚本。刻意很小、很土：不用任何库、不联网、不写 cookie，
 * 只改 .tilt 上的三个 CSS 变量（--rx 抬头低头、--ry 左右转、--zs 远近）。
 */
const ORBIT_SCRIPT = [
  '(function(){',
  'var d=document,tilt=d.querySelector(".tilt"),pad=d.querySelector(".pad"),hint=d.querySelector(".hint");',
  'if(!tilt||!pad)return;',
  'd.documentElement.className+=" js";',
  'var rx=18,ry=0,zs=1,vx=0,vy=0,drag=false,px=0,py=0,idle=0,raf=0,last=0;',
  'var reduce=!!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);',
  'function cl(v,a,b){return v<a?a:(v>b?b:v)}',
  'function put(){tilt.style.setProperty("--rx",rx.toFixed(2)+"deg");',
  'tilt.style.setProperty("--ry",ry.toFixed(2)+"deg");tilt.style.setProperty("--zs",zs.toFixed(3))}',
  'function loop(t){',
  'var dt=last?Math.min(64,t-last):16;last=t;',
  'if(drag){raf=0;return}',
  'if(vx||vy){ry+=vx*dt;rx=cl(rx-vy*dt,-88,88);var k=Math.pow(0.88,dt/16);vx*=k;vy*=k;',
  'if(Math.abs(vx)<0.004&&Math.abs(vy)<0.004){vx=0;vy=0}put()}',
  'else if(!reduce&&t-idle>6000){ry+=0.014*dt;put()}',
  'raf=requestAnimationFrame(loop)}',
  'function start(){if(!raf)raf=requestAnimationFrame(loop)}',
  'pad.addEventListener("pointerdown",function(e){',
  'if(e.pointerType==="mouse"&&e.button!==0)return;',
  'drag=true;px=e.clientX;py=e.clientY;vx=0;vy=0;last=0;idle=performance.now();',
  'pad.className="pad pulling";try{pad.setPointerCapture(e.pointerId)}catch(_){}',
  'e.preventDefault();start()});',
  'pad.addEventListener("pointermove",function(e){',
  'if(!drag)return;var dx=e.clientX-px,dy=e.clientY-py;px=e.clientX;py=e.clientY;',
  'ry+=dx*0.45;rx=cl(rx-dy*0.35,-88,88);vx=dx*0.45/16*0.25;vy=dy*0.35/16*0.25;',
  'idle=performance.now();put();e.preventDefault()});',
  'function stop(){if(!drag)return;drag=false;pad.className="pad";idle=performance.now();last=0;start()}',
  'pad.addEventListener("pointerup",stop);pad.addEventListener("pointercancel",stop);',
  'window.addEventListener("blur",stop);',
  'pad.addEventListener("wheel",function(e){zs=cl(zs*(e.deltaY>0?0.9:1.11),0.5,2.6);',
  'idle=performance.now();put();e.preventDefault()},{passive:false});',
  'pad.addEventListener("dblclick",function(){rx=18;ry=0;zs=1;vx=0;vy=0;put()});',
  'if(hint)hint.textContent="按住拖动转视角 · 滚轮远近 · 双击回正面";',
  'put();start()})();',
].join('')

function staticPage(model: Model, svg: string, note: string): string {
  return [
    '<!doctype html><html lang="zh"><head><meta charset="utf-8">',
    `<title>${escapeXml(model.name)} · 3D 作品</title>`,
    '<style>',
    'html,body{margin:0;padding:0;background:linear-gradient(#eaf6ff,#ffffff);',
    "font:15px/1.7 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#33475c}",
    '.wrap{max-width:1000px;margin:0 auto;padding:18px}',
    'h1{font-size:20px;margin:8px 0 4px}',
    '.note{color:#7b8ea3;font-size:13px;margin-bottom:10px}',
    'svg{width:100%;height:auto;border-radius:16px;box-shadow:0 6px 22px rgba(40,70,100,.12)}',
    '</style></head><body><div class="wrap">',
    `<h1>${escapeXml(model.name)}</h1>`,
    `<div class="note">${escapeXml(note)}</div>`,
    svg,
    '</div></body></html>',
  ].join('')
}

/** 把网格渲染成会转圈的网页（面太多时自动退回静态图）。 */
export function renderHtml(model: Model, mesh: Mesh, opts: HtmlOptions): HtmlResult {
  const summary = modelSummary(model)
  if (mesh.faces.length > opts.interactiveMaxFaces) {
    return {
      html: staticPage(
        model,
        opts.svgFallback,
        `这件作品太精细了（${mesh.faces.length} 个面），转起来会卡，所以这里放一张静态立体图。`,
      ),
      interactive: false,
      faces: mesh.faces.length,
    }
  }

  const bounds = modelBounds(model)
  const span = Math.max(
    bounds.max[0] - bounds.min[0],
    bounds.max[1] - bounds.min[1],
    bounds.max[2] - bounds.min[2],
    1,
  )
  const scale = Math.max(3, Math.min(24, 380 / span))
  const cx = (bounds.min[0] + bounds.max[0]) / 2
  const cy = (bounds.min[1] + bounds.max[1]) / 2
  const cz = (bounds.min[2] + bounds.max[2]) / 2

  // 世界坐标 → CSS 坐标：CSS 的 y 朝下，所以要取负；再把模型挪到自己的中心，转起来才是绕自己转
  const toCss = (v: Vec3): Vec3 => [(v[0] - cx) * scale, -(v[1] - cy) * scale, (v[2] - cz) * scale]

  const faces: string[] = []
  for (const face of mesh.faces) {
    const a = face.v[0]
    const b = face.v[1]
    const d = face.v[face.v.length - 1]
    if (a === undefined || b === undefined || d === undefined) continue
    const p0 = toCss(a)
    const pb = toCss(b)
    const pd = toCss(d)
    const e1: Vec3 = [pb[0] - p0[0], pb[1] - p0[1], pb[2] - p0[2]]
    const e2: Vec3 = [pd[0] - p0[0], pd[1] - p0[1], pd[2] - p0[2]]
    const normal = normalize(cross(e1, e2))
    // 稍微放大一点点，盖住浏览器抗锯齿留下的细缝
    const grow = 0.75
    const len1 = Math.max(1e-6, Math.hypot(e1[0], e1[1], e1[2]))
    const len2 = Math.max(1e-6, Math.hypot(e2[0], e2[1], e2[2]))
    const g1: Vec3 = [e1[0] * (1 + grow / len1), e1[1] * (1 + grow / len1), e1[2] * (1 + grow / len1)]
    const g2: Vec3 = [e2[0] * (1 + grow / len2), e2[1] * (1 + grow / len2), e2[2] * (1 + grow / len2)]
    // matrix3d 是「按列」填的：第一列是局部 x 轴变成谁，第二列是局部 y 轴，第三列是法线，第四列是原点
    const matrix = [
      g1[0], g1[1], g1[2], 0,
      g2[0], g2[1], g2[2], 0,
      normal[0], normal[1], normal[2], 0,
      p0[0], p0[1], p0[2], 1,
    ].map(fmt).join(',')
    const color = `rgb(${Math.round(face.rgb[0])},${Math.round(face.rgb[1])},${Math.round(face.rgb[2])})`
    // 三角形裁成三角；四边形本来就是平行四边形（合并出来的长方形正好如此）
    const clip = face.v.length === 3 ? ';clip-path:polygon(0 0,1px 0,0 1px)' : ''
    faces.push(`<i style="background:${color}${clip};transform:matrix3d(${matrix})"></i>`)
  }

  const style = GROUND_STYLE[model.ground]
  let floor = ''
  if (model.ground !== 'none') {
    const v0: Vec3 = [(0 - cx) * scale, -(0 - cy) * scale + 0.6, (0 - cz) * scale]
    const m = [
      model.size[0] * scale, 0, 0, 0,
      0, 0, model.size[2] * scale, 0,
      0, -1, 0, 0,
      v0[0], v0[1], v0[2], 1,
    ].map(fmt).join(',')
    floor = `<i class="floor" style="background:${style.fill};transform:matrix3d(${m})"></i>`
  }

  const html = [
    '<!doctype html><html lang="zh"><head><meta charset="utf-8">',
    `<title>${escapeXml(model.name)} · 会转圈的 3D 作品</title>`,
    '<style>',
    'html,body{margin:0;height:100%;overflow:hidden}',
    'body{display:flex;align-items:center;justify-content:center;',
    `background:radial-gradient(120% 90% at 50% 0%,${style.skyTop} 0%,${style.skyBottom} 70%,#ffffff 100%);`,
    "font:14px/1.6 -apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif;color:#41536a}",
    '.stage{perspective:1500px;perspective-origin:50% 50%;width:0;height:0}',
    '.tilt{position:relative;transform-style:preserve-3d;will-change:transform;',
    'transform:rotateX(var(--rx,18deg)) rotateY(var(--ry,0deg))',
    'scale3d(var(--zs,1),var(--zs,1),var(--zs,1))}',
    '.spin{position:relative;width:0;height:0;transform-style:preserve-3d;',
    `animation:spin ${opts.spinSeconds}s linear infinite}`,
    '.spin:hover{animation-play-state:paused}',
    '.spin i,.floor{position:absolute;left:0;top:0;width:1px;height:1px;transform-origin:0 0;display:block}',
    '@keyframes spin{from{transform:rotateY(0deg)}to{transform:rotateY(360deg)}}',
    '.pad{display:none}',
    '.js .spin{animation:none}',
    '.js .pad{display:block;position:fixed;left:0;top:0;right:0;bottom:0;z-index:5;',
    'touch-action:none;cursor:grab}',
    '.js .pad.pulling{cursor:grabbing}',
    '.cap{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);text-align:center;',
    'pointer-events:none;z-index:6}',
    '.cap b{font-size:16px;color:#26364a}',
    '.cap span{display:block;color:#7b8ea3;font-size:12.5px}',
    '</style></head><body>',
    `<div class="stage"><div class="tilt">${floor}<div class="spin">${faces.join('')}</div></div></div>`,
    '<div class="pad"></div>',
    `<div class="cap"><b>${escapeXml(model.name)}</b><span>${escapeXml(summary)}</span>`,
    '<span class="hint">把鼠标放到模型上，它就停住不转了</span></div>',
    opts.dragOrbit ? `<script>${ORBIT_SCRIPT}</script>` : '',
    '</body></html>',
  ].join('')

  return { html, interactive: true, faces: mesh.faces.length }
}
