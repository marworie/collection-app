import { useState } from 'react'
import { useToast } from './ToastContext'
import AvatarIcon, { AVATAR_OPTIONS } from './AvatarIcon'
import { apiFetch } from './api'

function Profile() {
  const currentUsername = localStorage.getItem('loggedInUser')
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

  async function handleSave(e) {
    e.preventDefault()

    const response = await apiFetch('/api/Auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentUsername: currentUsername,
        newUsername: newUsername || null,
        newPassword: newPassword || null,
        newAvatarKey: selectedAvatarKey
      })
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem('loggedInUser', data.username)
      localStorage.setItem('avatarKey', data.avatarKey)
      setCurrentAvatarKey(data.avatarKey)
      setIsEditing(false)
      setNewUsername('')
      setNewPassword('')
      showToast('Profil güncellendi!')
    } else {
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
          <p className="avatar-picker-label">Avatarını seç:</p>
          <div className="avatar-picker-grid">
            {AVATAR_OPTIONS.map(option => (
              <button
                type="button"
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
          />
          <input
            type="password"
            placeholder="Yeni Şifre (opsiyonel)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <button type="submit">💾 Kaydet</button>
          <button type="button" onClick={() => setIsEditing(false)}>❌ Vazgeç</button>
        </form>
      )}
    </div>
  )
}

export default Profile