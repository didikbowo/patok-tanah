<script lang="ts">
  import type { AreaInUnits } from '../geometry/measure'
  import { formatNumber } from '../state/model'

  interface Props {
    area: AreaInUnits | null
    perimeter: number | null
  }

  let { area, perimeter }: Props = $props()
</script>

<section class="summary" aria-live="polite" aria-label="Ringkasan">
  {#if area && perimeter !== null}
    <div class="main">
      <span class="label">Luas</span>
      <strong class="value" data-testid="area-m2">{formatNumber(area.m2)} m²</strong>
    </div>
    <div class="main">
      <span class="label">Keliling</span>
      <strong class="value small" data-testid="perimeter">{formatNumber(perimeter)} m</strong>
    </div>
    <p class="units" data-testid="area-units">
      {formatNumber(area.tumbak)} tumbak · {formatNumber(area.bata)} bata · {formatNumber(area.are)} are · {formatNumber(
        area.ha,
        4,
      )} ha
    </p>
  {:else}
    <p class="pending">Luas belum bisa dihitung — lengkapi atau perbaiki ukuran di bawah.</p>
  {/if}
</section>

<style>
  .summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 20px;
    padding: 10px var(--gutter) 12px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
  .main {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }
  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--muted);
  }
  .value {
    font-size: 24px;
    font-variant-numeric: tabular-nums;
  }
  .value.small {
    font-size: 18px;
  }
  .units {
    flex-basis: 100%;
    margin: 0;
    font-size: 13px;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }
  .pending {
    margin: 0;
    color: var(--muted);
    font-size: 14px;
  }
</style>
