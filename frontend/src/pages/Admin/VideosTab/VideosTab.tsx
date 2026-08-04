import type { AdminVideo } from "../../../types/index";

interface VideosTabProps {
  videos: AdminVideo[] | undefined;
  onDelete: (id: string) => void;
}

const VideosTab = ({ videos, onDelete }: VideosTabProps) => {
  return (
    <div>
      <h2 className="admin__title">📹 Videos ({videos?.length || 0})</h2>
      <table className="admin__table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Uploader</th>
            <th>Category</th>
            <th>Views</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videos?.map((v: AdminVideo) => (
            <tr key={v._id}>
              <td>{v.title}</td>
              <td>{v.userId?.username}</td>
              <td>{v.category}</td>
              <td>{v.views}</td>
              <td>
                <span
                  className={`admin__status ${v.status === "public" ? "admin__status--active" : "admin__status--banned"}`}
                >
                  {v.status}
                </span>
              </td>
              <td>
                <button
                  className="admin__btn admin__btn--danger"
                  onClick={() => onDelete(v._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VideosTab;
