import Schema from '@deepseek-ai/schemastery'

/** 内存启蒙插件配置。默认全开、免 sudo、无需第三方依赖。 */
export interface KidMemoryConfig {
  /** 是否启用整套工具 */
  enabled: boolean
  /** 采集命令超时（毫秒），避免个别命令卡住整个调用 */
  timeoutMs: number
}

export const Config = Schema.intersect([
  Schema.object({
    enabled: Schema.boolean().description('启用整套工具').default(true),
    timeoutMs: Schema.number().min(1000).max(30000).description('命令超时(ms)').default(8000),
  }),
])