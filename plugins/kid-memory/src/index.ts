import { Context } from '@deepseek-ai/cordis'
import { Config, type KidMemoryConfig } from './config.ts'
import { buildMemoryTools } from './tools.ts'

export const name = 'kid-memory'
export const inject = ['tools']
export { Config }
export type { KidMemoryConfig }

/**
 * kid-memory：给小朋友的「内存/工作台」启蒙工具插件。
 *
 * 装载后向 harness 注册 4 个工具：
 *   mem_workbench —— 工作台多大（这台电脑总内存是多少）
 *   mem_now       —— 现在摊了多少（已用/可用/占用百分比）
 *   mem_top       —— 谁在占工作台（内存占用最大的进程 Top）
 *   mem_pressure  —— 工作台挤不挤（内存压力/空闲率）
 *
 * 设计原则：沿用 B 型真执行命令范式（sysctl / top / ps / memory_pressure），
 * 全部免 sudo、硬编码命令常量、单命令超时容错；把“内存=电脑的工作台、
 * 短期记忆”讲给小朋友听（硬盘的“大仓库”是长期记忆，见 kid-storage）。
 */
export function apply(ctx: Context, config: KidMemoryConfig) {
  if (!config.enabled) return
  for (const tool of buildMemoryTools(config)) {
    ctx.tools.register(tool)
  }
}