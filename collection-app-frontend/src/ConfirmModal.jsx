import { createPortal } from 'react-dom'

function ConfirmModal({ message, onConfirm, onCancel }) {
  return createPortal(
    <div className="confirm-overlay">
      <div className="confirm-box">
        <p className="confirm-message">{message}</p>
        <div className="confirm-buttons">
          <button className="confirm-btn-yes" onClick={onConfirm}>
            Evet, Sil
          </button>
          <button className="confirm-btn-no" onClick={onCancel}>
            Vazgeç
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmModal