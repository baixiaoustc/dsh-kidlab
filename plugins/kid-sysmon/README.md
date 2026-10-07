# @kidlab/dsh-kid-sysmon · 资源监控（这台电脑忙不忙）

给小朋友的「电脑资源」插件，kid 系列成员之一（同族：`plugin-kid-network` 网络、
`plugin-kid-storage` 仓库、`plugin-kid-memory` 工作台、`plugin-kid-process` 小工人、
`plugin-kid-security` 城堡守卫、`plugin-kid-coder` 编程助教、`plugin-kid-3d` 积木工坊）。

它把「电脑用得多不多」翻译成小朋友听得懂的话：CPU 有几个小工人在干活、内存工作台摊了多少、
硬盘还剩多少空位、电池还能撑多久、系统有多累、谁最占资源。
**全部免 sudo、不需要第三方依赖**，只调用 macOS 自带命令（`sysctl` / `top` / `vm_stat` /
`df` / `pmset` / `ps` / `netstat` / `uptime` / `system_profiler`）。

> 和 `plugin-kid-network` 的分工：本插件讲「这台电脑用得多不多」（含网络速率/流量这一列），
> 网络插件讲「电脑怎么连上网、数据怎么去远方」。

## 它能干什么

装载后，harness 会多出 **1 个工具**：

| 工具 | 作用 | 参数 |
| --- | --- | --- |
| `system_status` | 一次查询这台 MacBook 的资源：CPU、内存、磁盘、网络、电池、系统负载、Top 进程。**免 sudo、免第三方工具**，返回人类可读的分段中文 | `scope?`：`all`（默认）/ `cpu` / `mem` / `disk` / `net` / `battery` / `load` / `process` |

- `scope` 只取其中一维，比 `all` 快很多（模型想追问「内存到底谁占的」时只查 `mem` 就够）；
- 需要 root 才能读的项（比如温度）会**如实标注「需权限」**，不会中断整次采集；
- 单条命令有超时，某条命令卡住或失败只让对应那一段降级，不影响其它维度。

## 安装

这个包是**工具插件**（没有前端卡片、没有 `dsh.bundle.patch`），本机的装法是**用户层 insert 一行**：

```yaml
# ~/.dsh/cordis.patch.yml
- insert:
    - id: kid-sysmon
      name: '@kidlab/dsh-kid-sysmon'
      config:
        enabled: true
        verbose: false
        timeoutMs: 8000
```

包名 `@kidlab/dsh-kid-sysmon` 由 `deepseek-harness/node_modules/@kidlab/dsh-kid-sysmon`
（软链到本目录）解析；`dsh web` 的工作目录就是 `deepseek-harness/`，所以这条路走得通。
改完 `src/` 记得重新编译（harness 实际加载的是 `lib/index.js`）：

```bash
./deepseek-harness/node_modules/.bin/tsc -p plugin-kid-sysmon/tsconfig.json
```

host 插件在进程里**加载即缓存**，改完要重启 `dsh web`（或开新会话）才会生效。

另外这一族的「动态宿主工具白名单」里给 `system_status` 开了口子（kid-coder 之类的动态插件
想调用它），见用户层补丁的 `cordis-host-runner.hostToolCalls`：

```yaml
- id: cordis-host-runner
  config:
    hostToolCalls:
      - tool: system_status
        timeoutMs: 8000
```

## 配置

| 配置项 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 是否启用；`false` 时一个工具都不注册 |
| `verbose` | `false` | 每个维度是否附带关键原始命令输出片段（排查用，给小朋友看时保持 `false`） |
| `timeoutMs` | `8000` | 采集命令超时（1000~30000），避免个别命令卡住整个调用 |

覆盖默认值时**按 id 覆盖**，不要再 insert 一行同 id 的：

```yaml
- id: kid-sysmon
  config: { timeoutMs: 15000, verbose: true }
```

## 为什么用顶层 `inject`（而不是子注入）

`plugin-kid-sysmon` / `plugin-kid-network` 是**纯工具插件**：它们只注册模型工具，没有常驻卡片、
没有自己的 HTTP 路由，所以 `export const inject = ['tools']` 就够——tools 不在时整行等一会儿即可，
等不到也没有副作用。

（`plugin-kid-3d` / `plugin-kid-security` 那种「一个包同时给工具 + 卡片」的合并包才**必须**用
`ctx.inject(['tools'], child => …)` 子注入：卡片的两条路由要留在 `apply` 顶层直接挂，
否则 tools 缺席时整行不起，作品面板也跟着消失。见《DSH插件迁移指南》§14。）

## 自检

这个包**还没有**自己的自检脚本（`verify/`）。目前的验法是：

1. `cordis_inspect_list` → host `Tool` → `listTools`，确认 `system_status` 在注册表里；
2. 直接调用 `system_status`（先 `scope: 'mem'` 最快），看返回是不是分段中文 + 有没有「需权限」标注；
3. 想离线验的话，照 `plugin-kid-3d/verify/selftest.mjs` 的写法做一个「假 exec 上下文」，
   把命令输出换成固定样例，断言分段拼接与降级文案。

## 目录

```
plugin-kid-sysmon/
├─ package.json      # 包元数据（无 dsh.client，无 bundle patch）
├─ tsconfig.json
├─ src/
│  ├─ index.ts       # 插件入口：注册 1 个工具
│  ├─ tools.ts       # system_status 的定义、命令表与儿童向解读文案
│  └─ config.ts      # 配置 schema 与默认值
├─ lib/              # 编译产物（harness 实际加载的就是这里）
├─ cordis/           # 本机开发用的 cordis 配置样例
└─ example/          # 独立跑一跑的示例
```
