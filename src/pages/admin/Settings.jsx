// src/components/Admin/Settings.jsx
import React, { useState, useEffect } from "react";
import { 
  Library, Clock, Bell, Shield, 
  Save, Globe, Mail, MapPin, 
  Moon, Sun, CheckCircle2, Lock, Eye, EyeOff, AlertTriangle
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminInfo, setAdminInfo] = useState(null);

  // Form States
  const [config, setConfig] = useState({
    libraryName: "Success Point Digital Library",
    email: "contact@libgo.com",
    phone: "+91 9876543210",
    website: "www.libgo.com",
    address: "Near Patherwa Thana Patherwa Kushinagar Uttar Pradesh 274401"
  });

  const [timings, setTimings] = useState({
    weekdays: { open: "06:00 AM", close: "11:00 PM" },
    saturday: { open: "06:00 AM", close: "10:00 PM" },
    sunday: { open: "08:00 AM", close: "04:00 PM" }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    fetchAdminProfile();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/settings");
      if (res.data.success) {
        const s = res.data.settings;
        setConfig({
          libraryName: s.libraryName,
          email: s.email,
          phone: s.phone,
          website: s.website,
          address: s.address
        });
        setTimings(s.timings);
      }
    } catch (err) {
      console.error("Failed to fetch settings:", err);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      const res = await api.get("/staff/profile");
      if (res.data.success) {
        setAdminInfo(res.data.staff);
        setConfig(prev => ({
          ...prev,
          email: res.data.staff.email || prev.email
        }));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.put("/settings", { ...config, timings });
      toast.success("Configuration updated successfully!");
    } catch (err) {
      toast.error("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return toast.error("Please fill all password fields!");
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("New passwords do not match!");
    }
    if (passwordData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters!");
    }

    try {
      setIsSaving(true);
      await api.put("/staff/change-password", {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBroadcast = async () => {
    if (!announcement.trim()) {
      return toast.error("Please enter announcement message!");
    }

    try {
      setIsSaving(true);
      await api.post("/notifications/broadcast", {
        message: announcement,
        type: "announcement"
      });
      toast.success("Announcement broadcasted to all students!");
      setAnnouncement("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to broadcast");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* --- Responsive Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Control Panel</h2>
          <p className="text-slate-500 font-medium mt-1">Configure library identity, operational hours, and security.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-black transition-all shadow-xl active:scale-95
            ${isSaving ? 'bg-emerald-500 text-white scale-95' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-indigo-100'}
          `}
        >
          {isSaving ? <CheckCircle2 size={20} className="animate-bounce" /> : <Save size={20} />}
          {isSaving ? "Saving..." : "Apply Changes"}
        </button>
      </div>

      {/* --- Tabs Navigation (Scrollable on mobile) --- */}
      <div className="flex gap-2 p-1.5 bg-slate-100 rounded-[1.5rem] w-full md:w-fit overflow-x-auto no-scrollbar">
        <TabButton active={activeTab === "general"} label="Identity" onClick={() => setActiveTab("general")} icon={<Library size={16}/>} />
        <TabButton active={activeTab === "timings"} label="Operations" onClick={() => setActiveTab("timings")} icon={<Clock size={16}/>} />
        <TabButton active={activeTab === "alerts"} label="Broadcast" onClick={() => setActiveTab("alerts")} icon={<Bell size={16}/>} />
        <TabButton active={activeTab === "security"} label="Security" onClick={() => setActiveTab("security")} icon={<Shield size={16}/>} />
      </div>

      {/* --- Main Content Area --- */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-6 md:p-10 transition-all">
        
        {/* 1. General Settings */}
        {activeTab === "general" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
               <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Library /></div>
               <h3 className="text-2xl font-black text-slate-800">Library Identity</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <InputGroup 
                  label="Library Brand Name" 
                  value={config.libraryName} 
                  onChange={(v) => setConfig({...config, libraryName: v})}
               />
               <InputGroup 
                  label="Official Contact Email" 
                  value={config.email} 
                  icon={<Mail size={18}/>}
                  onChange={(v) => setConfig({...config, email: v})}
               />
               <InputGroup 
                  label="Support Phone" 
                  value={config.phone} 
                  onChange={(v) => setConfig({...config, phone: v})}
               />
               <InputGroup 
                  label="Official Website" 
                  value={config.website} 
                  icon={<Globe size={18}/>}
                  onChange={(v) => setConfig({...config, website: v})}
               />
               <div className="md:col-span-2 space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Physical Address</label>
                  <div className="relative">
                    <textarea 
                       className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] p-5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none min-h-[120px]" 
                       value={config.address}
                       onChange={(e) => setConfig({...config, address: e.target.value})}
                    />
                    <MapPin className="absolute top-5 right-5 text-slate-300" size={20} />
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* 2. Timings */}
        {activeTab === "timings" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Clock /></div>
               <h3 className="text-2xl font-black text-slate-800">Operational Hours</h3>
            </div>
            
            <div className="grid gap-4">
               <TimingRow 
                 day="Monday - Friday" 
                 open={timings.weekdays.open} 
                 close={timings.weekdays.close}
                 onOpenChange={(v) => setTimings({...timings, weekdays: {...timings.weekdays, open: v}})}
                 onCloseChange={(v) => setTimings({...timings, weekdays: {...timings.weekdays, close: v}})}
               />
               <TimingRow 
                 day="Saturday" 
                 open={timings.saturday.open} 
                 close={timings.saturday.close}
                 onOpenChange={(v) => setTimings({...timings, saturday: {...timings.saturday, open: v}})}
                 onCloseChange={(v) => setTimings({...timings, saturday: {...timings.saturday, close: v}})}
               />
               <TimingRow 
                 day="Sunday & Holidays" 
                 open={timings.sunday.open} 
                 close={timings.sunday.close}
                 onOpenChange={(v) => setTimings({...timings, sunday: {...timings.sunday, open: v}})}
                 onCloseChange={(v) => setTimings({...timings, sunday: {...timings.sunday, close: v}})}
               />
               
               <div className="mt-6 p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-6">
                  <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                    <Sun size={32} />
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-lg font-black italic">Auto-Shutdown Notice</p>
                    <p className="text-indigo-100 text-sm font-medium opacity-80">The digital check-in system automatically locks 15 minutes after closing time.</p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* 3. Broadcast Alerts */}
        {activeTab === "alerts" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><Bell /></div>
               <h3 className="text-2xl font-black text-slate-800">Global Announcements</h3>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
                <p className="text-sm font-bold text-slate-500 mb-6 max-w-md mx-auto">This message will be visible on every student's dashboard and sent via notification.</p>
                <textarea 
                    className="w-full bg-white border-none rounded-2xl p-6 text-sm font-bold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-rose-500 min-h-[150px]" 
                    placeholder="E.g. The library will remain closed on 26th Jan for Republic Day..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                ></textarea>
                <button 
                  onClick={handleBroadcast}
                  disabled={isSaving}
                  className="mt-6 bg-rose-600 text-white px-10 py-4 rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSaving ? "Broadcasting..." : "Broadcast to All Students"}
                </button>
            </div>
          </div>
        )}

        {/* 4. Security */}
        {activeTab === "security" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center"><Shield /></div>
               <h3 className="text-2xl font-black text-slate-800">Admin Security</h3>
            </div>

            <div className="max-w-md space-y-6">
               <div className="p-4 bg-amber-50 rounded-2xl flex gap-4 border border-amber-100">
                  <AlertTriangle className="text-amber-600 shrink-0" />
                  <p className="text-xs font-bold text-amber-800">Changing your password will log you out from all other devices.</p>
               </div>
               
               <InputGroup 
                 label="Current Password" 
                 type={showPassword ? "text" : "password"} 
                 value={passwordData.currentPassword}
                 onChange={(v) => setPasswordData({...passwordData, currentPassword: v})}
                 icon={
                   <button onClick={() => setShowPassword(!showPassword)} type="button">
                     {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                   </button>
                 } 
               />
               <InputGroup 
                 label="New Password" 
                 type="password" 
                 value={passwordData.newPassword}
                 onChange={(v) => setPasswordData({...passwordData, newPassword: v})}
                 icon={<Lock size={18}/>} 
               />
               <InputGroup 
                 label="Confirm New Password" 
                 type="password" 
                 value={passwordData.confirmPassword}
                 onChange={(v) => setPasswordData({...passwordData, confirmPassword: v})}
                 icon={<Lock size={18}/>} 
               />
               <button 
                 onClick={handlePasswordChange}
                 disabled={isSaving}
                 className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                 {isSaving ? "Updating..." : "Update Password"}
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

/* --- Helper Components --- */

const TabButton = ({ label, active, onClick, icon }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black transition-all whitespace-nowrap
      ${active ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}
    `}
  >
    {icon} {label}
  </button>
);

const InputGroup = ({ label, value, onChange, icon, type = "text" }) => (
  <div className="space-y-2 group">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] group-focus-within:text-indigo-600 transition-colors">
      {label}
    </label>
    <div className="relative flex items-center">
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] px-5 py-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white transition-all outline-none"
      />
      {icon && <div className="absolute right-5 text-slate-300">{icon}</div>}
    </div>
  </div>
);

const TimingRow = ({ day, open, close, onOpenChange, onCloseChange }) => (
  <div className="flex flex-col sm:flex-row items-center justify-between p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-indigo-200 transition-all group">
    <span className="font-black text-slate-700 mb-3 sm:mb-0 group-hover:text-indigo-600 transition-colors">{day}</span>
    <div className="flex items-center gap-4 text-xs font-black">
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-slate-400 mb-1 uppercase">Opens</span>
        <input 
          type="text" 
          value={open}
          onChange={(e) => onOpenChange(e.target.value)}
          className="bg-white border border-slate-100 px-5 py-2.5 rounded-xl shadow-sm text-slate-800 text-center outline-none focus:border-indigo-500 w-28"
        />
      </div>
      <span className="text-slate-300 mt-4">—</span>
      <div className="flex flex-col items-center">
        <span className="text-[10px] text-slate-400 mb-1 uppercase">Closes</span>
        <input 
          type="text" 
          value={close}
          onChange={(e) => onCloseChange(e.target.value)}
          className="bg-white border border-slate-100 px-5 py-2.5 rounded-xl shadow-sm text-slate-800 text-center outline-none focus:border-indigo-500 w-28"
        />
      </div>
    </div>
  </div>
);

export default Settings;