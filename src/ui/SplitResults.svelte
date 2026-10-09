<script lang="ts">
  import { toUnits } from '../geometry/measure'
  import { sideName, vertexName } from '../geometry/types'
  import { app } from '../state/app.svelte'
  import { formatNumber, type Computation } from '../state/model'

  interface Props {
    calc: Computation
  }

  let { calc }: Props = $props()

  const n = $derived(app.data.sides.length)
  /** Di bawah 5 mm dianggap tepat di pojok. */
  const AT_CORNER = 0.005
</script>

{#if !calc.build.ok}
  <div class="notice notice-error">Perbaiki ukuran bidang di tab Ukuran terlebih dahulu.</div>
{:else if calc.split && !calc.split.ok}
  <div class="notice notice-error" role="alert" data-testid="split-error">{calc.split.message}</div>
{:else if calc.split && calc.split.ok}
  {@const split = calc.split}
  <section class="section" aria-label="Hasil pembagian">
    <h2 class="section-title">Hasil pembagian</h2>
    <div class="cards">
      {#each split.pieces as piece, i (i)}
        {@const u = toUnits(piece.area, app.data.units)}
        <article class="card" data-testid="piece-card">
          <header>
            <span class="swatch" style="background: var(--piece-{(i % 10) + 1})"></span>
            <h3>Bagian {i + 1}</h3>
            <span class="pct">{formatNumber(piece.fraction * 100, 1)}%</span>
          </header>
          <p class="big">{formatNumber(piece.area)} m²</p>
          <p class="sub">{formatNumber(u.tumbak)} tumbak · {formatNumber(u.bata)} bata</p>
          <p class="sub">Keliling {formatNumber(piece.perimeter)} m</p>
        </article>
      {/each}
    </div>
    <p class="hint">Angka dibulatkan 2 desimal, jadi jumlahnya bisa selisih ±0,01.</p>
  </section>

  <section class="section" aria-label="Posisi patok">
    <h2 class="section-title">Posisi patok</h2>
    <p class="hint">Ukur dari pojok yang disebut, menyusuri sisinya.</p>
    <div class="cards">
      {#each split.cuts as cut, i (i)}
        <article class="card" data-testid="cut-card">
          <header>
            <span class="cut-icon" aria-hidden="true"></span>
            <h3>Garis potong {i + 1}</h3>
          </header>
          <p class="sub">Panjang garis {formatNumber(cut.length)} m</p>
          <ul class="stakes">
            {#each cut.stakes as s, j (j)}
              <li>
                <span class="dot" aria-hidden="true"></span>
                {#if s.distance < AT_CORNER}
                  Tepat di pojok <strong>{vertexName(s.fromVertex)}</strong>
                {:else}
                  Sisi <strong>{sideName(s.edge, n)}</strong>: <strong>{formatNumber(s.distance)} m</strong> dari pojok <strong>{vertexName(s.fromVertex)}</strong>
                {/if}
              </li>
            {/each}
          </ul>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
  }
  .card {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    background: var(--surface);
    padding: 12px 14px;
  }
  .card header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .card h3 {
    font-size: 15px;
    flex: 1;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    opacity: 0.8;
  }
  .cut-icon {
    width: 16px;
    border-top: 2px dashed var(--text);
  }
  .pct {
    font-size: 13px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .big {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  .sub {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .stakes {
    list-style: none;
    margin: 8px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }
  .stakes li {
    padding-left: 18px;
    position: relative;
  }
  .dot {
    position: absolute;
    left: 0;
    top: 0.45em;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
  }
</style>
