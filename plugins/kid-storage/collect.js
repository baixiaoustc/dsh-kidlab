// ============================================================
// kid-storage-card · 采集层（纯 node 内置模块，可直接 node 运行验证）
// 主题：🐿️ 大仓库 —— 把硬盘空间讲成“仓库/行李箱”的小故事。
// 只扫用户可控目录（跳过 Library），快且不易被拒；单项失败优雅降级。
// ============================================================
import { execFile } from 'node:child_process'
import { homedir } from 'node:os'

/** 主目录里要清点的常见子文件夹（顺序无关，最终按占用降序）。 */
const FOLDERS = [
  { key: 'desktop', label: '桌面', dir: 'Desktop' },
  { key: 'documents', label: '文档', dir: 'Documents' },
  { key: 'downloads', label: '下载', dir: 'Downloads' },
  { key: 'movies', label: '影片', dir: 'Movies' },
  { key: 'music', label: '音乐', dir: 'Music' },
  { key: 'pictures', label: '照片', dir: 'Pictures' },
  { key: 'public', label: '公共', dir: 'Public' },
]

/**
 * 跑一条命令并只取 stdout。命令失败（例如某个目录不存在）时 stdout 里的
 * 部分结果仍然有效，因此不抛错、只返回拿到的文本。
 * @param file 可执行文件
 * @param args 参数数组（不经 shell，路径含空格也安全）
 * @param timeoutMs 超时
 * @returns stdout 文本，失败且无输出时为空串
 */
const run = (file, args, timeoutMs) =>
  new Promise((resolve) => {
    execFile(file, args, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, encoding: 'utf8' }, (error, stdout) => {
      resolve(error && !stdout ? '' : (stdout ?? ''))
    })
  })

/**
 * 解析 `df -k -H` 输出。
 * `/` 与 `/System/Volumes/Data` 是同一 APFS 容器的两个挂载面（空间数字相同），
 * 只保留可写的 Data 卷并让它充当 root，避免出现两个一模一样的格子。
 * @param s df 的原始输出
 * @returns 分区行数组
 */
export const parseDf = (s) => {
  const rows = []
  const all = (s || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(1)
  for (const l of all) {
    const p = l.split(/\s+/)
    if (p.length < 6) continue
    // 挂载点可能含空格（如 "/Volumes/VS Code"），不能取最后一个字段。
    // 第 0 列是设备名，其后全是数字列，第一个以 / 开头的字段就是挂载点起点。
    const mi = p.findIndex((f, i) => i > 0 && f.charAt(0) === '/')
    if (mi < 0) continue
    const mount = p.slice(mi).join(' ')
    if (mount === '/') continue
    if (mount.startsWith('/System/Volumes/Data') && !rows.find((r) => r.key === 'root')) {
      rows.push({ key: 'root', label: '系统盘 Data', mount, total: p[1], used: p[2], avail: p[3], pct: p[4] })
    } else if (mount === '/Volumes/Data' && !rows.find((r) => r.key === 'datavol')) {
      rows.push({ key: 'datavol', label: '数据盘', mount, total: p[1], used: p[2], avail: p[3], pct: p[4] })
    } else if (
      mount.startsWith('/Volumes') &&
      mount !== '/' &&
      mount.length > 1 &&
      mount.indexOf('/System') === -1 &&
      rows.length < 8
    ) {
      rows.push({ key: 'vol' + rows.length, label: mount.split('/').pop(), mount, total: p[1], used: p[2], avail: p[3], pct: p[4] })
    }
  }
  return rows
}

/**
 * 判断一个卷是不是「安装包映像」（.dmg 挂出来的那块）。
 * `diskutil info` 对映像卷会明确报 `Protocol: Disk Image`，这是首选信号；
 * 万一那条字段变了，退一步看它是不是媒体+卷都只读（映像一律只读挂载）。
 * @param text diskutil info 的原始输出
 * @returns 是映像卷则为 true
 */
export const isDiskImage = (text) => {
  const t = text || ''
  return /Protocol:\s*Disk Image/i.test(t) || (/Media Read-Only:\s*Yes/i.test(t) && /Volume Read-Only:\s*Yes/i.test(t))
}

/**
 * 把分区行分成「真磁盘」与「安装包映像卷」。
 *
 * 为什么必须分开：映像卷的空间完全取决于背后那个 .dmg 文件，把它当成一块盘必然说错话——
 *   · .dmg 已删、卷还挂着（系统会把映像一直挂到重启或手动推出）：报出来的「已用 1.1G」
 *     是幽灵，谁也没占；小朋友刚删完软件却看到它还在，只会以为卡片坏了；
 *   · .dmg 还在：那份空间已经算在「下载」里了，再当成一块盘就重复计数，同一个 286M 数两遍。
 * 所以映像不参与空间统计，只单独报一行「还挂着几个」，让它变成「拆完快递没扔的纸箱」的故事。
 *
 * @param rows parseDf 的结果
 * @param probe 探测单个挂载点的命令执行器（可注入，便于离线测试）
 * @returns {Promise<{volumes: object[], images: object[]}>}
 */
export const classifyVolumes = async (rows, probe = (mount) => run('diskutil', ['info', mount], 4000)) => {
  const volumes = []
  const images = []
  for (const r of rows) {
    // 系统盘/数据盘是内部 APFS，不可能是映像。
    if (r.key === 'root' || r.key === 'datavol' || !r.mount) {
      volumes.push(r)
      continue
    }
    const info = await probe(r.mount)
    if (isDiskImage(info)) images.push({ label: r.label, mount: r.mount })
    else volumes.push(r)
  }
  return { volumes, images }
}


/**
 * KB 转人类可读（1GB = 1024MB，与系统显示口径一致）。
 * @param kb 千字节数
 * @returns { num, unit } 或 null
 */
export const human = (kb) => {
  if (!kb || isNaN(kb)) return null
  if (kb >= 1024 * 1024) return { num: (kb / 1024 / 1024).toFixed(1), unit: 'GB' }
  if (kb >= 1024) return { num: (kb / 1024).toFixed(1), unit: 'MB' }
  return { num: String(Math.round(kb)), unit: 'KB' }
}

/** 一次采集的完整结果（分区全景 + 安装包映像 + 主目录占用榜）。 */
export async function collect() {
  const home = homedir()
  const dfRaw = (await run('df', ['-k', '-H'], 8000)) || (await run('df', ['-k'], 8000))
  const duRaw = await run('du', ['-sk', '-x', ...FOLDERS.map((f) => home + '/' + f.dir)], 20000)
  const { volumes, images } = await classifyVolumes(parseDf(dfRaw))

  const folderMap = {}
  for (const line of (duRaw || '').split('\n')) {
    const m = line.match(/^(\d+)\s+\S+?\/(\w+)$/)
    if (!m) continue
    const kb = parseInt(m[1], 10)
    const hit = FOLDERS.find((f) => f.dir === m[2])
    if (!hit) continue
    folderMap[hit.key] = { ...human(kb), kb }
  }

  const folders = FOLDERS.map((f) => ({
    key: f.key,
    label: f.label,
    ...(folderMap[f.key] || { num: '—', unit: '', kb: 0 }),
  })).sort((a, b) => (b.kb || 0) - (a.kb || 0))

  return { volumes, images, folders, totalKb: folders.reduce((n, f) => n + (f.kb || 0), 0), ts: Date.now() }
}

/** 最近一次采集结果与在途请求，避免多个页面同时触发重扫。 */
let cache = { at: 0, data: null }
let inflight = null

/**
 * 带 5 秒缓存与在途合并的采集入口。
 * @returns 采集结果
 */
export async function collectCached() {
  const now = Date.now()
  if (cache.data && now - cache.at < 5000) return cache.data
  if (inflight) return inflight
  inflight = collect()
    .then((data) => {
      cache = { at: Date.now(), data }
      return data
    })
    .finally(() => {
      inflight = null
    })
  return inflight
}
