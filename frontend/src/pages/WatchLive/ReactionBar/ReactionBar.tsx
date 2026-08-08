const REACTION_EMOJIS = ["❤️", "😂", "😮", "🔥", "👏", "💰"];

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  floatingReactions: { id: string; emoji: string }[];
}

const ReactionBar = ({ onReact, floatingReactions }: ReactionBarProps) => {
  return (
    <>
      <div className="reaction-bar" aria-label="Gửi cảm xúc">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="reaction-btn"
            onClick={() => onReact(emoji)}
            aria-label={`Gửi cảm xúc ${emoji}`}
          >
            <span aria-hidden="true">{emoji}</span>
          </button>
        ))}
      </div>

      <div className="floating-reactions" aria-hidden="true">
        {floatingReactions.map((reaction) => (
          <div key={reaction.id} className="floating-reaction">
            {reaction.emoji}
          </div>
        ))}
      </div>
    </>
  );
};

export default ReactionBar;
