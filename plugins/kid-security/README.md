# @kidlab/dsh-kid-security · 电脑安全城堡守卫

给小朋友讲「这台电脑安不安全」的插件：**一个包 = 一张卡片 + 五个工具**，零第三方依赖、无构建步骤，装完即用。

把电脑讲成一座**小城堡**，安全的每一件事都是一道守卫：

| 守卫 | 讲的是什么 | 讲的道理 |
| --- | --- | --- |
| 🧱 护城河（防火墙） | 防火墙开没开 | 护城河 + 城门卫兵，拦住不怀好意的来客 |
| 🔒 保险箱（磁盘加密） | FileVault 开没开 | 把日记和宝贝锁进保险箱，硬盘被拿走也打不开 |
| 🚪 门锁（自动锁屏） | 闲置多久自动锁屏、回来要不要密码 | 离开房间随手锁门，回来要用钥匙 |
| 🕳️ 暗门（远程端口） | 22(SSH) / 5900(屏幕共享) 在不在监听 | 城堡墙上有没有偷偷开的小门 |
| 📋 登记簿（登录记录） | 最近谁登录过、什么时候开关机 | 城堡门口的登记簿 |

- **🏰 卡片**：常驻在输入条上方，折叠时一行「守卫在岗 N/M + 等级」，点开逐条讲，非在岗的守卫给一条「🙋 找大人」。
  五道守卫全部 **免 sudo、只读**，每 15 秒巡一次城。
- **🔧 五个模型工具**：`sec_wall` / `sec_locker` / `sec_lock` / `sec_door` / `sec_login`，模型可以直接喊出来查。

卡片长这样（折叠 / 展开）：

```text
┌────────────────────────────────────────────────┐
│ 🏰 城堡守卫    守卫在岗 3/5  🙂 有小缺口    ▾ │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 🏰 城堡守卫    守卫在岗 3/5  🙂 有小缺口    ▴ │
│  🧱 护城河（防火墙）      有缺口  🙋 找大人   │
│  🔒 保险箱（磁盘加密）    在岗                 │
│  🚪 门锁（自动锁屏）      要注意                │
│  🕳️ 暗门（远程端口）      在岗                 │
│  📋 登记簿（登录记录）    在岗                 │
└────────────────────────────────────────────────┘
```

等级只有四档：**安全城堡 😄 / 有小缺口 🙂 / 要补一补 😅 / 看不清 ❓**。
「看不清」表示那条命令读不到值（比如权限问题），**不计入分母**，不会赖成小朋友的错。

## 安装

```bash
# 在 DSH 会话里让模型执行（或自己走 plugin_manager）
plugin_manager install_bundle /Users/baixiao/Code/deepseek-harness-dev/plugin-kid-security
```

- **工具半部**（`index.js` / `tools.js` / `collect.js`）：装完返回 `applied` 就立即生效，**不用重启**。
- **卡片半部**（`client.js`）：包名第一次进模块表，模块表是 `dsh web` **启动时**算的 →
  安装后**要重启 `dsh web` 并刷新页面**，卡片才会出现（重启后刷新即可，不用重装）。
  - 重启请在**普通终端**里跑。在 DSH 会话内拉起的进程会继承会话的文件沙箱（`setsid` / `nohup` 也甩不掉），
    新起的 `dsh web` 会以 `EPERM: operation not permitted, open '~/.dsh/profiles/web/cordis.yml'` 直接退出，
    结果旧服务已停、新服务没起来（经过见迁移指南 14.9「新量到 3」）。

## 配置

在用户层（`~/.dsh/cordis.patch.yml`）**按 id 覆盖**这一行——不要再写一行 `insert`（同 id 的 insert 行不能共存）：

```yaml
- id: kid-security
  config:
    enabled: true      # false = 只关掉五个模型工具，卡片照旧
    timeoutMs: 8000    # 单条命令超时，1000–30000
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | `false` 时**不注册**五个工具；卡片由它自己的会话门禁控制，不受这里影响 |
| `timeoutMs` | `8000` | 单条只读命令的超时（`1000`–`30000`，越界会被夹到边界值） |

`timeoutMs` 不合法（非数字）时回落到默认 `8000`，超出 `1000`–`30000` 会被夹到边界值。

## 和旧版两个包的差异

同一个包由两个包合并而来：`@kidlab/dsh-kid-security`（工具）+ `@kidlab/dsh-kid-security-card`（卡片）。
合并**只换了注册方式**，工具的文本、命令、判定一个字没动（`node verify-legacy-equivalence.mjs` 会逐条核对）：

| 差异 | 旧版 | 现在 | 为什么 |
| --- | --- | --- | --- |
| 工具定义 | `defineTool({ … })` | 普通对象 + `ctx.tools.register()` | bundle 走 `link:` 安装，解析不到 `@deepseek-ai/dsh-tools`（store 里那份还配错了 `dsh-llm`） |
| 参数形状 | `defineTool({ parameters: {} })` 投影而来 | 写死 `NO_PARAMS = { type: 'object', properties: {} }` | 在 `Tool.listTools` 里投影**逐字节相同**，模型看到的契约没变 |
| 配置校验 | `Schema` + 默认值 | `index.js` 里的 `timeoutMsOf()` 兜同样的默认/边界 | 同上，不 import schemastery |
| 注册时机 | 顶层 `inject` | `apply()` 里 `ctx.inject('tools', …)` | 没有 `tools` 服务的 profile（只要卡片）也能装 |
| 卡片 | 单独的包 | 同包的 `./client` 导出 | 一个包干两件事 |

刻意**没有**加 `dsh.client.immediately: true`：按指南那是基础设施行用的（提前装载），功能卡片不需要，
少一次提前装载。

## 只想在某个会话显示卡片

`client.js` 顶部有一行白名单（默认只在一个会话里显示，避免每个会话都挂一张城堡）：

```js
const ONLY_SESSIONS = ['session-0f874f0b-4256-410d-b95c-42ddae484b46']
```

- 想在某些会话显示 → 把会话 id 加进去；`echo $DSH_SESSION_ID` 可以拿到当前会话 id。
- 想**每个会话都显示** → 把这行改成 `const ONLY_SESSIONS = []`（空数组 = 不限会话）。

白名单外的会话直接渲染 `null`：卡片不出现，轮询也不会启动（不白花算力）。

## 自检

```bash
node verify.mjs                      # 端到端自检（66 项）：守卫判定 / 真机采集 / 路由 / 卡片装载 / 渲染 / 五个工具
node verify-legacy-equivalence.mjs   # 与旧版 legacy/src/tools.ts 的文本级等价对照
```

两个都 `EXIT=0` 才算好。`verify.mjs` 不依赖浏览器，也不依赖本机此刻的安全设置（判定用注入的假文本测）。
另外注意：本 checkout 里 `tsc` 跑这些插件会 segfault（exit 139，环境问题），所以用 `node --check` + 上面两个脚本。

## 从两个包换成一个包（本机已做过的切换顺序）

顺序很重要——**中途不要刷新页面**，同 id 的 `insert` 行也不能共存：

1. 删掉用户层 `~/.dsh/cordis.patch.yml` 里 `kid-security` 的 `insert` 行（只掉工具，卡片还在）。
2. `package.json` 换成合并版（`main` / `exports` / `dsh.bundle.patch` + `dsh.client`）。
3. `plugin_manager remove_bundle @kidlab/dsh-kid-security-card`。
4. `plugin_manager install_bundle /…/plugin-kid-security`。
5. **重启 `dsh web` + 刷新页面**：卡片的模块 id 从 `…-card` 换成 `@kidlab/dsh-kid-security`，
   判定标准是服务出来的 HTML 里旧包名出现次数 **0**、新包名 ≥ 5。
6. 旧包目录和 `node_modules/@kidlab/dsh-kid-security-card` 那条软链**不悬空**（指回旧目录），但它已经不在
   profile 的 `bundles` 里、不会被加载——留着当回滚参照即可，不必删。

## 发布

`private: true` 是为了本机 `link:` 安装。真要发 npm：去掉 `private`、`npm version` 提版本、`npm publish --access public`。
`legacy/` 已经在 `files` 白名单之外，**不会**被发出去。

## 目录

| 文件 | 作用 |
| --- | --- |
| `package.json` | 合并版包定义：`main` + `exports['.']`（host）、`exports['./client']`（卡片）、`dsh.bundle.patch` + `dsh.client` |
| `index.js` | host 半部入口：注册 `/kid-security/collect` 路由 + 子注入 `tools` 注册五个工具；配置归一化 |
| `tools.js` | 五个模型工具的普通对象定义（不 import 任何第三方包） |
| `collect.js` | 五道守卫的判定逻辑与取数（卡片路由与工具共用同一份判定） |
| `client.js` | 卡片半部：模块表注册 + 槽位注入 + 轮询 + 样式（IIFE 包住，避免顶层标识符撞车） |
| `cordis.patch.yml` | bundle 的 patch：一行 `insert` 装 `kid-security`（卡片 + 五个工具） |
| `verify.mjs` | 本地端到端自检（66 项） |
| `verify-legacy-equivalence.mjs` | 与旧版 TS 源码的文本级等价对照 |
| `legacy/` | 旧的两份东西原样存档（`src/` `lib/` `cordis/` `example/` 等，以及 `old-card-package/`），只作对照，不发布不加载 |
