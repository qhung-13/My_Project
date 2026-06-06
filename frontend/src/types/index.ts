export interface darkModeProps {
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface Country {
  name: string;
  flag: string;
  code: string;
}

export interface LoginProps {
  onClose: () => void;
  onSwitch: () => void;
}

export interface RegisterProps {
  onClose: () => void;
  onSwitch: () => void;
}

//
export interface Video {
  _id: string;
  userId:
    | {
        _id: string;
        username: string;
        displayName?: string;
        avatar?: string | null;
      }
    | string; // Có thể là object (populated) hoặc string (id)
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  views: number;
  likes: string[];
  likesCount: number;
  dislikes: string[];
  dislikesCount: number;
  category: string;
  tags: string[];
  status: string;
  createdAt: string;
  type: string;
}

export interface Comment {
  _id: string;
  userId: {
    _id: string;
    username: string;
    displayName?: string;
    avatar?: string | null;
  };
  content: string;
  likesCount: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  user: string;
  message: string;
  timestamp: Date;
}

export interface CoinPackage {
  id: number;
  label?: string;
  coins: number;
  bonus: number;
  price: number;
}

export interface DonationAlert {
  fromUsername: string;
  fromAvatar: string | null;
  coins: number;
  message: string;
  timestamp: Date;
}

export interface StreamUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
}

export interface Stream {
  _id: string;
  userId: StreamUser;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  streamKey?: string;
  thumbnailUrl?: string | null;
  isLive: boolean;
  viewers: number;
  peakViewers?: number;
  startedAt?: string;
  endedAt?: string | null;
  vodUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardItem {
  id: string;
  userId: string;
  name: string;
  avatar?: string | null;
  value: string;
  live: boolean;
}

export interface TopUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
  followersCount: number;
}

export interface TopHoursUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
  totalHours: number;
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminVideo {
  _id: string;
  title: string;
  userId: { _id: string; username: string };
  category: string;
  views: number;
  status: string;
  createdAt: string;
}

export interface AdminStream {
  _id: string;
  title: string;
  userId: { _id: string; username: string };
  category: string;
  viewers: number;
  isLive: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVideos: number;
  totalStreams: number;
  totalDonations: number;
  recentUsers: AdminUser[];
}
