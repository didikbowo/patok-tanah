import type { Pt } from './types'

export const sub = (a: Pt, b: Pt): Pt => ({ x: a.x - b.x, y: a.y - b.y })
export const add = (a: Pt, b: Pt): Pt => ({ x: a.x + b.x, y: a.y + b.y })
export const scale = (a: Pt, k: number): Pt => ({ x: a.x * k, y: a.y * k })
export const dot = (a: Pt, b: Pt): number => a.x * b.x + a.y * b.y
export const cross = (a: Pt, b: Pt): number => a.x * b.y - a.y * b.x
export const len = (a: Pt): number => Math.hypot(a.x, a.y)
export const dist = (a: Pt, b: Pt): number => len(sub(a, b))
/** Putar 90° berlawanan arah jarum jam. */
export const perp = (a: Pt): Pt => ({ x: -a.y, y: a.x })
export const unit = (a: Pt): Pt => scale(a, 1 / len(a))
export const lerp = (a: Pt, b: Pt, k: number): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k })
