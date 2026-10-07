// ============================================================
// kid-sysmon · 模型工具层（host half 的一部分）
// 与旧版 @kidlab/dsh-kid-sysmon 的工具【输出逐字一致】，只把注册方式
// 从 defineTool() 改成返回普通对象（bundle 里不 import @deepseek-ai/*）。
// 唯一工具：
//   system_status —— 查询 CPU/内存/磁盘/网络/电池/负载/Top 进程（免 sudo、无第三方依赖）
// 真机执行 macOS 命令拿实时数据；每个维度独立容错，需要 root 的项如实标注“需权限”。
// ============================================================
import { execFile } from 'node:child_process'

/** 在 macOS 上跑一条 shell 命令，返回 stdout 文本；失败时抛错（由调用方兜底）。 */
function run(cmd, timeoutMs) {
  return new Promise((resolve, reject) => {
    execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, encoding: 'utf8' }, (err, stdout) => {
      if (err) reject(err)
      else resolve(stdout)
    })
  })
}

/** 包一层：单条采集命令失败不拖垮整体，转为一行错误说明。 */
async function safe(label, cmd, timeoutMs) {
  try {
    return await run(cmd, timeoutMs)
  } catch (e) {
    return `[${label} 采集失败] ${e instanceof Error ? e.message : String(e)}`
  }
}

/** 读文本首行中的键值。 */
function lineOf(text, needle) {
  const l = text.split('\n').find((l) => l.includes(needle))
  return l ? l.trim() : ''
}

const procModel = async (t) =>
  await safe('系统', 'sw_vers && echo "---" && uname -m && echo "---" && sysctl -n hw.model && echo "---" && sysctl -n hw.ncpu', t)

/** 统一返回形状：一段文本。 */
const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * 免 sudo 采集一个或多个维度的 MacBook 资源使用情况。
 * @param {object} config 已归一化的配置（enabled/verbose/timeoutMs）
 * @returns {object[]} 可直接交给 ctx.tools.register 的普通对象
 */
export function buildSysmonTools(config) {
  return [
    {
      name: 'system_status',
      description:
        '查询这台 MacBook 的资源使用情况：CPU、内存、磁盘、网络、电池、系统负载、Top 进程。免 sudo、免第三方工具。返回人类可读的分段文本。',
      parameters: {
        type: 'object',
        properties: {
          scope: {
            type: 'string',
            enum: ['all', 'cpu', 'mem', 'disk', 'net', 'battery', 'load', 'process'],
            description:
              '采集范围。默认 all（全部）；也可只取某一维度，如 cpu / mem / disk / net / battery / load / process。',
          },
        },
      },
      output: TEXT_OUTPUT,
      async execute(args) {
        const t = config.timeoutMs
        const scope = (args && args.scope) || 'all'
        const want = (k) => scope === 'all' || scope === k

        const lines = []
        const v = config.verbose

        if (want('cpu')) {
          const brand = (await safe('CPU 型号', 'sysctl -n machdep.cpu.brand_string', t)).trim()
          // 高负载时两次采样可能超时，失败则降级到单帧均值（毫秒级，绝不超时）
          let topRaw = await safe('CPU 占用', 'top -l 2 -n 0 -s 1 | grep "CPU usage" | tail -n 1', t)
          if (topRaw.startsWith('[CPU')) {
            topRaw = await safe('CPU 占用', 'top -l 1 -n 0 | grep "CPU usage"', t)
          }
          lines.push('【CPU】', `型号: ${brand || '未知'}`)
          if (topRaw.startsWith('[CPU')) {
            lines.push('占用: 无法采样（' + topRaw + ')')
          } else {
            const m = topRaw.match(/CPU usage:\s*([\d.]+)%\s*user,\s*([\d.]+)%\s*sys(?:,\s*([\d.]+)%\s*idle)?/)
            if (m) {
              const u = parseFloat(m[1]), s = parseFloat(m[2])
              const usage = (u + s).toFixed(1)
              const idleDesc = m[3] !== undefined ? ` / idle ${m[3]}%` : ''
              lines.push(`占用: ${usage}% (user ${m[1]}% / sys ${m[2]}%${idleDesc})`)
              if (v) lines.push(`  原始: ${topRaw}`)
            } else {
              const raw = topRaw.split('\n').pop()?.trim()
              lines.push(raw ? `占用: ${raw}` : '占用: 未能解析')
            }
          }
          lines.push('')
        }

        if (want('mem')) {
          const totalB = (await safe('内存总量', 'sysctl -n hw.memsize', t)).trim()
          const totalGiB = totalB && /^\d+$/.test(totalB) ? (parseInt(totalB) / 1073741824).toFixed(1) : '?'
          const mp = await safe('内存压力', 'memory_pressure', t)
          const pctLine = lineOf(mp, 'free percentage')
          const pct = pctLine.match(/free percentage:\s*([\d.]+)%/)
          const usedPct = pct ? (100 - parseFloat(pct[1])).toFixed(1) : null
          lines.push('【内存】', `总量: ${totalGiB} GiB`)
          lines.push(usedPct ? `已用: 约 ${usedPct}% (系统内存空闲 ${pct[1]}%)` : '已用: 未能解析空闲百分比')
          const swap = await safe('Swap', 'sysctl -n vm.swapusage', t)
          const s = lineOf(swap, 'total =')
          if (s) lines.push(`交换: ${s}`)
          if (v) {
            const vs = await safe('vm_stat', 'vm_stat', t)
            lines.push('  vm_stat:\n' + vs.split('\n').slice(0, 8).join('\n'))
          }
          lines.push('')
        }

        if (want('disk')) {
          const df = await safe('磁盘', "df -h / | awk 'NR==1 || NR==2'", t)
          lines.push('【磁盘】')
          const rows = df.split('\n').filter(Boolean)
          if (rows.length >= 2) {
            lines.push(`根分区: ${rows[1].trim()}`)
          } else {
            lines.push('未能解析磁盘用量')
          }
          lines.push('')
        }

        if (want('net')) {
          const gwRaw = await safe('默认网关', "route -n get default | grep -E 'gateway|interface'", t)
          const gw = gwRaw.split('\n').map((l) => l.trim()).filter(Boolean)
          lines.push('【网络】', ...(gw.length ? gw : ['默认路由: 未能解析']))
          const ping = await safe('延迟', 'ping -c 3 -t 5 223.5.5.5 2>&1 | tail -n 2', t)
          const rtt = lineOf(ping, 'round-trip')
          lines.push(rtt ? `到公网(223.5.5.5): ${rtt}` : '到公网延迟: 未测到 (可能断网)')
          const ifRaw = await safe('接口流量', 'netstat -ib 2>/dev/null | grep -E "en0|en1" | head -n 2', t)
          if (!ifRaw.startsWith('[网络')) lines.push('接口流量(B):\n' + ifRaw)
          lines.push('')
        }

        if (want('battery')) {
          const batt = await safe('电池', 'pmset -g batt', t)
          const l = lineOf(batt, ':')
          lines.push('【电池】', l || '非便携电源信息')
          if (!batt.startsWith('[电池')) {
            const spec = await safe('电池健康', 'system_profiler SPPowerDataType 2>/dev/null | grep -E "Cycle Count|Maximum Capacity|Condition" | head -n 5', t)
            const h = spec.split('\n').map((s) => s.trim()).filter(Boolean)
            if (h.length) lines.push(...h)
          }
          lines.push('')
        }

        if (want('load')) {
          const up = (await safe('负载', 'uptime', t)).trim()
          const lm = up.match(/load averages?: ([\d.]+) ([\d.]+) ([\d.]+)/)
          lines.push('【负载/运行时间】')
          lines.push(lm ? `Load(1/5/15m): ${lm[1]} / ${lm[2]} / ${lm[3]}` : up || '未能读取 uptime')
          const procs = await safe('进程/线程', 'sysctl -n hw.ncpu && ps -Ao pid= 2>/dev/null | wc -l && top -l 1 -n 0 | grep "Processes:"', t)
          const pl = procs.split('\n').filter(Boolean)
          if (pl.length >= 2) lines.push(`进程数: ${pl[1].trim()} (逻辑核 ${pl[0].trim()})`)
          lines.push('')
        }

        if (want('process')) {
          const top = await safe('Top 进程', 'ps -Arco pid,pcpu,pmem,comm | head -n 12', t)
          lines.push('【Top 进程 (按 CPU)】')
          lines.push(top)
          lines.push('')
        }

        const systs = await procModel(t)
        lines.push('【系统】')
        if (!systs.startsWith('[系统')) {
          const parts = systs.split('---').map((s) => s.trim()).filter(Boolean)
          if (parts[0]) lines.push(parts[0].split('\n').join(' | '))
          if (parts[1]) lines.push(`架构: ${parts[1]}`)
          if (parts[2]) lines.push(`机型: ${parts[2]}`)
          if (parts[3]) lines.push(`逻辑核: ${parts[3]}`)
        } else {
          lines.push('系统信息读取失败')
        }

        return lines
          .filter((l) => l !== '')
          .join('\n')
          .replace(/^\n+|\n+$/g, '')
      },
    },
  ]
}
