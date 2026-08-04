import type { AdminStream } from "../../../types/index";

interface StreamsTabProps {
  streams: AdminStream[] | undefined;
}

const StreamsTab = ({ streams }: StreamsTabProps) => {
  return (
    <div>
      <h2 className="admin__title">🎥 Streams ({streams?.length || 0})</h2>
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
          {streams?.map((s: AdminStream) => (
            <tr key={s._id}>
              <td>{s.title}</td>
              <td>{s.userId?.username}</td>
              <td>{s.category}</td>
              <td>{s.viewers}</td>
              <td>
                <span
                  className={`admin__status ${s.isLive ? "admin__status--active" : "admin__status--banned"}`}
                >
                  {s.isLive ? "LIVE" : "Ended"}
                </span>
              </td>
              <td>{new Date(s.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StreamsTab;
