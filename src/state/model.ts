import { buildShape, MAX_SIDES, MIN_SIDES, type BuildResult } from '../geometry/build'
import { area, toUnits, type AreaInUnits } from '../geometry/measure'
import { computeTargets, MAX_PARTS, splitPolygon, type SplitDir, type SplitMode, type SplitResult } from '../geometry/split'

export const SCHEMA_VERSION = 1

export type AreaUnit = 'm2' | 'tumbak' | 'bata'

export interface SplitSettings {
  on: boolean
  /** Indeks sisi acuan. */
  ref: number
  dir: SplitDir
  mode: SplitMode
  /** Mode "sama luas": jumlah bagian. */
  count: number
  /** Mode "proporsi": bobot tiap bagian. */
  ratios: (number | null)[]
  /** Mode "luas tertentu": luas bagian 1..N−1 dalam `areaUnit`; bagian terakhir = sisa. */
  areas: (number | null)[]
  areaUnit: AreaUnit
}

export interface PlotData {
  v: typeof SCHEMA_VERSION
  sides: (number | null)[]
  diagonals: (number | null)[]
  flip: boolean[]
  split: SplitSettings
  units: { tumbak: number; bata: number }
}

export const DEFAULT_UNIT_FACTOR = 14

/** Contoh awal: segiempat tidak beraturan. */
export function defaultPlot(): PlotData {
  return {
    v: SCHEMA_VERSION,
    sides: [20, 12, 18, 14],
    diagonals: [24],
    flip: [false, false, false, false],
    split: defaultSplit(),
    units: { tumbak: DEFAULT_UNIT_FACTOR, bata: DEFAULT_UNIT_FACTOR },
  }
}

export function defaultSplit(): SplitSettings {
  return { on: false, ref: 0, dir: 'parallel', mode: 'equal', count: 2, ratios: [1, 1], areas: [null], areaUnit: 'm2' }
}

/**
 * Ubah jumlah sisi tanpa membuang data yang sudah diisi.
 * Menambah pojok: sisi penutup lama (mis. DA) menjadi diagonal baru (AD), dua sisi baru dikosongkan.
 * Mengurangi pojok: kebalikannya — diagonal terakhir menjadi sisi penutup.
 */
export function setSideCount(data: PlotData, n: number): PlotData {
  const target = Math.max(MIN_SIDES, Math.min(MAX_SIDES, Math.round(n)))
  let sides = [...data.sides]
  let diagonals = [...data.diagonals]
  let flip = [...data.flip]
  while (sides.length < target) {
    const closing = sides.pop() ?? null
    diagonals.push(closing)
    sides.push(null, null)
    flip.push(false)
  }
  while (sides.length > target) {
    sides = sides.slice(0, -2)
    sides.push(diagonals.pop() ?? null)
    flip = flip.slice(0, -1)
  }
  const ref = Math.min(data.split.ref, target - 1)
  return { ...data, sides, diagonals, flip, split: { ...data.split, ref } }
}

/** Baca angka dari teks input; menerima koma atau titik sebagai desimal. */
export function parseNumber(text: string): number | null {
  let t = text.trim().replace(/\s/g, '')
  if (!t) return null
  if (t.includes(',') && t.includes('.')) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(',', '.')
  if (!/^\d*\.?\d+$|^\d+\.$/.test(t)) return null
  const v = Number(t)
  return Number.isFinite(v) ? v : null
}

export function formatNumber(v: number, digits = 2): string {
  return v.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** Angka untuk diisi ulang ke kolom input (tanpa pemisah ribuan, koma desimal). */
export function formatInput(v: number | null): string {
  if (v === null) return ''
  return String(Math.round(v * 1e6) / 1e6).replace('.', ',')
}

export interface Computation {
  build: BuildResult
  area: AreaInUnits | null
  perimeter: number | null
  split: SplitResult | { ok: false; kind: 'targets'; message: string } | null
  targets: number[] | null
}

export function unitFactor(data: PlotData, unit: AreaUnit): number {
  return unit === 'm2' ? 1 : data.units[unit]
}

export function compute(data: PlotData): Computation {
  const build = buildShape({ sides: data.sides, diagonals: data.diagonals, flip: data.flip })
  if (!build.ok) return { build, area: null, perimeter: null, split: null, targets: null }

  const total = area(build.points)
  const perimeter = (data.sides as number[]).reduce((a, b) => a + b, 0)
  const result: Computation = { build, area: toUnits(total, data.units), perimeter, split: null, targets: null }

  const s = data.split
  if (!s.on) return result
  const factor = unitFactor(data, s.areaUnit)
  const values =
    s.mode === 'equal' ? [s.count] : s.mode === 'ratio' ? s.ratios : s.areas.map((v) => (v === null ? null : v * factor))
  const targets = computeTargets(s.mode, values, total)
  if (!targets.ok) {
    result.split = { ok: false, kind: 'targets', message: targets.message }
    return result
  }
  result.targets = targets.targets
  result.split = splitPolygon(build.points, { refSide: s.ref, dir: s.dir, targets: targets.targets })
  return result
}

// ---------- Validasi data dari luar (localStorage / link) ----------

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)
const isLength = (v: unknown) => v === null || (isNum(v) && v > 0 && v < 1e7)
const isLengthList = (v: unknown, n: number) => Array.isArray(v) && v.length === n && v.every(isLength)

/** Kembalikan PlotData yang valid, atau `null` bila data rusak / versinya tidak dikenal. */
export function sanitize(raw: unknown): PlotData | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (r.v !== SCHEMA_VERSION) return null
  const sides = r.sides
  if (!Array.isArray(sides) || sides.length < MIN_SIDES || sides.length > MAX_SIDES) return null
  const n = sides.length
  if (!isLengthList(sides, n) || !isLengthList(r.diagonals, n - 3)) return null
  if (!Array.isArray(r.flip) || r.flip.length !== n || !r.flip.every((f) => typeof f === 'boolean')) return null

  const u = r.units as Record<string, unknown> | undefined
  if (!u || !isNum(u.tumbak) || u.tumbak <= 0 || !isNum(u.bata) || u.bata <= 0) return null

  const s = r.split as Record<string, unknown> | undefined
  if (!s || typeof s.on !== 'boolean') return null
  if (!isNum(s.ref) || !Number.isInteger(s.ref) || s.ref < 0 || s.ref >= n) return null
  if (s.dir !== 'parallel' && s.dir !== 'perpendicular') return null
  if (s.mode !== 'equal' && s.mode !== 'ratio' && s.mode !== 'area') return null
  if (!isNum(s.count) || !Number.isInteger(s.count) || s.count < 2 || s.count > MAX_PARTS) return null
  if (!Array.isArray(s.ratios) || s.ratios.length < 2 || s.ratios.length > MAX_PARTS || !s.ratios.every(isLength)) return null
  if (!Array.isArray(s.areas) || s.areas.length < 1 || s.areas.length > MAX_PARTS - 1 || !s.areas.every(isLength)) return null
  if (s.areaUnit !== 'm2' && s.areaUnit !== 'tumbak' && s.areaUnit !== 'bata') return null

  return {
    v: SCHEMA_VERSION,
    sides: sides as (number | null)[],
    diagonals: r.diagonals as (number | null)[],
    flip: r.flip as boolean[],
    split: {
      on: s.on,
      ref: s.ref,
      dir: s.dir,
      mode: s.mode,
      count: s.count,
      ratios: s.ratios as (number | null)[],
      areas: s.areas as (number | null)[],
      areaUnit: s.areaUnit,
    },
    units: { tumbak: u.tumbak, bata: u.bata },
  }
}
