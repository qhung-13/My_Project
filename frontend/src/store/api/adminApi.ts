import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../config/api";
import type {
  AdminStats,
  AdminStream,
  AdminUser,
  AdminVideo,
} from "../../types/index";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  tagTypes: ["AdminStats", "AdminUsers", "AdminVideos", "AdminStreams"],
  endpoints: (builder) => ({
    getStats: builder.query<AdminStats, void>({
      query: () => "/admin/stats",
      providesTags: ["AdminStats"],
    }),
    getAllUsers: builder.query<AdminUser[], void>({
      query: () => "/admin/users",
      providesTags: ["AdminUsers"],
    }),
    updateUserRole: builder.mutation<AdminUser, { id: string; role: string }>({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    toggleBanUser: builder.mutation<
      { message: string; isActive: boolean },
      string
    >({
      query: (id) => ({
        url: `/admin/users/${id}/ban`,
        method: "PUT",
      }),
      invalidatesTags: ["AdminUsers", "AdminStats"],
    }),
    getAllVideos: builder.query<AdminVideo[], void>({
      query: () => "/admin/videos",
      providesTags: ["AdminVideos"],
    }),
    deleteVideo: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/videos/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["AdminVideos", "AdminStats"],
    }),
    getAllStreams: builder.query<AdminStream[], void>({
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
