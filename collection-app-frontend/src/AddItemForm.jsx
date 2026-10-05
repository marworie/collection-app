// ============================================================
// AddItemForm.jsx
// Ana sayfadaki "Koleksiyona bir öğe daha ekle" formu.
// Kullanıcı başlık, tür, durum, puan, tarih vb. bilgileri girer;
// isterse "Bilgileri Getir" ile TMDB/OpenLibrary'den kapak ve özet çeker.
// Form gönderilince öğe backend'e (POST /api/Items) kaydedilir.
// ============================================================

import { useState, useEffect } from 'react'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

// onItemAdded: öğe eklenince App'e haber vermek için (liste yenilensin, form kapansın)
// currentView: şu an hangi sayfada olduğumuz (App'ten geliyor)
function AddItemForm({ onItemAdded, currentView }) {
  const showToast = useToast()

  // ---------- Form alanları ----------
  const [title, setTitle] = useState('')
  const [type, setType] = useState('Kitap')
  const [status, setStatus] = useState('İzliyorum')
  const [rating, setRating] = useState(0)            // 0 = puansız
  const [startDate, setStartDate] = useState('')     // "YYYY-MM" biçiminde
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')             // kullanıcının kendi yorumu
  const [genre, setGenre] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [description, setDescription] = useState('') // API'den gelen özet

  // ---------- Arama (Bilgileri Getir) ----------
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false) // arama sürerken buton kilitlensin

  // Bu ay, yerel saate göre "YYYY-MM" biçiminde (ay seçici bu formatı bekliyor).
  // Tarih alanlarında max olarak kullanılıyor: gelecek aylar seçilemesin.
  const thisMonth = new Date().toLocaleDateString('sv-SE').slice(0, 7)

  // Türe göre durum seçenekleri: kitaplar "okunur", diğerleri "izlenir"
  function getStatusOptions(type) {
    if (type === 'Kitap') {
      return [
        { value: 'Okuyorum', label: 'Okuyorum' },
        { value: 'Okudum', label: 'Okudum' },
        { value: 'Yarıda Bıraktım', label: 'Yarıda Bıraktım' }
      ]
    }
    return [
      { value: 'İzliyorum', label: 'İzliyorum' },
      { value: 'Bitti', label: 'Bitti' },
      { value: 'Yarıda Bıraktım', label: 'Yarıda Bıraktım' }
    ]
  }

  // Tür değişince, mevcut durum yeni türe uymuyorsa düzelt
  // (örn. "Dizi"den "Kitap"a geçince "İzliyorum" → "Okuyorum")
  useEffect(() => {
    const validOptions = getStatusOptions(type).map(opt => opt.value)
    if (!validOptions.includes(status)) {
      setStatus(validOptions[0]) // geçersizse, o türün ilk seçeneğine sıfırla
    }
  }, [type])

  // "Bilgileri Getir" butonu: başlığa göre dış API'de arama yapar
  async function handleSearch() {
    if (!title.trim()) return // başlık boşsa aramaya gerek yok
    setIsSearching(true)

    // Kitap seçiliyse OpenLibrary'e, diğer türlerde TMDB'ye soruyoruz
    const endpoint = type === 'Kitap' ? 'book' : 'movie'

    const response = await apiFetch(
      `/api/Search/${endpoint}?query=${encodeURIComponent(title)}` // encodeURIComponent: boşluk/Türkçe karakterler URL'yi bozmasın
    )
    const data = await response.json()
    setSearchResults(data)
    setIsSearching(false)
  }

  // Arama sonuçlarından birine tıklanınca form alanlarını o sonuçla doldur
  function applySearchResult(result) {
    setTitle(result.title)
    setCoverImageUrl(result.imageUrl || '')
    setDescription(result.description || '')
    setSearchResults([]) // sonuç listesini kapat
  }

  // Form gönderilince: öğeyi backend'e kaydet
  async function handleSubmit(e) {
    e.preventDefault() // sayfanın yenilenmesini engelle (formun varsayılan davranışı)

    // Backend'in beklediği şekle çeviriyoruz; boş alanlar null olarak gidiyor
    const newItem = {
      title: title,
      type: type,
      status: status,
      rating: rating === 0 ? null : rating,          // 0 = puansız → null
      coverImageUrl: coverImageUrl || null,
      notes: notes || null,
      description: description || null,
      isFavorite: false,
      startDate: startDate ? `${startDate}-01` : null, // "2026-09" → "2026-09-01" (backend tam tarih istiyor)
      endDate: endDate ? `${endDate}-01` : null,
      genre: genre || null
    }

    const response = await apiFetch('/api/Items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    })

    if (response.ok) {
      // Başarılıysa formu temizle (tür ve durum bir sonraki ekleme için aynı kalıyor)
      setTitle('')
      setRating(0)
      setNotes('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setGenre('')
      setCoverImageUrl('')
      onItemAdded() // App listeyi yenilesin, formu kapatsın
      showToast(`"${newItem.title}" eklendi!`)
    } else {
      const data = await response.json().catch(() => ({}))
      // Doğrulama (errors) ve sunucu (500) hatalarını apiFetch zaten gösteriyor,
      // burada sadece onların dışındaki hatalar için mesaj gösteriyoruz (çift toast olmasın)
      if (!data.errors && response.status < 500) {
        showToast('Ekleme sırasında bir hata oluştu', 'error')
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-item-form">
      <div className="form-row">
        {/* Başlık (zorunlu) */}
        <input
          type="text"
          placeholder="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Başlığa göre kapak ve özet arama */}
        <div className="search-row">
          <button type="button" onClick={handleSearch} disabled={isSearching}>
            {isSearching ? '🔄 Aranıyor...' : '🔍 Bilgileri Getir'}
          </button>
        </div>

        {/* Arama sonuçları: tıklanan sonuç formu doldurur */}
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

        {/* Kapak görseli: elle de girilebilir, aramadan da gelebilir */}
        <input
          type="text"
          placeholder="Kapak görseli linki (isteğe bağlı)"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
        />

        {/* Özet alanı sadece aramadan bir özet geldiyse görünür */}
        {description && (
          <textarea
            placeholder="Özet (API'den otomatik gelir)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="description-field"
          />
        )}

        {/* Tür seçimi */}
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="Kitap">Kitap</option>
          <option value="Dizi">Dizi</option>
          <option value="Film">Film</option>
          <option value="Belgesel">Belgesel</option>
          <option value="Animasyon">Animasyon</option>
          <option value="Anime">Anime</option>
        </select>

        {/* Kategori (isteğe bağlı) */}
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

        {/* Durum: seçenekler türe göre değişiyor */}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {getStatusOptions(type).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Puan: 0 ile 5 arası, 0.1'lik adımlarla (0 = puansız) */}
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
      </div>

      {/* Kullanıcının kendi yorumu */}
      <textarea
        placeholder="Yorum (isteğe bağlı)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={1}
      />

      {/* Başlangıç ve bitiş ayı (gelecek aylar seçilemez) */}
      <div className="date-row">
        <input
          type="month"
          max={thisMonth}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="month"
          max={thisMonth}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button type="submit">Ekle</button>
    </form>
  )
}

export default AddItemForm