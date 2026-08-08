import type { AdminStream } from "../../../types/index";
import { formatViewers } from "../../../utils/format";

interface StreamsTabProps {
  streams: AdminStream[] | undefined;
}

const safeDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
};

const StreamsTab = ({ streams }: StreamsTabProps) => (
  <section>
    <h2 className="admin__title">Streams ({streams?.length ?? 0})</h2>
    <div className="admin__table-wrap">
      <table className="admin__table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Streamer</th>
            <th>Category</th>
            <th>Viewers</th>
            <th>Status</th>
            <th>Started</th>
          </tr>
        </thead>
        <tbody>
          {streams?.map((stream) => (
            <tr key={stream._id}>
              <td>{stream.title}</td>
              <td>{stream.userId?.username || "Đã xóa"}</td>
              <td>{stream.category}</td>
              <td>{formatViewers(stream.viewers)}</td>
              <td>
                <span
                  className={`admin__status ${stream.isLive ? "admin__status--active" : "admin__status--banned"}`}
                >
                  {stream.isLive ? "LIVE" : "Ended"}
                </span>
              </td>
              <td>{safeDate(stream.createdAt)}</td>
            </tr>
          ))}
          {streams?.length === 0 && (
            <tr>
              <td colSpan={6} className="admin__empty">
                Không có stream.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
);

export default StreamsTab;
