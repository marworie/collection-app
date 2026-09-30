import { useState } from 'react'
import { useToast } from './ToastContext'

// onLoginSuccess: giriş başarılı olunca App'e "artık girişi yaptık" demek için
function Login({ onLoginSuccess }) {
  const showToast = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false) // giriş mi kayıt mı modundayız
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    // isRegisterMode'a göre farklı endpoint'e istek atıyoruz
    const endpoint = isRegisterMode ? 'register' : 'login'

    try {
      const response = await fetch(`/api/Auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password})
      })

      // Gövde boş gelirse (örn. bazı 401'ler) json() patlamasın
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        if (isRegisterMode) {
          setIsRegisterMode(false)
          showToast('Kayıt başarılı, şimdi giriş yapabilirsin!')
        } else {
          localStorage.setItem('loggedInUser', data.username)
          localStorage.setItem('token', data.token)
          localStorage.setItem('avatarKey', data.avatarKey || '')
          onLoginSuccess()
          showToast(`Hoş geldin, ${data.username}!`)
        }
      } else {
        // Doğrulama hatası (400) → errors içindeki ilk mesaj, diğer hatalar → message
        const firstError = data.errors ? Object.values(data.errors).flat()[0] : null
        showToast(firstError || data.message || 'Bir hata oluştu', 'error')
      }
    } catch {
      // Sunucuya hiç ulaşılamadı
      showToast('Sunucuya ulaşılamadı. Bağlantını kontrol et.', 'error')
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={handleSubmit} className="login-form">
        <img src="/logo-full.png" alt="Koleksiyonum" style={{width: 220, marginBottom: 16, alignSelf: 'center'}} />
        <h2>{isRegisterMode ? '📝 Kayıt Ol' : '🔐 Giriş Yap'}</h2>

        <input
          type="text"
          placeholder="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <div className="password-wrapper">
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
  >
            {showPassword ? '🙈' : '👁️'}
            </span>
        </div>
        
        <button type="submit">{isRegisterMode ? 'Kayıt Ol' : 'Giriş Yap'}</button>

        <p className="toggle-mode">
          {isRegisterMode ? 'Zaten hesabın var mı? ' : 'Hesabın yok mu? '}
          <span onClick={() => setIsRegisterMode(!isRegisterMode)}>
            {isRegisterMode ? 'Giriş yap' : 'Kayıt ol'}
          </span>
        </p>
      </form>
    </div>
  )
}

export default Login