import { createContext, useContext, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './Toast.css'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // actionLabel/actionCallback: toast'ın içinde ekstra bir buton göstermek için (örn. "Geri Al")
  const showToast = useCallback((message, type = 'success', actionLabel = null, actionCallback = null) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, actionLabel, actionCallback }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000) // aksiyon butonlu toast'lar biraz daha uzun kalsın diye 3'ten 5 saniyeye çıkardık
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {createPortal(
        <div className="toast-container">
          {toasts.map(t => (
            <div key={t.id} className={`toast toast-${t.type}`}>
              <span>{t.type === 'success' ? '✅' : '⚠️'} {t.message}</span>
              {t.actionLabel && (
                <button
                  className="toast-action-btn"
                  onClick={() => {
                    t.actionCallback()
                    setToasts(prev => prev.filter(x => x.id !== t.id)) // aksiyona basınca toast hemen kapansın
                  }}
                >
                  {t.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}