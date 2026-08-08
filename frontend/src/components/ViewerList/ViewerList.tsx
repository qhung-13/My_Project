import { useEffect, useRef } from "react";
import { generateColor } from "../../utils/format";
import "./ViewerList.css";

interface Viewer {
  userId: string;
  username: string;
  avatar?: string | null;
  streamId: string;
}

const ViewerList = ({
  viewers,
  isOpen,
  onClose,
}: {
  viewers: Viewer[];
  isOpen: boolean;
  onClose: () => void;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="viewer-list" role="presentation">
      <button
        className="viewer-list__overlay"
        type="button"
        aria-label="Đóng danh sách người xem"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="viewer-list__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewer-list-title"
        tabIndex={-1}
      >
        <div className="viewer-list__header">
          <h3 id="viewer-list-title">Viewers ({viewers.length})</h3>
          <button type="button" aria-label="Đóng" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="viewer-list__body">
          {viewers.length === 0 ? (
            <p className="viewer-list__empty">Chưa có viewer nào</p>
          ) : (
            viewers.map((viewer) => (
              <div className="viewer-item" key={viewer.userId}>
                <div
                  className="viewer-item__avatar"
                  style={{ background: generateColor(viewer.username) }}
                  aria-hidden="true"
                >
                  {viewer.avatar ? (
                    <img src={viewer.avatar} alt="" />
                  ) : (
                    viewer.username.slice(0, 2).toUpperCase()
                  )}
                </div>
                <span className="viewer-item__name">{viewer.username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewerList;
