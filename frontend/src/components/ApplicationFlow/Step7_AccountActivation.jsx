import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { UserCheck, Lock, Mail, Phone, KeyRound, CheckCircle2, ShieldCheck, ArrowRight, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export const Step7_AccountActivation = ({ data, applicationId, onComplete }) => {
  const { setAuthSession } = useAuth();
  const [username, setUsername] = useState(
    (data.personalData?.firstName || 'alex').toLowerCase().replace(/\s+/g, '_') + Math.floor(100 + Math.random() * 900)
  );
  const [phone, setPhone] = useState(data.personalData?.phone || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaOtp, setMfaOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activatedCandidateId, setActivatedCandidateId] = useState(null);

  const handleActivate = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await api.post(`/applications/${applicationId}/activate-account`, {
        username,
        password,
        phone,
        otp: mfaOtp
      });

      if (res.data.success) {
        setActivatedCandidateId(res.data.candidateRefId);
        setAuthSession(res.data.token, res.data.user);

        // Fire celebration confetti!
        try {
          confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch (cErr) {
          // ignore if canvas not supported
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Account activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!activatedCandidateId ? (
        <form onSubmit={handleActivate} className="space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Activate Candidate Account</h3>
              <p className="text-xs text-slate-400">Create your security credentials to access your Candidate Trust ID & verified passport.</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Desired Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. alex_morgan26"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email</label>
              <div className="relative">
                <input
                  type="email"
                  disabled
                  value={data.email}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Mobile Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">MFA Verification Code *</label>
              </div>
              <input
                type="text"
                required
                value={mfaOtp}
                onChange={(e) => setMfaOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono tracking-widest text-center focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Account Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Activating Account & Minting Candidate ID...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Finalize & Activate Candidate Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Account Activated Celebration Card */
        <div className="text-center py-6 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Verified Candidate
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight">Account Created Successfully</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your application and multimodal identity signals have been cryptographically verified and recorded.
            </p>
          </div>

          {/* Generated Candidate ID Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 max-w-sm mx-auto shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Official Candidate Reference ID
            </div>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono tracking-wider py-1">
              {activatedCandidateId}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 font-mono">
              Share this ID with hiring managers for instant zero-trust verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onComplete('candidate_portal')}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <UserCheck className="w-4 h-4" />
              <span>Go to My Trust Passport</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

