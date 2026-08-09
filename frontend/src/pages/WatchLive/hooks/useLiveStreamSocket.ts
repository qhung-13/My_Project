import { useEffect, useState } from "react";
import socket from "../../../utils/socket";
import type {
  ChatMessage,
  DonationAlert,
  ReactionParticle,
  Viewer,
} from "../../../types/index";

const MAX_CHAT_MESSAGES = 300;
const MAX_VISIBLE_REACTIONS = 40;
const MAX_DONATION_ALERTS = 5;
const VIEWER_HEARTBEAT_MS = 45_000;

interface AuthUserLike {
  _id?: string;
  username?: string;
  avatar?: string | null;
}

interface UseLiveStreamSocketResult {
  messages: ChatMessage[];
  viewerCount: number;
  viewers: Viewer[];
  donationAlerts: DonationAlert[];
  reactions: ReactionParticle[];
  isBlocked: boolean;
  blockMessage: string;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
}

const randomBetween = (min: number, max: number) =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

/** Owns the realtime lifecycle for one stream room. */
export function useLiveStreamSocket(
  streamId: string | undefined,
  authUser: AuthUserLike | null | undefined,
): UseLiveStreamSocketResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [donationAlerts, setDonationAlerts] = useState<DonationAlert[]>([]);
  const [reactions, setReactions] = useState<ReactionParticle[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState("");

  useEffect(() => {
    if (!streamId) return undefined;

    const timers = new Set<ReturnType<typeof setTimeout>>();
    const schedule = (callback: () => void, delay: number) => {
      const timer = setTimeout(() => {
        timers.delete(timer);
        callback();
      }, delay);
      timers.add(timer);
    };

    const onChatMessage = (data: ChatMessage) => {
      setMessages((previous) => [...previous, data].slice(-MAX_CHAT_MESSAGES));
    };

    const onViewerCount = (count: number) => {
      setViewerCount(Number.isFinite(count) && count >= 0 ? count : 0);
    };

    const onDonation = (data: DonationAlert) => {
      setDonationAlerts((previous) =>
        [...previous, data].slice(-MAX_DONATION_ALERTS),
      );
      schedule(() => {
        setDonationAlerts((previous) =>
          previous.filter((alert) => alert.id !== data.id),
        );
      }, 5_000);
    };

    const onViewerList = (data: Viewer[]) => {
      setViewers(Array.isArray(data) ? data : []);
    };

    const onReaction = ({
      reaction,
      userId,
    }: {
      reaction: string;
      userId: string;
    }) => {
      const reactionId = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const particle: ReactionParticle = {
        id: reactionId,
        emoji: reaction,
        x: randomBetween(8, 88),
        driftA: randomBetween(10, 42) * direction,
        driftB: randomBetween(18, 70) * -direction,
        driftC: randomBetween(30, 95) * direction,
        rotateA: randomBetween(-18, 18),
        rotateB: randomBetween(-30, 30),
        rotateC: randomBetween(-42, 42),
        scale: randomBetween(0.85, 1.25),
        duration: randomBetween(2.4, 3.5),
      };

      setReactions((previous) =>
        [...previous, particle].slice(-MAX_VISIBLE_REACTIONS),
      );
      schedule(
        () => {
          setReactions((previous) =>
            previous.filter((item) => item.id !== reactionId),
          );
        },
        Math.ceil(particle.duration * 1_000) + 250,
      );
    };

    const onChatBlocked = ({
      reason,
      retryAfterSeconds,
      message,
    }: {
      reason?: "rate-limit" | "timeout" | "ban";
      retryAfterSeconds?: number;
      message: string;
    }) => {
      const shouldBlockInput = reason === "timeout" || reason === "ban";
      setIsBlocked(shouldBlockInput);
      setBlockMessage(message || "Bạn hiện không thể gửi tin nhắn.");

      if (reason !== "ban") {
        const delay = Math.max(1, retryAfterSeconds || 5) * 1_000;
        schedule(() => {
          setIsBlocked(false);
          setBlockMessage("");
        }, delay);
      }
    };

    const onUserModerated = ({
      userId,
      action,
      durationSeconds,
      message,
    }: {
      userId: string;
      action: string;
      durationSeconds?: number;
      message: string;
    }) => {
      if (userId !== authUser?._id) return;
      setIsBlocked(action === "ban" || action === "timeout");
      setBlockMessage(message || "Bạn hiện không thể gửi tin nhắn.");
      if (action === "timeout" && durationSeconds) {
        schedule(() => {
          setIsBlocked(false);
          setBlockMessage("");
        }, durationSeconds * 1_000);
      }
    };

    const onUserUnmoderated = ({ userId }: { userId: string }) => {
      if (userId === authUser?._id) {
        setIsBlocked(false);
        setBlockMessage("");
      }
    };

    const onStreamEnded = () => {
      setViewerCount(0);
      setViewers([]);
    };

    const onPresenceError = ({ message }: { message?: string }) => {
      console.warn("[presence]", message || "Unable to join stream presence");
    };

    const joinStream = () => {
      socket.emit("join-stream", streamId);
    };

    // Register every listener before joining. Otherwise a very fast
    // viewer-count response can be emitted before the component subscribes.
    socket.on("chat-message", onChatMessage);
    socket.on("viewer-count", onViewerCount);
    socket.on("donation-received", onDonation);
    socket.on("viewer-list", onViewerList);
    socket.on("reaction-received", onReaction);
    socket.on("chat-blocked", onChatBlocked);
    socket.on("user-moderated", onUserModerated);
    socket.on("user-unmoderated", onUserUnmoderated);
    socket.on("stream-ended", onStreamEnded);
    socket.on("presence-error", onPresenceError);

    // Rejoin after every Socket.IO reconnect, not just the first connection.
    // The server removes presence on disconnect, so failing to rejoin would
    // leave the viewer count at zero while the HLS video keeps playing.
    socket.on("connect", joinStream);
    if (socket.connected) joinStream();
    else socket.connect();

    const heartbeat = window.setInterval(() => {
      if (socket.connected) socket.emit("viewer-heartbeat");
    }, VIEWER_HEARTBEAT_MS);

    return () => {
      window.clearInterval(heartbeat);
      socket.off("connect", joinStream);
      if (socket.connected) socket.emit("leave-stream", streamId);
      socket.off("chat-message", onChatMessage);
      socket.off("viewer-count", onViewerCount);
      socket.off("donation-received", onDonation);
      socket.off("viewer-list", onViewerList);
      socket.off("reaction-received", onReaction);
      socket.off("chat-blocked", onChatBlocked);
      socket.off("user-moderated", onUserModerated);
      socket.off("user-unmoderated", onUserUnmoderated);
      socket.off("stream-ended", onStreamEnded);
      socket.off("presence-error", onPresenceError);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      socket.disconnect();
    };
  }, [streamId, authUser?._id]);

  const sendMessage = (text: string) => {
    const message = text.trim();
    if (!message || !streamId || isBlocked) return;
    socket.emit("chat-message", { streamId, message: message.slice(0, 500) });
  };

  const sendReaction = (emoji: string) => {
    if (!streamId || !emoji) return;
    socket.emit("send-reaction", { streamId, reaction: emoji });
  };

  return {
    messages,
    viewerCount,
    viewers,
    donationAlerts,
    reactions,
    isBlocked,
    blockMessage,
    sendMessage,
    sendReaction,
  };
}

export default useLiveStreamSocket;
