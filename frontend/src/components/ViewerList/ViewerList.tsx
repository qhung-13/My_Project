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
  if (!isOpen) return null;

  return (
    <div className="viewer-list">
      <div className="viewer-list__overlay" onClick={onClose} />
      <div className="viewer-list__panel">
        <div className="viewer-list__header">
          <h3>👥 Viewers ({viewers.length})</h3>
          <button onClick={onClose}>✕</button>
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
                >
                  {viewer.avatar ? (
                    <img
                      src={viewer.avatar}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
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
