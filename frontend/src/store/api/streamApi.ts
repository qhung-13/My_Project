import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PaginatedStreams, GetLiveStreamsParams } from "../../types/index";

export const streamApi = createApi({
  reducerPath: "streamApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getLiveStreams: builder.query<
      PaginatedStreams,
      GetLiveStreamsParams | void
    >({
      query: (params) => {
        const { page = 1, limit = 12 } = params ?? {};
        return `/streams?page=${page}&limit=${limit}`;
      },
    }),
    getStreamById: builder.query({
      query: (id) => `/streams/${id}`,
    }),
    getTopStreamersByHours: builder.query({
      query: () => "/streams/top-hours",
    }),
    timeoutUser: builder.mutation({
      query: ({ userId, streamId, durationSeconds }) => ({
        url: "/moderation/timeout",
        method: "POST",
        body: { userId, streamId, durationSeconds },
      }),
    }),
    banUser: builder.mutation({
      query: ({ userId, streamId, reason }) => ({
        url: "/moderation/ban",
        method: "POST",
        body: { userId, streamId, reason },
      }),
    }),
    unbanUser: builder.mutation({
      query: ({ userId, streamId }) => ({
        url: "/moderation/unban",
        method: "POST",
        body: { userId, streamId },
      }),
    }),
    scheduleStream: builder.mutation({
      query: (data) => ({
        url: "/streams/schedule",
        method: "POST",
        body: data,
      }),
    }),
    getScheduledStreams: builder.query({
      query: () => "/streams/scheduled",
    }),
    getScheduledStreamsByUser: builder.query({
      query: (userId) => `/streams/scheduled/${userId}`,
    }),
    updateLiveStream: builder.mutation({
      query: (data) => ({
        url: "/streams/live/update",
        method: "PUT",
        body: data,
      }),
    }),
  }),
});

export const {
  useGetLiveStreamsQuery,
  useGetStreamByIdQuery,
  useGetTopStreamersByHoursQuery,
  useTimeoutUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useScheduleStreamMutation,
  useGetScheduledStreamsQuery,
  useGetScheduledStreamsByUserQuery,
  useUpdateLiveStreamMutation,
} = streamApi;  
