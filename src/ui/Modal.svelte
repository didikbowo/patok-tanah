<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    open: boolean
    title: string
    onclose: () => void
    children: Snippet
  }

  let { open, title, onclose, children }: Props = $props()
  let dialog: HTMLDialogElement | undefined = $state()
  const titleId = `modal-${Math.random().toString(36).slice(2, 8)}`

  $effect(() => {
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  })
</script>

<dialog
  bind:this={dialog}
  aria-labelledby={titleId}
  onclose={onclose}
  onclick={(e) => e.target === dialog && onclose()}
>
  {#if open}
    <div class="dialog-head">
      <h2 id={titleId}>{title}</h2>
      <button type="button" class="icon-btn" aria-label="Tutup" onclick={onclose}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
          ><path d="M6 6l12 12M18 6L6 18" /></svg
        >
      </button>
    </div>
    <div class="dialog-body">
      {@render children()}
    </div>
  {/if}
</dialog>

<style>
  h2 {
    font-size: 18px;
  }
</style>
