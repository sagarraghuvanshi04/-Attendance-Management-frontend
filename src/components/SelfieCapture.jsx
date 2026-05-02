import { useRef, useState, useCallback, useEffect } from "react";

export default function SelfieCapture({ onCapture, label = "Take Selfie" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [captured, setCaptured] = useState(null);
  const [error, setError] = useState("");

  // Attach stream to video element once it mounts after setStreaming(true)
  useEffect(() => {
    if (streaming && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [streaming]);

  const startCamera = async () => {
    setError("");
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError("Camera API not supported. Use HTTPS or localhost.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      streamRef.current = stream;
      setStreaming(true);
    } catch (err) {
      // Show the real browser error reason
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("Camera permission denied. Click the camera icon in your browser address bar and allow access, then try again.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setError("Camera is already in use by another app. Close it and try again.");
      } else if (err.name === "OverconstrainedError") {
        // Retry with no constraints
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          streamRef.current = stream;
          setStreaming(true);
        } catch (e2) {
          setError(`Camera error: ${e2.message}`);
        }
      } else if (location.protocol !== "https:" && location.hostname !== "localhost") {
        setError("Camera requires HTTPS. Please access the app via https:// or localhost.");
      } else {
        setError(`Camera error: ${err.message || err.name}`);
      }
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const capture = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCaptured(dataUrl);
    stopCamera();
    onCapture(dataUrl);
  };

  const retake = () => {
    setCaptured(null);
    onCapture(null);
    startCamera();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Error */}
      {error && (
        <div className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          <p className="font-medium mb-1">⚠️ Camera Error</p>
          <p>{error}</p>
          <button onClick={startCamera}
            className="mt-2 text-xs bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg transition font-medium">
            Try Again
          </button>
        </div>
      )}

      {/* Start button */}
      {!streaming && !captured && (
        <button type="button" onClick={startCamera}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition font-medium">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {label}
        </button>
      )}

      {/* Live camera */}
      {streaming && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="rounded-xl w-64 h-48 object-cover border-2 border-indigo-300 bg-black"
            />
            <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={capture}
              className="bg-green-600 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition font-medium">
              📸 Capture
            </button>
            <button type="button" onClick={stopCamera}
              className="bg-gray-400 text-white px-5 py-2 rounded-xl hover:bg-gray-500 transition font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Captured preview */}
      {captured && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <img src={captured} alt="selfie"
              className="rounded-xl w-32 h-32 object-cover border-2 border-green-400 shadow" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">✓</div>
          </div>
          <button type="button" onClick={retake}
            className="text-sm text-indigo-600 hover:underline font-medium">
            Retake
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
