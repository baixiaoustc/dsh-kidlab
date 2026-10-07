// ============================================================
// kid-sysmon · pkg-12 host half（第五圈「最忙」走宿主白名单通道）
// 在已有四圈（iostat/memory_pressure/df/pmset）基础上，
// 通过 harness.invokeHostTool('system_status', {scope:'process'})
// 取到真·最忙进程（沙箱内 ps/iotop 被拦，只有宿主 execFile 能拿到）。
// 若通道未启用（harness.invokeHostTool 不存在），topProc 返回 null，不影响其它圈。
// ============================================================
return {
  inject: ['shell'],
  apply(ctx) {
    const shell = ctx.get('shell')
    if (!shell) return

    const run = async (cmd, timeoutMs = 6000) => {
      try {
        const spec = shell.resolve({ command: cmd, timeoutMs })
        const r = await shell.run(spec)
        return (r && r.stdout && typeof r.stdout.text === 'string') ? r.stdout.text : ''
      } catch (e) {
        return ''
      }
    }

    // iostat 输出末尾行: us sy id （user/system/idle），取 us+sy
    const parseCpu = (s) => {
      const lines = s.trim().split('\n')
      const last = lines[lines.length - 1]
      const m = last && last.match(/^\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
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
      const lines = s.split('\n').filter(l => l.trim().length)
      if (lines.length < 2) return null
      const parts = lines[1].trim().split(/\s+/)
      const cap = parts[1], avail = parts[3]
      const use = (lines[1] || '').match(/(\d+)%/)
      return { cap: cap || '?', avail: avail || '?', pct: use ? parseInt(use[1]) : null }
    }
    const parseBatt = (s) => {
      const l = s.split('\n').find(x => x.includes('%'))
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
    // 宿主 system_status(scope=process) 文本里的最忙进程
    const parseTopProc = (text) => {
      // 形如「【Top 进程 (按 CPU)】」 + ps -Arco pid,pcpu,pmem,comm 多行
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

    const collect = async (scope) => {
      const results = await Promise.all([
        Promise.resolve(1).then(() => run("iostat -w 1 -c 2 | tail -1")),
        Promise.resolve(1).then(() => run("sysctl -n machdep.cpu.brand_string; echo; sysctl -n hw.ncpu")),
        Promise.resolve(1).then(() => run("sysctl -n hw.memsize; memory_pressure 2>/dev/null | grep 'free percentage'")),
        Promise.resolve(1).then(() => run("df -h /")),
        Promise.resolve(1).then(() => run("pmset -g batt")),
        Promise.resolve(1).then(() => run("uptime")),
        Promise.resolve(1).then(() => run("ps -Arco pid,pcpu,pmem,comm | head -8")),
      ])
      const [cpuRaw, sysRaw, memRaw, diskRaw, battRaw, loadRaw, topRaw] = results
      const sys = sysRaw.split('\n')
      const memBytes = memRaw.split('\n')[0] || ''
      const memGiB = /^\d+$/.test(memBytes.trim())
        ? Math.round((parseInt(memBytes.trim()) / 1073741824) * 10) / 10 : null
      const top = topRaw.split('\n').filter(l => l.trim().length).slice(0, 6)
      return {
        scope,
        cpu: { model: (sys[0] || '').trim(), cores: (sys[1] || '').trim(), ...(parseCpu(cpuRaw) || {}) },
        mem: { totalGiB: memGiB, ...(parseMem(memRaw) || {}) },
        disk: parseDisk(diskRaw),
        batt: parseBatt(battRaw),
        load: parseLoad(loadRaw),
        top,
        ts: Date.now(),
      }
    }

    // 第五圈：最忙进程（宿主白名单通道，可能处于未启用状态）
    const fetchTopProc = async () => {
      if (typeof harness.invokeHostTool !== 'function') return null
      try {
        const res = await harness.invokeHostTool('system_status', { scope: 'process' }, 8000)
        if (!res || res.isError) return null
        return parseTopProc(typeof res.value === 'string' ? res.value : JSON.stringify(res.value))
      } catch (e) {
        return null
      }
    }

    return harness.handle('sysmon:collect', async (args) => {
      const scope = (args && args.scope) ? args.scope : 'all'
      try {
        const [data, topProc] = await Promise.all([collect(scope), fetchTopProc()])
        data.topProc = topProc
        return data
      } catch (e) {
        return { error: String(e && e.message || e) }
      }
    })
  },
}