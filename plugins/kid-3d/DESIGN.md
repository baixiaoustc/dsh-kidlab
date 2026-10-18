# kid-3d 设计方案 ——「小小 3D 积木工坊」

给小朋友的 3D 建模启蒙插件（`@kidlab/dsh-kid-3d`），kid 系列第 8 个成员，8 个模型可见工具。

---

## 0. 先说一个必须绕开的技术事实（它决定了整个交付方式）

本 profile 当前模型路由是 `ark-code-latest`，**它不声明图像输入**（`read_image` 的实测报错：
`model "ark-code-latest" does not declare image input`）。而 Web 端「图片卡片」的数据源是
**工具结果 content 里的 `image` 块**（`packages/client/ui-tool/src/client/tool/models/image-card-model.ts`），
也就是同一份内容会发给模型 → 在聊天里内联贴图会让后续请求崩掉。所以：

> **v1 不做内联图片、不依赖 attachments 服务、不需要 PNG 编码器。**
> 小朋友看到的画面走「文件 → 文件卡片 → 右侧栏预览」这条路，它不经过模型请求。

已验证的可用通道（都是当前 profile 里活着的）：

| 通道 | 事实依据 | 小朋友看到什么 |
| --- | --- | --- |
| `present` 工具 → 文件卡片 | 本会话 `present` 工具可用；`deliverables/presented` 由它写入 | 一张带「预览」按钮的卡片 |
| 右侧栏 image 预览 | slot `sidebar.right.tab.document` 的 `/image` occupant `active: true`，扩展名含 `png/jpg/gif/webp/svg` | PNG/SVG 图片，可缩放 |
| 右侧栏 html 预览 | 同 slot 的 `/html` occupant `active: true`；非开发者模式走 `createBasicHtmlDocument`（DOMPurify 净化 + CSP `script-src 'none'`，但 `style-src 'unsafe-inline'`） | 一个**无脚本也能自转的 3D 网页** |

关键推论：静态 HTML 预览**禁用 JS、允许内联 CSS**。于是「会自己转圈的作品网页」靠零 JS 也能动
—— 每个面是一个 `div`，用 `matrix3d(...)` 摆到 3D 位置，父层 `preserve-3d` +
`@keyframes rotateY(0→360deg)` 自动旋转，浏览器自己做投影和深度排序。

同一个文件还要能当「3D 游戏」玩：小朋友用真浏览器打开它时（`script-src` 不再被拦），
内联脚本接管视角 —— 按住拖动转、松手有惯性、滚轮远近、双击回正面、闲置 6 秒自己转起来。
**脚本被剥掉时页面照样完整可用**（自转 + 悬停暂停），这也是预览面板里看到的形态。

---

## 1. 隐喻与心智模型

> **一张 16×16×16 格的「积木桌」**。桌子有地板（草地/雪地/沙滩/水面），
> 往上面摆积木（方块/球/圆柱/圆锥/金字塔/甜甜圈），每块积木有自己的颜色。
> 摆完了，工坊能拍出一张照片（SVG），还能把它变成「会转圈的网页」和「能 3D 打印的文件」。

- 坐标：`x` 右、`y` 上、`z` 往后；地板在 `y=0`；单位是「格」。
- 每块积木记 `at`（左下后角，最小角）+ `size`（宽×高×深），跟乐高说明书一样好描述。
- 一次会话 = 一张积木桌 = 一个作品（状态存在 `kid3d/model.json`）。

---

## 2. 数据模型（`<cwd>/kid3d/model.json`）

```json
{
  "version": 1,
  "name": "小房子",
  "size": [16, 16, 16],
  "ground": "grass",
  "pieces": [
    { "id": 1, "shape": "box",   "at": [3, 0, 3], "size": [10, 6, 10], "color": "beige" },
    { "id": 2, "shape": "pyramid", "at": [2, 6, 2], "size": [12, 4, 12], "color": "red" }
  ],
  "updatedAt": "2026-10-03T11:12:00.000Z"
}
```

- `shape`：`box` 方块/长方体 · `sphere` 球 · `cylinder` 圆柱 · `cone` 圆锥 · `pyramid` 金字塔/屋顶 · `torus` 甜甜圈。
- `size`：包围盒尺寸（格）。`box` 必须整数格（会被取整）；圆润形状可小数。
- `color`：12+ 个中文/英文颜色名，或 `#rrggbb`。
- 容量：工坊 8–32 格（默认 16），最多 300 件积木。
- **同格规则**：后放的压住先放的（voxel 覆盖），符合直觉。

---

## 3. 渲染管线（纯 TypeScript，零第三方依赖）

```
pieces ──► 表面网格 mesh ──► SVG   (静图，等距/正/侧/俯/四视图)
                       ├──► HTML  (CSS-3D 自转网页；有 JS 时可拖动转视角)
                       ├──► STL   (二进制，给 3D 打印机)
                       └──► OBJ   (通用格式，按颜色分组)
```

1. **出网格**：`box` 走体素化 + 只保留「露在外面」的面（内部面不画 → 又小又干净）；
   圆润形状按尺寸细分（段数有上限）生成三角/四边形面。
   每个面带 `color` + 法向量。
2. **SVG**：正交投影 + 画家算法（按面心深度排序）+ 背面剔除 + 兰伯特平面着色
   （光照来自左上前方）+ 同色细描边（消掉面与面之间的白缝）+ 棋盘格地板 + 天空渐变。
   自动缩放到画布，`spin` 可绕竖轴转任意角度。
3. **HTML**：每个面一个 `div`，`transform: matrix3d(e1, e2, n, v0)`，外层
   `perspective` + `rotateX(var(--rx,18deg)) rotateY(var(--ry,0deg)) scale3d(...)`；
   内层 `preserve-3d` + 12 秒一圈自动旋转，鼠标悬停暂停（「按住它就不转了」）。
   **脚本被剥掉时就是这一种活法**，预览面板里看到的就是它。
   用真浏览器打开时，内联脚本（`dragOrbit`，默认开）往 `<html>` 加 `js` 类，
   关掉 CSS 自转并接管视角：按住拖动转（0.45°/px，俯角夹在 ±88°）、松手惯性
   （0.88/16ms 衰减）、滚轮缩放 0.5–2.6 倍、双击回正面、闲置 6 秒又慢慢自转（展台效果）。
   整屏拖动层 `.pad` 只在 `js` 下出现，所以没脚本时不会挡住「悬停暂停」。
   面数超过 `interactiveMaxFaces`（默认 1200）时自动退回静态 SVG，避免卡顿。
4. **STL/OBJ**：同一份网格，按 `unitMm`（默认 1 格 = 5 毫米）换算成毫米，
   让打印出来的实物大小可控。

---

## 4. 工具契约（8 个）

| 工具 | 作用 | 参数 | 返回 |
| --- | --- | --- | --- |
| `kid3d_new` | 开一张新积木桌（旧作品自动存档） | `name?` 作品名 · `size?` 工坊边长(8–32) · `ground?` 草地/雪地/沙滩/水面/无 | 工坊概况 + 图路径 |
| `kid3d_build` | 摆一块积木/一个形状 | `shape?`(默认 box) · `at` [x,y,z] · `size` [w,h,d] · `color?` | 放好了 + 现在共几件 + 图路径 |
| `kid3d_erase` | 拆掉一个范围里的东西（碰到的整块拿走） | `at` · `size` | 拆掉 N 件 + 剩余概览 + 图路径 |
| `kid3d_paint` | 刷颜色 | `at` · `size` · `color` · `from?` 只刷原本是这个颜色的 | 刷了 N 件 + 颜色分布 + 图路径 |
| `kid3d_template` | 一键变出一个成品 | `template` 房子/城堡/火箭/大树/雪人/小汽车/小船/爱心/小猫/钻石 · `name?` | 成品清单 + 图路径 |
| `kid3d_open` | 打开 `存档/` 里以前收起来的作品接着玩（当前这件先自动存档） | `name?` 作品名或存档文件名；不写就只列清单 | 【打开啦】+ 作品概况 + 图路径（或存档清单） |
| `kid3d_view` | 拍张照看看（可选角度/四视图） | `view?` iso/front/side/top/quad · `spin?` 0–360 · `zoom?` 0.5–2 · `grid?` | 图路径 + 尺寸/件数/颜色/最高点等统计 |
| `kid3d_export` | 变成能带走的文件 | `format` stl/obj/html/all | 文件路径 + 文件大小 + 「怎么用」一句话 |

**放不下 / 颜色不认识 / 件数上限**这类「小朋友级问题」不抛异常，而是回一段
`【放不下】…给你两个办法…` 的友好提示，模型读了就能自己纠正；只有真正的文件系统错误才抛错。

**每一步都自动刷新图**：四个改动类工具都会把当前视角重画到 `kid3d/<作品名>.svg`，
所以小朋友任何时候都有一张最新鲜的画可看，不用记「先拍照」这一步。

**图上桌的最后一厘米**：工具说明里写明「把生成的图用 `present` 交给小朋友看」，
返回文本里也带一行同样的提示。这是本 profile 唯一能把画面送到小朋友眼前的通道。

---

## 5. 配置

```ts
enabled: true              // 是否启用整套工具
timeoutMs: 8000            // 单次调用超时兜底（1000–30000）
workDir: 'kid3d'           // 作品目录（相对会话工作目录）
defaultSize: 16            // 新工坊边长（8–32）
maxPieces: 300             // 最多积木件数
unitMm: 5                  // 导出时 1 格 = 5 毫米
interactiveMaxFaces: 1200  // 自转网页的面数上限，超过退回静态图
dragOrbit: true            // 网页里带上「按住拖动转视角」脚本（真浏览器里生效）
```

---

## 6. 文件布局

```
<cwd>/kid3d/
  model.json                  当前作品（唯一状态）
  <作品名>.svg                静图，每次改动自动刷新
  <作品名>.html               会自己转圈的 3D 网页（真浏览器里可按住拖动转视角）
  <作品名>.stl / .obj         3D 打印 / 通用格式
  存档/<时间>-<作品名>.json    被 kid3d_new 顶替的旧作品（永不丢失）
```

源码（沿用 kid 系列三件套结构）：

```
plugin-kid-3d/
  package.json  tsconfig.json  README.md  DESIGN.md
  cordis.patch.yml  安装补丁（insert 一行 id: kid-3d）
  client.js         前端卡片（包根目录的裸 JS，不经编译；默认单会话可见）
  src/index.ts      插件入口（name / Config / apply：子注入 tools + 顺手挂卡片路由）
  src/card.ts       卡片的 host 半边：/kid-3d/state 与 /kid-3d/preview.svg
  src/config.ts     Schema 配置
  src/tools.ts      8 个工具定义 + 中文说明
  src/model.ts      作品状态读写、校验、存档
  src/state.ts      目录定位（workDir / 存档）与安全读写
  src/types.ts      颜色表、形状与网格类型、地面配色
  src/geometry.ts   6 种形状 → 网格
  src/render-svg.ts 正交投影渲染器
  src/render-html.ts CSS-3D 自转网页 + 拖动视角脚本
  src/export.ts     STL / OBJ
  src/templates.ts  10 个成品
  verify/selftest.mjs  8 个工具的端到端自测（含写出的每个文件）
  verify/orbit.mjs     「拖动转视角」交互自测（假 DOM，不需要浏览器）
  verify/card.mjs      卡片两半自测（112 项：路由接口 + apply 分工 + 前端装载/白名单）
  verify/live.mjs      活体自检（31 项：对着正在跑的 dsh web 打真请求，验卡片真的装上了）
  legacy/old-card-package/  合并前那个独立卡片包 @kidlab/dsh-kid-3d-card（只留痕）
```

---

## 7. 与 kid 系列其他插件保持一致的约定

- 包名 `@kidlab/dsh-kid-3d`，版本 `0.2.0`，`private: true`，`type: module`。
- 导出 `name` / `Config` / `apply(ctx, config)`；工具用**子注入**
  `ctx.inject(['tools'], child => child.effect(…))` 注册，不写顶层 `inject = ['tools']`——
  这样 `enabled:false` 或没有 tools 能力的 profile 里，卡片的两条路由照样挂得上。
- **一个包 = 插件行 + 卡片**（与 🧳 kid-storage 同构，迁移指南 §14）：manifest 同时有
  `dsh.bundle.patch` 和 `dsh.client.platform = 'web'`，`exports` 给 `"."`（host，lib/）
  与 `"./client"`（浏览器裸 JS，模块 id 必须正好是裸包名），并且**不写 `immediately`**。
- 卡片默认**单会话可见**：`client.js` 顶上的 `ONLY_SESSIONS` 白名单只放一个会话 id
  （清空成 `[]` 就是所有会话可见）。门禁放在外壳组件里：不碰任何 hook，只读
  `props.sessionId ?? props.session.sessionId`，不在名单里直接 `return null`。
- 客户端 bundle 必须**整文件 IIFE**：浏览器模块表把每个包拼进同一个作用域，
  顶层 `const PKG` 会和别的 bundle 撞名（`SyntaxError: Identifier 'PKG' has already been declared`），
  结果是整个 bundle 不激活。
- 零第三方运行时依赖（只用 `node:fs` / `node:path`），免 sudo，不执行任何 shell 命令。
- 中文文档注释 + 给 8 岁小朋友看的工具说明（比喻优先），输出用 `【…】` 分节、
  末尾一句「解释：/提示：」。
- 工具全部不声明 `isConcurrencySafe`（串行），避免两个调用同时改 `model.json`。

---

## 8. 验收与自测计划

1. `tsc` 类型检查 + 构建通过。
2. 纯 Node 自测脚本（不进插件）：6 种形状出网格的面数/法向/包围盒正确；
   体素表面提取在已知场景下只留外露面；STL 头 + 三角数 + 字节数自洽；OBJ 顶点索引不越界；
   SVG 面数/坐标落在画布内且深度序正确；HTML 的 `matrix3d` 数量 = 面数。
3. **ASCII 侧视图自检**：把每个成品模板投影成字符画（我自己能读），确认房子有屋顶、
   火箭是细长带尖、爱心中间凹 —— 这是我在「看不见图」的情况下唯一能自查外形的办法。
4. 装进 `web` profile（live）：`cordis_inspect_query`（host `Tool.listTools`）确认 8 行工具注册、Config 投影正常。
5. 真调用：`kid3d_template` → 房子 → `kid3d_view quad` → `kid3d_export stl,html`，
   检查产物文件（SVG 多边形数、STL 字节数、HTML 面数）。
6. Chromium（仓库自带 playwright）加载生成的 HTML，断言：面 `div` 的
   `getBoundingClientRect()` 非退化、`transform` 含 `matrix3d`、动画在跑（两次采样位置不同）。
   截图交给用户肉眼确认（当前路由不支持我看图，这一步必须由人确认）。
   实测补充：本沙箱里 node 加载 jsdom 会 `SecItemCopyMatching -67674` 段错误、playwright
   也不可用，所以拖动逻辑改由 `verify/orbit.mjs` 用**自建假 DOM** 真跑一遍（按下→拖动→
   松手→滚轮→双击→闲置自转，20 项断言），既不需要浏览器也不需要第三方库。
   同一件事在 `verify/live.mjs` 里也有个影子：ESM 的 node 在这个沙箱里一发网络请求就
   `SecItemCopyMatching -67674` 段错误，所以探针固定由一个 `node -e`（CommonJS）子进程发，
   只回传状态码/SVG 正文；换到能联网的普通终端也一样跑得通。
7. 端到端：`present` 那个 SVG，请用户点开文件卡片的「预览」看右侧栏效果。

---

## 9. v1 不做（明确划界）

- 不做内联图片 / attachments（路由不支持，见 §0）。
- 不做旋转、镜像、复制积木（保持「说明书式」简单；`box` + 圆润形状够用）。
- 不做多作品同时编辑（一张桌子一个作品）；不做撤销栈（`kid3d_new` 自动存档兜底）。
- 不做交互式拖拽之外的编辑操作（旋转/缩放积木本体）。视角拖动只是**看**，不改作品数据；
  页面里唯一的脚本就是视角脚本，零外链、零存储、零网络。
- 不做截图进聊天（同上，改走 `present` 文件卡片）。
