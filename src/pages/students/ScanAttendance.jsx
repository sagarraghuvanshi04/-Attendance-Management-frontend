import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import api from "../../services/api";
import toast from "react-hot-toast";

const ScanAttendance = () => {
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [scanType, setScanType] = useState("");
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    const scanner = new Html5QrcodeScanner("qr-reader", config, false);

    scanner.render(
      async (decodedText) => {
        try {
          scanner.clear();
          
          const { data } = await api.post("/attendance/scan", { staffId: decodedText });

          setStatus("success");
          setScanType(data.type);
          setResult(data.message);
          toast.success(data.message);

          setTimeout(() => {
            navigate("/student/overview");
          }, 2000);
        } catch (err) {
          setStatus("error");
          setResult(err.response?.data?.message || "Failed to mark attendance");
          toast.error(err.response?.data?.message || "Scan failed");
        }
      },
      (errorMessage) => {
        // Ignore scan errors
      }
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
            <QrCode className="text-indigo-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-800">Scan Staff QR</h2>
          <p className="text-slate-500 font-medium mt-2">Point your camera at the QR code</p>
        </div>

        <div 
          id="qr-reader" 
          className="mb-6 border-4 border-dashed border-indigo-200 rounded-2xl overflow-hidden"
        />

        {result && (
          <div
            className={`p-4 rounded-2xl mb-4 flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top duration-300 ${
              status === "success" 
                ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200" 
                : "bg-red-50 text-red-700 border-2 border-red-200"
            }`}
          >
            {status === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <div className="flex-1">
              <p>{result}</p>
              {scanType && <p className="text-xs mt-1 opacity-75">Type: {scanType}</p>}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/student/overview")}
          className="w-full bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
        >
          <X size={20} /> Close Scanner
        </button>
      </div>
    </div>
  );
};

export default ScanAttendance;
