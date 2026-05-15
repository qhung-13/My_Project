import { useEffect, useRef } from "react";
import Hls from "hls.js";

const VideoPlayer = ({ streamKey }: { streamKey: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log("MOUNT VIDEO PLAYER");

    return () => {
      console.log("UNMOUNT VIDEO PLAYER");
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const url = `http://localhost:5000/live/${streamKey}/index.m3u8`;
    console.log("🔄 Loading HLS stream:", url);

    let hls: Hls | null = null;

    // Safari native support
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(console.error);
      return;
    }

    // Chrome / Edge / Firefox
    if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: true,
        enableWorker: true,
        maxBufferLength: 10,
        maxMaxBufferLength: 20,
        fragLoadingMaxRetry: 6,
        manifestLoadingMaxRetry: 6,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(console.error);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);

        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            console.warn("Media error, trying to recover ...");
            hls!.recoverMediaError();
          } else {
            console.error("Fatal error, destroying HLS");
            hls?.destroy();
          }
        }
      });
    } else {
      console.error("HLS is not supported in this browser");
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [streamKey]);

  return (
    <video
      ref={videoRef}
      controls
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
