import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import Profile from './Profile'
import ItemCard from './ItemCard'
import AddItemForm from './AddItemForm'
import Login from './Login'
import Stats from './Stats'
import './App.css'
import Watchlist from './Watchlist'
import './Watchlist.css'
import AvatarIcon from './AvatarIcon'
import DraggableItemList from './DraggableItemList'
import SuggestionModal from './SuggestionModal'
import { useToast } from './ToastContext'
import CustomLists from './CustomLists'
import LoginSplash from './LoginSplash'
import { apiFetch } from './api'

function App() {
  const [items, setItems] = useState([])
  const [currentView, setCurrentView] = useState('all')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  // isLoggedIn: sayfa ilk açıldığında localStorage'da kayıtlı kullanıcı var mı diye bakıyoruz
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('loggedInUser') !== null
  )
  const [searchQuery, setSearchQuery] = useState('') //arama çubuğu
  const [sortBy, setSortBy] = useState('newest') //sıralama
  const [viewMode, setViewMode] = useState('grid') //görünüm
  const [showAddForm, setShowAddForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [suggestedItem, setSuggestedItem] = useState(null)
  const showToast = useToast()
  const pendingDeletes = useRef({}) // hangi id nin silinmesi "bekletiliyor", zamanlayıcısını burada tutuyoruz
  const searchInputRef = useRef(null)
  const [showSplash, setShowSplash] = useState(false)

  function fetchItems() {
    apiFetch('/api/Items')
      .then(response => response.json())
      .then(data => {
        setItems(data)
      })
      .catch(error => console.error('Veri çekilirken hata oluştu:', error))
  }

  function handleDeleteRequest(item) {
  // Öğeyi ekrandan hemen kaldırıyoruz (kullanıcı silinmiş gibi görsün)
  setItems(prev => prev.filter(i => i.id !== item.id))

  // 5 saniye sonra gerçekten backend'den silecek bir zamanlayıcı kuruyoruz
  const timeoutId = setTimeout(async () => {
    await apiFetch(`/api/Items/${item.id}`, { method: 'DELETE' })
    delete pendingDeletes.current[item.id]
  }, 5000)

  pendingDeletes.current[item.id] = timeoutId

  showToast(`"${item.title}" silindi`, 'success', 'Geri Al', () => undoDelete(item))
}

function undoDelete(item) {
  // Zamanlayıcıyı iptal ediyoruz ki backend'e hiç silme isteği gitmesin
  clearTimeout(pendingDeletes.current[item.id])
  delete pendingDeletes.current[item.id]

  // Öğeyi listeye geri koyuyoruz
  setItems(prev => [item, ...prev])
}

  function handleSuggest() {
  // Zaten bitirilmiş (Bitti/Okudum) olanları hariç tutuyoruz
  const candidates = items.filter(
    item => item.status !== 'Bitti' && item.status !== 'Okudum'
  )

  if (candidates.length === 0) {
    showToast('Önerilecek bir şey yok, hepsini bitirmişsin! 🎉')
    return
  }

  const random = candidates[Math.floor(Math.random() * candidates.length)]
  setSuggestedItem(random)
}

  async function handleReorder(reorderedItems) {
  // Yeni sıraya göre her öğeye 0, 1, 2... diye SortOrder ver
  const updates = reorderedItems.map((item, index) => ({
    id: item.id,
    sortOrder: index
  }))

  await apiFetch('/api/Items/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  })

  fetchItems()
}

  useEffect(() => {
    if (showSplash) {
      // 2 buçuk saniye sonra karşılama ekranını kapat
      const timer = setTimeout(() => setShowSplash(false),2500)
      // splash erken kapanırsa zamanlayıcıyı temizle gereksiz çalışmasın
      return () => clearTimeout(timer)
    }
  },[showSplash])

  useEffect(() => {
    if (isLoggedIn) {
      fetchItems()
    }
  }, [isLoggedIn])

    function handleLogout() {
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setSidebarOpen(false)   // çıkış yapınca, tekrar girişte menü açık gelmesin
  }

  // Menüden bir sayfa seçilince hem sayfayı değiştir hem menüyü kapat
  function handleViewChange(view) {
  setCurrentView(view)
  setSidebarOpen(false)
}

  function toggleDarkMode() {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', newValue)
  }

 

  // GİRİŞ YAPILMAMIŞSA sadece Login component'ini göster, gerisi hiç render edilmesin
  useEffect(() => {
  if (darkMode) {
    document.body.classList.add('dark-mode')
    document.documentElement.classList.add('dark-mode') 
  } else {
    document.body.classList.remove('dark-mode')
    document.documentElement.classList.remove('dark-mode') 
  }
}, [darkMode])
  
  useEffect(() => {
  function handleKeyDown(e) {
    // "/" tuşu: arama kutusuna odaklan (ama zaten bir input'a yazıyorsak devreye girmesin)
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault() // tarayıcının kendi "sayfada bul" özelliğini açmasını engelle
      searchInputRef.current?.focus()
    }
    // Esc tuşu: açık olan öneri modalını kapat
    if (e.key === 'Escape') {
      setSuggestedItem(null)
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  // component kaldırıldığında dinleyiciyi temizle (hafıza sızıntısı olmasın diye)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])


  if (!isLoggedIn) {
    return (
    <Login 
      onLoginSuccess={() => {
        setIsLoggedIn(true)
        setShowSplash(true)
      }}
     />
    )
  }

  if (showSplash) {
    return <LoginSplash />
  }

let filteredItems = items
if (currentView === 'favorites') {
  filteredItems = items.filter(item => item.isFavorite)
} else if (currentView !== 'all' && currentView !== 'profile') {
  filteredItems = items.filter(item => item.type === currentView)
}

// Arama filtresi başlıkta arama kelimesi geçenleri bul
if (searchQuery.trim() !== '') {
  filteredItems = filteredItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  )
}

// Sıralama
filteredItems =[...filteredItems].sort((a, b) => {
  if (sortBy === 'rating') {
    return (b.rating || 0) - (a.rating || 0) // yüksek puandan düşük puana sıralama
  }
  if (sortBy === 'alpha') {
    return a.title.localeCompare(b.title, 'tr') // türkçe alf sıralama
  }
  if (sortBy === 'type') {
    return a.type.localeCompare(b.type, 'tr') // türüne göre sıralama
  }
  if (sortBy === 'manual') {
    return a.sortOrder - b.sortOrder // manuel sıralama
  }
  return b.id - a.id // 'newest' varsayılan en yeni en üstte
})

const searchActive = searchQuery.trim() !== ''

function getPageTitle() {
  if (currentView === 'Kitap') return '📚 Kitaplar'
  if (currentView === 'Dizi') return '📺 Diziler'
  if (currentView === 'Film') return '🎬 Filmler'
  if (currentView === 'Belgesel') return '🎥 Belgeseller'
  if (currentView === 'Animasyon') return '🎨 Animasyonlar'
  if (currentView === 'Anime') return '🎌 Animeler'
  if (currentView === 'favorites') return '❤️ Favorilerim'

  return '🎬📚 Koleksiyonum'
}

  return (
      <div className={`app-container ${darkMode ? 'dark-mode' : ''} ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Hamburger buton: CSS ile sadece dar ekranlarda görünüyor */}
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Karartma katmanı: menü açıkken boşluğa tıklayınca menü kapansın */}
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar 
        currentView={currentView} 
        onViewChange={handleViewChange}
        onLogout={handleLogout} 
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      <main className="main-content">
          <button onClick={toggleDarkMode} className="dark-mode-icon-btn">
            {darkMode ? '☀️' : '🌙'}
          </button>

        {currentView === 'profile' ? (
          <Profile />
        ) : currentView === 'stats' ? (
          <Stats items={items} darkMode={darkMode} />
        ) : currentView === 'izlemeListem' ? (
          <Watchlist category="İzleme" pageTitle="🎬 İzleme Listem" defaultType="Dizi" />
        ) : currentView === 'okumaListem' ? (
          <Watchlist category="Okuma" pageTitle="📚 Okuma Listem" defaultType="Kitap" />
        ) : currentView === 'customLists' ? (
          <CustomLists/>
        ) : (
          <>
            <h1>{getPageTitle()}</h1>
            <p>Kitap, Dizi, Film, Belgesel, Animasyon ve Anime takibini buradan yapabilirsin.</p>

            <div className="list-controls">
              <input
                id="item-search"
                name="search"
                ref={searchInputRef}
                type="text"
                placeholder="🔍 Başlığa göre ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="newest">En Yeni</option>
                <option value="rating">Puana Göre</option>
                <option value="alpha">Alfabetik</option>
                <option value="type">Türe Göre</option>
                <option value="manual">Manuel Sıralama</option>
              </select>

              <div className="view-toggle">
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  ▦
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  ☰
                </button>
              </div>
            </div>

            {currentView === 'all' && (
              <>
                <button className="suggest-btn" onClick={handleSuggest}>
                  🎲 Ne İzlesem / Okusam?
                </button>
            
              {suggestedItem && (
                <SuggestionModal
                  item={suggestedItem}
                  onReroll={handleSuggest}
                  onClose={() => setSuggestedItem(null)}
                />
              )}
                <button
                  className="toggle-add-form-btn"
                  onClick={() => setShowAddForm(!showAddForm)}
                >
                  {showAddForm ? '✕ Kapat' : '➕ Koleksiyona bir öğe daha ekle'}
                </button>

                {showAddForm && (
                  <AddItemForm
                    onItemAdded={() => {
                      fetchItems()
                      setShowAddForm(false)
                    }}
                    currentView={currentView}
                  />
                )}
              </>
            )}

            {sortBy === 'manual' && searchActive && (
              <p className="manual-sort-warning">
                🔒 Manuel sıralama, arama kutusu boşken kullanılabilir.
              </p>
            )}

            {sortBy === 'manual' && !searchActive ? (
              <DraggableItemList
                items={filteredItems}
                onReorder={handleReorder}
                onDeleteRequest={handleDeleteRequest}
                onItemUpdated={fetchItems}
                viewMode={viewMode}
              />
            ) : (
              <div className={`item-list ${viewMode === 'list' ? 'list-view' : ''}`}>
                {filteredItems.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDeleteRequest={handleDeleteRequest}
                    onItemUpdated={fetchItems}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App