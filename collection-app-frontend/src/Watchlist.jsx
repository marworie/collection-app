import { useState, useEffect } from 'react'
import { useToast } from './ToastContext'
import ConfirmModal from './ConfirmModal'
import { apiFetch } from './api'

// İzleme listesinden koleksiyona eklerken seçilebilecek türler
const WATCH_TYPES = [
  { value: 'Dizi', icon: '📺' },
  { value: 'Film', icon: '🎬' },
  { value: 'Belgesel', icon: '🎥' },
  { value: 'Animasyon', icon: '🎨' },
  { value: 'Anime', icon: '🎌' }
]

// category: "İzleme" ya da "Okuma"
// pageTitle: sayfa başlığı (örn. "🎬 İzleme Listem")
// defaultType: Okuma listesinde "Kitap"; İzleme listesinde kullanıcı türü kendisi seçer
// onItemAdded: koleksiyona öğe eklenince App'e haber vermek için (ana sayfa güncel kalsın)
function Watchlist({ category, pageTitle, defaultType, onItemAdded }) {
  const showToast = useToast()
  const [items, setItems] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [deletingId, setDeletingId] = useState(null)           // silme onayı bekleyen öğenin id'si
  const [choosingTypeFor, setChoosingTypeFor] = useState(null) // tür penceresi açık olan öğenin id'si
  const [addingId, setAddingId] = useState(null)               // şu an koleksiyona eklenen öğenin id'si

  function fetchWatchlist() {
    apiFetch(`/api/Watchlist?category=${category}`)
      // Hata gelirse listeyi bozma, boş liste kullan (toast'u apiFetch zaten gösteriyor)
      .then(response => response.ok ? response.json() : [])
      .then(data => setItems(data))
  }

  // Sayfa ilk açıldığında ya da category değiştiğinde listeyi çek
  useEffect(() => {
    fetchWatchlist()
    setChoosingTypeFor(null) // sayfa değişince açık pencere kalmasın
  }, [category])

  // Esc tuşuyla tür penceresini kapat
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setChoosingTypeFor(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTitle.trim()) return

    const response = await apiFetch('/api/Watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, category: category })
    })

    if (response.ok) {
      setNewTitle('')
      fetchWatchlist()
      showToast(`"${newTitle.trim()}" listeye eklendi!`)
    } else {
      const data = await response.json().catch(() => ({}))
      // Doğrulama ve sunucu hatalarını apiFetch zaten gösteriyor
      if (!data.errors && response.status < 500) {
        showToast('Ekleme sırasında bir hata oluştu', 'error')
      }
    }
  }

  async function confirmDelete() {
    const response = await apiFetch(`/api/Watchlist/${deletingId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      fetchWatchlist()
      showToast('Listeden kaldırıldı')
    }
    setDeletingId(null)
  }

  // "Koleksiyona Ekle"ye basılınca: kitapsa direkt ekle, değilse tür penceresini aç
  function handleMoveClick(item) {
    if (defaultType === 'Kitap') {
      moveToCollection(item, 'Kitap')
    } else {
      setChoosingTypeFor(item.id)
    }
  }

  // Başlığa göre arama yapıp ilk sonucun kapağını ve özetini döndürür.
  // Bulamazsa ya da hata olursa boş nesne döner, ekleme yine de devam eder.
  async function fetchDetails(title, type) {
    const endpoint = type === 'Kitap' ? 'book' : 'movie'
    try {
      const response = await apiFetch(`/api/Search/${endpoint}?query=${encodeURIComponent(title)}`)
      if (!response.ok) return {}

      const results = await response.json()
      const first = results[0]
      if (!first) return {}

      return {
        coverImageUrl: first.imageUrl || null,
        description: first.description || null
      }
    } catch {
      return {}
    }
  }

  // Seçilen türle gerçek bir Item olarak ekler, sonra watchlist'ten siler
  async function moveToCollection(item, type) {
    setChoosingTypeFor(null)
    setAddingId(item.id) // butonda "Ekleniyor..." görünsün

    const details = await fetchDetails(item.title, type)
    const defaultStatus = type === 'Kitap' ? 'Okuyorum' : 'İzliyorum'

    const newItem = {
      title: item.title,   // kullanıcının yazdığı başlığı koruyoruz (Türkçe olabilir)
      type: type,
      status: defaultStatus,
      rating: null,
      coverImageUrl: details.coverImageUrl ?? null,
      notes: null,
      description: details.description ?? null,
      isFavorite: false,
      startDate: null,
      endDate: null,
      genre: null
    }

    const addResponse = await apiFetch('/api/Items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    })

    if (addResponse.ok) {
      // Koleksiyona eklendi, artık watchlist'ten silebiliriz
      await apiFetch(`/api/Watchlist/${item.id}`, {
        method: 'DELETE'
      })
      fetchWatchlist()
      onItemAdded?.() // App'teki koleksiyon listesini de yenile

      const extra = details.coverImageUrl ? ' (kapağıyla birlikte 🖼️)' : ''
      showToast(`"${item.title}" koleksiyona ${type.toLowerCase()} olarak eklendi!${extra}`)
    } else {
      const data = await addResponse.json().catch(() => ({}))
      // Doğrulama ve sunucu hatalarını apiFetch zaten gösteriyor
      if (!data.errors && addResponse.status < 500) {
        showToast('Koleksiyona eklerken bir hata oluştu', 'error')
      }
    }

    setAddingId(null)
  }

  // Penceresi açık olan öğe (yoksa undefined)
  const choosingItem = items.find(i => i.id === choosingTypeFor)

  return (
    <div className="watchlist-page">
      <h2>{pageTitle}</h2>

      <form onSubmit={handleAdd} className="watchlist-add-form">
        <input
          id="watchlist-title"
          name="title"
          type="text"
          placeholder="Başlık ekle..."
          maxLength={200}
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit">Ekle</button>
      </form>

      {items.length === 0 && (
        <p className="watchlist-empty">Liste boş, yukarıdan bir şeyler ekle!</p>
      )}

      <ul className="watchlist-list">
        {items.map(item => {
          const isAdding = addingId === item.id
          return (
            <li key={item.id} className="watchlist-item">
              <span className="watchlist-item-title">{item.title}</span>
              <div className="watchlist-item-buttons">
                <button onClick={() => handleMoveClick(item)} disabled={isAdding}>
                  {isAdding ? '🔄 Ekleniyor...' : '✅ Koleksiyona Ekle'}
                </button>
                <button onClick={() => setDeletingId(item.id)} disabled={isAdding}>
                  🗑️ Sil
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Tür seçme penceresi (modal): arka plana tıklayınca ya da Esc'e basınca kapanır */}
      {choosingItem && (
        <div className="addlist-overlay" onClick={() => setChoosingTypeFor(null)}>
          <div className="addlist-box type-picker-box" onClick={(e) => e.stopPropagation()}>
            <button className="addlist-close" onClick={() => setChoosingTypeFor(null)}>✕</button>

            <h3>Ne olarak eklensin?</h3>
            <p className="addlist-item-title">{choosingItem.title}</p>

            <div className="type-picker-grid">
              {WATCH_TYPES.map(t => (
                <button
                  key={t.value}
                  className="type-picker-option"
                  onClick={() => moveToCollection(choosingItem, t.value)}
                >
                  <span className="type-picker-icon">{t.icon}</span>
                  {t.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <ConfirmModal
          message="Bu öğe listeden silinsin mi?"
          onConfirm={confirmDelete}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  )
}

export default Watchlist