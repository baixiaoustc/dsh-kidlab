import { Context } from '@deepseek-ai/cordis'
import { Config, type KidSysmonConfig } from './config.ts'
import { buildSysmonTools } from './tools.ts'

export const name = 'kid-sysmon'
export const inject = ['tools']
export { Config }
export type { KidSysmonConfig }

/**
 * kid-sysmon：MacBook 资源使用情况监控工具插件。
 *
 * 装载后向 harness 注册 1 个工具：
 *   system_status —— 查询 CPU / 内存 / 磁盘 / 网络 / 电池 / 负载 / Top 进程
 *
 * 与 Kid-coder 不同：本插件工具会**真正执行 macOS 命令**拿实时数据
 * （sysctl / top / vm_stat / df / pmset / ps / route / ping 等），
 * 全部免 sudo、免第三方依赖；需要 root 的项（如温度）会如实标注“需权限”
 * 而不中断采集。
 */
export function apply(ctx: Context, config: KidSysmonConfig) {
  if (!config.enabled) return
  for (const tool of buildSysmonTools(config)) {
    ctx.tools.register(tool)
  }
}