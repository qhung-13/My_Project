import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { PaginatedStreams, GetLiveStreamsParams } from "../../types/index";
import { API_BASE_URL } from "../../config/api";

export const streamApi = createApi({
  reducerPath: "streamApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
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
    getCurrentStream: builder.query({
      query: () => "/streams/me/current",
    }),
    getStreamsByUser: builder.query<
      PaginatedStreams,
      { userId: string; page?: number; limit?: number }
    >({
      query: ({ userId, page = 1, limit = 12 }) =>
        `/streams/user/${userId}?${new URLSearchParams({
          page: String(page),
          limit: String(limit),
        }).toString()}`,
    }),
    getTopStreamersByHours: builder.query({
      query: () => "/streams/top-hours",
    }),
    prepareStream: builder.mutation({
      query: (data) => ({
        url: "/streams/start",
        method: "POST",
        body: data,
      }),
    }),
    endStream: builder.mutation({
      query: () => ({
        url: "/streams/end",
        method: "POST",
      }),
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
    getStreamAnalytics: builder.query({
      query: (userId) => `/streams/analytics/${userId}`,
    }),
    askCreatorCoach: builder.mutation<{ answer: string }, { message: string }>({
      query: ({ message }) => ({
        url: "/streams/creator-coach",
        method: "POST",
        body: { message },
      }),
    }),
  }),
});

export const {
  useGetLiveStreamsQuery,
  useGetStreamByIdQuery,
  useGetCurrentStreamQuery,
  useGetStreamsByUserQuery,
  useGetTopStreamersByHoursQuery,
  usePrepareStreamMutation,
  useEndStreamMutation,
  useTimeoutUserMutation,
  useBanUserMutation,
  useUnbanUserMutation,
  useScheduleStreamMutation,
  useGetScheduledStreamsQuery,
  useGetScheduledStreamsByUserQuery,
  useUpdateLiveStreamMutation,
  useGetStreamAnalyticsQuery,
  useAskCreatorCoachMutation,
} = streamApi;
