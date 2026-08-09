import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  avatar: string | null;
  coins: number;
  role: "user" | "stream" | "streamer" | "admin";
  displayName?: string;
  bio?: string;
  bannerImage?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  /** False until the initial cookie-backed profile request has settled. */
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    updateCoins: (state, action: PayloadAction<number>) => {
      if (state.user && Number.isFinite(action.payload)) {
        state.user.coins = Math.max(0, action.payload);
      }
    },
    finishAuthInitialization: (state) => {
      state.isInitialized = true;
    },
  },
});

export const { setUser, clearUser, updateCoins, finishAuthInitialization } =
  authSlice.actions;
export default authSlice.reducer;
