import {
  Chart as ChartJS, ArcElement, BarElement,
  CategoryScale, LinearScale, Tooltip, Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const COLORS = ['#7b2ff7', '#f107a3', '#f59e0b', '#10b981', '#3b82f6', '#ef4444']

function getThemeColors(darkMode) {
  return {
    text: darkMode ? '#b0b0c0' : '#666',
    grid: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  }
}

// Puan dağılımı: kaç öğeye kaç yıldız verilmiş
export function RatingChart({ items, darkMode }) {
  const { text, grid } = getThemeColors(darkMode)

  const counts = {}
  items.forEach(item => {
    counts[item.rating] = (counts[item.rating] || 0) + 1
  })
  const ratings = Object.keys(counts).sort((a, b) => a - b)

  const data = {
    labels: ratings.map(r => `${r} ⭐`),
    datasets: [{
      label: 'Öğe sayısı',
      data: ratings.map(r => counts[r]),
      backgroundColor: '#7b2ff7',
      hoverBackgroundColor: '#f107a3',
      borderRadius: 6,
      maxBarThickness: 40,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: text }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: text, stepSize: 1 }, grid: { color: grid } },
    },
  }

  return <Bar data={data} options={options} />
}

// Tür dağılımı: halka grafik
export function CategoryChart({ items, darkMode }) {
  const { text } = getThemeColors(darkMode)

  const counts = {}
  items.forEach(item => {
    counts[item.type] = (counts[item.type] || 0) + 1
  })
  const types = Object.keys(counts)

  const data = {
    labels: types,
    datasets: [{
      data: types.map(t => counts[t]),
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: { legend: { position: 'bottom', labels: { color: text } } },
  }

  return <Doughnut data={data} options={options} />
}