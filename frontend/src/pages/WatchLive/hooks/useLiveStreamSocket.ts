import { useEffect, useState } from "react";
import socket from "../../../utils/socket";
import type { ChatMessage, DonationAlert, Viewer } from "../../../types/index";

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

/**
 * Owns the entire realtime lifecycle for a single stream: connecting,
 * joining/leaving the room, and all the socket event listeners
 * (chat, viewer count/list, donations, reactions, moderation).
 *
 * This used to live inline inside WatchLive.tsx, mixed together with the
 * JSX for the whole page. Pulling it into a hook means:
 *  - WatchLive.tsx only has to think about "what do I render", not
 *    "how do sockets work"
 *  - the socket logic can be unit-tested or reused (e.g. a future
 *    "mini player" that also needs chat) without dragging the whole page
 *    along with it
 */
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

  // NOTE: this hook is remounted fresh for every stream because the parent
  // page is rendered with `key={streamerId}` at the route level (App.tsx),
  // so there's no need to manually reset state when `streamId` changes.

  useEffect(() => {
    if (!streamId) return;

    socket.connect();
    socket.emit("join-stream", streamId, {
      userId: authUser?._id || "anonymous",
      username: authUser?.username || "Anonymous",
      avatar: authUser?.avatar || null,
    });

    const onChatMessage = (data: ChatMessage) =>
      setMessages((prev) => [...prev, data]);

    const onViewerCount = (count: number) => setViewerCount(count);

    const onDonation = (data: DonationAlert) => {
      setDonationAlerts((prev) => [...prev, data]);
      setTimeout(() => {
        setDonationAlerts((prev) => prev.filter((_, i) => i !== 0));
      }, 5000);
    };

    const onViewerList = (data: Viewer[]) => setViewers(data);

    const onReaction = ({
      reaction,
      userId,
    }: {
      reaction: string;
      userId: string;
    }) => {
      const reactionId = `${userId}-${Date.now()}`;
      setReactions((prev) => [...prev, { id: reactionId, emoji: reaction }]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reactionId));
      }, 3000);
    };

    const onChatBlocked = ({ message }: { message: string }) => {
      setIsBlocked(true);
      setBlockMessage(message);
    };

    const onUserModerated = ({
      userId,
      action,
      message,
    }: {
      userId: string;
      action: string;
      message: string;
    }) => {
      if (userId === authUser?._id) {
        setIsBlocked(action === "ban");
        setBlockMessage(message);
      }
    };

    socket.on("chat-message", onChatMessage);
    socket.on("viewer-count", onViewerCount);
    socket.on("donation-received", onDonation);
    socket.on("viewer-list", onViewerList);
    socket.on("reaction-received", onReaction);
    socket.on("chat-blocked", onChatBlocked);
    socket.on("user-moderated", onUserModerated);

    return () => {
      socket.emit("leave-stream", streamId);
      socket.off("chat-message", onChatMessage);
      socket.off("viewer-count", onViewerCount);
      socket.off("donation-received", onDonation);
      socket.off("viewer-list", onViewerList);
      socket.off("reaction-received", onReaction);
      socket.off("chat-blocked", onChatBlocked);
      socket.off("user-moderated", onUserModerated);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamId, authUser?._id]);

  const sendMessage = (text: string) => {
    if (!text.trim() || !streamId) return;
    socket.emit("chat-message", {
      streamId,
      message: text.trim(),
      user: authUser?.username || "Anonymous",
      userId: authUser?._id || null,
    });
  };

  const sendReaction = (emoji: string) => {
    if (!streamId) return;
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
