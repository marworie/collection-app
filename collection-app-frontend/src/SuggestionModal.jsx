import { createPortal } from 'react-dom'

// item: önerilen öğenin kendisi (title, coverImageUrl, type, genre, status)
// onReroll: "Tekrar Seç" butonuna basılınca yeni bir öneri getirmek için
// onClose: modalı kapatmak için
function SuggestionModal({ item, onReroll, onClose }) {
  return createPortal(
    // Karanlık arka plan (overlay) — dışına tıklayınca modal kapansın
    <div className="suggestion-overlay" onClick={onClose}>

      {/* stopPropagation: kutunun içine tıklayınca bu tıklama "dışarı sızıp"
          overlay'in onClose'unu tetiklemesin diye */}
      <div className="suggestion-box" onClick={(e) => e.stopPropagation()}>

        <button className="suggestion-close" onClick={onClose}>✕</button>

        <p className="suggestion-label">🎲 Bugün buna ne dersin?</p>

        {/* kapak görseli varsa göster, yoksa hiç bu satırı render etme */}
        {item.coverImageUrl && (
          <img src={item.coverImageUrl} alt={item.title} className="suggestion-image" />
        )}

        <h3 className="suggestion-title">{item.title}</h3>

        {/* tür, kategori (varsa) ve durumu tek satırda gösteriyoruz */}
        <div className="suggestion-meta">
          <span>{item.type}</span>
          {item.genre && <span> · {item.genre}</span>}
          <span> · {item.status}</span>
        </div>

        {/* aynı öneriyi beğenmezse, yeni bir rastgele seçim yapması için */}
        <button className="suggestion-reroll" onClick={onReroll}>
          🎲 Tekrar Seç
        </button>
      </div>
    </div>,
    document.body // portal: bu modalı hangi component çağırırsa çağırsın, hep body'nin en altına "ışınlanıyor"
  )
}

export default SuggestionModal