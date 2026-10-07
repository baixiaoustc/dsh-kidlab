# @kidlab/dsh-kid-network · 网络启蒙（数据信怎么旅行）

给小朋友的「网络启蒙」插件，kid 系列成员之一（同族：`plugin-kid-sysmon` 资源、`plugin-kid-storage`
仓库、`plugin-kid-memory` 工作台、`plugin-kid-process` 小工人、`plugin-kid-security` 城堡守卫、
`plugin-kid-coder` 编程助教、`plugin-kid-3d` 积木工坊）。

它回答小朋友最容易问的那几个问题：**我在网上的名字是什么？数据是怎么一站一站跑过去的？
网速有多快？家里还连着谁？网址怎么变成门牌号？** 全部**免 sudo、不需要第三方依赖**，
只调用 macOS 自带命令 + 一个测速下载。

## 它能干什么

装载后，harness 会多出 **5 个工具**：

| 工具 | 作用 | 参数 |
| --- | --- | --- |
| `net_my_identity` | 查这台电脑在网络上的「身份」：局域网 IP（家里给的名字）、默认网关（出口大门）、DNS（翻译官）、公网 IP + 位置 + 运营商 | 无 |
| `net_trace_trip` | 追踪一封「数据信」从这台电脑出发，一站一站跳到目标网站（traceroute，最多 15 跳、每跳只问 1 次） | `target`：baidu / taobao / aliyun / qq / bilibili |
| `net_test_speed` | 实测下载网速：从一个固定测速地址下载 3 MB，算出每秒收到多少数据 | 无 |
| `net_who_is_home` | 看这台电脑当前「认识」的局域网邻居：IP、MAC、主机名，有的会显示手机/电脑的品牌 | 无 |
| `net_dns` | 演示「网址翻译官」：把小朋友看的网址翻译成电脑真正用来找路的 IP（`dig +short`） | `target`：同上 |

`target` 只能从预设列表里选（不允许小朋友把任意主机名喂进去），这是插件的**安全边界**。

## 安装

这个包是**工具插件**（没有前端卡片、没有 `dsh.bundle.patch`），本机的装法是**用户层 insert 一行**：

```yaml
# ~/.dsh/cordis.patch.yml
- insert:
    - id: kid-network
      name: '@kidlab/dsh-kid-network'
      config:
        enabled: true
        safeMode: true
        timeoutMs: 12000
```

包名 `@kidlab/dsh-kid-network` 由 `deepseek-harness/node_modules/@kidlab/dsh-kid-network`
（软链到本目录）解析；`dsh web` 的工作目录就是 `deepseek-harness/`，所以这条路走得通。
改完 `src/` 记得重新编译到 `lib/`（harness 实际加载的是 `lib/index.js`）：

```bash
./deepseek-harness/node_modules/.bin/tsc -p plugin-kid-network/tsconfig.json
```

host 插件在进程里**加载即缓存**，改完要重启 `dsh web`（或开新会话）才会生效。

## 配置

| 配置项 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 是否启用整套工具；`false` 时一个工具都不注册 |
| `safeMode` | `true` | 演示安全模式（保留字段：只走预设目标，不做任意主机探测） |
| `timeoutMs` | `12000` | 采集 / 测速命令超时（2000~30000），慢命令不会卡住整体 |

覆盖默认值时**按 id 覆盖**，不要再 insert 一行同 id 的：

```yaml
- id: kid-network
  config: { timeoutMs: 20000 }
```

## 沙箱里跑要注意

这个插件是**真的发网络请求**的，所以在受限沙箱/离线环境里：

- `net_test_speed` 需要连 `https://speed.cloudflare.com/__down?bytes=3000000`，不通就返回失败提示；
- `net_trace_trip` 依赖 `traceroute`（系统自带），权限不足时后面的跳数会显示 `*`；
- 本机实测补充：**ESM 的 node 进程一发网络连接就可能 `SecItemCopyMatching -67674` 段错误**
  （keychain 探测），而同一个请求用 `curl` 或 `node -e`（CommonJS）就正常 —— 这是本沙箱的毛病，
  不是插件的问题；插件本身用的是 `node:child_process` 跑系统命令，不受影响。

## 自检

这个包**还没有**自己的自检脚本（`verify/`）。目前的验法是：

1. `cordis_inspect_list` → host `Tool` → `listTools`，确认 5 个 `net_*` 工具都在注册表里；
2. 直接调用 `net_my_identity` / `net_dns`（这两个最稳），看返回是不是分段中文；
3. `net_test_speed`、`net_trace_trip` 在有网环境再试。

同族的 `plugin-kid-3d` 有完整的 `verify/*.mjs`（selftest 70 项 / card 112 项 / live 31 项），
可以照那个写法补一份「假 exec 上下文」的离线自检。

## 目录

```
plugin-kid-network/
├─ package.json      # 包元数据（无 dsh.client，无 bundle patch）
├─ tsconfig.json
├─ src/
│  ├─ index.ts       # 插件入口：注册 5 个工具
│  ├─ tools.ts       # 5 个工具的定义与儿童向回话文案
│  └─ config.ts      # 配置 schema 与默认值
├─ lib/              # 编译产物（harness 实际加载的就是这里）
├─ cordis/           # 本机开发用的 cordis 配置样例
└─ example/          # 独立跑一跑的示例
```
