import { useRef, useState, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";
const SAMPLE_COUNT = 5; // average over 5 frames for a stable descriptor

// Average multiple Float32Array descriptors into one
function averageDescriptors(descriptors) {
  const len = descriptors[0].length;
  const avg = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    avg[i] = descriptors.reduce((s, d) => s + d[i], 0) / descriptors.length;
  }
  return avg;
}

export default function FaceRecognition({ onCapture, label = "Start Face Scan" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState("idle");
  // idle | loadingModels | loadingCam | scanning | sampling | captured | error
  const [message, setMessage] = useState("");
  const [captured, setCaptured] = useState(null);
  const [faceBox, setFaceBox] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [sampleProgress, setSampleProgress] = useState(0);

  useEffect(() => {
    loadModels();
    return () => stopAll();
  }, []);

  const loadModels = async () => {
    if (
      faceapi.nets.tinyFaceDetector.isLoaded &&
      faceapi.nets.faceLandmark68Net.isLoaded &&
      faceapi.nets.faceRecognitionNet.isLoaded
    ) {
      setModelsLoaded(true);
      return;
    }
    setStatus("loadingModels");
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
      setStatus("idle");
    } catch {
      setStatus("error");
      setMessage("Failed to load face recognition models. Check that /public/models/ files exist.");
    }
  };

  const stopAll = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setFaceBox(null);
    setSampleProgress(0);
  }, []);

  const startCamera = async () => {
    if (!modelsLoaded) return;
    setStatus("loadingCam");
    setMessage("Requesting camera access...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      await new Promise((resolve, reject) => {
        videoRef.current.onloadedmetadata = resolve;
        videoRef.current.onerror = reject;
        setTimeout(() => reject(new Error("Video load timeout")), 8000);
      });

      await videoRef.current.play();
      setStatus("scanning");
      setMessage("👤 Position your face in the frame...");
      startDetectionLoop();
    } catch (err) {
      stopAll();
      setStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMessage("Camera permission denied. Allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setMessage("No camera found on this device.");
      } else if (err.name === "NotReadableError") {
        setMessage("Camera is already in use by another application.");
      } else {
        setMessage(`Camera error: ${err.message || err.name}`);
      }
    }
  };

  const startDetectionLoop = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const det = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (det) {
          setFaceBox(det.detection.box);
          setMessage("✅ Face detected — click Capture.");
        } else {
          setFaceBox(null);
          setMessage("👤 No face detected. Move closer or improve lighting.");
        }
      } catch { /* ignore per-frame errors */ }
    }, 300);
  };

  const capture = async () => {
    if (!videoRef.current || !faceBox) return;

    // Stop the detection loop while sampling
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

    setStatus("sampling");
    setMessage(`Capturing face samples (0 / ${SAMPLE_COUNT})...`);
    setSampleProgress(0);

    const samples = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      try {
        const det = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!det) {
          setMessage(`Sample ${i + 1} failed — keep still. Retrying...`);
          i--; // retry this sample
          await new Promise(r => setTimeout(r, 200));
          continue;
        }
        samples.push(det.descriptor);
        setSampleProgress(i + 1);
        setMessage(`Capturing face samples (${i + 1} / ${SAMPLE_COUNT})...`);
        await new Promise(r => setTimeout(r, 100));
      } catch {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (samples.length < SAMPLE_COUNT) {
      setStatus("scanning");
      setMessage("❌ Could not capture enough samples. Please try again.");
      startDetectionLoop();
      return;
    }

    // Average all samples for a stable descriptor
    const averaged = averageDescriptors(samples);
    const descriptor = Array.from(averaged);

    // Take snapshot image
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);

    stopAll();
    setCaptured(imageDataUrl);
    setStatus("captured");
    setMessage("✅ Face captured successfully!");
    onCapture({ selfie: imageDataUrl, faceDescriptor: descriptor });
  };

  const retake = () => {
    setCaptured(null);
    setStatus("idle");
    setMessage("");
    setFaceBox(null);
    setSampleProgress(0);
    onCapture(null);
  };

  const cancel = () => {
    stopAll();
    setStatus("idle");
    setMessage("");
  };

  const isScanning = status === "scanning" || status === "sampling";

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* Models loading */}
      {status === "loadingModels" && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-4 py-3 rounded-xl w-full">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          Loading face recognition models...
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 w-full">
          <p className="font-semibold mb-1">⚠️ Error</p>
          <p>{message}</p>
          <button onClick={() => { setStatus("idle"); setMessage(""); }}
            className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded-lg transition font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Start button */}
      {status === "idle" && modelsLoaded && (
        <button type="button" onClick={startCamera}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition font-semibold text-sm w-full justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label}
        </button>
      )}

      {/* Camera loading */}
      {status === "loadingCam" && (
        <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-4 py-3 rounded-xl w-full">
          <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
          {message}
        </div>
      )}

      {/* Video — always in DOM so ref is never null */}
      <div className={`w-full flex flex-col items-center gap-3 ${isScanning ? "block" : "hidden"}`}>
        <div className="relative rounded-xl overflow-hidden border-2 border-indigo-300 bg-black w-full max-w-sm">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-56 object-cover" />

          {/* Face bounding box overlay */}
          {faceBox && videoRef.current && (
            <div className="absolute border-2 border-green-400 rounded-lg pointer-events-none transition-all duration-100"
              style={{
                left: `${(faceBox.x / (videoRef.current.videoWidth || 640)) * 100}%`,
                top: `${(faceBox.y / (videoRef.current.videoHeight || 480)) * 100}%`,
                width: `${(faceBox.width / (videoRef.current.videoWidth || 640)) * 100}%`,
                height: `${(faceBox.height / (videoRef.current.videoHeight || 480)) * 100}%`,
              }} />
          )}

          {/* Live / Sampling badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full">
            <div className={`w-2 h-2 rounded-full ${status === "sampling" ? "bg-yellow-400 animate-pulse" : "bg-red-500 animate-pulse"}`} />
            <span className="text-white text-xs font-medium">{status === "sampling" ? "SAMPLING" : "LIVE"}</span>
          </div>

          {/* Sample progress bar */}
          {status === "sampling" && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-2">
              <div className="w-full bg-gray-600 rounded-full h-1.5">
                <div className="bg-green-400 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${(sampleProgress / SAMPLE_COUNT) * 100}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Status message */}
        <div className={`text-sm font-medium px-4 py-2 rounded-xl w-full text-center ${
          faceBox && status === "scanning" ? "bg-green-50 text-green-700" :
          status === "sampling" ? "bg-blue-50 text-blue-700" :
          "bg-yellow-50 text-yellow-700"
        }`}>
          {message}
        </div>

        <div className="flex gap-3 w-full">
          <button type="button" onClick={capture}
            disabled={!faceBox || status === "sampling"}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl hover:bg-green-700 transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {status === "sampling" ? `Sampling ${sampleProgress}/${SAMPLE_COUNT}...` : "📸 Capture Face"}
          </button>
          <button type="button" onClick={cancel} disabled={status === "sampling"}
            className="bg-gray-400 text-white px-5 py-2.5 rounded-xl hover:bg-gray-500 transition font-medium text-sm disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>

      {/* Captured preview */}
      {status === "captured" && captured && (
        <div className="flex flex-col items-center gap-3 w-full">
          <div className="relative">
            <img src={captured} alt="face-capture"
              className="w-32 h-32 rounded-xl object-cover border-2 border-green-400 shadow" />
            <div className="absolute -top-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow">
              ✓
            </div>
          </div>
          <p className="text-sm text-green-700 font-semibold bg-green-50 px-4 py-2 rounded-xl w-full text-center">
            {message}
          </p>
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
