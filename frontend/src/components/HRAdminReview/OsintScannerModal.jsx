import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  Mail, 
  Phone, 
  Code2, 
  Globe, 
  User, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  X, 
  Sparkles,
  Server,
  Activity,
  Radio,
  Lock,
  Flag,
  Award,
  Share2,
  Terminal,
  Layers
} from 'lucide-react';
import api from '../../api/client';

export const OsintScannerModal = ({ isOpen, onClose, defaultTarget }) => {
  const [targetName, setTargetName] = useState(defaultTarget?.name || '');
  const [targetEmail, setTargetEmail] = useState(defaultTarget?.email || 'jsreshma15@gmail.com');
  const [targetPhone, setTargetPhone] = useState(defaultTarget?.phone || '+91 9488842345');
  const [targetGithub, setTargetGithub] = useState(defaultTarget?.github || 'torvalds');
  const [targetLeetcode, setTargetLeetcode] = useState(defaultTarget?.leetcode || 'neal_wu');
  const [targetLinkedin, setTargetLinkedin] = useState(defaultTarget?.linkedin || 'in/reshma-s');
  
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    setScanning(true);
    setError('');

    try {
      const res = await api.post('/osint/scan', {
        name: targetName,
        email: targetEmail,
        phone: targetPhone,
        github: targetGithub,
        leetcode: targetLeetcode,
        linkedin: targetLinkedin
      });

      if (res.data.success) {
        setReport(res.data.report);
      } else {
        setError(res.data.message || 'OSINT scan failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to OSINT Engine');
    } finally {
      setScanning(false);
    }
  };

  const loadPreset = (type) => {
    if (type === 'CURRENT') {
      setTargetName('Candidate Profile');
      setTargetEmail('jsreshma15@gmail.com');
      setTargetPhone('+91 9488842345');
      setTargetGithub('torvalds');
      setTargetLeetcode('neal_wu');
      setTargetLinkedin('https://www.linkedin.com/in/reshma-s');
    } else if (type === 'DEVELOPER') {
      setTargetName('Neal Wu');
      setTargetEmail('neal@stanford.edu');
      setTargetPhone('+1 650 555 0192');
      setTargetGithub('nealwu');
      setTargetLeetcode('neal_wu');
      setTargetLinkedin('https://www.linkedin.com/in/nealwu');
    } else if (type === 'SUSPICIOUS') {
      setTargetName('Anon User');
      setTargetEmail('burner123@tempmail.com');
      setTargetPhone('+1 800 555 0199');
      setTargetGithub('nonexistent_user_99887766');
      setTargetLeetcode('fake_ghost_user_404');
      setTargetLinkedin('bad_url_%%$$');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse text-orange-600" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-900 tracking-wide">
                  Candidate 360° OSINT Intelligence Suite
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-300 uppercase tracking-widest">
                  6-VECTOR RECON
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated Open Source Reconnaissance: Email DNS, Carrier, GitHub, LeetCode, LinkedIn, and Threat Analysis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Input Section */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Target Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetName}
                    onChange={(e) => setTargetName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">GitHub Username</label>
                <div className="relative">
                  <Code2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetGithub}
                    onChange={(e) => setTargetGithub(e.target.value)}
                    placeholder="e.g. torvalds"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-orange-500 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-amber-800 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>LeetCode Username</span>
                </label>
                <div className="relative">
                  <Terminal className="w-4 h-4 text-amber-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetLeetcode}
                    onChange={(e) => setTargetLeetcode(e.target.value)}
                    placeholder="e.g. neal_wu"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-sky-800 uppercase tracking-wider mb-1 flex items-center space-x-1">
                  <Share2 className="w-3.5 h-3.5 text-sky-600" />
                  <span>LinkedIn Profile / URL</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-sky-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetLinkedin}
                    onChange={(e) => setTargetLinkedin(e.target.value)}
                    placeholder="e.g. in/username or full URL"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-sky-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-sky-500 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Quick Presets:</span>
                <button
                  type="button"
                  onClick={() => loadPreset('CURRENT')}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Current Candidate
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('DEVELOPER')}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Top LeetCoder / Dev
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('SUSPICIOUS')}
                  className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  Test Burner / Suspicious
                </button>
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing 6-Vector OSINT Recon...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Execute 360° OSINT Scan</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {!report && !scanning && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Radio className="w-6 h-6 text-slate-400" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">No Active OSINT Scan</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Fill any target vector above (Email, Phone, GitHub, LeetCode, or LinkedIn) and click <strong>"Execute 360° OSINT Scan"</strong> to gather live intelligence.
              </p>
            </div>
          )}

          {report && (
            <div className="space-y-6">
              {/* Summary Bar */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-extrabold text-xl shadow-sm ${
                    report.compositeScore >= 80 
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : (report.compositeScore >= 60 ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-red-100 text-red-700 border border-red-300')
                  }`}>
                    {report.compositeScore}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-bold text-slate-900">Composite OSINT Trust Score</h4>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                        report.overallRiskLevel === 'LOW'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : (report.overallRiskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-red-100 text-red-700 border border-red-300')
                      }`}>
                        {report.overallRiskLevel} RISK
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Scanned at {new Date(report.timestamp).toLocaleTimeString()} &bull; Target: <span className="text-slate-800 font-mono font-medium">{report.target.email || report.target.phone || report.target.github}</span>
                    </p>
                  </div>
                </div>

                {report.allFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {report.allFlags.map((flag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 border border-red-300 text-red-700 rounded-lg text-[10px] font-semibold flex items-center space-x-1">
                        <Flag className="w-3 h-3" />
                        <span>{flag}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Module Cards Grid (6 Vectors) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Email OSINT Card */}
                {report.modules.email && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                        <Mail className="w-4 h-4 text-orange-600" />
                        <span>Email Intelligence</span>
                      </div>
                      <span className={`text-[11px] font-bold ${report.modules.email.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {report.modules.email.trustScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Domain Type</span>
                        <span className="font-semibold text-slate-800 truncate block">{report.modules.email.emailType}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Burner / Disposable</span>
                        <span className={`font-semibold ${report.modules.email.isDisposable ? 'text-red-600' : 'text-emerald-600'}`}>
                          {report.modules.email.isDisposable ? '⚠️ Burner' : '✓ Clean'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">MX Mail Server</span>
                        <span className={`font-semibold ${report.modules.email.hasMxRecords ? 'text-emerald-600' : 'text-red-600'}`}>
                          {report.modules.email.hasMxRecords ? 'Active' : 'No MX'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Public Gravatar</span>
                        <span className="font-semibold text-slate-800">
                          {report.modules.email.hasPublicGravatar ? 'Found ✓' : 'Not Found'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Phone OSINT Card */}
                {report.modules.phone && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                        <Phone className="w-4 h-4 text-orange-600" />
                        <span>Telecom & Carrier</span>
                      </div>
                      <span className={`text-[11px] font-bold ${report.modules.phone.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {report.modules.phone.trustScore}/100
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Carrier Operator</span>
                        <span className="font-semibold text-slate-800 truncate block">{report.modules.phone.carrier}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Line Type</span>
                        <span className="font-semibold text-slate-800 truncate block">{report.modules.phone.lineType}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Country</span>
                        <span className="font-semibold text-slate-800 truncate block">{report.modules.phone.country}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">VoIP Suspect</span>
                        <span className={`font-semibold ${report.modules.phone.isVoipSuspect ? 'text-red-600' : 'text-emerald-600'}`}>
                          {report.modules.phone.isVoipSuspect ? '⚠️ Virtual' : '✓ Cellular'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GitHub Developer Footprint Card */}
                {report.modules.github && (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                        <Code2 className="w-4 h-4 text-orange-600" />
                        <span>GitHub Public Profile</span>
                      </div>
                      <span className={`text-[11px] font-bold ${report.modules.github.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {report.modules.github.trustScore}/100
                      </span>
                    </div>

                    {report.modules.github.found ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={report.modules.github.avatarUrl}
                            alt="Avatar"
                            className="w-8 h-8 rounded-full border border-slate-300"
                          />
                          <div className="truncate">
                            <h5 className="text-xs font-bold text-slate-900 truncate">{report.modules.github.name}</h5>
                            <a
                              href={report.modules.github.profileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-orange-600 hover:underline flex items-center space-x-1"
                            >
                              <span>@{report.modules.github.username}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[9px] text-slate-500 block">Repos</span>
                            <span className="font-bold text-slate-900">{report.modules.github.publicRepos}</span>
                          </div>
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[9px] text-slate-500 block">Followers</span>
                            <span className="font-bold text-slate-900">{report.modules.github.followers}</span>
                          </div>
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[9px] text-slate-500 block">Age</span>
                            <span className="font-bold text-slate-900">{report.modules.github.accountAgeYears}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        Profile not found on GitHub.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. LeetCode Problem-Solving Footprint Card */}
                {report.modules.leetcode && (
                  <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
                        <Award className="w-4 h-4 text-amber-600" />
                        <span>LeetCode Footprint</span>
                      </div>
                      <span className={`text-[11px] font-bold ${report.modules.leetcode.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {report.modules.leetcode.trustScore}/100
                      </span>
                    </div>

                    {report.modules.leetcode.found ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 truncate">
                            {report.modules.leetcode.avatarUrl && (
                              <img
                                src={report.modules.leetcode.avatarUrl}
                                alt="LeetCode Avatar"
                                className="w-7 h-7 rounded-full border border-amber-300"
                              />
                            )}
                            <div className="truncate">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{report.modules.leetcode.realName}</h5>
                              <a
                                href={report.modules.leetcode.profileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-amber-700 hover:underline flex items-center space-x-1 font-medium"
                              >
                                <span>@{report.modules.leetcode.username}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Rank #{typeof report.modules.leetcode.ranking === 'number' ? report.modules.leetcode.ranking.toLocaleString() : report.modules.leetcode.ranking}
                          </span>
                        </div>

                        {/* Solved Stats Breakdown */}
                        <div className="grid grid-cols-4 gap-1 text-center text-xs">
                          <div className="p-1 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-[9px] text-slate-500 block">Total</span>
                            <span className="font-extrabold text-amber-700">{report.modules.leetcode.totalSolved}</span>
                          </div>
                          <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-200">
                            <span className="text-[9px] text-emerald-700 block">Easy</span>
                            <span className="font-bold text-emerald-800">{report.modules.leetcode.easySolved}</span>
                          </div>
                          <div className="p-1 rounded-lg bg-amber-50 border border-amber-200">
                            <span className="text-[9px] text-amber-700 block">Medium</span>
                            <span className="font-bold text-amber-800">{report.modules.leetcode.mediumSolved}</span>
                          </div>
                          <div className="p-1 rounded-lg bg-red-50 border border-red-200">
                            <span className="text-[9px] text-red-700 block">Hard</span>
                            <span className="font-bold text-red-800">{report.modules.leetcode.hardSolved}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                        No public LeetCode stats found.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. LinkedIn Professional Footprint Card */}
                {report.modules.linkedin && (
                  <div className="p-4 rounded-xl bg-white border border-sky-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-sky-800">
                        <Share2 className="w-4 h-4 text-sky-600" />
                        <span>LinkedIn Footprint</span>
                      </div>
                      <span className={`text-[11px] font-bold ${report.modules.linkedin.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {report.modules.linkedin.trustScore}/100
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Vanity Handle</span>
                        <span className="font-semibold text-slate-800 font-mono">@{report.modules.linkedin.handle}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 block">URL Format Integrity</span>
                          <span className={`font-semibold ${report.modules.linkedin.isValidHandleFormat ? 'text-emerald-600' : 'text-red-600'}`}>
                            {report.modules.linkedin.isValidHandleFormat ? '✓ Valid Public Profile' : '⚠️ Invalid URL Format'}
                          </span>
                        </div>
                        {report.modules.linkedin.isValidHandleFormat && (
                          <a
                            href={report.modules.linkedin.profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:text-sky-700 text-[11px] font-bold flex items-center space-x-1"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Network Threat Intelligence Card (Powered by Ropes AI) */}
                {report.modules.network && (
                  <div className="p-4 rounded-xl bg-white border border-orange-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center space-x-2 text-xs font-bold text-orange-800">
                        <Globe className="w-4 h-4 text-orange-600" />
                        <span>Ropes AI Network & Location Recon</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-bold border border-orange-300">
                          ROPES AI
                        </span>
                        <span className={`text-[11px] font-bold ${report.modules.network.riskLevel === 'LOW' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {report.modules.network.trustScore}/100
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">IP Geolocation</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {report.modules.network.city}, {report.modules.network.region}, {report.modules.network.countryCode}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">ISP & ASN</span>
                        <span className="font-semibold text-slate-800 truncate block" title={report.modules.network.isp}>
                          {report.modules.network.asn || 'AS24560'} &bull; {report.modules.network.isp}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">VPN / Proxy Detection</span>
                        <span className={`font-semibold ${report.modules.network.isVpnOrProxy ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {report.modules.network.isVpnOrProxy ? '⚠️ VPN / Proxy Active' : '✓ Residential Clean'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 block">Tor Exit Node</span>
                        <span className={`font-semibold ${report.modules.network.isTorExitNode ? 'text-red-600' : 'text-emerald-600'}`}>
                          {report.modules.network.isTorExitNode ? '🚨 Tor Node' : '✓ None'}
                        </span>
                      </div>
                    </div>

                    {/* Single Signal Human Review Disclaimer */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] text-slate-600 flex items-start space-x-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-slate-900">Ropes AI Safety Guardrail:</strong> Single IP or location signals never auto-disqualify candidates. Anomalies are flagged exclusively for human review.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Candidate Trust OSINT Suite &bull; Email &bull; Telecom &bull; GitHub &bull; LeetCode &bull; LinkedIn &bull; IP Geolocation</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
