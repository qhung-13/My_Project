import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import authReducer from "../../store/slices/authSlice";
import ProtectedRoute from "../ProtectedRoute";

const baseUser = {
  _id: "u1",
  username: "tester",
  email: "tester@example.com",
  avatar: null,
  coins: 0,
};

const renderWithAuth = (
  authState: {
    user:
      | (typeof baseUser & { role: "admin" | "stream" | "streamer" | "user" })
      | null;
    isAuthenticated: boolean;
    isInitialized?: boolean;
  },
  { adminOnly = false } = {},
) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authState, isInitialized: authState.isInitialized ?? true },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route path="/home" element={<div>Home page</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute adminOnly={adminOnly}>
                <div>Secret content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe("ProtectedRoute", () => {
  it("redirects to /home when the user is not authenticated", () => {
    renderWithAuth({ user: null, isAuthenticated: false });
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("renders the protected content for an authenticated user", () => {
    renderWithAuth({
      user: { ...baseUser, role: "user" },
      isAuthenticated: true,
    });
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });

  it("redirects a non-admin user away from an adminOnly route", () => {
    renderWithAuth(
      { user: { ...baseUser, role: "user" }, isAuthenticated: true },
      { adminOnly: true },
    );
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Secret content")).not.toBeInTheDocument();
  });

  it("allows an admin user into an adminOnly route", () => {
    renderWithAuth(
      { user: { ...baseUser, role: "admin" }, isAuthenticated: true },
      { adminOnly: true },
    );
    expect(screen.getByText("Secret content")).toBeInTheDocument();
  });
});
