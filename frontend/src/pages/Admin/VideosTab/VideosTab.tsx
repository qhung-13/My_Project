import type { AdminVideo } from "../../../types/index";
import { formatViewers } from "../../../utils/format";

interface VideosTabProps {
  videos: AdminVideo[] | undefined;
  pendingAction: string | null;
  onDelete: (id: string) => Promise<void>;
}

const VideosTab = ({ videos, pendingAction, onDelete }: VideosTabProps) => (
  <section>
    <h2 className="admin__title">Videos ({videos?.length ?? 0})</h2>
    <div className="admin__table-wrap">
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
          {videos?.map((video) => {
            const isPending = pendingAction === `delete:${video._id}`;
            return (
              <tr key={video._id}>
                <td>{video.title}</td>
                <td>{video.userId?.username || "Đã xóa"}</td>
                <td>{video.category}</td>
                <td>{formatViewers(video.views)}</td>
                <td>
                  <span
                    className={`admin__status ${video.status === "public" ? "admin__status--active" : "admin__status--banned"}`}
                  >
                    {video.status}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin__btn admin__btn--danger"
                    onClick={() => void onDelete(video._id)}
                    disabled={isPending}
                  >
                    {isPending ? "Đang xóa..." : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
          {videos?.length === 0 && (
            <tr>
              <td colSpan={6} className="admin__empty">
                Không có video.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default VideosTab;
