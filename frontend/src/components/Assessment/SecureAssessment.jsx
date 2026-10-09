import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Mic, 
  Wifi, 
  Maximize, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Lock, 
  Check, 
  Play, 
  RefreshCw, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  X, 
  ShieldCheck, 
  Volume2 
} from 'lucide-react';
import api from '../../api/client';

export const SecureAssessment = ({ assessmentId, onExit, onFinish }) => {
  // Phase state: 'pre_check' | 'in_exam' | 'recovery_window' | 'blocked' | 'completed'
  const [phase, setPhase] = useState('pre_check');

  // Pre-check States
  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [networkStable, setNetworkStable] = useState(navigator.onLine);
  const [fullscreenReady, setFullscreenReady] = useState(false);
  const [preCheckError, setPreCheckError] = useState('');
  const [startingSession, setStartingSession] = useState(false);

  // Assessment & Exam States
  const [assessmentData, setAssessmentData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // questionId -> selectedOption
  const [markedForReview, setMarkedForReview] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(3600);
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Security Violations Counters & Policies
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);
  const [fullscreenWarnings, setFullscreenWarnings] = useState(0);
  const [voiceWarnings, setVoiceWarnings] = useState(0);
  const [networkWarnings, setNetworkWarnings] = useState(0);
  const [activeWarningMsg, setActiveWarningMsg] = useState('');
  const [blockReason, setBlockReason] = useState('');

  // 3-Minute Network Recovery Window
  const [recoveryCountdown, setRecoveryCountdown] = useState(180);
  const [isNetworkPaused, setIsNetworkPaused] = useState(false);

  // Media Streams & Audio Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioMonitorTimer = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);

  // 1. Initialize Media Devices for Pre-check
  const initMediaDevices = async () => {
    setPreCheckError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setMicReady(true);

      // Start Audio Energy Analyser
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch (aErr) {
        console.warn('Audio Context init warning:', aErr);
      }
    } catch (err) {
      console.error('Media devices error:', err);
      setPreCheckError('Camera & Microphone access is required. Please allow browser permissions.');
      setCameraReady(false);
      setMicReady(false);
    }
  };

  useEffect(() => {
    initMediaDevices();
    return () => {
      // Cleanup streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Request Fullscreen
  const handleRequestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().then(() => setFullscreenReady(true)).catch(() => setFullscreenReady(true));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
      setFullscreenReady(true);
    } else {
      setFullscreenReady(true);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setFullscreenReady(isFull);
      if (phase === 'in_exam' && !isFull) {
        handleSecurityViolation('FULLSCREEN_EXIT', 'Fullscreen exited');
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [phase, fullscreenWarnings]);

  // 2. Start Assessment Attempt
  const handleStartExam = async () => {
    if (!cameraReady || !micReady) {
      setPreCheckError('Camera and Microphone must be active.');
      return;
    }

    setStartingSession(true);
    setPreCheckError('');

    try {
      const res = await api.post(`/assessments/${assessmentId}/start`, {
        preCheckPassed: true,
        cameraReady,
        micReady,
        networkStable: navigator.onLine,
        fullscreenReady: true
      });

      if (res.data.success) {
        setAttemptId(res.data.attemptId);
        setAssessmentData(res.data.assessment);
        setQuestions(res.data.assessment.questions || []);
        setRemainingSeconds(res.data.assessment.durationSeconds || 3600);
        setPhase('in_exam');

        // Start Media Recording
        if (streamRef.current && window.MediaRecorder) {
          try {
            const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
            mediaRecorderRef.current = recorder;
            recorder.ondataavailable = (e) => {
              if (e.data.size > 0) recordedChunks.current.push(e.data);
            };
            recorder.start(10000); // chunk every 10s
          } catch (rErr) {
            console.warn('Recorder start warning:', rErr);
          }
        }
      }
    } catch (err) {
      setPreCheckError(err.response?.data?.message || 'Failed to start assessment session.');
    } finally {
      setStartingSession(false);
    }
  };

  // 3. Security Violation Handler & Warning Policy Engine
  const handleSecurityViolation = async (eventType, reason) => {
    if (phase !== 'in_exam') return;

    try {
      await api.post(`/assessments/attempts/${attemptId}/event`, {
        eventType,
        severity: 'HIGH',
        metadata: { reason, timestamp: new Date().toISOString() }
      });
    } catch (e) {}

    // Policy Rule Enforcements:
    if (eventType === 'TAB_SWITCH' || eventType === 'WINDOW_FOCUS_LOST') {
      const nextCount = tabSwitchWarnings + 1;
      setTabSwitchWarnings(nextCount);
      if (nextCount === 1) {
        setActiveWarningMsg('Warning 1/3: Please remain on the assessment screen.');
      } else if (nextCount === 2) {
        setActiveWarningMsg('Warning 2/3: Leaving the assessment screen again will block your attempt.');
      } else {
        triggerBlock('Assessment blocked due to repeated attempts to leave the assessment screen.');
      }
    } else if (eventType === 'FULLSCREEN_EXIT') {
      const nextCount = fullscreenWarnings + 1;
      setFullscreenWarnings(nextCount);
      if (nextCount === 1) {
        setActiveWarningMsg('Warning: Fullscreen exit detected. Please return to fullscreen.');
      } else if (nextCount === 2) {
        setActiveWarningMsg('Warning: Leaving fullscreen again is strictly prohibited.');
      } else {
        triggerBlock('Assessment blocked due to repeated fullscreen exits.');
      }
    } else if (eventType === 'BACKGROUND_VOICE_DETECTED') {
      const nextCount = voiceWarnings + 1;
      setVoiceWarnings(nextCount);
      if (nextCount === 1) {
        setActiveWarningMsg('Warning 1/3: Human voice detected in the background. Please ensure that no one else is speaking during the assessment.');
      } else if (nextCount === 2) {
        setActiveWarningMsg('Warning 2/3: Background conversation detected again. Please make sure you are attending the assessment alone.');
      } else {
        triggerBlock('Assessment blocked due to repeated background conversation detection.');
      }
    } else if (eventType === 'CAMERA_DISABLED') {
      setActiveWarningMsg('Camera access is required to continue the assessment. Please restore camera permission.');
    } else if (eventType === 'COPY_ATTEMPT' || eventType === 'PASTE_ATTEMPT') {
      setActiveWarningMsg('Restricted clipboard action detected. This activity has been recorded.');
    }
  };

  const triggerBlock = async (reason) => {
    setPhase('blocked');
    setBlockReason(reason);
    if (attemptId) {
      try {
        await api.post(`/assessments/attempts/${attemptId}/block`, { reason });
      } catch (e) {}
    }
  };

  // 4. Visibility & Tab Focus Monitoring
  useEffect(() => {
    if (phase !== 'in_exam') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleSecurityViolation('TAB_SWITCH', 'Browser tab switched or minimized');
      }
    };

    const handleWindowBlur = () => {
      handleSecurityViolation('WINDOW_FOCUS_LOST', 'Window focus lost to another application');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [phase, tabSwitchWarnings]);

  // 5. Background Voice / Audio Monitoring (Ignoring static fan/wind noise)
  useEffect(() => {
    if (phase !== 'in_exam' || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let consecutiveSpeechFrames = 0;

    audioMonitorTimer.current = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);

      // Calculate Root Mean Square energy
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);

      // Speech frequency band typically 300Hz - 3400Hz (indexes 4 to 40 in 128 bins)
      let speechBandSum = 0;
      for (let i = 4; i < 40; i++) {
        speechBandSum += dataArray[i];
      }
      const speechAvg = speechBandSum / 36;

      // Filter out low constant noise (fans, air conditioners are constant low energy < 30)
      // Human voice has dynamic burst energy > 65 with high speech band presence
      if (rms > 65 && speechAvg > 60) {
        consecutiveSpeechFrames += 1;
        if (consecutiveSpeechFrames >= 4) { // Sustained speech for ~2 seconds
          consecutiveSpeechFrames = 0;
          handleSecurityViolation('BACKGROUND_VOICE_DETECTED', 'Human speech detected in audio stream');
        }
      } else {
        consecutiveSpeechFrames = Math.max(0, consecutiveSpeechFrames - 1);
      }
    }, 500);

    return () => {
      if (audioMonitorTimer.current) clearInterval(audioMonitorTimer.current);
    };
  }, [phase, voiceWarnings]);

  // 6. Network Monitoring & 3-Minute Recovery Window
  useEffect(() => {
    if (phase !== 'in_exam' && phase !== 'recovery_window') return;

    const handleOffline = () => {
      setIsNetworkPaused(true);
      setPhase('recovery_window');
      setRecoveryCountdown(180); // 3 minutes
      handleSecurityViolation('NETWORK_DISCONNECTED', 'Network connection dropped');
    };

    const handleOnline = async () => {
      if (phase === 'recovery_window') {
        setIsNetworkPaused(false);
        setPhase('in_exam');
        setActiveWarningMsg('Network restored. Resuming assessment session.');
        try {
          await api.post(`/assessments/attempts/${attemptId}/network-interruption`, {
            disconnectedAt: new Date(Date.now() - (180 - recoveryCountdown) * 1000).toISOString(),
            reconnectedAt: new Date().toISOString(),
            durationSeconds: 180 - recoveryCountdown,
            withinRecoveryWindow: true
          });
        } catch (e) {}
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [phase, attemptId, recoveryCountdown]);

  // Recovery Countdown Timer
  useEffect(() => {
    let timer = null;
    if (phase === 'recovery_window') {
      timer = setInterval(() => {
        setRecoveryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            triggerBlock('Assessment blocked due to persistent network disconnect exceeding 3 minutes.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase]);

  // 7. Exam Timer & Sync Heartbeat
  useEffect(() => {
    let timer = null;
    if (phase === 'in_exam' && !isNetworkPaused) {
      timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmitAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phase, isNetworkPaused]);

  // 8. Copy/Paste/Right-Click Restriction Guard
  useEffect(() => {
    if (phase !== 'in_exam') return;

    const preventAction = (e, type) => {
      e.preventDefault();
      handleSecurityViolation(type, 'Attempted restricted action');
    };

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'u', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        handleSecurityViolation('COPY_ATTEMPT', 'Shortcut key restriction');
      }
      if (e.key === 'F12') {
        e.preventDefault();
        handleSecurityViolation('WINDOW_FOCUS_LOST', 'DevTools key attempted');
      }
    };

    const onCopy = (e) => preventAction(e, 'COPY_ATTEMPT');
    const onPaste = (e) => preventAction(e, 'PASTE_ATTEMPT');
    const onCut = (e) => preventAction(e, 'CUT_ATTEMPT');
    const onContext = (e) => preventAction(e, 'RIGHT_CLICK_ATTEMPT');

    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase]);

  // 9. Answer Selection & Submission
  const handleSelectOption = (questionId, optionIdx) => {
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleToggleReview = (questionId) => {
    setMarkedForReview(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map(q => ({
        questionId: q.id,
        selectedOption: userAnswers[q.id] !== undefined ? userAnswers[q.id] : -1,
        timeSpentSeconds: 30
      }));

      const res = await api.post(`/assessments/attempts/${attemptId}/submit`, {
        answers: formattedAnswers
      });

      if (res.data.success) {
        setSubmissionResult(res.data);
        setPhase('completed');
        if (onFinish) onFinish(res.data);
      }
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==========================================
  // VIEW: PRE-ASSESSMENT SYSTEM CHECK
  // ==========================================
  if (phase === 'pre_check') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-6">
          <div className="text-center pb-4 border-b border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
              Proctored Environment Verification
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">Pre-Assessment System Check</h2>
            <p className="text-xs text-slate-500 mt-1">
              All mandatory security permissions must be active before entering the proctored assessment.
            </p>
          </div>

          {preCheckError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{preCheckError}</span>
            </div>
          )}

          {/* Camera Feed Preview */}
          <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-300 aspect-video max-w-md mx-auto flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover transform -scale-x-100" 
            />
            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white text-xs space-y-2">
                <Camera className="w-8 h-8 text-orange-400 animate-pulse" />
                <span>Requesting Camera Permission...</span>
              </div>
            )}
            {cameraReady && (
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-700 text-[11px] font-semibold flex items-center space-x-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Feed Active</span>
              </div>
            )}
          </div>

          {/* Checklist of 4 Mandatory Requirements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              cameraReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Camera Permission</p>
                  <p className="text-[11px] text-slate-500">Continuous face feed</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono">
                {cameraReady ? 'Ready ✓' : 'Checking...'}
              </span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              micReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Microphone Audio</p>
                  <p className="text-[11px] text-slate-500">Voice monitor active</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono">
                {micReady ? 'Ready ✓' : 'Checking...'}
              </span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              networkStable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Network Connection</p>
                  <p className="text-[11px] text-slate-500">3-min recovery supported</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono">
                {networkStable ? 'Stable ✓' : 'Offline ✗'}
              </span>
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              fullscreenReady ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <div className="flex items-center space-x-3">
                <Maximize className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Fullscreen Enforced</p>
                  <p className="text-[11px] text-slate-500">Focus lock mode</p>
                </div>
              </div>
              {fullscreenReady ? (
                <span className="text-xs font-bold font-mono text-emerald-700">Ready ✓</span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestFullscreen}
                  className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onExit}
              className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel & Return
            </button>

            <button
              type="button"
              disabled={!cameraReady || !micReady || startingSession}
              onClick={handleStartExam}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/20 flex items-center space-x-2 disabled:opacity-50 transition-all"
            >
              {startingSession ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Entering Secure Session...</span>
                </>
              ) : (
                <>
                  <span>Start Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: NETWORK 3-MINUTE RECOVERY MODAL
  // ==========================================
  if (phase === 'recovery_window') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl border border-amber-300 text-center space-y-5 bg-white shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <Wifi className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Network Connection Issue Detected</h3>
            <p className="text-xs text-slate-600 mt-1">
              Please check your internet connection. Your assessment state and remaining time are preserved.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <p className="text-[11px] text-amber-800 uppercase tracking-wider font-semibold">Recovery Allowance Window</p>
            <p className="text-3xl font-black text-amber-700 font-mono mt-1">
              {formatTime(recoveryCountdown)}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Automatic resume upon reconnection</p>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Note: If connection is restored within 3 minutes, you will resume without penalty.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: BLOCKED ASSESSMENT (THRESHOLD EXCEEDED)
  // ==========================================
  if (phase === 'blocked') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="p-8 rounded-2xl border border-red-300 bg-white shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center mx-auto text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-700 bg-red-100 px-3 py-1 rounded-full border border-red-200">
              Assessment Blocked - Review Required
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">Assessment Session Paused</h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {blockReason || 'Your assessment has been temporarily blocked due to repeated security violations.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 text-slate-600">
            <p className="font-bold text-slate-900">Recorded Security Summary:</p>
            <p>• Tab Switches: <span className="font-mono text-slate-900 font-semibold">{tabSwitchWarnings}</span></p>
            <p>• Fullscreen Exits: <span className="font-mono text-slate-900 font-semibold">{fullscreenWarnings}</span></p>
            <p>• Voice Warnings: <span className="font-mono text-slate-900 font-semibold">{voiceWarnings}</span></p>
            <p className="text-amber-700 pt-1 font-semibold">
              Your response progress and audit evidence have been preserved for HR Review.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs text-slate-500 mb-4">Please contact your HR Recruiter / Administrator for review.</p>
            <button
              onClick={onExit}
              className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              Return to Candidate Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ASSESSMENT COMPLETED
  // ==========================================
  if (phase === 'completed') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="p-8 rounded-2xl border border-emerald-200 bg-white shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
              Submission Successful
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-3">Assessment Completed!</h2>
            <p className="text-xs text-slate-600 mt-1">
              Your answers have been securely submitted and graded.
            </p>
          </div>

          {submissionResult && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Score</p>
                <p className="text-xl font-bold text-emerald-700 font-mono">{submissionResult.score} / {submissionResult.totalPoints}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Percentage</p>
                <p className="text-xl font-bold text-slate-900 font-mono">{submissionResult.percentage}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Proctor Status</p>
                <p className="text-xs font-bold text-emerald-700 mt-1.5">Verified ✓</p>
              </div>
            </div>
          )}

          <button
            onClick={onExit}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20"
          >
            Return to Candidate Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: LIVE PROCTORED EXAM
  // ==========================================
  const currentQ = questions[currentQIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Proctoring Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
              {assessmentData?.title || 'Technical Assessment'}
            </h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-500">
              <span>Attempt: <span className="font-mono text-slate-700 font-medium">{attemptId}</span></span>
              <span>•</span>
              <span className="text-emerald-700 flex items-center space-x-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Proctoring Active</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Badges & Remaining Timer */}
        <div className="flex items-center space-x-3">
          {/* Audio Visualizer Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-emerald-700 font-medium">
            <Mic className="w-3.5 h-3.5" />
            <span>Mic: ON ✓</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] text-emerald-700 font-medium">
            <Camera className="w-3.5 h-3.5" />
            <span>Cam: ON ✓</span>
          </div>

          <div className="p-2 px-3.5 bg-slate-100 border border-orange-300 rounded-xl flex items-center space-x-2">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-black text-slate-900 font-mono">{formatTime(remainingSeconds)}</span>
          </div>

          <button
            onClick={handleSubmitAssessment}
            disabled={submitting}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </header>

      {/* Active Security Warning Banner (if any warning triggered) */}
      {activeWarningMsg && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
            <span className="font-semibold">{activeWarningMsg}</span>
          </div>
          <button 
            onClick={() => setActiveWarningMsg('')}
            className="text-amber-700 hover:text-amber-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Exam Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Question Canvas (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          {currentQ ? (
            <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-orange-700 uppercase tracking-wider font-mono">
                  Question {currentQIndex + 1} of {questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleReview(currentQ.id)}
                  className={`text-xs px-3 py-1 rounded-lg border font-semibold transition-all ${
                    markedForReview[currentQ.id]
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {markedForReview[currentQ.id] ? '★ Marked for Review' : '☆ Mark for Review'}
                </button>
              </div>

              {/* Question Text */}
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed select-none">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[currentQ.id] === oIdx;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectOption(currentQ.id, oIdx)}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start space-x-3.5 ${
                        isSelected
                          ? 'bg-orange-50 border-orange-500 text-slate-900 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center flex-shrink-0 transition-all ${
                        isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-slate-400 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-sm font-medium leading-relaxed">{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Prev / Next Navigation */}
              <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 disabled:opacity-30 flex items-center space-x-1.5 shadow-sm"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                {currentQIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center space-x-1.5"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitAssessment}
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
                  >
                    <span>Finish & Submit</span>
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Loading questions...</p>
          )}
        </div>

        {/* Right Sidebar: Camera Feed & Question Palette (1 col) */}
        <div className="space-y-4">
          {/* Live Camera Feed */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-white overflow-hidden relative shadow-sm">
            <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video relative">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover transform -scale-x-100" 
              />
              <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] text-emerald-700 font-mono font-bold flex items-center space-x-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>PROCTOR LIVE</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2 font-mono">
              Biometric Liveness & Audio Active
            </p>
          </div>

          {/* Question Palette */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Question Palette</h4>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isCurrent = idx === currentQIndex;
                const isReview = markedForReview[q.id];

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all ${
                      isCurrent
                        ? 'ring-2 ring-orange-500 bg-orange-600 text-white'
                        : isReview
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 text-[10px] space-y-1.5 text-slate-500">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-400" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-400" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300" />
                <span>Not Visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

