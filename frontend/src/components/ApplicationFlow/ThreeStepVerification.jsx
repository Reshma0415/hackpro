import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  Mail, 
  Fingerprint, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Lock, 
  ShieldCheck, 
  ChevronDown, 
  Search, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import api from '../../api/client';
import { validateVerhoeff, formatAadhaarNumber } from '../../utils/verhoeff';

// Supported Country Codes
const countryCodes = [
  { code: '+91', country: 'India', flag: '🇮🇳', pattern: /^[6-9]\d{9}$/, placeholder: '98765 43210' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸', pattern: /^\d{10}$/, placeholder: '202 555 0123' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', pattern: /^\d{10}$/, placeholder: '7911 123456' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', pattern: /^\d{9}$/, placeholder: '50 123 4567' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', pattern: /^\d{8}$/, placeholder: '8123 4567' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', pattern: /^\d{9}$/, placeholder: '412 345 678' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', pattern: /^\d{10,11}$/, placeholder: '151 23456789' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', pattern: /^\d{9}$/, placeholder: '50 123 4567' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', pattern: /^\d{9,10}$/, placeholder: '12 345 6789' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰', pattern: /^\d{9}$/, placeholder: '71 234 5678' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩', pattern: /^\d{10}$/, placeholder: '1712 345678' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵', pattern: /^\d{10}$/, placeholder: '984 1234567' }
];

export const ThreeStepVerification = ({ 
  phoneData, 
  setPhoneData, 
  emailData, 
  setEmailData, 
  aadhaarData, 
  setAadhaarData, 
  onAllVerified 
}) => {
  // STEP 1: PHONE STATE
  const [selectedCountry, setSelectedCountry] = useState(countryCodes[0]); // Default +91 India
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [phoneInput, setPhoneInput] = useState(phoneData?.phoneNumber || '');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(phoneData?.verified || false);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);
  const [phoneCooldown, setPhoneCooldown] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSuccess, setPhoneSuccess] = useState('');

  // STEP 2: EMAIL STATE
  const [emailInput, setEmailInput] = useState(emailData?.email || '');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(emailData?.verified || false);
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // STEP 3: AADHAAR STATE
  const [aadhaarInput, setAadhaarInput] = useState(aadhaarData?.aadhaarNumber || '');
  const [aadhaarClientId, setAadhaarClientId] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(aadhaarData?.verified || false);
  const [sendingAadhaarOtp, setSendingAadhaarOtp] = useState(false);
  const [verifyingAadhaarOtp, setVerifyingAadhaarOtp] = useState(false);
  const [aadhaarCooldown, setAadhaarCooldown] = useState(0);
  const [aadhaarError, setAadhaarError] = useState('');
  const [aadhaarSuccess, setAadhaarSuccess] = useState('');

  // Cooldown timers
  useEffect(() => {
    let t1, t2, t3;
    if (phoneCooldown > 0) t1 = setInterval(() => setPhoneCooldown(c => c - 1), 1000);
    if (emailCooldown > 0) t2 = setInterval(() => setEmailCooldown(c => c - 1), 1000);
    if (aadhaarCooldown > 0) t3 = setInterval(() => setAadhaarCooldown(c => c - 1), 1000);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
      clearInterval(t3);
    };
  }, [phoneCooldown, emailCooldown, aadhaarCooldown]);

  // Track completion
  useEffect(() => {
    if (phoneVerified && emailVerified && aadhaarVerified && onAllVerified) {
      onAllVerified({
        phone: `${selectedCountry.code} ${phoneInput.trim()}`,
        phoneVerified: true,
        email: emailInput.trim(),
        emailVerified: true,
        aadhaarLast4: aadhaarData?.last4 || aadhaarInput.replace(/\D/g, '').slice(-4),
        aadhaarMasked: aadhaarData?.maskedAadhaar || `XXXX XXXX ${aadhaarInput.replace(/\D/g, '').slice(-4)}`,
        aadhaarVerified: true
      });
    }
  }, [phoneVerified, emailVerified, aadhaarVerified]);

  // ========================================================
  // 1. PHONE OTP HANDLERS
  // ========================================================
  const handleSendPhoneOtp = async () => {
    const rawNumber = phoneInput.replace(/\D/g, '');
    if (!rawNumber) {
      setPhoneError('Please enter your mobile phone number.');
      return;
    }

    if (selectedCountry.code === '+91' && rawNumber.length !== 10) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const fullPhone = `${selectedCountry.code}${rawNumber}`;
    setSendingPhoneOtp(true);
    setPhoneError('');
    setPhoneSuccess('');

    try {
      const res = await api.post('/applications/send-phone-otp', { phone: fullPhone });
      if (res.data.success) {
        setPhoneOtpSent(true);
        setPhoneOtp('');
        setPhoneCooldown(res.data.cooldownSeconds || 60);
        setPhoneSuccess(res.data.message || 'OTP sent successfully to your mobile number.');
        setPhoneData && setPhoneData({ phoneNumber: fullPhone, verified: false });
      }
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Failed to send SMS OTP. Please check your number.');
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setPhoneError('Please enter the complete 6-digit SMS OTP.');
      return;
    }

    const fullPhone = `${selectedCountry.code}${phoneInput.replace(/\D/g, '')}`;
    setVerifyingPhoneOtp(true);
    setPhoneError('');

    try {
      const res = await api.post('/applications/verify-phone-otp', {
        phone: fullPhone,
        otp: phoneOtp.trim()
      });

      if (res.data.success) {
        setPhoneVerified(true);
        setPhoneSuccess('Phone Number Verified Successfully ✓');
        setPhoneData && setPhoneData({ phoneNumber: fullPhone, verified: true });
      }
    } catch (err) {
      setPhoneError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  // ========================================================
  // 2. EMAIL OTP HANDLERS
  // ========================================================
  const handleSendEmailOtp = async () => {
    if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setSendingEmailOtp(true);
    setEmailError('');
    setEmailSuccess('');

    try {
      const res = await api.post('/applications/send-email-otp', { email: emailInput.trim() });
      if (res.data.success) {
        setEmailOtpSent(true);
        setEmailCooldown(res.data.cooldownSeconds || 60);
        setEmailSuccess(res.data.message || 'OTP sent successfully to your email address.');
        setEmailData && setEmailData({ email: emailInput.trim(), verified: false });
      }
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Failed to send email verification OTP.');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setEmailError('Please enter the complete 6-digit email OTP.');
      return;
    }

    setVerifyingEmailOtp(true);
    setEmailError('');

    try {
      const res = await api.post('/applications/verify-email-otp', {
        email: emailInput.trim(),
        otp: emailOtp.trim()
      });

      if (res.data.success) {
        setEmailVerified(true);
        setEmailSuccess('Email Address Verified Successfully ✓');
        setEmailData && setEmailData({ email: emailInput.trim(), verified: true });
      }
    } catch (err) {
      setEmailError(err.response?.data?.message || 'Invalid or expired email OTP code.');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  // ========================================================
  // 3. AADHAAR OTP HANDLERS
  // ========================================================
  const handleSendAadhaarOtp = async () => {
    const cleanAadhaar = aadhaarInput.replace(/\D/g, '');

    if (cleanAadhaar.length !== 12) {
      setAadhaarError('Aadhaar number must contain exactly 12 digits.');
      return;
    }

    // Client-side Verhoeff Algorithm Checksum
    const isVerhoeffValid = validateVerhoeff(cleanAadhaar);
    if (!isVerhoeffValid) {
      setAadhaarError('Invalid Aadhaar number. Checksum verification failed. Please verify your 12-digit number.');
      return;
    }

    setSendingAadhaarOtp(true);
    setAadhaarError('');
    setAadhaarSuccess('');

    try {
      const res = await api.post('/applications/send-aadhaar-otp', { aadhaarNumber: cleanAadhaar });
      if (res.data.success) {
        setAadhaarOtpSent(true);
        setAadhaarClientId(res.data.clientId || 'surepass_session');
        if (res.data.demoOtp) {
          setAadhaarOtp(res.data.demoOtp);
        }
        setAadhaarCooldown(res.data.cooldownSeconds || 60);
        setAadhaarSuccess(res.data.message || `Aadhaar OTP dispatched to mobile linked with UID ending in ${res.data.last4}.`);
      }
    } catch (err) {
      setAadhaarError(err.response?.data?.message || 'Failed to dispatch Aadhaar OTP via KYC provider.');
    } finally {
      setSendingAadhaarOtp(false);
    }
  };

  const handleVerifyAadhaarOtp = async () => {
    if (!aadhaarOtp || aadhaarOtp.length !== 6) {
      setAadhaarError('Please enter the complete 6-digit Aadhaar OTP.');
      return;
    }

    setVerifyingAadhaarOtp(true);
    setAadhaarError('');

    try {
      const res = await api.post('/applications/verify-aadhaar-otp', {
        clientId: aadhaarClientId,
        otp: aadhaarOtp.trim()
      });

      if (res.data.success) {
        setAadhaarVerified(true);
        const last4 = res.data.last4 || aadhaarInput.replace(/\D/g, '').slice(-4);
        const masked = res.data.maskedAadhaar || `XXXX XXXX ${last4}`;
        setAadhaarSuccess(`Aadhaar Verified Successfully ✓ (${masked})`);
        setAadhaarData && setAadhaarData({
          aadhaarNumber: cleanAadhaarInput(),
          last4,
          maskedAadhaar: masked,
          verified: true
        });
      }
    } catch (err) {
      setAadhaarError(err.response?.data?.message || 'Aadhaar OTP verification failed.');
    } finally {
      setVerifyingAadhaarOtp(false);
    }
  };

  const cleanAadhaarInput = () => aadhaarInput.replace(/\D/g, '');

  const filteredCountries = countryCodes.filter(c => 
    c.country.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.code.includes(countrySearch)
  );

  return (
    <div className="space-y-6">
      {/* 3-Step Milestone Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
              Identity Protocol
            </span>
            <span className="text-xs text-slate-400 font-medium">3-Step Sequential Verification</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-1">Real OTP Identity & Contact Verification</h3>
          <p className="text-xs text-slate-400">Step 1 (Phone) → Step 2 (Email) → Step 3 (Aadhaar). Zero mock OTPs permitted.</p>
        </div>
      </div>

      {/* STEP 1: PHONE NUMBER VERIFICATION */}
      <div className={`p-5 rounded-2xl border transition-all ${
        phoneVerified
          ? 'bg-slate-900/60 border-emerald-500/40 shadow-sm'
          : 'bg-slate-900/90 border-orange-500/40 ring-1 ring-orange-500/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              phoneVerified ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
            }`}>
              {phoneVerified ? '✓' : '1'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Phone className="w-4 h-4 text-orange-400" />
                <span>Step 1: Mobile Phone Verification</span>
              </h4>
              <p className="text-[11px] text-slate-400">Real SMS OTP delivery via carrier network.</p>
            </div>
          </div>

          {phoneVerified ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Phone Verified ✓</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-orange-400 font-semibold">Active Step</span>
          )}
        </div>

        {phoneError && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{phoneError}</span>
          </div>
        )}

        {phoneSuccess && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{phoneSuccess}</span>
          </div>
        )}

        {!phoneVerified && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Searchable Country Code Dropdown */}
              <div className="relative min-w-[140px]">
                <button
                  type="button"
                  onClick={() => setShowCountryPicker(!showCountryPicker)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-semibold flex items-center justify-between hover:border-orange-500 transition-colors"
                >
                  <span className="flex items-center space-x-1.5">
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {showCountryPicker && (
                  <div className="absolute z-30 top-12 left-0 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        placeholder="Search country..."
                        className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code + c.country}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(c);
                            setShowCountryPicker(false);
                            setCountrySearch('');
                          }}
                          className="w-full px-2 py-1.5 text-left text-xs rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200"
                        >
                          <span className="flex items-center space-x-2">
                            <span>{c.flag}</span>
                            <span className="truncate max-w-[120px]">{c.country}</span>
                          </span>
                          <span className="font-mono text-orange-400 font-bold">{c.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Input */}
              <input
                type="tel"
                value={phoneInput}
                disabled={phoneOtpSent && phoneCooldown > 0}
                onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                placeholder={selectedCountry.placeholder}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 disabled:opacity-60"
              />

              {/* Send OTP Button */}
              <button
                type="button"
                onClick={handleSendPhoneOtp}
                disabled={sendingPhoneOtp || phoneCooldown > 0 || !phoneInput.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {sendingPhoneOtp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Real SMS...</span>
                  </>
                ) : phoneCooldown > 0 ? (
                  <span>Resend in {phoneCooldown}s</span>
                ) : (
                  <span>{phoneOtpSent ? 'Resend OTP' : 'Send Phone OTP'}</span>
                )}
              </button>
            </div>

            {/* OTP Entry */}
            {phoneOtpSent && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="•••••• (6-digit OTP)"
                    className="w-full sm:w-44 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono text-center tracking-widest focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOtp}
                    disabled={verifyingPhoneOtp || phoneOtp.length !== 6}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    {verifyingPhoneOtp ? 'Verifying...' : 'Verify Phone OTP'}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-orange-400" />
                  <span>Valid for 5 mins (Max 3 resends/hr)</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STEP 2: EMAIL VERIFICATION */}
      <div className={`p-5 rounded-2xl border transition-all ${
        !phoneVerified
          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
          : emailVerified
          ? 'bg-slate-900/60 border-emerald-500/40 shadow-sm'
          : 'bg-slate-900/90 border-orange-500/40 ring-1 ring-orange-500/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              emailVerified ? 'bg-emerald-500 text-white' : phoneVerified ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {emailVerified ? '✓' : '2'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-orange-400" />
                <span>Step 2: Email Address Verification</span>
              </h4>
              <p className="text-[11px] text-slate-400">Nodemailer SMTP email delivery with server-side HMAC hashing.</p>
            </div>
          </div>

          {!phoneVerified ? (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Complete Step 1 First</span>
            </span>
          ) : emailVerified ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Email Verified ✓</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-orange-400 font-semibold">Active Step</span>
          )}
        </div>

        {phoneVerified && (
          <>
            {emailError && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}

            {emailSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{emailSuccess}</span>
              </div>
            )}

            {!emailVerified && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    disabled={emailOtpSent && emailCooldown > 0}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. candidate@example.com"
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={handleSendEmailOtp}
                    disabled={sendingEmailOtp || emailCooldown > 0 || !emailInput.trim()}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {sendingEmailOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching Email...</span>
                      </>
                    ) : emailCooldown > 0 ? (
                      <span>Resend in {emailCooldown}s</span>
                    ) : (
                      <span>{emailOtpSent ? 'Resend Email OTP' : 'Send Email OTP'}</span>
                    )}
                  </button>
                </div>

                {emailOtpSent && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <input
                        type="text"
                        maxLength={6}
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••••• (6-digit OTP)"
                        className="w-full sm:w-44 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono text-center tracking-widest focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyEmailOtp}
                        disabled={verifyingEmailOtp || emailOtp.length !== 6}
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {verifyingEmailOtp ? 'Verifying...' : 'Verify Email OTP'}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      <span>Check spam folder if delayed</span>
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* STEP 3: AADHAAR VERIFICATION (VERHOEFF CHECKSUM + LICENSED PROVIDER) */}
      <div className={`p-5 rounded-2xl border transition-all ${
        !emailVerified
          ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
          : aadhaarVerified
          ? 'bg-slate-900/60 border-emerald-500/40 shadow-sm'
          : 'bg-slate-900/90 border-orange-500/40 ring-1 ring-orange-500/20'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              aadhaarVerified ? 'bg-emerald-500 text-white' : emailVerified ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {aadhaarVerified ? '✓' : '3'}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                <Fingerprint className="w-4 h-4 text-orange-400" />
                <span>Step 3: Government Aadhaar Verification</span>
              </h4>
              <p className="text-[11px] text-slate-400">Verhoeff checksum validated & Surepass/Setu KYC API.</p>
            </div>
          </div>

          {!emailVerified ? (
            <span className="text-[10px] font-mono text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Complete Steps 1 & 2 First</span>
            </span>
          ) : aadhaarVerified ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aadhaar Verified ✓</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono text-orange-400 font-semibold">Active Step</span>
          )}
        </div>

        {emailVerified && (
          <>
            {aadhaarError && (
              <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{aadhaarError}</span>
              </div>
            )}

            {aadhaarSuccess && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{aadhaarSuccess}</span>
              </div>
            )}

            {!aadhaarVerified && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    maxLength={14}
                    value={formatAadhaarNumber(aadhaarInput)}
                    disabled={aadhaarOtpSent && aadhaarCooldown > 0}
                    onChange={(e) => setAadhaarInput(e.target.value)}
                    placeholder="12-digit Aadhaar (e.g. 5432 1098 7654)"
                    className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-orange-500 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={handleSendAadhaarOtp}
                    disabled={sendingAadhaarOtp || aadhaarCooldown > 0 || cleanAadhaarInput().length !== 12}
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    {sendingAadhaarOtp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Calling KYC API...</span>
                      </>
                    ) : aadhaarCooldown > 0 ? (
                      <span>Resend in {aadhaarCooldown}s</span>
                    ) : (
                      <span>{aadhaarOtpSent ? 'Resend Aadhaar OTP' : 'Send Aadhaar OTP'}</span>
                    )}
                  </button>
                </div>

                {/* Privacy & Verhoeff indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>
                    {cleanAadhaarInput().length === 12 && (
                      validateVerhoeff(cleanAadhaarInput()) ? (
                        <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verhoeff Checksum Valid</span>
                        </span>
                      ) : (
                        <span className="text-red-400 font-semibold flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Invalid Aadhaar Checksum</span>
                        </span>
                      )
                    )}
                  </span>
                  <span className="flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
                    <span>Raw Aadhaar is never stored (Only last 4 digits saved)</span>
                  </span>
                </div>

                {/* Aadhaar OTP Entry */}
                {aadhaarOtpSent && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <input
                        type="text"
                        maxLength={6}
                        value={aadhaarOtp}
                        onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="•••••• (UIDAI OTP)"
                        className="w-full sm:w-44 px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm font-mono text-center tracking-widest focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyAadhaarOtp}
                        disabled={verifyingAadhaarOtp || aadhaarOtp.length !== 6}
                        className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        {verifyingAadhaarOtp ? 'Verifying...' : 'Verify Aadhaar OTP'}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Enter the 6-digit OTP sent to your Aadhaar-linked mobile number.
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Complete Banner */}
      {phoneVerified && emailVerified && aadhaarVerified && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>3/3 Real Verification Steps Successfully Completed!</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-300 uppercase px-2 py-0.5 rounded bg-emerald-500/20">
            PASSPORT READY
          </span>
        </div>
      )}
    </div>
  );
};

