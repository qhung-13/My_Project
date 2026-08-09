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
  id: string;
  user: string;
  userId: string | null;
  message: string;
  timestamp: string;
}

export interface CoinPackage {
  id: number;
  label?: string;
  coins: number;
  bonus: number;
  price: number;
}

export interface DonationAlert {
  id: string;
  fromUsername: string;
  fromAvatar: string | null;
  coins: number;
  message: string;
  timestamp: string;
}

export interface StreamUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string | null;
}

export interface Stream {
  _id: string;
  userId: StreamUser | string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  streamKey?: string;
  hlsUrl?: string | null;
  thumbnailUrl?: string | null;
  isLive: boolean;
  viewers: number;
  peakViewers?: number;
  startedAt?: string;
  endedAt?: string | null;
  vodUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  scheduledAt?: string | null;
  isScheduled?: boolean;
}

export interface LeaderboardItem {
  id: string;
  userId: string;
  name: string;
  avatar: string | undefined;
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
  userId: { _id: string; username: string } | null;
  category: string;
  views: number;
  status: string;
  createdAt: string;
}

export interface AdminStream {
  _id: string;
  title: string;
  userId: { _id: string; username: string } | null;
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

export interface GetVideosParams {
  page?: number;
  limit?: number;
}

export interface PaginatedVideos {
  videos: Video[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface GetLiveStreamsParams {
  page?: number;
  limit?: number;
}

export interface PaginatedStreams {
  streams: Stream[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface Viewer {
  userId: string;
  username: string;
  avatar?: string | null;
  streamId: string;
}

export interface ReactionParticle {
  id: string;
  emoji: string;
  x: number;
  driftA: number;
  driftB: number;
  driftC: number;
  rotateA: number;
  rotateB: number;
  rotateC: number;
  scale: number;
  duration: number;
}

export interface ViewerHistory {
  date: string;
  viewers: number;
}
