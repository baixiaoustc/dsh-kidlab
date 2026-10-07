// ============================================================
// kid-security · host 侧取数
//
// 由 0.1 动态插件 plugin-kid-security/cordis/host.js 原样搬迁：
//   判断逻辑一行没改，只换了「取数方式」——
//   旧：node:vm 沙箱里的 ctx.get('shell').run(...)（harness 的沙箱 shell 服务）
//   新：普通 Node 模块，直接 node:child_process 的 execFile（指南第 5 节 #5）
//
// 主题：🐕 城堡安检 —— 把电脑安全讲成城堡的一道道守卫：
//   护城河=防火墙 / 保险箱=磁盘加密(FileVault) / 门锁=自动锁屏+要密码 /
//   暗门=远程服务端口(22 SSH、5900 屏幕共享) / 登记簿=最近登录开关机记录。
// 全部免 sudo、命令硬编码；单项读不到就 status:'unknown'（"看不清"不算失败）。
//
// 测试友好：assemble() 是纯函数（吃原始文本、吐卡片 JSON），
//   verify.mjs 用它注入假文本做离线断言，不必依赖本机此刻的安全设置。
// ============================================================
import { execFile } from 'node:child_process'

/** 采集结果缓存时长：浏览器卡片 15 秒轮询一次，5 秒缓存足够挡住重复刷新。 */
export const CACHE_MS = 5000
/** 单条命令超时。 */
export const TIMEOUT_MS = 8000

/** 五道守卫对应的命令（全只读、免 sudo）。 */
export const CMD = {
  wall: 'defaults read /Library/Preferences/com.apple.alf globalstate',
  locker: 'fdesetup status',
  idle: 'defaults -currentHost read com.apple.screensaver idleTime',
  pwd: 'defaults read com.apple.screensaver askForPassword',
  me: 'whoami',
  listen: 'netstat -an | grep LISTEN || true',
  last: 'last -5',
}

/**
 * 跑一条只读命令，返回 stdout 文本；失败返回空串（由各守卫降级成 unknown）。
 * @param {string} cmd shell 命令
 * @param {number} timeoutMs 超时毫秒
 * @returns {Promise<string>}
 */
export const run = (cmd, timeoutMs = TIMEOUT_MS) => new Promise((resolve) => {
  execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024 }, (_err, stdout) => {
    resolve(typeof stdout === 'string' ? stdout : '')
  })
})

/**
 * 秒 → 小朋友看得懂的时长。
 * 注：0.1 动态插件里这里写的是 `Math.round(seconds / 600) / 10`，
 * 于是一小时的秒数会算成 1.2 小时（除错了数，应为 /360 才是 0.1 小时精度）。
 * 搬迁时按原意修正为 /360：7200 秒 → 2 小时。
 */
export const humanDuration = (seconds) => {
  if (seconds >= 3600) return (Math.round(seconds / 360) / 10) + ' 小时'
  if (seconds >= 60) return Math.round(seconds / 60) + ' 分钟'
  return seconds + ' 秒'
}

/** 守卫工厂：status = good | warn | bad | unknown。 */
export const guard = (key, emoji, name) =>
  ({ key, emoji, name, status: 'unknown', short: '看不清这道守卫…', detail: [], hint: '' })

/** 1. 护城河：防火墙（globalstate: 0=关 1=开 2=开+阻止所有传入）。 */
export const buildWall = (raw) => {
  const g = guard('wall', '🧱', '护城河（防火墙）')
  const t = (raw || '').trim()
  if (!t) return g
  const n = Number(t)
  if (!Number.isFinite(n)) return g
  if (n === 0) {
    g.status = 'bad'
    g.short = '护城河是干的——防火墙没开，大门敞着。'
    g.hint = '请大人到「系统设置 › 网络 › 防火墙」把它打开。'
  } else if (n === 2) {
    g.status = 'good'
    g.short = '护城河满水位——防火墙开着，还开了「阻止所有传入」，最严格。'
  } else {
    g.status = 'good'
    g.short = '护城河有水——防火墙开着，卫兵在守门。'
  }
  return g
}

/** 2. 保险箱：磁盘加密 FileVault。 */
export const buildLocker = (raw) => {
  const g = guard('locker', '🔒', '保险箱（磁盘加密）')
  const t = (raw || '').trim()
  if (/is On/i.test(t)) {
    g.status = 'good'
    g.short = '日记和宝贝都锁进保险箱啦——就算硬盘被拿走也打不开。'
  } else if (/is Off/i.test(t)) {
    g.status = 'bad'
    g.short = '保险箱还没上锁——电脑丢了，里面的东西别人能直接看。'
    g.hint = '请大人到「系统设置 › 隐私与安全性 › FileVault」打开。'
  }
  return g
}

/** 3. 门锁：自动锁屏 + 醒来要不要密码。 */
export const buildLock = (idleRaw, pwdRaw) => {
  const g = guard('lock', '🚪', '门锁（自动锁屏）')
  const idleT = (idleRaw || '').trim()
  const idleSet = idleT && !/does not exist/i.test(idleT)
  const idle = idleSet ? Number(idleT) : NaN
  if (!Number.isFinite(idle) || idle <= 0) {
    g.status = 'bad'
    g.short = '门不会自己关上——没设自动锁屏，你一离开谁都能看屏幕。'
    g.hint = '请大人到「系统设置 › 锁定屏幕」设一个自动锁屏时间（5 分钟内更好）。'
    return g
  }
  g.detail.push('闲置 ' + humanDuration(idle) + ' 后自动锁屏。')
  if (idle > 300) {
    g.status = 'warn'
    g.short = '门要过 ' + humanDuration(idle) + ' 才自动关——锁得有点慢，别人有空偷偷看。'
  } else {
    g.status = 'good'
    g.short = '离开一小会儿门就自动关上——锁得挺勤快。'
  }
  const pwdT = (pwdRaw || '').trim()
  if (pwdT && !/does not exist/i.test(pwdT) && Number(pwdT) === 0) {
    g.status = 'warn'
    g.detail.push('但屏幕醒来不用输密码——锁了门却没上钥匙。')
    if (g.status !== 'bad') g.hint = '请大人在「锁定屏幕」设置里打开「需要密码」。'
  } else {
    g.detail.push('回来要输密码（钥匙）才能开门。')
  }
  return g
}

/** 4. 暗门：远程服务端口（22=SSH 远程登录，5900=屏幕共享 VNC）。 */
export const buildDoor = (listenRaw) => {
  const g = guard('door', '🕳️', '暗门（远程端口）')
  const open = []
  for (const line of (listenRaw || '').split('\n')) {
    if (!line.includes('LISTEN')) continue
    const fields = line.trim().split(/\s+/)
    const proto = fields[0] || ''
    if (!/^tcp/.test(proto)) continue
    const local = fields[3] || ''
    const m = local.match(/\.(\d+)$/)
    if (!m) continue
    const port = m[1]
    if (port === '22' && !open.some((o) => o.port === '22')) open.push({ port: '22', label: '远程登录 SSH' })
    if (port === '5900' && !open.some((o) => o.port === '5900')) open.push({ port: '5900', label: '屏幕共享 VNC' })
  }
  if (!open.length) {
    g.status = 'good'
    g.short = '墙上没有暗门——22 和 5900 端口都没开着。'
  } else {
    g.status = 'warn'
    g.short = '发现开着的暗门：' + open.map((o) => o.port + '（' + o.label + '）').join('、') + '。'
    g.detail.push('暗门一般不会自己冒出来，通常是有人主动开了远程登录/屏幕共享。')
    g.hint = '让大人确认是不是自己开的；这台电脑不需要被远程连的话，最好关掉。'
  }
  return g
}

/** 5. 登记簿：最近登录 / 开关机记录（last -5）。 */
export const buildLogbook = (lastRaw, me) => {
  const g = guard('logbook', '📋', '登记簿（登录记录）')
  const lines = (lastRaw || '').split('\n').map((s) => s.trim()).filter(Boolean)
  const rows = lines.filter((l) => !/^wtmp\b/i.test(l))
  if (!rows.length) {
    g.status = 'unknown'
    g.short = '登记簿是空的——读不到最近的登录记录。'
    return g
  }
  const users = []
  for (const row of rows) {
    const u = (row.split(/\s+/)[0] || '').trim()
    if (!u || u === 'reboot' || u === 'shutdown') continue
    if (users.indexOf(u) < 0) users.push(u)
  }
  const strangers = users.filter((u) => u !== me)
  if (strangers.length) {
    g.status = 'warn'
    g.short = '登记簿上有别的名字：' + strangers.join('、') + '——不一定是坏人，但要弄清楚。'
    g.hint = '让大人看看这些名字是不是家里人用的账号；不认识就要当心。'
  } else {
    g.status = 'good'
    g.short = '进门的都是主人自己（' + (users[0] || me) + '），没有陌生人。'
  }
  g.recent = rows.slice(0, 5)
  return g
}

/** 五道守护卫的得分：看不清（unknown）的不计入分母。 */
export const scoreOf = (guards) => {
  const scored = guards.filter((g) => g.status !== 'unknown')
  const good = scored.filter((g) => g.status === 'good').length
  const total = scored.length
  const pct = total ? Math.round((good / total) * 100) : 0
  const level = total === 0
    ? { text: '看不清', emoji: '❓', color: '#8a93a8' }
    : pct === 100
      ? { text: '安全城堡', emoji: '😄', color: '#3f9b5a' }
      : pct >= 60
        ? { text: '有小缺口', emoji: '🙂', color: '#e0963a' }
        : { text: '要补一补', emoji: '😅', color: '#e2593a' }
  return { good, total, pct, level }
}

/**
 * 纯函数：把七条命令的原始文本拼成卡片要的 JSON。
 * @param {{wall?:string,locker?:string,idle?:string,pwd?:string,me?:string,listen?:string,last?:string}} raws
 */
export const assemble = (raws) => {
  const r = raws || {}
  const guards = [
    buildWall(r.wall),
    buildLocker(r.locker),
    buildLock(r.idle, r.pwd),
    buildDoor(r.listen),
    buildLogbook(r.last, (r.me || '').trim()),
  ]
  return { guards, score: scoreOf(guards), ts: Date.now() }
}

/** 真机采集一次。 */
export const collect = async () => {
  const [wall, locker, idle, pwd, me, listen, last] = await Promise.all([
    run(CMD.wall), run(CMD.locker), run(CMD.idle), run(CMD.pwd), run(CMD.me), run(CMD.listen), run(CMD.last),
  ])
  return assemble({ wall, locker, idle, pwd, me, listen, last })
}

let cache = null

/** 带 5 秒缓存的采集：卡片轮询和手工 curl 都不会反复敲系统命令。 */
export const collectCached = async () => {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data
  const data = await collect()
  cache = { at: Date.now(), data }
  return data
}
