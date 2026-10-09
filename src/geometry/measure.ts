import type { Pt } from './types'
import { cross, dist, sub } from './vec'

/** Luas bertanda (shoelace). Positif bila titik berurutan berlawanan arah jarum jam. */
export function signedArea(poly: Pt[]): number {
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    s += a.x * b.y - b.x * a.y
  }
  return s / 2
}

export const area = (poly: Pt[]): number => Math.abs(signedArea(poly))

export function perimeter(poly: Pt[]): number {
  let s = 0
  for (let i = 0; i < poly.length; i++) s += dist(poly[i], poly[(i + 1) % poly.length])
  return s
}

export function centroid(poly: Pt[]): Pt {
  const a = signedArea(poly)
  if (Math.abs(a) < 1e-12) {
    const n = poly.length || 1
    return { x: poly.reduce((s, p) => s + p.x, 0) / n, y: poly.reduce((s, p) => s + p.y, 0) / n }
  }
  let cx = 0
  let cy = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const f = p.x * q.y - q.x * p.y
    cx += (p.x + q.x) * f
    cy += (p.y + q.y) * f
  }
  return { x: cx / (6 * a), y: cy / (6 * a) }
}

function segmentsIntersect(p1: Pt, p2: Pt, q1: Pt, q2: Pt, eps: number): boolean {
  const d1 = cross(sub(p2, p1), sub(q1, p1))
  const d2 = cross(sub(p2, p1), sub(q2, p1))
  const d3 = cross(sub(q2, q1), sub(p1, q1))
  const d4 = cross(sub(q2, q1), sub(p2, q1))
  if (((d1 > eps && d2 < -eps) || (d1 < -eps && d2 > eps)) && ((d3 > eps && d4 < -eps) || (d3 < -eps && d4 > eps))) {
    return true
  }
  const onSeg = (a: Pt, b: Pt, p: Pt, d: number) =>
    Math.abs(d) <= eps &&
    Math.min(a.x, b.x) - eps <= p.x &&
    p.x <= Math.max(a.x, b.x) + eps &&
    Math.min(a.y, b.y) - eps <= p.y &&
    p.y <= Math.max(a.y, b.y) + eps
  return onSeg(p1, p2, q1, d1) || onSeg(p1, p2, q2, d2) || onSeg(q1, q2, p1, d3) || onSeg(q1, q2, p2, d4)
}

/** True bila ada dua sisi tidak bersebelahan yang saling bersilangan atau bersentuhan. */
export function selfIntersects(poly: Pt[]): boolean {
  const n = poly.length
  const scaleRef = Math.max(1, ...poly.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))))
  const eps = 1e-9 * scaleRef * scaleRef
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1)
      if (adjacent) continue
      if (segmentsIntersect(poly[i], poly[(i + 1) % n], poly[j], poly[(j + 1) % n], eps)) return true
    }
  }
  return false
}

export interface UnitFactors {
  tumbak: number
  bata: number
}

export interface AreaInUnits {
  m2: number
  are: number
  ha: number
  tumbak: number
  bata: number
}

export function toUnits(m2: number, f: UnitFactors): AreaInUnits {
  return { m2, are: m2 / 100, ha: m2 / 10000, tumbak: m2 / f.tumbak, bata: m2 / f.bata }
}
