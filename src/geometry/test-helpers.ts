import type { Pt } from './types'

/** Poligon cembung: titik pada lingkaran dengan sudut berurutan (berlawanan arah jarum jam). */
export function convexPolygon(n: number, gaps: number[], radius: number): Pt[] {
  const g = gaps.slice(0, n)
  const total = g.reduce((a, b) => a + b, 0)
  let acc = 0
  return g.map((v) => {
    const angle = (acc / total) * 2 * Math.PI
    acc += v
    return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
  })
}
