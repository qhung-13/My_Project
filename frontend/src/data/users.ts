export interface User {
  id: string;
  username: string;
  initials: string;
  avatarColor: string;
  bio: string;
  followers: number;
  following: number;
  streams: number;
  games: string[];
  isLive: boolean;
  region: string;
  vods: {
    id: number;
    title: string;
    views: number;
    duration: string;
    daysAgo: number;
    bg: string;
  }[];
}

export const USERS: User[] = [
  {
    id: "tiger-gaming",
    username: "TigerGaming",
    initials: "TG",
    avatarColor: "#1877F2",
    bio: "Streamer LOL rank Challenger 🏆 Stream hàng ngày 8PM-12AM",
    followers: 320000,
    following: 142,
    streams: 1200,
    games: ["LOL", "Valorant", "CS2"],
    isLive: true,
    region: "vn",
    vods: [
      {
        id: 1,
        title: "Rank Challenger LOL Stream",
        views: 8100,
        duration: "2:14:32",
        daysAgo: 2,
        bg: "#0a1a2e",
      },
      {
        id: 2,
        title: "Đường đến Thách Đấu",
        views: 5200,
        duration: "3:45:10",
        daysAgo: 5,
        bg: "#1a0a2e",
      },
      {
        id: 3,
        title: "100 ván ranked challenge",
        views: 3100,
        duration: "4:20:00",
        daysAgo: 8,
        bg: "#0a2a1a",
      },
    ],
  },
  {
    id: "cspr-ovn",
    username: "CSProVN",
    initials: "CS",
    avatarColor: "#0F6E56",
    bio: "CS2 pro player 🎯 Major highlights mỗi ngày",
    followers: 180000,
    following: 89,
    streams: 856,
    games: ["CS2", "Valorant"],
    isLive: true,
    region: "vn",
    vods: [
      {
        id: 1,
        title: "Major highlights CS2",
        views: 5600,
        duration: "1:30:00",
        daysAgo: 1,
        bg: "#1a0a0a",
      },
      {
        id: 2,
        title: "AWP one tap compilation",
        views: 3200,
        duration: "2:10:00",
        daysAgo: 4,
        bg: "#0a1a0a",
      },
    ],
  },
];

// User mặc định (trang cá nhân)
export const MY_PROFILE = {
  id: "me",
  username: "MyUsername",
  initials: "ME",
  avatarColor: "#9147ff",
  bio: "",
  followers: 0,
  following: 0,
  streams: 0,
  games: [],
  isLive: false,
  region: "vn",
  vods: [],
};
