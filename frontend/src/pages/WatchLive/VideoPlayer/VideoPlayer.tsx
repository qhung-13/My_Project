import { useCallback, useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  streamUrl?: string | null;
}

const MAX_NETWORK_RETRIES = 3;

const VideoPlayer = ({ streamUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playerRef = useRef<Plyr | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const networkRetryCountRef = useRef(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const cleanup = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    hlsRef.current?.destroy();
    hlsRef.current = null;
    playerRef.current?.destroy();
    playerRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }, []);

  const initPlyr = useCallback((availableQualities: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    playerRef.current?.destroy();
    const qualityOptions = [0, ...new Set(availableQualities)].filter(
      (quality, index, values) => values.indexOf(quality) === index,
    );

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
      settings: ["quality"],
      quality: {
        default: 0,
        options: qualityOptions,
        forced: qualityOptions.length > 1,
        onChange: (quality: number) => {
          const hls = hlsRef.current;
          if (!hls) return;

          if (quality === 0) {
            hls.currentLevel = -1;
            return;
          }

          const targetLevel = hls.levels.findIndex(
            (level) => level.height === quality,
          );
          if (targetLevel >= 0) hls.currentLevel = targetLevel;
        },
      },
      i18n: {
        quality: "Chất lượng",
        auto: "Tự động",
      },
    });
  }, []);

  useEffect(() => {
    cleanup();
    setPlaybackError(null);
    networkRetryCountRef.current = 0;

    const video = videoRef.current;
    if (!video || !streamUrl) {
      setPlaybackError("Luồng phát chưa sẵn sàng.");
      return cleanup;
    }

    const startPlayback = () => {
      void video.play().catch(() => {
        // Autoplay can be blocked by browser policy; Plyr still lets the user start it.
      });
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      initPlyr([]);
      startPlayback();
      return cleanup;
    }

    if (!Hls.isSupported()) {
      setPlaybackError("Trình duyệt này không hỗ trợ phát livestream HLS.");
      return cleanup;
    }

    const hls = new Hls({
      lowLatencyMode: true,
      enableWorker: true,
      backBufferLength: 60,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 8,
    });

    hlsRef.current = hls;
    hls.attachMedia(video);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      hls.loadSource(streamUrl);
    });

    hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
      networkRetryCountRef.current = 0;
      const availableQualities = data.levels
        .map((level: Level) => level.height)
        .filter((height): height is number => Number.isFinite(height))
        .sort((a, b) => b - a);
      initPlyr(availableQualities);
      startPlayback();
    });

    hls.on(Hls.Events.ERROR, (_, data) => {
      if (!data.fatal) return;

      if (
        data.type === Hls.ErrorTypes.NETWORK_ERROR &&
        networkRetryCountRef.current < MAX_NETWORK_RETRIES
      ) {
        networkRetryCountRef.current += 1;
        retryTimerRef.current = window.setTimeout(() => {
          if (hlsRef.current === hls) hls.startLoad();
        }, networkRetryCountRef.current * 1_000);
        return;
      }

      if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        hls.recoverMediaError();
        return;
      }

      setPlaybackError(
        "Không thể kết nối tới livestream. Stream có thể đang khởi động hoặc đã kết thúc.",
      );
      hls.destroy();
      if (hlsRef.current === hls) hlsRef.current = null;
    });

    return cleanup;
  }, [streamUrl, initPlyr, cleanup]);

  return (
    <div className="live-player">
      <video
        ref={videoRef}
        className="live-player__video"
        aria-label="Trình phát livestream"
        playsInline
        muted
        controls={false}
      />
      {playbackError && (
        <div className="live-player__error" role="status" aria-live="polite">
          {playbackError}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
