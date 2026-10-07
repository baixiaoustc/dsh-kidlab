import Schema from '@deepseek-ai/schemastery';
export const Config = Schema.intersect([
    Schema.object({
        enabled: Schema.boolean().description('启用整套工具').default(true),
        safeMode: Schema.boolean().description('演示安全模式（默认开）').default(true),
        timeoutMs: Schema.number().min(2000).max(30000).description('命令超时(ms)').default(12000),
    }),
]);
//# sourceMappingURL=config.js.map