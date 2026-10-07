// ============================================================
// kid-sysmon · 数据采集（host half 的一部分）
// 把旧版动态插件的 cordis/host.js 搬成一个纯函数：用 node 内置 child_process
// 跑一批只读命令，解析成卡片要的结构化数据，供 HTTP 路由 /kid-sysmon/collect 调用。
// 与旧版相比：不再依赖 cordis 的 shell 服务、也不再走 harness.invokeHostTool 的
// 宿主白名单通道——「最忙进程」直接 ps 取（bundle 的 host 半部本就在宿主进程里）。
// 单条命令失败不影响其它字段（返空字符串由解析器兜底为 null）。
// ============================================================
import { execFile } from 'node:child_process'

/** 跑一条只读命令，失败返回空串（不抛）。 */
function run(cmd, timeoutMs) {
  return new Promise((resolve) => {
    execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, encoding: 'utf8' }, (err, stdout) => {
      resolve(err ? '' : (stdout || ''))
    })
  })
}

// macOS iostat -w 1 -c 2 末尾数据行是 9 列：KB/t tps MB/s us sy id 1m 5m 15m。
// CPU 占用 = us + sy（第 4、5 列）。
// ⚠️ 旧版 cordis/host.js 误取第 1、2 列（磁盘 KB/t、tps），导致卡片显示几百甚至几千 % —— 这里修正。
const parseCpu = (s) => {
  const lines = s.trim().split('\n')
  const last = lines[lines.length - 1]
  if (!last) return null
  const nums = last.trim().split(/\s+/)
  if (nums.length >= 6) {
    const us = parseFloat(nums[3]), sy = parseFloat(nums[4])
    if (Number.isFinite(us) && Number.isFinite(sy)) return { pct: Math.round((us + sy) * 10) / 10 }
  }
  // 兜底：极少数情况 iostat 只回了 us sy id 三列
  const m = last.match(/^\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!m) return null
  const usage = (parseFloat(m[1]) || 0) + (parseFloat(m[2]) || 0)
  return { pct: Math.round(usage * 10) / 10 }
}
const parseMem = (s) => {
  const free = s.match(/free percentage:\s*([\d.]+)%/i)
  if (!free) return null
  return { pct: Math.round((100 - parseFloat(free[1])) * 10) / 10 }
}
const parseDisk = (s) => {
  const lines = s.split('\n').filter((l) => l.trim().length)
  if (lines.length < 2) return null
  const parts = lines[1].trim().split(/\s+/)
  const cap = parts[1], avail = parts[3]
  const use = (lines[1] || '').match(/(\d+)%/)
  return { cap: cap || '?', avail: avail || '?', pct: use ? parseInt(use[1]) : null }
}
const parseBatt = (s) => {
  const l = s.split('\n').find((x) => x.includes('%'))
  if (!l) return null
  const pct = l.match(/(\d+)%/)
  const state = l.includes('charging') ? 'charging'
    : l.includes('charged') ? 'full'
    : l.includes('discharging') ? 'discharging' : 'unknown'
  return { pct: pct ? parseInt(pct[1]) : null, state }
}
const parseLoad = (s) => {
  const m = s.match(/load averages?: ([\d.]+) ([\d.]+) ([\d.]+)/)
  return m ? { load1: m[1], load5: m[2], load15: m[3] } : null
}
/** ps -Arco pid,pcpu,pmem,comm 的首行 → 最忙进程 */
const parseTopProc = (text) => {
  const lines = (text || '').split('\n')
  for (const l of lines) {
    const t = l.trim()
    if (!t || t.startsWith('【') || t.startsWith('[')) continue
    const m = t.match(/^\s*\d+\s+([\d.]+)\s+[\d.]+\s+(.*)$/)
    if (m) {
      const pct = parseFloat(m[1])
      const name = m[2].trim().split('/').pop() || m[2].trim()
      return { name, pct: Math.round(pct * 10) / 10 }
    }
  }
  return null
}

/**
 * 采集一次体检数据。
 * @param {object} config 已归一化配置（timeoutMs）
 * @param {string} scope 目前只支持 all（保留参数以便将来按维度裁剪）
 * @returns {Promise<object>} { scope, cpu, mem, disk, batt, load, top, topProc, ts }
 */
export async function collect(config, scope = 'all') {
  const t = Number(config && config.timeoutMs) || 8000
  const [cpuRaw, sysRaw, memRaw, diskRaw, battRaw, loadRaw, topRaw] = await Promise.all([
    run('iostat -w 1 -c 2 | tail -1', t),
    run('sysctl -n machdep.cpu.brand_string; echo; sysctl -n hw.ncpu', t),
    run("sysctl -n hw.memsize; memory_pressure 2>/dev/null | grep 'free percentage'", t),
    run('df -h /', t),
    run('pmset -g batt', t),
    run('uptime', t),
    run('ps -Arco pid,pcpu,pmem,comm | head -8', t),
  ])
  // sysRaw = brand_string \n (echo 的空行) \n hw.ncpu → brand=sys[0]，ncpu=sys[2]
  const sys = sysRaw.split('\n')
  const memBytes = memRaw.split('\n')[0] || ''
  const memGiB = /^\d+$/.test(memBytes.trim())
    ? Math.round((parseInt(memBytes.trim()) / 1073741824) * 10) / 10
    : null
  const top = topRaw.split('\n').filter((l) => l.trim().length).slice(0, 6)
  return {
    scope,
    cpu: { model: (sys[0] || '').trim(), cores: (sys[2] || '').trim(), ...(parseCpu(cpuRaw) || {}) },
    mem: { totalGiB: memGiB, ...(parseMem(memRaw) || {}) },
    disk: parseDisk(diskRaw),
    batt: parseBatt(battRaw),
    load: parseLoad(loadRaw),
    top,
    topProc: parseTopProc(topRaw),
    ts: Date.now(),
  }
}
