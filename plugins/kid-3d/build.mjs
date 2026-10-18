// 重新打包 host 半部：src/*.ts → index.js（自包含单文件，仅 node 内置模块为外部依赖）。
//
// 为什么 host 要打包（而不是像系列其它包那样手写成单文件）：
//   kid-3d 的宿主代码带一个几何/渲染引擎（体素表面提取、正交投影 SVG、CSS-3D 网页、
//   STL/OBJ 导出）以及 dsh 工具定义，共 12 个 TS 模块；手写成单文件不现实。打包后
//   `index.js` 不依赖任何外部包（`@deepseek-ai/*` 全被内联），于是 link: 安装时不需要
//   解析任何 profile 外的依赖——这正是系列「静态 bundle」的硬要求。
//
// 打包后处理（postPatch）：内联进来的 `@deepseek-ai/dsh-llm` 里有一行
//   `createRequire(import.meta.url)("../package.json")`（读它自己的版本号）。打包后
//   这个相对路径会指向本包之外，运行即 MODULE_NOT_FOUND，所以把它替换成常量。
//
// 用法：node build.mjs
//   可覆盖：ESBUILD=<esbuild 可执行文件>  NODE_PATH=<额外的 node_modules 目录>
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const HERE = import.meta.dirname
const ESBUILD = process.env.ESBUILD
  || '/Users/baixiao/Code/deepseek-harness-dev/deepseek-harness/node_modules/.bin/esbuild'
const NODE_PATH = process.env.NODE_PATH
  || '/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-3d/node_modules'

const OUT = join(HERE, 'index.js')

execFileSync(ESBUILD, [
  'src/_bundle_entry.ts',
  '--bundle', '--format=esm', '--platform=node', '--target=node20',
  '--external:node:*',
  '--outfile=index.js', '--log-level=warning',
], { stdio: 'inherit', cwd: HERE, env: { ...process.env, NODE_PATH } })

const broken = /createRequire\(import\.meta\.url\)\("\.\.\/package\.json"\)/
let code = readFileSync(OUT, 'utf8')
if (!broken.test(code)) {
  console.error('build.mjs: 预期的 dsh-llm package.json 相对引用没找到，内联结构可能已变，请检查。')
  process.exit(1)
}
code = code.replace(broken, '({ version: "0.0.0" })')
writeFileSync(OUT, code)
console.log('built index.js（含 postPatch）')
