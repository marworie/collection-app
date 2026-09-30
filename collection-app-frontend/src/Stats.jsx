import { useState } from 'react'
import GoalsSection from './GoalsSection'
import { Bar } from 'react-chartjs-2'
import { RatingChart, CategoryChart } from './StatsCharts'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
} from 'chart.js'

// Chart.js modüler çalışıyor: sadece kullandığımız parçaları kaydediyoruz,
// böylece kullanılmayan kısımlar uygulamaya yüklenmiyor (dosya boyutu küçük kalıyor)
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

// items: App.jsx'ten gelen tüm koleksiyon öğeleri
// darkMode: grafiğin renklerini karanlık/açık moda göre ayarlamak için
function Stats({ items, darkMode }) {

  // Aylık grafikte hangi yılın gösterileceği ('all' = tüm yıllar)
  // Hook'lar her zaman en üstte, erken return'den önce olmalı
  const [chartYear, setChartYear] = useState('all')

  // ============ TEMEL VERİLER ============

  // Sadece bitirme tarihi girilmiş öğeler (istatistiklerin çoğu bunlar üzerinden hesaplanıyor)
  const finishedItems = items.filter(item => item.endDate)

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ]

  const typeIcons = {
    Kitap: '📚', Anime: '🎌', Dizi: '📺', Film: '🎬',
    Belgesel: '🎥', Animasyon: '🎨'
  }

  // Her tür için doğru fiil: kitap "okunur", diğerleri "izlenir"
  function getVerb(type) {
    if (type === 'Kitap') return 'okudun'
    return 'izledin'
  }

  const ratedItems = finishedItems.filter(item => item.rating)

  // Tür sayaçları, örn: { Kitap: 6, Anime: 3, Dizi: 3 }
  const typeCounts = {}
  finishedItems.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1
  })
  const totalFinished = finishedItems.length

  // ============ ÖZET KUTULARI (KPI) İÇİN HESAPLAMALAR ============

  // Ortalama puan: puanı olan TÜM öğelerin (devam edenler dahil) ortalaması
  const allRatedItems = items.filter(item => item.rating)

  // Puanlı öğe yoksa 0'a bölme yapıp "NaN" göstermesin diye tire yazdırıyoruz
  const averageRating = allRatedItems.length > 0
    ? (allRatedItems.reduce((sum, item) => sum + parseFloat(item.rating), 0) / allRatedItems.length).toFixed(1)
    : '–'

  const favoriteCount = items.filter(item => item.isFavorite).length

  // Tüm öğelerdeki "Tekrar İzledim/Okudum" sayaçlarının toplamı
  const totalRewatches = items.reduce((sum, item) => sum + (item.rewatchCount || 0), 0)

  // ============ TÜR DAĞILIMI ============

  const typeDistribution = Object.keys(typeCounts).map(type => ({
    type,
    count: typeCounts[type],
    percentage: Math.round((typeCounts[type] / totalFinished) * 100)
  })).sort((a, b) => b.count - a.count)

  // ============ ÖNE ÇIKANLAR ============

  const highestRated = ratedItems.length > 0
    ? ratedItems.reduce((max, item) => item.rating > max.rating ? item : max, ratedItems[0])
    : null

  const itemsWithNotes = finishedItems.filter(item => item.notes)
  const longestNote = itemsWithNotes.length > 0
    ? itemsWithNotes.reduce((longest, item) =>
        item.notes.length > longest.notes.length ? item : longest
      )
    : null

  // ============ YIL → AY → ÖĞELER GRUPLAMASI ============

  // Sonuç: { 2026: { Eylül: [öğe, öğe], Ağustos: [öğe] }, 2021: {...} }
  const grouped = {}
  finishedItems.forEach(item => {
    const date = new Date(item.endDate)
    const year = date.getFullYear()
    const month = monthNames[date.getMonth()]

    if (!grouped[year]) grouped[year] = {}
    if (!grouped[year][month]) grouped[year][month] = []
    grouped[year][month].push(item)
  })

  // Yıllar yeniden eskiye sıralı
  const years = Object.keys(grouped).sort((a, b) => b - a)

  // "2026 yılında 3 anime izledin, 6 kitap okudun ve ..." cümlesini üretir
  function getYearSummary(year) {
    const allItemsInYear = Object.values(grouped[year]).flat()

    const counts = {}
    allItemsInYear.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1
    })

    const parts = Object.keys(counts).map(type =>
      `${counts[type]} ${type.toLowerCase()} ${getVerb(type)}`
    )

    if (parts.length === 1) {
      return `${year} yılında ${parts[0]}!`
    }
    const lastPart = parts[parts.length - 1]
    const otherParts = parts.slice(0, -1).join(', ')
    return `${year} yılında ${otherParts} ve ${lastPart}!`
  }

  // ============ AYLIK AKTİVİTE GRAFİĞİ İÇİN VERİ ============

  const chartEntries = []
  Object.keys(grouped).forEach(year => {
    Object.keys(grouped[year]).forEach(month => {
      chartEntries.push({
        year: parseInt(year),
        monthIndex: monthNames.indexOf(month),
        month,
        count: grouped[year][month].length
      })
    })
  })
  chartEntries.sort((a, b) => a.year - b.year || a.monthIndex - b.monthIndex)

  // Seçilen yıla göre süz
  const visibleEntries = chartYear === 'all'
    ? chartEntries
    : chartEntries.filter(e => e.year === Number(chartYear))

  const chartData = {
    // Tek yıl seçiliyse etikette yıl tekrar etmesin: "Eyl" yeterli
    labels: visibleEntries.map(e =>
      chartYear === 'all' ? `${e.month.slice(0, 3)} ${e.year}` : e.month.slice(0, 3)
    ),
    datasets: [
      {
        label: 'Bitirilen öğe sayısı',
        data: visibleEntries.map(e => e.count),
        backgroundColor: '#7b2ff7',
        hoverBackgroundColor: '#f107a3',
        borderRadius: 6,
        maxBarThickness: 40
      }
    ]
  }

  const gridColor = darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = darkMode ? '#b0b0c0' : '#666'

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: darkMode ? '#26263f' : '#fff',
        titleColor: darkMode ? '#f0e6fc' : '#333',
        bodyColor: darkMode ? '#e0e0f0' : '#333',
        borderColor: '#7b2ff7',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: textColor, font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        beginAtZero: true,
        ticks: { color: textColor, stepSize: 1 },
        grid: { color: gridColor }
      }
    }
  }

  // ============ BOŞ DURUM ============

  if (totalFinished === 0) {
    return (
      <div className="stats-page">
        <h2>📊 İstatistiklerim</h2>
        <p>Henüz bitirme tarihi girilmiş bir öğe yok.</p>
      </div>
    )
  }

  // ============ EKRAN ============

  return (
    <div className="stats-page">
      <h2>📊 İstatistiklerim</h2>

      <div className="stats-grid">

        {/* ÖZET KUTULARI */}
        <div className="stats-kpi-row stats-wide">
          <div className="kpi-card">
            <span className="kpi-icon">✅</span>
            <span className="kpi-value">{totalFinished}</span>
            <span className="kpi-label">Bitirilen</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon">⭐</span>
            <span className="kpi-value">{averageRating}</span>
            <span className="kpi-label">Ortalama Puan</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon">❤️</span>
            <span className="kpi-value">{favoriteCount}</span>
            <span className="kpi-label">Favori</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-icon">🔁</span>
            <span className="kpi-value">{totalRewatches}</span>
            <span className="kpi-label">Tekrar</span>
          </div>
        </div>

        <GoalsSection items={items} />

        {/* YIL ÖZET CÜMLELERİ */}
        <div className="stats-section stats-wide">
          {years.map(year => (
            <p key={year} className="year-summary-sentence">
              {getYearSummary(year)}
            </p>
          ))}
        </div>

        {/* AYLIK AKTİVİTE GRAFİĞİ + YIL FİLTRESİ */}
        <div className="stats-section stats-wide">
          <div className="stats-section-header">
            <h3>📈 Aylık Aktivite</h3>
            <select
              className="year-select"
              value={chartYear}
              onChange={(e) => setChartYear(e.target.value)}
            >
              <option value="all">Tüm yıllar</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="stats-chart-wrap">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* PUAN DAĞILIMI (yarım genişlik) */}
        <div className="stats-section">
          <h3>⭐ Puan Dağılımı</h3>
          <div className="stats-chart-wrap">
            <RatingChart items={allRatedItems} darkMode={darkMode} />
          </div>
        </div>

        {/* TÜR DAĞILIMI HALKA (yarım genişlik) */}
        <div className="stats-section">
          <h3>🍩 Tür Dağılımı</h3>
          <div className="stats-chart-wrap">
            <CategoryChart items={finishedItems} darkMode={darkMode} />
          </div>
        </div>

        {/* TÜR DAĞILIMI ÇUBUKLAR (yarım genişlik) */}
        <div className="stats-section">
          <h3>📊 Tür Yüzdeleri</h3>
          {typeDistribution.map(t => (
            <div key={t.type} className="distribution-row">
              <span className="distribution-label">{typeIcons[t.type]} {t.type}</span>
              <div className="distribution-bar-track">
                <div
                  className="distribution-bar-fill"
                  style={{ width: `${t.percentage}%` }}
                ></div>
              </div>
              <span className="distribution-count">{t.count} ({t.percentage}%)</span>
            </div>
          ))}
        </div>

        {/* ÖNE ÇIKANLAR (yarım genişlik) */}
        <div className="stats-section">
          <h3>🏆 Öne Çıkanlar</h3>
          <div className="highlights">
            {highestRated && (
              <div className="highlight-card">
                <span className="highlight-title">En Yüksek Puan</span>
                <span className="highlight-value">
                  {typeIcons[highestRated.type]} {highestRated.title} — {'⭐'.repeat(highestRated.rating)}
                </span>
              </div>
            )}
            {longestNote && (
              <div className="highlight-card">
                <span className="highlight-title">En Uzun Yorum</span>
                <span className="highlight-value">
                  {typeIcons[longestNote.type]} {longestNote.title} — "{longestNote.notes}"
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ZAMAN ÇİZELGESİ */}
        <div className="stats-section stats-wide">
          <h3>🗓️ Zaman Çizelgesi</h3>
          {years.map(year => (
            <div key={year} className="stats-year">
              <h3 className="year-title">{year}</h3>
              <div className="stats-months-grid">
                {Object.keys(grouped[year]).map(month => (
                  <div key={month} className="stats-month">
                    <h4>{month} — {grouped[year][month].length} öğe</h4>
                    <div className="month-items">
                      {grouped[year][month].map(item => (
                        <span key={item.id} className="month-item-chip">
                          {typeIcons[item.type]} {item.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

export default Stats