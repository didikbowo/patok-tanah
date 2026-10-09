import { sanitize, type PlotData } from './model'

export const STORAGE_KEY = 'patok:plot'

export type LoadResult =
  | { status: 'ok'; data: PlotData }
  | { status: 'empty' }
  | { status: 'corrupt' }
  | { status: 'unavailable' }

function getStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function load(storage: Storage | null = getStorage()): LoadResult {
  if (!storage) return { status: 'unavailable' }
  let raw: string | null
  try {
    raw = storage.getItem(STORAGE_KEY)
  } catch {
    return { status: 'unavailable' }
  }
  if (raw === null) return { status: 'empty' }
  try {
    const data = sanitize(JSON.parse(raw))
    return data ? { status: 'ok', data } : { status: 'corrupt' }
  } catch {
    return { status: 'corrupt' }
  }
}

/** Simpan data; mengembalikan `false` bila penyimpanan tidak tersedia/penuh. */
export function save(data: PlotData, storage: Storage | null = getStorage()): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clear(storage: Storage | null = getStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // abaikan: tidak ada yang bisa dilakukan bila storage tidak tersedia
  }
}
