import { area, selfIntersects } from './measure'
import { diagName, sideName, vertexName, type FieldRef, type Issue, type Pt } from './types'
import { add, perp, scale, sub, unit } from './vec'

export const MIN_SIDES = 3
export const MAX_SIDES = 10
/** Batas selisih pertidaksamaan segitiga yang masih dianggap salah baca meteran (0,5%). */
export const TRIANGLE_TOLERANCE = 0.005

export interface ShapeInput {
  /** Panjang sisi AB, BC, ..., sisi terakhir kembali ke A. `null` = belum diisi. */
  sides: (number | null)[]
  /** Diagonal AC, AD, ... (N−3 buah). */
  diagonals: (number | null)[]
  /** Per pojok (indeks pojok): pilih titik di sisi seberang diagonal. Hanya berlaku untuk pojok C dan seterusnya. */
  flip: boolean[]
}

export type BuildResult =
  | { ok: true; points: Pt[]; warnings: Issue[] }
  | { ok: false; errors: Issue[]; warnings: Issue[] }

const sideRef = (index: number): FieldRef => ({ kind: 'side', index })
const diagRef = (index: number): FieldRef => ({ kind: 'diag', index })

/**
 * Bangun koordinat pojok dari panjang sisi dan diagonal kipas dari pojok A.
 * A = (0,0), B = (AB, 0); tiap pojok berikutnya diletakkan dari segitiga A–Pk–Pk+1.
 */
export function buildShape(input: ShapeInput): BuildResult {
  const n = input.sides.length
  const errors: Issue[] = []
  const warnings: Issue[] = []

  if (n < MIN_SIDES || n > MAX_SIDES) {
    return { ok: false, errors: [{ message: `Jumlah sisi harus ${MIN_SIDES}–${MAX_SIDES}.`, fields: [] }], warnings }
  }
  if (input.diagonals.length !== n - 3) {
    return { ok: false, errors: [{ message: `Butuh tepat ${n - 3} diagonal.`, fields: [] }], warnings }
  }

  const bad = (v: number | null) => v === null || !Number.isFinite(v) || v <= 0
  input.sides.forEach((v, i) => {
    if (bad(v)) errors.push({ message: `Isi panjang sisi ${sideName(i, n)} (lebih dari 0).`, fields: [sideRef(i)] })
  })
  input.diagonals.forEach((v, i) => {
    if (bad(v)) errors.push({ message: `Isi panjang diagonal ${diagName(i)} (lebih dari 0).`, fields: [diagRef(i)] })
  })
  if (errors.length) return { ok: false, errors, warnings }

  const s = input.sides as number[]
  const d = input.diagonals as number[]
  const points: Pt[] = [{ x: 0, y: 0 }, { x: s[0], y: 0 }]

  for (let k = 1; k <= n - 2; k++) {
    // Segitiga A–Pk–Pk+1 dengan panjang a = |A Pk|, b = |Pk Pk+1|, c = |A Pk+1|.
    const a = k === 1 ? s[0] : d[k - 2]
    const aRef = k === 1 ? sideRef(0) : diagRef(k - 2)
    const b = s[k]
    const bRef = sideRef(k)
    const lastTriangle = k + 1 === n - 1
    const c = lastTriangle ? s[n - 1] : d[k - 1]
    const cRef = lastTriangle ? sideRef(n - 1) : diagRef(k - 1)
    const triName = 'A' + vertexName(k) + vertexName(k + 1)
    const fields = [aRef, bRef, cRef]

    const violation = Math.max(b - (a + c), a - (b + c), c - (a + b), 0)
    const relative = violation / Math.max(a, b, c)
    if (relative > TRIANGLE_TOLERANCE) {
      errors.push({
        message: `Segitiga ${triName} tidak mungkin terbentuk: satu sisinya lebih panjang dari jumlah dua sisi lainnya. Cek ulang ukuran yang ditandai.`,
        fields,
      })
      continue
    }
    if (violation > 0) {
      warnings.push({
        message: `Ukuran segitiga ${triName} hampir segaris (selisih ${(relative * 100).toFixed(2)}%). Cek ulang ukurannya.`,
        fields,
      })
    }
    if (errors.length) continue

    const P0 = points[0]
    const Pk = points[k]
    const e = unit(sub(Pk, P0))
    let x = (a * a + c * c - b * b) / (2 * a)
    x = Math.max(-c, Math.min(c, x))
    const h = Math.sqrt(Math.max(0, c * c - x * x))
    const sign = input.flip[k + 1] ? -1 : 1
    points.push(add(P0, add(scale(e, x), scale(perp(e), sign * h))))
  }

  if (errors.length) return { ok: false, errors, warnings }

  // A di (0,0) dan B di sumbu x, jadi semua pojok segaris bila semua y ≈ 0.
  const scaleRef = Math.max(...s)
  if (points.every((p) => Math.abs(p.y) < 1e-6 * scaleRef)) {
    return {
      ok: false,
      errors: [{ message: 'Semua pojok berada pada satu garis, luasnya nol. Cek ulang ukuran.', fields: [] }],
      warnings,
    }
  }
  if (selfIntersects(points) || area(points) < 1e-6 * scaleRef * scaleRef) {
    return {
      ok: false,
      errors: [
        {
          message: 'Bentuk menyilang: ada sisi yang saling memotong. Cek tombol "balik" atau urutan pojok.',
          fields: [],
        },
      ],
      warnings,
    }
  }
  // Pastikan titik dekat-nol tidak menghasilkan -0 di tampilan.
  for (const p of points) {
    if (Math.abs(p.x) < 1e-12) p.x = 0
    if (Math.abs(p.y) < 1e-12) p.y = 0
  }
  return { ok: true, points, warnings }
}
