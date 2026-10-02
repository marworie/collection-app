import { useState, useEffect } from 'react'
import ItemCard from './ItemCard'
import ConfirmModal from './ConfirmModal'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

const ICON_OPTIONS = ['🏷️', '⭐', '❤️', '💎', '📚', '🎬', '🔥', '😊', '🌙', '🎯']

function CustomLists() {
  const showToast = useToast()
  const [lists, setLists] = useState([])
  const [selectedListId, setSelectedListId] = useState(null)
  const [listItems, setListItems] = useState([])
  const [deletingListId, setDeletingListId] = useState(null)
  const [isEditingList, setIsEditingList] = useState(false)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')

  function fetchLists() {
    apiFetch('/api/CustomLists')
      .then(res => res.ok ? res.json() : [])
      .then(data => setLists(data))
  }

  function fetchListItems(listId) {
    apiFetch(`/api/CustomLists/${listId}/items`)
      .then(res => res.ok ? res.json() : [])
      .then(data => setListItems(data))
  }

  // Liste seçiliyse onun öğelerini, değilse tüm listeleri çek
  // (detaydan geri dönünce sayılar ve kapaklar da güncellenmiş olur)
  useEffect(() => {
    if (selectedListId) {
      fetchListItems(selectedListId)
    } else {
      fetchLists()
    }
  }, [selectedListId])

  async function confirmDeleteList() {
    await apiFetch(`/api/CustomLists/${deletingListId}`, {
      method: 'DELETE'
    })
    setDeletingListId(null)
    if (selectedListId === deletingListId) {
      setSelectedListId(null)
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

  // Mevcut ikon listede yoksa (örn. ":)") onu da seçeneklerin başına ekle
  const iconChoices = ICON_OPTIONS.includes(editIcon) ? ICON_OPTIONS : [editIcon, ...ICON_OPTIONS]

  const selectedList = lists.find(l => l.id === selectedListId)

  return (
    <div className="customlists-page">
      <h2>🏷️ Listelerim</h2>

      {!selectedListId ? (
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
      ) : (
        <div>
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