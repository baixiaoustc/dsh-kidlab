import { Context } from '@deepseek-ai/cordis'
import { registerKid3dCard } from './card.ts'
import { Config, type Kid3dConfig } from './config.ts'
import { buildKid3dTools } from './tools.ts'

export const name = 'kid-3d'
export { Config }
export type { Kid3dConfig }

/**
 * kid-3d：给小朋友的「3D 积木工坊」体验插件。
 *
 * 装载后向 harness 注册 8 个工具：
 *   kid3d_new      —— 开一间新工坊（作品名字、大小、地面）
 *   kid3d_build    —— 放一块积木（方块/球/圆柱/圆锥/棱锥/圆环）
 *   kid3d_erase    —— 拆掉和某块区域有接触的积木
 *   kid3d_paint    —— 给积木换颜色
 *   kid3d_template —— 一键搭出小房子/小城堡/小火箭…
 *   kid3d_open     —— 打开 存档/ 里的旧作品接着玩（不写名字就列出清单）
 *   kid3d_view     —— 画一张立体图（斜/正/侧/俯/四视图），并刷新会转圈的网页
 *   kid3d_export   —— 打包成 STL（3D 打印）/ OBJ / HTML
 *
 * 设计原则：所有作品数据都是工坊目录里 1 个 JSON 文件，图画是纯 SVG + 无脚本的
 * CSS 3D 网页，所以孩子和大人都能直接打开看；不执行 shell、不联网、免 sudo。
 *
 * Web 界面里的「工坊卡片」也在本包：`client.js` 就是那块 client 半部，
 * manifest 里带 `dsh.client.platform = 'web'`，和合并后的 🧳 kid-storage 一个套路
 * （一个包 = 插件行 + 卡片，见迁移指南 §14）。卡片要的两条只读同源路由由本文件
 * 一并挂上（src/card.ts → lib/card.js），所以卡片只认这一个包，装一次就齐活。
 *
 * 分工用**子注入**而不是顶层 `export const inject = ['tools']`：没有 tools 能力的
 * profile 里本插件照样激活，路由照常挂（卡片还在）；反过来 headless 启动没有
 * webServer，就只剩工具。
 */
export function apply(ctx: Context, config: Kid3dConfig) {
  if (config.enabled) {
    ctx.inject(['tools'], (child) => {
      child.effect(() => {
        const offs = buildKid3dTools(config).map((tool) => child.tools.register(tool))
        return () => {
          for (const off of offs) if (typeof off === 'function') off()
        }
      }, 'kid-3d: kid3d_* 工具')
    })
  }
  // 卡片的两条路由和 enabled 无关：关掉工具也让人能看见已搭好的作品。
  registerKid3dCard(ctx, { workDir: config.workDir, unitMm: config.unitMm })
}
