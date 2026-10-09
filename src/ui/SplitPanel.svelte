<script lang="ts">
  import { MAX_PARTS, type SplitMode } from '../geometry/split'
  import { sideName } from '../geometry/types'
  import { app } from '../state/app.svelte'
  import { formatNumber, unitFactor, type AreaUnit, type Computation } from '../state/model'
  import NumberField from './NumberField.svelte'
  import SplitResults from './SplitResults.svelte'

  interface Props {
    calc: Computation
  }

  let { calc }: Props = $props()

  const s = $derived(app.data.split)
  const n = $derived(app.data.sides.length)

  const unitLabel: Record<AreaUnit, string> = { m2: 'm²', tumbak: 'tumbak', bata: 'bata' }
  const modes: { id: SplitMode; label: string }[] = [
    { id: 'equal', label: 'Sama luas' },
    { id: 'ratio', label: 'Proporsi' },
    { id: 'area', label: 'Luas tertentu' },
  ]

  /** Ganti satuan input luas sambil mengonversi angka yang sudah diisi. */
  function setAreaUnit(unit: AreaUnit) {
    const from = unitFactor(app.data, s.areaUnit)
    const to = unitFactor(app.data, unit)
    app.data.split.areas = s.areas.map((v) => (v === null ? null : Math.round(((v * from) / to) * 1e4) / 1e4))
    app.data.split.areaUnit = unit
  }

  const remainder = $derived.by(() => {
    if (!calc.area) return null
    const factor = unitFactor(app.data, s.areaUnit)
    const used = s.areas.reduce<number>((a, v) => a + (v ?? 0), 0) * factor
    return (calc.area.m2 - used) / factor
  })
</script>

<div class="split-panel">
  <label class="switch">
    <input type="checkbox" bind:checked={app.data.split.on} data-testid="split-toggle" />
    <span class="switch-track" aria-hidden="true"></span>
    <span class="switch-label">Bagi bidang</span>
  </label>

  {#if s.on}
    <div class="section">
      <h2 class="section-title" id="ref-label">Sisi acuan</h2>
      <p class="hint">Biasanya sisi depan / sisi yang menghadap jalan.</p>
      <div class="chips" role="group" aria-labelledby="ref-label">
        {#each app.data.sides as _, i (i)}
          <button
            type="button"
            class="chip"
            aria-pressed={s.ref === i}
            onclick={() => (app.data.split.ref = i)}>{sideName(i, n)}</button
          >
        {/each}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title" id="dir-label">Arah garis potong</h2>
      <div class="segmented" role="group" aria-labelledby="dir-label">
        <button
          type="button"
          aria-pressed={s.dir === 'parallel'}
          onclick={() => (app.data.split.dir = 'parallel')}>Sejajar sisi acuan</button
        >
        <button
          type="button"
          aria-pressed={s.dir === 'perpendicular'}
          onclick={() => (app.data.split.dir = 'perpendicular')}>Tegak lurus</button
        >
      </div>
      <p class="hint">
        {#if s.dir === 'parallel'}
          Bagian 1 menempel pada sisi {sideName(s.ref, n)}, bagian berikutnya makin ke belakang.
        {:else}
          Bagian 1 dimulai dari ujung pojok {sideName(s.ref, n)[0]}, berurutan ke arah pojok {sideName(s.ref, n)[1]}.
        {/if}
      </p>
    </div>

    <div class="section">
      <h2 class="section-title" id="mode-label">Cara membagi</h2>
      <div class="segmented" role="group" aria-labelledby="mode-label">
        {#each modes as m (m.id)}
          <button type="button" aria-pressed={s.mode === m.id} onclick={() => (app.data.split.mode = m.id)}
            >{m.label}</button
          >
        {/each}
      </div>

      {#if s.mode === 'equal'}
        <div class="row">
          <span id="parts-label">Jumlah bagian</span>
          <div class="stepper" role="group" aria-labelledby="parts-label">
            <button
              type="button"
              aria-label="Kurangi bagian"
              disabled={s.count <= 2}
              onclick={() => (app.data.split.count = s.count - 1)}>−</button
            >
            <output data-testid="part-count">{s.count}</output>
            <button
              type="button"
              aria-label="Tambah bagian"
              disabled={s.count >= MAX_PARTS}
              onclick={() => (app.data.split.count = s.count + 1)}>+</button
            >
          </div>
        </div>
      {:else if s.mode === 'ratio'}
        <p class="hint">Isi perbandingan, mis. 2 : 1 : 1 untuk ½, ¼, ¼ bagian.</p>
        <div class="grid-fields">
          {#each s.ratios as value, i (`${s.ratios.length}-${i}`)}
            <NumberField
              id="ratio-{i}"
              label="Bagian {i + 1}"
              suffix="×"
              {value}
              onchange={(v) => (app.data.split.ratios[i] = v)}
            />
          {/each}
        </div>
        <div class="row-actions">
          <button
            type="button"
            class="btn"
            disabled={s.ratios.length >= MAX_PARTS}
            onclick={() => app.data.split.ratios.push(1)}>+ Bagian</button
          >
          <button
            type="button"
            class="btn btn-ghost"
            disabled={s.ratios.length <= 2}
            onclick={() => app.data.split.ratios.pop()}>− Hapus terakhir</button
          >
        </div>
      {:else}
        <div class="segmented" role="group" aria-label="Satuan luas">
          {#each ['m2', 'tumbak', 'bata'] as AreaUnit[] as u (u)}
            <button type="button" aria-pressed={s.areaUnit === u} onclick={() => setAreaUnit(u)}>{unitLabel[u]}</button>
          {/each}
        </div>
        <div class="grid-fields">
          {#each s.areas as value, i (`${s.areas.length}-${i}`)}
            <NumberField
              id="area-{i}"
              label="Bagian {i + 1}"
              suffix={unitLabel[s.areaUnit]}
              {value}
              onchange={(v) => (app.data.split.areas[i] = v)}
            />
          {/each}
        </div>
        <p class="hint">
          Bagian {s.areas.length + 1} = sisa{#if remainder !== null}
            &nbsp;(<strong>{formatNumber(remainder)} {unitLabel[s.areaUnit]}</strong>){/if}.
        </p>
        <div class="row-actions">
          <button
            type="button"
            class="btn"
            disabled={s.areas.length >= MAX_PARTS - 1}
            onclick={() => app.data.split.areas.push(null)}>+ Bagian</button
          >
          <button
            type="button"
            class="btn btn-ghost"
            disabled={s.areas.length <= 1}
            onclick={() => app.data.split.areas.pop()}>− Hapus terakhir</button
          >
        </div>
      {/if}
    </div>

    <SplitResults {calc} />
  {:else}
    <p class="hint">
      Aktifkan untuk membagi bidang menjadi beberapa bagian — misalnya untuk warisan atau jual sebagian — dan
      mendapatkan posisi patok di lapangan.
    </p>
  {/if}
</div>

<style>
  .split-panel {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .row-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .switch {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    cursor: pointer;
    font-weight: 700;
  }
  .switch input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .switch-track {
    position: relative;
    width: 48px;
    height: 28px;
    border-radius: 999px;
    background: var(--border);
    transition: background 0.15s;
    flex: none;
  }
  .switch-track::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--surface);
    box-shadow: var(--shadow);
    transition: transform 0.15s;
  }
  .switch input:checked + .switch-track {
    background: var(--primary);
  }
  .switch input:checked + .switch-track::after {
    transform: translateX(20px);
  }
  .switch input:focus-visible + .switch-track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
