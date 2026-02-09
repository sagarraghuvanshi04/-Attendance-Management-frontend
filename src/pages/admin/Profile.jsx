import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Shield, Save, X, Camera } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

const Profile = () => {
  const [admin, setAdmin] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profilePic: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/admin/profile");
      if (res.data.success) {
        setAdmin(res.data.admin);
        setFormData({
          name: res.data.admin.name,
          email: res.data.admin.email,
          phone: res.data.admin.phone || "",
          profilePic: res.data.admin.profilePic || ""
        });
      }
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePic: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await api.put("/admin/profile", formData);
      if (res.data.success) {
        setAdmin(res.data.admin);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      }
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900">Admin Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account settings</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setFormData({
                  name: admin.name,
                  email: admin.email,
                  phone: admin.phone || "",
                  profilePic: admin.profilePic || ""
                });
              }}
              className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200"
            >
              <X size={18} className="inline mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size={18} className="inline mr-2" />
              Save
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-50">
            <h3 className="text-xl font-black text-slate-800 mb-6">Personal Information</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <User size={20} className="text-indigo-600" />
                    <span className="font-bold text-slate-800">{admin?.name}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Mail size={20} className="text-purple-600" />
                    <span className="font-bold text-slate-800">{admin?.email}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600"
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                    <Phone size={20} className="text-emerald-600" />
                    <span className="font-bold text-slate-800">{admin?.phone || "Not provided"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-8 text-white h-fit">
          <div className="relative mx-auto w-fit mb-6">
            {formData.profilePic ? (
              <img 
                src={formData.profilePic} 
                alt="Profile" 
                className="h-24 w-24 rounded-[2rem] object-cover shadow-xl"
              />
            ) : (
              <div className="h-24 w-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white text-4xl font-black shadow-xl">
                {admin?.name?.charAt(0)}
              </div>
            )}
            {isEditing && (
              <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors shadow-lg">
                <Camera size={18} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-black">{admin?.name}</h3>
            <div className="flex items-center justify-center gap-2 text-indigo-400">
              <Shield size={18} />
              <span className="text-sm font-bold uppercase tracking-widest">Administrator</span>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Staff ID</p>
              <p className="text-lg font-black text-white">{admin?.staffId}</p>
            </div>
            <div className="pt-4 border-t border-white/10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Status</p>
              <span className="inline-block px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-black uppercase">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
