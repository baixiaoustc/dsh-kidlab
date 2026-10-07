import { execFile } from 'node:child_process';
import { defineTool } from '@deepseek-ai/dsh-tools';
/** 在 macOS 上跑一条 shell 命令，返回 stdout 文本；失败时抛错（由调用方兜底）。 */
function run(cmd, timeoutMs) {
    return new Promise((resolve, reject) => {
        execFile('/bin/sh', ['-c', cmd], { timeout: timeoutMs, encoding: 'utf8' }, (err, stdout) => {
            if (err)
                reject(err);
            else
                resolve(stdout);
        });
    });
}
/** 包一层：单条命令失败不拖垮整体，转为一行错误说明。 */
async function safe(label, cmd, timeoutMs) {
    try {
        return await run(cmd, timeoutMs);
    }
    catch (e) {
        return `[${label} 采集失败] ${e instanceof Error ? e.message : String(e)}`;
    }
}
/** 字节数转成给小朋友看的 GB。总内存用 hw.memsize（字节）。 */
function humanBytes(bytes) {
    if (bytes >= 1024 * 1024 * 1024)
        return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
    if (bytes >= 1024 * 1024)
        return (bytes / 1024 / 1024).toFixed(0) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
}
/** KB 数（ps RSS 用 KB）转成给小朋友看的 GB/MB。 */
function humanKB(kb) {
    if (kb >= 1024 * 1024)
        return (kb / 1024 / 1024).toFixed(1) + ' GB';
    if (kb >= 1024)
        return (kb / 1024).toFixed(0) + ' MB';
    return kb.toFixed(0) + ' KB';
}
/** 从进程的可执行路径里抽出“小朋友能看懂的名字”（App 名 / 程序名）。 */
function prettyName(comm) {
    const raw = comm.trim();
    const app = raw.match(/^(?:.*\/)?(.+?)\.app\//) || raw.match(/^(?:.*\/)?(.+?)\.app$/);
    if (app)
        return app[1].replace(/\s+Helper.*$/, '');
    const last = raw.split('/').pop() || raw;
    return last.replace(/\s+\(.*\)$/, '') || 'unknown';
}
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
export function buildMemoryTools(config) {
    const t = config.timeoutMs;
    return [
        // 1. 工作台多大：总内存
        defineTool({
            name: 'mem_workbench',
            description: '看看这台电脑的“工作台”有多大——也就是总内存有多少。内存就是电脑拿来“同时记住正在做的几件事”的地方，越大能同时摊开越多任务和程序，电脑就越不容易卡。免 sudo。返回总内存和一句解释。',
            parameters: {},
            output: {
                schema: { type: 'string' },
                render: (_args, value) => [{ type: 'text', text: value }],
            },
            async execute() {
                const raw = (await safe('总内存', 'sysctl -n hw.memsize', t)).trim();
                if (raw.startsWith('[总内存'))
                    return raw;
                const bytes = Number(raw);
                if (!Number.isFinite(bytes) || bytes <= 0)
                    return '[总内存采集异常] 没拿到这台电脑的总内存。';
                const out = [];
                out.push('【工作台 / 总内存】');
                out.push(`这台电脑的工作台一共有 ${humanBytes(bytes)} 可以同时摊开使用。`);
                out.push('');
                out.push('解释：内存就是电脑大脑的“短期记忆”——正在做的程序都摊在这张工作台上。');
                out.push('工作台越大，能同时开很多程序、多任务都不卡；工作台不够大，东西就只能排队等。');
                return out.join('\n');
            },
        }),
        // 2. 现在摊了多少：已用 / 空闲
        defineTool({
            name: 'mem_now',
            description: '看看这台电脑的工作台“现在摊了多少东西”——内存现在用了多少、还剩多少、占用百分之几。适合给小朋友讲“内存是用一点少一点的短期记忆，关掉不用的程序就腾出来了”。免 sudo。返回已用/空闲/占用百分比。',
            parameters: {},
            output: {
                schema: { type: 'string' },
                render: (_args, value) => [{ type: 'text', text: value }],
            },
            async execute() {
                const raw = await safe('内存用量', 'top -l 1 -n 0 | grep PhysMem', t);
                if (raw.startsWith('[内存用量'))
                    return raw;
                const m = raw.match(/PhysMem:\s*([\d.]+)([MGK]?)\s*used.*?,\s*([\d.]+)([MGK]?)\s*unused/i);
                const totalRaw = (await safe('总内存', 'sysctl -n hw.memsize', t)).trim();
                const totalBytes = Number(totalRaw);
                const totalMB = Number.isFinite(totalBytes) && totalBytes > 0 ? totalBytes / 1024 / 1024 : 0;
                if (!m)
                    return '[内存用量解析失败] 拿到的内存数据格式不对：\n' + raw;
                const usedMB = m[2] === 'G' ? Number(m[1]) * 1024 : m[2] === 'K' ? Number(m[1]) / 1024 : Number(m[1]);
                const freeMB = m[4] === 'G' ? Number(m[3]) * 1024 : m[4] === 'K' ? Number(m[3]) / 1024 : Number(m[3]);
                const base = totalMB || usedMB + freeMB;
                const pct = Math.round((usedMB / base) * 100);
                const toBytes = (mb) => mb * 1024 * 1024;
                const out = [];
                out.push('【工作台现在摊了多少】');
                out.push(`已经摊开(已用) ${humanBytes(toBytes(usedMB))}，还空着(空闲) ${humanBytes(toBytes(freeMB))}，`);
                out.push(`工作台占用约 ${pct}%（总 ${humanBytes(toBytes(base))}）。`);
                out.push('');
                out.push('解释：内存是短期记忆，开着的程序都在这张工作台上。');
                if (pct >= 80) {
                    out.push('别担心：电脑会自动把暂时不用的东西先放到一边（缓存），需要时再腾出来；');
                    out.push('到底紧不紧张，要再看「工作台挤不挤」那个工具（内存压力）。');
                }
                out.push('关掉不用的程序，就像把玩具收回大仓库，工作台就腾出空位来啦。');
                return out.join('\n');
            },
        }),
        // 3. 谁在占工作台：内存占用 Top
        defineTool({
            name: 'mem_top',
            description: '找出谁在占着这台电脑的工作台——内存占用最大的几个程序。带小朋友一起看看“谁是占位置最多的贪吃鬼”，通常浏览器、视频、微信这些开得多的最占内存。免 sudo。返回按内存占用排序的前 12 名。',
            parameters: {},
            output: {
                schema: { type: 'string' },
                render: (_args, value) => [{ type: 'text', text: value }],
            },
            async execute() {
                // ps RSS 单位是 KB；取前 16 行再做名净化
                const raw = await safe('占用榜', 'ps -axo rss=,comm= | sort -rn | head -n 16', t);
                if (raw.startsWith('[占用榜'))
                    return raw;
                const out = ['【谁在占工作台 / 内存贪吃鬼 Top】'];
                if (!raw.trim())
                    return out.concat('（没有可读取的程序占用信息）').join('\n');
                let rank = 0;
                for (const r of raw.split('\n').map(s => s.trim()).filter(Boolean)) {
                    const m = r.match(/^(\d+)\s+(.+)$/);
                    if (!m)
                        continue;
                    const kb = Number(m[1]);
                    const name = prettyName(m[2]);
                    if (!kb || !name)
                        continue;
                    rank += 1;
                    out.push(`${String(rank).padStart(2)}. ${humanKB(kb).padStart(8)}  ${name}`);
                    if (rank >= 12)
                        break;
                }
                out.push('');
                out.push('说明：排名越靠前，占的“工作台”位置越多。');
                out.push('如果觉得电脑卡，多半是这几个“贪吃鬼”把工作台占满啦。');
                return out.join('\n');
            },
        }),
        // 4. 工作台挤不挤：内存压力
        defineTool({
            name: 'mem_pressure',
            description: '看看这台电脑的工作台“挤不挤”——也就是内存压力/空闲率。如果很挤，说明打开的太多了，电脑会变卡。免 sudo。返回内存空闲百分比和一句“宽裕/有点挤/很紧张”的解读。',
            parameters: {},
            output: {
                schema: { type: 'string' },
                render: (_args, value) => [{ type: 'text', text: value }],
            },
            async execute() {
                const raw = await safe('内存压力', 'memory_pressure -Q', t);
                if (raw.startsWith('[内存压力'))
                    return raw;
                const m = raw.match(/free percentage:\s*(\d+)/i);
                if (!m)
                    return '[内存压力解析失败] 没拿到空闲率：\n' + raw;
                const freePct = Number(m[1]);
                const hint = freePct >= 50 ? '很宽裕，工作台空位很多，电脑不卡。'
                    : freePct >= 20 ? '有点挤，工作台用了不少，开太多东西可能会慢。'
                        : '很紧张！工作台快被占满了，电脑可能会卡，建议关掉一些不用的程序。';
                const out = [];
                out.push('【工作台挤不挤 / 内存压力】');
                out.push(`内存还有 ${freePct}% 是空着的。`);
                out.push(`现在：${hint}`);
                out.push('');
                out.push('解释：空闲率越高，工作台越宽裕，电脑跑得越顺。');
                out.push('如果太低，把不用的程序关掉（收回大仓库），工作台就舒服啦。');
                return out.join('\n');
            },
        }),
    ];
}
//# sourceMappingURL=tools.js.map