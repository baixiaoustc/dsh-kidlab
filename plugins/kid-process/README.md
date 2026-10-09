# @kidlab/dsh-kid-process · 工人点名（进程小工人）

> 📦 npm：[`@kidlab/dsh-kid-process`](https://www.npmjs.com/package/%40kidlab%2Fdsh-kid-process)　·　安装：`dsh plugin --profile web add @kidlab/dsh-kid-process`（或 `npm i @kidlab/dsh-kid-process`）

给小朋友讲「电脑里现在有多少小工人在干活」的插件：**一个包 = 一张卡片 + 四个工具**，零第三方依赖、无构建步骤，装完即用。
它是 `kid-coder / kid-sysmon / kid-network / kid-storage / kid-memory / kid-security` 之后的第 7 个，也是**最后一个**从 0.1 动态创作形态搬过来的。

把**进程**讲成在**工作台（内存）**上干活的小工人：

| 说法 | 对应什么 | 讲的道理 |
| --- | --- | --- |
| 🐝 小工人 | 进程 process | 每个打开的程序都会派小工人上场 |
| 🪪 工号 | PID | 小工人的身份证号；程序一退出就作废，所以每次打开工号常常不一样 |
| 👨🏫 师傅工号 | PPID | 谁把它带来上场的介绍人；一路往上问，最后都是总管 launchd（工号 1） |
| 💪 正在卖力干活 | 状态 `R` | 正占着 CPU 在算 |
| 😴 在打盹等活儿 | 状态 `S` | 大多数工人其实都在等活儿 |
| 🧟 僵尸工人 | 状态 `Z` | 活干完了、工牌还没被收走（也不占算力，收走就好） |

- **🐝 卡片**：常驻在输入条上方，折叠时一行「N 个工人在册 · M 个在卖力 + 等级」，点开是点名板 / 最卖力榜 / 家族 / 僵尸名单。
  全部 **免 sudo、只读**，每 15 秒点一次名（服务端另有 5 秒缓存，连点不会反复敲 `ps`）。
- **🔧 四个模型工具**：`proc_count` / `proc_busiest` / `proc_family` / `proc_badge`，模型可以直接喊出来查。
  这四个的**文本、命令、判定与 0.1 版逐字一致**（`node verify-legacy-equivalence.mjs` 逐条核对），只有注册方式变了。

卡片长这样（折叠 / 展开，数字是本机实测的示意）：

```text
┌──────────────────────────────────────────────────────────────┐
│ 🐝 工人点名     511 个工人在册 · 21 个在卖力   🙂 有几个僵尸 ▾ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 🐝 工人点名     511 个工人在册 · 21 个在卖力   🙂 有几个僵尸 ▴ │
│  点名板                                                       │
│     21              487               3                       │
│   在卖力干活      在打盹等活儿      赖着不走的僵尸             │
│  ▓▓▓▓ 21 在卖力 ▓▓▓▓▓▓▓▓▓▓▓▓ 487 在打盹 ▓ 3 僵尸             │
│  最卖力榜                                                     │
│  Google Chrome  ×12  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  51.5%   │
│  node                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓            41.9%   │
│  家族                                                         │
│  总管 launchd（工号 1）带了 435 个直接徒弟                     │
│  🧟 赖着不走的小工人（活干完了，工牌还没被收走）3 个            │
│  🐝 进程 = 在这台电脑上干活的小工人 ｜ 每 15 秒点一次名 ｜ 22:31 │
└──────────────────────────────────────────────────────────────┘
```

等级看的是**车间秩序**（僵尸越多越该收工牌）：

| 等级 | 什么时候 | 卡片上的话 |
| --- | --- | --- |
| 😄 车间整洁 | 有工人在干活，且零僵尸 | 一切都好 |
| 🙂 有几个僵尸 | 1–4 个僵尸 | 顺手收一下工牌就好 |
| 😅 僵尸有点多 | ≥ 5 个僵尸 | 建议重启一下那个程序 |
| 😴 都歇了 | 一个卖力的都没有 | 电脑在闲着 |
| ❓ 看不清 | 一条命令都没读到（权限问题等） | 不赖小朋友，也不误判成「安全/干净」 |

## 安装

```
# 推荐：GUI「插件管理」页的安装框里直接粘贴包目录路径
/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-process

# 或者在 DSH 会话里让模型执行（等价的同一件事）
plugin_manager install_bundle /Users/baixiao/Code/deepseek-harness-dev/plugin-kid-process
```

- **工具半部**（`index.js` / `tools.js` / `collect.js`）：装完返回 `applied` 就立即生效，**不用重启**。
- **卡片半部**（`client.js`）：装完**先刷新页面**看 🐝 在不在——安装一般会顺带把模块表增量重算并推下去，刷新就够；
  万一刷新后还是没有，再重启 `dsh web`（重启后刷新即可，不用重装）。
  - 重启请在**普通终端**里跑。在 DSH 会话内拉起的进程会继承会话的文件沙箱（`setsid` / `nohup` 也甩不掉），
    新起的 `dsh web` 会以 `EPERM: operation not permitted, open '~/.dsh/profiles/web/cordis.yml'` 直接退出，
    结果旧服务已停、新服务没起来（经过见迁移指南 14.9「新量到 3」）。
  - 只改 `client.js` 的话不用重启，**刷新页面**即可；改 `index.js` 才需要重启。

## 配置

在用户层（`~/.dsh/cordis.patch.yml`）**按 id 覆盖**这一行——不要再写一行 `insert`（同 id 的 insert 行不能共存）：

```yaml
- id: kid-process
  config:
    enabled: true      # false = 只关掉四个模型工具，卡片照旧
    timeoutMs: 8000    # 单条命令超时，1000–30000
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | `false` 时**不注册**四个工具；卡片由它自己的会话门禁控制，不受这里影响 |
| `timeoutMs` | `8000` | 单条只读命令的超时（`1000`–`30000`，越界会被夹到边界值） |

`timeoutMs` 不合法（非数字）时回落到默认 `8000`。

## 和旧版（0.1 动态创作）的差异

0.1 版只有工具，没有卡片；这一版把卡片补上，并且把装载方式从「workspace 注册 + 根 `tsc` 编译 + `~/.dsh/profiles/node_modules` 软链 + 用户层 patch 的 `insert` 行」
换成 **web profile 里的静态 bundle**（一个 `install_bundle` 就位）：

| 差异 | 旧版 | 现在 | 为什么 |
| --- | --- | --- | --- |
| 装载 | `src/*.ts` → 根 `tsc` → `lib/*.js` → `profiles/node_modules` 软链 → patch `insert` | 一个 bundle 包（host 半部 + client 半部） | 0.1 的 `cordis_define` / `cordis_run` 动态工具在 0.2 已经没有了 |
| 工具定义 | `defineTool({ … })` | 普通对象 + `ctx.tools.register()` | bundle 走 `link:` 安装，解析不到 `@deepseek-ai/dsh-tools` |
| 参数形状 | `defineTool({ parameters: {…} })` 投影而来 | 写死 `NO_PARAMS` / `OPT_PID` / `NEED_PID` | 在 `Tool.listTools` 里投影**逐字节相同**，模型看到的契约没变 |
| 配置校验 | `Schema` + 默认值 | `index.js` 里的 `timeoutMsOf()` 兜同样的默认/边界 | 不 import schemastery |
| 注册时机 | 顶层 `inject` | `apply()` 里 `ctx.inject('tools', …)` | 没有 `tools` 服务的 profile（只要卡片）也能装 |
| 卡片 | 无 | 同包的 `./client` 导出 + `/kid-process/collect` 路由 | 一个包干两件事 |

`tools.js` 刻意**不**和 `collect.js` 共用一个取数层：`tools.js` 要保持「一个字没动」，而卡片的命令重新挑过（每条多带一个 `pid`，这样卡片上的名字能对上工具里的工号）。

## 只想在某个会话显示卡片

`client.js` 顶部有一行白名单（当前为空 = **每个会话都显示**）：

```js
const ONLY_SESSIONS = []
```

- 想**只**在某些会话显示 → 把会话 id 填进去；`echo $DSH_SESSION_ID` 可以拿到当前会话 id。
- 想恢复**每个会话都显示** → 留空 `const ONLY_SESSIONS = []`（空数组 = 不限会话）。

白名单外的会话直接渲染 `null`：卡片不出现，轮询也不会启动（不白花算力）。

## 自检

```bash
node verify.mjs                      # 端到端自检（112 项）：解析 / 真机采集 / 路由 / 卡片装载 / 渲染 / 四个工具
node verify-legacy-equivalence.mjs   # 与旧版 legacy/src/tools.ts 的文本级等价对照
```

两个都 `EXIT=0` 才算好。`verify.mjs` 不依赖浏览器，也不依赖本机此刻的进程表（点名、榜单、家族、等级都用注入的假文本测）。

⚠️ 一个环境坑：本 checkout 的 bash 沙箱会拦 `/bin/ps`（`Operation not permitted`），
所以 `verify.mjs` 会先探一次 `ps` 能不能用，**不能用时把真机断言自动降级**成「形状 + 降级文案」核对
（插件在 `dsh` 进程里跑，不受这个沙箱限制）。同理，本 checkout 里 `tsc` 跑这些插件会 segfault（exit 139，环境问题），所以用 `node --check` + 上面两个脚本。

## 发布

`private: true` 是为了本机 `link:` 安装。真要发 npm：去掉 `private`、`npm version` 提版本、`npm publish --access public`。
`legacy/` 已经在 `files` 白名单之外，**不会**被发出去。

## 目录

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包定义：`main` + `exports['.']`（host）、`exports['./client']`（卡片）、`dsh.bundle.patch` + `dsh.client` |
| `index.js` | host 半部入口：注册 `/kid-process/collect` 路由 + 子注入 `tools` 注册四个工具；配置归一化 |
| `tools.js` | 四个模型工具的普通对象定义（不 import 任何第三方包，文本与旧版逐字一致） |
| `collect.js` | 卡片取数：三条只读 `ps` 命令 + 纯函数解析（`assemble()` 离线可测）+ 5 秒缓存 |
| `client.js` | 卡片半部：模块表注册 + 槽位注入 + 15 秒轮询 + 样式（IIFE 包住，避免顶层标识符撞车） |
| `cordis.patch.yml` | bundle 的 patch：一行 `insert` 装 `kid-process`（卡片 + 四个工具） |
| `verify.mjs` | 本地端到端自检（112 项） |
| `verify-legacy-equivalence.mjs` | 与旧版 TS 源码的文本级等价对照 |
| `legacy/` | 旧版（`src/` `lib/` `example/` `package.json` `tsconfig.json` 等）原样存档，只作对照，不发布不加载 |
