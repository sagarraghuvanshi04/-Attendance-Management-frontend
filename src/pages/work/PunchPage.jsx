import { useState, useEffect } from "react";
import { useGetTodayStatusQuery, usePunchInMutation, usePunchOutMutation } from "../../store/attendanceApi";
import toast from "react-hot-toast";
import FaceRecognition from "../../components/FaceRecognition";

export default function PunchPage() {
  const { data, isLoading: fetching, refetch } = useGetTodayStatusQuery();
  const [punchIn, { isLoading: punchingIn }] = usePunchInMutation();
  const [punchOut, { isLoading: punchingOut }] = usePunchOutMutation();

  const [faceData, setFaceData] = useState(null);
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState("");
  const [locBlocked, setLocBlocked] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [faceMismatch, setFaceMismatch] = useState(null); // { message, distance }

  const todayRecord = data?.record;
  const loading = punchingIn || punchingOut;

  useEffect(() => { checkAndGetLocation(); }, []);

  const checkAndGetLocation = async () => {
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: "geolocation" });
        if (result.state === "denied") { setLocBlocked(true); setLocError("blocked"); return; }
        result.onchange = () => {
          if (result.state === "granted") { setLocBlocked(false); setLocError(""); getLocation(); }
          else if (result.state === "denied") { setLocBlocked(true); setLocError("blocked"); }
        };
      } catch { }
    }
    getLocation();
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported."); return; }
    setLocLoading(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocBlocked(false); setLocError(""); setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        if (err.code === 1) { setLocBlocked(true); setLocError("blocked"); }
        else if (err.code === 2) setLocError("Location unavailable. Check GPS/network.");
        else if (err.code === 3) setLocError("Location timed out. Please retry.");
        else setLocError(err.message || "Failed to get location.");
      },
      { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
    );
  };

  const handlePunch = async (type) => {
    if (!faceData?.selfie) return toast.error("Please complete face scan first");
    if (!faceData?.faceDescriptor) return toast.error("Face recognition data missing");
    if (!location) return toast.error("Location is required");

    setFaceMismatch(null);
    try {
      const body = { selfie: faceData.selfie, faceDescriptor: faceData.faceDescriptor, ...location };
      const result = type === "in"
        ? await punchIn(body).unwrap()
        : await punchOut(body).unwrap();
      toast.success(result.message);
      setFaceData(null);
      setFaceMismatch(null);
      refetch();
    } catch (err) {
      if (err.status === 403) {
        // Show inline mismatch card — not just a toast
        setFaceMismatch({
          message: err.data?.message || "Face verification failed.",
          distance: err.data?.distance,
        });
        setFaceData(null); // force re-scan
      } else {
        toast.error(err.data?.message || "Failed");
      }
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";

  if (fetching) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const canPunchIn = !todayRecord?.punchIn;
  const done = todayRecord?.punchIn && todayRecord?.punchOut;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Punch In / Out</h1>

      {/* Face Recognition Info Banner */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="text-2xl">🔐</span>
        <div>
          <p className="font-semibold text-indigo-800 text-sm">Face Recognition Enabled</p>
          <p className="text-xs text-indigo-600 mt-0.5">
            Your face is scanned and verified to prevent proxy attendance.
            {canPunchIn
              ? " First punch-in registers your face."
              : " Punch-out verifies your face matches punch-in."}
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm font-medium">Today's Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            done ? "bg-green-100 text-green-700" :
            todayRecord?.punchIn ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-600"
          }`}>
            {done ? "✅ Completed" : todayRecord?.punchIn ? "🟡 In Progress" : "⬜ Not Started"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Punch In</p>
            <p className="font-bold text-gray-800 text-lg">{fmt(todayRecord?.punchIn)}</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Punch Out</p>
            <p className="font-bold text-gray-800 text-lg">{fmt(todayRecord?.punchOut)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <p className="text-xs text-gray-400 mb-1">Hours</p>
            <p className={`font-bold text-lg ${todayRecord?.workingHours >= 8 ? "text-green-600" : "text-orange-500"}`}>
              {todayRecord?.workingHours ? `${todayRecord.workingHours}h` : "--"}
            </p>
          </div>
        </div>
        {todayRecord?.shiftStatus && (
          <div className={`text-center text-sm font-semibold py-2 rounded-xl ${
            todayRecord.shiftStatus === "Completed" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
          }`}>
            Shift: {todayRecord.shiftStatus} {todayRecord.shiftStatus === "Completed" ? "(≥ 8 hours)" : "(< 8 hours)"}
          </div>
        )}
        {todayRecord?.validationStatus && (
          <div className={`text-center text-xs py-1.5 rounded-xl font-medium ${
            todayRecord.validationStatus === "Valid" ? "bg-green-50 text-green-600" :
            todayRecord.validationStatus === "Invalid" ? "bg-red-50 text-red-600" :
            "bg-yellow-50 text-yellow-600"
          }`}>
            Validation: {todayRecord.validationStatus}
            {todayRecord.validationRemarks && ` — ${todayRecord.validationRemarks}`}
          </div>
        )}
      </div>

      {/* Location Status */}
      {locBlocked ? (
        <div className="bg-orange-50 border border-orange-300 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="font-semibold text-orange-800">Location Permission Blocked</p>
              <p className="text-xs text-orange-600">Chrome blocked location because the prompt was dismissed multiple times.</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 space-y-2 text-sm text-gray-700">
            <p className="font-semibold text-gray-800 mb-1">How to reset in Chrome:</p>
            {[
              <>Click the <strong>🔒 lock icon</strong> in the address bar</>,
              <>Click <strong>"Site settings"</strong></>,
              <>Find <strong>"Location"</strong> → change to <strong>"Allow"</strong></>,
              <><strong>Reload</strong> and click Retry</>,
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="bg-orange-100 text-orange-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { setLocBlocked(false); setLocError(""); getLocation(); }}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-semibold transition">
            🔄 Retry Location
          </button>
        </div>
      ) : (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          location ? "bg-green-50 text-green-700 border border-green-200" :
          locLoading ? "bg-blue-50 text-blue-600 border border-blue-200" :
          "bg-red-50 text-red-600 border border-red-200"
        }`}>
          <span>{location ? "📍" : locLoading ? "⏳" : "❌"}</span>
          <span className="flex-1">
            {location
              ? `Location: ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
              : locLoading ? "Getting your location..."
              : locError || "Location not captured"}
          </span>
          {!location && !locLoading && (
            <button onClick={getLocation}
              className="text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition font-medium">
              Retry
            </button>
          )}
        </div>
      )}

      {/* Face Mismatch Error Card */}
      {faceMismatch && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🚫</span>
            <div>
              <p className="font-bold text-red-800 text-base">Face Verification Failed</p>
              <p className="text-sm text-red-700 mt-1">{faceMismatch.message}</p>
              {faceMismatch.distance !== undefined && (
                <p className="text-xs text-red-500 mt-1">
                  Similarity distance: <strong>{faceMismatch.distance}</strong> (allowed: ≤ 0.5)
                </p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-xl p-3 text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-700">What to do:</p>
            <p>• Make sure you are the same person who punched in</p>
            <p>• Ensure good lighting — avoid backlighting</p>
            <p>• Remove glasses or hat if worn during punch-in</p>
            <p>• Look directly at the camera and stay still during scan</p>
          </div>
          <button onClick={() => setFaceMismatch(null)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition">
            Try Again
          </button>
        </div>
      )}

      {/* Face Scan + Punch Action */}
      {!done && !faceMismatch && (
        <div className="bg-white rounded-2xl shadow p-6 space-y-5">
          <h2 className="font-semibold text-gray-700 text-lg">
            {canPunchIn ? "🟢 Punch In" : "🔴 Punch Out"} — Face Verification
          </h2>

          <FaceRecognition
            onCapture={setFaceData}
            label={canPunchIn ? "Start Face Scan for Punch In" : "Start Face Scan for Punch Out"}
          />

          {faceData?.selfie && (
            <button
              onClick={() => handlePunch(canPunchIn ? "in" : "out")}
              disabled={loading || !location}
              className={`w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-60 ${
                canPunchIn ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
              }`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying face & marking attendance...
                </span>
              ) : !location ? "⚠️ Location Required"
                : canPunchIn ? "✅ Confirm Punch In" : "🔴 Confirm Punch Out"}
            </button>
          )}
        </div>
      )}

      {/* Completed */}
      {done && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-center text-white">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-bold text-lg">Attendance Completed!</p>
          <p className="text-green-100 text-sm mt-1">Total working hours: {todayRecord.workingHours}h</p>
          <p className={`text-sm mt-1 font-semibold ${todayRecord.workingHours >= 8 ? "text-green-200" : "text-yellow-200"}`}>
            {todayRecord.workingHours >= 8 ? "✅ Full shift completed" : "⚠️ Incomplete shift (< 8h)"}
          </p>
        </div>
      )}

      {/* Selfie Records */}
      {(todayRecord?.punchInSelfie || todayRecord?.punchOutSelfie) && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Face Capture Records</h3>
          <div className="flex gap-4">
            {todayRecord.punchInSelfie && (
              <div className="text-center">
                <img src={todayRecord.punchInSelfie} alt="punch-in"
                  className="w-28 h-28 rounded-xl object-cover border-2 border-green-300 cursor-pointer hover:scale-105 transition"
                  onClick={() => window.open(todayRecord.punchInSelfie)} />
                <p className="text-xs text-gray-500 mt-1">Punch In ✅</p>
              </div>
            )}
            {todayRecord.punchOutSelfie && (
              <div className="text-center">
                <img src={todayRecord.punchOutSelfie} alt="punch-out"
                  className="w-28 h-28 rounded-xl object-cover border-2 border-red-300 cursor-pointer hover:scale-105 transition"
                  onClick={() => window.open(todayRecord.punchOutSelfie)} />
                <p className="text-xs text-gray-500 mt-1">Punch Out ✅</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
