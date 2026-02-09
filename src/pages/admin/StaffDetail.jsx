// src/pages/admin/StaffDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Phone, Mail, MapPin, Briefcase, 
  ShieldCheck, Banknote, Clock, Save, X, Download, UserPlus
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const StaffDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      try {
        const res = await api.get(`/staff/${id}`);
        setStaffData(res.data.staff);
      } catch (err) {
        console.error("Error fetching staff:", err);
        toast.error("Failed to load staff data");
      } finally {
        setLoading(false);
      }
    };
    fetchStaffData();
  }, [id]);

  // ---------------- HANDLERS ----------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaffData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await api.put(`/staff/update/${id}`, staffData);
      toast.success("Staff updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Failed to update staff");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadSalary = () => {
    const data = "Date,Month,Amount,Status\n01-Jan-2026,January,15000,Paid\n01-Dec-2025,December,15000,Paid";
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Salary_Report_${staffData.name}.csv`;
    a.click();
  };

  const generateIDCard = () => {
    const card = document.createElement('div');
    card.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:350px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:20px;padding:30px;box-shadow:0 20px 60px rgba(0,0,0,0.3);z-index:9999;font-family:Arial,sans-serif;';
    
    card.innerHTML = `
      <div style="background:white;border-radius:15px;padding:25px;text-align:center;">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);width:100px;height:100px;border-radius:50%;margin:0 auto 15px;display:flex;align-items:center;justify-content:center;font-size:40px;color:white;font-weight:bold;">
          ${staffData.name?.charAt(0) || 'S'}
        </div>
        <h2 style="margin:10px 0;color:#1e293b;font-size:24px;font-weight:800;">${staffData.name || 'N/A'}</h2>
        <p style="color:#64748b;font-size:14px;font-weight:600;margin:5px 0;">${staffData.role || 'Staff'}</p>
        <div style="background:#f1f5f9;padding:15px;border-radius:10px;margin:20px 0;">
          <p style="color:#475569;font-size:12px;font-weight:700;margin:5px 0;">Staff ID</p>
          <p style="color:#0f172a;font-size:20px;font-weight:900;font-family:monospace;">${staffData.staffId || 'N/A'}</p>
        </div>
        <div style="display:flex;justify-content:space-between;margin:15px 0;">
          <div style="flex:1;">
            <p style="color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;">Shift</p>
            <p style="color:#1e293b;font-size:13px;font-weight:700;">${staffData.shift || 'N/A'}</p>
          </div>
          <div style="flex:1;">
            <p style="color:#94a3b8;font-size:10px;font-weight:700;text-transform:uppercase;">Status</p>
            <p style="color:${staffData.isActive ? '#10b981' : '#ef4444'};font-size:13px;font-weight:700;">${staffData.isActive ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
        <div style="border-top:2px dashed #e2e8f0;padding-top:15px;margin-top:15px;">
          <p style="color:#64748b;font-size:11px;font-weight:600;">SUCCESS POINT LIBRARY</p>
          <p style="color:#94a3b8;font-size:10px;margin-top:5px;">Valid from ${staffData.createdAt ? new Date(staffData.createdAt).toLocaleDateString() : 'N/A'}</p>
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="position:absolute;top:10px;right:10px;background:white;border:none;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:18px;color:#64748b;font-weight:bold;">×</button>
      <button onclick="window.print();this.parentElement.remove()" style="width:100%;margin-top:15px;background:white;color:#667eea;border:none;padding:12px;border-radius:10px;font-weight:800;cursor:pointer;font-size:14px;">🖨️ Print ID Card</button>
    `;
    
    document.body.appendChild(card);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-indigo-600 font-bold text-xl">Loading staff data...</div>;
  }

  if (!staffData) {
    return <div className="flex items-center justify-center min-h-screen text-rose-600 font-bold text-xl">Staff not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-all">
          <ArrowLeft size={20} /> Back to Staff List
        </button>
        <div className="flex gap-3">
          {isEditing ? (
            <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <><Save size={18} /> Save Staff Info</>
              )}
            </button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all">Edit Details</button>
          )}
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-50 flex flex-col md:flex-row gap-8 items-center">
        <div className="h-32 w-32 bg-rose-500 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-xl shadow-rose-100">
          {staffData.name?.charAt(0) || 'S'}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <h2 className="text-4xl font-black text-slate-800">{staffData.name || 'N/A'}</h2>
            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${staffData.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              {staffData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 font-bold">
            <span className="flex items-center gap-1.5"><Briefcase size={16} className="text-rose-400"/> {staffData.role || 'N/A'}</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-rose-400"/> Staff ID: {staffData.staffId || 'N/A'}</span>
          </div>
        </div>
        <div className="text-center md:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined On</p>
            <p className="text-2xl font-black text-slate-800">{staffData.createdAt ? new Date(staffData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-100">
        {["profile", "payroll"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === tab ? "border-b-4 border-rose-500 text-rose-500" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === "profile" && (
          <>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <StaffInfoCard isEditing={isEditing} label="Phone Number" name="phone" value={staffData.phone || 'N/A'} onChange={handleInputChange} icon={<Phone/>} />
              <StaffInfoCard isEditing={isEditing} label="Email Address" name="email" value={staffData.email || 'N/A'} onChange={handleInputChange} icon={<Mail/>} />
              <StaffInfoCard isEditing={isEditing} label="Shift Timing" name="shift" value={staffData.shift || 'N/A'} onChange={handleInputChange} icon={<Clock/>} />
              <StaffInfoCard isEditing={isEditing} label="Role" name="role" value={staffData.role || 'N/A'} onChange={handleInputChange} icon={<Briefcase/>} />
            </div>
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
              <h4 className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-6">Employment Info</h4>
              <div className="space-y-4">
                <div className="flex justify-between"><span className="text-slate-400">Staff ID</span><span className="font-bold">{staffData.staffId || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Role</span><span className="font-bold">{staffData.role || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Shift</span><span className="font-bold">{staffData.shift || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Status</span><span className={`font-bold ${staffData.isActive ? 'text-emerald-400' : 'text-rose-400'}`}>{staffData.isActive ? 'Active' : 'Inactive'}</span></div>
                <div className="pt-4 border-t border-slate-800">
                  <button onClick={generateIDCard} className="w-full py-3 bg-rose-500 rounded-xl font-bold hover:bg-rose-600 transition-all">Generate ID Card</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "payroll" && (
          <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-800">Salary History</h3>
              <button onClick={handleDownloadSalary} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all">
                <Download size={16}/> Export Payroll (.CSV)
              </button>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, idx) => {
                const month = new Date();
                month.setMonth(month.getMonth() - idx);
                return (
                  <div key={idx} className="flex justify-between items-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-rose-500 shadow-sm"><Banknote size={20}/></div>
                      <div>
                        <p className="font-black text-slate-800">{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Salary</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Released on {month.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-emerald-600">₹{staffData.salary || 15000}</p>
                      <span className="text-[10px] font-black text-slate-400 uppercase underline cursor-pointer">View Payslip</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StaffInfoCard = ({ icon, label, value, isEditing, name, onChange, isSelect, options }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-5 shadow-sm transition-all hover:border-rose-100">
    <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      {isEditing ? (
        isSelect ? (
          <select name={name} value={value} onChange={onChange} className="w-full font-black text-slate-800 outline-none bg-rose-50 rounded-lg px-2 py-1 border-b-2 border-rose-500">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        ) : (
          <input name={name} value={value} onChange={onChange} className="w-full font-black text-slate-800 outline-none bg-rose-50 rounded-lg px-2 py-1 border-b-2 border-rose-500" />
        )
      ) : (
        <p className="text-lg font-black text-slate-800 truncate">{value}</p>
      )}
    </div>
  </div>
);

export default StaffDetail;