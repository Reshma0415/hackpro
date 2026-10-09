import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, KeyRound, AlertCircle, ArrowRight, ShieldCheck, Sparkles, User, RefreshCw, Smartphone, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export const CommonLogin = ({ onSuccess, onApplyClick }) => {
  const { login, loginWithOtp, demoInfo } = useAuth();
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resend cooldown timer
  useEffect(() => {
    let timer = null;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await login(identifier, password);
      setSuccessMsg(`Authenticated as ${data.user.role}. Redirecting...`);
      setTimeout(() => {
        onSuccess(data.user.role);
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('Please enter your registered email address or phone number');
      return;
    }
    setError('');
    setSuccessMsg('');
    setOtpSending(true);

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail ? { email: identifier.trim() } : { identifier: identifier.trim() };
      const res = await api.post('/auth/login-otp-request', payload);
      
      if (res.data.success) {
        setOtpSent(true);
        setOtp('');
        setSuccessMsg(res.data.message || 'Verification code sent to your registered contact.');
        setCooldown(res.data.cooldownSeconds || 60);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send OTP';
      setError(msg);
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await loginWithOtp(identifier, otp.trim());
      setSuccessMsg(`OTP Authenticated as ${data.user.role}. Redirecting...`);
      setTimeout(() => {
        onSuccess(data.user.role);
      }, 500);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillDemo = (demoEmail, demoPass) => {
    setIdentifier(demoEmail);
    setPassword(demoPass);
    setError('');
    setSuccessMsg('Filled demo credentials. Click "Sign In" to authenticate.');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8 rounded-2xl border border-slate-200 shadow-xl relative bg-white"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Lock className="w-6 h-6 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Security Portal Login</h2>
            <p className="text-xs text-slate-500 mt-1.5">
              Enter your credentials. Zero frontend role trust; backend verifies account privilege.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode('password'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'password'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Password Login
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('otp'); setError(''); setSuccessMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'otp'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Login with OTP
            </button>
          </div>

          {/* Error / Success Alerts */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start space-x-2">
              <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Password Login Form */}
          {authMode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address or Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. hr@demo.com or username"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('otp'); setError(''); setSuccessMsg('Switched to OTP authentication.'); }}
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                  >
                    Login with OTP instead
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* OTP Login Form */
            <form onSubmit={otpSent ? handleOtpLogin : handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registered Email Address or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    {identifier.includes('@') ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={otpSent || otpSending}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. hr@demo.com or +919876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-orange-500 disabled:opacity-60 shadow-sm"
                  />
                </div>
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                    className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 mt-1 transition-colors"
                  >
                    Change contact address
                  </button>
                )}
              </div>

              {otpSent && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Enter 6-Digit Verification Code
                    </label>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-orange-600" />
                      <span>Valid for 5 mins</span>
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-mono tracking-widest focus:outline-none focus:border-orange-500 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {otpSent ? (
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading || otp.length < 6}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Security Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={otpSending || cooldown > 0}
                    onClick={handleRequestOtp}
                    className="w-full py-2 px-3 text-xs text-slate-500 hover:text-orange-600 disabled:text-slate-400 font-semibold transition-colors text-center"
                  >
                    {cooldown > 0 ? (
                      <span>Resend OTP in {cooldown}s</span>
                    ) : otpSending ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <span>Resend OTP</span>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={otpSending}
                  className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {otpSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending Real OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Real OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* New Candidate Link */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <p className="text-xs text-slate-600">
              Applying for a role for the first time?{' '}
              <button
                onClick={onApplyClick}
                className="text-orange-600 hover:text-orange-700 font-bold transition-colors"
              >
                Start Candidate Application
              </button>
            </p>
          </div>

          {/* DEMO MODE AUTOFILL CARD */}
          {demoInfo?.demoMode && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-orange-200 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Demo Mode Quick Test</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">1-Click Fill</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3">
                Click any persona to autofill credentials and test backend role detection:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAutofillDemo('hr@demo.com', 'Demo@1234')}
                  className="p-2 rounded-lg bg-white hover:bg-orange-50/50 border border-slate-200 hover:border-orange-300 text-center transition-all shadow-sm group"
                >
                  <div className="text-[11px] font-bold text-orange-700 group-hover:text-orange-800">HR Reviewer</div>
                  <div className="text-[9px] text-slate-500 truncate">hr@demo.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofillDemo('admin@demo.com', 'Demo@1234')}
                  className="p-2 rounded-lg bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 text-center transition-all shadow-sm group"
                >
                  <div className="text-[11px] font-bold text-amber-700 group-hover:text-amber-800">Admin</div>
                  <div className="text-[9px] text-slate-500 truncate">admin@demo.com</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleAutofillDemo('candidate@demo.com', 'Demo@1234')}
                  className="p-2 rounded-lg bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 text-center transition-all shadow-sm group"
                >
                  <div className="text-[11px] font-bold text-emerald-700 group-hover:text-emerald-800">Candidate</div>
                  <div className="text-[9px] text-slate-500 truncate">candidate@demo.com</div>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
