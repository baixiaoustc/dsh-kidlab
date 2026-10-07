import { type ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { KidNetworkConfig } from './config.ts';
/**
 * kid-network：给小朋友的网络启蒙工具集。
 * 全部命令硬编码常量、不拼接用户输入；免 sudo；单命令超时容错。
 */
export declare function buildNetworkTools(config: KidNetworkConfig): ToolDefinition[];
//# sourceMappingURL=tools.d.ts.map