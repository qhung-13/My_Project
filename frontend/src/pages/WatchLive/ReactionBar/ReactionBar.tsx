import type { CSSProperties } from "react";
import type { ReactionParticle } from "../../../types/index";

const REACTION_EMOJIS = ["❤️", "😂", "😮", "🔥", "👏", "💰"];

type ReactionStyle = CSSProperties & {
  "--reaction-x": string;
  "--reaction-drift-a": string;
  "--reaction-drift-b": string;
  "--reaction-drift-c": string;
  "--reaction-rotate-a": string;
  "--reaction-rotate-b": string;
  "--reaction-rotate-c": string;
  "--reaction-scale": string;
  "--reaction-duration": string;
};

interface ReactionBarProps {
  onReact: (emoji: string) => void;
  floatingReactions: ReactionParticle[];
}

const ReactionBar = ({ onReact, floatingReactions }: ReactionBarProps) => {
  return (
    <div className="reaction-layer">
      <div className="floating-reactions" aria-hidden="true">
        {floatingReactions.map((reaction) => {
          const style: ReactionStyle = {
            "--reaction-x": `${reaction.x}%`,
            "--reaction-drift-a": `${reaction.driftA}px`,
            "--reaction-drift-b": `${reaction.driftB}px`,
            "--reaction-drift-c": `${reaction.driftC}px`,
            "--reaction-rotate-a": `${reaction.rotateA}deg`,
            "--reaction-rotate-b": `${reaction.rotateB}deg`,
            "--reaction-rotate-c": `${reaction.rotateC}deg`,
            "--reaction-scale": String(reaction.scale),
            "--reaction-duration": `${reaction.duration}s`,
          };

          return (
            <span key={reaction.id} className="floating-reaction" style={style}>
              {reaction.emoji}
            </span>
          );
        })}
      </div>

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
    </div>
  );
};

export default ReactionBar;
