// Tüm API isteklerinin geçtiği tek nokta
// Amaç: her fetch çağrısına token eklemeyi burada bir kez
// yazıp tekrar tekrar yazmaktan kurtulmak

export function apiFetch(url, options = {}) {
    const token = localStorage.getItem('token')

    const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    return fetch(url, {...options, headers })
}