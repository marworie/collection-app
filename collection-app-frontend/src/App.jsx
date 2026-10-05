// ============================================================
// App.jsx
// Uygulamanın ana bileşeni. Giriş durumunu, karanlık modu, hangi sayfanın
// açık olduğunu (currentView) ve koleksiyon öğelerini yönetir.
// Sidebar'dan (masaüstü) ya da BottomNav'dan (telefon) seçilen sayfaya göre
// ilgili bileşeni gösterir; ana sayfada arama, filtreleme, sıralama ve öğe ekleme burada yapılır.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import Profile from './Profile'
import ItemCard from './ItemCard'
import AddItemForm from './AddItemForm'
import Login from './Login'
import Stats from './Stats'
import './App.css'
import Watchlist from './Watchlist'
import './Watchlist.css'
import DraggableItemList from './DraggableItemList'
import SuggestionModal from './SuggestionModal'
import { useToast } from './ToastContext'
import CustomLists from './CustomLists'
import LoginSplash from './LoginSplash'
import { apiFetch } from './api'
import FilterPanel from './FilterPanel'
import { exportItemsToCsv } from './exportUtils'

// Telefonda ana sayfanın üstünde görünen tür filtreleri (masaüstünde Sidebar'da var)
const TYPE_CHIPS = [
  { value: 'all', label: 'Tümü' },
  { value: 'Kitap', label: '📚 Kitap' },
  { value: 'Dizi', label: '📺 Dizi' },
  { value: 'Film', label: '🎬 Film' },
  { value: 'Belgesel', label: '🎥 Belgesel' },
  { value: 'Animasyon', label: '🎨 Animasyon' },
  { value: 'Anime', label: '🎌 Anime' }
]

function App() {
  const [items, setItems] = useState([])
  const [currentView, setCurrentView] = useState('all')
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  // isLoggedIn: sayfa ilk açıldığında localStorage'da kayıtlı kullanıcı var mı diye bakıyoruz
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem('loggedInUser') !== null
  )
  const [searchQuery, setSearchQuery] = useState('') // arama çubuğu
  const [sortBy, setSortBy] = useState('newest') // sıralama
  const [viewMode, setViewMode] = useState('grid') // görünüm
  const [showAddForm, setShowAddForm] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [suggestedItem, setSuggestedItem] = useState(null)
  const showToast = useToast()
  const pendingDeletes = useRef({}) // hangi id'nin silinmesi "bekletiliyor", zamanlayıcısını burada tutuyoruz
  const searchInputRef = useRef(null)
  const [showSplash, setShowSplash] = useState(false)
  const [filters, setFilters] = useState({ status: 'all', genre: 'all', minRating: 0 })

  function fetchItems() {
    apiFetch('/api/Items')
      // Hata gelirse listeyi bozma, boş liste kullan (toast'u apiFetch zaten gösteriyor)
      .then(response => response.ok ? response.json() : [])
      .then(data => setItems(data))
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

  // api.js'ten gelen hata olaylarını mevcut toast sistemiyle göster
  useEffect(() => {
    const handleApiError = (e) => showToast(e.detail, 'error')
    window.addEventListener('api-error', handleApiError)
    return () => window.removeEventListener('api-error', handleApiError)
  }, [showToast])

  useEffect(() => {
    if (showSplash) {
      // 2,5 saniye sonra karşılama ekranını kapat
      const timer = setTimeout(() => setShowSplash(false), 2500)
      // splash erken kapanırsa zamanlayıcıyı temizle, gereksiz çalışmasın
      return () => clearTimeout(timer)
    }
  }, [showSplash])

  // Giriş yapılınca öğeleri çek
  useEffect(() => {
    if (isLoggedIn) {
      fetchItems()
    }
  }, [isLoggedIn])

  function handleLogout() {
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setSidebarOpen(false)  // çıkış yapınca, tekrar girişte menü açık gelmesin
    setCurrentView('all')  // tekrar girişte ana sayfadan başlasın
  }

  // Bir sayfa seçilince hem sayfayı değiştir hem (açıksa) yan menüyü kapat.
  // Sidebar, BottomNav, tür etiketleri, Listelerim kartları ve geri butonları bunu kullanıyor.
  function handleViewChange(view) {
    setCurrentView(view)
    setSidebarOpen(false)
  }

  function toggleDarkMode() {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('darkMode', newValue)
  }

  // Karanlık mod sınıfını body ve html'e de ekle (sayfanın tamamı boyansın)
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode')
      document.documentElement.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
      document.documentElement.classList.remove('dark-mode')
    }
  }, [darkMode])

  // Klavye kısayolları
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

  // GİRİŞ YAPILMAMIŞSA sadece Login component'ini göster, gerisi hiç render edilmesin
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

  // ============ ANA SAYFA İÇİN FİLTRELEME VE SIRALAMA ============

  // Sayfaya göre: favoriler ya da belirli bir tür
  let filteredItems = items
  if (currentView === 'favorites') {
    filteredItems = items.filter(item => item.isFavorite)
  } else if (currentView !== 'all' && currentView !== 'profile') {
    filteredItems = items.filter(item => item.type === currentView)
  }

  // Arama filtresi: başlıkta arama kelimesi geçenleri bul
  if (searchQuery.trim() !== '') {
    filteredItems = filteredItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Filtre paneli
  if (filters.status === 'inProgress') {
    filteredItems = filteredItems.filter(i => i.status === 'İzliyorum' || i.status === 'Okuyorum')
  } else if (filters.status === 'done') {
    filteredItems = filteredItems.filter(i => i.status === 'Bitti' || i.status === 'Okudum')
  } else if (filters.status === 'dropped') {
    filteredItems = filteredItems.filter(i => i.status === 'Yarıda Bıraktım')
  }

  if (filters.genre !== 'all') {
    filteredItems = filteredItems.filter(i => i.genre === filters.genre)
  }

  if (filters.minRating > 0) {
    filteredItems = filteredItems.filter(i => (parseFloat(i.rating) || 0) >= filters.minRating)
  }

  // Sıralama
  filteredItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0) // yüksek puandan düşüğe
    }
    if (sortBy === 'alpha') {
      return a.title.localeCompare(b.title, 'tr') // Türkçe alfabetik
    }
    if (sortBy === 'type') {
      return a.type.localeCompare(b.type, 'tr') // türe göre
    }
    if (sortBy === 'manual') {
      return a.sortOrder - b.sortOrder // manuel sıralama
    }
    return b.id - a.id // 'newest' varsayılan: en yeni en üstte
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
      {/* Hamburger buton: telefonda CSS ile gizli (yerine BottomNav var) */}
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

        {/* currentView'a göre hangi sayfanın gösterileceği */}
        {currentView === 'profile' ? (
          <Profile onLogout={handleLogout} />
        ) : currentView === 'stats' ? (
          <Stats items={items} darkMode={darkMode} />
        ) : currentView === 'izlemeListem' ? (
          <Watchlist
            category="İzleme"
            pageTitle="📌 İzleme Listem"
            defaultType="Dizi"
            onItemAdded={fetchItems}
            onBack={() => handleViewChange('customLists')}
          />
        ) : currentView === 'okumaListem' ? (
          <Watchlist
            category="Okuma"
            pageTitle="📑 Okuma Listem"
            defaultType="Kitap"
            onItemAdded={fetchItems}
            onBack={() => handleViewChange('customLists')}
          />
        ) : currentView === 'customLists' ? (
          <CustomLists onOpenWatchlist={handleViewChange} />
        ) : (
          <>
            {/* ===== ANA SAYFA / TÜR SAYFALARI / FAVORİLER ===== */}
            <h1>{getPageTitle()}</h1>

            {/* Tür etiketleri (sadece telefonda, CSS ile). Favorilerde gösterme */}
            {currentView !== 'favorites' && (
              <div className="type-chips">
                {TYPE_CHIPS.map(chip => (
                  <button
                    key={chip.value}
                    className={`type-chip ${currentView === chip.value ? 'active' : ''}`}
                    onClick={() => handleViewChange(chip.value)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}

            <p>Kitap, Dizi, Film, Belgesel, Animasyon ve Anime takibini buradan yapabilirsin.</p>

            {/* Arama, sıralama ve görünüm (ızgara/liste) */}
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

            {/* Filtrele, CSV, Ne İzlesem, Ekle butonları */}
            <div className="action-buttons-row">
              <FilterPanel items={items} filters={filters} onChange={setFilters} />
              <button
                className="export-csv-btn"
                onClick={() => exportItemsToCsv(filteredItems)}
              >
                📥 CSV Olarak İndir
              </button>

              {currentView === 'all' && (
                <>
                  <button className="suggest-btn" onClick={handleSuggest}>
                    🎲 Ne İzlesem / Okusam?
                  </button>
                  <button
                    className="toggle-add-form-btn"
                    onClick={() => setShowAddForm(!showAddForm)}
                  >
                    {showAddForm ? '✕ Kapat' : '➕ Koleksiyona bir öğe daha ekle'}
                  </button>
                </>
              )}
            </div>

            {currentView === 'all' && suggestedItem && (
              <SuggestionModal
                item={suggestedItem}
                onReroll={handleSuggest}
                onClose={() => setSuggestedItem(null)}
              />
            )}

            {currentView === 'all' && showAddForm && (
              <AddItemForm
                onItemAdded={() => {
                  fetchItems()
                  setShowAddForm(false)
                }}
                currentView={currentView}
              />
            )}

            {sortBy === 'manual' && searchActive && (
              <p className="manual-sort-warning">
                🔒 Manuel sıralama, arama kutusu boşken kullanılabilir.
              </p>
            )}

            {/* Manuel sıralamada sürükle-bırak listesi, diğer durumlarda normal kartlar */}
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
            {filteredItems.length === 0 && (
              <p className="no-results">Bu filtrelere uyan bir öğe bulunamadı.</p>
            )}
          </>
        )}
      </main>

      {/* Telefonda alttaki sekme çubuğu (masaüstünde CSS ile gizli) */}
      <BottomNav
        currentView={currentView}
        onViewChange={handleViewChange}
      />
    </div>
  )
}

export default App