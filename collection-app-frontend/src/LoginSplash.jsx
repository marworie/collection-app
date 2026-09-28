import LottieImport from 'lottie-react'
import animationData from './assets/welcome.json' // json animasyonunu koda dahil ediyor
// Welcome karşılama ekranının kendisi

// Bazı Vite kurulumlarında default import, bileşenin kendisi yerine
// { default: Bileşen, ... } şeklinde bir "zarf" olarak geliyor.
// Bu satır ikisini de karşılıyor: zarf gelirse içindeki .default'u alıyor,
// doğrudan bileşen gelirse olduğu gibi kullanıyor.
const Lottie = LottieImport.default || LottieImport 

function LoginSplash() {
  // giriş yapan kullanıcının adını, karşılama mesajında göstermek için alıyoruz
  const username = localStorage.getItem('loggedInUser')

  return (
    <div className="splash-screen">
      {/* animationData: indirdiğimiz JSON dosyasının içeriği
          loop={false}: animasyon bir kez oynasın, sürekli tekrar etmesin */}
      <Lottie
        animationData={animationData}
        loop={false}
        style={{ width: 260, height: 260 }}
      />
      <p className="splash-text">Hoş geldin, {username}!</p>
    </div>
  )
}

export default LoginSplash