import { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayer = ({ streamKey }: { streamKey: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const url = `http://localhost:5000/live/${streamKey}/index.m3u8`;
    let hls: Hls | null = null;

    // Trình duyệt hỗ trợ HLS native (Safari)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(console.error);
    }
    // Các trình duyệt khác (Chrome, Edge, Firefox)
    else if (Hls.isSupported()) {
      hls = new Hls({
        debug: false, // Tạm tắt debug cho đỡ rác console
        lowLatencyMode: true,
      });

      // BƯỚC 1: Gắn video element vào HLS trước
      hls.attachMedia(video);

      // BƯỚC 2: Khi media đã gắn thành công, mới bắt đầu tải source
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("📺 Gắn media thành công, đang tải luồng HLS...");
        hls?.loadSource(url);
      });

      // BƯỚC 3: Khi phân tích xong file m3u8, bắt đầu chạy video
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("✅ Đã kết nối luồng Live, bắt đầu phát!");
        // Lưu ý: Browser bắt buộc video phải 'muted' mới cho phép tự động play
        video.play().catch(console.error);
      });

      // Xử lý lỗi trơn tru hơn để không vỡ app
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn(
                "⚠️ Lỗi mạng (Có thể stream chưa lên), đang thử lại...",
              );
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("⚠️ Lỗi khung hình media, đang khôi phục...");
              hls?.recoverMediaError();
              break;
            default:
              console.error("🚨 Lỗi nghiêm trọng, hủy HLS:", data);
              hls?.destroy();
              break;
          }
        }
      });
    }

    // Cleanup function: Dọn dẹp HLS khi component bị unmount
    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamKey]);

  return (
    <video
      ref={videoRef}
      controls
      muted // <-- RẤT QUAN TRỌNG: Nếu không có muted, Chrome sẽ chặn autoplay
      playsInline
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        background: "black",
      }}
    />
  );
};

export default VideoPlayer;
