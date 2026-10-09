import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { buildShape } from './build'
import { area, perimeter } from './measure'
import { convexPolygon } from './test-helpers'
import { dist } from './vec'

const r2 = Math.SQRT2
const noFlip = (n: number) => Array(n).fill(false)

describe('buildShape', () => {
  it('persegi 10×10', () => {
    const r = buildShape({ sides: [10, 10, 10, 10], diagonals: [10 * r2], flip: noFlip(4) })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(area(r.points)).toBeCloseTo(100, 6)
    expect(perimeter(r.points)).toBeCloseTo(40, 6)
    expect(r.points[2].x).toBeCloseTo(10)
    expect(r.points[2].y).toBeCloseTo(10)
    expect(r.points[3].x).toBeCloseTo(0)
    expect(r.points[3].y).toBeCloseTo(10)
  })

  it('persegi panjang 20×15', () => {
    const r = buildShape({ sides: [20, 15, 20, 15], diagonals: [25], flip: noFlip(4) })
    expect(r.ok && area(r.points)).toBeCloseTo(300, 6)
  })

  it('segitiga 3-4-5', () => {
    const r = buildShape({ sides: [3, 4, 5], diagonals: [], flip: noFlip(3) })
    expect(r.ok && area(r.points)).toBeCloseTo(6, 6)
  })

  it('trapesium siku', () => {
    // A(0,0) B(20,0) C(20,10) D(0,20): luas (10+20)/2 × 20 = 300
    const r = buildShape({ sides: [20, 10, Math.hypot(20, 10), 20], diagonals: [Math.hypot(20, 10)], flip: noFlip(4) })
    expect(r.ok && area(r.points)).toBeCloseTo(300, 6)
  })

  it('bentuk L dengan pojok A di pojok dalam: tanpa balik', () => {
    // A(10,10) B(10,20) C(0,20) D(0,0) E(20,0) F(20,10): 20×20 − 10×10 = 300
    const d = Math.hypot(10, 10)
    const r = buildShape({ sides: [10, 10, 20, 20, 10, 10], diagonals: [d, d, d], flip: noFlip(6) })
    expect(r.ok).toBe(true)
    expect(r.ok && area(r.points)).toBeCloseTo(300, 6)
  })

  it('bentuk L dengan diagonal di luar bidang: perlu balik di pojok C', () => {
    // A(20,10) B(10,10) C(10,20) D(0,20) E(0,0) F(20,0)
    const sides = [10, 10, 10, 20, 20, 10]
    const diagonals = [Math.hypot(10, 10), Math.hypot(20, 10), Math.hypot(20, 10)]
    const flip = noFlip(6)
    flip[2] = true
    const r = buildShape({ sides, diagonals, flip })
    expect(r.ok).toBe(true)
    expect(r.ok && area(r.points)).toBeCloseTo(300, 6)

    // Tanpa balik, bentuk yang terbentuk berbeda (dan menyilang).
    const wrong = buildShape({ sides, diagonals, flip: noFlip(6) })
    expect(wrong.ok && Math.abs(area(wrong.points) - 300) < 1).toBe(false)
  })

  it('segitiga mustahil 1-1-5 → error yang menyebut segitiganya', () => {
    const r = buildShape({ sides: [1, 1, 5], diagonals: [], flip: noFlip(3) })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors[0].message).toContain('ABC')
    expect(r.errors[0].fields).toHaveLength(3)
  })

  it('error menunjuk segitiga kedua dan kolom diagonalnya', () => {
    const r = buildShape({ sides: [10, 10, 2, 2], diagonals: [14], flip: noFlip(4) })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors[0].message).toContain('ACD')
    expect(r.errors[0].fields).toContainEqual({ kind: 'diag', index: 0 })
  })

  it('selisih kecil (≤0,5%) → peringatan, tetap dihitung', () => {
    // AB + BC = 20, AC = 20,05 → selisih 0,25%
    const r = buildShape({ sides: [10, 10, 15, 15], diagonals: [20.05], flip: noFlip(4) })
    expect(r.ok).toBe(true)
    expect(r.warnings).toHaveLength(1)
    expect(r.warnings[0].message).toContain('hampir segaris')
  })

  it('kolom kosong atau ≤ 0 → error per kolom', () => {
    const r = buildShape({ sides: [10, null, 0, 10], diagonals: [null], flip: noFlip(4) })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors.map((e) => e.fields[0])).toEqual([
      { kind: 'side', index: 1 },
      { kind: 'side', index: 2 },
      { kind: 'diag', index: 0 },
    ])
  })

  it('balik yang membuat sisi bersilangan → error "bentuk menyilang"', () => {
    const flip = noFlip(4)
    flip[3] = true
    const r = buildShape({ sides: [20, 10, 20, 10], diagonals: [Math.hypot(20, 10)], flip })
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.errors[0].message).toContain('menyilang')
  })

  it('jumlah diagonal salah → error', () => {
    const r = buildShape({ sides: [10, 10, 10, 10], diagonals: [], flip: noFlip(4) })
    expect(r.ok).toBe(false)
  })

  it('properti: poligon cembung acak dibangun ulang dari sisi + diagonal dengan luas yang sama', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }),
        fc.array(fc.double({ min: 0.05, max: 1, noNaN: true }), { minLength: 10, maxLength: 10 }),
        fc.double({ min: 5, max: 200, noNaN: true }),
        (n, gaps, radius) => {
          const poly = convexPolygon(n, gaps, radius)
          const sides = poly.map((p, i) => dist(p, poly[(i + 1) % n]))
          const diagonals = poly.slice(2, n - 1).map((p) => dist(poly[0], p))
          const r = buildShape({ sides, diagonals, flip: noFlip(n) })
          expect(r.ok).toBe(true)
          if (r.ok) expect(area(r.points)).toBeCloseTo(area(poly), 4)
        },
      ),
      { numRuns: 300 },
    )
  })
})
