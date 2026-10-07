// ============================================================
// kid-network · 模型工具层（host half 的一部分）
// 与旧版 @kidlab/dsh-kid-network 的工具集【输出逐字一致】，只有注册方式变了：
//   不再用 defineTool() 包装——那要求从 profile 的 node_modules 解析
//   @deepseek-ai/dsh-tools，而 link: 安装的 bundle 解析不到外部包；
//   改成返回普通对象，由 index.js 交给 ctx.tools.register()。
//   （旧源码存档在 legacy/old-dynamic-plugin/src/tools.ts。）
// 五个工具：
//   net_my_identity  网络身份名片（局域网 IP / 网关 / DNS / 公网 IP+位置+运营商）
//   net_trace_trip   一封“数据信”的旅行路径（traceroute 讲故事）
//   net_test_speed   实测下载网速
//   net_who_is_home  局域网“全家福”（认识哪些邻居设备）
//   net_dns          网址“翻译官”（域名 → IP）
// 全部命令硬编码常量、不拼接用户输入（防注入）、免 sudo、单命令超时容错。
// ============================================================
import { execFile } from 'node:child_process'

/** 统一的返回形状：一段文本。 */
const TEXT_OUTPUT = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: value }],
}

/**
 * 三个不收参数的（net_my_identity / net_test_speed / net_who_is_home）用这个形状。
 * 与旧版 `defineTool({ parameters: {} })` 在注册表里投影出来的**完全一致**
 * （`{type:'object',properties:{}}`，线上 Tool.listTools 可核对）：
 * 注意 `properties` 里不要额外写 `additionalProperties`——投影会多一个键，
 * 模型的调用契约就变了（见迁移指南 14.2）。
 */
const NO_PARAMS = { type: 'object', properties: {} }

/**
 * 固定“目标”枚举 → 硬编码域名/主机。用户只能选常量，绝不拼接自由输入（防注入）。
 * 全部选国内可达站点，保证给小朋友演示能跑通。
 */
const TRACE_TARGETS = {
  baidu: 'www.baidu.com',
  taobao: 'www.taobao.com',
  aliyun: 'www.aliyun.com',
  qq: 'www.qq.com',
  bilibili: 'www.bilibili.com',
}

const DNS_TARGETS = {
  baidu: 'www.baidu.com',
  taobao: 'www.taobao.com',
  aliyun: 'www.aliyun.com',
  qq: 'www.qq.com',
  bilibili: 'www.bilibili.com',
}

/**
 * 两个收 `target` 参数的工具（net_trace_trip / net_dns）的参数形状。
 * 旧版 `defineTool({ parameters: { target: {…} } })` 未标 required，
 * 所以这里也不写 required：`target` 是可选参数，不填默认 baidu。
 */
const TARGET_PARAMS = (description) => ({
  type: 'object',
  properties: {
    target: {
      type: 'string',
      enum: Object.keys(TRACE_TARGETS),
      description,
    },
  },
})

function fmtSpeed(bytesPerSec) {
  if (!isFinite(bytesPerSec) || bytesPerSec <= 0) return '测速失败'
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / 1024 / 1024).toFixed(2)} MB/s`
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`
  return `${bytesPerSec.toFixed(0)} B/s`
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
    return `[${label} 失败] ${e instanceof Error ? e.message : String(e)}`
  }
}

/**
 * kid-network：给小朋友的网络启蒙工具集。
 * 全部命令硬编码常量、不拼接用户输入；免 sudo；单命令超时容错。
 * @param {{ timeoutMs: number }} config 已归一化的配置
 * @returns {object[]} 可直接交给 ctx.tools.register 的普通对象
 */
export function buildNetworkTools(config) {
  const t = config.timeoutMs

  return [
    // 1. 网络身份名片
    {
      name: 'net_my_identity',
      description:
        '查这台电脑在网络上的“身份信息”：局域网 IP（家里给的名字）、默认网关（出口大门）、DNS（翻译官所在）、公网 IP + 位置 + 运营商（互联网上全世界看到你的名字和城市）。免 sudo。返回分段文本。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const lines = []
        const lan = (await safe('局域网IP', 'ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null', t)).trim()
        lines.push('【局域网地址】', lan || '未找到活跃的以太网/Wi-Fi 接口')
        const gw = (await safe('网关', "netstat -rn | awk '/default/ && $1==\"default\" && $2 ~ /^[0-9]/ {print $2; exit}'", t)).trim()
        lines.push('', '【默认网关（出口大门）】', gw || '未解析到默认网关')
        const dns = (await safe('DNS', "scutil --dns | awk '/nameserver\\[/ {print $3}' | sort -u | head -5", t)).split('\n').map(s => s.trim()).filter(Boolean)
        lines.push('', '【DNS 翻译官】', dns.length ? dns.join('\n') : '未解析到 DNS')
        const pub = (await safe('公网', 'curl -s --max-time 6 cip.cc', t)).trim()
        lines.push('', '【公网地址（互联网身份证）】')
        if (pub.startsWith('[公网')) lines.push(pub)
        else lines.push(pub || '未能获取（可能断网）')
        return lines.filter(l => l !== '').join('\n')
      },
    },

    // 2. 数据信旅行路径
    {
      name: 'net_trace_trip',
      description:
        '追踪一封“数据信”从这台电脑出发，一路经过哪些网关/城市才到达远方网站（traceroute）。适合解释“数据不是凭空传送，而是一站一站跳过去的”。目标只能从预设列表选。',
      parameters: TARGET_PARAMS('要去哪个网站，如 baidu / taobao / aliyun / qq / bilibili。'),
      output: TEXT_OUTPUT,
      async execute(args) {
        const key = (args && args.target) || 'baidu'
        const host = TRACE_TARGETS[key] || TRACE_TARGETS.baidu
        const raw = await safe('traceroute', `traceroute -q 1 -m 15 -w 1 ${host}`, t)
        // 把“第几跳 IP”提炼成更易懂的列表，模型再讲故事
        const hops = []
        for (const line of raw.split('\n')) {
          const m = line.match(/^\s*(\d+)\s+([^\s(]+)/)
          if (m && !line.includes('* * *')) hops.push(m[1] + '. ' + m[2])
        }
        return [
          `目的地: ${host}`,
          hops.length ? '旅行路径（第几跳 → 到哪台设备）:\n' + hops.join('\n') : '路径未探测到（可能断网或目标拒绝响应）',
          '',
          '原始输出:\n' + raw.split('\n').slice(0, 20).join('\n'),
        ].join('\n')
      },
    },

    // 3. 实测网速
    {
      name: 'net_test_speed',
      description:
        '实测这台电脑的下载网速：从一个固定的测速服务器下载一个小文件，算出每秒能收多少数据。整个过程几秒就完成。返回下载速度（MB/s）。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = (await safe('测速', "curl -s -o /dev/null -w '%{speed_download} %{size_download} %{time_total}' --max-time 10 'https://speed.cloudflare.com/__down?bytes=3000000'", t)).trim()
        const parts = raw.split(' ').map(Number)
        const speed = parts[0] ?? 0
        const sizeKB = parts[1] ? (parts[1] / 1024).toFixed(0) : '?'
        const secs = parts[2] ? parts[2].toFixed(1) : '?'
        return [
          '下载网速（刚实测）:',
          `  ${fmtSpeed(speed)}  (约下载了 ${sizeKB} KB，用了 ${secs} 秒)`,
          '',
          '解释: 这个数字代表一秒钟能从互联网收进多少东西。数字越大，看视频/下文件越流畅。',
          raw.startsWith('[测速失败]') ? '' : `原始: ${raw} B/s`,
        ].filter(l => l !== '').join('\n')
      },
    },

    // 4. 局域网设备全家福
    {
      name: 'net_who_is_home',
      description:
        '看这台电脑当前“认识”的局域网邻居：列出家里/办公室网络上一段内已联系过的设备（IP、MAC、主机名，有的会显示手机/电脑的品牌名）。适合解释“同一 WiFi 下的设备是怎么打招呼的”。',
      parameters: NO_PARAMS,
      output: TEXT_OUTPUT,
      async execute() {
        const raw = (await safe('邻居设备', 'arp -a', t)).trim()
        const lines = raw.split('\n').map(s => s.trim()).filter(Boolean)
        if (raw.startsWith('[邻居设备')) return raw
        // arp -a 形如: hostname (IP) at MAC on en0 ifscope [ethernet]
        const parsed = []
        for (const l of lines) {
          const m = l.match(/^([^(\s]+)\s*\(([\d.]+)\)\s*at\s+([0-9a-f:]+)/i)
          if (m) parsed.push(`${m[1]}  IP ${m[2]}  MAC ${m[3]}`)
        }
        return [
          `局域网认识的设备（共 ${parsed.length || lines.length} 条，可能不含未联系过的设备）:`,
          parsed.length ? parsed.join('\n') : raw,
          '',
          '说明: 名字里有品牌词（如 vivo / iPhone / Xiaomi）的，多半是家人的手机或平板。',
        ].join('\n')
      },
    },

    // 5. DNS 翻译官
    {
      name: 'net_dns',
      description:
        '演示“网址翻译官”DNS 的作用：把给小朋友看的“网址”（如 www.baidu.com）翻译成电脑真正用来找路的 IP 地址。目标只能从预设列表选。',
      parameters: TARGET_PARAMS('要翻译哪个网址，如 baidu / taobao / aliyun / qq / bilibili。'),
      output: TEXT_OUTPUT,
      async execute(args) {
        const key = (args && args.target) || 'baidu'
        const host = DNS_TARGETS[key] || DNS_TARGETS.baidu
        const raw = (await safe('DNS', `dig +short ${host}`, t)).trim()
        const ipLines = raw.split('\n').filter(l => /^\d+(\.\d+){3}$/.test(l))
        return [
          `网址（小朋友看的）: ${host}`,
          ipLines.length
            ? `翻译成 IP（机器用的）:\n${ipLines.join('\n')}`
            : '没有解析出 IP（可能断网或该站无 A 记录）',
          '',
          '解释: 就像“查电话本”——你要找“baidu 的家”，得先看它家在哪个门牌号（IP），才能寄快递过去。',
          raw ? '原始:\n' + raw.split('\n').slice(0, 8).join('\n') : '',
        ].filter(l => l !== '').join('\n')
      },
    },
  ]
}
