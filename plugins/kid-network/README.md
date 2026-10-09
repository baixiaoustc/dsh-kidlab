# @kidlab/dsh-kid-network · 🕊️ 信鸽邮局（网络小探险）

> 📦 npm：[`@kidlab/dsh-kid-network`](https://www.npmjs.com/package/%40kidlab%2Fdsh-kid-network)　·　安装：`dsh plugin --profile web add @kidlab/dsh-kid-network`（或 `npm i @kidlab/dsh-kid-network`）

给小朋友的「网络启蒙」插件：**一个包 = 一张卡片 + 五个工具**，零第三方依赖、无构建步骤，装完即用。
它是 kid 系列成员之一（同族：`kid-coder` 编程、`kid-process` 进程、`kid-storage` 仓库、`kid-memory` 工作台、`kid-security` 城堡守卫）。

它回答小朋友最容易问的那几个问题：**我在网上的名字是什么？数据是怎么一站一站跑过去的？网速有多快？
家里还连着谁？网址怎么变成门牌号？** 全部**免 sudo、不需要第三方依赖**，只调用 macOS 自带命令 + 一个测速下载。

把**网络**讲成**信鸽送信**的小故事：

| 说法 | 对应什么 | 讲的道理 |
| --- | --- | --- |
| 🕊️ 信鸽 | 数据包 | 数据不是凭空传送，是一站一站飞过去的 |
| 🏠 小区里的家 | 局域网 IP | 电脑在自家网络里的门牌号 |
| 🚪 出口大门（保安） | 默认网关 | 出了门先到保安那儿，再由它放你出去 |
| 📮 互联网身份证 | 公网 IP + 城市 + 运营商 | 全世界的网站看到的是这个身份 |
| 👨‍👩‍👧‍👦 家里的邻居 | 局域网设备（ARP） | 同一 WiFi 下认识的小伙伴 |
| ✈️ 送信到三站 | ping 延迟 | 越快越好，条越满说明路越顺 |
| 🚀 一秒钟驮多少 | 下载网速 | 数字越大，看视频 / 下文件越流畅 |
| 📖 网址翻译官 | DNS | 把「网址」翻成机器找路用的「IP 门牌号」 |

- **🕊️ 卡片**：常驻在输入条上方，折叠时一行摘要，点开是网速大数字 + 三个信息格 + 三站送信进度条。
  每 **8 秒**信鸽飞一圈（服务端另有 5 秒缓存，连点不会反复敲系统命令）。
- **🔧 五个模型工具**：`net_my_identity` / `net_trace_trip` / `net_test_speed` / `net_who_is_home` / `net_dns`，
  模型可以直接喊出来查；**文本、命令、判定与 0.1 版逐字一致**，只有注册方式变了。

## 五个工具

| 工具 | 作用 | 参数 |
| --- | --- | --- |
| `net_my_identity` | 网络身份名片：局域网 IP、默认网关、DNS、公网 IP + 位置 + 运营商 | 无 |
| `net_trace_trip` | 追踪一封「数据信」从这台电脑一站一站跳到目标网站（traceroute，最多 15 跳、每跳问 1 次） | `target`：baidu / taobao / aliyun / qq / bilibili |
| `net_test_speed` | 实测下载网速：从固定测速地址下载 3 MB，算出每秒收到多少 | 无 |
| `net_who_is_home` | 局域网「全家福」：已联系过的邻居设备（IP、MAC、主机名） | 无 |
| `net_dns` | 网址「翻译官」：把域名翻成机器用的 IP（`dig +short`） | `target`：同上 |

`target` 只能从**预设列表**里选（不允许把任意主机名喂进去），这是插件的**安全边界**。

## 安装

```
# 推荐：GUI「插件管理」页的安装框里直接粘贴包目录路径
/Users/baixiao/Code/dsh-kidlab/plugins/kid-network

# 或者在 DSH 会话里让模型执行（等价的同一件事）
plugin_manager install_bundle /Users/baixiao/Code/dsh-kidlab/plugins/kid-network
```

- **工具半部**（`index.js` / `tools.js`）：装完返回 `applied` 就立即生效，**不用重启**。
- **卡片半部**（`client.js`）：装完**先刷新页面**看 🕊️ 在不在；只改 `client.js` 时**刷新页面**即可，
  改 `index.js`（host 半部）才需要重启 `dsh web`。重启请在**普通终端**里跑（会话内拉起的进程继承文件沙箱，
  写不了 `~/.dsh`，见迁移指南 14.9「新量到 3」）。

> 不要改 `~/Code/deepseek-harness-dev/plugin-kid-network/`（那是只读的本地原件）。所有改动只在本目录。

## 配置

在用户层（`~/.dsh/cordis.patch.yml`）**按 id 覆盖**这一行——不要再写一行 `insert`（同 id 的 insert 行不能共存）：

```yaml
- id: kid-network
  config:
    enabled: true        # false = 只关掉五个模型工具，卡片照旧
    safeMode: true       # 演示安全模式（保留字段）
    timeoutMs: 12000     # 采集 / 测速命令超时，2000–30000
```

| 字段 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | `false` 时**不注册**五个工具；卡片不受它影响 |
| `safeMode` | `true` | 演示安全模式（保留字段：只走预设目标，不做任意主机探测） |
| `timeoutMs` | `12000` | 单条命令超时（`2000`–`30000`，越界会被夹到边界值；非数字回落默认） |

`timeoutMs` 也用于卡片采集；出网命令（cip.cc / 测速）另给至少 15 秒窗口，避免被小值抢先杀掉。

## 和旧版（0.1 动态创作）的差异

0.1 版是**两个半部**：工具走 TS 编译 + 用户层 `insert` 行；卡片走「提示词 → `cordis_define` → `cordis_run`」的
内存态动态插件。0.2 删掉了 `cordis_define` 那套工具，卡片整条路作废。这一版把两个半部并进**一个静态 bundle 包**：

| 差异 | 旧版 | 现在 | 为什么 |
| --- | --- | --- | --- |
| 装载 | TS → `lib/` → 用户层 patch `insert`；卡片靠 `cordis_define` | 一个 bundle 包（host + client），一个 `install_bundle` | 0.2 已无 `cordis_define` 动态工具 |
| 工具定义 | `defineTool({ … })` | 普通对象 + `ctx.tools.register()` | bundle 走 `link:` 安装，解析不到 `@deepseek-ai/dsh-tools` |
| 参数形状 | `defineTool` 投影而来 | 写死 `NO_PARAMS` / `TARGET_PARAMS(…)` | 在 `Tool.listTools` 里投影**逐字节相同**，模型契约没变 |
| 数据通道 | `harness.handle('net:collect')` + `host.call` RPC | 同源 `GET /kid-network/collect` | 静态 bundle 用普通 HTTP 路由 |
| 取数 | 沙箱 `ctx.shell.run` | `import { execFile } from 'node:child_process'` | 静态包是普通 Node 模块 |
| 卡片样式 | 沙箱全局 `styles.insert(css)` | 自插 `<style data-plugin-css=…>` + `ctx.effect` 回收 | 没有沙箱全局了 |
| 注册时机 | 顶层 `inject = ['tools']` | `apply()` 里 `ctx.inject(['tools'], …)` 子注入 | 没有 `tools` 的 profile 也能只装卡片 |

## 自检

```bash
node --check index.js && node --check tools.js && node --check client.js
node verify.mjs
npm pack --dry-run --cache /tmp/npm-cache-dsh
```

`verify.mjs` 共 **61 项**（契约 / 语法 / 采集纯函数 / host 装载 / 路由 GET·POST·HEAD / 卡片静态检查与渲染），
全绿 `EXIT=0`。它**不打网络**：采集用注入的假文本、路由用注入的假采集、卡片用迷你 React 渲染假数据。

## 发布

`private: true` 是为了本机 `link:` 安装。真要发 npm：去掉 `private`、`npm version` 提版本、`npm publish --access public`。
`legacy/` 已在 `files` 白名单之外，**不会**被发出去。

## 目录

| 文件 | 作用 |
| --- | --- |
| `package.json` | 包定义：`main` + `exports['.']`（host）、`exports['./client']`（卡片）、`dsh.bundle.patch` + `dsh.client` |
| `index.js` | host 半部入口：子注入 `tools` 注册五个工具 + `/kid-network/collect` 路由；配置归一化；采集层（由旧 `cordis/host.js` 搬来） |
| `tools.js` | 五个模型工具的普通对象定义（不 import 任何第三方包，文本与旧版逐字一致） |
| `client.js` | 卡片半部：模块表注册 + 槽位注入 + 8 秒轮询 + 样式（IIFE 包住，避免顶层标识符撞车） |
| `cordis.patch.yml` | bundle 的 patch：一行 `insert` 装 `kid-network`（卡片 + 五个工具） |
| `verify.mjs` | 本地自检（61 项，不打网络） |
| `legacy/old-dynamic-plugin/` | 旧版（`src/` `lib/` `cordis/` `example/` `tsconfig.json`）原样存档，只作对照，不发布不加载 |
