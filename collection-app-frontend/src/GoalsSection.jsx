import { useState, useEffect } from 'react'
import { useToast } from './ToastContext'
import { apiFetch } from './api'

const TYPE_OPTIONS = ['Hepsi', 'Kitap', 'Dizi', 'Film', 'Belgesel', 'Animasyon', 'Anime']
const TYPE_ICONS = {
  Hepsi: '🎯', Kitap: '📚', Dizi: '📺', Film: '🎬',
  Belgesel: '🎥', Animasyon: '🎨', Anime: '🎌'
}

// items: koleksiyonun tamamı (ilerlemeyi bunlardan hesaplıyoruz)
function GoalsSection({ items }) {
  const showToast = useToast()
  const year = new Date().getFullYear() // içinde bulunduğumuz yıl

  const [goals, setGoals] = useState([])
  const [type, setType] = useState('Kitap')
  const [target, setTarget] = useState('')

  function fetchGoals() {
    apiFetch('/api/Goals')
      .then(res => res.json())
      .then(data => setGoals(data))
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  // Backend tüm yılların hedeflerini gönderiyor, biz sadece bu yılınkini gösteriyoruz
  const yearGoals = goals.filter(g => g.year === year)

  // Bir hedef için "şu ana kadar kaç tane tamamlandı" sayısı
  function countDone(goal) {
    return items.filter(item => {
      // Sadece TAMAMLANMIŞ öğeler sayılır: "Yarıda Bıraktım" hedefe katkı yapmaz
      const isCompleted = item.status === 'Bitti' || item.status === 'Okudum'
      if (!isCompleted || !item.endDate) return false

      const itemYear = new Date(item.endDate).getFullYear()
      const typeMatches = goal.type === 'Hepsi' || item.type === goal.type
      return itemYear === goal.year && typeMatches
    }).length
  }

  async function handleSave(e) {
    e.preventDefault()
    const targetNumber = Number(target)
    if (!targetNumber || targetNumber < 1) return

    const response = await apiFetch('/api/Goals', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, type, target: targetNumber })
    })

    if (response.ok) {
      setTarget('')
      fetchGoals()
      showToast(`🎯 ${year} hedefi kaydedildi!`)
    } else {
      showToast('Hedef kaydedilemedi', 'error')
    }
  }

  async function handleDelete(goal) {
    const response = await apiFetch(`/api/Goals/${goal.id}`, {
      method: 'DELETE'
    })

    if (response.ok) {
      fetchGoals()
      showToast('Hedef silindi')
    }
  }

  return (
    <div className="stats-section stats-wide">
      <h3>🎯 {year} Hedeflerim</h3>

      {yearGoals.length === 0 && (
        <p className="goal-empty">Henüz bir hedef koymadın. Aşağıdan ilk hedefini ekle!</p>
      )}

      {yearGoals.map(goal => {
        const done = countDone(goal)
        // Math.min(100, ...): hedefi aşsan bile çubuk %100'ün ötesine taşmasın
        const percent = Math.min(100, Math.round((done / goal.target) * 100))
        const reached = done >= goal.target

        return (
          <div key={goal.id} className="goal-row">
            <div className="goal-header">
              <span className="goal-name">
                {TYPE_ICONS[goal.type]} {goal.type === 'Hepsi' ? 'Tüm türler' : goal.type}
              </span>
              <span className="goal-count">
                {done} / {goal.target}{reached && ' 🎉'}
              </span>
              <button
                className="goal-delete-btn"
                onClick={() => handleDelete(goal)}
                title="Hedefi sil"
              >
                ✕
              </button>
            </div>
            <div className="goal-bar-track">
              {/* Hedefe ulaşılınca çubuk yeşile dönüyor (CSS'teki .reached) */}
              <div
                className={`goal-bar-fill ${reached ? 'reached' : ''}`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        )
      })}

      {/* Aynı türe tekrar hedef koyarsan, yeni hedef eskisinin yerine geçer */}
      <form onSubmit={handleSave} className="goal-form">
        <label className="goal-field">
          <span>Tür</span>
          <select id="goal-type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map(t => (
              <option key={t} value={t}>{t === 'Hepsi' ? 'Tüm türler' : t}</option>
            ))}
          </select>
        </label>

        <label className="goal-field">
          <span>Hedef sayısı</span>
          <input
            id="goal-target"
            name="target"
            type="number"
            min="1"
            max="1000"
            placeholder="örn. 20"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            required
          />
        </label>

        <button type="submit">Hedef Koy</button>
      </form>
    </div>
  )
}

export default GoalsSection