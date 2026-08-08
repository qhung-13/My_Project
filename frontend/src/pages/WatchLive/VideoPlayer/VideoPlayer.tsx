import { useCallback, useEffect, useRef, useState } from "react";
import Hls, { type Level } from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

interface VideoPlayerProps {
  streamUrl?: string | null;
}

interface PlaybackError {
  streamUrl: string;
  message: string;
}

const MAX_NETWORK_RETRIES = 3;

const VideoPlayer = ({ streamUrl }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const hlsRef = useRef<Hls | null>(null);
  const playerRef = useRef<Plyr | null>(null);

  const retryTimerRef = useRef<number | null>(null);
  const networkRetryCountRef = useRef(0);

  /*
   * Error gắn với streamUrl.
   *
   * Nhờ vậy khi chuyển sang stream khác, error cũ tự động không được render,
   * không cần setPlaybackError(null) trong useEffect.
   *
   * Điều này cũng sửa warning:
   * "Calling setState synchronously within an effect..."
   */
  const [playbackError, setPlaybackError] = useState<PlaybackError | null>(
    null,
  );

  const currentPlaybackError = !streamUrl
    ? "Luồng phát chưa sẵn sàng."
    : playbackError?.streamUrl === streamUrl
      ? playbackError.message
      : null;

  /**
   * Destroy toàn bộ resources của player.
   */
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

  /**
   * Khởi tạo Plyr.
   *
   * availableQualities:
   * []                   -> native HLS
   * [1080, 720, 480]     -> Hls.js
   */
  const initPlyr = useCallback((availableQualities: number[]) => {
    const video = videoRef.current;

    if (!video) return;

    playerRef.current?.destroy();

    const qualityOptions = [
      0, // Auto
      ...new Set(availableQualities),
    ];

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

      settings: qualityOptions.length > 1 ? ["quality"] : [],

      quality: {
        default: 0,
        options: qualityOptions,
        forced: qualityOptions.length > 1,

        onChange: (quality: number) => {
          const hls = hlsRef.current;

          if (!hls) return;

          // Auto quality
          if (quality === 0) {
            hls.currentLevel = -1;
            return;
          }

          const targetLevel = hls.levels.findIndex(
            (level) => level.height === quality,
          );

          if (targetLevel >= 0) {
            hls.currentLevel = targetLevel;
          }
        },
      },

      i18n: {
        quality: "Chất lượng",
        auto: "Tự động",
      },
    });
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !streamUrl) {
      return;
    }

    networkRetryCountRef.current = 0;

    /*
     * Autoplay:
     * Browser thường chỉ cho autoplay nếu muted.
     */
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    /**
     * Debug lifecycle.
     *
     * Những log này rất hữu ích để kiểm tra màn hình đen.
     */
    const handleLoadedMetadata = () => {
      console.log("[VideoPlayer] metadata loaded", {
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };

    const handleCanPlay = () => {
      console.log("[VideoPlayer] canplay");
    };

    const handlePlaying = () => {
      console.log("[VideoPlayer] playing", {
        currentTime: video.currentTime,
        readyState: video.readyState,
        networkState: video.networkState,
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    const handleWaiting = () => {
      console.log("[VideoPlayer] waiting...");
    };

    const handleStalled = () => {
      console.warn("[VideoPlayer] stalled");
    };

    const handleVideoError = () => {
      console.error("[VideoPlayer] native video error", video.error);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("stalled", handleStalled);
    video.addEventListener("error", handleVideoError);

    /**
     * Không nuốt lỗi play() nữa.
     */
    const startPlayback = async () => {
      try {
        await video.play();

        console.log("[VideoPlayer] play() success");
      } catch (error) {
        /*
         * Không coi autoplay block là stream failure.
         * User vẫn có thể bấm Play trên Plyr.
         */
        console.warn("[VideoPlayer] autoplay blocked/failed:", error);
      }
    };

    /*
     * =========================================================
     * 1. ƯU TIÊN HLS.JS
     * =========================================================
     *
     * Đây là thay đổi quan trọng.
     *
     * Code cũ:
     *
     * native HLS
     *   ↓
     * Hls.js
     *
     * Code mới:
     *
     * Hls.js
     *   ↓
     * native HLS fallback
     *
     * Chrome / Edge / Firefox nên dùng Hls.js.
     */
    if (Hls.isSupported()) {
      console.log("[VideoPlayer] Using Hls.js:", streamUrl);

      const hls = new Hls({
        enableWorker: true,

        /*
         * Stream hiện tại của bạn là HLS thường:
         *
         * .m3u8
         * index123.ts
         * index124.ts
         *
         * không phải LL-HLS.
         */
        lowLatencyMode: false,

        backBufferLength: 30,

        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 6,
      });

      hlsRef.current = hls;

      hls.attachMedia(video);

      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log("[VideoPlayer] HLS media attached");

        hls.loadSource(streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_LOADING, () => {
        console.log("[VideoPlayer] Loading manifest:", streamUrl);
      });

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log("[VideoPlayer] Manifest parsed:", {
          levels: data.levels.length,
        });

        networkRetryCountRef.current = 0;

        const availableQualities = data.levels
          .map((level: Level) => level.height)
          .filter(
            (height): height is number => Number.isFinite(height) && height > 0,
          )
          .sort((a, b) => b - a);

        console.log("[VideoPlayer] Available qualities:", availableQualities);

        initPlyr(availableQualities);

        void startPlayback();
      });

      hls.on(Hls.Events.LEVEL_LOADED, (_, data) => {
        console.log("[VideoPlayer] Level loaded:", {
          live: data.details.live,
          fragments: data.details.fragments.length,
        });
      });

      hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
        console.debug("[VideoPlayer] Fragment loaded:", data.frag.sn);
      });

      hls.on(Hls.Events.FRAG_BUFFERED, (_, data) => {
        console.debug("[VideoPlayer] Fragment buffered:", data.frag.sn);
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("[VideoPlayer] HLS error:", {
          type: data.type,
          details: data.details,
          fatal: data.fatal,
          error: data.error,
        });

        /*
         * Non-fatal error:
         * Hls.js có thể tự recover.
         */
        if (!data.fatal) {
          return;
        }

        /*
         * NETWORK ERROR
         */
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          if (networkRetryCountRef.current < MAX_NETWORK_RETRIES) {
            networkRetryCountRef.current += 1;

            const retryDelay = networkRetryCountRef.current * 1000;

            console.warn(
              `[VideoPlayer] Network retry ${networkRetryCountRef.current}/${MAX_NETWORK_RETRIES} after ${retryDelay}ms`,
            );

            retryTimerRef.current = window.setTimeout(() => {
              if (hlsRef.current === hls) {
                hls.startLoad();
              }
            }, retryDelay);

            return;
          }
        }

        /*
         * MEDIA ERROR
         */
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          console.warn("[VideoPlayer] Recovering media error...");

          hls.recoverMediaError();

          return;
        }

        /*
         * Fatal unrecoverable error.
         *
         * setState ở callback của external system -> OK.
         */
        setPlaybackError({
          streamUrl,
          message:
            "Không thể kết nối tới livestream. Stream có thể đang khởi động hoặc đã kết thúc.",
        });

        hls.destroy();

        if (hlsRef.current === hls) {
          hlsRef.current = null;
        }
      });

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);

        video.removeEventListener("canplay", handleCanPlay);

        video.removeEventListener("playing", handlePlaying);

        video.removeEventListener("waiting", handleWaiting);

        video.removeEventListener("stalled", handleStalled);

        video.removeEventListener("error", handleVideoError);

        cleanup();
      };
    }

    /*
     * =========================================================
     * 2. NATIVE HLS FALLBACK
     * =========================================================
     *
     * Chủ yếu dành cho Safari.
     */
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      console.log("[VideoPlayer] Using native HLS:", streamUrl);

      video.src = streamUrl;

      initPlyr([]);

      void startPlayback();

      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);

        video.removeEventListener("canplay", handleCanPlay);

        video.removeEventListener("playing", handlePlaying);

        video.removeEventListener("waiting", handleWaiting);

        video.removeEventListener("stalled", handleStalled);

        video.removeEventListener("error", handleVideoError);

        cleanup();
      };
    }

    /*
     * Browser không hỗ trợ HLS.
     *
     * Đây là callback async để tránh setState trực tiếp
     * trong effect body.
     */
    queueMicrotask(() => {
      setPlaybackError({
        streamUrl,
        message: "Trình duyệt này không hỗ trợ phát livestream HLS.",
      });
    });

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);

      video.removeEventListener("canplay", handleCanPlay);

      video.removeEventListener("playing", handlePlaying);

      video.removeEventListener("waiting", handleWaiting);

      video.removeEventListener("stalled", handleStalled);

      video.removeEventListener("error", handleVideoError);

      cleanup();
    };
  }, [streamUrl, initPlyr, cleanup]);

  return (
    <div className="live-player">
      <video
        ref={videoRef}
        className="live-player__video"
        aria-label="Trình phát livestream"
        playsInline
        autoPlay
        muted
        crossOrigin="anonymous"
      />

      {currentPlaybackError && (
        <div className="live-player__error" role="status" aria-live="polite">
          {currentPlaybackError}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
