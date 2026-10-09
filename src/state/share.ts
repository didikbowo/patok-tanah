import { sanitize, SCHEMA_VERSION, type AreaUnit, type PlotData } from './model'
import type { SplitDir, SplitMode } from '../geometry/split'

/**
 * Format link: `#d=<base64url(JSON array ringkas)>`.
 * Data ada di hash URL sehingga tidak pernah terkirim ke server.
 *
 * Array: [versi, sisi[], diagonal[], bitmaskBalik, split[], [tumbak, bata]]
 * split: [aktif(0/1), acuan, arah, mode, jumlah, bobot[], luas[], satuan]
 */
export const HASH_PREFIX = '#d='

const DIRS: SplitDir[] = ['parallel', 'perpendicular']
const MODES: SplitMode[] = ['equal', 'ratio', 'area']
const UNITS: AreaUnit[] = ['m2', 'tumbak', 'bata']

const round = (v: number | null) => (v === null ? null : Math.round(v * 1e4) / 1e4)

export function encode(data: PlotData): string {
  const flipMask = data.flip.reduce((m, f, i) => (f ? m | (1 << i) : m), 0)
  const s = data.split
  const arr = [
    data.v,
    data.sides.map(round),
    data.diagonals.map(round),
    flipMask,
    [
      s.on ? 1 : 0,
      s.ref,
      DIRS.indexOf(s.dir),
      MODES.indexOf(s.mode),
      s.count,
      s.ratios.map(round),
      s.areas.map(round),
      UNITS.indexOf(s.areaUnit),
    ],
    [data.units.tumbak, data.units.bata],
  ]
  return toBase64Url(JSON.stringify(arr))
}

/** Kembalikan data dari kode link, atau `null` bila rusak / versinya tidak dikenal. */
export function decode(code: string): PlotData | null {
  try {
    const arr = JSON.parse(fromBase64Url(code))
    if (!Array.isArray(arr) || arr[0] !== SCHEMA_VERSION) return null
    const [v, sides, diagonals, flipMask, s, units] = arr
    if (!Array.isArray(sides) || typeof flipMask !== 'number' || !Array.isArray(s) || !Array.isArray(units)) return null
    return sanitize({
      v,
      sides,
      diagonals,
      flip: sides.map((_: unknown, i: number) => (flipMask & (1 << i)) !== 0),
      split: {
        on: s[0] === 1,
        ref: s[1],
        dir: DIRS[s[2]],
        mode: MODES[s[3]],
        count: s[4],
        ratios: s[5],
        areas: s[6],
        areaUnit: UNITS[s[7]],
      },
      units: { tumbak: units[0], bata: units[1] },
    })
  } catch {
    return null
  }
}

export function shareUrl(data: PlotData, base: string): string {
  return base.split('#')[0] + HASH_PREFIX + encode(data)
}

/** Ambil kode dari hash URL; `null` bila hash bukan link data. */
export function codeFromHash(hash: string): string | null {
  return hash.startsWith(HASH_PREFIX) ? hash.slice(HASH_PREFIX.length) : null
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}
