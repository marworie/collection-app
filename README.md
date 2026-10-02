# 🎬📚 Koleksiyonum

![Testler](https://github.com/marworie/collection-app/actions/workflows/ci.yml/badge.svg)

Kitap, dizi, film, belgesel, animasyon ve anime takibini tek yerden yapabildiğin, renkli ve kişiselleştirilebilir bir koleksiyon takip uygulaması. React, ASP.NET Core Web API ve SQL Server ile geliştirdim.

🔗 **Canlı demo:** https://koleksiyonum-app.runasp.net

> Demo'da kendi hesabını oluşturup deneyebilirsin. API şu an JWT ile korunmuyor, bu yüzden gerçek ya da hassas bilgi girme. (Bkz. [Bilinen Sınırlamalar](#bilinen-sınırlamalar))

## Ekran Görüntüleri

| Ana sayfa | İstatistikler |
|---|---|
| ![Ana sayfa](docs/screenshots/anasayfa.png) | ![İstatistikler](docs/screenshots/istatistikler.png) |
| **Karanlık mod** | **Mobil görünüm** |
| ![Karanlık mod](docs/screenshots/karanlik-mod.png) | ![Mobil görünüm](docs/screenshots/mobil.png) |

## Özellikler

- **Hesap:** Kayıt ol / giriş yap, profil avatarı seçimi
- **Koleksiyon:** Kitap, Dizi, Film, Belgesel, Animasyon ve Anime ekle, düzenle, sil (silmede 5 saniyelik "Geri Al")
- **Detaylar:** Puan, yorum/not, kategori, başlangıç ve bitiş tarihi, favoriler, tekrar izleme/okuma sayacı
- **Görseller:** Kapak görseli ve büyütme (lightbox)
- **Otomatik bilgi:** Film ve diziler için TMDB, kitaplar için OpenLibrary'den bilgi getirme (istekler backend üzerinden yapılır, API anahtarı tarayıcıya çıkmaz)
- **Listeler:** İzleme listem, okuma listem ve kullanıcı tanımlı özel listeler (çoktan çoğa ilişki)
- **İstatistikler:** Özet kartları, aylık aktivite grafiği (Chart.js), tür dağılımı, zaman çizelgesi, yıllık hedefler ve ilerleme çubukları
- **Kullanım kolaylığı:** Sürükle-bırak ile manuel sıralama, arama, birden fazla sıralama seçeneği, ızgara/liste görünümü, "Ne İzlesem / Okusam?" rastgele öneri
- **Arayüz:** Karanlık mod, mobil uyumlu düzen (☰ menü), Lottie giriş animasyonu, konfeti efekti, klavye kısayolları (`/` aramaya odaklanır, `Esc` pencereyi kapatır)

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Frontend | React 19, Vite, Chart.js (react-chartjs-2), @hello-pangea/dnd, lottie-react, canvas-confetti |
| Backend | ASP.NET Core 8 Web API, Dapper, Microsoft.Data.SqlClient, Swagger (geliştirme ortamında) |
| Veritabanı | SQL Server |
| Harici API'ler | TMDB, OpenLibrary |
| Yayın | MonsterASP.NET (ücretsiz plan) |

## 🛠️ Teknik Detaylar

### Backend
- **ASP.NET Core 8 Web API** + **Dapper** + **SQL Server**
- **Repository pattern:** Bağlantı yönetimi ve Dapper yardımcı metotları ortak bir `BaseRepository` sınıfında toplandı, tüm repository'ler ondan türüyor
- **JWT kimlik doğrulama:** Her kullanıcı yalnızca kendi verisine erişebilir, kullanıcı kimliği her zaman token'dan okunur
- **DTO + doğrulama:** Data Annotations ve `IValidatableObject` ile kurallar (örn. bitiş tarihi başlangıçtan önce olamaz), geçersiz istekler otomatik 400 döner
- **Global hata yönetimi:** Tüm yakalanmamış hatalar tek bir middleware'de yakalanır, `ILogger` ile loglanır, canlıda iç hata detayları kullanıcıya gösterilmez
- **Güvenlik:** BCrypt ile şifre hash'leme, parametreli sorgular (SQL Injection koruması)

### Frontend
- **React (Vite)** + **Chart.js** (aylık aktivite, puan ve tür dağılımı grafikleri)
- Tüm istekler tek bir `apiFetch` fonksiyonundan geçer: token'ı otomatik ekler, sunucu ve doğrulama hatalarını kullanıcıya bildirim olarak gösterir

### Testler
- **xUnit** + **Moq** ile 20 birim testi
  - DTO doğrulama kuralları
  - `ItemsController`: veritabanı yerine sahte (mock) repository ile, doğru kullanıcıya göre işlem yapıldığının doğrulanması

```bash
dotnet test
```

## 📁 Proje Yapısı

```
CollectionApp/
├── CollectionApp/              # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Dtos/
│   ├── Middleware/
│   ├── Models/
│   └── Repositories/
├── CollectionApp.Tests/        # xUnit testleri
├── collection-app-frontend/    # React (Vite)
└── database/schema.sql
```

## Mimari

```
Tarayıcı ──► ASP.NET Core (tek uygulama)
             ├─ wwwroot ─► React derlemesi (statik dosyalar)
             └─ /api/*  ─► Controller ─► Repository (Dapper) ─► SQL Server
                              └─ /api/Search ─► TMDB / OpenLibrary
```

Geliştirme sırasında React `localhost:5173`'te çalışır ve Vite, `/api` isteklerini backend'e yönlendirir (proxy). Canlıda React'in derlenmiş hali backend'in `wwwroot` klasöründen sunulur. İstekler aynı adrese gittiği için CORS gerekmez.

## Klasör Yapısı

```
CollectionApp/
├─ CollectionApp/            # ASP.NET Core Web API (Controllers, Models, Repositories)
├─ collection-app-frontend/  # React uygulaması (Vite)
├─ database/schema.sql       # Tablo yapısı
└─ docs/screenshots/         # README görselleri
```

## Yerelde Çalıştırma

**Gereksinimler:** .NET 8 SDK, Node.js (güncel LTS), SQL Server (Express sürümü yeterli)

### 1) Veritabanı

`CollectionDB` adında bir veritabanı oluştur ve `database/schema.sql` dosyasını bu veritabanında çalıştır.

### 2) Backend

`CollectionApp/appsettings.json` içindeki `ConnectionStrings:CollectionDB` değerini kendi SQL Server'ına göre düzenle. TMDB anahtarını ([themoviedb.org](https://www.themoviedb.org/) üzerinden ücretsiz alınır) User Secrets'a ekle, koda ya da Git'e girmesin:

```bash
dotnet user-secrets set "TmdbApiKey" "<anahtarın>" --project CollectionApp
dotnet run --project CollectionApp --launch-profile https
```

Visual Studio'da F5 ile de çalışır. API `https://localhost:7133` adresinde açılır, Swagger arayüzü `/swagger` altındadır.

### 3) Frontend

```bash
cd collection-app-frontend
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır. Backend'in de çalışıyor olması gerekir.

## Yayınlama (özet)

```bash
cd collection-app-frontend
npm run build
robocopy dist ..\CollectionApp\wwwroot /MIR   # Windows
```

Ardından backend projesi Web Deploy ile yayınlanır. Canlıda gizli bilgiler ortam değişkenleri olarak tanımlanır:

- `ConnectionStrings__CollectionDB`
- `TmdbApiKey`

## Bilinen Sınırlamalar

- **API JWT ile korunmuyor.** Giriş şu an arayüz düzeyinde çalışıyor ve veriler kullanıcıya özel değil, tüm kullanıcılar aynı koleksiyonu görür.
- Ücretsiz hosting nedeniyle Let's Encrypt sertifikası 90 günde bir elle yenilenmelidir.
- Otomatik test bulunmuyor.
- JavaScript paketi tek dosya (yaklaşık 900 kB), sayfa bazlı kod bölme yapılmadı.

## Yol Haritası

- [ ] JWT ile kimlik doğrulama ve kullanıcıya özel veri
- [ ] Filtre paneli (tür, durum, puan, kategori)
- [ ] CSV/JSON dışa aktarma
- [ ] Birim testleri (xUnit) ve CI
- [ ] Sayfa bazlı kod bölme

## Geliştirici

[GitHub profilim](https://github.com/KULLANICI-ADIN)
