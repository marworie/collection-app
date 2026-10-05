// ============================================================
// Profile.jsx
// Profil sayfası: mevcut avatar ve kullanıcı adını gösterir;
// "Profilimi Düzenle" ile avatar, kullanıcı adı ve şifre değiştirilebilir.
// Telefonda yan menü olmadığı için "Çıkış Yap" butonu da burada.
// ============================================================

import { useState } from 'react'
import { useToast } from './ToastContext'
import AvatarIcon, { AVATAR_OPTIONS } from './AvatarIcon'
import { apiFetch } from './api'

// onLogout: çıkış yap butonu için (App'teki handleLogout)
function Profile({ onLogout }) {
  const showToast = useToast()

  const [isEditing, setIsEditing] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Şu an kayıtlı avatar; hiç seçilmemişse ilk seçeneği varsayılan gösteriyoruz
  const [currentAvatarKey, setCurrentAvatarKey] = useState(
    localStorage.getItem('avatarKey') || AVATAR_OPTIONS[0].key
  )
  // Düzenleme sırasında seçilen (henüz kaydedilmemiş) avatar
  const [selectedAvatarKey, setSelectedAvatarKey] = useState(currentAvatarKey)

  // Değişiklikleri kaydet (kullanıcı backend'de token'dan bulunuyor)
  async function handleSave(e) {
    e.preventDefault()

    const response = await apiFetch('/api/Auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newUsername: newUsername || null,  // boşsa "değiştirme" anlamında null gönder
        newPassword: newPassword || null,
        newAvatarKey: selectedAvatarKey
      })
    })

    // Gövde boş gelirse json() patlamasın
    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      // Yeni bilgileri hem localStorage'a hem ekrana yansıt
      localStorage.setItem('loggedInUser', data.username)
      localStorage.setItem('avatarKey', data.avatarKey)
      setCurrentAvatarKey(data.avatarKey)
      setIsEditing(false)
      setNewUsername('')
      setNewPassword('')
      showToast('Profil güncellendi!')
    } else if (!data.errors && response.status < 500) {
      // Doğrulama (errors) ve sunucu (500) hatalarını apiFetch zaten gösteriyor,
      // burada sadece "kullanıcı adı alınmış" gibi özel mesajları gösteriyoruz
      showToast(data.message || 'Bir hata oluştu', 'error')
    }
  }

  return (
    <div className="profile-page">
      <h2>👤 Profilim</h2>

      <div className="profile-avatar-display">
        <AvatarIcon avatarKey={currentAvatarKey} size={100} />
      </div>

      <p className="profile-username">{localStorage.getItem('loggedInUser')}</p>

      {!isEditing ? (
        <button onClick={() => setIsEditing(true)}>✏️ Profilimi Düzenle</button>
      ) : (
        <form onSubmit={handleSave} className="edit-profile-form">
          {/* Avatar seçici */}
          <p className="avatar-picker-label">Avatarını seç:</p>
          <div className="avatar-picker-grid">
            {AVATAR_OPTIONS.map(option => (
              <button
                type="button"  // formu göndermesin, sadece seçsin
                key={option.key}
                className={`avatar-picker-item ${selectedAvatarKey === option.key ? 'selected' : ''}`}
                onClick={() => setSelectedAvatarKey(option.key)}
                title={option.label}
              >
                <AvatarIcon avatarKey={option.key} size={56} />
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Yeni Kullanıcı Adı (opsiyonel)"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <input
            type="password"
            placeholder="Yeni Şifre (opsiyonel)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <button type="submit">💾 Kaydet</button>
          <button type="button" onClick={() => setIsEditing(false)}>❌ Vazgeç</button>
        </form>
      )}

      {/* Çıkış (masaüstünde Sidebar'da da var, telefonda sadece burada) */}
      <button className="profile-logout-btn" onClick={onLogout}>
        🚪 Çıkış Yap
      </button>
    </div>
  )
}

export default Profile