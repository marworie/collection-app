import AvatarIcon from './AvatarIcon'

function Sidebar({ currentView, onViewChange, onLogout, darkMode, onToggleDarkMode }) {
  const menuItems = [
    { value: 'all', label: '🏠 Ana Sayfa' },
    { value: 'favorites', label: '❤️ Favorilerim'},
    { value: 'stats', label: '📊 İstatistiklerim'},
    { value: 'izlemeListem', label: '📌 İzleme Listem' },
    { value: 'okumaListem', label: '📑 Okuma Listem' },
    { value: 'customLists', label: '🏷️ Listelerim'},
    { value: 'Kitap', label: '📚 Kitaplar' },
    { value: 'Dizi', label: '📺 Diziler' },
    { value: 'Film', label: '🎬 Filmler' },
    { value: 'Belgesel', label:'🎥 Belgeseller'},
    { value: 'Animasyon', label:'🎨 Animasyonlar'},
    { value: 'Anime', label: '🎌 Animeler' },
  ]

  return ( 
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/logo-icon.png" alt="Koleksiyonum" style={{height: 50}} />
      </div>

      <button
        className={`sidebar-profile-card ${currentView === 'profile' ? 'active' : ''}`}
        onClick={() => onViewChange('profile')}
      >
        <AvatarIcon avatarKey={localStorage.getItem('avatarKey')} size={44} />
        <span className="sidebar-profile-name">
          {localStorage.getItem('loggedInUser')}
        </span>
      </button>

      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <button
            key={item.value}
            className={currentView === item.value ? 'active' : ''}
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
