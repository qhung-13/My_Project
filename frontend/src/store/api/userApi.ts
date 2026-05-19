import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  tagTypes: ["Profile", "UserById", "StreamKey"],
  endpoints: (builder) => ({
    // Login
    login: builder.mutation({
      query: (data) => ({
        url: "/users/login",
        method: "POST",
        body: data,
      }),
    }),

    // Verify login OTP
    verifyLoginOtp: builder.mutation({
      query: (data) => ({
        url: "/users/verify-login-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Register
    register: builder.mutation({
      query: (data) => ({
        url: "/users/register",
        method: "POST",
        body: data,
      }),
    }),

    // Send OTP
    sendOtp: builder.mutation({
      query: (data) => ({
        url: "/users/send-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Verify OTP
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "/users/verify-otp",
        method: "POST",
        body: data,
      }),
    }),

    // Get profile
    getProfile: builder.query({
      query: () => "/users/profile",
      providesTags: ["Profile"],
    }),

    // Update profile
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/users/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Profile"],
    }),

    // Logout
    logout: builder.mutation({
      query: () => ({
        url: "/users/logout",
        method: "POST",
      }),
    }),

    // Get User By Id
    getUserById: builder.query({
      query: (userId) => `/users/${userId}`,
      providesTags: ["UserById"],
    }),

    // Follow
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/follow`,
        method: "POST",
      }),
      invalidatesTags: ["Profile", "UserById"],
    }),

    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/unfollow`,
        method: "POST",
      }),
      invalidatesTags: ["Profile", "UserById"],
    }),

    getFollowers: builder.query({
      query: (userId) => `/users/${userId}/followers`,
    }),

    getFollowing: builder.query({
      query: (userId) => `/users/${userId}/following`,
    }),

    getStreamKey: builder.query({
      query: () => "/users/stream-key",
      providesTags: ["StreamKey"],
    }),

    resetStreamKey: builder.mutation({
      query: () => ({
        url: "/users/stream-key/reset",
        method: "POST",
      }),
      invalidatesTags: ["StreamKey"],
    }),
  }),
});

export const {
  useLoginMutation,
  useVerifyLoginOtpMutation,
  useRegisterMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
  useGetUserByIdQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetStreamKeyQuery,
  useResetStreamKeyMutation,
} = userApi;
