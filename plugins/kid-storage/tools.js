// ============================================================
// kid-storage · 模型工具层（host half 的一部分）
// 与旧的 @kidlab/dsh-kid-storage 工具集【输出完全一致】，只有注册方式变了：
//   不再用 defineTool() 包装——那要求从 profile 的 node_modules 解析
//   @deepseek-ai/dsh-tools，而 link: 安装的 bundle 解析不到外部包
//   （本 checkout 里那份 store 副本还配错了 dsh-llm，直接 import 就报错）；
//   改成返回普通对象，由 index.js 交给 ctx.tools.register()。
// 隐喻：硬盘 = 大行李箱 / 大仓库，能装多少是有限度的。
// 全部命令硬编码、不拼接用户输入、免 sudo、单命令超时容错。
// ============================================================
import { execFile } from 'node:child_process'

/** 统一的返回形状：一段文本。 */
const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * 这三个工具都不收参数。形状与旧版 `defineTool({ parameters: {} })` 在注册表里
 * 投影出来的**完全一致**（`{type:'object',properties:{}}`，线上 Tool.listTools 可核对），
 * 所以模型的调用契约没有变化。
 */
const NO_PARAMS = { type: 'object', properties: {} }

/** 在 macOS 上跑一条 shell 命令，返回 stdout 文本；失败时抛错（由调用方兜底）。 */
function run(cmd, timeoutMs) {
  return new Promise((resolve, reject) => {
    execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, encoding: 'utf8' }, (err, stdout) => {
      if (err) reject(err)
      else resolve(stdout)
    })
  })
}

/** 包一层：单条命令失败不拖垮整体，转为一行错误说明。 */
async function safe(label, cmd, timeoutMs) {
  try {
    return await run(cmd, timeoutMs)
  } catch (e) {
    return `[${label} 采集失败] ${e instanceof Error ? e.message : String(e)}`
  }
}

/**
 * 构建 kid-storage 的三个工具定义。
 * @param {{ timeoutMs: number }} config 已归一化的配置
 * @returns {object[]} 可直接交给 ctx.tools.register 的普通对象
 */
export function buildStorageTools(config) {
  const t = config.timeoutMs

  return [
    // 1. 仓库全景：各分区容量
    {
      name: 'storage_boxes',
      description:
        '看一下这台电脑的“大行李箱/大仓库”——把硬盘分成几个格子（分区/挂载点），每个格子能装多大、已经装了多少、还剩多少空位。适合解释“存储空间是有限的”。免 sudo。返回分段文本。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        // df -k：一行一个挂载点，KB 为单位。
        const raw = (await safe('磁盘分区', 'df -k -H 2>/dev/null || df -k', t)).trim()
        if (raw.startsWith('[磁盘分区')) return raw
        const lines = raw.split('\n').map(s => s.trim()).filter(Boolean)
        const rows = lines.slice(1).filter(l => !l.startsWith('map') && l.indexOf('/') !== -1)
        const out = ['【分区 / 大仓库的格子】']
        out.push('Filesystem  容量      已用      可用      已用%  挂载点')
        for (const l of rows.slice(0, 12)) {
          const p = l.split(/\s+/)
          if (p.length < 9) continue
          const mount = p[p.length - 1]
          out.push(`${p[0]}  ${p[1]}  ${p[2]}  ${p[3]}  ${p[4]}  ${mount}`)
        }
        // 汇总“根卷可用空间”——最常给小朋友讲的那个数
        const root = rows.find(r => r.split(/\s+/).pop() === '/')
        if (root) {
          const p = root.split(/\s+/)
          const avail = p[3] || '?'
          const pct = p[4] || '?'
          out.push('')
          out.push(`关键一句：整个系统盘（/）还能放约 ${avail} 的新东西，已用了 ${pct}。`)
        }
        out.push('')
        out.push('解释：每个「格子」就是硬盘分成的一块区域，装满就放不下新东西啦。')
        return out.join('\n')
      },
    },

    // 2. 我的仓库里装了什么：主目录各子文件夹占用（跳过 Library，快且免沙箱拒绝）
    {
      name: 'storage_home',
      description:
        '看看“我的家”（用户主目录）里，哪些东西最占地方：照片、下载、文档、音乐、视频……每个文件夹各占多大。适合让小朋友意识到“照片/视频很占地方”。免 sudo、快，不扫系统目录。返回排序后的占用榜。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const home = process.env.HOME || '/Users/baixiao'
        // 只量用户可控的常见文件夹（跳过 Library 等系统大数据，避免慢/沙箱拒绝）
        const targets = ['Desktop', 'Documents', 'Downloads', 'Movies', 'Music', 'Pictures', 'Public']
          .map((d) => `"${home}/${d}"`).join(' ')
        // du -sk：KB 数；纯数字排序（不依赖 GNU sort -h）；每项独立容错
        const raw = await safe('主页占用', `du -sk -x ${targets} 2>/dev/null | sort -rn | head -n 15`, t)
        if (raw.startsWith('[主页占用')) return raw
        const bad = !raw.trim()
        const out = ['【主目录里谁最占地方】（从大到小）']
        if (bad) return out.concat('（没有可读取的文件夹，或都还是空的）').join('\n')
        for (const r of raw.split('\n').map(s => s.trim()).filter(Boolean)) {
          const m = r.match(/^(\d+)\s+(".*"|\S.*)$/)
          if (m) out.push(`${m[1].padStart(9)} KB  ${m[2].replace(home, '~').replace(/"/g, '')}`)
        }
        out.push('')
        out.push('提示：这些是“我家”（主目录）最常装东西的格子，照片/下载往往最占地方。')
        return out.join('\n')
      },
    },

    // 3. 大件行李：找最大的几个文件夹
    {
      name: 'storage_heavy',
      description:
        '找出这台电脑上最“重”的几件大行李——占用空间最大的文件夹。带小朋友一起看看“谁的玩具最大、装满了仓库”。只扫用户主目录，快、免 sudo。返回按大小排序的前 12 名。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const home = process.env.HOME || '/Users/baixiao'
        // 只扫用户可控目录，逐层列出“大件”，避免全盘（Library）太慢
        const targets = ['Desktop', 'Documents', 'Downloads', 'Movies', 'Music', 'Pictures']
          .map((d) => `"${home}/${d}"`).join(' ')
        // du -d 1 -k：每个目标目录下展开一层；纯数字降序（-s 与 -d 冲突，故不写 -s）。
        const raw = await safe('大件行李', `du -d 1 -k -x ${targets} 2>/dev/null | sort -rn | head -n 12`, t)
        if (raw.startsWith('[大件行李')) return raw
        const out = ['【最重的大件行李 Top 12】']
        if (!raw.trim()) return out.concat('（没有可读取的大件行李，或都还是空的）').join('\n')
        for (const r of raw.split('\n').map(s => s.trim()).filter(Boolean)) {
          const m = r.match(/^(\d+)\s+(".*"|\S.*)$/)
          if (m) out.push(`${m[1].padStart(9)} KB  ${m[2].replace(home, '~').replace(/"/g, '')}`)
        }
        out.push('')
        out.push('说明：这些是大仓库里占位置最多的“大箱子”，一起就占了最多空间。')
        return out.join('\n')
      },
    },
  ]
}
