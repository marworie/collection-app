// ============================================================
// BottomNav.jsx
// Sadece telefonda görünen, ekranın altına sabitlenmiş sekme çubuğu.
// En sık kullanılan sayfalara tek dokunuşla geçiş sağlar.
// Masaüstünde CSS ile gizleniyor (orada Sidebar var).
// ============================================================

import AvatarIcon from './AvatarIcon'

// Listelerim'in alt sayfaları: bunlardayken "Listelerim" sekmesi seçili görünsün
const LIST_VIEWS = ['customLists', 'izlemeListem', 'okumaListem']

// Ana sayfadaki tür filtreleri: bunlardayken "Ana Sayfa" sekmesi seçili görünsün
const HOME_VIEWS = ['all', 'Kitap', 'Dizi', 'Film', 'Belgesel', 'Animasyon', 'Anime']

const TABS = [
  { value: 'all', icon: '🏠', label: 'Ana Sayfa' },
  { value: 'favorites', icon: '❤️', label: 'Favoriler' },
  { value: 'customLists', icon: '🏷️', label: 'Listelerim' },
  { value: 'stats', icon: '📊', label: 'İstatistik' }
]

// currentView: şu an açık olan sayfa
// onViewChange: sekmeye dokunulunca sayfayı değiştirmek için
function BottomNav({ currentView, onViewChange }) {

  function isActive(value) {
    if (value === 'all') return HOME_VIEWS.includes(currentView)
    if (value === 'customLists') return LIST_VIEWS.includes(currentView)
    return currentView === value
  }

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <button
          key={tab.value}
          className={`bottom-nav-item ${isActive(tab.value) ? 'active' : ''}`}
          onClick={() => onViewChange(tab.value)}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </button>
      ))}

      {/* Profil sekmesi: ikon yerine kullanıcının avatarı */}
      <button
        className={`bottom-nav-item ${currentView === 'profile' ? 'active' : ''}`}
        onClick={() => onViewChange('profile')}
      >
        <span className="bottom-nav-avatar">
          <AvatarIcon avatarKey={localStorage.getItem('avatarKey')} size={24} />
        </span>
        <span className="bottom-nav-label">Profil</span>
      </button>
    </nav>
  )
}

export default BottomNav