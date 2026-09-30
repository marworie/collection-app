import { useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'inProgress', label: 'Devam ediyor' },
  { value: 'done', label: 'Tamamlandı' },
  { value: 'dropped', label: 'Yarıda bıraktım' }
]

const RATING_OPTIONS = [
  { value: 0, label: 'Hepsi' },
  { value: 3, label: '3 ⭐ ve üzeri' },
  { value: 4, label: '4 ⭐ ve üzeri' },
  { value: 4.5, label: '4.5 ⭐ ve üzeri' }
]

// items: koleksiyonun tamamı (kategori listesini buradan çıkarıyoruz)
// filters: App'teki şu anki filtre değerleri
// onChange: bir filtre değişince App'e yeni değerleri bildirmek için
function FilterPanel({ items, filters, onChange }) {
  const [isOpen, setIsOpen] = useState(false)

  // Kategori listesi: sadece koleksiyonda GERÇEKTEN kullanılan kategoriler
  const genres = [...new Set(items.map(i => i.genre).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'tr'))

  let activeCount = 0
  if (filters.status !== 'all') activeCount++
  if (filters.genre !== 'all') activeCount++
  if (filters.minRating > 0) activeCount++

  function update(key, value) {
    onChange({ ...filters, [key]: value })
  }

  function clearAll() {
    onChange({ status: 'all', genre: 'all', minRating: 0 })
  }

  return (
    <div className="filter-panel-wrap">
      <button
        className={`filter-toggle-btn ${activeCount > 0 ? 'has-active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        🔎 Filtrele{activeCount > 0 && ` (${activeCount})`}
      </button>

      {isOpen && (
        <div className="filter-panel">
          <label className="filter-field">
            <span>Durum</span>
            <select value={filters.status} onChange={(e) => update('status', e.target.value)}>
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Kategori</span>
            <select value={filters.genre} onChange={(e) => update('genre', e.target.value)}>
              <option value="all">Tümü</option>
              {genres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>

          <label className="filter-field">
            <span>Puan</span>
            <select
              value={filters.minRating}
              onChange={(e) => update('minRating', parseFloat(e.target.value))}
            >
              {RATING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          {activeCount > 0 && (
            <button className="filter-clear-btn" onClick={clearAll}>✕ Temizle</button>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterPanel