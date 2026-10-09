<script lang="ts">
  import { app } from '../state/app.svelte'
  import { DEFAULT_UNIT_FACTOR } from '../state/model'
  import NumberField from './NumberField.svelte'

  interface Props {
    onreset: () => void
  }

  let { onreset }: Props = $props()
  let confirming = $state(false)
</script>

<section class="section">
  <h3 class="section-title">Satuan lokal</h3>
  <p class="hint">
    Nilai tumbak dan bata berbeda antar daerah. Umumnya 1 tumbak = 1 bata = 14 m². Sesuaikan dengan kebiasaan di
    daerah Anda.
  </p>
  <div class="grid-fields">
    <NumberField
      id="unit-tumbak"
      label="1 tumbak ="
      suffix="m²"
      value={app.data.units.tumbak}
      invalid={!(app.data.units.tumbak > 0)}
      onchange={(v) => v !== null && v > 0 && (app.data.units.tumbak = v)}
    />
    <NumberField
      id="unit-bata"
      label="1 bata ="
      suffix="m²"
      value={app.data.units.bata}
      invalid={!(app.data.units.bata > 0)}
      onchange={(v) => v !== null && v > 0 && (app.data.units.bata = v)}
    />
  </div>
  <div>
    <button
      type="button"
      class="btn"
      onclick={() => (app.data.units = { tumbak: DEFAULT_UNIT_FACTOR, bata: DEFAULT_UNIT_FACTOR })}
      >Kembalikan ke 14 m²</button
    >
  </div>
</section>

<section class="section">
  <h3 class="section-title">Data</h3>
  <p class="hint">Data tersimpan otomatis di perangkat ini saja.</p>
  {#if confirming}
    <div class="notice notice-warn">
      Semua ukuran dan pembagian akan dihapus dan diganti contoh awal. Lanjutkan?
      <div class="dialog-actions" style="margin-top: 10px">
        <button type="button" class="btn" onclick={() => (confirming = false)}>Batal</button>
        <button
          type="button"
          class="btn btn-danger"
          onclick={() => {
            confirming = false
            onreset()
          }}>Ya, mulai baru</button
        >
      </div>
    </div>
  {:else}
    <div>
      <button type="button" class="btn btn-danger" onclick={() => (confirming = true)}>Mulai baru</button>
    </div>
  {/if}
</section>

<section class="section">
  <h3 class="section-title">Tentang</h3>
  <p class="hint">
    Patok v{__APP_VERSION__}. Hasil hitungan adalah <strong>perkiraan</strong> berdasarkan ukuran yang Anda masukkan, bukan
    pengganti pengukuran resmi oleh BPN atau juru ukur berlisensi.
  </p>
</section>
