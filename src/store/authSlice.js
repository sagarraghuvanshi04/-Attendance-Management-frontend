import { createSlice } from "@reduxjs/toolkit";

const stored = localStorage.getItem("workUser");
const initialUser = stored ? JSON.parse(stored) : null;
const initialToken = localStorage.getItem("workToken") || null;

const authSlice = createSlice({
  name: "auth",
  initialState: { user: initialUser, token: initialToken },
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.token = payload.token;
      localStorage.setItem("workToken", payload.token);
      localStorage.setItem("workUser", JSON.stringify(payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("workToken");
      localStorage.removeItem("workUser");
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
export default authSlice.reducer;
