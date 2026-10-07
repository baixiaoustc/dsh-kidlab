// ============================================================
// kid-security · 模型工具层（host half 的一部分）
// 与旧的 @kidlab/dsh-kid-security 工具集【输出完全一致】，只有注册方式变了：
//   不再用 defineTool() 包装——那要求从 profile 的 node_modules 解析
//   @deepseek-ai/dsh-tools，而 link: 安装的 bundle 解析不到外部包
//   （本 checkout 里那份 store 副本还配错了 dsh-llm，直接 import 就报错）；
//   改成返回普通对象，由 index.js 交给 ctx.tools.register()。
// 隐喻：这台电脑是一座「小城堡」，安全措施就是城堡的一道道守卫。
//   - 防火墙   = 护城河 + 城门守卫（拦住不怀好意的来客）
//   - 磁盘加密 = 把日记/宝贝锁进保险箱（别人拿走硬盘也打不开）
//   - 锁屏要密码 = 离开房间随手锁门（回来要用钥匙）
//   - 远程暗门 = 有没有给外人留了后门/暗门（能远程溜进来）
//   - 开门记录 = 看看最近都有谁进过这座城堡
// 全部命令硬编码常量、不拼接用户输入、免 sudo、单命令超时容错。
// ============================================================
import { execFile } from 'node:child_process'

/** 统一的返回形状：一段文本。 */
const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * 这五个工具都不收参数。形状与旧版 `defineTool({ parameters: {} })` 在注册表里
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
    const out = await run(cmd, timeoutMs)
    return out
  } catch (e) {
    return `[${label}采集失败] ${e instanceof Error ? e.message : String(e)}`
  }
}

/** 把秒数转成“X 分钟 / Y 秒”这种小朋友看得懂的时长。 */
function humanDuration(seconds) {
  if (seconds >= 60) return `${Math.round(seconds / 60)} 分钟`
  return `${seconds} 秒`
}

/**
 * 构建 kid-security 的五个工具定义。
 * @param {{ timeoutMs: number }} config 已归一化的配置
 * @returns {object[]} 可直接交给 ctx.tools.register 的普通对象
 */
export function buildSecurityTools(config) {
  const t = config.timeoutMs

  return [
    // 1. 防火墙：护城河 + 城门守卫
    {
      name: 'sec_wall',
      description:
        '看看这台电脑的“护城河 / 城门守卫”——也就是防火墙开没开。防火墙就像城堡外面的护城河和守门的卫兵，拦住不怀好意的网络来客，防止坏人偷偷溜进来。免 sudo。返回防火墙开/关状态和一句给小朋友的解释。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = (await safe('防火墙', 'defaults read /Library/Preferences/com.apple.alf globalstate', t)).trim()
        const out = ['【护城河 / 防火墙】']
        if (raw.startsWith('[防火墙')) {
          out.push('拿不到防火墙状态（可能是权限问题）。')
          out.push('')
          out.push('解释：防火墙就像城堡的护城河和守门卫兵，负责拦住不怀好意的网络来客。')
          return out.join('\n')
        }
        const state = Number(raw)
        if (state === 0) {
          out.push('这台电脑的护城河🧱现在是【关闭】的——这句话的意思是：防火墙没开。')
          out.push('就像城堡没有护城河、也没人在门口守着，外面想进来的都能直接进来。')
          out.push('建议：让大人帮忙在「系统设置 › 网络 › 防火墙」里把它打开，更安全。')
        } else {
          out.push('这台电脑的护城河🧱现在是【打开】的——防火墙开着，卫兵在守着。')
          out.push('不请自来的网络来客会被拦在外面，安全多了。')
        }
        out.push('')
        out.push('解释：防火墙是一个开关，开着=有卫兵守门，关着=大门敞开。')
        out.push('对小朋友来说，记住“开着比关着安全”就够了。')
        return out.join('\n')
      },
    },

    // 2. 磁盘加密 FileVault：保险箱
    {
      name: 'sec_locker',
      description:
        '看看这台电脑的“保险箱”——也就是磁盘加密（FileVault）开没开。磁盘加密就像把你的日记和宝贝锁进一个保险箱，就算别人把硬盘硬盘拿走，没有钥匙也打不开、看不到里面的内容。免 sudo。返回加密开/关状态和一句解释。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = (await safe('磁盘加密', 'fdesetup status', t)).trim()
        const out = ['【保险箱 / 磁盘加密(FileVault)】']
        if (raw.startsWith('[磁盘加密')) {
          out.push('拿不到磁盘加密状态。')
          out.push('')
          out.push('解释：磁盘加密就像保险箱，把电脑里存的日记和宝贝都上了锁。')
          return out.join('\n')
        }
        if (/is On/i.test(raw)) {
          out.push('这台电脑把日记和宝贝都锁进保险箱啦🔒——磁盘加密是开着的。')
          out.push('就算小偷把整个硬盘拿走，没有钥匙也看不到里面的东西，很安全。')
        } else {
          out.push('这台电脑还没有上保险箱🔓——磁盘加密是关着的。')
          out.push('如果电脑丢了，放在里面的照片和文件可能被人直接打开看。')
          out.push('建议：让大人帮忙在「系统设置 › 隐私与安全性 › FileVault」里打开。')
        }
        out.push('')
        out.push('解释：磁盘加密=把整块硬盘的内容加密，钥匙是登录密码。')
        out.push('开着=保险箱锁好，关着=储物柜没锁。')
        return out.join('\n')
      },
    },

    // 3. 锁屏要密码：离开房间锁门
    {
      name: 'sec_lock',
      description:
        '看看这台电脑“离开后会不会自己锁门”——也就是多久没操作会自动锁屏，以及回来要不要输密码。就像你离开房间时锁门，别人进来就要钥匙；如果电脑从不锁屏，别人一坐下来就能看到你在干嘛。免 sudo。返回自动锁屏时长和“要不要密码”的状态。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const idleRaw = (await safe('自动锁屏', 'defaults -currentHost read com.apple.screensaver idleTime', t)).trim()
        // 是否要求密码：askForPassword 键可能不存在；不存在时 macOS 默认通常要求密码
        const pwdRaw = (await safe('唤醒要密码', 'defaults read com.apple.screensaver askForPassword', t)).trim()
        const out = ['【离开锁门 / 锁屏】']
        if (idleRaw.startsWith('[自动锁屏')) {
          out.push('拿不到这台电脑的自动锁屏设置。')
          return out.concat('', '解释：像离开房间要锁门一样，电脑闲置一会儿自动锁屏，别人就不能随便看了。').join('\n')
        }
        const idle = Number(idleRaw)
        const usesPassword = /does not exist/i.test(pwdRaw)
          ? '没单独设置过（通常默认是需要密码的）'
          : Number(pwdRaw) === 1 ? '需要'
          : '不需要'
        if (Number.isFinite(idle) && idle > 0) {
          out.push(`这台电脑闲置 ${humanDuration(idle)} 后会自动锁屏。`)
          out.push(`屏幕醒过来/回来看时要输密码：${usesPassword}。`)
          out.push(idle > 300
            ? '锁得有点慢：闲置这么久才锁，别人有空偷偷看了。可以让大人把自动锁屏时间调短（比如 5 分钟内）。'
            : '锁得挺勤快：离开一小会儿就会自动锁上，不错。')
        } else {
          out.push('这台电脑好像不会自动锁屏（没设闲置时长）。')
          out.push('这样你一离开，屏幕就一直开着，谁过来都能看到。建议让大人设置一个自动锁屏时间。')
        }
        out.push('')
        out.push('解释：锁屏=离开时把门带上，要密码=回来得用钥匙开门。')
        out.push('对小朋友来说理想要“过一会儿就自动锁 + 回来要输密码”。')
        return out.join('\n')
      },
    },

    // 4. 远程暗门：SSH / 屏幕共享端口
    {
      name: 'sec_door',
      description:
        '看看这台电脑有没有给外人留“后门 / 暗门”——也就是有没有开着能让人从网上远程溜进来的服务端口（远程登录 SSH 的 22 号端口、屏幕共享的 5900 号端口）。就像检查城堡墙上有没有偷偷开的小门。免 sudo。返回探测到的远程服务端口和一句解释。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        // 只探测监听中的端口：22=远程登录(SSH)，5900=屏幕共享(VNC)
        // 末尾加 || true：没匹配到端口时 grep 退出码为 1，会误被判成失败；补真让“空=没开”成立
        const raw = (await safe('远程端口', "netstat -an | grep -E '\\.(22|5900) .*LISTEN' || true", t)).trim()
        const out = ['【后门检查 / 远程服务端口】']
        if (raw.startsWith('[远程端口')) {
          out.push('拿不到端口探测结果。')
          out.push('')
          out.push('解释：有些服务（远程登录、屏幕共享）会让别人从网上连进这台电脑，像偷偷开的暗门。')
          return out.join('\n')
        }
        if (!raw) {
          out.push('没有发现开着的远程暗门🚪——22(远程登录) 和 5900(屏幕共享) 端口都没有在监听。')
          out.push('也就是说，这台电脑现在没有对外开“能溜进来的小门”，很好。')
          out.push('')
          out.push('要记住：暗门一般不会自己冒出来，通常是有人主动去开远程登录/屏幕共享才会有。')
          out.push('如果哪天发现这两个端口在听，要让大人确认是不是自己开的。')
          return out.join('\n')
        }
        const hasSSH = /\.22\s+.*LISTEN/i.test(raw)
        const hasVNC = /\.5900\s+.*LISTEN/i.test(raw)
        out.push('发现远程服务端口在“听”着：')
        if (hasSSH) out.push('  - 22 号端口（远程登录 SSH）：开着。')
        if (hasVNC) out.push('  - 5900 号端口（屏幕共享）：开着。')
        out.push('')
        out.push('有暗门不一定就是坏事——有时候是大人在用（比如远程修电脑）。')
        out.push('但要让大人确认一下：如果这台电脑不需要被远程连，最好把远程登录关掉。')
        out.push('（小朋友别自己乱开，远程连接很容易把电脑暴露给坏人。）')
        return out.join('\n')
      },
    },

    // 5. 开门记录：最近登录
    {
      name: 'sec_login',
      description:
        '看看最近的“开门记录”——也就是这台电脑最近都有哪些登录/开关机记录。就像城堡门口的登记簿，写着什么时候谁进来过、什么时候重启过。免 sudo。返回最近几次的登录与开机关机记录和一句解释。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = (await safe('开门记录', 'last -5', t)).trim()
        const out = ['【开门记录 / 最近登录】']
        if (raw.startsWith('[开门记录')) {
          out.push('拿不到登录记录。')
          out.push('')
          out.push('解释：电脑会记下谁登录过、什么时候开关机，像城堡门口的登记簿。')
          return out.join('\n')
        }
        if (!raw) {
          out.push('（没有可读取的登录记录）')
          return out.join('\n')
        }
        out.push('最近的记录（越靠前越新）：')
        for (const line of raw.split('\n').map(s => s.trim()).filter(Boolean)) {
          out.push(`  ${line}`)
        }
        out.push('')
        out.push('怎么看：如果发现登录的都是你这台电脑的主人自己（比如 baixiao），')
        out.push('那就是正常开门；如果哪天冒出你不认识的名字，要告诉大人，可能有人来偷看。')
        out.push('（平时记得锁屏+开机设密码，城堡的门就不会被陌生人打开啦。）')
        return out.join('\n')
      },
    },
  ]
}
