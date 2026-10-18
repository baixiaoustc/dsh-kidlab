/**
 * esbuild 打包入口（仅构建期使用）：把 host 半部的公开出口集中到一个入口，
 * 由 `node build.mjs` 打成自包含的单文件 `../index.js`。运行时不加载本文件。
 */
export { name, apply, Config } from './index.ts'
export { buildKid3dTools } from './tools.ts'
