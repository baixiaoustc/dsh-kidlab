import Schema from '@deepseek-ai/schemastery'

/** 网络启蒙插件配置。默认全开、免 sudo、无需第三方依赖。 */
export interface KidNetworkConfig {
  /** 是否启用整套工具 */
  enabled: boolean
  /** 模式：true=演示用稳定默认；目前保留字段，后续可按需扩展 */
  safeMode: boolean
  /** 采集/测速命令超时（毫秒），个别慢命令（traceroute / 测速）不卡住整体 */
  timeoutMs: number
}

export const Config = Schema.intersect([
  Schema.object({
    enabled: Schema.boolean().description('启用整套工具').default(true),
    safeMode: Schema.boolean().description('演示安全模式（默认开）').default(true),
    timeoutMs: Schema.number().min(2000).max(30000).description('命令超时(ms)').default(12000),
  }),
])