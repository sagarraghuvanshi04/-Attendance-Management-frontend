import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import {
  GraduationCap, Plus, Search, Mail, Phone,
  Activity, Trash2, Edit, X, UserCheck, ChevronRight
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const ManageTeachers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All Roles");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const res = await api.get("/staff");
        setStaff(res.data.staff || []);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  const [formData, setFormData] = useState({
    name: "", email: "", role: "", phone: "", shift: "Full Day", salary: ""
  });

  const openAddModal = () => {
    setIsEdit(false);
    setFormData({ name: "", email: "", role: "", phone: "", shift: "Full Day", salary: "" });
    setShowModal(true);
  };

  const openEditModal = (e, person) => {
    e.stopPropagation();
    setIsEdit(true);
    setFormData(person);
    setShowModal(true);
  };

  const handleDelete = async (e, staffId) => {
    e.stopPropagation();
    if (window.confirm("Remove this staff member?")) {
      try {
        await api.delete(`/staff/${staffId}`);
        setStaff(prev => prev.filter(s => s.staffId !== staffId));
        toast.success("Staff deleted successfully!");
      } catch (err) {
        toast.error("Failed to delete staff");
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.role || !formData.email || !formData.salary) {
      return toast.error("Please fill all required fields: Name, Email, Role, Salary!");
    }

    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/staff/update/${formData.staffId}`, formData);
        toast.success("Staff updated successfully!");
        setStaff(prev => prev.map(s => s.staffId === formData.staffId ? { ...formData } : s));
      } else {
        const res = await api.post("/staff/create", formData);
        toast.success(`Staff created! ID: ${res.data.staffId}`);
        const fetchRes = await api.get("/staff");
        setStaff(fetchRes.data.staff || []);
      }
      setShowModal(false);
    } catch (error) {
      console.error("Staff submission error:", error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(person => {
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All Roles" || person.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800">Staff Directory</h2>
          <p className="text-slate-500 font-medium">Coordinate your library operations team.</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-slate-900 text-white px-7 py-4 rounded-[1.5rem] font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
          <Plus size={20} /> Add Staff Member
        </button>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatWidget label="Total Staff" value={staff.length} icon={<GraduationCap />} color="text-indigo-600" bg="bg-indigo-50" />
        <StatWidget label="Active Now" value={staff.filter(p => p.status === "On Duty").length} icon={<Activity />} color="text-emerald-600" bg="bg-emerald-50" />
        <StatWidget label="System Roles" value="04" icon={<UserCheck />} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-[2.5rem] flex flex-col md:flex-row gap-4 shadow-sm border border-slate-50">
        <div className="flex-1 bg-slate-50 rounded-2xl px-5 flex items-center gap-3 border border-transparent focus-within:border-indigo-100 transition-all">
          <Search size={18} className="text-slate-400" />
          <input
            className="bg-transparent w-full py-4 font-bold outline-none"
            placeholder="Search staff by name or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-50 px-6 py-4 rounded-2xl font-black text-slate-700 outline-none border border-transparent focus:border-indigo-100"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
        >
          <option>All Roles</option>
          <option>Librarian</option>
          <option>Management</option>
          <option>Security</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50">
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <th className="p-6">Staff Member</th>
                <th>Shift</th>
                <th>Contact info</th>
                <th>Status</th>
                <th className="text-right pr-10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStaff.map(person => (
                <tr 
                  key={person._id} 
                  onClick={() => navigate(`/admin/staff/${person.staffId}`)} // Redirect Logic
                  className="group cursor-pointer hover:bg-indigo-50/30 transition-all"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-indigo-600 group-hover:bg-white transition-colors">
                        {person.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800">{person.name}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{person.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-bold text-slate-600">{person.shift}</td>
                  <td>
                    <div className="text-xs space-y-1">
                       <p className="flex items-center gap-1.5 font-bold text-slate-500"><Mail size={12}/> {person.email}</p>
                       <p className="flex items-center gap-1.5 font-bold text-slate-500"><Phone size={12}/> {person.phone}</p>
                    </div>
                  </td>
                  <td><StatusIndicator status={person.status} /></td>
                  <td className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={(e) => openEditModal(e, person)} 
                        className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, person.staffId)} 
                        className="p-2.5 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="p-2.5 text-slate-300 group-hover:text-indigo-600 transition-colors">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal ... (same as your previous code with handleChange) */}
      {showModal && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-[3rem] p-10 w-full max-w-xl relative animate-in zoom-in duration-300">
                <button onClick={() => setShowModal(false)} className="absolute right-8 top-8 p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
                <h3 className="text-3xl font-black mb-8 text-slate-800">
                  {isEdit ? "Update Details" : "New Registration"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ModalInput name="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} label="Full Name *" placeholder="Enter full name" />
                  <ModalInput name="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} label="Email *" placeholder="staff@example.com" />
                  <ModalInput name="role" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} label="Role *" placeholder="Librarian, Security, etc." />
                  <ModalInput name="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} label="Phone Number" placeholder="9876543210" />
                  <ModalInput name="salary" type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} label="Monthly Salary (₹) *" placeholder="15000" />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Shift</label>
                    <select name="shift" value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all">
                      <option>Morning</option>
                      <option>Evening</option>
                      <option>Full Day</option>
                    </select>
                  </div>
                  <button onClick={handleSubmit}
                    disabled={loading}
                    className="md:col-span-2 mt-4 bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      isEdit ? "Save Changes" : "Complete Registration"
                    )}
                  </button>
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

// --- SUB COMPONENTS ---
const StatWidget = ({ label, value, icon, color, bg }) => (
  <div className="bg-white p-6 rounded-[2.5rem] flex items-center gap-5 border border-slate-50 shadow-sm">
    <div className={`h-16 w-16 ${bg} ${color} rounded-[1.5rem] flex items-center justify-center shadow-inner`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const StatusIndicator = ({ status }) => (
  <div className="flex items-center gap-2">
    <div className={`h-2 w-2 rounded-full ${status === "On Duty" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></div>
    <span className={`text-[10px] font-black uppercase tracking-widest ${status === "On Duty" ? "text-emerald-600" : "text-amber-600"}`}>
      {status}
    </span>
  </div>
);

const ModalInput = ({ label, name, value, onChange, type, placeholder }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{label}</label>
    <input
      type={type || "text"}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-50 rounded-2xl px-5 py-4 font-bold outline-none border-2 border-transparent focus:border-indigo-100 focus:bg-white transition-all"
    />
  </div>
);

export default ManageTeachers;