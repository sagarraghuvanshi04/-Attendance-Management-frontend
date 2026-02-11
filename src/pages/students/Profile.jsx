import React, { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import api from "../../services/api";
import { User, Phone, Armchair, Clock, ShieldCheck, Mail, Check, X, Camera, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import Loader from "../../components/Loader";

const Profile = () => {
  const fileInputRef = useRef(null);
  const qrRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    seat: "",
    shift: "",
    profilePic: null,
    attendance: 0,
    lateMarks: 0,
    status: "Inactive",
  });
  const [redirect, setRedirect] = useState(false);

  // ------------------- Check login -------------------
  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      setRedirect(true); // redirect to login
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (!user.role || user.role.toUpperCase() !== "STUDENT") {
        localStorage.removeItem("studentToken");
        localStorage.removeItem("user");
        setRedirect(true);
        return;
      }
    } catch {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("user");
      setRedirect(true);
      return;
    }

    fetchProfile();
  }, []);

  // ------------------- Redirect if not logged in -------------------
  if (redirect) return <Navigate to="/" replace />;

  // ------------------- Fetch profile from backend -------------------
  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/students/profile");
      const student = data.student || data;

      setStudentId(student.studentId || "");

      const mappedData = {
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || "",
        seat: student.seat || "N/A",
        shift: student.shift || "N/A",
        profilePic: student.profilePic || null,
        attendance: student.attendance?.percentage || 0,
        lateMarks: student.attendance?.lateMarks || 0,
        status: student.status || "Active",
        role: "STUDENT",
      };

      setUserData(mappedData);
      localStorage.setItem("user", JSON.stringify(mappedData));
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      alert("Failed to fetch profile from server");
      setRedirect(true);
    } finally {
      setLoading(false);
    }
  };

  // ------------------- Input Handlers -------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData({ ...userData, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // ------------------- Save updated profile -------------------
  const handleSave = async () => {
    try {
      const { data } = await api.put("/students/update-profile", userData);
      const updatedProfile = data.student || userData;

      setUserData(updatedProfile);
      localStorage.setItem("user", JSON.stringify({ ...updatedProfile, role: "STUDENT" }));

      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleDownloadQR = () => {
    if (!studentId) {
      toast.error("Student ID not loaded");
      return;
    }

    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 400;
    canvas.height = 500;

    img.onload = () => {
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw QR code
      ctx.drawImage(img, 50, 50, 300, 300);

      // Add text
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(userData.name, 200, 380);

      ctx.font = '20px Arial';
      ctx.fillStyle = '#4f46e5';
      ctx.fillText(studentId, 200, 410);

      ctx.font = '16px Arial';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Seat: ${userData.seat} | Shift: ${userData.shift}`, 200, 440);

      ctx.font = 'bold 14px Arial';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Scan this QR for attendance', 200, 470);

      // Download
      const link = document.createElement('a');
      link.download = `${studentId}_Attendance_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('QR Code downloaded!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) return <Loader message="Loading Profile..." />;

  return (
    <div className="p-4 md:p-6 mx-auto space-y-6 animate-in fade-in duration-500 max-w-6xl">
      {/* --- Profile Card --- */}
      <div className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Banner Section */}
        <div className="h-24 md:h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
          <div className="absolute -bottom-10 md:-bottom-12 left-4 md:left-8">
            <div className="group relative h-20 w-20 md:h-24 md:w-24 rounded-2xl md:rounded-3xl bg-white p-1.5 shadow-xl">
              {/* Photo Display */}
              <div className="h-full w-full rounded-xl md:rounded-[1.2rem] bg-slate-100 flex items-center justify-center overflow-hidden">
                {userData.profilePic ? (
                  <img 
                    src={userData.profilePic} 
                    alt="Profile" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span className="text-indigo-600 font-black text-2xl md:text-3xl">
                    {userData.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>

              {/* Upload Trigger */}
              {isEditing && (
                <div 
                  onClick={() => fileInputRef.current.click()}
                  className="absolute inset-0 bg-black/40 rounded-xl md:rounded-[1.2rem] flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={20} />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="pt-14 md:pt-16 pb-6 md:pb-8 px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight border-b-2 border-indigo-500 outline-none bg-slate-50 px-2 rounded-md w-full"
                />
              ) : (
                <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">{userData.name}</h2>
              )}
              <p className="text-sm md:text-base text-slate-500 font-medium flex items-center gap-1 mt-1">
                <ShieldCheck size={16} className="text-emerald-500" /> Verified Premium Member
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button 
                onClick={handleDownloadQR}
                className="p-2.5 rounded-xl md:rounded-2xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-all"
                title="Download Attendance QR Code"
              >
                <Download size={20} />
              </button>
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="p-2.5 rounded-xl md:rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all">
                    <X size={20} />
                  </button>
                  <button onClick={handleSave} className="flex items-center gap-2 bg-indigo-600 text-white px-4 md:px-5 py-2.5 rounded-xl md:rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                    <Check size={18} /> Save
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-slate-900 text-white px-4 md:px-6 py-2.5 rounded-xl md:rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-6 md:mt-10">
            <ProfileCard 
              isEditing={isEditing}
              name="email"
              icon={<Mail className="text-indigo-500" size={18} />} 
              label="Email Address" 
              value={userData.email}
              onChange={handleChange}
            />
            <ProfileCard 
              isEditing={isEditing}
              name="phone"
              icon={<Phone className="text-blue-500" size={18} />} 
              label="Phone Number" 
              value={userData.phone}
              onChange={handleChange}
            />
            <ProfileCard 
              isEditing={false} 
              name="seat"
              icon={<Armchair className="text-purple-500" size={18} />} 
              label="Assigned Seat" 
              value={userData.seat}
            />
            <ProfileCard 
              isEditing={false} 
              name="shift"
              icon={<Clock className="text-emerald-500" size={18} />} 
              label="Timing Shift" 
              value={userData.shift}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatBox label="Attendance" value={`${userData.attendance}%`} color="indigo" />
        <StatBox label="Late Marks" value={userData.lateMarks} color="purple" />
        <StatBox label="Status" value={userData.status} color="emerald" />
      </div>

      {/* Hidden QR Code for download */}
      <div ref={qrRef} className="hidden">
        {studentId && (
          <QRCodeSVG 
            value={studentId}
            size={300}
            level="H"
            includeMargin={true}
          />
        )}
      </div>
    </div>
  );
};

/* --- Subcomponents --- */
const ProfileCard = ({ icon, label, value, isEditing, name, onChange }) => (
  <div className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-[1.5rem] border transition-all ${isEditing ? "bg-white border-indigo-200 shadow-sm" : "bg-slate-50 border-transparent"}`}>
    <div className="p-2 md:p-3 bg-white rounded-lg md:rounded-xl shadow-sm">{icon}</div>
    <div className="flex-1 min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        {isEditing ? (
          <input 
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-transparent text-xs md:text-sm font-bold text-slate-700 outline-none border-b border-indigo-100 focus:border-indigo-500"
          />
        ) : (
          <p className="text-xs md:text-sm font-bold text-slate-700 truncate">{value}</p>
        )}
    </div>
  </div>
);

const StatBox = ({ label, value, color }) => {
  const colors = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700 text-indigo-400",
    purple: "bg-purple-50 border-purple-100 text-purple-700 text-purple-400",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700 text-emerald-400",
  };
  return (
    <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl text-center border ${colors[color].split(' ').slice(0,2).join(' ')}`}>
        <p className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${colors[color].split(' ').slice(4).join(' ')}`}>{label}</p>
        <p className={`text-lg md:text-xl font-black ${colors[color].split(' ').slice(2,4).join(' ')}`}>{value}</p>
    </div>
  );
};

export default Profile;
