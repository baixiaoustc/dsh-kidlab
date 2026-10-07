// ============================================================
// kid-memory · host half  (code.host 函数体)
// 供 cordis_define 使用。运行在 node:vm 沙箱：
//   可用符号: ctx / harness / console / btoa / atob / TextEncoder / TextDecoder
//   采集走 ctx.shell（inject: ['shell']），stdout 取 .text（CollectedOutput）
//   数据 RPC：mem:collect —— 供 client half 定时拉取。
//   主题：🦉 猫头鹰的记忆 / 记忆小管家 —— 把内存讲成“工作台/短期记忆”的小故事。
//   与 kid-storage 的“大仓库/长期记忆”配对：内存管正在做的，硬盘管长期存的。
//   全部免 sudo、硬编码命令、单项失败优雅降级。
// ============================================================
return {
  inject: ['shell'],
  apply(ctx) {
    const shell = ctx.get('shell')
    if (!shell) return

    const run = async (cmd, timeoutMs = 8000) => {
      try {
        const spec = shell.resolve({ command: cmd, timeoutMs })
        const r = await shell.run(spec)
        return (r && r.stdout && typeof r.stdout.text === 'string') ? r.stdout.text : ''
      } catch (e) {
        return ''
      }
    }

    // 字节 → { num, unit }
    const humanBytes = (b) => {
      if (!b || isNaN(b)) return { num: '—', unit: '' }
      if (b >= 1024 * 1024 * 1024) return { num: (b / 1024 / 1024 / 1024).toFixed(1), unit: 'GB' }
      if (b >= 1024 * 1024) return { num: (b / 1024 / 1024).toFixed(0), unit: 'MB' }
      return { num: String(Math.round(b / 1024)), unit: 'KB' }
    }

    // KB → { num, unit }
    const humanKB = (kb) => {
      if (!kb || isNaN(kb)) return { num: '—', unit: '' }
      if (kb >= 1024 * 1024) return { num: (kb / 1024 / 1024).toFixed(1), unit: 'GB' }
      if (kb >= 1024) return { num: (kb / 1024).toFixed(0), unit: 'MB' }
      return { num: String(Math.round(kb)), unit: 'KB' }
    }

    // 从可执行路径抽出小朋友能看懂的名字（App 名 / 程序名）
    const prettyName = (comm) => {
      const raw = (comm || '').trim()
      const app = raw.match(/^(?:.*\/)?(.+?)\.app/) 
      if (app) return app[1].replace(/\s+Helper.*$/, '')
      const last = raw.split('/').pop() || raw
      return last.replace(/\s+\(.*\)$/, '') || 'unknown'
    }

    const pressureHint = (freePct) => {
      if (freePct >= 50) return { level: '宽裕', text: '很宽敞，工作台空位多，电脑不卡。', emoji: '😊' }
      if (freePct >= 20) return { level: '有点挤', text: '工作台用了不少，开太多东西可能会慢。', emoji: '🙂' }
      return { level: '很紧张', text: '工作台快占满了，建议关掉一些不用的程序。', emoji: '😅' }
    }

    const collect = async () => {
      // 1. 总内存（字节）
      const totalRaw = (await run('sysctl -n hw.memsize')).trim()
      const totalBytes = Number(totalRaw)
      const total = Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes : 0

      // 2. 空闲率（memory_pressure）+ 总内存 → 已用/空闲（不依赖被沙箱拦的 top）
      const prRaw = await run('memory_pressure -Q')
      const pm = prRaw.match(/free percentage:\s*(\d+)/i)
      let freePct = null
      if (pm) freePct = parseInt(pm[1], 10) || null

      const baseMB = total ? total / 1024 / 1024 : 0
      let usedMB = 0, freeMB = 0, usedPct = 0
      if (baseMB > 0 && freePct !== null) {
        freeMB = Math.round((baseMB * freePct) / 100)
        usedMB = baseMB - freeMB
        usedPct = 100 - freePct
      }

      // 3. 谁在占工作台（python3 + libproc 读 RSS，按 App 聚合排序，避开被沙箱拦的 ps/top）
      const pyScript = `import ctypes,re
lib=ctypes.CDLL('/usr/lib/libproc.dylib',use_errno=True)
lib.proc_listpids.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_void_p,ctypes.c_int]
lib.proc_listpids.restype=ctypes.c_int
class TI(ctypes.Structure):
  _fields_=[("v",ctypes.c_uint64),("rss",ctypes.c_uint64),("tu",ctypes.c_uint64),("ts",ctypes.c_uint64),("thu",ctypes.c_uint64),("ths",ctypes.c_uint64),("po",ctypes.c_int32),("fa",ctypes.c_int32),("pi",ctypes.c_int32),("cf",ctypes.c_int32),("ms",ctypes.c_int32),("mr",ctypes.c_int32),("sma",ctypes.c_int32),("snu",ctypes.c_int32),("csw",ctypes.c_int32),("tn",ctypes.c_int32),("nr",ctypes.c_int32),("pr",ctypes.c_int32)]
lib.proc_pidinfo.argtypes=[ctypes.c_int,ctypes.c_int,ctypes.c_uint64,ctypes.c_void_p,ctypes.c_int]
lib.proc_pidinfo.restype=ctypes.c_int
lib.proc_name.argtypes=[ctypes.c_int,ctypes.c_void_p,ctypes.c_uint32]
lib.proc_name.restype=ctypes.c_int
def norm(nm):
  s=nm.strip()
  if '/' in s:
    s=s.split('/')[-1]
  m=re.match(r'^(.+?)\\.app(?:/|$)', s)
  if m: s=m.group(1)
  s=re.sub(r'\\s+Helper.*$','',s)
  s=re.sub(r'\\(.*\\)$','',s).strip()
  if not s: return 'unknown'
  if s.startswith('com.apple.'):
    parts=s.split('.')
    if len(parts)>2: s=parts[-1]
  return s
B=(ctypes.c_int*(65536))()
n=lib.proc_listpids(1,0,B,65536*4)
agg={}
for i in range(n):
  pid=B[i]
  if pid<=0: continue
  ti=TI()
  if lib.proc_pidinfo(pid,4,0,ctypes.byref(ti),ctypes.sizeof(ti))<=0: continue
  if ti.rss<=0: continue
  nb=ctypes.create_string_buffer(512)
  try:
    lib.proc_name(pid,nb,512)
  except Exception:
    pass
  nm=nb.value.decode('utf-8','replace') or str(pid)
  a=norm(nm)
  if a in agg: agg[a]=agg[a]+ti.rss
  else: agg[a]=ti.rss
for a,rss in sorted(agg.items(), key=lambda x:-x[1])[:12]:
  print(str(rss)+'\\t'+a)`
      const pyOut = await run('/usr/local/bin/python3 - <<\'PY\'\n' + pyScript + '\nPY')
      const top = []
      for (const line of (pyOut || '').split('\n')) {
        if (top.length >= 12) break
        const mm = line.match(/^\s*(\d+)\s+(\S.*)$/)
        if (!mm) continue
        const rss = parseInt(mm[1], 10)
        const kb = rss > 0 ? Math.round(rss / 1024) : 0
        const name = mm[2] || ''
        if (!kb || !name) continue
        top.push({ name, kb, ...humanKB(kb) })
      }

      return {
        total: { ...humanBytes(total), bytes: total },
        used: { ...humanBytes(usedMB * 1024 * 1024), mb: usedMB },
        free: { ...humanBytes(freeMB * 1024 * 1024), mb: freeMB },
        usedPct,
        top,
        pressure: freePct === null ? null : {
          freePct,
          ...pressureHint(freePct),
        },
        ts: Date.now(),
      }
    }

    return harness.handle('mem:collect', async () => {
      try {
        return await collect()
      } catch (e) {
        return { error: String((e && e.message) || e) }
      }
    })
  },
}