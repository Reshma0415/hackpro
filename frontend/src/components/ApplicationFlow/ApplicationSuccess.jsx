import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, ShieldCheck, ArrowRight, Home, Copy, Check, Lock, Sparkles } from 'lucide-react';

export const ApplicationSuccess = ({ 
  result = {}, 
  onHomeClick, 
  onLoginClick,
  onGoToCandidatePortal,
  onGoToHRReview
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err) {
      // canvas confetti fallback
    }
  }, []);

  const [copied, setCopied] = React.useState(false);
  const candId = result?.candidateId || 'CT-2026-PENDING';
  const appId = result?.applicationId || 'APP-2026-PENDING';
  const dateStr = result?.submissionDate ? new Date(result.submissionDate).toLocaleString() : new Date().toLocaleString();

  const copyId = () => {
    if (candId) {
      navigator.clipboard.writeText(candId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 text-center space-y-8">
      {/* Celebration Icon */}
      <div className="w-20 h-20 rounded-3xl bg-orange-100 border-2 border-orange-300 flex items-center justify-center mx-auto shadow-md shadow-orange-500/10">
        <CheckCircle2 className="w-10 h-10 text-orange-600" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-orange-800 uppercase tracking-widest bg-orange-100 px-3.5 py-1 rounded-full border border-orange-300">
          MongoDB Stored & Verified
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Application Submitted Successfully</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Your complete candidate profile, education credentials, 3 live straight photos, and masked Aadhaar checksum have been securely saved.
        </p>
      </div>

      {/* Official Credentials Passport Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-5 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/50 rounded-full blur-2xl pointer-events-none" />

        {/* Candidate ID Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate Reference ID</p>
            <p className="text-2xl font-black text-orange-600 font-mono tracking-wider mt-0.5">
              {candId}
            </p>
          </div>
          <button
            onClick={copyId}
            className="self-start sm:self-auto px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-orange-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
            <span>{copied ? 'Copied ID' : 'Copy ID'}</span>
          </button>
        </div>

        {/* Detail Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Application Reference:</span>
            <span className="font-mono font-bold text-slate-900 text-xs">{appId}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Application Status:</span>
            <span className="font-bold text-orange-700 text-xs">{result?.applicationStatus || 'Submitted'}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Masked Aadhaar:</span>
            <span className="font-mono font-bold text-slate-900 text-xs">{result?.aadhaarMasked || 'XXXX XXXX 9012'}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-slate-500 text-[11px] block">Identity Verification:</span>
            <span className="font-bold text-emerald-700 text-xs">{result?.identityStatus || 'Verified'}</span>
          </div>

          <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-slate-500 text-[11px]">Submission Timestamp:</span>
            <span className="font-mono text-slate-700 text-[11px] font-medium">{dateStr}</span>
          </div>
        </div>

        {/* Privacy & Account Login Note */}
        <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-xs text-slate-700 space-y-1">
          <div className="flex items-center space-x-2 text-orange-700 font-bold">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Candidate Account Ready</span>
          </div>
          <p className="text-slate-600 text-[11px] leading-relaxed">
            Your candidate account has been activated. You can now access your dashboard or log in anytime.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onHomeClick}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        {onGoToHRReview && (
          <button
            onClick={onGoToHRReview}
            className="px-5 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>View in HR Review</span>
          </button>
        )}

        <button
          onClick={onGoToCandidatePortal || onLoginClick || onHomeClick}
          className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
        >
          <Lock className="w-4 h-4" />
          <span>Go to Candidate Portal</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

