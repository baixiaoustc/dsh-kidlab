import { type ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { KidMemoryConfig } from './config.ts';
/**
 * kid-memory：给小朋友的「内存/工作台」启蒙工具集。
 *
 * 隐喻：内存 = 电脑的“工作台”（也是它大脑的“短期记忆”）。
 *   - 总内存 = 这张工作台能摊多大
 *   - 已用   = 现在摊了多少在做的任务/玩具
 *   - 压力   = 工作台挤不挤
 *   - 占用榜 = 谁占的位置最多（贪吃鬼）
 * 对应 kid-storage：硬盘 = 大仓库（长期记忆），内存 = 工作台（短期记忆）。
 * 全部命令硬编码常量、不拼接用户输入、免 sudo、单命令超时容错。
 */
export declare function buildMemoryTools(config: KidMemoryConfig): ToolDefinition[];
//# sourceMappingURL=tools.d.ts.map