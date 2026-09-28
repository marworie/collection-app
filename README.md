# 🎬📚 Koleksiyonum

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
