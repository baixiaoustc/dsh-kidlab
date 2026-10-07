/** 网络启蒙插件配置。默认全开、免 sudo、无需第三方依赖。 */
export interface KidNetworkConfig {
    /** 是否启用整套工具 */
    enabled: boolean;
    /** 模式：true=演示用稳定默认；目前保留字段，后续可按需扩展 */
    safeMode: boolean;
    /** 采集/测速命令超时（毫秒），个别慢命令（traceroute / 测速）不卡住整体 */
    timeoutMs: number;
}
export declare const Config: any;
//# sourceMappingURL=config.d.ts.map