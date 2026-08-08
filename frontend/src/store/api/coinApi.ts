import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../config/api";

export const coinApi = createApi({
  reducerPath: "coinApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  tagTypes: ["Coins", "Donations"],
  endpoints: (builder) => ({
    // Lấy danh sách gói xu
    getCoinPackages: builder.query({
      query: () => "/coins/packages",
    }),

    // Lấy số dư xu
    getCoinBalance: builder.query({
      query: () => "/coins/balance",
      providesTags: ["Coins"],
    }),

    // Tạo payment intent nạp xu
    createTopUp: builder.mutation({
      query: (packageId) => ({
        url: "/coins/topup",
        method: "POST",
        body: { packageId },
      }),
    }),

    // Xác nhận nạp xu sau khi thanh toán
    confirmTopUp: builder.mutation({
      query: (paymentIntentId) => ({
        url: "/coins/topup/confirm",
        method: "POST",
        body: { paymentIntentId },
      }),
      invalidatesTags: ["Coins"],
    }),

    // Donate xu
    donateCoins: builder.mutation({
      query: (data) => ({
        url: "/coins/donate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Coins", "Donations"],
    }),

    // Lịch sử donate
    getDonationHistory: builder.query({
      query: () => "/coins/donations",
      providesTags: ["Donations"],
    }),
  }),
});

export const {
  useGetCoinPackagesQuery,
  useGetCoinBalanceQuery,
  useCreateTopUpMutation,
  useConfirmTopUpMutation,
  useDonateCoinsMutation,
  useGetDonationHistoryQuery,
} = coinApi;
