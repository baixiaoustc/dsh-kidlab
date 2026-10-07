import Schema from '@deepseek-ai/schemastery';
export const Config = Schema.intersect([
    Schema.object({
        enabled: Schema.boolean().description('启用整套工具').default(true),
        verbose: Schema.boolean().description('输出附带关键原始数据片段').default(false),
        timeoutMs: Schema.number().min(1000).max(30000).description('命令超时(ms)').default(8000),
    }),
]);
//# sourceMappingURL=config.js.map