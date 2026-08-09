import { ChevronUp, MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { generateColor } from "../../../utils/format";
import type { ChatMessage } from "../../../types/index";

interface SelectedUser {
  id: string;
  name: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  messages: ChatMessage[];
  inputMessage: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  isStreamer: boolean;
  isAuthenticated: boolean;
  currentUserId?: string;
  selectedUser: SelectedUser | null;
  onSelectUser: (user: SelectedUser) => void;
  onClearSelectedUser: () => void;
  onTimeout: (seconds: number) => void;
  onBan: () => void;
  isBlocked: boolean;
  blockMessage: string;
}

const ChatPanel = ({
  isOpen,
  onToggle,
  messages,
  inputMessage,
  onInputChange,
  onSend,
  isStreamer,
  isAuthenticated,
  currentUserId,
  selectedUser,
  onSelectUser,
  onClearSelectedUser,
  onTimeout,
  onBan,
  isBlocked,
  blockMessage,
}: ChatPanelProps) => {
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  return (
    <section className={`chat-panel ${isOpen ? "chat-panel--open" : ""}`}>
      <button
        type="button"
        className="chat-panel__tab"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="live-chat-content"
      >
        <span className="chat-panel__tab-left">
          <MessageSquare size={14} aria-hidden="true" />
          <span>Trò chuyện trực tiếp</span>
          {!isOpen && (
            <span className="chat-panel__hint">· Hãy nói điều gì đó!</span>
          )}
        </span>
        <ChevronUp
          size={16}
          aria-hidden="true"
          className={`chat-panel__arrow ${isOpen ? "chat-panel__arrow--up" : ""}`}
        />
      </button>

      <div id="live-chat-content" className="chat-panel__content">
        <div
          className="chat-panel__messages"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 && (
            <p className="chat-panel__empty">
              Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.
            </p>
          )}

          {messages.map((message) => {
            const canModerate =
              isStreamer &&
              Boolean(message.userId) &&
              message.userId !== currentUserId;
            return (
              <div className="chat-msg" key={message.id}>
                <div
                  className="chat-msg__avatar"
                  style={{ background: generateColor(message.user) }}
                  aria-hidden="true"
                >
                  {message.user.slice(0, 2).toUpperCase()}
                </div>
                <div className="chat-msg__body">
                  {canModerate ? (
                    <button
                      type="button"
                      className="chat-msg__user chat-msg__user--action"
                      onClick={() =>
                        onSelectUser({
                          id: message.userId as string,
                          name: message.user,
                        })
                      }
                      aria-label={`Mở công cụ kiểm duyệt cho ${message.user}`}
                    >
                      {message.user}
                    </button>
                  ) : (
                    <span className="chat-msg__user">{message.user}</span>
                  )}{" "}
                  <span className="chat-msg__text">{message.message}</span>
                </div>
              </div>
            );
          })}

          <div ref={messageEndRef} />
        </div>

        {selectedUser && isStreamer && (
          <div
            className="moderation-menu"
            role="dialog"
            aria-label={`Kiểm duyệt ${selectedUser.name}`}
          >
            <div className="moderation-menu__header">
              <span>Kiểm duyệt {selectedUser.name}</span>
              <button
                type="button"
                onClick={onClearSelectedUser}
                aria-label="Đóng công cụ kiểm duyệt"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={() => onTimeout(60)}>
              Timeout 1 phút
            </button>
            <button type="button" onClick={() => onTimeout(300)}>
              Timeout 5 phút
            </button>
            <button
              type="button"
              onClick={onBan}
              className="moderation-menu__ban"
            >
              Ban khỏi stream
            </button>
          </div>
        )}

        {blockMessage && (
          <div className="chat-blocked" role="status">
            {blockMessage}
          </div>
        )}

        <form
          className="chat-panel__input"
          onSubmit={(event) => {
            event.preventDefault();
            onSend();
          }}
        >
          <label className="sr-only" htmlFor="live-chat-message">
            Tin nhắn trực tiếp
          </label>
          <input
            id="live-chat-message"
            type="text"
            placeholder={
              !isAuthenticated
                ? "Đăng nhập để tham gia trò chuyện"
                : isBlocked
                  ? "Bạn hiện không thể nhắn tin"
                  : "Hãy nói điều gì đó..."
            }
            value={inputMessage}
            onChange={(event) => onInputChange(event.target.value)}
            maxLength={500}
            disabled={isBlocked || !isAuthenticated}
            autoComplete="off"
          />
          <button
            type="submit"
            className="chat-panel__send"
            disabled={!isAuthenticated || isBlocked || !inputMessage.trim()}
            aria-label="Gửi tin nhắn"
          >
            <Send size={14} aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
};

export default ChatPanel;
