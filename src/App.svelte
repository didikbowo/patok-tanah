<script lang="ts">
  import { onMount } from 'svelte'
  import type { Pt } from './geometry/types'
  import { app, showToast, toasts } from './state/app.svelte'
  import { compute, defaultPlot, formatNumber, type PlotData } from './state/model'
  import { clear, load, save } from './state/persist'
  import { codeFromHash, decode, shareUrl } from './state/share'
  import Help from './ui/Help.svelte'
  import Modal from './ui/Modal.svelte'
  import PlotCanvas from './ui/PlotCanvas.svelte'
  import Settings from './ui/Settings.svelte'
  import SideInputs from './ui/SideInputs.svelte'
  import SplitPanel from './ui/SplitPanel.svelte'
  import Summary from './ui/Summary.svelte'

  let tab = $state<'ukuran' | 'bagi'>('ukuran')
  let dialog = $state<'help' | 'settings' | null>(null)
  let pendingLink = $state<PlotData | null>(null)
  let storageOk = $state(true)
  let ready = $state(false)
  let updateSW: ((reload?: boolean) => Promise<void>) | null = null
  let needRefresh = $state(false)

  const calc = $derived(compute(app.data))

  // Simpan bentuk valid terakhir supaya gambar tidak hilang saat ukuran sedang diketik.
  let lastPoints = $state<Pt[] | null>(null)
  $effect(() => {
    if (calc.build.ok) lastPoints = calc.build.points
  })
  const shownPoints = $derived(calc.build.ok ? calc.build.points : lastPoints)
  const splitOk = $derived(calc.split && calc.split.ok ? calc.split : null)

  const canvasLabel = $derived(
    calc.area
      ? `Denah bidang ${app.data.sides.length} sisi, luas ${formatNumber(calc.area.m2)} meter persegi`
      : 'Denah bidang, ukuran belum valid',
  )

  // ---------- Muat data awal: link → localStorage → contoh ----------
  function sameData(a: PlotData, b: PlotData) {
    return JSON.stringify(a) === JSON.stringify(b)
  }

  function importFromHash() {
    const code = codeFromHash(location.hash)
    if (code === null) return
    history.replaceState(null, '', location.pathname + location.search)
    const linked = decode(code)
    if (!linked) {
      showToast('Link tidak valid atau rusak. Data Anda tidak diubah.')
      return
    }
    if (sameData(linked, $state.snapshot(app.data))) return
    pendingLink = linked
  }

  onMount(() => {
    const local = load()
    if (local.status === 'ok') app.data = local.data
    else if (local.status === 'corrupt') showToast('Data tersimpan rusak, dimulai dari contoh awal.')
    else if (local.status === 'unavailable') storageOk = false

    // Link dari orang lain: bila perangkat belum punya data, langsung pakai; bila sudah, tanya dulu.
    const code = codeFromHash(location.hash)
    if (code !== null && local.status !== 'ok') {
      history.replaceState(null, '', location.pathname + location.search)
      const linked = decode(code)
      if (linked) app.data = linked
      else showToast('Link tidak valid atau rusak.')
    } else {
      importFromHash()
    }
    ready = true

    window.addEventListener('hashchange', importFromHash)

    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        updateSW = registerSW({
          onNeedRefresh: () => (needRefresh = true),
          onOfflineReady: () => showToast('Siap dipakai tanpa sinyal.'),
        })
      })
      .catch(() => {
        // Service worker tidak tersedia (mis. mode dev): aplikasi tetap berjalan.
      })

    return () => window.removeEventListener('hashchange', importFromHash)
  })

  // ---------- Simpan otomatis (debounce 500 ms) ----------
  $effect(() => {
    if (!ready) return
    const snapshot = $state.snapshot(app.data)
    const timer = setTimeout(() => {
      storageOk = save(snapshot)
    }, 500)
    return () => clearTimeout(timer)
  })

  // ---------- Bagikan ----------
  async function share() {
    const url = shareUrl($state.snapshot(app.data), location.href)
    const text = calc.area
      ? `Luas ${formatNumber(calc.area.m2)} m² (${formatNumber(calc.area.tumbak)} tumbak) — lihat denah:`
      : 'Data ukuran tanah — lihat denah:'
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Patok — denah tanah', text, url })
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`)
      showToast('Link disalin. Tempel di WhatsApp atau aplikasi lain.')
    } catch {
      window.prompt('Salin link ini:', url)
    }
  }

  function reset() {
    clear()
    app.data = defaultPlot()
    lastPoints = null
    dialog = null
    showToast('Dimulai dari contoh awal.')
  }
</script>

<div class="app">
  <header class="topbar">
    <div class="brand">
      <img src="{import.meta.env.BASE_URL}logo.svg" alt="" width="28" height="28" />
      <h1>Patok</h1>
      <span class="tagline">Hitung &amp; bagi tanah</span>
    </div>
    <nav class="actions" aria-label="Menu">
      <button type="button" class="icon-btn" aria-label="Cara pakai" onclick={() => (dialog = 'help')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          ><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" /><circle
            cx="12"
            cy="17.2"
            r=".6"
            fill="currentColor"
          /></svg
        >
      </button>
      <button type="button" class="icon-btn" aria-label="Bagikan" onclick={share} data-testid="share">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round"
          ><path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /></svg
        >
      </button>
      <button type="button" class="icon-btn" aria-label="Pengaturan" onclick={() => (dialog = 'settings')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round"
          ><circle cx="12" cy="12" r="3" /><path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
          /></svg
        >
      </button>
    </nav>
  </header>

  <main class="layout">
    <div class="stage">
      <div class="drawing">
        <PlotCanvas
          points={shownPoints}
          sides={app.data.sides}
          faded={!calc.build.ok}
          highlight={app.highlight}
          pieces={splitOk?.pieces ?? null}
          cuts={splitOk?.cuts ?? null}
          refSide={app.data.split.on && tab === 'bagi' ? app.data.split.ref : null}
          label={canvasLabel}
        />
        {#if !calc.build.ok && shownPoints}
          <span class="badge">Ukuran belum valid</span>
        {/if}
      </div>
      <Summary area={calc.area} perimeter={calc.perimeter} />
    </div>

    <div class="panel">
      <div class="segmented tabs" role="tablist" aria-label="Bagian aplikasi">
        <button
          type="button"
          role="tab"
          id="tab-ukuran"
          aria-selected={tab === 'ukuran'}
          aria-controls="panel-ukuran"
          onclick={() => (tab = 'ukuran')}>Ukuran</button
        >
        <button
          type="button"
          role="tab"
          id="tab-bagi"
          aria-selected={tab === 'bagi'}
          aria-controls="panel-bagi"
          onclick={() => (tab = 'bagi')}>Bagi</button
        >
      </div>

      {#if !storageOk}
        <div class="notice notice-warn">Data tidak tersimpan di perangkat ini (penyimpanan browser tidak tersedia).</div>
      {/if}

      {#if tab === 'ukuran'}
        <div role="tabpanel" id="panel-ukuran" aria-labelledby="tab-ukuran">
          <SideInputs build={calc.build} />
        </div>
      {:else}
        <div role="tabpanel" id="panel-bagi" aria-labelledby="tab-bagi">
          <SplitPanel {calc} />
        </div>
      {/if}

      <footer class="disclaimer">
        Hasil adalah perkiraan dari ukuran yang dimasukkan, bukan pengganti pengukuran resmi BPN.
      </footer>
    </div>
  </main>
</div>

<Modal open={dialog === 'help'} title="Cara pakai" onclose={() => (dialog = null)}>
  <Help />
</Modal>

<Modal open={dialog === 'settings'} title="Pengaturan" onclose={() => (dialog = null)}>
  <Settings onreset={reset} />
</Modal>

<Modal open={pendingLink !== null} title="Buka data dari link?" onclose={() => (pendingLink = null)}>
  <p>Link ini berisi ukuran tanah lain. Ganti data yang sedang tersimpan di perangkat ini?</p>
  <div class="dialog-actions">
    <button type="button" class="btn" onclick={() => (pendingLink = null)}>Tetap pakai data saya</button>
    <button
      type="button"
      class="btn btn-primary"
      data-testid="accept-link"
      onclick={() => {
        if (pendingLink) app.data = pendingLink
        pendingLink = null
        lastPoints = null
      }}>Ganti dengan data link</button
    >
  </div>
</Modal>

<div class="toasts" aria-live="polite">
  {#each toasts as t (t.id)}
    <div class="toast">{t.text}</div>
  {/each}
  {#if needRefresh}
    <div class="toast">
      Versi baru tersedia.
      <button type="button" class="btn btn-primary" onclick={() => updateSW?.(true)}>Muat ulang</button>
    </div>
  {/if}
</div>

<style>
  .app {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px 6px var(--gutter);
    padding-top: max(6px, env(safe-area-inset-top));
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }
  .brand h1 {
    font-size: 20px;
    letter-spacing: -0.01em;
  }
  .tagline {
    font-size: 13px;
    color: var(--muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .actions {
    display: flex;
    flex: none;
  }

  .stage {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow);
  }
  .drawing {
    position: relative;
    height: 36dvh;
    min-height: 200px;
    padding: 8px var(--gutter);
  }
  .badge {
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--danger-bg);
    color: var(--danger);
    font-size: 13px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 999px;
  }
  .panel {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 16px var(--gutter) calc(32px + env(safe-area-inset-bottom));
    min-width: 0;
  }
  .tabs {
    position: relative;
  }
  .disclaimer {
    margin-top: 12px;
    font-size: 12px;
    color: var(--muted);
    text-align: center;
  }

  @media (min-width: 768px) {
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(360px, 1fr);
      align-items: start;
    }
    .stage {
      top: 0;
      height: calc(100dvh - 57px);
      display: flex;
      flex-direction: column;
      border-bottom: none;
      border-right: 1px solid var(--border);
      box-shadow: none;
    }
    .drawing {
      flex: 1;
      height: auto;
    }
    .panel {
      max-width: 640px;
    }
  }

  .toasts {
    position: fixed;
    left: 50%;
    bottom: calc(16px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: min(480px, calc(100vw - 2 * var(--gutter)));
    pointer-events: none;
  }
  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    background: var(--text);
    color: var(--bg);
    font-size: 14px;
    box-shadow: var(--shadow);
  }
</style>
