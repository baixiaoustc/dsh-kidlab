// kid-3d 安装后的自测：用假 exec 上下文把 8 个工具真跑一遍，检查写出来的每个文件。
//
// 运行：node plugin-kid-3d/verify/selftest.mjs
// 说明：全部在系统临时目录里跑（跑完就删），不会碰你自己的 <工作目录>/kid3d；
//      需要先 `npm run build`（读的是 lib/，不是 src/）。
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { buildKid3dTools } = await import(new URL('./tools.js', import.meta.url).href);

const fails = [];
let checks = 0;
const ok = (label, cond, extra = '') => {
  checks += 1;
  if (!cond) fails.push(label + (extra ? ` (${extra})` : ''));
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
};

const base = {
  enabled: true,
  timeoutMs: 8000,
  workDir: 'kid3d',
  defaultSize: 16,
  maxPieces: 300,
  unitMm: 5,
  interactiveMaxFaces: 1200,
  dragOrbit: true,
};
const work = mkdtempSync(join(tmpdir(), 'kid3d-smoke-'));
const empty = mkdtempSync(join(tmpdir(), 'kid3d-empty-'));
const solo = mkdtempSync(join(tmpdir(), 'kid3d-solo-'));
const exec = { signal: new AbortController().signal };
const tools = (cfg) => buildKid3dTools(cfg);
const at = (mirror, name) => mirror.find((t) => t.name === name);

let dir = join(work, 'kid3d');
const model = () => JSON.parse(readFileSync(join(dir, 'model.json'), 'utf8'));
const cur = () => model().name;
const read = (file) => {
  try {
    return readFileSync(join(dir, file), 'utf8');
  } catch {
    return '';
  }
};
const readBytes = (file) => {
  try {
    return readFileSync(join(dir, file));
  } catch {
    return Buffer.alloc(0);
  }
};
const curSvg = () => read(`${cur()}.svg`);
const count = (text, re) => (text.match(re) ?? []).length;
const cwd = (where) => {
  process.chdir(where);
  dir = join(where, 'kid3d');
};
const run = async (mirror, name, args, cfg = base) => {
  try {
    const tool = cfg === base ? at(mirror, name) : at(tools(cfg), name);
    return { text: await tool.execute(args, exec) };
  } catch (error) {
    return { error: String(error?.message ?? error) };
  }
};

console.log('--- 工具表结构 ---');
for (const t of tools(base)) {
  ok(
    `${t.name} schema 完整`,
    t.parameters?.type === 'object' &&
      t.output?.schema?.type === 'string' &&
      typeof t.description === 'string',
  );
}

console.log('--- 建工坊 / 放积木 / 画图 ---');
cwd(work);
let m = tools(base);
let r = await run(m, 'kid3d_new', { name: '测试小屋', size: 16, ground: 'grass' });
ok('new 建立模型', typeof r.text === 'string' && model().name === '测试小屋', r.error ?? '');

r = await run(m, 'kid3d_build', { shape: 'box', at: [0, 0, 0], size: [4, 4, 4], color: '#e94f37' });
ok('build 方块', model().pieces.length === 1, r.error ?? '');
ok('build 回话带件数小结', /现在一共 1 件积木/.test(r.text ?? ''), (r.text ?? '').slice(0, 30));
r = await run(m, 'kid3d_build', { shape: 'sphere', at: [8, 0, 0], size: [6, 6, 6], color: '#3d7dd6' });
ok('build 球', model().pieces.length === 2, r.error ?? '');
ok('积木种类记录正确', model().pieces.map((p) => p.shape).join(',') === 'box,sphere');

r = await run(m, 'kid3d_view', { view: 'iso', spin: 0, zoom: 1, grid: true });
ok('view 写出主 SVG', existsSync(join(dir, `${cur()}.svg`)), readdirSync(dir).sort().join(','));
const svg = curSvg();
ok('SVG 有面片', count(svg, /<polygon/g) > 50, `polygons=${count(svg, /<polygon/g)}`);
ok('SVG 无 NaN/undefined', !/NaN|undefined/.test(svg));
ok('SVG 是纯静态（无 script/onload）', !/<script|onload/i.test(svg));
ok('SVG 带 viewBox', /viewBox="/.test(svg));

for (const v of ['quad', 'front', 'side', 'top']) {
  r = await run(m, 'kid3d_view', { view: v });
  ok(`view ${v} 写出文件`, existsSync(join(dir, `${cur()}-${v}.svg`)), r.error ?? '');
}

console.log('--- 导出 STL / OBJ / HTML ---');
r = await run(m, 'kid3d_export', { format: 'stl' });
const stl = readBytes(`${cur()}.stl`);
const tri = stl.length >= 84 ? stl.readUInt32LE(80) : 0;
ok('STL 长度 = 84 + 50*三角数', stl.length === 84 + 50 * tri, `len=${stl.length} tri=${tri}`);
ok('STL 头部署名 kid-3d', stl.subarray(0, 80).toString('latin1').includes('kid-3d'));
ok('STL 三角数 > 0', tri > 0, `tri=${tri}`);

r = await run(m, 'kid3d_export', { format: 'obj' });
const obj = read(`${cur()}.obj`);
const verts = count(obj, /^v /gm);
const faces = [...obj.matchAll(/^f (\d+) (\d+) (\d+)$/gm)];
const maxIdx = Math.max(...faces.flatMap((f) => [Number(f[1]), Number(f[2]), Number(f[3])]));
ok('OBJ 顶点行 > 0', verts > 0, `v=${verts}`);
ok('OBJ 三角面数 == STL 三角数', faces.length === tri, `f=${faces.length} tri=${tri}`);
ok('OBJ 面索引不越界', Number.isFinite(maxIdx) && maxIdx <= verts, `max=${maxIdx} v=${verts}`);
ok('OBJ 带分组与材质', /^g /m.test(obj) && /^usemtl /m.test(obj));

r = await run(m, 'kid3d_export', { format: 'html' });
const html = read(`${cur()}.html`);
const faces3d = count(html, /matrix3d/g);
ok('HTML 每个面片一个 matrix3d', faces3d > 50, `matrix3d=${faces3d}`);
ok(
  'HTML 有自转动画兜底（预览沙箱剥掉脚本后照样转）',
  /@keyframes\s+spin/.test(html) && /preserve-3d/.test(html) && /animation-play-state:paused/.test(html),
);
ok(
  'HTML 视角由 CSS 变量驱动',
  /--rx,18deg/.test(html) && /--ry,0deg/.test(html) && /--zs,1\)/.test(html),
);
ok('HTML 带整屏拖动层', /<div class="pad"><\/div>/.test(html) && /\.js \.pad\{display:block/.test(html));
ok(
  'HTML 内置拖动脚本（拖动·惯性·滚轮·双击复位）',
  /<script>\(function\(\)/.test(html) &&
    /pointerdown/.test(html) &&
    /requestAnimationFrame/.test(html) &&
    /Math\.pow\(0\.88/.test(html) &&
    /wheel/.test(html) &&
    /dblclick/.test(html),
);
ok(
  'HTML 脚本是内联的（不引库、不联网）',
  !/<(img|link|iframe)\b/i.test(html) && !/(src|href)\s*=\s*["']https?:/i.test(html),
);
ok(
  'HTML 拖动脚本不碰危险 API',
  !/eval\(|new Function|fetch\(|XMLHttpRequest|localStorage|document\.cookie/.test(html),
);

console.log('--- 模板 / 涂色 / 擦除 ---');
r = await run(m, 'kid3d_template', { template: 'rocket', name: '火箭' });
ok('template rocket 成功', typeof r.text === 'string' && model().name === '火箭', r.error ?? '');
const rocketPieces = model().pieces.length;
ok('rocket 有多个积木块', rocketPieces >= 5, `pieces=${rocketPieces}`);
ok('换作品时旧作品进存档', existsSync(join(dir, '存档')) && readdirSync(join(dir, '存档')).length >= 1);
r = await run(m, 'kid3d_view', { view: 'iso', spin: 16, zoom: 1, grid: false });
ok('template 后 view 正常', existsSync(join(dir, '火箭.svg')), r.error ?? '');
r = await run(m, 'kid3d_export', { format: 'all' });
ok(
  'export all 产出四件套',
  ['火箭.svg', '火箭.html', '火箭.stl', '火箭.obj'].every((f) => existsSync(join(dir, f))),
  r.error ?? '',
);

const svgBeforePaint = curSvg();
r = await run(m, 'kid3d_paint', { at: [8, 0, 0], size: [7, 7, 7], color: '#f6c445' });
ok('paint 报出刷了几件', typeof r.text === 'string' && /刷好|刷成/.test(r.text), r.error ?? r.text?.slice(0, 40));
ok('paint 写进作品数据', model().pieces.some((p) => String(p.color).toLowerCase() === '#f6c445'));
await run(m, 'kid3d_view', { view: 'iso' });
ok('paint 后画面变了', curSvg() !== svgBeforePaint && curSvg().length > 0);
r = await run(m, 'kid3d_view', { view: 'iso', spin: 45 });
ok('非主视角单独存文件', existsSync(join(dir, `${cur()}-iso.svg`)), r.error ?? '');

const beforeErase = model().pieces.length;
r = await run(m, 'kid3d_erase', { at: [8, 0, 0], size: [7, 7, 7] });
ok('erase 减少积木', model().pieces.length < beforeErase, `${beforeErase} -> ${model().pieces.length}`);

console.log('--- 颜色名 ---');
m = tools(base);
r = await run(m, 'kid3d_build', { shape: 'box', at: [0, 12, 0], size: [2, 2, 2], color: '橙' });
const orange = model().pieces.at(-1)?.color;
r = await run(m, 'kid3d_build', { shape: 'box', at: [4, 12, 0], size: [2, 2, 2], color: '橙' });
const orangeAgain = model().pieces.at(-1)?.color;
r = await run(m, 'kid3d_build', { shape: 'box', at: [8, 12, 0], size: [2, 2, 2], color: '米' });
const beige = model().pieces.at(-1)?.color;
ok('中文颜色名存成色号', /^#[0-9a-f]{6}$/i.test(String(orange)), String(orange));
ok('同名颜色每次都是同一个色号', orange === orangeAgain, `${orange} / ${orangeAgain}`);
ok('不同名字是不同色号', orange !== beige, `${orange} vs ${beige}`);
r = await run(m, 'kid3d_build', { shape: 'box', at: [12, 12, 0], size: [2, 2, 2], color: '彩虹色' });
ok(
  '不认识的颜色给儿童向提示',
  typeof r.text === 'string' && r.text.startsWith('【不认识'),
  r.error ?? r.text?.slice(0, 30),
);

console.log('--- 打开存档 ---');
const archiveFiles = () => readdirSync(join(dir, '存档')).filter((f) => f.endsWith('.json'));
r = await run(m, 'kid3d_open', {});
ok(
  '不给名字 = 只列清单',
  typeof r.text === 'string' && /【存档里有 \d+ 件作品】/.test(r.text) && r.text.includes('测试小屋'),
  r.error ?? String(r.text).split('\n')[0],
);
ok(
  '清单里标了文件名、件数和时间',
  typeof r.text === 'string' && /· .+\.json ｜ \d+ 件积木 ｜ /.test(r.text),
  String(r.text).split('\n')[1] ?? '',
);
const beforeOpen = cur();
r = await run(m, 'kid3d_open', { name: '测试小屋' });
ok(
  '按名字打开存档作品',
  typeof r.text === 'string' && r.text.startsWith('【打开啦】') && cur() === '测试小屋',
  r.error ?? `cur=${cur()}`,
);
ok('打开后画了新的立体图', existsSync(join(dir, '测试小屋.svg')), '');
ok(
  '打开时正玩着的那件也进存档（不丢）',
  archiveFiles().some((f) => f.includes(beforeOpen)),
  archiveFiles().join('、'),
);
ok('打开回来的作品还带着积木', model().pieces.length >= 2, `pieces=${model().pieces.length}`);
const exact = archiveFiles().find((f) => f.includes('测试小屋'));
r = await run(m, 'kid3d_open', { name: exact });
ok('按整行存档文件名精确打开', typeof r.text === 'string' && r.text.startsWith('【打开啦】'), r.error ?? String(r.text).slice(0, 30));
r = await run(m, 'kid3d_open', { name: '不存在的作品' });
ok('找不到时给儿童向提示', typeof r.text === 'string' && r.text.startsWith('【存档里没找到'), r.error ?? String(r.text).split('\n')[0]);
r = await run(m, 'kid3d_open', { name: '../../../etc/passwd' });
ok(
  '带路径的名字打不开（只认存档目录里的名字）',
  typeof r.text === 'string' && r.text.startsWith('【存档里没找到'),
  r.error ?? String(r.text).split('\n')[0],
);

console.log('--- 错误路径 ---');
r = await run(m, 'kid3d_build', { shape: 'box', at: [0, 0, 0], size: [40, 40, 40] });
ok('超尺寸积木给出儿童向提示', typeof r.text === 'string' && r.text.startsWith('【'), r.error ?? r.text?.slice(0, 30));
r = await run(m, 'kid3d_template', { template: 'dragon' });
ok(
  '未知模板把可选值退回给模型',
  /invalid arguments/.test(r.error ?? '') && /house/.test(r.error ?? ''),
  (r.error ?? '').slice(0, 60),
);
r = await run(m, 'kid3d_build', { shape: 'box', at: [0, 0], size: [4, 4, 4] });
ok('坐标写不满三个数时给儿童向提示', typeof r.text === 'string' && r.text.startsWith('【'), r.error ?? r.text?.slice(0, 30));

cwd(empty);
m = tools(base);
r = await run(m, 'kid3d_view', {});
ok('没有模型时 view 给出提示', typeof r.text === 'string' && r.text.startsWith('【'), r.error ?? r.text?.slice(0, 30));
r = await run(m, 'kid3d_export', { format: 'stl' });
ok('没有模型时 export 给出提示', typeof r.text === 'string' && r.text.startsWith('【'), r.error ?? r.text?.slice(0, 30));
r = await run(m, 'kid3d_erase', { at: [0, 0, 0] });
ok('没有模型时 erase 给出提示', typeof r.text === 'string' && r.text.startsWith('【'), r.error ?? r.text?.slice(0, 30));

console.log('--- 单块精确检查 / 静态兜底 ---');
cwd(solo);
m = tools(base);
await run(m, 'kid3d_new', { name: '小方块', size: 16, ground: 'none' });
await run(m, 'kid3d_build', { shape: 'box', at: [0, 0, 0], size: [4, 4, 4], color: '#4caf50' });
await run(m, 'kid3d_view', { view: 'iso', spin: 0, zoom: 1, grid: true });
await run(m, 'kid3d_export', { format: 'all' });
const soloStl = readBytes('小方块.stl');
ok('单块 STL 三角数 = 12', soloStl.readUInt32LE(80) === 12, `tri=${soloStl.readUInt32LE(80)}`);
ok(
  '单块 SVG 只画看得见的 3 个面',
  count(read('小方块.svg'), /<polygon/g) === 3,
  `polygons=${count(read('小方块.svg'), /<polygon/g)}`,
);
ok('单块 HTML 保留全部 6 个面', count(read('小方块.html'), /matrix3d/g) === 6, `matrix3d=${count(read('小方块.html'), /matrix3d/g)}`);

r = await run(m, 'kid3d_export', { format: 'html' }, { ...base, interactiveMaxFaces: 1 });
const staticHtml = read('小方块.html');
ok(
  '面数超限时 HTML 退化为静态 SVG',
  /<svg/i.test(staticHtml) && !/matrix3d/.test(staticHtml),
  r.error ?? '',
);

r = await run(m, 'kid3d_export', { format: 'html' }, { ...base, dragOrbit: false });
const noDrag = read('小方块.html');
ok(
  'dragOrbit 关掉后回到纯 CSS 网页',
  /matrix3d/.test(noDrag) && /@keyframes\s+spin/.test(noDrag) && !/<script/i.test(noDrag),
  r.error ?? '',
);

for (const p of [work, empty, solo]) rmSync(p, { recursive: true, force: true });
process.chdir('/');

console.log(
  `\n${checks - fails.length}/${checks} 通过 · ${fails.length === 0 ? 'ALL PASS' : `FAILED ${fails.length}: ` + fails.join(' | ')}`,
);
process.exitCode = fails.length === 0 ? 0 : 1;
