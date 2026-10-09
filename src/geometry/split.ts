import { boundaryCrossings, clipHalfPlane } from './clip'
import { area, perimeter, signedArea } from './measure'
import type { Pt } from './types'
import { dist, dot, lerp, perp, scale, sub, unit } from './vec'

export type SplitDir = 'parallel' | 'perpendicular'
export type SplitMode = 'equal' | 'ratio' | 'area'

export const MAX_PARTS = 10

/** Toleransi galat luas saat mencari posisi garis potong (m²). */
const AREA_TOLERANCE = 1e-7

export type TargetResult = { ok: true; targets: number[] } | { ok: false; message: string }

/**
 * Ubah pilihan pembagian menjadi daftar luas target per bagian (m²).
 * - equal: `values = [jumlah bagian]`
 * - ratio: `values = bobot tiap bagian`
 * - area:  `values = luas bagian 1..N−1 dalam m²`; bagian terakhir = sisa
 */
export function computeTargets(mode: SplitMode, values: (number | null)[], total: number): TargetResult {
  const positive = (v: number | null): v is number => v !== null && Number.isFinite(v) && v > 0
  if (mode === 'equal') {
    const count = values[0]
    if (!positive(count) || !Number.isInteger(count) || count < 2 || count > MAX_PARTS) {
      return { ok: false, message: `Jumlah bagian harus bilangan bulat 2–${MAX_PARTS}.` }
    }
    return { ok: true, targets: Array.from({ length: count }, () => total / count) }
  }
  if (mode === 'ratio') {
    if (values.length < 2 || values.length > MAX_PARTS) {
      return { ok: false, message: `Jumlah bagian harus 2–${MAX_PARTS}.` }
    }
    const bad = values.findIndex((v) => !positive(v))
    if (bad >= 0) return { ok: false, message: `Isi bobot bagian ${bad + 1} (lebih dari 0).` }
    const sum = (values as number[]).reduce((a, b) => a + b, 0)
    return { ok: true, targets: (values as number[]).map((v) => (total * v) / sum) }
  }
  if (values.length < 1 || values.length > MAX_PARTS - 1) {
    return { ok: false, message: `Jumlah bagian harus 2–${MAX_PARTS}.` }
  }
  const bad = values.findIndex((v) => !positive(v))
  if (bad >= 0) return { ok: false, message: `Isi luas bagian ${bad + 1} (lebih dari 0).` }
  const fixed = values as number[]
  const used = fixed.reduce((a, b) => a + b, 0)
  const rest = total - used
  if (rest <= total * 1e-6) {
    const over = used - total
    return {
      ok: false,
      message:
        over > 0
          ? `Total luas yang diminta melebihi luas bidang sebesar ${fmt(over)} m².`
          : 'Total luas yang diminta sama dengan luas bidang, tidak ada sisa untuk bagian terakhir.',
    }
  }
  return { ok: true, targets: [...fixed, rest] }
}

const fmt = (v: number) => v.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Posisi patok: titik potong garis pembagi dengan sisi bidang. */
export interface Stake {
  point: Pt
  /** Indeks sisi yang terpotong (sisi i = pojok i → pojok i+1). */
  edge: number
  /** Pojok terdekat pada sisi tersebut, tempat meteran ditarik. */
  fromVertex: number
  /** Jarak dari pojok terdekat (m). 0 = tepat di pojok. */
  distance: number
}

export interface Cut {
  stakes: [Stake, Stake]
  length: number
}

export interface Piece {
  poly: Pt[]
  area: number
  perimeter: number
  fraction: number
}

export type SplitResult =
  | { ok: true; pieces: Piece[]; cuts: Cut[] }
  | { ok: false; message: string; kind: 'multipiece' | 'invalid' }

export interface SplitRequest {
  refSide: number
  dir: SplitDir
  /** Luas target tiap bagian (m²), berurutan mulai dari sisi acuan / ujung awal sisi acuan. */
  targets: number[]
}

/** Arah normal keluarga garis potong {p·w = t}. */
export function cutNormal(poly: Pt[], refSide: number, dir: SplitDir): Pt {
  const a = poly[refSide]
  const b = poly[(refSide + 1) % poly.length]
  const e = unit(sub(b, a))
  if (dir === 'perpendicular') return e
  const inward = perp(e)
  return signedArea(poly) >= 0 ? inward : scale(inward, -1)
}

export function splitPolygon(poly: Pt[], req: SplitRequest): SplitResult {
  const n = poly.length
  if (req.refSide < 0 || req.refSide >= n) return { ok: false, kind: 'invalid', message: 'Sisi acuan tidak valid.' }
  const total = area(poly)
  const w = cutNormal(poly, req.refSide, req.dir)
  const proj = poly.map((p) => dot(p, w))
  const tMin = Math.min(...proj)
  const tMax = Math.max(...proj)
  const sizeRef = Math.max(tMax - tMin, 1)
  const eps = 1e-9 * sizeRef

  const areaBelow = (t: number) => area(clipHalfPlane(poly, w, t))

  // Cari posisi tiap garis potong dengan bisection pada luas kumulatif.
  const ts: number[] = []
  let cumulative = 0
  let lo = tMin
  for (let i = 0; i < req.targets.length - 1; i++) {
    cumulative += req.targets[i]
    let a = lo
    let b = tMax
    let mid = (a + b) / 2
    for (let iter = 0; iter < 200; iter++) {
      mid = (a + b) / 2
      const diff = areaBelow(mid) - cumulative
      if (Math.abs(diff) < AREA_TOLERANCE || b - a < 1e-12 * sizeRef) break
      if (diff < 0) a = mid
      else b = mid
    }
    ts.push(mid)
    lo = mid
  }

  for (let i = 0; i < ts.length; i++) {
    if (boundaryCrossings(poly, w, ts[i], eps) > 2) {
      return {
        ok: false,
        kind: 'multipiece',
        message: `Garis potong ${i + 1} membelah bidang menjadi lebih dari 2 potong karena bentuknya cekung. Coba sisi acuan atau arah lain.`,
      }
    }
  }

  const cuts: Cut[] = []
  for (let i = 0; i < ts.length; i++) {
    const stakes = findStakes(poly, w, ts[i], eps)
    if (!stakes) {
      return {
        ok: false,
        kind: 'multipiece',
        message: `Garis potong ${i + 1} menyentuh pojok yang menjorok ke dalam sehingga bagiannya tidak menyatu. Coba sisi acuan atau arah lain.`,
      }
    }
    cuts.push({ stakes, length: dist(stakes[0].point, stakes[1].point) })
  }

  const neg = scale(w, -1)
  const pieces: Piece[] = req.targets.map((_, i) => {
    let p = poly
    if (i < ts.length) p = clipHalfPlane(p, w, ts[i])
    if (i > 0) p = clipHalfPlane(p, neg, -ts[i - 1])
    const a = area(p)
    return { poly: p, area: a, perimeter: perimeter(p), fraction: a / total }
  })

  return { ok: true, pieces, cuts }
}

function findStakes(poly: Pt[], w: Pt, t: number, eps: number): [Stake, Stake] | null {
  const n = poly.length
  const stakes: Stake[] = []
  for (let i = 0; i < n; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % n]
    const dp = dot(p, w) - t
    const dq = dot(q, w) - t
    if (Math.abs(dp) <= eps) {
      stakes.push({ point: p, edge: i, fromVertex: i, distance: 0 })
    } else if (Math.abs(dq) > eps && dp * dq < 0) {
      const k = dp / (dp - dq)
      const L = dist(p, q)
      const fromStart = k * L
      const fromEnd = L - fromStart
      stakes.push(
        fromStart <= fromEnd
          ? { point: lerp(p, q, k), edge: i, fromVertex: i, distance: fromStart }
          : { point: lerp(p, q, k), edge: i, fromVertex: (i + 1) % n, distance: fromEnd },
      )
    }
  }
  if (stakes.length !== 2) return null
  // Urutkan sepanjang arah garis supaya urutan patok konsisten.
  const along = perp(w)
  stakes.sort((a, b) => dot(a.point, along) - dot(b.point, along))
  return [stakes[0], stakes[1]]
}
