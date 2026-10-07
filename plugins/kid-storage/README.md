# @kidlab/dsh-kid-storage · 仓库大管家

给小朋友的存储启蒙插件（DeepSeek Harness / Cordis bundle）。**一个包 = 一张卡片 + 三个工具**，
零第三方依赖、无构建步骤，装完即用。

- 🐿️ **卡片**：常驻输入条上方，把硬盘讲成「大仓库 / 大行李箱」；真磁盘分区、还挂着的安装包映像、
  主目录各文件夹谁最占地方，都会画成横条。点击标题折叠/展开。
- 🔧 **模型工具**：`storage_boxes`（分区全景）、`storage_home`（主目录谁最占地方）、
  `storage_heavy`（最重的几件大行李）。免 sudo、只扫用户目录、单命令超时容错。

```text
┌──────────────────────────────────────────────┐
│ 🐿️ 仓库大管家   系统盘 Data 总 121G 剩 8.4G ▾ │
│  系统盘 Data  ████████████████████████ 92%   │
│  ~/Downloads  ██████ 759 MB                  │
└──────────────────────────────────────────────┘
```

## 安装

```bash
# 在本机 profile 里安装（发布后也可以用 npm 包名）
plugin_manager install_bundle /绝对路径/plugin-kid-storage
```

装完后：host half 需要重启 `dsh web` 生效；client half 只需刷新页面。
`cordis.patch.yml` 会往 profile 里插一行 `kid-storage`。

## 配置

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 只关三个模型工具；卡片是独立客户端模块，不受它控制 |
| `timeoutMs` | `8000` | 单条 `df`/`du` 命令的超时，自动收敛到 1000–30000 |

要改默认值，在**用户层**补丁（`~/.dsh/cordis.patch.yml`）里按 id 覆盖，别改包里的补丁：

```yaml
- id: kid-storage
  config: { timeoutMs: 12000 }
```

## 和旧版两个包的差异

合并前是**两个包**、同时挂着：`@kidlab/dsh-kid-storage`（TypeScript 源码 + `defineTool`，只给三个工具）
和 `@kidlab/dsh-kid-storage-card`（只给路由 + 🐿️ 卡片）。现在合成这一个包，模型侧与卡片侧的行为都对齐，
只有三处刻意的差别：

| 差别 | 原因 / 影响 |
| --- | --- |
| 不再 `import { defineTool } from '@deepseek-ai/dsh-tools'`，改成返回普通对象交给 `ctx.tools.register()` | `link:` 进 profile 的包解析不到外部包；旧写法在本 checkout 里**已经 import 不进来**（pnpm store 里那份 `dsh-tools` 配到了不兼容的 `dsh-llm`，报 `does not provide an export named 'CallId'`）。模型看到的 name / description / 无参 schema / 文本输出逐字不变 |
| 不再导出 `Config`（schemastery 校验） | 同上，不能再 import 外部包。代价：把 `timeoutMs` 写成字符串之类的错误不再被 Loader 拦下，改由 `timeoutMsOf()` 收敛兜底；`Config.listConfigs` 里这一行不再有校验 schema |
| 顶层 `inject = ['tools']` 换成 `ctx.inject(['tools'], …)` | 这样即使某个环境没有 `tools` 服务，路由也照样注册；工具在 `tools` 出现时才注册，且 `apply` 一定会执行 |

路由（`/kid-storage/collect`）原先由卡片包注册，现在归 `index.js`，两个包不会再抢同一个路由和同一个
dock 槽位 id（`kid-storage`，order 6）。

## 只想在某个会话显示卡片

卡片模块是进程级装载的（每个会话的页面都会装入），所以「只在某个会话显示」由组件里的
会话判断实现，不靠装载层面。改 `client.js` 顶部的白名单：

```js
// 留空 [] = 每个会话都显示；填会话 id = 只在那些会话显示
const ONLY_SESSIONS = ['session-xxxxxxxx-....']
```

当前会话 id：终端执行 `echo $DSH_SESSION_ID`。

## 自检

```bash
node verify.mjs                      # 真机采集 + 路由 + 客户端渲染 + 三个工具，全绿才退出 0
node verify-legacy-equivalence.mjs   # 逐字对照旧版 TS 源码，确认只是换了注册方式
```

## 从两个包换成一个包（本机已做过的切换顺序）

1. 用户层补丁里删掉老的那一行 `insert: [{ id: kid-storage, name: '@kidlab/dsh-kid-storage' }]`
   （否则和包补丁里的同名 insert 撞车）；
2. `plugin_manager remove_bundle @kidlab/dsh-kid-storage-card`（先撤掉卡片包，避免两个客户端模块抢同一个 dock id）；
3. `plugin_manager install_bundle /绝对路径/plugin-kid-storage`；
4. 重启 `dsh web`（host half 变了），再刷新页面（client half 变了）。

中间那几步 GUI 会短暂缺卡片，重启+刷新后恢复；切换期间别刷新页面。

## 发布

1. 删掉 `package.json` 里的 `"private": true`；
2. 改 `version`；
3. `npm publish --access public`（scoped 包要带 `--access public`）。

包名、目录名、`files` 白名单都已就绪（`node_modules/`、`legacy/` 不会被发布）。

## 目录

| 文件 | 作用 |
| --- | --- |
| `index.js` | host half：注册三个工具 + 卡片的数据路由 `/kid-storage/collect` |
| `tools.js` | 三个模型工具的普通对象定义（不用 `defineTool`，见文件头注释） |
| `collect.js` | 采集层：`df`/`du`/`diskutil` → 一份 JSON（卡片用，纯 node 内置模块） |
| `client.js` | client half：浏览器里的 🐿️ 卡片（包在 IIFE 里，避免全局声明撞车） |
| `cordis.patch.yml` | 安装补丁：插一行 `kid-storage` |
| `verify.mjs` | 本地端到端自检 |
| `verify-legacy-equivalence.mjs` | 与旧版 `legacy/src/tools.ts` 的文本级等价性对照（脚本按 `./src/tools.ts` → `./legacy/src/tools.ts` 顺序找，两处都认） |
| `legacy/` | 存档，运行时不使用：旧动态创作插件的 TypeScript 源码 + `ctx.shell` 模板，以及合并前那个静态 bundle（`legacy/old-card-package/`，原 `plugin-kid-storage-card`） |
