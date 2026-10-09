import type { FieldRef } from '../geometry/types'
import { defaultPlot, type PlotData } from './model'

/** State bersama aplikasi. Komponen mengubah `app.data` langsung; turunan dihitung di App.svelte. */
export const app = $state<{
  data: PlotData
  /** Kolom yang sedang difokuskan, untuk disorot di gambar. */
  highlight: FieldRef | null
}>({
  data: defaultPlot(),
  highlight: null,
})

export interface Toast {
  id: number
  text: string
}

let nextId = 1
export const toasts = $state<Toast[]>([])

export function showToast(text: string, ms = 3500): void {
  const id = nextId++
  toasts.push({ id, text })
  setTimeout(() => {
    const i = toasts.findIndex((t) => t.id === id)
    if (i >= 0) toasts.splice(i, 1)
  }, ms)
}
