// ============================================================
// kid-network · host half  (code.host 函数体)
// 供 cordis_define 使用。运行在 node:vm 沙箱：
//   可用符号: ctx / harness / console / btoa / atob / TextEncoder / TextDecoder
//   采集走 ctx.shell（inject: ['shell']），stdout 取 .text（CollectedOutput）
//   数据 RPC：net:collect —— 供 client half 定时拉取。
//   出网命令（curl cip.cc / 测速）若被受限沙箱拦截，run() 返回 ''，
//   host 会把对应字段置 null，前端优雅降级为占位文案，不中断整体。
// ============================================================
return {
  inject: ['shell'],
  apply(ctx) {
    const shell = ctx.get('shell')
    if (!shell) return

    const run = async (cmd, timeoutMs = 7000) => {
      try {
        const spec = shell.resolve({ command: cmd, timeoutMs })
        const r = await shell.run(spec)
        return (r && r.stdout && typeof r.stdout.text === 'string') ? r.stdout.text : ''
      } catch (e) {
        return ''
      }
    }

    // 信鸽要送的几封信（固定国内站点，方便小朋友认），硬编码常量。
    const LETTERS = [
      { key: 'baidu', label: '北京 · 百度', host: 'www.baidu.com' },
      { key: 'aliyun', label: '杭州 · 阿里云', host: 'www.aliyun.com' },
      { key: 'qq', label: '深圳 · 腾讯', host: 'www.qq.com' },
    ]

    const firstLine = (s) => {
      const l = (s || '').split('\n').map(x => x.trim()).find(Boolean)
      return l || ''
    }

    const parsePingMs = (s) => {
      // macOS ping 汇总行: round-trip min/avg/max/stddev = a/b/c/d ms
      const m = (s || '').match(/round-trip.*= ([\d.]+)\/([\d.]+)\/[\d.]+\/([\d.]+)/)
      if (!m) return null
      return Math.round(parseFloat(m[2]))
    }

    const parseCip = (s) => {
      // cip.cc 返回: IP<TAB>: 值 / 地址 : 城市 / 运营商 : 名称
      const ip = (s || '').match(/IP\s*:\s*([\d.]+)/)
      const addr = (s || '').match(/地址\s*:\s*([^\n]+)/)
      const isp = (s || '').match(/运营商\s*:\s*([^\n]+)/)
      return {
        ip: ip ? ip[1].trim() : null,
        city: addr ? addr[1].trim() : null,
        isp: isp ? isp[1].trim() : null,
      }
    }

    const collect = async () => {
      // 本地命令（大概率放行）；出网命令独立跑，失败降级
      const [lanRaw, gwRaw, dnsRaw, arpRaw] = await Promise.all([
        Promise.resolve(1).then(() => run("ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null")),
        Promise.resolve(1).then(() => run("netstat -rn | awk '/default/ && $1==\"default\" && $2 ~ /^[0-9]/ {print $2; exit}'")),
        Promise.resolve(1).then(() => run("scutil --dns | awk '/nameserver\\[/ {print $3}' | sort -u | head -3")),
        Promise.resolve(1).then(() => run("arp -a | grep -c '\\['")),
      ])

      // 出网命令（pub 并行
      const pubRaw = await run('curl -s --max-time 5 cip.cc', 15000)
      // 测速：单独给足超时（curl 自己 --max-time 8，外层 15s 不抢先杀），2MB 更快完成
      const speedRaw = await run("curl -s -o /dev/null -w '%{speed_download}' --max-time 8 'https://speed.cloudflare.com/__down?bytes=2000000'", 15000)

      // 信鸽逐站送信延迟（并行）
      const pings = await Promise.all(LETTERS.map((L) =>
        Promise.resolve(1).then(() => run(`ping -c 3 -t 4 ${L.host} 2>&1 | tail -1`)).then((s) => ({
          key: L.key, label: L.label, ms: parsePingMs(s),
        }))
      ))

      const speedNum = parseFloat((speedRaw || '').trim())
      return {
        lan: firstLine(lanRaw) || null,
        gw: firstLine(gwRaw) || null,
        dns: (dnsRaw || '').split('\n').map(x => x.trim()).filter(Boolean).slice(0, 3),
        neighbors: parseInt((arpRaw || '').trim(), 10) || null,
        pub: parseCip(pubRaw),
        speedKBps: isFinite(speedNum) && speedNum > 0 ? Math.round(speedNum / 1024) : null, // KB/s
        letters: pings,
        ts: Date.now(),
      }
    }

    return harness.handle('net:collect', async () => {
      try {
        return await collect()
      } catch (e) {
        return { error: String((e && e.message) || e) }
      }
    })
  },
}