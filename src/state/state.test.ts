import { describe, expect, it } from 'vitest'
import { compute, defaultPlot, parseNumber, sanitize, setSideCount, type PlotData } from './model'
import { clear, load, save, STORAGE_KEY } from './persist'
import { codeFromHash, decode, encode, shareUrl } from './share'

class MemoryStorage implements Storage {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  clear() {
    this.map.clear()
  }
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
}

const throwing = {
  getItem() {
    throw new Error('SecurityError')
  },
  setItem() {
    throw new Error('QuotaExceededError')
  },
  removeItem() {
    throw new Error('SecurityError')
  },
} as unknown as Storage

function sample(): PlotData {
  const d = setSideCount(defaultPlot(), 6)
  d.sides = [10, 10, 20, 20, 10, 10]
  d.diagonals = [14.1421, 14.1421, 14.1421]
  d.flip[3] = true
  d.split = { on: true, ref: 2, dir: 'perpendicular', mode: 'area', count: 3, ratios: [2, 1, 1], areas: [5.5, null], areaUnit: 'tumbak' }
  d.units = { tumbak: 14.0625, bata: 14 }
  return d
}

describe('parseNumber', () => {
  it.each([
    ['10', 10],
    ['10,5', 10.5],
    ['10.5', 10.5],
    [' 7 ', 7],
    ['1.250,75', 1250.75],
    ['10,', 10],
    [',5', 0.5],
  ])('%s → %s', (text, expected) => expect(parseNumber(text)).toBe(expected))
  it.each(['', 'abc', '1,2,3', '-5', '1e3'])('"%s" → null', (text) => expect(parseNumber(text)).toBeNull())
})

describe('setSideCount', () => {
  it('menambah pojok: sisi penutup lama jadi diagonal, sisi baru kosong', () => {
    const d = setSideCount(defaultPlot(), 5) // [20,12,18,14] AC=24
    expect(d.sides).toEqual([20, 12, 18, null, null])
    expect(d.diagonals).toEqual([24, 14])
    expect(d.flip).toHaveLength(5)
  })
  it('mengurangi pojok: diagonal terakhir jadi sisi penutup', () => {
    const d = setSideCount(defaultPlot(), 3)
    expect(d.sides).toEqual([20, 12, 24])
    expect(d.diagonals).toEqual([])
  })
  it('tambah lalu kurangi kembali ke data semula', () => {
    const d = defaultPlot()
    const back = setSideCount(setSideCount(d, 7), 4)
    expect(back.sides).toEqual(d.sides)
    expect(back.diagonals).toEqual(d.diagonals)
  })
  it('batas 3–10 dan sisi acuan ikut menyesuaikan', () => {
    const d = defaultPlot()
    d.split.ref = 3
    expect(setSideCount(d, 2).sides).toHaveLength(3)
    expect(setSideCount(d, 3).split.ref).toBe(2)
    expect(setSideCount(d, 99).sides).toHaveLength(10)
  })
})

describe('compute', () => {
  it('contoh awal menghasilkan luas dan keliling', () => {
    const c = compute(defaultPlot())
    expect(c.build.ok).toBe(true)
    expect(c.perimeter).toBe(64)
    expect(c.area!.m2).toBeGreaterThan(0)
    expect(c.area!.tumbak).toBeCloseTo(c.area!.m2 / 14)
  })
  it('mode luas dalam tumbak dikonversi ke m²', () => {
    const d = defaultPlot()
    d.sides = [10, 10, 10, 10]
    d.diagonals = [Math.SQRT2 * 10]
    d.split = { ...d.split, on: true, mode: 'area', areas: [2], areaUnit: 'tumbak' }
    const c = compute(d)
    expect(c.targets).toEqual([28, 72].map((v) => expect.closeTo(v, 6)))
    expect(c.split?.ok).toBe(true)
  })
  it('target tidak valid dilaporkan sebagai error split', () => {
    const d = defaultPlot()
    d.split = { ...d.split, on: true, mode: 'area', areas: [99999] }
    const c = compute(d)
    expect(c.split).toMatchObject({ ok: false, kind: 'targets' })
  })
})

describe('sanitize', () => {
  it('menerima data valid', () => expect(sanitize(sample())).toEqual(sample()))
  it.each([
    ['versi lain', { ...sample(), v: 2 }],
    ['sisi negatif', { ...sample(), sides: [10, -1, 20, 20, 10, 10] }],
    ['diagonal kurang', { ...sample(), diagonals: [1] }],
    ['acuan di luar batas', { ...sample(), split: { ...sample().split, ref: 6 } }],
    ['satuan nol', { ...sample(), units: { tumbak: 0, bata: 14 } }],
    ['bukan objek', 'halo'],
  ])('menolak %s', (_, raw) => expect(sanitize(raw)).toBeNull())
})

describe('persist', () => {
  it('simpan lalu muat menghasilkan data identik', () => {
    const st = new MemoryStorage()
    expect(save(sample(), st)).toBe(true)
    expect(load(st)).toEqual({ status: 'ok', data: sample() })
  })
  it('kosong, rusak, dan tidak tersedia', () => {
    const st = new MemoryStorage()
    expect(load(st).status).toBe('empty')
    st.setItem(STORAGE_KEY, '{rusak')
    expect(load(st).status).toBe('corrupt')
    st.setItem(STORAGE_KEY, JSON.stringify({ v: 99 }))
    expect(load(st).status).toBe('corrupt')
    expect(load(null).status).toBe('unavailable')
  })
  it('storage yang melempar error tidak membuat crash', () => {
    expect(load(throwing).status).toBe('unavailable')
    expect(save(sample(), throwing)).toBe(false)
    expect(() => clear(throwing)).not.toThrow()
  })
})

describe('share', () => {
  it('encode → decode identik', () => {
    expect(decode(encode(sample()))).toEqual(sample())
    expect(decode(encode(defaultPlot()))).toEqual(defaultPlot())
  })
  it('link ringkas (< 300 karakter)', () => {
    expect(shareUrl(sample(), 'https://contoh.github.io/patok-tanah/').length).toBeLessThan(300)
  })
  it('shareUrl membuang hash lama', () => {
    expect(shareUrl(defaultPlot(), 'https://x.id/app/#d=lama')).toMatch(/^https:\/\/x\.id\/app\/#d=[\w-]+$/)
  })
  it('kode rusak atau versi lain ditolak', () => {
    expect(decode('%%%')).toBeNull()
    expect(decode('')).toBeNull()
    expect(decode(btoa('[2,[1,1,1],[],0,[],[14,14]]'))).toBeNull()
    expect(decode(btoa('{"v":1}'))).toBeNull()
  })
  it('codeFromHash', () => {
    expect(codeFromHash('#d=abc')).toBe('abc')
    expect(codeFromHash('#lain')).toBeNull()
    expect(codeFromHash('')).toBeNull()
  })
})
