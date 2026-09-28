import { useState, useEffect } from 'react'
import { useToast } from './ToastContext'
import ConfirmModal from './ConfirmModal'

// category: "İzleme" ya da "Okuma"
// pageTitle: sayfa başlığı (örn. "🎬 İzleme Listem")
// defaultType: "Koleksiyona Ekle"ye basınca hangi türle eklensin (örn. "Dizi" ya da "Kitap")
function Watchlist({ category, pageTitle, defaultType }) {
  const showToast = useToast()
  const [items, setItems] = useState([])
  const [newTitle, setNewTitle] = useState('')
  const [deletingId, setDeletingId] = useState(null) // silme onayı bekleyen öğenin id'si

  function fetchWatchlist() {
    fetch(`/api/Watchlist?category=${category}`)
      .then(response => response.json())
      .then(data => setItems(data))
  }

  // Sayfa ilk açıldığında ya da category değiştiğinde listeyi çek
  useEffect(() => {
    fetchWatchlist()
  }, [category])

  async function handleAdd(e) {
    e.preventDefault()
    if (!newTitle.trim()) return

    const response = await fetch('/api/Watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, category: category })
    })

    if (response.ok) {
      setNewTitle('')
      fetchWatchlist()
      showToast(`"${newTitle}" listeye eklendi!`)
    } else {
      showToast('Ekleme sırasında bir hata oluştu', 'error')
    }
  }

  async function confirmDelete() {
    const response = await fetch(`/api/Watchlist/${deletingId}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      fetchWatchlist()
      showToast('Listeden kaldırıldı')
    }
    setDeletingId(null)
  }

  // "Koleksiyona Ekle" butonu: gerçek bir Item olarak ekler, sonra watchlist'ten siler
  async function moveToCollection(item) {
    const defaultStatus = defaultType === 'Kitap' ? 'Okuyorum' : 'İzliyorum'

    const newItem = {
      title: item.title,
      type: defaultType,
      status: defaultStatus,
      rating: null,
      coverImageUrl: null,
      notes: null,
      isFavorite: false,
      startDate: null,
      endDate: null,
      genre: null
    }

    const addResponse = await fetch('/api/Items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    })

    if (addResponse.ok) {
      // Koleksiyona eklendi, artık watchlist'ten silebiliriz
      await fetch(`/api/Watchlist/${item.id}`, {
        method: 'DELETE'
      })
      fetchWatchlist()
      showToast(`"${item.title}" koleksiyona eklendi!`)
    } else {
      showToast('Koleksiyona eklerken bir hata oluştu', 'error')
    }
  }

  return (
    <div className="watchlist-page">
      <h2>{pageTitle}</h2>

      <form onSubmit={handleAdd} className="watchlist-add-form">
        <input
          type="text"
          placeholder="Başlık ekle..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <button type="submit">Ekle</button>
      </form>

      {items.length === 0 && (
        <p className="watchlist-empty">Liste boş, yukarıdan bir şeyler ekle!</p>
      )}

      <ul className="watchlist-list">
        {items.map(item => (
          <li key={item.id} className="watchlist-item">
            <span className="watchlist-item-title">{item.title}</span>
            <div className="watchlist-item-buttons">
              <button onClick={() => moveToCollection(item)}>
                ✅ Koleksiyona Ekle
              </button>
              <button onClick={() => setDeletingId(item.id)}>
                🗑️ Sil
              </button>
            </div>
          </li>
        ))}
      </ul>

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