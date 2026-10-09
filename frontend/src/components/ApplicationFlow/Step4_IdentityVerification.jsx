import React, { useState } from 'react';
import { Fingerprint, ShieldAlert, CheckCircle2, AlertTriangle, Lock, Eye, EyeOff, RefreshCw } from 'lucide-react';
import api from '../../api/client';

export const Step4_IdentityVerification = ({ data, updateData, onNext, onPrev, applicationId }) => {
  const [legalFirstName, setLegalFirstName] = useState(
    data.identity?.legalFirstName || data.personalData?.firstName || ''
  );
  const [legalLastName, setLegalLastName] = useState(
    data.identity?.legalLastName || data.personalData?.lastName || ''
  );
  const [dob, setDob] = useState(data.identity?.dob || '2001-04-14');
  const [govtIdType, setGovtIdType] = useState(data.identity?.govtIdType || 'Aadhaar');
  const [govtIdNumber, setGovtIdNumber] = useState(
    govtIdType === 'Aadhaar' ? '9876 5432 1098' : 'ABCDE1234F'
  );
  const [showRawId, setShowRawId] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState(null);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      const res = await api.post(`/applications/${applicationId}/identity-verify`, {
        legalFirstName,
        legalLastName,
        dob,
        govtIdType,
        govtIdNumber
      });

      if (res.data.success) {
        setVerifiedResult(res.data);
        updateData('identity', {
          legalFirstName,
          legalLastName,
          dob,
          govtIdType,
          govtIdMasked: res.data.maskedGovtId,
          verificationStatus: 'Verified',
          isDemo: true
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Identity verification check failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleProceed = () => {
    if (!verifiedResult && !data.identity?.govtIdMasked) {
      setError('Please complete the verification check before continuing.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
        <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
          <Fingerprint className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Government Identity Verification</h3>
          <p className="text-xs text-slate-400">Zero-knowledge government document verification & privacy-first checksum validation.</p>
        </div>
      </div>

      {/* DEMO / MOCK DISCLAIMER BANNER */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
        <div className="flex items-center space-x-2 font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>DEMO / MOCK Identity Verification Sandbox</span>
        </div>
        <p className="text-amber-200/90 pl-6">
          This system uses synthetic cryptographic verification for prototype testing. It does not claim direct UIDAI or official government API access. Raw ID numbers are never stored in plaintext; only salted SHA-256 hashes and masked strings are saved.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        {/* Legal Names */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Legal First Name (As per Govt ID) *</label>
            <input
              type="text"
              required
              value={legalFirstName}
              onChange={(e) => setLegalFirstName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Legal Last Name (As per Govt ID) *</label>
            <input
              type="text"
              required
              value={legalLastName}
              onChange={(e) => setLegalLastName(e.target.value)}
              placeholder="e.g. Morgan"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* DOB and ID Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Date of Birth *</label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Government ID Type *</label>
            <select
              value={govtIdType}
              onChange={(e) => {
                setGovtIdType(e.target.value);
                setGovtIdNumber(e.target.value === 'Aadhaar' ? '9876 5432 1098' : 'ABCDE1234F');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="Aadhaar">Aadhaar Card (12 Digits)</option>
              <option value="PAN">PAN Card (10 Alphanumeric)</option>
              <option value="Passport">Passport</option>
              <option value="Driving Licence">Driving Licence</option>
              <option value="Other">Other Government ID</option>
            </select>
          </div>
        </div>

        {/* Govt ID Number */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">{govtIdType} Identification Number *</label>
            <button
              type="button"
              onClick={() => setShowRawId(!showRawId)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1"
            >
              {showRawId ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showRawId ? 'Hide' : 'Show'}</span>
            </button>
          </div>
          <div className="relative">
            <input
              type={showRawId ? "text" : "password"}
              required
              value={govtIdNumber}
              onChange={(e) => setGovtIdNumber(e.target.value)}
              placeholder={govtIdType === 'Aadhaar' ? '12-digit number' : 'ID number'}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-mono tracking-wider focus:outline-none focus:border-blue-500"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center space-x-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Encrypted with SHA-256 salted hash. Only masked last-4 digits stored.</span>
          </p>
        </div>

        {error && (
          <p className="text-xs text-red-400 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">{error}</p>
        )}

        {/* Perform Verification Check Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-500 text-blue-300 font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all"
          >
            {verifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Verification Check (DEMO Sandbox)...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>Validate & Cryptographically Mask {govtIdType}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Verified Status Card */}
      {(verifiedResult || data.identity?.govtIdMasked) && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Identity Match Confirmed (DEMO/MOCK)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
              Status: Verified
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
            <div>
              <span className="text-slate-500">Legal Name:</span> {legalFirstName} {legalLastName}
            </div>
            <div>
              <span className="text-slate-500">Masked ID:</span>{' '}
              <span className="font-mono text-emerald-300">{verifiedResult?.maskedGovtId || data.identity?.govtIdMasked}</span>
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
          Save & Proceed to Biometric Face Verification →
        </button>
      </div>
    </div>
  );
};

