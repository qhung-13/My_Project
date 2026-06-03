import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const streamApi = createApi({
  reducerPath: "streamApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getLiveStreams: builder.query({
      query: () => "/streams",
    }),
    getStreamById: builder.query({
      query: (id) => `/streams/${id}`,
    }),
  }),
});

export const { useGetLiveStreamsQuery, useGetStreamByIdQuery } = streamApi;
