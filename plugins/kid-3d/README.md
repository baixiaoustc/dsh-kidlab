# dsh-kid-3d · 给小朋友的「小小 3D 积木工坊」

为 **DeepSeek Harness**（`@deepseek-ai/dsh-*`，Cordis 插件框架）写的工具插件：
把「摆积木、转着看、打包带走」变成一场小朋友能自己指挥的 3D 建模体验——
**不用学任何 3D 软件**，说一句话就多一块积木，摆完还能导出 STL 去 3D 打印。

> 背景：kid 系列插件之一（同系列还有 kid-coder / kid-memory / kid-network /
> kid-process / kid-security / kid-storage / kid-sysmon）。
> 这一件负责 space（空间）这一维：让孩子亲手建出一个立体的东西，而不是只看别人的模型。

## 它能干什么

装载后，harness 会多出 **8 个工具**：

| 工具 | 作用 |
|---|---|
| `kid3d_new` | 开一间新工坊：取名字、定大小（8~32 格）、选地面（草地/雪地/沙地/水面） |
| `kid3d_build` | 放一块积木：方块 / 圆球 / 圆柱 / 圆锥 / 尖顶 / 圆环，能指定位置、大小、颜色、躺着的方向 |
| `kid3d_erase` | 拆积木：碰到指定区域的整件都会拆掉（先问清楚、再拆） |
| `kid3d_paint` | 刷颜色：可以限定范围，也可以「只刷本来是红色的」 |
| `kid3d_template` | 一键搭出 10 个现成作品：小房子、小城堡、小火箭、大树、雪人、小汽车、小船、爱心、小猫、机器人 |
| `kid3d_open` | 打开 `存档/` 里以前收起来的作品接着玩（不写名字就只把存档清单念给小朋友听） |
| `kid3d_view` | 画一张立体图（等距 / 正面 / 侧面 / 俯视 / 四视图），同时刷新「会转圈的网页」 |
| `kid3d_export` | 打包成 **STL**（3D 打印）/ **OBJ**（建模软件）/ **HTML**（会转圈的网页，发给谁都能看） |

每放一块积木都会自动重画一次图，所以小朋友每说一句话，就能马上看到东西长出来。

## 交付给小朋友的东西长什么样

同一个作品，一次导出会得到四件套（都放在作品目录里）：

```
<工作目录>/kid3d/
├─ model.json              # 作品数据：几件积木、每件的形状/位置/大小/颜色
├─ 彩虹小房子.svg           # 等距立体图（静态，任何地方都能看，聊天里直接预览）
├─ 彩虹小房子-quad.svg      # 四视图（等距/正面/侧面/俯视拼一张）
├─ 彩虹小房子.html          # 会自己转圈的网页：纯 CSS 3D，零脚本零外链，鼠标放上去就停
├─ 彩虹小房子.stl          # 3D 打印文件（1 格 = 5 毫米，默认打出来约 75×50×75 毫米）
├─ 彩虹小房子.obj          # 建模软件能打开，连颜色一起带（usemtl）
└─ 存档/
   └─ 2026-10-03-115017-彩虹小房子.json   # 换新作品时，上一件自动进存档
```

设计要点：

- **图是纯 SVG**：自己算的正交投影 + 只画看得见的面（背面剔除），不依赖 canvas、
  不需要任何图像库、也不用装东西；`present` 给小朋友就是一张能直接预览的图。
- **「会转圈的网页」一份文件两种活法**：每个面片是一个 1×1 像素的 div，用 `matrix3d`
  摆到三维空间里，外层 `@keyframes` 一转就是立体的 —— 这是**没有脚本时**的样子
  （预览沙箱禁脚本、只允许内联样式，所以照样能转）。用真浏览器打开时，内联的一小段
  脚本接管视角，就变成 3D 游戏手感：**按住拖动转视角、松手有惯性、滚轮远近、双击回正面**，
  闲着 6 秒它又自己慢慢转起来。脚本被剥掉也不影响看，零外链、零网络、零存储。
- **面数上限兜底**：面太多（默认 1200）时网页自动退回静态 SVG，避免低配设备卡住。
- **说错了也听得懂**：位置少写一个数、放到地下去了、颜色不认识、放不下……
  都返回 `【……】` 开头的儿童向提示 + 具体怎么办，而不是报一串错误码。
- **只写自己的作品目录**：不执行 shell、不联网、免 sudo、零第三方运行时依赖。

## 目录结构

```
plugin-kid-3d/
├─ package.json          # 包约定；dsh.bundle.patch 指向安装补丁，dsh.client 声明前端卡片
├─ cordis.patch.yml      # 安装补丁：往 profile 里插一行 id: kid-3d 的插件
├─ client.js             # 前端卡片（浏览器里跑的裸 JS，斜杠不经过编译）
├─ tsconfig.json
├─ DESIGN.md             # 设计方案（数据模型 / 渲染管线 / 验收计划）
├─ src/
│  ├─ index.ts           # 插件入口：注册 8 个工具 + 挂上卡片的两条只读接口
│  ├─ card.ts            # 卡片的 host 半边：/kid-3d/state 与 /kid-3d/preview.svg
│  ├─ config.ts          # 配置 schema 与默认值
│  ├─ types.ts           # 颜色调色板、形状/地面枚举、类型
│  ├─ model.ts           # 作品数据模型 + 所有「小朋友说错了」的检查
│  ├─ geometry.ts        # 6 种形状 → 三角面片（方块/球/圆柱/圆锥/尖顶/圆环）
│  ├─ render-svg.ts      # 正交投影 + 背面剔除 → SVG
│  ├─ render-html.ts     # 无脚本 CSS 3D 自转网页（含面数兜底）
│  ├─ export.ts          # STL（二进制）/ OBJ（带材质）
│  ├─ templates.ts       # 10 个现成作品
│  ├─ state.ts           # 作品目录读写、存档
│  └─ tools.ts           # 8 个工具的定义与回话文案
├─ verify/selftest.mjs   # 安装后自测：70 项检查，全部在临时目录里跑
├─ verify/orbit.mjs      # 20 项：会转圈网页的拖动手感（假 DOM）
├─ verify/card.mjs       # 112 项：卡片两半（接口 + apply 分工 + 前端装载/注册/白名单/清理）
├─ verify/live.mjs       # 31 项：对着正在跑的 dsh web 打真请求（重启后验卡片真的装上了）
└─ lib/                  # 编译产物（harness 实际加载的就是这里）
```

## 配置

都在插件自己的 `Config` 里，装好后可以在 profile 配置里改：

| 配置项 | 默认 | 说明 |
|---|---|---|
| `enabled` | `true` | 是否启用整套工具 |
| `timeoutMs` | `8000` | 单次调用超时（毫秒） |
| `workDir` | `kid3d` | 作品目录（相对当前会话的工作目录） |
| `defaultSize` | `16` | 新工坊边长（格），8~32 |
| `maxPieces` | `300` | 一个工坊最多几件积木 |
| `unitMm` | `5` | 导出 3D 打印文件时 1 格等于多少毫米 |
| `interactiveMaxFaces` | `1200` | 会转圈的网页最多画面数，超过退回静态图 |
| `dragOrbit` | `true` | 网页带上「按住拖动转视角」脚本（真浏览器里生效；预览沙箱会剥掉它） |

## 安装与自测

安装（bundle 方式，harness 会自己写 profile 的 `package.json` 和插件行）：

```
plugin_manager install_bundle  target = <本目录的绝对路径>
```

改了代码之后：

```bash
./deepseek-harness/node_modules/.bin/tsc -p plugin-kid-3d/tsconfig.json   # 编译到 lib/
node plugin-kid-3d/verify/selftest.mjs                                    # 70 项：工具与产物
node plugin-kid-3d/verify/orbit.mjs                                       # 20 项：拖动视角交互
node plugin-kid-3d/verify/card.mjs                                        # 112 项：卡片接口与前端卡片
node plugin-kid-3d/verify/live.mjs                                        # 31 项：正在跑的服务上两条路由
```

自测覆盖：8 个工具的 schema、建工坊/放积木/画图/导出、模板与涂色与擦除、打开存档、
单块积木的精确数字（STL 12 个三角面、SVG 只画 3 个可见面、HTML 保留 6 个面）、
面数超限退化、以及全部错误路径的中文提示。跑完临时目录自动清理。
`orbit.mjs` 不用浏览器：它把生成网页里的脚本抠出来，喂给一个自建的极简假 DOM
真跑一遍（按下→拖动→松手→滚轮→双击→闲置自转），保证拖动的手感数字不会退化。

> 注意：host 插件在进程里是加载即缓存，改完 `lib/` 后要让**新会话**（或重启
> `dsh web`）生效；已在跑的会话仍用旧代码。**前端卡片还要多一步**：客户端模块表在
> 启动时扫一遍每个插件的 `dsh.client` 声明，扫到「没有声明」的包会**记成否定结论并
> 一直用到进程结束**（源码注释原话：negative verdicts remain stable until restart）。
> 所以新加/新改 `dsh.client` 之后，必须重启一次 `dsh web`，光刷新页面不够。

`verify/card.mjs` 全在自己进程里跑，证明得了代码对不对，证明不了「服务里现在装的正是
这份代码」。重启之后用 `verify/live.mjs` 验收：它只发 GET，打 `/kid-3d/state` 与
`/kid-3d/preview.svg` 两条路由，期望值直接从 `kid3d/model.json` 现读现比，并顺带核对
`client.js` 的装载契约与单会话白名单。重启之前跑，A 段会如实地报 404（旧进程缓存着
「本包不是 client 包」的结论）；两条路由都 200、作品名对得上，才算卡片真的装上了。

## Web 界面里的「工坊卡片」

聊天输入框上方会多出一张和「仓库大管家」「记忆小管家」同款的卡片，标题栏一句话
报当前工坊：**作品名 · 几件积木 · 最近一次动它是什么时候 · 存档里还收着几件旧作品**，
右侧一个小徽章写着件数，点箭头展开后是：

```
┌── 🧱 小小 3D 积木工坊 · 彩虹小房子           7 件 ⌄ ──┐
│  ┌─────────────────┐  🏷️ 作品名    彩虹小房子        │
│  │   斜视图 SVG     │  🧱 积木        7 件 / 最多：方块 │
│  │   （每 8 秒刷）  │  📐 占地        13×9 格 ≈ 65×45 毫米│
│  └─────────────────┘  🌿 地面        草地 · 16³ 工坊   │
│  🎨 颜色  ●棕 ×3  ●红 ×2  ●金 ×1  ●绿 ×1             │
│  🧩 形状  方块 ×4  尖顶 ×1  球 ×1  圆柱 ×1             │
│  🎁 彩虹小房子.html · .svg · .stl · .obj · 存档 3 件   │
│  每 8 秒看一次 ｜ 16:36:54                             │
└──────────────────────────────────────────────────────┘
```

- 卡片默认是**单会话可见**的：`client.js` 顶上那个 `ONLY_SESSIONS` 白名单里只放了一个
  会话 id（就是搭这座工坊的那个会话），别的会话外壳直接 `return null`——不占地方、不报错、
  连 8 秒一次的轮询都不启动。想让所有会话都看见，把数组清空成 `[]` 即可。
- 卡片是**跟着会话**的：它把当前会话 id 交给 host，host 用会话的工作目录去找
  `<工作目录>/kid3d/model.json`，所以同一个会话换了工作目录，看到的就是那边的工坊。
- 缩略图走 `<img src="/kid-3d/preview.svg?…">`，是**服务端现算的纯 SVG**（同一套
  `render-svg.ts`），带作品内容的 rev 号：作品没变就不重新拉，作品一变自动换图。
- 两条 host 接口都是**同源、只读、no-store**：`GET /kid-3d/state`（一行 JSON）、
  `GET /kid-3d/preview.svg?view=iso&w=520&h=380`（尺寸 240×200 ~ 1200×900 之间夹取）；
  只认 GET/HEAD，别的动词回 405。没有 `webServer` 服务的 profile（纯命令行）会自动
  跳过这两条路由，工具照常可用。
- 配色是薄荷绿（和暖色 🧳、蓝色 🦉 区分开），没有外链、没有网络请求、不读别的插件的
  样式或 DOM；样式自己插一个 `<style data-plugin-css="…">`，插件卸载时在
  `ctx.effect` 的清理函数里摘掉。

**怎么做到「和别的 kid 卡片一样」**（给下一个插件抄的模板）：一个包同时带两半——
host 半边照常是 TS（`src/index.ts` + `src/card.ts`），前端半边是包根目录下的**裸 JS
`client.js`**，由 package.json 三行声明挂上：

```json
{
  "exports": { ".": { "types": "./lib/types/index.d.ts", "default": "./lib/index.js" },
               "./client": "./client.js" },
  "dsh": { "bundle": { "patch": "./cordis.patch.yml" },
           "client": { "platform": "web" } }
}
```

`client.js` 不是 ESM（会被当 classic script 执行），必须整体包在 IIFE 里，用
`window.__ModuleLoader__.load({ id: 包名, factory })` 注册，`factory` 只能
`require('react')`，返回 `{ inject: ['slots'], apply(ctx) }`，在 `apply` 里
`ctx.slots.inject('conversation.input.dock', …)` + `ctx.slots.register({ name, id, order }, 组件)`。
**不写 `immediately: true`**：那是给启动第一屏就要用的卡片（比如仓库）留的快速通道，
功能卡片等第二波装载就好，别跟大家抢启动时间。

**一个包 = 插件行 + 卡片**（本包和 🧳 kid-storage 都是这个结构，迁移指南 §14）。
早期这里曾经是**两个包**：`@kidlab/dsh-kid-3d`（工具）+ `@kidlab/dsh-kid-3d-card`
（卡片，靠 `exports["./card"]` 引工具包的路由实现）。合并的原因很实在：

- 两半本来就同生共死，拆开只会多一个 profile 依赖、多一行插件补丁、多一份软链；
- 合并后 `src/index.ts` 的 `apply` 里用**子注入** `ctx.inject(['tools'], child => …)`
  注册工具，卡片的两条路由留在 `apply` 顶层直接挂：
  ① 有 tools 就注册 8 个工具；② `enabled: false` 不注册工具、但卡片路由照样挂
  （作品还看得见）；③ headless（没有 `webServer`）只剩工具、路由那步安静跳过。
  顶层写 `export const inject = ['tools']` 做不到这一点——那样整个插件都得等 tools 就位。
- 旧卡片包整体收进 `legacy/old-card-package/`（只留痕，不参与加载），profile 里的旧依赖、
  旧 bundle、悬空软链、`cordis.patch.yml` 里那行 `kid-3d-card` 覆盖都要清掉——
  留着的话重启后两个包会抢同一条路由（`webserver: duplicate exact route`），页面上还会冒出两张卡。

## 为什么不给小朋友发图片/截图

这个插件的模型工具走的是**纯文本**通道（当前模型不声明图像输入），所以插件
绝不产出图片附件，而是把图**写成文件**，再用 `present` 交给小朋友在右侧预览里看：

- `.svg` / `.html` 都在非开发者预览的允许列表里（HTML 会走 DOMPurify + 严格 CSP）；
- 需要发朋友圈或打印，就发 `.html` 和 `.stl`。

## 和小朋友怎么玩

```
想搭什么？说个名字和大小就行  →  kid3d_new  名字"恐龙乐园" size 20 地面 草地
在 (8,0,8) 放一个 4×4×4 的红方块  →  kid3d_build  shape box at [8,0,8] size [4,4,4] color 红
上面再加个绿球                →  kid3d_build  shape sphere at [8,4,8] size [5,5,5] color 绿
把红方块刷成金色              →  kid3d_paint  at [8,0,8] size [4,4,4] color 金
我要看看它长什么样            →  kid3d_view   view iso
昨天那件恐龙乐园再拿出来玩      →  kid3d_open   name 恐龙乐园
打包，我要去打印              →  kid3d_export format all
```

## 不做什么（v1）

- 不做布尔运算（挖洞、相交）、不做贴图、不做骨骼动画；
- 不做任意角度旋转的静态图（看角度用 4 个视角 + 会转圈的网页；网页本来就是 3D 的，按住就能转到任意角度）；
- 不执行任何外部命令、不联网、不读写作品目录以外的文件。

## 包结构（单包 · 静态 bundle）

本包和系列其它插件一样，是**一个包同时提供两半**：8 个模型工具（host half）+ 输入条上方的 🧱 卡片（client half），装一次就齐活。

```
plugins/kid-3d/
├─ index.js           # host 半部（**打包产物**，自包含单文件，仅依赖 node 内置模块）
├─ tools.js           # 按系列约定再导出 buildKid3dTools（指向 index.js）
├─ client.js          # client 半部：🧱 卡片（浏览器裸 JS，整文件 IIFE）
├─ cordis.patch.yml   # 往 profile 插一行 `kid-3d`
├─ package.json       # dsh.bundle.patch + dsh.client.platform = web
├─ verify.mjs         # 纯 Node 自测（70 项，`node verify.mjs`）
├─ build.mjs          # 重新打 index.js（`node build.mjs`，需 esbuild）
├─ DESIGN.md          # 设计文档
└─ src/               # TS 源码（仅开发期，不随 npm 发布）
```

**为什么 host 是打包产物**：host 带一个几何/渲染引擎（体素表面提取、正交投影 SVG、CSS-3D 网页、STL/OBJ 导出）+ dsh 工具定义，共 12 个 TS 模块，手写成单文件不现实。用 esbuild 打成自包含的 `index.js`（`@deepseek-ai/*` 全内联），满足系列「link: 安装不解析 profile 外依赖」的硬要求。改源码后 `node build.mjs` 重新打包。
