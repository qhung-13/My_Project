import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { GetVideosParams, PaginatedVideos } from "../../types/index";

export const videoApi = createApi({
  reducerPath: "videoApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  tagTypes: ["Video", "Comment"],
  endpoints: (builder) => ({
    // Get all videos
    getVideos: builder.query<PaginatedVideos, GetVideosParams | void>({
      query: ({ page = 1, limit = 12 } = {}) =>
        `/videos?page=${page}&limit=${limit}`,
      providesTags: ["Video"],
    }),

    // Get video by id
    getVideoById: builder.query({
      query: (id) => `/videos/${id}`,
      providesTags: ["Video"],
    }),

    // Get videos by user
    getVideosByUser: builder.query({
      query: ({ userId, page = 1, limit = 12 }) =>
        `/videos/user/${userId}?page=${page}&limit=${limit}`,
      providesTags: ["Video"],
    }),

    // Search videos
    searchVideos: builder.query({
      query: ({ q, category, sort, page = 1, limit = 12 }) =>
        `/videos/search?${q ? `q=${q}&` : ""}${category ? `category=${category}&` : ""}${sort ? `sort=${sort}&` : ""}page=${page}&limit=${limit}`,
      providesTags: ["Video"],
    }),

    // Like video
    likeVideo: builder.mutation({
      query: (id) => ({
        url: `/videos/${id}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Video"],
    }),

    // Unlike video
    unlikeVideo: builder.mutation({
      query: (id) => ({
        url: `/videos/${id}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["Video"],
    }),

    // Get comments
    getComments: builder.query({
      query: (videoId) => `/comments/${videoId}`,
      providesTags: ["Comment"],
    }),

    // Create comment
    createComment: builder.mutation({
      query: ({ videoId, content }) => ({
        url: `/comments/${videoId}`,
        method: "POST",
        body: { content },
      }),
      invalidatesTags: ["Comment"],
    }),

    // Delete comment
    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Comment"],
    }),

    // Like comment
    likeComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}/like`,
        method: "POST",
      }),
      invalidatesTags: ["Comment"],
    }),

    // Unlike comment
    unlikeComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}/unlike`,
        method: "POST",
      }),
      invalidatesTags: ["Comment"],
    }),

    dislikeVideo: builder.mutation({
      query: (id) => ({ url: `/videos/${id}/dislike`, method: "POST" }),
      invalidatesTags: ["Video"],
    }),

    undislikeVideo: builder.mutation({
      query: (id) => ({ url: `/videos/${id}/undislike`, method: "POST" }),
      invalidatesTags: ["Video"],
    }),

    increaseView: builder.mutation({
      query: (id) => ({ url: `/videos/${id}/view`, method: "PUT" }),
      invalidatesTags: ["Video"],
    }),
  }),
});

export const {
  useGetVideosQuery,
  useGetVideoByIdQuery,
  useGetVideosByUserQuery,
  useSearchVideosQuery,
  useLikeVideoMutation,
  useUnlikeVideoMutation,
  useGetCommentsQuery,
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useUnlikeCommentMutation,
  useDislikeVideoMutation,
  useUndislikeVideoMutation,
  useIncreaseViewMutation,
} = videoApi;
