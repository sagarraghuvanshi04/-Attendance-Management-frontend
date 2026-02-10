// src/App.jsx
import React, { Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Components
import PrivateRoute from "./components/PrivateRoute";

// Auth
import Login from "./pages/Auth";
import UpdatePassword from "./pages/students/UpdatePassword";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP";
import ResetPassword from "./pages/ResetPassword";

// Loading Component
const LoadingSpinner = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-indigo-600 animate-pulse uppercase tracking-widest">Loading...</p>
    </div>
  </div>
);

// Lazy load Student pages
const StudentLayout = React.lazy(() => import("./pages/students/StudentLayout"));
const Overview = React.lazy(() => import("./pages/students/Overview"));
const StudentProfile = React.lazy(() => import("./pages/students/Profile"));
const StudentAttendance = React.lazy(() => import("./pages/students/Attendance"));
const StudentPayments = React.lazy(() => import("./pages/students/Payments"));
const StudentNotifications = React.lazy(() => import("./pages/students/Notifications"));
const Security = React.lazy(() => import("./pages/students/Security"));
const ScanAttendance = React.lazy(() => import("./pages/students/ScanAttendance"));
const StudentComplaints = React.lazy(() => import("./pages/students/Complaints"));
const StudentBooks = React.lazy(() => import("./pages/students/Books"));
const StudentQuiz = React.lazy(() => import("./pages/students/Quiz"));

// Lazy load Staff pages
const StaffLayout = React.lazy(() => import("./pages/staff/StaffLayout"));
const StaffDashboard = React.lazy(() => import("./pages/staff/StaffDashboard"));
const StaffScanner = React.lazy(() => import("./pages/staff/StaffScanner"));
const StaffStudentAttendance = React.lazy(() => import("./pages/staff/StudentAttendance"));
const StaffStudents = React.lazy(() => import("./pages/staff/Students"));
const StaffPayments = React.lazy(() => import("./pages/staff/Payments"));
const StaffNotifications = React.lazy(() => import("./pages/staff/Notifications"));
const StaffProfile = React.lazy(() => import("./pages/staff/Profile"));
const StaffBooks = React.lazy(() => import("./pages/staff/Books"));
const StaffQuiz = React.lazy(() => import("./pages/staff/ManageQuiz"));
const StaffComplaints = React.lazy(() => import("./pages/staff/Complaints"));
const MyAttendance = React.lazy(() => import("./pages/staff/MyAttendance"));

// Lazy load Admin pages
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout"));
const AdminDashboard = React.lazy(() => import("./pages/admin/Dashboard"));
const ManageStudents = React.lazy(() => import("./pages/admin/ManageStudents"));
const ManageTeachers = React.lazy(() => import("./pages/admin/ManageStaff"));
const ManagePayments = React.lazy(() => import("./pages/admin/ManagePayments"));
const Reports = React.lazy(() => import("./pages/admin/Reports"));
const Settings = React.lazy(() => import("./pages/admin/Settings"));
const Attendance = React.lazy(() => import("./pages/admin/Attendance"));
const Notifications = React.lazy(() => import("./pages/admin/Notifications"));
const ManageBooks = React.lazy(() => import("./pages/admin/ManageBooks"));
const ManageQuiz = React.lazy(() => import("./pages/admin/ManageQuiz"));
const FeeManagement = React.lazy(() => import("./pages/admin/FeeManagement"));
const AdminComplaints = React.lazy(() => import("./pages/admin/Complaints"));
const AdminProfile = React.lazy(() => import("./pages/admin/Profile"));
const PaymentReminders = React.lazy(() => import("./pages/admin/PaymentReminders"));
const AttendanceView = React.lazy(() => import("./pages/admin/AttendanceView"));

// Shared Details
const StudentDetail = React.lazy(() => import("./pages/admin/StudentDetail"));
const StaffDetail = React.lazy(() => import("./pages/admin/StaffDetail"));

const App = () => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* --- Public & Auth --- */}
          <Route path="/" element={<Login />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* --- Student Dashboard --- */}
          <Route
            path="/student/*"
            element={
              <PrivateRoute allowedRoles={["STUDENT"]}>
                <StudentLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="scan-attendance" element={<ScanAttendance />} />
            <Route path="payments" element={<StudentPayments />} />
            <Route path="books" element={<StudentBooks />} />
            <Route path="quiz" element={<StudentQuiz />} />
            <Route path="notifications" element={<StudentNotifications />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="security" element={<Security />} />
          </Route>

          {/* --- Staff Dashboard --- */}
          <Route
            path="/staff/*"
            element={
              <PrivateRoute allowedRoles={["STAFF"]}>
                <StaffLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="attendance" element={<StaffStudentAttendance />} />
            <Route path="scanner" element={<StaffScanner />} />
            <Route path="students" element={<StaffStudents />} />
            <Route path="student/:id" element={<StudentDetail />} />
            <Route path="payments" element={<StaffPayments />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="complaints" element={<StaffComplaints />} />
            <Route path="books" element={<StaffBooks />} />
            <Route path="quiz" element={<StaffQuiz />} />
            <Route path="my-attendance" element={<MyAttendance />} />
            <Route path="profile" element={<StaffProfile />} />
          </Route>

          {/* --- Admin Dashboard --- */}
          <Route
            path="/admin/*"
            element={
              <PrivateRoute allowedRoles={["ADMIN"]}>
                <AdminLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="teachers" element={<ManageTeachers />} />
            <Route path="staff/:id" element={<StaffDetail />} />
            <Route path="payments" element={<ManagePayments />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="attendance-view" element={<AttendanceView />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="complaints" element={<AdminComplaints />} />
            <Route path="books" element={<ManageBooks />} />
            <Route path="quiz" element={<ManageQuiz />} />
            <Route path="fee-management" element={<FeeManagement />} />
            <Route path="payment-reminders" element={<PaymentReminders />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* --- 404 Redirect --- */}
          <Route
            path="*"
            element={
              <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
                <h1 className="text-9xl font-black text-slate-200">404</h1>
                <p className="text-xl font-bold text-slate-500 -mt-8">
                  Oops! Page not found.
                </p>
                <button
                  onClick={() => window.history.back()}
                  className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
                >
                  Go Back
                </button>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
};

export default App;
