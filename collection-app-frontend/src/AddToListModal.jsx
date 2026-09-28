import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from './ToastContext'

// item: hangi öğeyi listelere ekleyip çıkaracağımız
// onClose: modalı kapatmak için
function AddToListModal({ item, onClose }) {
  const showToast = useToast()
  const [lists, setLists] = useState([])
  const [itemListIds, setItemListIds] = useState([]) // bu öğenin şu an içinde olduğu liste id'leri
  const [newListName, setNewListName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('🏷️')

  const iconOptions = ['🏷️', '⭐', '❤️', '🎯', '📌', '🔥', '💎', '🌙']

  function fetchLists() {
    fetch('/api/CustomLists')
      .then(res => res.json())
      .then(data => setLists(data))
  }

  function fetchItemLists() {
    fetch(`/api/CustomLists/for-item/${item.id}`)
      .then(res => res.json())
      .then(data => setItemListIds(data))
  }

  useEffect(() => {
    fetchLists()
    fetchItemLists()
  }, [])

async function toggleList(listId) {
  const isInList = itemListIds.includes(listId)
  const list = lists.find(l => l.id === listId)

  if (isInList) {
    await fetch(`/api/CustomLists/${listId}/items/${item.id}`, {
      method: 'DELETE'
    })
    setItemListIds(prev => prev.filter(id => id !== listId))
    showToast(`${list.icon} "${list.name}" listesinden çıkarıldı`)
  } else {
    await fetch(`/api/CustomLists/${listId}/items/${item.id}`, {
      method: 'POST'
    })
    setItemListIds(prev => [...prev, listId])
    showToast(`${list.icon} "${list.name}" listesine eklendi!`)
  }
}
  async function handleCreateList(e) {
    e.preventDefault()
    if (!newListName.trim()) return

    const response = await fetch('/api/CustomLists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName, icon: selectedIcon })
    })

    if (response.ok) {
      setNewListName('')
      fetchLists()
      showToast(`"${newListName}" listesi oluşturuldu!`)
    }
  }

  return createPortal(
    <div className="addlist-overlay" onClick={onClose}>
      <div className="addlist-box" onClick={(e) => e.stopPropagation()}>
        <button className="addlist-close" onClick={onClose}>✕</button>
        <h3>🏷️ Listelere Ekle</h3>
        <p className="addlist-item-title">{item.title}</p>

        <div className="addlist-list-items">
          {lists.length === 0 && <p className="addlist-empty">Henüz liste yok, aşağıdan oluştur.</p>}
        {lists.map(list => (
            <label
                key={list.id}
                className={`addlist-checkbox-row ${itemListIds.includes(list.id) ? 'checked' : ''}`}
            >
                <input
                type="checkbox"
                checked={itemListIds.includes(list.id)}
                onChange={() => toggleList(list.id)}
                />
                <span>{list.icon} {list.name}</span>
                {itemListIds.includes(list.id) && <span className="addlist-added-badge">✓ Eklendi</span>}
            </label>
            ))}
        </div>

        <form onSubmit={handleCreateList} className="addlist-new-form">
          <div className="addlist-icon-picker">
            {iconOptions.map(icon => (
              <button
                type="button"
                key={icon}
                className={`addlist-icon-option ${selectedIcon === icon ? 'selected' : ''}`}
                onClick={() => setSelectedIcon(icon)}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="addlist-new-row">
            <input
              type="text"
              placeholder="Yeni liste adı..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <button type="submit">Oluştur</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default AddToListModal