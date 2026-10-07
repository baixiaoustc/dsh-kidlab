/** 资源监控插件配置。默认全开、免 sudo、无需第三方依赖。 */
export interface KidSysmonConfig {
    /** 是否启用整套工具 */
    enabled: boolean;
    /** 每个维度输出默认是否包含原始命令输出片段 */
    verbose: boolean;
    /** 采集命令超时（毫秒），避免个别命令卡住整个调用 */
    timeoutMs: number;
}
export declare const Config: any;
//# sourceMappingURL=config.d.ts.map