import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Edit2, X,
  Phone, Calendar, User, Hash, ArrowRight, CreditCard, MapPin
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

const Students = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // ---------------- FETCH STUDENTS ----------------
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get("/students", { params: { page: 1, limit: 50 } });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error("Failed to load students", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ---------------- MODAL HANDLERS ----------------
  const openEditModal = (student, e) => {
    e.stopPropagation();
    setSelectedStudent(student);
    setShowModal(true);
  };

  // ---------------- TOGGLE STATUS ----------------
  const toggleStatus = async (student, e) => {
    e.stopPropagation();
    const newStatus = student.status === "Active" ? "Inactive" : "Active";

    try {
      await api.put(`/students/update/${student.studentId}`, { status: newStatus });
      setStudents(prev =>
        prev.map(s => s.studentId === student.studentId ? { ...s, status: newStatus } : s)
      );
      toast.success(`Student ${newStatus === 'Active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update status!");
    }
  };

  // ---------------- FILTER STUDENTS ----------------
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.seat?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading && students.length === 0) {
    return <Loader message="Loading Students..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Student Directory</h2>
          <p className="text-slate-500 font-medium">View and manage student records</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 flex items-center bg-white rounded-2xl px-6 shadow-sm border border-slate-100">
          <Search className="text-slate-400" size={20} />
          <input
            className="w-full p-4 outline-none font-medium text-slate-600"
            placeholder="Search by Name, ID or Seat..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="px-8 py-4 bg-white rounded-2xl font-bold flex items-center gap-2 border border-slate-100 shadow-sm text-slate-600 hover:bg-slate-50">
            <Filter size={18} /> {statusFilter}
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 shadow-lg rounded-xl z-10">
              {["All", "Active", "Inactive"].map(status => (
                <button
                  key={status}
                  className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-all"
                  onClick={() => {
                    setStatusFilter(status);
                    setShowFilterDropdown(false);
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50">
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="p-6 text-center">Info</th>
              <th>Student Details</th>
              <th>Seat & Shift</th>
              <th>Aadhar</th>
              <th>Status</th>
              <th>Expiry</th>
              <th className="text-right p-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStudents.map(s => (
              <tr key={s._id} onClick={() => navigate(`/staff/student/${s.studentId}`)}
                className={`hover:bg-indigo-50/50 transition-all group cursor-pointer ${s.status === 'Inactive' ? 'opacity-50' : ''}`}>
                <td className="p-6">
                  <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black mx-auto group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {s.name?.charAt(0)}
                  </div>
                </td>
                <td>
                  <p className="font-black text-slate-800">{s.name}</p>
                  <p className="text-xs text-slate-400 font-bold">{s.studentId} • {s.email}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{s.course} - {s.year}</p>
                </td>
                <td>
                  <p className="text-sm font-black text-slate-700 flex items-center gap-1.5 uppercase">
                    <Hash size={14} className="text-indigo-400" /> {s.seat || 'N/A'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.shift || 'N/A'}</p>
                </td>
                <td>
                  <div className="flex items-center gap-2 text-slate-500 font-mono font-bold text-xs bg-slate-100 px-3 py-1 rounded-lg w-fit">
                    **** {s.aadharLast4 || '0000'}
                  </div>
                </td>
                <td><StatusBadge status={s.status || 'Active'} /></td>
                <td>
                  <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                    <Calendar size={14} className="text-slate-400" /> {s.expiry ? new Date(s.expiry).toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => openEditModal(s, e)} className="p-3 bg-white text-slate-600 rounded-xl shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => toggleStatus(s, e)} className={`p-3 rounded-xl shadow-sm border ${s.status === 'Active' ? 'bg-rose-50 text-rose-500 border-rose-100 hover:bg-rose-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'} transition-all`}>
                      {s.status === 'Active' ? 'Inactive' : 'Activate'}
                    </button>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && selectedStudent && (
        <EditStudentModal 
          student={selectedStudent}
          setShowModal={setShowModal}
          fetchStudents={fetchStudents}
        />
      )}
    </div>
  );
};

// ---------- Sub-components ----------
const StatusBadge = ({ status }) => {
  const map = {
    Active: "bg-emerald-50 text-emerald-600 border-emerald-100",
    Inactive: "bg-rose-50 text-rose-600 border-rose-100"
  };
  return <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${map[status]}`}>{status}</span>;
};

const InputGroup = ({ icon, label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      <input {...props} className="w-full bg-slate-50 p-4 pl-12 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all text-slate-700" />
    </div>
  </div>
);

// ---------- Edit Student Modal ----------
const EditStudentModal = ({ student, setShowModal, fetchStudents }) => {
  const [formData, setFormData] = useState({
    name: student.name || "",
    email: student.email || "",
    phone: student.phone || "",
    course: student.course || "",
    year: student.year || "",
    seat: student.seat || "",
    shift: student.shift || "Full Day (8 AM - 8 PM)",
    address: student.address || "",
    aadharLast4: student.aadharLast4 || ""
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "aadharLast4" && value.length > 4) return;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await api.put(`/students/update/${student.studentId}`, formData);
      toast.success("Student updated successfully!");
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Student update error:", error);
      toast.error(error.response?.data?.message || "Failed to update student!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[3rem] p-8 md:p-12 w-full max-w-3xl shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Edit Student</h3>
            <p className="text-slate-400 font-bold text-sm">Student ID: {student.studentId}</p>
          </div>
          <button onClick={() => setShowModal(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputGroup icon={<User size={18}/>} label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
          <InputGroup icon={<User size={18}/>} label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <InputGroup icon={<Phone size={18}/>} label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
          <InputGroup icon={<CreditCard size={18}/>} label="Course" name="course" value={formData.course} onChange={handleChange} required />
          <InputGroup icon={<Calendar size={18}/>} label="Year" name="year" value={formData.year} onChange={handleChange} required />
          <InputGroup icon={<Hash size={18}/>} label="Seat Number" name="seat" value={formData.seat} onChange={handleChange} required />
          <InputGroup icon={<CreditCard size={18}/>} label="Aadhar (Last 4)" name="aadharLast4" value={formData.aadharLast4} onChange={handleChange} maxLength="4" />
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Timing</label>
            <select name="shift" value={formData.shift} onChange={handleChange} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all">
              <option>Morning (8 AM - 2 PM)</option>
              <option>Evening (2 PM - 8 PM)</option>
              <option>Full Day (8 AM - 8 PM)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <InputGroup icon={<MapPin size={18}/>} label="Address" name="address" value={formData.address} onChange={handleChange} />
          </div>
        </div>

        <button onClick={handleSubmit} disabled={loading} className="w-full mt-10 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "Updating..." : "Update Student Profile"}
        </button>
      </div>
    </div>
  );
};

export default Students;
