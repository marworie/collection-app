// ============================================================
// AddToListModal.jsx
// Bir öğe kartındaki "🏷️ Listeye Ekle" butonuna basınca açılan pencere.
// Kullanıcının tüm özel listelerini onay kutularıyla gösterir:
// kutu işaretlenince öğe o listeye eklenir, kaldırılınca listeden çıkar.
// Alttaki formdan yeni bir liste de oluşturulabilir.
// ============================================================

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

// item: hangi öğeyi listelere ekleyip çıkaracağımız
// onClose: modalı kapatmak için
function AddToListModal({ item, onClose }) {
  const showToast = useToast()
  const [lists, setLists] = useState([])               // kullanıcının tüm özel listeleri
  const [itemListIds, setItemListIds] = useState([])   // bu öğenin şu an içinde olduğu liste id'leri
  const [newListName, setNewListName] = useState('')   // yeni liste formu: ad
  const [selectedIcon, setSelectedIcon] = useState('🏷️') // yeni liste formu: seçilen ikon

  // Yeni liste oluştururken seçilebilecek ikonlar
  const iconOptions = ['🏷️', '⭐', '❤️', '🎯', '📌', '🔥', '💎', '🌙']

  // Kullanıcının tüm listelerini çek
  function fetchLists() {
    apiFetch('/api/CustomLists')
      .then(res => res.json())
      .then(data => setLists(data))
  }

  // Bu öğenin hangi listelerde olduğunu çek (onay kutularını doğru işaretlemek için)
  function fetchItemLists() {
    apiFetch(`/api/CustomLists/for-item/${item.id}`)
      .then(res => res.json())
      .then(data => setItemListIds(data))
  }

  // Pencere açıldığında iki bilgiyi de bir kez çek
  useEffect(() => {
    fetchLists()
    fetchItemLists()
  }, [])

  // Onay kutusuna tıklanınca: öğe listedeyse çıkar, değilse ekle
  async function toggleList(listId) {
    const isInList = itemListIds.includes(listId)
    const list = lists.find(l => l.id === listId) // toast mesajında adını/ikonunu göstermek için

    if (isInList) {
      await apiFetch(`/api/CustomLists/${listId}/items/${item.id}`, {
        method: 'DELETE'
      })
      // Tüm listeyi yeniden çekmek yerine sadece bu id'yi çıkarıyoruz (daha hızlı)
      setItemListIds(prev => prev.filter(id => id !== listId))
      showToast(`${list.icon} "${list.name}" listesinden çıkarıldı`)
    } else {
      await apiFetch(`/api/CustomLists/${listId}/items/${item.id}`, {
        method: 'POST'
      })
      setItemListIds(prev => [...prev, listId])
      showToast(`${list.icon} "${list.name}" listesine eklendi!`)
    }
  }

  // Alttaki formdan yeni liste oluştur
  async function handleCreateList(e) {
    e.preventDefault()
    if (!newListName.trim()) return // boş isimle liste oluşturma

    const response = await apiFetch('/api/CustomLists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newListName, icon: selectedIcon })
    })

    if (response.ok) {
      setNewListName('')
      fetchLists() // yeni liste yukarıdaki listede görünsün
      showToast(`"${newListName}" listesi oluşturuldu!`)
    }
  }

  // createPortal: pencereyi kartın içine değil, doğrudan <body>'nin sonuna çizer.
  // Böylece kartın CSS'i (overflow, transform vb.) pencerenin görünümünü bozmaz.
  return createPortal(
    // Karartılmış arka plan: tıklanınca pencere kapanır
    <div className="addlist-overlay" onClick={onClose}>
      {/* stopPropagation: kutunun içine tıklamak arka plana "geçmesin", pencere kapanmasın */}
      <div className="addlist-box" onClick={(e) => e.stopPropagation()}>
        <button className="addlist-close" onClick={onClose}>✕</button>
        <h3>🏷️ Listelere Ekle</h3>
        <p className="addlist-item-title">{item.title}</p>

        {/* Mevcut listeler: her biri bir onay kutusu */}
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

        {/* Yeni liste oluşturma formu */}
        <form onSubmit={handleCreateList} className="addlist-new-form">
          {/* İkon seçici */}
          <div className="addlist-icon-picker">
            {iconOptions.map(icon => (
              <button
                type="button" // type="button": tıklayınca formu göndermesin
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