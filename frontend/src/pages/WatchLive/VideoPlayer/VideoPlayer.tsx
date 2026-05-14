import { useEffect, useRef } from "react";

const VideoPlayer = ({ streamKey }: { streamKey: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const url = `http://localhost:5000/live/${streamKey}/index.m3u8`;
    console.log("🔄 Loading fMP4 stream:", url);

    // Reset video
    video.pause();
    video.src = "";
    video.load();

    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const playVideo = () => {
      video
        .play()
        .then(() => console.log("✅ Playback started successfully"))
        .catch((err) => console.error("Play error:", err.name, err.message));
    };

    video.onloadedmetadata = playVideo;
    video.oncanplay = playVideo;
    video.oncanplaythrough = playVideo;

    video.onerror = () => {
      console.error("Video error:", video.error?.message);
    };

    // Fallback
    setTimeout(playVideo, 1500);

    return () => {
      video.pause();
      video.src = "";
      video.load();
    };
  }, [streamKey]);

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      muted
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
