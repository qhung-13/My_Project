import { useEffect, useState } from "react";
import socket from "../../../utils/socket";
import type { ChatMessage, DonationAlert, Viewer } from "../../../types/index";

const MAX_CHAT_MESSAGES = 300;
const MAX_VISIBLE_REACTIONS = 40;
const MAX_DONATION_ALERTS = 5;

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
  reactions: { id: string; emoji: string }[];
  isBlocked: boolean;
  blockMessage: string;
  sendMessage: (text: string) => void;
  sendReaction: (emoji: string) => void;
}

/** Owns the realtime lifecycle for one stream room. */
export function useLiveStreamSocket(
  streamId: string | undefined,
  authUser: AuthUserLike | null | undefined,
): UseLiveStreamSocketResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [donationAlerts, setDonationAlerts] = useState<DonationAlert[]>([]);
  const [reactions, setReactions] = useState<{ id: string; emoji: string }[]>(
    [],
  );
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

    setMessages([]);
    setViewerCount(0);
    setViewers([]);
    setDonationAlerts([]);
    setReactions([]);
    setIsBlocked(false);
    setBlockMessage("");

    socket.connect();
    socket.emit("join-stream", streamId, {
      username: authUser?.username,
      avatar: authUser?.avatar,
    });

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
      setReactions((previous) =>
        [...previous, { id: reactionId, emoji: reaction }].slice(
          -MAX_VISIBLE_REACTIONS,
        ),
      );
      schedule(() => {
        setReactions((previous) =>
          previous.filter((item) => item.id !== reactionId),
        );
      }, 3_000);
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

    socket.on("chat-message", onChatMessage);
    socket.on("viewer-count", onViewerCount);
    socket.on("donation-received", onDonation);
    socket.on("viewer-list", onViewerList);
    socket.on("reaction-received", onReaction);
    socket.on("chat-blocked", onChatBlocked);
    const onUserUnmoderated = ({ userId }: { userId: string }) => {
      if (userId === authUser?._id) {
        setIsBlocked(false);
        setBlockMessage("");
      }
    };

    socket.on("user-moderated", onUserModerated);
    socket.on("user-unmoderated", onUserUnmoderated);

    return () => {
      socket.emit("leave-stream", streamId);
      socket.off("chat-message", onChatMessage);
      socket.off("viewer-count", onViewerCount);
      socket.off("donation-received", onDonation);
      socket.off("viewer-list", onViewerList);
      socket.off("reaction-received", onReaction);
      socket.off("chat-blocked", onChatBlocked);
      socket.off("user-moderated", onUserModerated);
      socket.off("user-unmoderated", onUserUnmoderated);
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
      socket.disconnect();
    };
  }, [streamId, authUser?._id, authUser?.username, authUser?.avatar]);

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
