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
