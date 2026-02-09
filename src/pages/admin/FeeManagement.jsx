import React, { useState, useEffect } from "react";
import api from "../../services/api";
import toast from "react-hot-toast";
import { IndianRupee, Save } from "lucide-react";

const FeeManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fees, setFees] = useState({
    acFee: 800,
    nonAcFee: 600,
  });

  useEffect(() => {
    fetchFeeSettings();
  }, []);

  const fetchFeeSettings = async () => {
    try {
      const res = await api.get("/fee-settings");
      setFees({
        acFee: res.data.settings.acFee,
        nonAcFee: res.data.settings.nonAcFee,
      });
    } catch (err) {
      console.error("Failed to fetch fee settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fees.acFee <= 0 || fees.nonAcFee <= 0) {
      toast.error("Fees must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      await api.put("/fee-settings", fees);
      toast.success("Fee settings updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update fees");
    } finally {
      setSaving(false);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-black text-slate-800">Fee Management</h2>
        <p className="text-slate-500 font-medium">Manage monthly subscription fees</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AC Fee Card */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl">
              <IndianRupee size={32} />
            </div>
            <div>
              <p className="text-sm font-bold opacity-80">AC Seat</p>
              <p className="text-xs opacity-60">Monthly Fee</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-5xl font-black">₹{fees.acFee}</p>
            <p className="text-sm opacity-80 mt-2">per month</p>
          </div>
        </div>

        {/* Non-AC Fee Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 text-white shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl">
              <IndianRupee size={32} />
            </div>
            <div>
              <p className="text-sm font-bold opacity-80">Non-AC Seat</p>
              <p className="text-xs opacity-60">Monthly Fee</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-5xl font-black">₹{fees.nonAcFee}</p>
            <p className="text-sm opacity-80 mt-2">per month</p>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-slate-800 mb-6">Update Fee Structure</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                AC Seat Monthly Fee (₹)
              </label>
              <div className="relative">
                <IndianRupee size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={fees.acFee}
                  onChange={(e) => setFees({ ...fees, acFee: parseInt(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Non-AC Seat Monthly Fee (₹)
              </label>
              <div className="relative">
                <IndianRupee size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  value={fees.nonAcFee}
                  onChange={(e) => setFees({ ...fees, nonAcFee: parseInt(e.target.value) || 0 })}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            <Save size={20} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6">
        <p className="text-sm text-blue-700 font-medium">
          <strong>Note:</strong> These fees will be applied to all new student registrations and renewals. 
          Existing active subscriptions will not be affected until their next renewal.
        </p>
      </div>
    </div>
  );
};

export default FeeManagement;
