import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { RefreshCw, Users, Clock, Camera, CheckCircle, XCircle } from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";
import jsQR from "jsqr";

const StaffScanner = () => {
  const [sessionToken, setSessionToken] = useState("");
  const [stats, setStats] = useState({ todayScans: 0, sessionType: "Entry" });
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    generateSessionToken();
    fetchTodayStats();
    return () => {
      stopScanning();
    };
  }, []);

  const generateSessionToken = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const staffId = user.staffId || "STAFF001";
    const timestamp = Date.now();
    const token = `${staffId}-${timestamp}`;
    setSessionToken(token);
  };

  const fetchTodayStats = async () => {
    try {
      const { data } = await api.get("/attendance/today-stats");
      setStats({
        todayScans: data.count || 0,
        sessionType: "Entry"
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      scanIntervalRef.current = setInterval(scanQRCode, 300);
    } catch (err) {
      toast.error("Camera access denied");
      console.error(err);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRCodeDetected(code.data);
      }
    }
  };

  const handleQRCodeDetected = async (qrData) => {
    stopScanning();
    
    try {
      // QR data should contain studentId
      const res = await api.post("/attendance/staff-scan", { 
        studentId: qrData
      });

      if (res.data.success) {
        const scanInfo = {
          name: res.data.student?.name || "Student",
          type: res.data.type,
          time: new Date().toLocaleTimeString()
        };
        setRecentScans(prev => [scanInfo, ...prev.slice(0, 4)]);
        toast.success(res.data.message);
        fetchTodayStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Scan failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Attendance Scanner</h2>
        <p className="text-slate-500 font-bold">Scan student QR codes to mark attendance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Scanner Section */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-lg">
            <h3 className="text-xl font-black text-slate-800 mb-4">Live Scanner</h3>
            
            {!scanning ? (
              <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-4">
                <Camera size={64} className="text-slate-300" />
                <button
                  onClick={startScanning}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Start Camera
                </button>
              </div>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full aspect-square object-cover rounded-2xl"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={stopScanning}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all"
                >
                  Stop Scanning
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Scanned Today</p>
              <p className="text-3xl font-black text-emerald-700">{stats.todayScans}</p>
            </div>
            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Session Active</p>
              <p className="text-3xl font-black text-indigo-700">{scanning ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        {/* Staff QR Code & Recent Scans */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-lg">
            <h3 className="text-xl font-black text-slate-800 mb-4">Staff Session QR</h3>
            <div className="bg-slate-50 p-6 rounded-2xl flex flex-col items-center">
              <QRCodeSVG 
                value={sessionToken} 
                size={200} 
                level="H"
                includeMargin={true}
              />
              <button 
                onClick={generateSessionToken}
                className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-800 transition-colors"
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>

          {/* Recent Scans */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-lg">
            <h3 className="text-xl font-black text-slate-800 mb-4">Recent Scans</h3>
            <div className="space-y-3">
              {recentScans.length > 0 ? (
                recentScans.map((scan, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {scan.type === "ENTRY" ? (
                        <CheckCircle size={20} className="text-emerald-600" />
                      ) : (
                        <XCircle size={20} className="text-amber-600" />
                      )}
                      <div>
                        <p className="font-bold text-slate-800">{scan.name}</p>
                        <p className="text-xs text-slate-500">{scan.type}</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-400">{scan.time}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">No scans yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffScanner;