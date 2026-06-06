import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  tagTypes: ["AdminUsers", "AdminVideos", "AdminStreams"],
  endpoints: (builder) => ({
    getStats: builder.query({
      query: () => "/admin/stats",
    }),
    getAllUsers: builder.query({
      query: () => "/admin/users",
      providesTags: ["AdminUsers"],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    toggleBanUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}/ban`,
        method: "PUT",
      }),
      invalidatesTags: ["AdminUsers"],
    }),
    getAllVideos: builder.query({
      query: () => "/admin/videos",
      providesTags: ["AdminVideos"],
    }),
    deleteVideo: builder.mutation({
      query: (id) => ({
        url: `/admin/videos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminVideos"],
    }),
    getAllStreams: builder.query({
      query: () => "/admin/streams",
      providesTags: ["AdminStreams"],
    }),
  }),
});

export const {
  useGetStatsQuery,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useToggleBanUserMutation,
  useGetAllVideosQuery,
  useDeleteVideoMutation,
  useGetAllStreamsQuery,
} = adminApi;
