# dsh-kid-coder · 给小朋友的编程学习启蒙插件（🥇 kidlab 系列第 1 个）

为 **DeepSeek Harness**（`@deepseek-ai/dsh-*`，Cordis 插件框架）写的小插件：
把「解释概念、出题、改作业、拆步骤、**真的跑代码看效果**」变成小朋友听得懂、有兴趣的对话。

> 背景：给家里 5-18 岁的小朋友做编程入门辅导（配合《成都小学生计算机考试与竞赛》——
> 低龄走 GESP / 趣味入门，学 Python/海龟画图打基础）。这个插件就是那个“老师”，
> 还有个能“点按钮跑代码、马上看到输出和海龟画图”的 🐵 小教室面板。

> **形态**：一个包 = 一行插件（`dsh.bundle` + `dsh.client` 同存）。
> 发布物 9 个文件、零构建步骤（纯 ESM，`index.js` / `tools.js` / `client.js` + `python/`）。

## 它能干什么

装载后，harness 会多出 **5 个工具** + 一张**可折叠的常驻卡片**：

| 工具 | 作用 |
|---|---|
| `kid_run` | **真的**在沙箱里跑一段 Python（含海龟画图），返回输出 + 是否出图 |
| `kid_explain` | 用生活比喻 + 极简示例解释一个概念或一小段代码 |
| `kid_practice` | 出一套带故事情境的编程练习题，含脚手架提示 |
| `kid_review` | 温和地检查交上来的代码：先夸、一次只给一个改进点、给 ⭐ |
| `kid_steps` | 把大目标拆成 3-5 个能立刻得到反馈的小步骤 |

**前端卡片「🐵 小教室」**：输入条上方常驻、可折叠。写代码 → 点「跑一下」→
就地显示**控制台输出**和**海龟画出来的 SVG 图形**（/ matplotlib PNG）。打开会自动跑一个
五角星示例，让小朋友一进来就看到“哇，出图了”。

设计要点：
- 4 个教学工具只产出“脚手架 + 语气约束”，真正的讲解由模型完成，零依赖、零改文件，非常安全。
- `kid_run` 才是真的执行：macOS 上用 `sandbox-exec` 降权（禁网络、禁写临时目录以外）+
  `python3 -I` 隔离模式 + 8 秒硬超时护栏，跑不完自动叫停。若沙箱在本环境不可用，自动去掉沙箱重跑一次。
- **图形**：本项目自带一个纯 Python 的 SVG 海龟记录器（`python/kidturtle.py`），
  不依赖 tkinter/matplotlib（Homebrew python 也没装 tkinter），headless 也能出图；
  matplotlib 若装了则顺带产出 PNG。图形输出为 base64 data URI，前端 `<img>` 内联显示。

## 目录结构

```
plugin-kid-coder/
├─ package.json               # 契约核心：main/exports + dsh.bundle.patch + dsh.client
├─ cordis.patch.yml           # 装载行：只 insert 一行 kid-coder
├─ index.js                   # host 半部：注册 5 个工具（子注入 tools）+ POST /kid-coder/run 路由
├─ tools.js                   # 5 个工具定义（普通对象，不 import 任何 dsh 包）+ kid_run 的沙箱执行器
├─ client.js                  # client 半部：🐵 小教室卡片（IIFE + __ModuleLoader__.load + fetch）
├─ python/                    # 前端/模型共用的 Python 运行层（随包发布）
│  ├─ kidturtle.py            # 纯 Python SVG 海龟记录器（注入成 turtle 模块）
│  ├─ kidrunner.py            # 沙箱执行器：跑代码 → 捕获 stdout + 图形 → base64(JSON)
│  └─ kid.profile             # sandbox-exec 降权 profile（deny network/写保护）
├─ verify.mjs                 # 本地自测（契约 + 五工具 + 路由 GET/POST + 沙箱跑码）
└─ legacy/old-dynamic-plugin/ # 旧「动态创作插件」存档（src/、lib/、cordis/、example/，不发布）
```

## 配置项（行 config）

在安装行上按需覆盖（默认值即下表第二列；不写 config 就是全默认）：

| 字段 | 默认 | 说明 |
|---|---|---|
| `kidName` | 小伙伴 | 称呼小朋友的名字 |
| `age` | 8 | 5-18，决定讲解复杂度 |
| `language` | zh | 讲解语言 zh / en |
| `level` | beginner | 初始难度 beginner / intermediate |
| `gamified` | true | 是否积分（⭐）式鼓励 |
| `favoriteTopic` | 空 | 偏好主题，例如 海龟画图 |
| `runTimeoutSec` | 8 | 跑代码超时（1-30 秒） |
| `sandbox` | true | 是否用 sandbox-exec 隔离跑代码 |
| `enabled` | true | 是否注册工具（关掉后卡片仍在） |

改默认值在自己的用户层 `~/.dsh/cordis.patch.yml` 里**按 id 覆盖**（别改本包的 patch）：

```yaml
- id: kid-coder
  config: { kidName: 想想, age: 8, runTimeoutSec: 12 }
```

## kid_run 的 macOS 沙箱策略

macOS 没有 Docker 式沙箱。这里用 **三层兜底** 应对“小朋友自己写的代码”这种低威胁模型：

1. **降权**：`sandbox-exec -f kid.profile`——`(deny default)` + 禁网络 + 只读系统库 +
   只允许写临时目录。这是 macOS 内置的穷人沙箱，实测可用（不可用时自动降级为不套沙箱重跑）。
2. **护栏**：`python3 -I` 隔离模式（忽略 site-packages 与环境变量）+ Python 侧 8 秒看门狗
   （`threading.Timer` + `os._exit`，绕开 GNU timeout 缺失问题）+ base64 传源码防 shell 注入。
3. **封闭**：只留 stdlib，图形用自带 SVG 记录器，不联网、不弹窗。

> 取舍：这只为保证“自家小孩玩得安全”，**不是真正的安全边界**。若将来要开放给陌生人的
> 代码，需要再上 Docker / 云端 Piston 之类的真沙箱。

## 怎么装载

**静态 bundle，一条命令装进某个 profile**（推荐，持久）：

```
plugin_manager { action: "install_bundle", target: "/Users/baixiao/Code/deepseek-harness-dev/plugin-kid-coder" }
# 或命令行等价：dsh plugin --profile web add /Users/baixiao/Code/deepseek-harness-dev/plugin-kid-coder
```

- 成功的判据是返回里出现 `"application": "applied"`；
- ⚠️ 安装本包前，用户层 `~/.dsh/cordis.patch.yml` 里**不能**再有 `kid-coder` 的 insert 行
  （同 id 会冲突），改成上面的「按 id 覆盖」写法；
- ⚠️ 首次进客户端模块表需要重启 `dsh web`（会终止当前会话），内容改动只需刷新页面。

本地自检（无需 dsh）：

```bash
node verify.mjs        # 契约 + 五工具 + 路由 GET/POST + 沙箱跑码，全绿退出码 0
```

## 许可

MIT。
