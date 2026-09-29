import { useState, useEffect } from 'react'
import ConfirmModal from './ConfirmModal'
import './ConfirmModal.css'
import ImageModal from './ImageModal'
import './ImageModal.css'
import confetti from 'canvas-confetti'
import AddToListModal from './AddToListModal'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

function ItemCard({ item, onDeleteRequest, onItemUpdated }) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [type, setType] = useState(item.type)
  const [status, setStatus] = useState(item.status)
  const [rating, setRating] = useState(item.rating ? parseFloat(item.rating) : 0)
  const [notes, setNotes] = useState(item.notes || '')
  const [startDate, setStartDate] = useState(item.startDate ? item.startDate.slice(0, 7) : '')
  const [endDate, setEndDate] = useState(item.endDate ? item.endDate.slice(0, 7) : '')
  const [isFavorite, setIsFavorite] = useState(item.isFavorite)
  const [genre, setGenre] = useState(item.genre || '')
  const [coverImageUrl, setCoverImageUrl] = useState(item.coverImageUrl || '')
  const [showConfirm, setShowConfirm] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [description, setDescription] = useState(item.description || '')
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [showAddToList, setShowAddToList] = useState(false)
  const showToast = useToast()

  function getStatusOptions(type) {
    if (type === 'Kitap') {
      return [
        {value: 'Okuyorum', label: 'Okuyorum'},
        {value: 'Okudum', label: 'Okudum'},
        {value: 'Yarıda Bıraktım', label: 'Yarıda Bıraktım'}
      ]
    }
    return [
      {value: 'İzliyorum', label: 'İzliyorum'},
      {value: 'Bitti', label: 'Bitti'},
      {value: 'Yarıda Bıraktım', label: 'Yarıda Bıraktım'}
    ]
  }

  useEffect(() => {
    const validOptions = getStatusOptions(type).map(opt => opt.value)
    if (!validOptions.includes(status)) {
      setStatus(validOptions[0]) // geçersizse, o türün ilk seçeneğine sıfırla
    }
  }, [type]) 

  function renderStars(value) {
    const stars = []

    for (let i = 1; i <= 5; i++) {
      let fillPercentage = 0
      if (value >= i) {
        fillPercentage = 100
      } else if (value > i - 1) {
        fillPercentage = (value - (i - 1)) * 100
      }

      stars.push(
        <span key={i} className="single-star">
          <span className="star-empty-bg">☆</span>
          <span className="star-fill-bg" style={{ width: `${fillPercentage}%` }}>⭐</span>
        </span>
      )
    }

    return <span className="star-rating-display">{stars}</span>
  }
  
  function getStatusBadge(status){
    if(status === 'Bitti') return { icon: '✅', class: 'status-done'}
    if(status === 'Okudum') return { icon: '✅', class: 'status-done'}
    if(status === 'İzliyorum') return { icon: '👀', class: 'status-progress'}
    if(status === 'Okuyorum') return { icon: '👀', class: 'status-progress'}
    if(status === 'Yarıda Bıraktım') return { icon: '⏸️', class: 'status-dropped'}
    return { icon: '', class: ''}
  }

  function getRewatchLabel(type) {
    return type == 'Kitap' ? 'Tekrar Okudum' : 'Tekrar İzledim'
  }

  function confirmDelete() {
  onDeleteRequest(item)
  setShowConfirm(false)
}

  async function handleSearch() {
    if (!title.trim()) return
    setIsSearching(true)
    const endpoint = type === 'Kitap' ? 'book' : 'movie'
    const response = await apiFetch(
      `/api/Search/${endpoint}?query=${encodeURIComponent(title)}`
    )
    const data = await response.json()
    setSearchResults(data)
    setIsSearching(false)
  }

  function applySearchResult(result) {
    setTitle(result.title)
    setCoverImageUrl(result.imageUrl || '')
    setDescription(result.description || '')
    setSearchResults([])
  }

  async function handleUpdate(e) {
    e.preventDefault()

    const updatedItem = {
      title: title,
      type: type,
      status: status,
      rating: rating === 0 ? null : rating,
      coverImageUrl: coverImageUrl || null,
      notes: notes || null,
      description: description || null,
      startDate: startDate ? startDate + '-01' :  null,
      endDate: endDate ? endDate + '-01' :  null,
      genre: genre || null,
      isFavorite: isFavorite
    }

    const response = await apiFetch(`/api/Items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    })

    if (response.ok) {
      const justFinished =
        (status === 'Bitti' || status === 'Okudum') && 
        item.status !== 'Bitti' && item.status !== 'Okudum'
      
      if (justFinished) {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#7b2ff7','#f107a3','#ffc107']
        })
      }
      setIsEditing(false)
      onItemUpdated()
    }
  }

  async function toggleFavorite() {
    const updatedItem = {
      title: item.title,
      type: item.type,
      status: item.status,
      rating: item.rating,
      coverImageUrl: item.coverImageUrl,
      notes: item.notes,
      description: item.description,
      startDate: item.startDate,
      endDate: item.endDate,
      genre: item.genre,
      isFavorite: !isFavorite
    }

    const response = await apiFetch(`/api/Items/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem)
    })

    if (response.ok) {
      setIsFavorite(!isFavorite)
      onItemUpdated()
    }
  }

  // Butona her tıklandığında backend e bu öğenin sayacını bir arttır demek
  async function handleRewatch(){
   const response = await apiFetch(`/api/Items/${item.id}/rewatch`, {
   method: 'PATCH'
  })
  if (response.ok) {
    onItemUpdated() // listeyi yenile, güncel rewatchCountu göster
    showToast(`"${item.title}" tekrar izleme sayısı arttı! 🔁`)
  }
}

  async function handleUndoRewatch() {
  const response = await apiFetch(`/api/Items/${item.id}/unrewatch`, {
    method: 'PATCH'
  })

  if (response.ok) {
    onItemUpdated()
    showToast('Geri alındı')
  }
}


  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} className="item-card editing">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="search-row">
          <button type="button" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '🔄 Aranıyor...' : '🔍 Bilgileri Getir'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, i) => (
              <div key={i} className="search-result-item" onClick={() => applySearchResult(result)}>
                {result.imageUrl && <img src={result.imageUrl} alt={result.title} />}
                <div className="search-result-info">
                  <strong>{result.title}</strong>
                  {result.year && <span> ({result.year})</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <input
          type="text"
          placeholder="Kapak görseli linki (isteğe bağlı)"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />

        {description && (
          <textarea
            placeholder="Özet (API'den otomatik gelir)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="description-field"
          />
        )}

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Kitap">Kitap</option>
          <option value="Dizi">Dizi</option>
          <option value="Film">Film</option>
          <option value="Belgesel">Belgesel</option>
          <option value="Animasyon">Animasyon</option>
          <option value="Anime">Anime</option>
        </select>

        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">Kategori (isteğe bağlı)</option>
          <option value="Aksiyon">Aksiyon</option>
          <option value="Komedi">Komedi</option>
          <option value="Dram">Dram</option>
          <option value="Bilim Kurgu">Bilim Kurgu</option>
          <option value="Korku">Korku</option>
          <option value="Fantastik">Fantastik</option>
          <option value="Romantik">Romantik</option>
          <option value="Gizem/Gerilim">Gizem/Gerilim</option>
          <option value="Gerçek Hayat Hikayesi">Gerçek Hayat Hikayesi</option>
          <option value="Tarihi">Tarihi</option>
          <option value="Macera">Macera</option>
          <option value="Psikolojik">Psikolojik</option>
          <option value="Bilgilendirici">Bilgilendirici</option>
          <option value="Biyografik">Biyografik</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="Okudum">Okudum</option>
          <option value="İzliyorum">İzliyorum</option>
          <option value="Bitti">Bitti</option>
          <option value="Yarıda Bıraktım">Yarıda Bıraktım</option>
        </select>

        <div className="rating-slider">
          <input 
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(parseFloat(e.target.value))}
          />
          <span className="rating-value">
            {rating > 0 ? `${rating.toFixed(1)} ⭐` : 'Puansız'}
          </span>
        </div>

        <textarea
          placeholder="Yorum (isteğe bağlı)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        <div className="date-row">
          <input 
            type="month"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="month"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <button type="submit">💾 Kaydet</button>
        <button type="button" onClick={() => setIsEditing(false)}>❌ Vazgeç</button>
      </form>
    )
  }

  return (
    <div className="item-card">
      {item.coverImageUrl && (
        <img
          src={item.coverImageUrl}
          alt={item.title}
          className="item-cover-image"
          onClick={() => setShowImageModal(true)}
          style={{ cursor: 'zoom-in' }}
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}

      {showImageModal && (
        <ImageModal
          imageUrl={item.coverImageUrl}
          onClose={() => setShowImageModal(false)}
        />
      )}

      <h3>{item.title}</h3>

      <div className="item-meta">
        <span className="type-label">{item.type}</span>
        <span className={`status-badge ${getStatusBadge(item.status).class}`}>
          {getStatusBadge(item.status).icon} {item.status}
        </span>
      </div>

      {item.genre && <span className="genre-tag">🏷️ {item.genre}</span>}

      {item.rating && (
        <p className="stars">
          <span className="rating-number">{parseFloat(item.rating).toFixed(1)}</span>
          {renderStars(item.rating)}
        </p>
      )}

      {item.notes && <p className="item-notes">💬 {item.notes}</p>}

      {item.description && (
        <p className="item-description">
          {showFullDescription || item.description.length <= 150
            ? item.description
            : `${item.description.slice(0, 150)}...`}
          {item.description.length > 150 && (
            <span
              className="read-more-link"
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {showFullDescription ? ' daha az göster' : ' devamını oku'}
            </span>
          )}
        </p>
      )}

      <button className="edit-btn" onClick={() => setIsEditing(true)}>✏️ Düzenle</button>
      <button className="delete-btn" onClick={() => setShowConfirm(true)}>🗑️ Sil</button>

      {showConfirm && (
        <ConfirmModal
          message={`"${item.title}" silinsin mi?`}
          onConfirm={confirmDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="rewatch-row">
        <button onClick={handleRewatch} className="rewatch-btn">
          🔁 {getRewatchLabel(item.type)} {item.rewatchCount > 0 && `(${item.rewatchCount})`}
        </button>
        {item.rewatchCount > 0 && (
          <button onClick={handleUndoRewatch} className="rewatch-undo-btn" title="Geri al">
            −
          </button>
        )}
        <button onClick={toggleFavorite} className="favorite-btn">
          {isFavorite ? '❤️' : '🤍'}
        </button>

        <button onClick={() => setShowAddToList(true)} className="add-to-list-btn">
          🏷️ Listeye Ekle
        </button>

        {showAddToList && (
          <AddToListModal
            item={item}
            onClose={() => setShowAddToList(false)}
          />
        )}
      </div>
    </div>
  )
}

export default ItemCard