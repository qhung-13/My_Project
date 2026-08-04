interface AboutTabProps {
  bio?: string;
  followersCount?: number;
  followingCount?: number;
  vodCount: number;
  clipCount: number;
}

const AboutTab = ({
  bio,
  followersCount,
  followingCount,
  vodCount,
  clipCount,
}: AboutTabProps) => {
  return (
    <div className="channel__about">
      <div className="channel__about-section">
        <h3>Giới thiệu</h3>
        <p>{bio || "Streamer này chưa có mô tả."}</p>
      </div>
      <div className="channel__about-section">
        <h3>Thống kê</h3>
        <div className="channel__about-stats">
          <div>
            👥 <strong>{followersCount || 0}</strong> Followers
          </div>
          <div>
            👤 <strong>{followingCount || 0}</strong> Following
          </div>
          <div>
            📹 <strong>{vodCount}</strong> VODs
          </div>
          <div>
            🎬 <strong>{clipCount}</strong> Clips
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutTab;
