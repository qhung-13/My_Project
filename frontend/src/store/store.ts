import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

// API
import { userApi } from "./api/userApi";
import { videoApi } from "./api/videoApi";
import { donationApi } from "./api/donationApi";
import { coinApi } from "./api/coinApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userApi.reducerPath]: userApi.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [donationApi.reducerPath]: donationApi.reducer,
    [coinApi.reducerPath]: coinApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userApi.middleware)
      .concat(videoApi.middleware)
      .concat(donationApi.middleware)
      .concat(coinApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
