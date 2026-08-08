import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

// API
import { userApi } from "./api/userApi";
import { videoApi } from "./api/videoApi";
import { coinApi } from "./api/coinApi";
import { streamApi } from "./api/streamApi";
import { notificationApi } from "./api/notificationApi";
import { adminApi } from "./api/adminApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userApi.reducerPath]: userApi.reducer,
    [videoApi.reducerPath]: videoApi.reducer,
    [coinApi.reducerPath]: coinApi.reducer,
    [streamApi.reducerPath]: streamApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(userApi.middleware)
      .concat(videoApi.middleware)
      .concat(coinApi.middleware)
      .concat(streamApi.middleware)
      .concat(notificationApi.middleware)
      .concat(adminApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
