// 本地 precheck：模拟 harness precheckCode —— 用 node:vm 编译两 half 的函数体，
// 只解析不执行，确保证明能通过 cordis_define 的定义时预检。
import { readFileSync } from 'node:fs'
import { Script } from 'node:vm'

for (const f of ['cordis/host.js', 'cordis/client.js']) {
  const code = readFileSync(f, 'utf8')
  try {
    new Script(`(async () => {\n${code}\n})()`, { filename: `precheck-${f}` })
    console.log(`[OK] ${f} 语法通过`)
  } catch (e) {
    console.error(`[FAIL] ${f}:`, e.message)
    process.exitCode = 1
  }
}