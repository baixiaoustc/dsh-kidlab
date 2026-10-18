/**
 * 文件读写：作品存在 <小朋友的工作目录>/kid3d/ 里。
 *
 *  - model.json        当前作品（下次接着玩）
 *  - <名字>.svg        立体图（每次改动都会自动刷新）
 *  - <名字>.html       会自己转圈的网页
 *  - <名字>.stl/.obj   能送去 3D 打印的文件
 *  - 存档/…            每次换新作品前，旧作品会自动留一份
 */

import { mkdir, readFile, readdir, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, join, resolve, sep } from 'node:path'

import { parseModel, normalizeName } from './model.ts'
import type { Model } from './types.ts'

export interface Paths {
  /** 工坊目录（所有作品文件都放这里） */
  dir: string
  modelFile: string
  archiveDir: string
}

/** 配置里的目录名只允许是「一层普通名字」，避免写到工作目录外面去。 */
export function safeWorkDir(input: string): string {
  const cleaned = input.replace(/[\\/:*?"<>|]/g, '').replace(/\./g, '').trim()
  return cleaned === '' ? 'kid3d' : cleaned
}

export function pathsFor(cwd: string, workDir: string): Paths {
  const root = resolve(cwd)
  const dir = join(root, safeWorkDir(workDir))
  return { dir, modelFile: join(dir, 'model.json'), archiveDir: join(dir, '存档') }
}

/** 拼出作品文件名，并且保证它一定在工坊目录里面。 */
export function fileFor(paths: Paths, name: string, extension: string): string {
  const base = normalizeName(name, '我的作品')
  const file = resolve(paths.dir, `${base}.${extension}`)
  if (!file.startsWith(paths.dir + sep)) return join(paths.dir, `我的作品.${extension}`)
  return file
}

export async function ensureDirs(paths: Paths): Promise<void> {
  await mkdir(paths.dir, { recursive: true })
}

export async function readModel(paths: Paths): Promise<Model | undefined> {
  try {
    const text = await readFile(paths.modelFile, 'utf8')
    return parseModel(text)
  } catch {
    return undefined
  }
}

export async function writeModel(paths: Paths, model: Model): Promise<void> {
  await ensureDirs(paths)
  await writeFile(paths.modelFile, `${JSON.stringify(model, null, 2)}\n`, 'utf8')
}

export async function writeText(paths: Paths, file: string, text: string): Promise<void> {
  await ensureDirs(paths)
  await writeFile(file, text, 'utf8')
}

export async function writeBinary(paths: Paths, file: string, data: Buffer): Promise<void> {
  await ensureDirs(paths)
  await writeFile(file, data)
}

function stamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/** 把当前作品留一份存档（换新作品之前会自动调用）。 */
export async function archiveModel(paths: Paths, model: Model): Promise<string | undefined> {
  if (model.pieces.length === 0) return undefined
  try {
    await mkdir(paths.archiveDir, { recursive: true })
    const file = join(paths.archiveDir, `${stamp(new Date())}-${normalizeName(model.name, '我的作品')}.json`)
    await writeText(paths, file, `${JSON.stringify(model, null, 2)}\n`)
    await trimArchive(paths.archiveDir, 40)
    return file
  } catch {
    return undefined
  }
}

async function trimArchive(dir: string, keep: number): Promise<void> {
  try {
    const names = (await readdir(dir)).filter((n) => n.endsWith('.json'))
    if (names.length <= keep) return
    const dated = await Promise.all(
      names.map(async (name) => {
        const info = await stat(join(dir, name))
        return { name, time: info.mtimeMs }
      }),
    )
    dated.sort((a, b) => a.time - b.time)
    for (const item of dated.slice(0, dated.length - keep)) {
      await unlink(join(dir, item.name))
    }
  } catch {
    // 清存档失败不影响小朋友玩
  }
}

export interface ArchiveEntry {
  /** 存档文件名（带时间戳，小朋友要打开哪一件就用它点名） */
  file: string
  /** 作品名字 */
  name: string
  /** 存档时间（毫秒），读不到就是 0 */
  time: number
  /** 里面有几件积木 */
  pieces: number
}

/** 列出存档，最新的排前面；没有存档目录就是空清单。 */
export async function listArchive(paths: Paths): Promise<ArchiveEntry[]> {
  try {
    const names = (await readdir(paths.archiveDir)).filter((n) => n.endsWith('.json'))
    const rows = await Promise.all(
      names.map(async (file) => {
        const full = join(paths.archiveDir, file)
        const model = await readFile(full, 'utf8').then(parseModel).catch(() => undefined)
        if (model === undefined) return undefined
        const time = await stat(full).then((info) => info.mtimeMs).catch(() => 0)
        return { file, name: model.name, time, pieces: model.pieces.length }
      }),
    )
    return rows.filter((row): row is ArchiveEntry => row !== undefined).sort((a, b) => b.time - a.time)
  } catch {
    return []
  }
}

/** 读一件存档作品；只认存档目录里的文件名，别处的一律不读。 */
export async function readArchive(paths: Paths, file: string): Promise<Model | undefined> {
  const full = resolve(paths.archiveDir, basename(file))
  if (!full.startsWith(paths.archiveDir + sep)) return undefined
  try {
    return parseModel(await readFile(full, 'utf8'))
  } catch {
    return undefined
  }
}
