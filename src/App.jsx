import { Suspense, useState, useEffect } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 text-sm font-semibold">
      ⚠️ No internet connection — Please check your network
    </div>
  );
}

import WorkPrivateRoute from "./components/WorkPrivateRoute";
import WorkAuth from "./pages/work/WorkAuth";
import WorkLayout from "./pages/work/WorkLayout";
import PunchPage from "./pages/work/PunchPage";
import WorkNotifications from "./pages/work/WorkNotifications";

import EmployeeDashboard from "./pages/work/employee/EmployeeDashboard";
import EmployeeAttendance from "./pages/work/employee/EmployeeAttendance";
import EmployeeOvertime from "./pages/work/employee/EmployeeOvertime";
import EmployeeReports from "./pages/work/employee/EmployeeReports";

import ManagerDashboard from "./pages/work/manager/ManagerDashboard";
import TeamAttendance from "./pages/work/manager/TeamAttendance";
import OTManagement from "./pages/work/manager/OTManagement";
import AttendanceValidation from "./pages/work/manager/AttendanceValidation";
import ManagerReports from "./pages/work/manager/ManagerReports";

import AdminDashboard from "./pages/work/admin/AdminDashboard";
import ManageUsers from "./pages/work/admin/ManageUsers";
import AllAttendance from "./pages/work/admin/AllAttendance";
import AdminReports from "./pages/work/admin/AdminReports";

const Spinner = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50">
    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <>
      <OfflineBanner />
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<Spinner />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/work/login" replace />} />
          <Route path="/work/login" element={<WorkAuth />} />

          {/* Employee */}
          <Route path="/work/employee" element={
            <WorkPrivateRoute allowedRoles={["EMPLOYEE", "MANAGER", "ADMIN"]}>
              <WorkLayout />
            </WorkPrivateRoute>
          }>
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="punch" element={<PunchPage />} />
            <Route path="attendance" element={<EmployeeAttendance />} />
            <Route path="overtime" element={<EmployeeOvertime />} />
            <Route path="reports" element={<EmployeeReports />} />
            <Route path="notifications" element={<WorkNotifications />} />
          </Route>

          {/* Manager */}
          <Route path="/work/manager" element={
            <WorkPrivateRoute allowedRoles={["MANAGER", "ADMIN"]}>
              <WorkLayout />
            </WorkPrivateRoute>
          }>
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="punch" element={<PunchPage />} />
            <Route path="team" element={<TeamAttendance />} />
            <Route path="overtime" element={<OTManagement />} />
            <Route path="validate" element={<AttendanceValidation />} />
            <Route path="reports" element={<ManagerReports />} />
            <Route path="notifications" element={<WorkNotifications />} />
          </Route>

          {/* Admin */}
          <Route path="/work/admin" element={
            <WorkPrivateRoute allowedRoles={["ADMIN"]}>
              <WorkLayout />
            </WorkPrivateRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="punch" element={<PunchPage />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="attendance" element={<AllAttendance />} />
            <Route path="overtime" element={<OTManagement />} />
            <Route path="validate" element={<AttendanceValidation />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="notifications" element={<WorkNotifications />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-center p-6">
              <h1 className="text-9xl font-black text-slate-200">404</h1>
              <p className="text-xl font-bold text-slate-500 -mt-8">Page not found.</p>
              <button onClick={() => window.history.back()}
                className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition">
                Go Back
              </button>
            </div>
          } />
        </Routes>
      </Suspense>
    </>
  );
}
