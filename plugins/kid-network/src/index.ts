import { Context } from '@deepseek-ai/cordis'
import { Config, type KidNetworkConfig } from './config.ts'
import { buildNetworkTools } from './tools.ts'

export const name = 'kid-network'
export const inject = ['tools']
export { Config }
export type { KidNetworkConfig }

/**
 * kid-network：给小朋友的「网络启蒙」工具插件。
 *
 * 装载后向 harness 注册 5 个工具：
 *   net_my_identity  —— 我的电脑在网络上的“身份证+住址”（局域网 IP / 网关 / DNS / 公网 IP+位置+运营商）
 *   net_trace_trip   —— 一封“数据信”从我家旅行到远方网站的路径（traceroute 讲故事）
 *   net_test_speed   —— 实测网速（下载一个小文件算速度）
 *   net_who_is_home  —— 家里网络“全家福”（局域网里都有哪些设备）
 *   net_dns          —— 网址“翻译官”演示（把域名翻译成机器用的 IP 地址）
 *
 * 与 mac-sysmon 的分工：sysmon 讲“这台电脑用得多不多”（含网络速率/流量）；
 * 本插件讲“电脑怎么连上网、数据怎么去远方”（身份 / 寻址 / 路径 / 测速 / 设备）。
 * 设计一律安全：命令全部硬编码常量、不拼接用户输入（防注入）、免 sudo、
 * 单命令超时 + 失败只报一行不中断。
 */
export function apply(ctx: Context, config: KidNetworkConfig) {
  if (!config.enabled) return
  for (const tool of buildNetworkTools(config)) {
    ctx.tools.register(tool)
  }
}