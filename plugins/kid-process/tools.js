// ============================================================
// kid-process · 模型工具层（host half 的一部分）
// 与旧版 @kidlab/dsh-kid-process 的工具集【输出逐字一致】，只有注册方式变了：
//   不再用 defineTool() 包装——那要求从 profile 的 node_modules 解析
//   @deepseek-ai/dsh-tools，而 link: 安装的 bundle 解析不到外部包；
//   改成返回普通对象，由 index.js 交给 ctx.tools.register()。
//   （`node verify-legacy-equivalence.mjs` 会拿 legacy/src/tools.ts 逐条核对。）
// 隐喻：进程 = 在工作台上干活的小工人，工作台 = 内存（见 kid-memory）。
//   - 工号（PID）   = 小工人的身份证号
//   - 师傅工号（PPID）= 谁把它带来上场的介绍人
//   - 状态          = 正在卖力干活 / 打盹等活儿 / 赖着不走的僵尸
// 全部命令硬编码常量、不拼接用户输入、免 sudo、单命令超时容错；pid 校验后才可用。
// ============================================================
import { execFile } from 'node:child_process'

/** 统一的返回形状：一段文本。 */
const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * 四个工具的参数形状，与旧版 `defineTool({ parameters: … })` 在注册表里
 * 投影出来的**完全一致**（线上 Tool.listTools 可核对），所以模型的调用契约没变：
 *   - 不收参数的（proc_count / proc_busiest）：`{type:'object',properties:{}}`
 *   - 可选参数的（proc_family）：只写 properties，不写 required
 *   - 必填参数的（proc_badge）：`required:['pid']`
 */
const NO_PARAMS = { type: 'object', properties: {} }
const OPT_PID = {
  type: 'object',
  properties: {
    pid: {
      type: 'number',
      description: '想查看的小工人工号（PID）；不填默认看总管 launchd（工号 1）这一支',
    },
  },
}
const NEED_PID = {
  type: 'object',
  properties: {
    pid: {
      type: 'number',
      description: '要查的小工人工号（PID）',
    },
  },
  required: ['pid'],
}

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

/** 从进程的可执行路径里抽出“小朋友能看懂的名字”（App 名 / 程序名）。 */
function prettyName(comm) {
  const raw = comm.trim()
  const app = raw.match(/^(?:.*\/)?(.+?)\.app\//) || raw.match(/^(?:.*\/)?(.+?)\.app$/)
  if (app) return app[1].replace(/\s+Helper.*$/, '')
  const last = raw.split('/').pop() || raw
  return last.replace(/\s+\(.*\)$/, '') || 'unknown'
}

/** KB 数（ps RSS 用 KB）转成给小朋友看的 GB/MB。 */
function humanKB(kb) {
  if (kb >= 1024 * 1024) return (kb / 1024 / 1024).toFixed(1) + ' GB'
  if (kb >= 1024) return (kb / 1024).toFixed(0) + ' MB'
  return kb.toFixed(0) + ' KB'
}

/** 把 ps 的状态缩写翻译成小朋友能懂的话。 */
function statCN(stat) {
  const s = stat.trim()
  if (s.startsWith('R')) return '正在卖力干活'
  if (s.startsWith('S')) return '在打盹等活儿'
  if (s.startsWith('Z')) return '僵尸工人（活干完了，工牌还没被收走）'
  if (s.startsWith('T')) return '被按了暂停键'
  if (s.startsWith('U')) return '在忙等不出来的活儿'
  return '待着（其他状态）'
}

/** pid 参数校验：只允许正整数（挡住注入与乱输入），通过则返回数字，否则 null。 */
function validPid(v) {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(n) && n >= 1 && n <= 4194304 ? n : null
}

/**
 * 构建 kid-process 的四个工具定义。
 * @param {{ timeoutMs: number }} config 已归一化的配置
 * @returns {object[]} 可直接交给 ctx.tools.register 的普通对象
 */
export function buildProcessTools(config) {
  const t = config.timeoutMs

  return [
    // 1. 现在有多少小工人
    {
      name: 'proc_count',
      description:
        '看看现在有多少“小工人”在这台电脑上干活——也就是进程总数，还按状态分好类：正在卖力干活的、打盹等活儿的、赖着不走的僵尸。进程就是每个打开的程序派上场的小工人，它们都在内存这张“工作台”上干活。免 sudo。返回总数和分类统计。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = await safe('工人点名', 'ps -axo stat=', t)
        if (raw.startsWith('[工人点名')) return raw
        const stats = raw.split('\n').map(s => s.trim()).filter(Boolean)
        if (!stats.length) return '[工人点名解析失败] 没拿到进程列表。'
        let running = 0, sleeping = 0, zombie = 0, other = 0
        for (const s of stats) {
          if (s.startsWith('R')) running += 1
          else if (s.startsWith('S')) sleeping += 1
          else if (s.startsWith('Z')) zombie += 1
          else other += 1
        }
        const out = []
        out.push(`【现在有多少小工人】`)
        out.push(`这台电脑上一共有 ${stats.length} 个小工人在册：`)
        out.push(`- 正在卖力干活的：${running} 个`)
        out.push(`- 在打盹等活儿的：${sleeping} 个`)
        out.push(`- 赖着不走的僵尸：${zombie} 个`)
        out.push(`- 其他状态：${other} 个`)
        out.push('')
        out.push('解释：每打开一个程序，电脑就派一个小工人上场，它们都在内存这张“工作台”上干活。')
        out.push('打盹不可怕——大部分工人其实都在等活儿（等按键盘、等点鼠标、等网络回话）。')
        if (zombie > 0) out.push('僵尸工人是干完活、工牌还没被总管收走的小工人，一般一会儿就清理掉，不用怕。')
        return out.join('\n')
      },
    },

    // 2. 谁最卖力（CPU Top）
    {
      name: 'proc_busiest',
      description:
        '找出现在干活最卖力的小工人——按 CPU 占用排序的前几名。CPU 百分比越高，代表这个小工人此刻干的活越重（比如看视频、算游戏画面）。免 sudo。返回 CPU 占用 Top 榜和给小朋友的解读。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = await safe('卖力榜', 'ps -axo pcpu=,comm= | sort -rn | head -n 16', t)
        if (raw.startsWith('[卖力榜')) return raw
        const out = ['【谁最卖力 / 干活强度 Top】']
        if (!raw.trim()) return out.concat('（暂时没有可读取的进程信息）').join('\n')
        let rank = 0
        for (const r of raw.split('\n').map(s => s.trim()).filter(Boolean)) {
          const m = r.match(/^([\d.]+)\s+(.+)$/)
          if (!m) continue
          const cpu = Number(m[1])
          const name = prettyName(m[2])
          rank += 1
          out.push(`${String(rank).padStart(2)}. ${cpu.toFixed(1).padStart(6)}%  ${name}`)
          if (rank >= 12) break
        }
        out.push('')
        out.push('说明：百分比越高，这个小工人此刻干的活越重。')
        out.push('有的工人会开好几个“分身”一起干（比如浏览器的每个标签页），名字看着一样其实是几个工人。')
        out.push('如果电脑风扇呼呼转、机身发烫，多半就是榜上最前面这几个在卖大力气啦。')
        return out.join('\n')
      },
    },

    // 3. 工人家族（谁带了谁）
    {
      name: 'proc_family',
      description:
        '看看小工人的“家族关系”——谁带来了谁。每个进程上场时都有一位“师傅”（父进程），一路往上问最终都是总管 launchd（工号 1），它负责给所有新工人发工牌。可以指定一个工号（PID）看它这一支的师承和徒弟，不填就看总管和他的直接徒弟们。免 sudo。',
      parameters: OPT_PID,
      output: TEXT_OUTPUT,
      async execute(args) {
        const a = args || {}
        const raw = await safe('进程表', 'ps -axo pid=,ppid=,comm=', t)
        if (raw.startsWith('[进程表')) return raw
        const rows = []
        for (const line of raw.split('\n')) {
          const m = line.trim().match(/^(\d+)\s+(\d+)\s+(.+)$/)
          if (m) rows.push({ pid: Number(m[1]), ppid: Number(m[2]), name: prettyName(m[3]) })
        }
        if (!rows.length) return '[进程表解析失败] 没拿到进程列表。'
        const byPid = new Map(rows.map(r => [r.pid, r]))
        const kidsOf = new Map()
        for (const r of rows) {
          const list = kidsOf.get(r.ppid) ?? []
          list.push(r)
          kidsOf.set(r.ppid, list)
        }

        const want = validPid(a.pid) ?? 1
        if (a.pid != null && !byPid.has(want)) {
          return `【工人家族】没找到工号 ${want} 的小工人，它可能已经下班啦（进程结束了）。`
        }
        const target = byPid.get(want)
        // 沿师傅链一路向上，防环、限深
        const chain = [target]
        const seen = new Set([target.pid])
        let cur = target
        while (cur.ppid > 0 && byPid.has(cur.ppid) && !seen.has(cur.ppid) && chain.length < 30) {
          seen.add(cur.ppid)
          cur = byPid.get(cur.ppid)
          chain.unshift(cur)
        }

        const out = ['【工人家族 / 谁带了谁】']
        chain.forEach((r, i) => {
          const indent = '  '.repeat(i) + (i ? ' └─ ' : '')
          const tag = i === 0 ? '，总管' : ''
          out.push(`${indent}${r.name}（工号 ${r.pid}${tag}）`)
        })
        const kids = (kidsOf.get(target.pid) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
        out.push('')
        if (kids.length) {
          out.push(`${target.name} 直接带来了 ${kids.length} 个小工人：`)
          for (const k of kids.slice(0, 15)) out.push(`  · ${k.name}（工号 ${k.pid}）`)
          if (kids.length > 15) out.push(`  ……还有 ${kids.length - 15} 个没列出来`)
        } else {
          out.push(`它没有直接带徒弟（没有下属小工人）。`)
        }
        out.push('')
        out.push('解释：每个小工人上场时都有一位“介绍人”（师傅工号 PPID）。')
        out.push('一路往上问，最后都是总管 launchd（工号 1）——电脑一开机它就上班，所有新工人的工牌都是它发的。')
        return out.join('\n')
      },
    },

    // 4. 查工牌（单进程详情）
    {
      name: 'proc_badge',
      description:
        '查一个小工人的“工牌”（进程详情）：工种（程序名）、工号 PID、师傅工号 PPID、现在的状态、上岗时间、累计干了多久、干活强度（CPU）、占了工作台多少（内存）。需要一个工号（PID），可以先问 proc_busiest 或 proc_family 拿到工号。免 sudo。',
      parameters: NEED_PID,
      output: TEXT_OUTPUT,
      async execute(args) {
        const a = args || {}
        const pid = validPid(a.pid)
        if (pid == null) return '[工牌校验失败] 请给一个正常的工号（正整数）。'
        const base = await safe(
          '工牌',
          `ps -p ${pid} -o pid=,ppid=,stat=,time=,pcpu=,pmem=,rss=`,
          t,
        )
        if (base.startsWith('[工牌')) {
          return `【小工人工牌】没找到工号 ${pid} 的小工人，它可能已经下班啦（进程结束了）。`
        }
        const f = base.trim().split(/\s+/)
        if (f.length < 7) return '[工牌解析失败] 拿到的工牌数据不对：\n' + base
        const lstart = (await safe('上岗时间', `ps -p ${pid} -o lstart=`, t)).trim()
        const commRaw = (await safe('工种', `ps -p ${pid} -o comm=`, t)).trim()
        const name = prettyName(commRaw) || 'unknown'
        const [ppid, stat, cpuTime, pcpu, pmem, rss] = [f[1], f[2], f[3], f[4], f[5], f[6]]
        const out = []
        out.push('【小工人工牌】')
        out.push(`工种（程序名）：${name}`)
        out.push(`工号（PID）：${f[0]}`)
        out.push(`师傅工号（PPID）：${ppid}${ppid === '0' ? ' —— 没有师傅，它是第一个上岗的老祖宗' : ' —— 把它带来上场的介绍人'}`)
        out.push(`现在的状态：${statCN(stat)}（${stat}）`)
        if (lstart && !lstart.startsWith('[')) out.push(`上岗时间：${lstart}`)
        out.push(`累计干活时长：${cpuTime}（到目前为止真正用电脑算力的时间）`)
        out.push(`干活强度：${Number(pcpu).toFixed(1)}%（CPU，越高越卖力）`)
        out.push(`占工作台：${Number(pmem).toFixed(1)}% 的内存 ≈ ${humanKB(Number(rss))}`)
        out.push('')
        out.push('解释：工牌就是小工人的身份证，上面写清了它是谁、谁带来的、干的什么活。')
        out.push('程序退出时工牌就作废——所以同一个程序每次打开，工号常常不一样。')
        return out.join('\n')
      },
    },
  ]
}
