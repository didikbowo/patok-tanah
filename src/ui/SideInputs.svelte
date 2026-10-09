<script lang="ts">
  import { MAX_SIDES, MIN_SIDES, type BuildResult } from '../geometry/build'
  import { diagName, sideName, vertexName, type FieldRef } from '../geometry/types'
  import { app } from '../state/app.svelte'
  import { setSideCount } from '../state/model'
  import NumberField from './NumberField.svelte'

  interface Props {
    build: BuildResult
  }

  let { build }: Props = $props()

  const n = $derived(app.data.sides.length)

  const invalidKeys = $derived(
    new Set(build.ok ? [] : build.errors.flatMap((e) => e.fields.map((f) => `${f.kind}-${f.index}`))),
  )
  const warnKeys = $derived(new Set(build.warnings.flatMap((w) => w.fields.map((f) => `${f.kind}-${f.index}`))))

  function changeCount(delta: number) {
    app.data = setSideCount($state.snapshot(app.data), n + delta)
  }

  const focus = (ref: FieldRef) => () => (app.highlight = ref)
  const blur = () => (app.highlight = null)
</script>

<div class="side-inputs">
  <div class="section">
    <div class="row">
      <h2 class="section-title" id="count-label">Jumlah sisi</h2>
      <div class="stepper" role="group" aria-labelledby="count-label">
        <button type="button" aria-label="Kurangi sisi" disabled={n <= MIN_SIDES} onclick={() => changeCount(-1)}
          >−</button
        >
        <output data-testid="side-count">{n}</output>
        <button type="button" aria-label="Tambah sisi" disabled={n >= MAX_SIDES} onclick={() => changeCount(1)}
          >+</button
        >
      </div>
    </div>
  </div>

  <div class="section">
    <h2 class="section-title">Panjang sisi</h2>
    <p class="hint">Ukur keliling bidang berurutan dari pojok A, B, C, dan seterusnya.</p>
    <div class="grid-fields">
      {#each app.data.sides as value, i (`${n}-${i}`)}
        <NumberField
          id="side-{i}"
          label="Sisi {sideName(i, n)}"
          {value}
          invalid={invalidKeys.has(`side-${i}`) || warnKeys.has(`side-${i}`)}
          onchange={(v) => (app.data.sides[i] = v)}
          onfocus={focus({ kind: 'side', index: i })}
          onblur={blur}
        />
      {/each}
    </div>
  </div>

  {#if n > 3}
    <div class="section">
      <h2 class="section-title">Diagonal dari pojok A</h2>
      <p class="hint">
        Tarik meteran lurus dari pojok A ke pojok lain. Diagonal mengunci bentuk tanah, jadi luasnya bisa dihitung
        tepat.
      </p>
      <div class="grid-fields">
        {#each app.data.diagonals as value, i (`${n}-${i}`)}
          <NumberField
            id="diag-{i}"
            label="Diagonal {diagName(i)}"
            {value}
            invalid={invalidKeys.has(`diag-${i}`) || warnKeys.has(`diag-${i}`)}
            onchange={(v) => (app.data.diagonals[i] = v)}
            onfocus={focus({ kind: 'diag', index: i })}
            onblur={blur}
          />
        {/each}
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">Balik pojok</h2>
      <p class="hint">
        Pakai hanya bila gambar tidak sesuai bentuk tanah: pojok yang dipilih dipindah ke seberang garis dari pojok A.
      </p>
      <div class="chips">
        {#each app.data.flip as flipped, i (i)}
          {#if i >= 2}
            <button
              type="button"
              class="chip"
              aria-pressed={flipped}
              aria-label="Balik pojok {vertexName(i)}"
              onclick={() => (app.data.flip[i] = !flipped)}>↺ {vertexName(i)}</button
            >
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  {#if !build.ok}
    <div class="notice notice-error" role="alert">
      <ul>
        {#each build.errors as e, i (i)}<li>{e.message}</li>{/each}
      </ul>
    </div>
  {/if}
  {#if build.warnings.length}
    <div class="notice notice-warn" role="status">
      <ul>
        {#each build.warnings as w, i (i)}<li>{w.message}</li>{/each}
      </ul>
    </div>
  {/if}

  <div class="notice notice-info">
    <strong>Tips bentuk L / U:</strong> jadikan pojok yang <em>menjorok ke dalam</em> sebagai pojok A, supaya semua diagonal
    berada di dalam bidang dan tombol balik tidak diperlukan.
  </div>
</div>

<style>
  .side-inputs {
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
</style>
