import { describe, it, expect } from "vitest";
import { store } from "../store";
import { adminApi } from "../api/adminApi";
import { userApi } from "../api/userApi";
import { videoApi } from "../api/videoApi";
import { donationApi } from "../api/donationApi";
import { coinApi } from "../api/coinApi";
import { streamApi } from "../api/streamApi";
import { notificationApi } from "../api/notificationApi";

describe("Redux store", () => {
  it("registers every RTK Query api slice's reducer", () => {
    const state = store.getState();
    const apis = [
      userApi,
      videoApi,
      donationApi,
      coinApi,
      streamApi,
      notificationApi,
      adminApi,
    ];

    for (const api of apis) {
      // REGRESSION TEST: adminApi (used by pages/Admin/Admin.tsx) was
      // previously never added to the store, so this key would be
      // `undefined` and RTK Query's cache/invalidation silently didn't
      // work for the whole Admin page.
      expect(state).toHaveProperty(api.reducerPath);
    }
  });

  it("includes the auth slice", () => {
    expect(store.getState()).toHaveProperty("auth");
  });
});
