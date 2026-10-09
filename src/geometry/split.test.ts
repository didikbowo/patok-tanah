import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { area } from './measure'
import { computeTargets, splitPolygon, type SplitDir } from './split'
import type { Pt } from './types'
import { convexPolygon } from './test-helpers'

const square: Pt[] = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
]

const equal = (n: number, total: number) => Array.from({ length: n }, () => total / n)

describe('computeTargets', () => {
  it('sama luas', () => {
    expect(computeTargets('equal', [4], 100)).toEqual({ ok: true, targets: [25, 25, 25, 25] })
  })
  it('jumlah bagian di luar batas → error', () => {
    expect(computeTargets('equal', [1], 100).ok).toBe(false)
    expect(computeTargets('equal', [11], 100).ok).toBe(false)
    expect(computeTargets('equal', [2.5], 100).ok).toBe(false)
  })
  it('proporsi 2:1:1 dinormalisasi', () => {
    expect(computeTargets('ratio', [2, 1, 1], 100)).toEqual({ ok: true, targets: [50, 25, 25] })
  })
  it('luas tertentu + sisa', () => {
    expect(computeTargets('area', [30, 20], 100)).toEqual({ ok: true, targets: [30, 20, 50] })
  })
  it('luas melebihi total → error dengan selisih', () => {
    const r = computeTargets('area', [80, 30], 100)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toContain('10,00')
  })
  it('luas sama dengan total → error tidak ada sisa', () => {
    expect(computeTargets('area', [100], 100).ok).toBe(false)
  })
})

describe('splitPolygon', () => {
  it('persegi 10×10 dibagi 2 sejajar AB → garis di y = 5, patok 5 m', () => {
    const r = splitPolygon(square, { refSide: 0, dir: 'parallel', targets: [50, 50] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.pieces.map((p) => p.area)).toEqual([expect.closeTo(50, 5), expect.closeTo(50, 5)])
    const [cut] = r.cuts
    expect(cut.length).toBeCloseTo(10, 6)
    for (const s of cut.stakes) {
      expect(s.point.y).toBeCloseTo(5, 6)
      expect(s.distance).toBeCloseTo(5, 6)
    }
    expect(cut.stakes.map((s) => s.edge).sort()).toEqual([1, 3])
  })

  it('bagian pertama selalu yang menempel sisi acuan', () => {
    const r = splitPolygon(square, { refSide: 2, dir: 'parallel', targets: [30, 70] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    // Sisi acuan CD di y = 10, jadi garis potong ada di y = 7.
    expect(r.cuts[0].stakes[0].point.y).toBeCloseTo(7, 6)
    expect(r.pieces[0].area).toBeCloseTo(30, 5)
  })

  it('tegak lurus AB → garis vertikal, mulai dari ujung A', () => {
    const r = splitPolygon(square, { refSide: 0, dir: 'perpendicular', targets: [20, 80] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    for (const s of r.cuts[0].stakes) expect(s.point.x).toBeCloseTo(2, 6)
    const stake = r.cuts[0].stakes.find((s) => s.edge === 0)!
    expect(stake.fromVertex).toBe(0)
    expect(stake.distance).toBeCloseTo(2, 6)
  })

  it('trapesium dibagi 3 sama luas', () => {
    const trap: Pt[] = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 20, y: 10 },
      { x: 0, y: 20 },
    ]
    for (const dir of ['parallel', 'perpendicular'] as SplitDir[]) {
      const r = splitPolygon(trap, { refSide: 0, dir, targets: equal(3, 300) })
      expect(r.ok).toBe(true)
      if (!r.ok) return
      for (const p of r.pieces) expect(Math.abs(p.area - 100)).toBeLessThan(0.001)
      expect(r.cuts).toHaveLength(2)
    }
  })

  it('patok tepat di pojok dilaporkan berjarak 0 dari pojok itu', () => {
    // Segitiga siku: garis tegak lurus AB lewat C tepat di x = 10
    const tri: Pt[] = [
      { x: 0, y: 0 },
      { x: 20, y: 0 },
      { x: 10, y: 10 },
    ]
    const r = splitPolygon(tri, { refSide: 0, dir: 'perpendicular', targets: [50, 50] })
    expect(r.ok).toBe(true)
    if (!r.ok) return
    const atC = r.cuts[0].stakes.find((s) => s.fromVertex === 2)!
    expect(atC.distance).toBeCloseTo(0, 6)
  })

  it('bentuk U yang terbelah lebih dari 2 potong → ditolak', () => {
    const u: Pt[] = [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 20 },
      { x: 20, y: 20 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ]
    expect(area(u)).toBeCloseTo(500)
    const ok = splitPolygon(u, { refSide: 0, dir: 'parallel', targets: [250, 250] })
    expect(ok.ok).toBe(true)
    const bad = splitPolygon(u, { refSide: 0, dir: 'parallel', targets: equal(4, 500) })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.kind).toBe('multipiece')
  })

  it('garis yang tepat menyusuri dasar lekukan U → ditolak', () => {
    const u: Pt[] = [
      { x: 0, y: 0 },
      { x: 30, y: 0 },
      { x: 30, y: 20 },
      { x: 20, y: 20 },
      { x: 20, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 20 },
      { x: 0, y: 20 },
    ]
    // Bagian bawah tepat 300 m² → garis di y = 10, sejajar dasar lekukan.
    const r = splitPolygon(u, { refSide: 0, dir: 'parallel', targets: [300, 200] })
    expect(r.ok).toBe(false)
  })

  it('bidang searah jarum jam tetap membagi ke arah dalam', () => {
    const cw = [...square].reverse()
    const r = splitPolygon(cw, { refSide: 0, dir: 'parallel', targets: [25, 75] })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.pieces[0].area).toBeCloseTo(25, 5)
  })

  it('properti: jumlah luas bagian = luas total, tiap bagian sesuai target', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 10 }),
        fc.array(fc.double({ min: 0.05, max: 1, noNaN: true }), { minLength: 10, maxLength: 10 }),
        fc.double({ min: 5, max: 200, noNaN: true }),
        fc.array(fc.double({ min: 0.1, max: 5, noNaN: true }), { minLength: 2, maxLength: 10 }),
        fc.nat(),
        fc.boolean(),
        (n, gaps, radius, weights, refSeed, parallel) => {
          const poly = convexPolygon(n, gaps, radius)
          const total = area(poly)
          const t = computeTargets('ratio', weights, total)
          if (!t.ok) throw new Error(t.message)
          const r = splitPolygon(poly, {
            refSide: refSeed % n,
            dir: parallel ? 'parallel' : 'perpendicular',
            targets: t.targets,
          })
          expect(r.ok).toBe(true)
          if (!r.ok) return
          const sum = r.pieces.reduce((s, p) => s + p.area, 0)
          expect(Math.abs(sum - total)).toBeLessThan(1e-6 * Math.max(1, total))
          r.pieces.forEach((p, i) => expect(Math.abs(p.area - t.targets[i])).toBeLessThan(1e-4))
        },
      ),
      { numRuns: 300 },
    )
  })
})
