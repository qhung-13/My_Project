import type { Stream } from "../../../types/index";

interface ScheduleTabProps {
  scheduledStreams: Stream[] | undefined;
}

const ScheduleTab = ({ scheduledStreams }: ScheduleTabProps) => {
  if (!scheduledStreams || scheduledStreams.length === 0) {
    return (
      <div className="channel__empty">
        <span>📅</span>
        <p>Chưa có lịch stream nào</p>
      </div>
    );
  }

  return (
    <div className="channel__schedule">
      {scheduledStreams.map((stream) => (
        <div key={stream._id} className="channel__schedule-item">
          <div className="channel__schedule-time">
            📅{" "}
            {stream.scheduledAt
              ? new Date(stream.scheduledAt).toLocaleString("vi-VN")
              : ""}
          </div>
          <div className="channel__schedule-title">{stream.title}</div>
          <div className="channel__schedule-category">{stream.category}</div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleTab;
