import type { Pt } from './types'
import { dot, lerp } from './vec'

/**
 * Potong poligon dengan setengah-bidang {p : p·w ≤ t} (Sutherland–Hodgman).
 * Untuk poligon cekung yang terpotong menjadi beberapa potong, hasilnya memuat
 * sisi "jembatan" berluas nol — luasnya tetap benar, bentuknya tidak.
 */
export function clipHalfPlane(poly: Pt[], w: Pt, t: number): Pt[] {
  const out: Pt[] = []
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const cur = poly[i]
    const next = poly[(i + 1) % n]
    const dc = dot(cur, w) - t
    const dn = dot(next, w) - t
    if (dc <= 0) out.push(cur)
    if ((dc < 0 && dn > 0) || (dc > 0 && dn < 0)) {
      out.push(lerp(cur, next, dc / (dc - dn)))
    }
  }
  return dedupe(out)
}

/** Buang titik berurutan yang sama (termasuk titik terakhir = titik pertama). */
export function dedupe(poly: Pt[], eps = 1e-9): Pt[] {
  const out: Pt[] = []
  for (const p of poly) {
    const last = out[out.length - 1]
    if (!last || Math.abs(last.x - p.x) > eps || Math.abs(last.y - p.y) > eps) out.push(p)
  }
  while (out.length > 1) {
    const a = out[0]
    const b = out[out.length - 1]
    if (Math.abs(a.x - b.x) > eps || Math.abs(a.y - b.y) > eps) break
    out.pop()
  }
  return out
}

/**
 * Hitung berapa kali garis {p·w = t} memotong batas poligon.
 * Titik yang tepat di garis dihitung dua cara (ikut sisi bawah / sisi atas) dan
 * diambil yang terbesar, supaya garis yang menyusuri sisi cekung tetap terdeteksi.
 */
export function boundaryCrossings(poly: Pt[], w: Pt, t: number, eps: number): number {
  const count = (zeroBelow: boolean) => {
    let c = 0
    const n = poly.length
    for (let i = 0; i < n; i++) {
      const side = (p: Pt) => {
        const d = dot(p, w) - t
        return Math.abs(d) <= eps ? zeroBelow : d < 0
      }
      if (side(poly[i]) !== side(poly[(i + 1) % n])) c++
    }
    return c
  }
  return Math.max(count(true), count(false))
}
