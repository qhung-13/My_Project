import { MessageSquare, Send } from "lucide-react";
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
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`chat-panel ${isOpen ? "chat-panel--open" : ""}`}>
      <div className="chat-panel__tab" onClick={onToggle}>
        <div className="chat-panel__tab-left">
          <MessageSquare size={14} />
          <span>Trò chuyện trực tiếp</span>
          {!isOpen && (
            <span className="chat-panel__hint">· Hãy nói điều gì đó!</span>
          )}
        </div>
        <span
          className={`chat-panel__arrow ${isOpen ? "chat-panel__arrow--up" : ""}`}
        >
          ↑
        </span>
      </div>

      <div className="chat-panel__content">
        <div className="chat-panel__messages">
          {messages.map((msg) => (
            <div className="chat-msg" key={msg.id}>
              <div
                className="chat-msg__avatar"
                style={{ background: generateColor(msg.user) }}
              >
                {msg.user.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span
                  className="chat-msg__user"
                  style={{
                    cursor: isStreamer ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (isStreamer && msg.userId !== currentUserId) {
                      onSelectUser({ id: msg.userId, name: msg.user });
                    }
                  }}
                >
                  {msg.user}{" "}
                </span>
                <span className="chat-msg__text">{msg.message}</span>
              </div>
            </div>
          ))}

          {selectedUser && isStreamer && (
            <div className="moderation-menu">
              <div className="moderation-menu__header">
                <span>⚙️ {selectedUser.name}</span>
                <button onClick={onClearSelectedUser}>✕</button>
              </div>
              <button onClick={() => onTimeout(60)}>⏱ Timeout 1 phút</button>
              <button onClick={() => onTimeout(300)}>⏱ Timeout 5 phút</button>
              <button onClick={onBan} className="moderation-menu__ban">
                🚫 Ban
              </button>
            </div>
          )}

          {isBlocked && <div className="chat-blocked">🚫 {blockMessage}</div>}

          {!isBlocked && (
            <div className="chat-panel__input">
              <input
                type="text"
                placeholder="Hãy nói điều gì đó..."
                value={inputMessage}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSend()}
              />
              <button className="chat-panel__send" onClick={onSend}>
                <Send size={14} />
              </button>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
