import { useEffect, useRef, useCallback } from "react";
import Hls, { Level } from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  streamKey: string;
}

/**
 * React Video Player component for HLS live streaming
 * Supports native HLS (Safari) and HLS.js + Plyr for other browsers
 * Features: Auto quality switching, manual quality selection, error recovery
 */
const VideoPlayer = ({ streamKey }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerRef = useRef<Plyr | null>(null);

  // Cleanup function to properly destroy resources
  const cleanup = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  }, []);

  // Initialize Plyr with quality settings
  const initPlyr = useCallback((availableQualities: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    playerRef.current = new Plyr(video, {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "settings",
        "fullscreen",
      ],
      settings: ["quality", "speed"],
      quality: {
        default: 0, // 0 = Auto quality
        options: [0, ...availableQualities], // Include Auto + available qualities
        forced: true,
        onChange: (quality: number) => {
          const hls = hlsRef.current;
          if (!hls) return;

          if (quality === 0) {
            // Switch to Auto quality
            hls.currentLevel = -1;
            console.log("Switched to Auto quality");
          } else {
            // Find and switch to specific quality
            const targetLevel = hls.levels.findIndex(
              (level) => level.height === quality,
            );
            if (targetLevel !== -1) {
              hls.currentLevel = targetLevel;
              console.log(`Switched to ${quality}p quality`);
            }
          }
        },
      },
      i18n: {
        quality: "Quality",
        speed: "Speed",
        auto: "Auto",
      },
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const streamUrl = `http://localhost:5000/live/${streamKey}/index.m3u8`;

    // Handle native HLS support (Safari/iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      initPlyr([]);
      video.play().catch((error) => {
        console.error("Native HLS playback failed:", error);
      });
    }
    // Handle HLS.js for other browsers
    else if (Hls.isSupported()) {
      const hls = new Hls({
        lowLatencyMode: true, // Enable low latency for live streams
        enableWorker: true, // Use web worker for better performance
        backBufferLength: 90, // Keep 90 seconds of back buffer
      });

      hlsRef.current = hls;
      hls.attachMedia(video);

      // Load stream source after media attachment
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("🔗 HLS media attached");
        hls.loadSource(streamUrl);
      });

      // Initialize player once manifest is parsed
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("Live stream connected successfully!");

        // Extract available quality levels (sorted highest to lowest)
        const availableQualities = data.levels
          .map((level: Level) => level.height)
          .filter(Boolean) // Remove undefined heights
          .sort((a: number, b: number) => b - a);

        console.log(
          `📺 Available qualities: ${availableQualities.join(", ")}p`,
        );
        initPlyr(availableQualities);

        // Auto-start playback
        video.play().catch((error) => {
          console.error("❌ Auto-play failed:", error);
        });
      });

      // Comprehensive error handling with recovery
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (!data.fatal) return;

        console.error("❌ HLS Error:", data);

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            console.warn("Network error, retrying...");
            hls.startLoad();
            break;

          case Hls.ErrorTypes.MEDIA_ERROR:
            console.warn("Media error, recovering...");
            hls.recoverMediaError();
            break;

          default:
            console.error("Fatal error, destroying HLS instance");
            hls.destroy();
            hlsRef.current = null;
            break;
        }
      });

      // Handle stream level switching
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        console.log(
          `Switched to ${level?.height}p (${(level?.bitrate / 1000) | 0}kbps)`,
        );
      });
    }
    // Fallback for unsupported browsers
    else {
      console.error("HLS not supported and no native HLS support");
      video.src = streamUrl;
    }

    // Cleanup on unmount or streamKey change
    return () => {
      cleanup();
    };
  }, [streamKey, initPlyr, cleanup]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "black",
        position: "relative",
      }}
    >
      <video
        ref={videoRef}
        playsInline
        muted // Required for autoplay in most browsers
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        controls={false} // Plyr handles controls
      />
    </div>
  );
};

export default VideoPlayer;
