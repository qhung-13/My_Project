import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const videoApi = createApi({
  reducerPath: "videoApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  tagTypes: ["Video", "Comment"],
  endpoints: (builder) => ({
    // Get all videos
    getVideos: builder.query({
      query: () => "/videos",
      providesTags: ["Video"],
    }),

    // Get video by id
    getVideoById: builder.query({
      query: (id) => `/videos/${id}`,
      providesTags: ["Video"],
    }),

    // Get videos by user
    getVideosByUser: builder.query({
      query: (userId) => `/videos/user/${userId}`,
      providesTags: ["Video"],
    }),

    // Search videos
    searchVideos: builder.query({
      query: ({ q, category, sort }) =>
        `/videos/search?${q ? `q=${q}&` : ""}${category ? `category=${category}&` : ""}${sort ? `sort=${sort}` : ""}`,
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
} = videoApi;
