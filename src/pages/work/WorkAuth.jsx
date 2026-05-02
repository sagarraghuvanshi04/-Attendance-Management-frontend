import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation, useSignupMutation } from "../../store/attendanceApi";
import { setCredentials } from "../../store/authSlice";
import toast from "react-hot-toast";

export default function WorkAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE", department: "" });
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [login, { isLoading: loginLoading }] = useLoginMutation();
  const [signup, { isLoading: signupLoading }] = useSignupMutation();
  const loading = loginLoading || signupLoading;

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      const data = isLogin ? await login(payload).unwrap() : await signup(payload).unwrap();
      dispatch(setCredentials({ user: data.user, token: data.token }));
      toast.success(isLogin ? "Welcome back!" : "Account created!");
      const role = data.user.role;
      if (role === "ADMIN") navigate("/work/admin/dashboard");
      else if (role === "MANAGER") navigate("/work/manager/dashboard");
      else navigate("/work/employee/dashboard");
    } catch (err) {
      toast.error(err.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance System</h1>
          <p className="text-gray-500 text-sm mt-1">{isLogin ? "Sign in to your account" : "Create a new account"}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <>
              <input name="name" value={form.name} onChange={handle} placeholder="Full Name" required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <input name="department" value={form.department} onChange={handle} placeholder="Department"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
              <select name="role" value={form.role} onChange={handle}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </>
          )}
          <input name="email" type="email" value={form.email} onChange={handle} placeholder="Email Address" required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <input name="password" type="password" value={form.password} onChange={handle} placeholder="Password" required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-60">
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-indigo-600 font-semibold hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 text-center">
          <p className="font-semibold text-gray-600 mb-1">Default Admin</p>
          <p>Email: admin@company.com</p>
          <p>Password: admin123</p>
        </div>
      </div>
    </div>
  );
}
