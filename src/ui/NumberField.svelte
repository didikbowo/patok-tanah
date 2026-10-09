<script lang="ts">
  import { untrack } from 'svelte'
  import { formatInput, parseNumber } from '../state/model'

  interface Props {
    id: string
    label: string
    value: number | null
    onchange: (v: number | null) => void
    suffix?: string
    invalid?: boolean
    onfocus?: () => void
    onblur?: () => void
  }

  let { id, label, value, onchange, suffix = 'm', invalid = false, onfocus, onblur }: Props = $props()

  // Teks mentah disimpan terpisah supaya ketikan seperti "10," tidak langsung diubah.
  let text = $state(untrack(() => formatInput(value)))

  // Sinkronkan bila nilai berubah dari luar (mis. memuat link atau ubah jumlah sisi).
  $effect(() => {
    const v = value
    if (parseNumber(untrack(() => text)) !== v) text = formatInput(v)
  })

  function oninput(e: Event & { currentTarget: HTMLInputElement }) {
    text = e.currentTarget.value
    onchange(parseNumber(text))
  }
</script>

<label class="field" class:invalid for={id}>
  <span class="field-label">{label}</span>
  <span class="field-box">
    <input
      {id}
      type="text"
      inputmode="decimal"
      autocomplete="off"
      enterkeyhint="next"
      value={text}
      aria-invalid={invalid}
      {oninput}
      {onfocus}
      {onblur}
    />
    <span class="field-suffix">{suffix}</span>
  </span>
</label>
