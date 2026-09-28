import { createPortal } from 'react-dom'

function ImageModal({ imageUrl, onClose}) {
    return createPortal(
    <div className="image-modal-overlay" onClick={onClose}>
        <button className="image-modal-close" onClick={onClose}>✕</button>
        <img
            src={imageUrl}
            alt="Büyütülmüş görsel"
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
        />
    </div>,
    document.body
  )
}

export default ImageModal