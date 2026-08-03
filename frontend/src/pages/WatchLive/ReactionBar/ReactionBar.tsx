const REACTION_EMOJIS = ["❤️", "😂", "😮", "🔥", "👏", "💰"];

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  floatingReactions: { id: string; emoji: string }[];
}

const ReactionBar = ({ onReact, floatingReactions }: ReactionBarProps) => {
  return (
    <>
      <div className="reaction-bar">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-btn"
            onClick={() => onReact(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="floating-reactions">
        {floatingReactions.map((r) => (
          <div key={r.id} className="floating-reaction">
            {r.emoji}
          </div>
        ))}
      </div>
    </>
  );
};

export default ReactionBar;
