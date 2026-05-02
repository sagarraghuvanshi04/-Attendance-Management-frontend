import { configureStore } from "@reduxjs/toolkit";
import { attendanceApi } from "./attendanceApi";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(attendanceApi.middleware),
});
