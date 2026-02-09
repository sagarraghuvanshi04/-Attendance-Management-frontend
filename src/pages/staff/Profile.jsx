import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Shield,
  MapPin,
  LogOut,
  Edit3,
  Check,
  X,
  Camera,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import Loader from "../../components/Loader"; 

const DEFAULT_PROFILE = {
  name: "",
  role: "",
  staffId: "",
  email: "",
  phone: "",
  shift: "",
  assignedArea: "",
  profilePic: "",
};

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [staffInfo, setStaffInfo] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Fetch staff profile from backend
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/staff/profile");

        if (data && data.staff) {
          setStaffInfo(data.staff);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Input handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setStaffInfo((prev) => ({ ...prev, [name]: value }));
  };

  // Image upload (base64 for now)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setStaffInfo((prev) => ({
        ...prev,
        profilePic: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Save profile to backend
  const handleSave = async () => {
    try {
      const { data } = await api.put(`/staff/update/${staffInfo.staffId}`, staffInfo);

      if (data && data.success) {
        toast.success("Profile updated successfully!");
        // Force update with fresh data from backend
        setStaffInfo({ ...data.staff });
        // Trigger custom event to update header
        window.dispatchEvent(new CustomEvent('staffProfileUpdated', { detail: data.staff }));
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const renderProfileImage = () => {
    if (staffInfo.profilePic) {
      return (
        <img
          src={staffInfo.profilePic}
          alt="Profile"
          className="h-full w-full object-cover rounded-[3rem]"
        />
      );
    }
    if (!staffInfo.name) return "ST";
    return staffInfo.name
      .split(" ")
      .map((n) => n[0])
      .join("");
  };

  if (loading) {
    return <Loader message="Loading Profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-[3.5rem] p-10 relative shadow-sm">
        {/* Edit / Save Button */}
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={`absolute top-10 right-10 px-6 py-3 rounded-2xl font-black text-sm flex gap-2
          ${isEditing ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white"}`}
        >
          {isEditing ? (
            <>
              <Check size={18} /> Save
            </>
          ) : (
            <>
              <Edit3 size={18} /> Edit
            </>
          )}
        </button>

        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="relative">
            <div className="h-40 w-40 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-[3rem] flex items-center justify-center text-white text-5xl font-black">
              {renderProfileImage()}
            </div>

            {isEditing && (
              <label className="absolute -bottom-2 -right-2 h-12 w-12 bg-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg">
                <Camera size={20} className="text-indigo-600" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            {isEditing ? (
              <input
                name="name"
                value={staffInfo.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="text-3xl font-black border-b-2 outline-none w-full"
              />
            ) : (
              <h2 className="text-4xl font-black">
                {staffInfo.name || "Staff Name"}
              </h2>
            )}

            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black">
                {staffInfo.role || "Staff Role"}
              </span>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-black">
                {staffInfo.staffId || "STAFF-ID"}
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-14">
          <EditableItem
            icon={<Mail className="text-indigo-500" />}
            label="Email"
            name="email"
            value={staffInfo.email}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <EditableItem
            icon={<Phone className="text-emerald-500" />}
            label="Phone"
            name="phone"
            value={staffInfo.phone}
            isEditing={isEditing}
            onChange={handleChange}
          />
          <EditableItem
            icon={<Shield className="text-amber-500" />}
            label="Shift"
            name="shift"
            value={staffInfo.shift}
            isEditing={isEditing}
            onChange={handleChange}
            isSelect
            options={["Morning", "Evening", "Night"]}
          />
          <EditableItem
            icon={<MapPin className="text-rose-500" />}
            label="Assigned Area"
            name="assignedArea"
            value={staffInfo.assignedArea}
            isEditing={isEditing}
            onChange={handleChange}
          />
        </div>

        {/* Cancel */}
        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="mt-8 w-full py-4 bg-rose-50 text-rose-500 rounded-2xl font-black"
          >
            <X size={18} /> Cancel
          </button>
        )}
      </div>

      {/* Logout */}
      {!isEditing && (
        <button
          onClick={() => {
            localStorage.removeItem("staffToken");
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
          className="w-full bg-rose-50 text-rose-600 py-6 rounded-[2.5rem] font-black flex justify-center gap-3"
        >
          <LogOut size={18} /> Logout
        </button>
      )}
    </div>
  );
};

const EditableItem = ({
  icon,
  label,
  value,
  name,
  isEditing,
  onChange,
  isSelect,
  options = [],
}) => (
  <div className="flex gap-4 p-6 bg-slate-50 rounded-[2.5rem]">
    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center">
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
        {label}
      </p>
      {isEditing ? (
        isSelect ? (
          <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full border rounded-lg px-2 py-1 font-bold"
          >
            {options.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            name={name}
            value={value}
            onChange={onChange}
            className="w-full border rounded-lg px-2 py-1 font-bold"
          />
        )
      ) : (
        <p className="font-black">{value || "-"}</p>
      )}
    </div>
  </div>
);

export default Profile;
