import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("workToken");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Wrap base query to handle network errors gracefully
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  try {
    const result = await baseQuery(args, api, extraOptions);
    if (result.error?.status === "FETCH_ERROR") {
      return { error: { status: "FETCH_ERROR", data: { message: "No internet connection. Please check your network and try again." } } };
    }
    return result;
  } catch {
    return { error: { status: "FETCH_ERROR", data: { message: "Network error. Please check your connection." } } };
  }
};

export const attendanceApi = createApi({
  reducerPath: "attendanceApi",
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ["Attendance", "Users", "OT", "Report", "Notifications"],
  endpoints: (builder) => ({
    // ── Auth ──────────────────────────────────────────────
    login: builder.mutation({
      query: (body) => ({ url: "/work/auth/login", method: "POST", body }),
    }),
    signup: builder.mutation({
      query: (body) => ({ url: "/work/auth/signup", method: "POST", body }),
    }),
    getMe: builder.query({
      query: () => "/work/auth/me",
    }),

    // ── Attendance ────────────────────────────────────────
    getTodayStatus: builder.query({
      query: () => "/work/attendance/today",
      providesTags: ["Attendance"],
    }),
    punchIn: builder.mutation({
      query: (body) => ({ url: "/work/attendance/punch-in", method: "POST", body }),
      invalidatesTags: ["Attendance"],
    }),
    punchOut: builder.mutation({
      query: (body) => ({ url: "/work/attendance/punch-out", method: "POST", body }),
      invalidatesTags: ["Attendance"],
    }),
    getMyAttendance: builder.query({
      query: (params = {}) => ({ url: "/work/attendance/my", params }),
      providesTags: ["Attendance"],
    }),

    // ── Overtime ──────────────────────────────────────────
    requestOT: builder.mutation({
      query: (body) => ({ url: "/work/attendance/ot-request", method: "POST", body }),
      invalidatesTags: ["Attendance", "OT"],
    }),
    getPendingOT: builder.query({
      query: () => "/work/attendance/ot-pending",
      providesTags: ["OT"],
    }),
    handleOT: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/work/attendance/ot/${id}`, method: "PUT", body }),
      invalidatesTags: ["OT", "Attendance"],
    }),

    // ── Validation ────────────────────────────────────────
    validateAttendance: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/work/attendance/validate/${id}`, method: "PUT", body }),
      invalidatesTags: ["Attendance"],
    }),

    // ── Manager ───────────────────────────────────────────
    getTeamAttendance: builder.query({
      query: (params = {}) => ({ url: "/work/attendance/team", params }),
      providesTags: ["Attendance"],
    }),

    // ── Admin ─────────────────────────────────────────────
    getAllAttendance: builder.query({
      query: (params = {}) => ({ url: "/work/attendance/all", params }),
      providesTags: ["Attendance"],
    }),
    getAllUsers: builder.query({
      query: () => "/work/attendance/users",
      providesTags: ["Users"],
    }),
    createUser: builder.mutation({
      query: (body) => ({ url: "/work/auth/signup", method: "POST", body }),
      invalidatesTags: ["Users"],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/work/attendance/users/${id}`, method: "PUT", body }),
      invalidatesTags: ["Users"],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({ url: `/work/attendance/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
    getNotifications: builder.query({
      query: () => "/work/notifications",
      providesTags: ["Notifications"],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({ url: `/work/notifications/${id}/read`, method: "PUT" }),
      invalidatesTags: ["Notifications"],
    }),
    markAllNotificationsRead: builder.mutation({
      query: () => ({ url: "/work/notifications/read-all", method: "PUT" }),
      invalidatesTags: ["Notifications"],
    }),

    // ── Reports ───────────────────────────────────────────
    getDailyReport: builder.query({
      query: (params = {}) => ({ url: "/work/attendance/report/daily", params }),
      providesTags: ["Report"],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetMeQuery,
  useGetTodayStatusQuery,
  usePunchInMutation,
  usePunchOutMutation,
  useGetMyAttendanceQuery,
  useRequestOTMutation,
  useGetPendingOTQuery,
  useHandleOTMutation,
  useValidateAttendanceMutation,
  useGetTeamAttendanceQuery,
  useGetAllAttendanceQuery,
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetDailyReportQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = attendanceApi;
