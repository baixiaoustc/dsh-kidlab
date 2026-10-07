// ============================================================
// kid-coder · 模型工具层（host half 的一部分）
// 与旧版 @kidlab/dsh-kid-coder 的工具集【输出逐字一致】，只有注册方式变了：
//   不再用 defineTool() 包装——那要求从 profile 的 node_modules 解析
//   @deepseek-ai/dsh-tools，而 link: 安装的 bundle 解析不到外部包；
//   改成返回普通对象，由 index.js 交给 ctx.tools.register()。
// 五个工具：
//   kid_run       真的把一段 Python 跑起来（海龟画图/打印都行）
//   kid_explain   用小朋友能懂的话解释概念/代码
//   kid_practice  出一道带故事情境的编程练习题
//   kid_review    温和地检查小朋友交上来的代码
//   kid_steps     把大目标拆成能一步步完成的小步骤
// 只有 kid_run 会执行代码；其余四个只是「教学脚手架 + 语气约束」。
// 运行走本包 python/ 目录（kidrunner.py + kidturtle.py），零第三方依赖。
// ============================================================
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'

/** 统一的返回形状：一段文本。 */
const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * 五个工具的参数形状，与旧版 `defineTool({ parameters: … })` 在注册表里
 * 投影出来的**完全一致**（线上 Tool.listTools 可核对），所以模型的调用契约没变：
 *   - 必填单参的：`required:['code'|'topic'|'goal']`
 *   - 收可选参的：只写 properties，不写 required
 *   - 带枚举的（kid_practice.difficulty）：写 `enum`
 * 注意：`properties` 里不要额外写 `additionalProperties`——投影会多一个键，
 * 模型的调用契约就变了（见迁移指南 14.2）。
 */
const RUN_PARAMS = {
  type: 'object',
  properties: { code: { type: 'string', description: '要运行的 Python 代码' } },
  required: ['code'],
}
const EXPLAIN_PARAMS = {
  type: 'object',
  properties: {
    topic: {
      type: 'string',
      description: '要解释的概念名，例如 循环 / 变量 / print / 函数',
    },
    code: { type: 'string', description: '可选：一段待解释的真实代码' },
    maxWords: { type: 'number', description: '希望解释多短（500-2000 字）' },
  },
  required: ['topic'],
}
const PRACTICE_PARAMS = {
  type: 'object',
  properties: {
    topic: { type: 'string', description: '练习主题，例如 循环 / 变量 / 函数 / 海龟画图 / 条件判断' },
    difficulty: {
      type: 'string',
      enum: ['beginner', 'intermediate'],
      description: '难度，默认取插件配置',
    },
  },
}
const REVIEW_PARAMS = {
  type: 'object',
  properties: {
    code: { type: 'string', description: '小朋友写的代码' },
    task: { type: 'string', description: '可选：对应的题目说明' },
  },
  required: ['code'],
}
const STEPS_PARAMS = {
  type: 'object',
  properties: {
    goal: { type: 'string', description: '想完成的整体目标，例如 用海龟画一个五角星' },
  },
  required: ['goal'],
}

/** 本包 python/ 目录的绝对路径（bundle 从包内解析，link: 安装也稳）。 */
const PY_DIR = fileURLToPath(new URL('./python/', import.meta.url))

/**
 * 真跑一次 Python（base64 传源码，杜绝 shell 注入）。
 * @returns {Promise<object>} kidrunner.py 输出的 JSON（解析失败时兜底为一条 err）
 */
function runOnce(config, src, useSandbox) {
  const b64src = Buffer.from(String(src || ''), 'utf8').toString('base64')
  const id = String(Date.now()) + String(Math.floor(Math.random() * 1e4))
  const tmp = `/tmp/kidrun_${id}`
  const deadline = Math.max(2, Math.min(Number(config.runTimeoutSec) || 8, 30))
  const sand = useSandbox ? `sandbox-exec -f '${PY_DIR}kid.profile' ` : ''
  const cmd = [
    `mkdir -p ${tmp}`,
    `printf '%s' '${b64src}' | base64 -d > ${tmp}/src.py`,
    `${sand}python3 -I '${PY_DIR}kidrunner.py' ${tmp}/src.py ${deadline}`,
    `rm -rf ${tmp}`,
  ].join(' && ')
  return new Promise((resolve) => {
    execFile(
      '/bin/sh',
      ['-c', cmd],
      { timeout: (deadline + 5) * 1000, encoding: 'utf8' },
      (err, stdout, stderr) => {
        const line = (stdout || '').split('\n').filter(Boolean).pop() || ''
        try {
          resolve(JSON.parse(Buffer.from(line, 'base64').toString('utf8')))
        } catch {
          const detail = err ? String(err.message) : String(stderr || '').slice(0, 300)
          resolve({
            ok: false, timeout: false, code: -1, dur_ms: 0,
            stdout: '', stderr: '', svg: '', png: '',
            err: '无法解析运行结果' + (detail ? `（${detail}）` : ''),
          })
        }
      },
    )
  })
}

/**
 * 跑代码：默认套 sandbox-exec 降权隔离；若沙箱在本环境不可用
 * （如被外层会话沙箱套住时报 `sandbox_apply: Operation not permitted`），
 * 自动去掉沙箱重跑一次，保证功能不受环境影响。
 * 导出给 index.js 的卡片路由复用（同一条沙箱路径，避免两份逻辑漂移）。
 */
export async function runKidPython(config, src) {
  if (!config.sandbox) return runOnce(config, src, false)
  const r = await runOnce(config, src, true)
  const detail = (r && typeof r.err === 'string' ? r.err : '') + (r && typeof r.stderr === 'string' ? r.stderr : '')
  if (r && !r.ok && /sandbox_apply|Operation not permitted|sandbox-exec/i.test(detail)) {
    return runOnce(config, src, false)
  }
  return r
}

/**
 * 把“小朋友画像”喂给助教的固定一段话，
 * 让每个工具的输出都带上合适的称呼、语气和难度。
 */
function persona(config) {
  const grade =
    config.age <= 8
      ? '对世界很好奇，喜欢比喻和图示'
      : config.age <= 12
        ? '能理解更抽象的概念，但需要例子和鼓励'
        : '可以接受更严谨的解释，仍然需要亲切'
  const levelNote =
    config.level === 'beginner'
      ? '请用最基础的词，一次只讲一个概念'
      : '可以引入多个概念，并给出对比'
  return [
    `你是「${config.kidName}」的编程助教。`,
    `ta 今年 ${config.age} 岁（${grade}）。`,
    `难度：${levelNote}。`,
    config.favoriteTopic ? `ta 最近对「${config.favoriteTopic}」感兴趣。` : '',
    config.gamified
      ? '多给积分（⭐）和徽章式鼓励，先夸做对的，再轻轻说下一步。'
      : '平实鼓励即可，不用游戏化。',
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * 构建 kid-coder 的五个工具定义。
 * @param {object} config 已归一化的配置（kidName/age/level/gamified/…）
 * @returns {object[]} 可直接交给 ctx.tools.register 的普通对象
 */
export function buildKidTools(config) {
  const p = persona(config)

  return [
    {
      name: 'kid_run',
      description:
        '真的把一段 Python 代码跑起来（海龟画图/打印都行），返回运行结果、输出、是否画出了海龟图形。适合验证小朋友写的习题、把示例真的跑一遍给他看。macOS 上用 sandbox-exec 隔离，跑不完会被自动叫停。',
      parameters: RUN_PARAMS,
      output: TEXT_OUTPUT,
      async execute(args) {
        const r = await runKidPython(config, (args && args.code) || '')
        const lines = []
        if (r.timeout) lines.push('⏱️ 超时了：程序跑太久，已被叫停（模拟环境最多 ' + config.runTimeoutSec + ' 秒）。')
        else if (!r.ok && (r.err || r.stderr)) lines.push('😅 这次没跑成，下面是提示：')
        if (r.stdout) lines.push('【运行输出】\n' + r.stdout.trimEnd())
        if (r.stderr) lines.push('【报错信息】\n' + r.stderr.trimEnd())
        if (r.err) lines.push('【编译问题】\n' + r.err.trimEnd())
        if (r.svg) lines.push('🎨 画出了海龟图形（前端卡片会显示成图）。')
        if (r.png) lines.push('🖼️ 生成了 matplotlib 图形。')
        if (!lines.length) lines.push('（运行完成，没有任何输出。）')
        lines.push('', `用时 ${r.dur_ms}ms`)
        return lines.join('\n')
      },
    },

    {
      name: 'kid_explain',
      description:
        '用小朋友能听懂的方式解释一个编程概念或一小段代码。适合变量、循环、函数、if、列表等基础概念。',
      parameters: EXPLAIN_PARAMS,
      output: TEXT_OUTPUT,
      async execute(args) {
        const a = args || {}
        const target = String(a.topic || '').trim() || '一段代码'
        const words = a.maxWords && a.maxWords > 0 ? a.maxWords : 800
        return [
          p,
          '',
          `任务：给 ${config.kidName} 解释「${target}」。`,
          `要求：${words} 字以内；先用 1 个生活里的比喻；再给 1 个 3-5 行的极简代码示例；最后 1 句“想想看”提问。避免术语堆砌。`,
          a.code ? `待解释代码：\n\`\`\`\n${a.code}\n\`\`\`` : '',
        ]
          .filter(Boolean)
          .join('\n')
      },
    },

    {
      name: 'kid_practice',
      description:
        '出一道适合小朋友的编程练习题（默认以 Python 为例），带故事情境、脚手架提示和期望输出。',
      parameters: PRACTICE_PARAMS,
      output: TEXT_OUTPUT,
      async execute(args) {
        const a = args || {}
        const topic = (a.topic && String(a.topic).trim()) || config.favoriteTopic || '变量'
        const lvl = a.difficulty || config.level
        return [
          p,
          '',
          `任务：给 ${config.kidName} 出一道「${topic}」练习题（难度 ${lvl}）。`,
          '题目要包含四块：',
          '1. 一个 1-2 句的、小朋友喜欢的故事情境（动物/宝藏/太空/海底等）；',
          '2. 明确要求（输入/输出是什么）；',
          '3. 脚手架提示（从哪一步开始写，给 2-3 个提示而不是直接给答案）；',
          '4. 一个期望示例（运行后应该看到什么）。',
          '最后加一句：“写完了按这个按钮让我看看！”',
        ].join('\n')
      },
    },

    {
      name: 'kid_review',
      description:
        '温和地检查小朋友交上来的代码：先夸做得好的，再指出一个最值得改进的地方，一次只给一步。',
      parameters: REVIEW_PARAMS,
      output: TEXT_OUTPUT,
      async execute(args) {
        const a = args || {}
        return [
          p,
          '',
          `任务：检查 ${config.kidName} 交上来的代码。`,
          '要求（很重要）：',
          '- 先明确夸 1-2 件做对的事（哪怕是“认真缩进了”“用了变量”）；',
          config.gamified ? '- 给 1-3 颗 ⭐ 作为完成度；' : '',
          '- 只指出 1 个最值得改进的点，不要列出所有毛病；',
          '- 改进建议要非常具体（比如“这一行改成 x += 1 试试”），不要只说“有 bug”；',
          '- 语气像一个耐心的朋友，不用“错误”“失败”这类词；',
          '- 结尾给一个继续挑战的小问题。',
          `题目背景（如有）：${a.task || '（无）'}`,
          '',
          `小朋友的代码：\n\`\`\`\n${a.code}\n\`\`\``,
        ]
          .filter(Boolean)
          .join('\n')
      },
    },

    {
      name: 'kid_steps',
      description:
        '把一个较大的目标拆成 3-5 个小朋友能一步步完成的小步骤，每个步骤都能独立做到并得到成就感。',
      parameters: STEPS_PARAMS,
      output: TEXT_OUTPUT,
      async execute(args) {
        const a = args || {}
        return [
          p,
          '',
          `任务：把「${a.goal}」拆成 3-5 个小步骤给 ${config.kidName}。`,
          '要求：',
          '- 每一步都要能独立完成并且能马上看到结果/反馈；',
          '- 每步给一句“做完你就会……”的即时成就感描述；',
          config.gamified ? '- 给每一步配 1-2 颗 ⭐ 和一句鼓励；' : '',
          '- 步骤之间难度递增，最后一步是“把前面拼起来”；',
          '- 用小朋友懂的话，避免大词。',
        ]
          .filter(Boolean)
          .join('\n')
      },
    },
  ]
}
