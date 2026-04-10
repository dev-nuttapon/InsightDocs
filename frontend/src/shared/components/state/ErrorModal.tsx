type ErrorModalProps = {
  message: string | null;
  title?: string;
  onClose: () => void;
};

export function ErrorModal({ message, title = 'เกิดข้อผิดพลาด', onClose }: ErrorModalProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-labelledby="error-modal-title"
        aria-modal="true"
        className="modal-card stack"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stack stack--compact">
          <span className="sidebar__eyebrow">Error</span>
          <h3 id="error-modal-title">{title}</h3>
          <p className="muted">{message}</p>
        </div>
        <div className="actions actions--compact">
          <button className="button button--danger" type="button" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
