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
  category: string;
  tags: string[];
  status: string;
  createdAt: string;
}
