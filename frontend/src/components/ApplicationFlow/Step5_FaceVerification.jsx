import React, { useState, useRef, useEffect } from 'react';
import { ScanFace, Camera, CheckCircle2, RotateCcw, AlertCircle, Sparkles, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import api from '../../api/client';

export const Step5_FaceVerification = ({ data, updateData, onNext, onPrev, applicationId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  
  // Straight selfie captures
  const TOTAL_CAPTURES = 4;
  const [capturedPhotos, setCapturedPhotos] = useState(data.biometric?.photos || []);
  const [currentInstruction, setCurrentInstruction] = useState("Position your face inside the straight guide frame.");
  const [qualityPassed, setQualityPassed] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState(null);

  // Start webcam
  const startCamera = async () => {
    setCameraError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
      setCurrentInstruction("Face camera directly. Looking straight...");
      setQualityPassed(true);
    } catch (err) {
      console.warn('Webcam permission error:', err);
      setCameraError('Webcam access was denied or not available. You can use simulated straight camera capture.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Capture straight-facing photo
  const capturePhoto = () => {
    if (capturedPhotos.length >= TOTAL_CAPTURES) return;

    let photoDataUrl = '';

    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    } else {
      // High-quality simulated straight-facing frame for demo environments
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 400, 400);
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(200, 170, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Straight Capture #${capturedPhotos.length + 1}`, 200, 320);
      photoDataUrl = canvas.toDataURL('image/jpeg');
    }

    const nextPhotos = [...capturedPhotos, photoDataUrl];
    setCapturedPhotos(nextPhotos);

    if (nextPhotos.length < TOTAL_CAPTURES) {
      setCurrentInstruction(`Capture ${nextPhotos.length}/${TOTAL_CAPTURES} recorded. Please remain looking straight.`);
    } else {
      setCurrentInstruction("All 4 straight-facing captures completed. Ready to verify.");
    }
  };

  // Retake all photos
  const handleRetake = () => {
    setCapturedPhotos([]);
    setVerifiedResult(null);
    setCurrentInstruction("Position your face inside the straight guide frame.");
    setQualityPassed(true);
  };

  // Submit biometric verification
  const handleVerifyBiometrics = async () => {
    if (capturedPhotos.length < 3) {
      alert('Please complete at least 3 straight-facing selfie captures.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post(`/applications/${applicationId}/biometric-verify`, {
        capturedPhotos
      });

      if (res.data.success) {
        setVerifiedResult(res.data.result);
        updateData('biometric', {
          photos: capturedPhotos,
          captureCount: capturedPhotos.length,
          poseCompliance: 'Straight Facing 100% Passed',
          faceConsistencyScore: 0.98,
          livenessScore: 0.96,
          faceMatchStatus: 'Verified',
          verificationStatus: 'Verified',
          isDemo: true
        });
      }
    } catch (err) {
      console.error('Biometric verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProceed = () => {
    if (!verifiedResult && (!data.biometric || data.biometric.verificationStatus !== 'Verified')) {
      alert('Please complete biometric verification before proceeding.');
      return;
    }
    stopCamera();
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <ScanFace className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Straight-Facing Face Biometric Verification</h3>
          <p className="text-xs text-slate-400">Multi-capture straight portrait consistency & live liveness telemetry.</p>
        </div>
      </div>

      {/* STRICT STRAIGHT NOTICE & DEMO BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
          <p className="font-bold flex items-center space-x-1.5 mb-1">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Strict Straight Orientation Policy</span>
          </p>
          <p className="text-slate-400 text-[11px]">
            Please face the camera directly. Do NOT tilt or turn your head left/right. 4 consecutive straight frames will be captured.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <p className="font-bold flex items-center space-x-1.5 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>DEMO / MOCK Verification Flow</span>
          </p>
          <p className="text-amber-200/80 text-[11px]">
            Straight-facing photos are an automated prototype flow. Production setups combine active 3D depth/vendor SDKs.
          </p>
        </div>
      </div>

      {/* Camera & Instruction Viewport */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video max-w-lg mx-auto flex items-center justify-center shadow-2xl">
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        ) : (
          <div className="text-center p-6 space-y-3">
            <Camera className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">{cameraError || 'Camera is initializing...'}</p>
            <button
              type="button"
              onClick={startCamera}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Live Straight Face Guide Overlay */}
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
          {/* Straight Face Oval Target */}
          <div className="w-48 h-60 rounded-[50%] border-2 border-dashed border-blue-400/70 shadow-[0_0_20px_rgba(59,130,246,0.3)] relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] font-mono uppercase bg-blue-600/80 text-white px-2 py-0.5 rounded-full">
              LOOK STRAIGHT
            </div>
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-t border-l border-blue-400/50" />
          </div>
        </div>

        {/* Real-time instruction strip */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-medium">{currentInstruction}</span>
          </div>
          <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
            {capturedPhotos.length}/{TOTAL_CAPTURES}
          </span>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Capture Controls */}
      <div className="flex items-center justify-center space-x-4">
        {capturedPhotos.length < TOTAL_CAPTURES ? (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!qualityPassed}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>Capture Straight Selfie ({capturedPhotos.length + 1}/{TOTAL_CAPTURES})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVerifyBiometrics}
            disabled={isVerifying}
            className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/25 flex items-center space-x-2 transition-all"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Face Consistency Analysis...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Analyze & Verify 4 Straight Captures</span>
              </>
            )}
          </button>
        )}

        {capturedPhotos.length > 0 && (
          <button
            type="button"
            onClick={handleRetake}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake All</span>
          </button>
        )}
      </div>

      {/* Captured Thumbnails Grid */}
      <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto">
        {[0, 1, 2, 3].map((slotIdx) => (
          <div
            key={slotIdx}
            className="aspect-square rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative flex items-center justify-center"
          >
            {capturedPhotos[slotIdx] ? (
              <>
                <img src={capturedPhotos[slotIdx]} alt={`Capture ${slotIdx + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-slate-950/80 text-emerald-400 px-1.5 py-0.2 rounded">
                  #{slotIdx + 1} Straight
                </span>
              </>
            ) : (
              <span className="text-[11px] text-slate-600 font-mono">Frame {slotIdx + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Verification Result Card */}
      {(verifiedResult || data.biometric?.verificationStatus === 'Verified') && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Biometric Consistency Verified (DEMO)</span>
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
              Score: 98.2%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px] pt-1">
            <div>
              <span className="text-slate-500">Pose Alignment:</span> Straight Facing 100% Passed
            </div>
            <div>
              <span className="text-slate-500">Liveness Telemetry:</span> 96.4% (Sandbox Verified)
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleProceed}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
        >
          Proceed to Verification Summary →
        </button>
      </div>
    </div>
  );
};

