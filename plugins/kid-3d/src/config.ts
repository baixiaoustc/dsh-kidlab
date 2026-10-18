import Schema from '@deepseek-ai/schemastery'

/**
 * kid-3d「小小 3D 积木工坊」配置。
 *
 * 全部免 sudo、零第三方运行时依赖：工坊只在自己的作品目录里读写 JSON/图片/模型文件，
 * 不执行任何 shell 命令，也不申请任何网络或系统权限。
 */
export interface Kid3dConfig {
  /** 是否启用整套工具 */
  enabled: boolean
  /** 单次工具调用超时（毫秒） */
  timeoutMs: number
  /** 作品目录（相对当前会话的工作目录），所有积木数据和成品文件都放这里 */
  workDir: string
  /** 新工坊的边长（格），8~32 */
  defaultSize: number
  /** 一个工坊最多能摆几件积木 */
  maxPieces: number
  /** 导出 3D 打印文件时，1 格等于多少毫米 */
  unitMm: number
  /** 「会转圈的网页」最多画多少个面，超过就退回静态图（太密会卡） */
  interactiveMaxFaces: number
  /** 网页里带上「按住拖动转视角」的交互脚本（用真浏览器打开才生效） */
  dragOrbit: boolean
}

/**
 * 默认配置。每个字段都与下方 Schema 的 `.default(...)` 保持一致。
 *
 * host 的 apply 会用它兜底：静态 bundle 的行里通常不写 `config`，
 * 若加载器没有按 `Config` schema 注入默认值，`config` 就是 undefined；
 * 这里归一化后，`config.enabled` 等字段一定存在。
 */
export const DEFAULT_CONFIG: Kid3dConfig = {
  enabled: true,
  timeoutMs: 8000,
  workDir: 'kid3d',
  defaultSize: 16,
  maxPieces: 300,
  unitMm: 5,
  interactiveMaxFaces: 1200,
  dragOrbit: true,
}

export const Config = Schema.intersect([
  Schema.object({
    enabled: Schema.boolean().description('启用整套工具').default(true),
    timeoutMs: Schema.number().min(1000).max(30000).description('单次调用超时(ms)').default(8000),
    workDir: Schema.string().description('作品目录(相对工作目录)').default('kid3d'),
    defaultSize: Schema.number().min(8).max(32).description('新工坊边长(格)').default(16),
    maxPieces: Schema.number().min(10).max(2000).description('最多积木件数').default(300),
    unitMm: Schema.number().min(0.1).max(50).description('1 格等于多少毫米').default(5),
    interactiveMaxFaces: Schema.number().min(50).max(20000).description('网页自转的面数上限').default(1200),
    dragOrbit: Schema.boolean().description('网页可按住拖动转视角').default(true),
  }),
])
