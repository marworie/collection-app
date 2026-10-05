// ============================================================
// CustomLists.jsx
// "Listelerim" sayfası. İki bölümden oluşur:
// 1) Hızlı Listeler: İzleme Listem ve Okuma Listem (henüz koleksiyonda olmayanlar)
// 2) Kullanıcının kendi oluşturduğu listeler (kapak mozaiği + öğe sayısı)
// Bir listeye tıklanınca içindeki öğeler gösterilir; liste adı/ikonu düzenlenebilir.
// ============================================================

import { useState, useEffect } from 'react'
import ItemCard from './ItemCard'
import ConfirmModal from './ConfirmModal'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

// Liste düzenlerken seçilebilecek ikonlar
const ICON_OPTIONS = ['🏷️', '⭐', '❤️', '💎', '📚', '🎬', '🔥', '😊', '🌙', '🎯']

// onOpenWatchlist: İzleme/Okuma Listem kartına tıklanınca App'e o sayfayı açtırmak için
function CustomLists({ onOpenWatchlist }) {
  const showToast = useToast()
  const [lists, setLists] = useState([])                   // kullanıcının özel listeleri (özet: sayı + kapaklar)
  const [selectedListId, setSelectedListId] = useState(null) // şu an açık olan liste (null = tüm listeler)
  const [listItems, setListItems] = useState([])           // açık listenin içindeki öğeler
  const [deletingListId, setDeletingListId] = useState(null) // silme onayı bekleyen liste
  const [watchCounts, setWatchCounts] = useState({ izleme: 0, okuma: 0 }) // hızlı listelerdeki öğe sayıları

  // Liste düzenleme formu
  const [isEditingList, setIsEditingList] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')

  // Tüm listeleri çek (her birinin öğe sayısı ve ilk 4 kapağıyla birlikte)
  function fetchLists() {
    apiFetch('/api/CustomLists')
      .then(res => res.ok ? res.json() : []) // hata gelirse listeyi bozma
      .then(data => setLists(data))
  }

  // İzleme ve Okuma listelerinin öğe sayılarını çek (kartlarda göstermek için)
  async function fetchWatchCounts() {
    const [izleme, okuma] = await Promise.all([ // iki isteği aynı anda gönder, ikisini birden bekle
      apiFetch('/api/Watchlist?category=İzleme').then(r => r.ok ? r.json() : []),
      apiFetch('/api/Watchlist?category=Okuma').then(r => r.ok ? r.json() : [])
    ])
    setWatchCounts({ izleme: izleme.length, okuma: okuma.length })
  }

  // Seçili listenin öğelerini çek
  function fetchListItems(listId) {
    apiFetch(`/api/CustomLists/${listId}/items`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setListItems(data))
  }

  // Liste seçiliyse onun öğelerini, değilse tüm listeleri ve sayıları çek
  // (detaydan geri dönünce sayılar ve kapaklar da güncellenmiş olur)
  useEffect(() => {
    if (selectedListId) {
      fetchListItems(selectedListId)
    } else {
      fetchLists()
      fetchWatchCounts()
    }
  }, [selectedListId])

  // Silme onaylanınca listeyi sil
  async function confirmDeleteList() {
    await apiFetch(`/api/CustomLists/${deletingListId}`, {
      method: 'DELETE'
    })
    setDeletingListId(null)
    if (selectedListId === deletingListId) {
      setSelectedListId(null) // açık olan liste silindiyse tüm listelere dön
    }
    fetchLists()
    showToast('Liste silindi')
  }

  // Düzenleme formunu mevcut değerlerle aç
  function startEditList() {
    setEditName(selectedList.name)
    setEditIcon(selectedList.icon)
    setIsEditingList(true)
  }

  // Liste adı/ikonu değişikliğini kaydet
  async function saveListEdit(e) {
    e.preventDefault()

    const response = await apiFetch(`/api/CustomLists/${selectedListId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, icon: editIcon })
    })

    if (response.ok) {
      // Tüm listeyi yeniden çekmek yerine sadece bu listeyi yerinde güncelle
      setLists(prev => prev.map(l =>
        l.id === selectedListId ? { ...l, name: editName.trim(), icon: editIcon } : l
      ))
      setIsEditingList(false)
      showToast('Liste güncellendi')
    }
  }

  // Öğeyi sadece bu listeden çıkarır, koleksiyondan silmez
  async function removeFromList(item) {
    const response = await apiFetch(`/api/CustomLists/${selectedListId}/items/${item.id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      setListItems(prev => prev.filter(i => i.id !== item.id))
      showToast(`"${item.title}" listeden çıkarıldı`)
    }
  }

  // Mevcut ikon seçeneklerde yoksa (örn. ":)") onu da başa ekle
  const iconChoices = !editIcon || ICON_OPTIONS.includes(editIcon)
    ? ICON_OPTIONS
    : [editIcon, ...ICON_OPTIONS]

  const selectedList = lists.find(l => l.id === selectedListId)

  // Hızlı liste kartları (İzleme ve Okuma Listem)
  const quickLists = [
    { view: 'izlemeListem', icon: '📌', name: 'İzleme Listem', count: watchCounts.izleme },
    { view: 'okumaListem', icon: '📑', name: 'Okuma Listem', count: watchCounts.okuma }
  ]

  return (
    <div className="customlists-page">
      <h2>🏷️ Listelerim</h2>

      {!selectedListId ? (
        <>
          {/* ===== Hızlı Listeler ===== */}
          <h4 className="customlists-section-title">Hızlı Listeler</h4>
          <div className="customlists-grid">
            {quickLists.map(q => (
              <div key={q.view} className="customlist-card quick" onClick={() => onOpenWatchlist(q.view)}>
                <div className="customlist-cover covers-0">
                  <span className="customlist-cover-icon">{q.icon}</span>
                </div>
                <div className="customlist-info">
                  <span className="customlist-name">{q.name}</span>
                  <span className="customlist-count">{q.count} öğe</span>
                </div>
              </div>
            ))}
          </div>

          {/* ===== Kullanıcının kendi listeleri ===== */}
          <h4 className="customlists-section-title">Benim Listelerim</h4>
          <div className="customlists-grid">
            {lists.length === 0 && (
              <p className="customlists-empty">
                Henüz liste yok. Bir kartın üzerindeki "🏷️ Listeye Ekle" butonuyla ilk listeni oluşturabilirsin.
              </p>
            )}

            {lists.map(list => {
              const covers = list.previewCovers || []
              return (
                <div key={list.id} className="customlist-card" onClick={() => setSelectedListId(list.id)}>
                  {/* Kapak mozaiği: 1-4 kapak varsa onları, yoksa büyük ikonu göster */}
                  <div className={`customlist-cover covers-${covers.length}`}>
                    {covers.length > 0
                      ? covers.map((url, i) => (
                          <img key={i} src={url} alt="" onError={(e) => { e.target.style.visibility = 'hidden' }} />
                        ))
                      : <span className="customlist-cover-icon">{list.icon}</span>}
                  </div>

                  <div className="customlist-info">
                    <span className="customlist-name">{list.icon} {list.name}</span>
                    <span className="customlist-count">{list.itemCount} öğe</span>
                  </div>

                  <button
                    className="customlist-delete-btn"
                    title="Listeyi sil"
                    onClick={(e) => {
                      e.stopPropagation() // karta tıklanmış sayılıp liste açılmasın
                      setDeletingListId(list.id)
                    }}
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div>
          {/* ===== Liste detayı ===== */}
          <button
            className="customlist-back-btn"
            onClick={() => {
              setSelectedListId(null)
              setIsEditingList(false)
            }}
          >
            ← Tüm Listeler
          </button>

          {isEditingList ? (
            // Düzenleme formu: ikon seçici + ad
            <form className="customlist-edit-form" onSubmit={saveListEdit}>
              <div className="addlist-icon-picker">
                {iconChoices.map(icon => (
                  <button
                    type="button"
                    key={icon}
                    className={`addlist-icon-option ${editIcon === icon ? 'selected' : ''}`}
                    onClick={() => setEditIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="customlist-edit-row">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={50}
                  required
                  autoFocus
                />
                <button type="submit">💾 Kaydet</button>
                <button type="button" className="cancel" onClick={() => setIsEditingList(false)}>
                  Vazgeç
                </button>
              </div>
            </form>
          ) : (
            <h3 className="customlist-detail-title">
              {selectedList?.icon} {selectedList?.name}
              <span className="customlist-count"> · {listItems.length} öğe</span>
              <button className="customlist-edit-btn" onClick={startEditList} title="Listeyi düzenle">
                ✏️
              </button>
            </h3>
          )}

          {listItems.length === 0 && <p className="customlists-empty">Bu listede henüz öğe yok.</p>}

          {/* inList: kartlarda "Sil" yerine "Listeden Çıkar" görünsün */}
          <div className="item-list">
            {listItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                inList
                onDeleteRequest={removeFromList}
                onItemUpdated={() => fetchListItems(selectedListId)}
              />
            ))}
          </div>
        </div>
      )}

      {deletingListId && (
        <ConfirmModal
          message="Bu liste silinsin mi? (İçindeki öğeler koleksiyonundan silinmez, sadece listeden çıkar)"
          onConfirm={confirmDeleteList}
          onCancel={() => setDeletingListId(null)}
        />
      )}
    </div>
  )
}

export default CustomLists