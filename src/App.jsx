// src/App.jsx
import React from "react";
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

// Student
import StudentLayout from "./pages/students/StudentLayout";
import Overview from "./pages/students/Overview";
import StudentProfile from "./pages/students/Profile";
import StudentAttendance from "./pages/students/Attendance";
import StudentPayments from "./pages/students/Payments";
import StudentNotifications from "./pages/students/Notifications";
import Security from "./pages/students/Security";
import ScanAttendance from "./pages/students/ScanAttendance";
import StudentComplaints from "./pages/students/Complaints";
import StudentBooks from "./pages/students/Books";
import StudentQuiz from "./pages/students/Quiz";

// Staff
import StaffLayout from "./pages/staff/StaffLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffScanner from "./pages/staff/StaffScanner"; 
import StaffStudentAttendance from "./pages/staff/StudentAttendance"; 
import StaffStudents from "./pages/staff/Students"; 
import StaffPayments from "./pages/staff/Payments"; 
import StaffNotifications from "./pages/staff/Notifications"; 
import StaffProfile from "./pages/staff/Profile";
import StaffBooks from "./pages/staff/Books";
import StaffQuiz from "./pages/staff/ManageQuiz";
import StaffComplaints from "./pages/staff/Complaints";
import MyAttendance from "./pages/staff/MyAttendance";

// Admin
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageStudents from "./pages/admin/ManageStudents";
import ManageTeachers from "./pages/admin/ManageStaff";
import ManagePayments from "./pages/admin/ManagePayments";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";
import Attendance from "./pages/admin/Attendance";
import Notifications from "./pages/admin/Notifications";
import ManageBooks from "./pages/admin/ManageBooks";
import ManageQuiz from "./pages/admin/ManageQuiz";
import FeeManagement from "./pages/admin/FeeManagement";
import AdminComplaints from "./pages/admin/Complaints";
import AdminProfile from "./pages/admin/Profile";
import PaymentReminders from "./pages/admin/PaymentReminders";
import AttendanceView from "./pages/admin/AttendanceView";

// Shared Details
import StudentDetail from "./pages/admin/StudentDetail";
import StaffDetail from "./pages/admin/StaffDetail";

const App = () => {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
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
    </>
  );
};

export default App;
