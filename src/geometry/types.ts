export interface Pt {
  x: number
  y: number
}

/** Rujukan ke satu kolom input, dipakai untuk menandai kolom yang bermasalah. */
export type FieldRef = { kind: 'side'; index: number } | { kind: 'diag'; index: number }

export interface Issue {
  message: string
  fields: FieldRef[]
}

/** Nama pojok: A, B, C, ... */
export const vertexName = (i: number): string => String.fromCharCode(65 + i)

/** Nama sisi ke-i: AB, BC, ..., dan sisi terakhir kembali ke A. */
export const sideName = (i: number, n: number): string => vertexName(i) + vertexName((i + 1) % n)

/** Nama diagonal ke-i: AC, AD, ... */
export const diagName = (i: number): string => 'A' + vertexName(i + 2)
