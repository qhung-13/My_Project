import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const donationApi = createApi({
  reducerPath: "donationApi",

  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),

  tagTypes: ["Donation"],

  endpoints: (builder) => ({
    // Create payment intent
    createPaymentIntent: builder.mutation({
      query: (data) => ({
        url: "/donations/create-payment-intent",
        method: "POST",
        body: data,
      }),
    }),

    // Confirm donation
    confirmDonation: builder.mutation({
      query: (data) => ({
        url: "/donations/confirm",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Donation"],
    }),

    // Get donations received
    getReceivedDonations: builder.query({
      query: () => "/donations/received",
      providesTags: ["Donation"],
    }),

    // Get donations sent
    getSentDonations: builder.query({
      query: () => "/donations/sent",
      providesTags: ["Donation"],
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useConfirmDonationMutation,
  useGetReceivedDonationsQuery,
  useGetSentDonationsQuery,
} = donationApi;
