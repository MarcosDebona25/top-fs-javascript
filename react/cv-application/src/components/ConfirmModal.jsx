import './ConfirmModal.css'

function ConfirmModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <p className="modal-message">
          Please submit your information first before downloading the PDF.
        </p>
        <button className="btn btn-primary modal-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}

export default ConfirmModal
