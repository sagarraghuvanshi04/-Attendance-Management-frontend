import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Smartphone, Globe, ArrowRight, ShieldAlert, IdCard, QrCode, Loader2, Library, X, Download } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import api from "../../services/api";

const Security = () => {
  const navigate = useNavigate();
  const idCardRef = useRef(null); 
  const [userData, setUserData] = useState(null);
  const [showFullID, setShowFullID] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data.success) setUserData(res.data.student);
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Password change handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await api.put("/students/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      
      if (res.data.success) {
        alert("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ID Card download 
  const downloadIDCard = async () => {
    if (idCardRef.current) {
      try {
        const canvas = await html2canvas(idCardRef.current, { 
          scale: 3, 
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true
        });
        const link = document.createElement("a");
        link.download = `${userData?.name || "Student"}_ID_Card.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download ID card. Please try again.');
      }
    }
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  const libraryDetails = {
    name: "SUCCESS POINT",
    address: "Digital Library & Study Zone",
    city: "Lucknow, Uttar Pradesh"
  };

  return (
    <div className="p-4 md:p-6 mx-auto space-y-4 md:space-y-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl">
      
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Security & Identity</h2>
        <p className="text-sm md:text-base text-slate-500 font-medium">Manage your password and your digital access pass.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Password Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="h-12 w-12 md:h-14 md:w-14 bg-indigo-50 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-600 mb-4 md:mb-6 group-hover:scale-110 transition-transform"><Lock size={24} /></div>
          <h3 className="text-lg md:text-xl font-bold text-slate-800">Password</h3>
          <p className="text-xs md:text-sm text-slate-500 mt-2 mb-6 md:mb-8 leading-relaxed">Update your password to keep your account safe.</p>
          <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between bg-slate-900 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold hover:bg-slate-800 transition-all text-sm md:text-base">
            Update Password <ArrowRight size={18} />
          </button>
        </div>

        {/* Digital ID Card Trigger Card */}
        <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-slate-100 shadow-xl flex flex-col justify-between group">
            <div className="h-12 w-12 md:h-14 md:w-14 bg-purple-50 rounded-xl md:rounded-2xl flex items-center justify-center text-purple-600 mb-4 md:mb-6 group-hover:rotate-12 transition-transform"><IdCard size={24} /></div>
            <div className="mb-6 md:mb-8">
                <h3 className="text-lg md:text-xl font-bold text-slate-800">Digital Identity</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-2">Generate and download your official library ID card.</p>
            </div>
            <button onClick={() => setShowFullID(true)} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all text-sm md:text-base">
              <QrCode size={18} /> View ID Card
            </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl md:text-2xl font-black text-slate-800">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {passwordLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                {passwordLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- ID CARD MODAL POPUP --- */}
      {showFullID && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowFullID(false)}
        >
          <div className="relative w-full max-w-[320px] md:max-w-[360px]" onClick={(e) => e.stopPropagation()}>
            
            {/* Action Buttons Top */}
            <div className="flex justify-between items-center mb-3">
                <button onClick={downloadIDCard} className="flex items-center gap-2 bg-white text-slate-900 px-3 py-1.5 rounded-lg text-xs font-black shadow-lg hover:bg-indigo-50 transition-colors">
                    <Download size={14} /> Download
                </button>
                <button onClick={() => setShowFullID(false)} className="bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* THE ID CARD DESIGN */}
            <div ref={idCardRef} className="bg-white rounded-2xl overflow-hidden shadow-2xl border" style={{borderColor: '#e2e8f0'}}>
                {/* Header Section */}
                <div className="p-3 text-center text-white" style={{background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)'}}>
                    <Library size={24} className="mx-auto mb-1.5" style={{opacity: 0.9}} />
                    <h4 className="text-base font-black tracking-widest leading-none">{libraryDetails.name}</h4>
                    <p className="text-[8px] font-bold mt-0.5 tracking-widest" style={{opacity: 0.7}}>{libraryDetails.address}</p>
                </div>

                {/* Student Body Section */}
                <div className="p-4 flex flex-col items-center">
                    {/* Profile Pic */}
                    <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-md mb-3 flex items-center justify-center" style={{border: '4px solid #f8fafc', backgroundColor: '#f1f5f9'}}>
                        {userData?.profilePic ? (
                          <img 
                            src={userData.profilePic} 
                            alt="Student" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <span className="font-black text-4xl" style={{color: '#4f46e5'}}>
                            {userData?.name?.charAt(0) || "S"}
                          </span>
                        )}
                    </div>

                    <h3 className="text-lg font-black uppercase tracking-tight text-center" style={{color: '#1e293b'}}>{userData?.name || "Student Name"}</h3>
                    <p className="font-black text-xs mb-3" style={{color: '#4f46e5'}}>{userData?.studentId || "ID-XXXXXX"}</p>

                    {/* Details Grid */}
                    <div className="w-full grid grid-cols-2 gap-2 text-left py-2 mb-3" style={{borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9'}}>
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider" style={{color: '#94a3b8'}}>Course</p>
                            <p className="text-[10px] font-black" style={{color: '#334155'}}>{userData?.course || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider" style={{color: '#94a3b8'}}>Year</p>
                            <p className="text-[10px] font-black" style={{color: '#334155'}}>{userData?.year || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider" style={{color: '#94a3b8'}}>Join Date</p>
                            <p className="text-[10px] font-black" style={{color: '#334155'}}>{new Date(userData?.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-wider" style={{color: '#94a3b8'}}>Validity</p>
                            <p className="text-[10px] font-black" style={{color: '#10b981'}}>Active</p>
                        </div>
                    </div>

                    {/* QR Code Section */}
                    <div className="p-1.5 rounded-xl" style={{backgroundColor: '#f8fafc', border: '2px dashed #e2e8f0'}}>
                        <QRCodeSVG value={userData?.studentId || "NONE"} size={70} level="H" />
                    </div>
                    <p className="text-[8px] font-bold mt-2 uppercase tracking-[0.2em]" style={{color: '#94a3b8'}}>Access Control Pass</p>
                </div>

                {/* Footer Section */}
                <div className="py-2 text-center" style={{backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9'}}>
                    <p className="text-[8px] font-bold uppercase tracking-tighter" style={{color: '#94a3b8'}}>This is a digitally generated identity card</p>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Session History */}
      <div className="bg-slate-900 rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 text-white mt-6 md:mt-8">
        <h3 className="text-lg md:text-xl font-bold mb-6 md:mb-8 flex items-center gap-2"><Smartphone className="text-indigo-400" size={20} /> Active Sessions</h3>
        <DeviceRow 
            icon={<Globe className="text-blue-400" />} 
            device="Current Session" 
            location="Lucknow, India" 
            status={userData?.lastLogin ? `Last Login: ${new Date(userData.lastLogin).toLocaleString()}` : "Active Now"} 
        />
        <button className="mt-6 md:mt-8 text-red-400 text-xs md:text-sm font-bold flex items-center gap-2 hover:text-red-300 transition-colors border border-red-400/20 px-3 md:px-4 py-2 rounded-xl">
            <ShieldAlert size={16} /> Sign out all other devices
        </button>
      </div>
    </div>
  );
};

const DeviceRow = ({ icon, device, location, status }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-4">
        <div className="p-3 bg-slate-800 rounded-xl">{icon}</div>
        <div>
            <p className="font-bold text-slate-100">{device}</p>
            <p className="text-xs text-slate-500">{location}</p>
        </div>
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{status}</span>
  </div>
);

export default Security;