// Koleksiyonu CSV dosyası olarak indirmeyi sağlayan yardımcı fonksiyon

function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // içinde virgül, tırnak ya da satır sonu varsa tırnak içine al, iç tırnakları ikile
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportItemsToCsv(items) {
  const headers = [
    'Başlık', 'Tür', 'Durum', 'Puan', 'Kategori',
    'Favori', 'Başlangıç Tarihi', 'Bitiş Tarihi', 'Not'
  ]

  const rows = items.map(item => [
    item.title,
    item.type,
    item.status,
    item.rating ?? '',
    item.genre ?? '',
    item.isFavorite ? 'Evet' : 'Hayır',
    item.startDate ? item.startDate.split('T')[0] : '',
    item.endDate ? item.endDate.split('T')[0] : '',
    item.notes ?? ''
  ])

  // Excel'in Türkçe karakterleri doğru göstermesi için başa BOM ekliyoruz
  const BOM = '\uFEFF'
  const csvContent = BOM + [headers, ...rows]
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\r\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `koleksiyonum-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}