import { useEffect, useRef } from "react";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css"; 

const VideoPlayer = ({ streamKey }: { streamKey: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const url = `http://localhost:5000/live/${streamKey}/index.m3u8`;
    let hls: Hls | null = null;
    let player: Plyr | null = null;

    const initPlyr = (customQualityOptions: number[]) => {
      player = new Plyr(video, {
        controls: [
          "play-large", "play", "progress", "current-time", 
          "mute", "volume", "settings", "fullscreen"
        ],
        settings: ["quality", "speed"],
        quality: {
          default: 0, // 0 nghĩa là Auto
          options: [0, ...customQualityOptions],
          forced: true,
          onChange: (newQuality: number) => {
            if (hls) {
              if (newQuality === 0) {
                hls.currentLevel = -1; 
                console.log("Đã chuyển sang chế độ Auto");
              } else {
                const targetIndex = hls.levels.findIndex(
                  (level) => level.height === newQuality
                );
                if (targetIndex !== -1) {
                  hls.currentLevel = targetIndex;
                  console.log(`Đã chuyển chất lượng thủ công sang: ${newQuality}p`);
                }
              }
            }
          },
        },
        i18n: {
          quality: "Chất lượng",
          speed: "Tốc độ",
          auto: "Tự động",
        }
      });
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      player = new Plyr(video);
      video.play().catch(console.error);
    } 

    else if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: true,
      });

      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls?.loadSource(url);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("✅ Đã kết nối luồng Live!");
        
        const availableQualities = data.levels
          .map((level) => level.height)
          .sort((a, b) => b - a); 

        initPlyr(availableQualities);

        video.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Lỗi mạng, đang thử lại...");
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Lỗi khung hình media, đang khôi phục...");
              hls?.recoverMediaError();
              break;
            default:
              console.error("Lỗi nghiêm trọng, hủy HLS:", data);
              hls?.destroy();
              break;
          }
        }
      });
    }

    return () => {
      if (hls) hls.destroy();
      if (player) player.destroy();
    };
  }, [streamKey]);

  return (
    <div style={{ width: "100%", height: "100%", background: "black" }}>
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
};

export default VideoPlayer;