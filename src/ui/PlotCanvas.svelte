<script lang="ts">
  import { centroid, signedArea } from '../geometry/measure'
  import type { Cut, Piece } from '../geometry/split'
  import { vertexName, type FieldRef, type Pt } from '../geometry/types'
  import { add, len, scale, sub, unit } from '../geometry/vec'
  import { formatInput } from '../state/model'

  interface Props {
    points: Pt[] | null
    sides: (number | null)[]
    faded?: boolean
    highlight?: FieldRef | null
    pieces?: Piece[] | null
    cuts?: Cut[] | null
    refSide?: number | null
    label: string
  }

  let { points, sides, faded = false, highlight = null, pieces = null, cuts = null, refSide = null, label }: Props =
    $props()

  // Koordinat dunia (y ke atas) → SVG (y ke bawah).
  const toSvg = (p: Pt): Pt => ({ x: p.x, y: -p.y })
  const pathOf = (poly: Pt[]) => poly.map((p) => `${p.x},${-p.y}`).join(' ')

  const view = $derived.by(() => {
    if (!points || points.length < 3) return null
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => -p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const size = Math.max(maxX - minX, maxY - minY, 1e-6)
    const pad = size * 0.17
    const fs = size * 0.052
    const n = points.length
    const orient = signedArea(points) >= 0 ? 1 : -1
    // Normal ke luar untuk sisi i (dalam koordinat dunia).
    const outward = (i: number): Pt => {
      const e = unit(sub(points[(i + 1) % n], points[i]))
      return scale({ x: e.y, y: -e.x }, orient)
    }
    const vertices = points.map((p, i) => {
      let b = add(outward((i - 1 + n) % n), outward(i))
      b = len(b) < 1e-6 ? outward(i) : unit(b)
      return { name: vertexName(i), at: toSvg(add(p, scale(b, fs * 1.15))) }
    })
    const edges = points.map((p, i) => {
      const q = points[(i + 1) % n]
      const mid = scale(add(p, q), 0.5)
      return { from: toSvg(p), to: toSvg(q), label: toSvg(add(mid, scale(outward(i), fs * 0.95))) }
    })
    return {
      box: `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`,
      fs,
      n,
      vertices,
      edges,
    }
  })

  const highlightLine = $derived.by(() => {
    if (!points || !highlight || !view) return null
    if (highlight.kind === 'side') {
      const e = view.edges[highlight.index]
      return e ? { a: e.from, b: e.to } : null
    }
    const target = points[highlight.index + 2]
    return target ? { a: toSvg(points[0]), b: toSvg(target) } : null
  })
</script>

<div class="canvas" class:faded>
  {#if view && points}
    <svg viewBox={view.box} preserveAspectRatio="xMidYMid meet" role="img" aria-label={label} stroke-width={view.fs * 0.2}>
      <polygon class="plot" points={pathOf(points)} />

      {#if pieces}
        {#each pieces as piece, i (i)}
          <polygon
            class="piece"
            points={pathOf(piece.poly)}
            style="fill: var(--piece-{(i % 10) + 1})"
          />
        {/each}
      {/if}

      {#each points.slice(2, -1) as p, i (i)}
        <line
          class="diag"
          x1={points[0].x}
          y1={-points[0].y}
          x2={p.x}
          y2={-p.y}
          vector-effect="non-scaling-stroke"
        />
      {/each}

      <polygon class="outline" points={pathOf(points)} vector-effect="non-scaling-stroke" />

      {#if refSide !== null && view.edges[refSide]}
        {@const e = view.edges[refSide]}
        <line class="ref" x1={e.from.x} y1={e.from.y} x2={e.to.x} y2={e.to.y} vector-effect="non-scaling-stroke" />
      {/if}

      {#if cuts}
        {#each cuts as cut, i (i)}
          {@const a = toSvg(cut.stakes[0].point)}
          {@const b = toSvg(cut.stakes[1].point)}
          <line class="cut" x1={a.x} y1={a.y} x2={b.x} y2={b.y} vector-effect="non-scaling-stroke" />
        {/each}
      {/if}

      {#if highlightLine}
        <line
          class="highlight"
          x1={highlightLine.a.x}
          y1={highlightLine.a.y}
          x2={highlightLine.b.x}
          y2={highlightLine.b.y}
          vector-effect="non-scaling-stroke"
        />
      {/if}

      {#if cuts}
        {#each cuts as cut, i (i)}
          {#each cut.stakes as s, j (j)}
            {@const p = toSvg(s.point)}
            <circle class="stake" cx={p.x} cy={p.y} r={view.fs * 0.3} vector-effect="non-scaling-stroke" />
          {/each}
        {/each}
      {/if}

      {#if pieces}
        {#each pieces as piece, i (i)}
          {@const c = toSvg(centroid(piece.poly))}
          <text class="piece-label" x={c.x} y={c.y} font-size={view.fs * 1.15}>{i + 1}</text>
        {/each}
      {/if}

      {#each view.edges as e, i (i)}
        {#if sides[i] !== null}
          <text
            class="len"
            class:active={highlight?.kind === 'side' && highlight.index === i}
            x={e.label.x}
            y={e.label.y}
            font-size={view.fs * 0.82}>{formatInput(sides[i])}</text
          >
        {/if}
      {/each}

      {#each view.vertices as v (v.name)}
        <text class="vertex" x={v.at.x} y={v.at.y} font-size={view.fs}>{v.name}</text>
      {/each}
    </svg>
  {:else}
    <p class="empty">Isi ukuran untuk melihat gambar bidang.</p>
  {/if}
</div>

<style>
  .canvas {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .faded svg {
    opacity: 0.3;
    filter: grayscale(1);
  }
  .plot {
    fill: var(--primary-soft);
  }
  .piece {
    fill-opacity: 0.38;
  }
  .outline {
    fill: none;
    stroke: var(--primary);
    stroke-width: 2.5px;
    stroke-linejoin: round;
  }
  .diag {
    stroke: var(--muted);
    stroke-width: 1px;
    stroke-dasharray: 5 4;
    opacity: 0.7;
  }
  .ref {
    stroke: var(--primary);
    stroke-width: 6px;
    stroke-linecap: round;
    opacity: 0.45;
  }
  .cut {
    stroke: var(--text);
    stroke-width: 2px;
    stroke-dasharray: 7 4;
  }
  .highlight {
    stroke: var(--accent);
    stroke-width: 5px;
    stroke-linecap: round;
  }
  .stake {
    fill: var(--accent);
    stroke: var(--surface);
    stroke-width: 2px;
  }
  text {
    text-anchor: middle;
    dominant-baseline: central;
    paint-order: stroke;
    stroke: var(--bg);
    stroke-linejoin: round;
    font-family: inherit;
  }
  .vertex {
    font-weight: 800;
    fill: var(--text);
  }
  .len {
    fill: var(--muted);
    font-weight: 600;
  }
  .len.active {
    fill: var(--accent);
  }
  .piece-label {
    font-weight: 800;
    fill: var(--text);
  }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 0 var(--gutter);
  }
</style>
