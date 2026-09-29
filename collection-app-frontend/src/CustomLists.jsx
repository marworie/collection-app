import { useState, useEffect } from 'react'
import ItemCard from './ItemCard'
import ConfirmModal from './ConfirmModal'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

function CustomLists() {
  const showToast = useToast()
  const [lists, setLists] = useState([])
  const [selectedListId, setSelectedListId] = useState(null)
  const [listItems, setListItems] = useState([])
  const [deletingListId, setDeletingListId] = useState(null)

  function fetchLists() {
    apiFetch('/api/CustomLists')
      .then(res => res.json())
      .then(data => setLists(data))
  }

  function fetchListItems(listId) {
    apiFetch(`/api/CustomLists/${listId}/items`)
      .then(res => res.json())
      .then(data => setListItems(data))
  }

  useEffect(() => {
    fetchLists()
  }, [])

  useEffect(() => {
    if (selectedListId) {
      fetchListItems(selectedListId)
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

  const selectedList = lists.find(l => l.id === selectedListId)

  return (
    <div className="customlists-page">
      <h2>🏷️ Listelerim</h2>

      {!selectedListId ? (
        <div className="customlists-grid">
          {lists.length === 0 && (
            <p className="customlists-empty">
              Henüz liste yok. Bir kartın üzerindeki "+ Listeye Ekle" butonuyla ilk listeni oluşturabilirsin.
            </p>
          )}
          {lists.map(list => (
            <div key={list.id} className="customlist-card">
              <div className="customlist-card-main" onClick={() => setSelectedListId(list.id)}>
                <span className="customlist-icon">{list.icon}</span>
                <span className="customlist-name">{list.name}</span>
              </div>
              <button className="customlist-delete-btn" onClick={() => setDeletingListId(list.id)}>
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <button className="customlist-back-btn" onClick={() => setSelectedListId(null)}>
            ← Tüm Listeler
          </button>
          <h3>{selectedList?.icon} {selectedList?.name}</h3>

          {listItems.length === 0 && <p className="customlists-empty">Bu listede henüz öğe yok.</p>}

          <div className="item-list">
            {listItems.map(item => (
              <ItemCard key={item.id} item={item} onItemUpdated={() => fetchListItems(selectedListId)} />
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