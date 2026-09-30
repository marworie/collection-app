// Tüm API isteklerinin geçtiği tek nokta:
// token ekleme ve hata bildirme burada bir kez yazılıyor

// Hata mesajını uygulamanın geri kalanına duyurur (ErrorToast dinliyor)
function notifyError(message) {
    window.dispatchEvent(new CustomEvent('api-error', { detail: message }))
}

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token')

    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    let response
    try {
        response = await fetch(url, { ...options, headers })
    } catch (err) {
        // Sunucuya hiç ulaşılamadı (backend kapalı, internet yok...)
        notifyError('Sunucuya ulaşılamadı. Bağlantını kontrol et.')
        throw err
    }

    // 500 ve üstü: sunucu tarafı hata → middleware'in gönderdiği mesajı göster
    if (response.status >= 500) {
        // clone(): gövdeyi burada okursak asıl çağıran tekrar okuyamaz, kopyasını okuyoruz
        const body = await response.clone().json().catch(() => null)
        notifyError(body?.message ?? 'Sunucuda bir hata oluştu.')
    }

    return response
}