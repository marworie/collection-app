// ============================================================
// Sidebar.jsx
// Soldaki menü: logo, profil kartı, sayfa bağlantıları ve çıkış butonu.
// Hangi sayfadaysak o menü öğesi "active" olarak vurgulanır.
// ============================================================

import AvatarIcon from './AvatarIcon'

// Listelerim'in "alt sayfaları": bunlardayken menüde Listelerim seçili görünsün
const CUSTOM_LIST_SUBVIEWS = ['izlemeListem', 'okumaListem']

function Sidebar({ currentView, onViewChange, onLogout, darkMode, onToggleDarkMode }) {
  // Menüdeki sayfalar (İzleme/Okuma Listem artık Listelerim sayfasının içinde)
  const menuItems = [
    { value: 'all', label: '🏠 Ana Sayfa' },
    { value: 'favorites', label: '❤️ Favorilerim' },
    { value: 'stats', label: '📊 İstatistiklerim' },
    { value: 'customLists', label: '🏷️ Listelerim' },
    { value: 'Kitap', label: '📚 Kitaplar' },
    { value: 'Dizi', label: '📺 Diziler' },
    { value: 'Film', label: '🎬 Filmler' },
    { value: 'Belgesel', label: '🎥 Belgeseller' },
    { value: 'Animasyon', label: '🎨 Animasyonlar' },
    { value: 'Anime', label: '🎌 Animeler' },
  ]

  // Bir menü öğesi şu an seçili mi?
  function isActive(value) {
    if (currentView === value) return true
    // İzleme/Okuma Listem açıkken de Listelerim vurgulansın
    return value === 'customLists' && CUSTOM_LIST_SUBVIEWS.includes(currentView)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo-icon.png" alt="Koleksiyonum" style={{ height: 50 }} />
      </div>

      {/* Profil kartı: tıklanınca profil sayfası açılır */}
      <button
        className={`sidebar-profile-card ${currentView === 'profile' ? 'active' : ''}`}
        onClick={() => onViewChange('profile')}
      >
        <AvatarIcon avatarKey={localStorage.getItem('avatarKey')} size={44} />
        <span className="sidebar-profile-name">
          {localStorage.getItem('loggedInUser')}
        </span>
      </button>

      {/* Sayfa bağlantıları */}
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.value}
            className={isActive(item.value) ? 'active' : ''}
            onClick={() => onViewChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={onLogout}>🚪 Çıkış Yap</button>
      </div>
    </aside>
  )
}

export default Sidebar