import { type ToolDefinition } from '@deepseek-ai/dsh-tools';
import type { KidSysmonConfig } from './config.ts';
/**
 * 免 sudo 采集一个或多个维度的 MacBook 资源使用情况。
 * 每个维度独立容错；需要 root 的项（如温度）返回“需权限”标注而不中断。
 */
export declare function buildSysmonTools(config: KidSysmonConfig): ToolDefinition[];
//# sourceMappingURL=tools.d.ts.map