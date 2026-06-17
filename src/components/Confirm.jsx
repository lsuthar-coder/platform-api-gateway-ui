import { Modal } from './Modal'

export function Confirm({ open, onClose, onConfirm, title, message, loading, confirmLabel = 'Delete', variant = 'danger' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p className="text-sm text-gray-400 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-ghost" disabled={loading}>Cancel</button>
        <button onClick={onConfirm}
          className={variant === 'warning' ? 'btn-warning' : 'btn-danger'}
          disabled={loading}>
          {loading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
