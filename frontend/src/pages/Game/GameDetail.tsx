import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";
import { formatViewers } from "../../utils/format";
import "./GameDetail.css";

// ============================================================
// Types
// ============================================================
interface Stream {
  id: number;
  streamerName: string;
  streamTitle: string;
  viewers: number;
  bg: string;
  initials: string;
  avatarColor: string;
}

// ============================================================
// Mock data
// ============================================================
const STREAMS_BY_GAME: Record<string, Stream[]> = {
  valorant: [
    {
      id: 1,
      streamerName: "NhokKute",
      streamTitle: "Cày rank Valorant",
      viewers: 2400,
      bg: "#1a0a2e",
      initials: "NK",
      avatarColor: "#E24B4A",
    },
    {
      id: 2,
      streamerName: "ProVN",
      streamTitle: "Immortal gameplay",
      viewers: 1800,
      bg: "#2a0a1a",
      initials: "PV",
      avatarColor: "#9147ff",
    },
    {
      id: 3,
      streamerName: "AceShooter",
      streamTitle: "Radiant climb",
      viewers: 950,
      bg: "#1a1a2a",
      initials: "AS",
      avatarColor: "#534AB7",
    },
    {
      id: 4,
      streamerName: "SniperKing",
      streamTitle: "Chamber one tap",
      viewers: 720,
      bg: "#0a1a2e",
      initials: "SK",
      avatarColor: "#0F6E56",
    },
  ],
  lol: [
    {
      id: 1,
      streamerName: "TigerGaming",
      streamTitle: "Rank Challenger LOL",
      viewers: 8100,
      bg: "#0a1a2e",
      initials: "TG",
      avatarColor: "#1877F2",
    },
    {
      id: 2,
      streamerName: "GalaxyX",
      streamTitle: "Diamond climb",
      viewers: 1900,
      bg: "#0a2a1a",
      initials: "GX",
      avatarColor: "#534AB7",
    },
    {
      id: 3,
      streamerName: "MidLaner",
      streamTitle: "Zed montage",
      viewers: 1200,
      bg: "#1a0a2e",
      initials: "ML",
      avatarColor: "#993556",
    },
    {
      id: 4,
      streamerName: "JungleKing",
      streamTitle: "Vi full clear",
      viewers: 890,
      bg: "#2a1a0a",
      initials: "JK",
      avatarColor: "#854F0B",
    },
  ],
  pubg: [
    {
      id: 1,
      streamerName: "ProBattle",
      streamTitle: "Squad mode PUBG",
      viewers: 1200,
      bg: "#2a0a1a",
      initials: "PB",
      avatarColor: "#854F0B",
    },
    {
      id: 2,
      streamerName: "ChickenWin",
      streamTitle: "Solo vs Squad",
      viewers: 980,
      bg: "#1a2a0a",
      initials: "CW",
      avatarColor: "#3B6D11",
    },
  ],
  cs2: [
    {
      id: 1,
      streamerName: "CSProVN",
      streamTitle: "Major highlights CS2",
      viewers: 5600,
      bg: "#1a0a0a",
      initials: "CS",
      avatarColor: "#0F6E56",
    },
    {
      id: 2,
      streamerName: "AWPGod",
      streamTitle: "AWP only challenge",
      viewers: 2100,
      bg: "#0a1a0a",
      initials: "AG",
      avatarColor: "#639922",
    },
    {
      id: 3,
      streamerName: "HeadshotVN",
      streamTitle: "Rank S1 grind",
      viewers: 1400,
      bg: "#0a0a1a",
      initials: "HV",
      avatarColor: "#185FA5",
    },
  ],
  dota2: [
    {
      id: 1,
      streamerName: "GalaxyX",
      streamTitle: "Esport recap Dota 2",
      viewers: 1900,
      bg: "#0a2a1a",
      initials: "GX",
      avatarColor: "#534AB7",
    },
    {
      id: 2,
      streamerName: "CarryGod",
      streamTitle: "MMR climbing",
      viewers: 1100,
      bg: "#1a0a2e",
      initials: "CG",
      avatarColor: "#9147ff",
    },
  ],
  fifa: [
    {
      id: 1,
      streamerName: "MixGaming",
      streamTitle: "Clutch moments FIFA",
      viewers: 890,
      bg: "#1a1a0a",
      initials: "MX",
      avatarColor: "#993556",
    },
    {
      id: 2,
      streamerName: "FIFAKing",
      streamTitle: "Ultimate team grind",
      viewers: 650,
      bg: "#0a1a0a",
      initials: "FK",
      avatarColor: "#3B6D11",
    },
  ],
  mlbb: [
    {
      id: 1,
      streamerName: "MobilePro",
      streamTitle: "Mythic rank push",
      viewers: 3200,
      bg: "#0a1a1a",
      initials: "MP",
      avatarColor: "#1877F2",
    },
    {
      id: 2,
      streamerName: "HeroKing",
      streamTitle: "Marksman gameplay",
      viewers: 2100,
      bg: "#1a0a1a",
      initials: "HK",
      avatarColor: "#E24B4A",
    },
    {
      id: 3,
      streamerName: "MLBBPro",
      streamTitle: "Ranked matches",
      viewers: 1500,
      bg: "#0a0a1a",
      initials: "ML",
      avatarColor: "#534AB7",
    },
  ],
  cod: [
    {
      id: 1,
      streamerName: "WarZoneVN",
      streamTitle: "Warzone solo win",
      viewers: 1800,
      bg: "#1a1a2a",
      initials: "WZ",
      avatarColor: "#854F0B",
    },
    {
      id: 2,
      streamerName: "GunMaster",
      streamTitle: "BR ranked grind",
      viewers: 1200,
      bg: "#2a1a1a",
      initials: "GM",
      avatarColor: "#993556",
    },
  ],
};

const GAME_NAMES: Record<string, string> = {
  valorant: "Valorant",
  lol: "League of Legends",
  pubg: "PUBG",
  cs2: "CS2",
  dota2: "Dota 2",
  fifa: "FIFA",
  mlbb: "Mobile Legends",
  cod: "Call of Duty",
};

// ============================================================
// Component
// ============================================================
const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();

  const streams = STREAMS_BY_GAME[gameId ?? ""] ?? [];
  const gameName = GAME_NAMES[gameId ?? ""] ?? gameId;

  return (
    <div className="game-detail">
      {/* Header */}
      <div className="game-detail__header">
        <button className="game-detail__back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <span className="game-detail__title">{gameName}</span>
        <span className="game-detail__count">{streams.length} streams</span>
      </div>

      {/* Stream grid */}
      {streams.length > 0 ? (
        <div className="game-detail__grid">
          {streams.map((stream) => (
            <div className="gd-card" key={stream.id}>
              {/* Thumbnail */}
              <div className="gd-card__thumb" style={{ background: stream.bg }}>
                <button className="gd-card__play">
                  <Play size={14} fill="white" />
                </button>
                <span className="gd-card__badge">LIVE</span>
                <span className="gd-card__viewers">
                  {formatViewers(stream.viewers)} viewers
                </span>
              </div>

              {/* Info */}
              <div className="gd-card__info">
                <div className="gd-card__streamer">
                  <div
                    className="gd-card__avatar"
                    style={{ background: stream.avatarColor }}
                  >
                    {stream.initials}
                  </div>
                  <span className="gd-card__name">{stream.streamerName}</span>
                </div>
                <div className="gd-card__title">{stream.streamTitle}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="game-detail__empty">
          <div className="game-detail__empty-icon">📭</div>
          <p>Chưa có stream nào</p>
          <span>Quay lại sau nhé!</span>
        </div>
      )}
    </div>
  );
};

export default GameDetail;
