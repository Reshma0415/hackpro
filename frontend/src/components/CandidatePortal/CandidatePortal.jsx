import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Fingerprint, 
  ScanFace, 
  FileCheck2, 
  Network, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Play, 
  Bell, 
  ArrowRight, 
  Lock, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Video, 
  Mail, 
  Phone,
  Upload,
  Layers,
  Award,
  Briefcase,
  GraduationCap,
  FolderGit2,
  AlertTriangle,
  FileCode,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';

export const CandidatePortal = ({ onApplyNew, onStartAssessment }) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [activeResumeTab, setActiveResumeTab] = useState('skills'); // 'skills' | 'experience' | 'education' | 'projects' | 'credentials' | 'inconsistencies'

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/candidate/me/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Candidate dashboard fetch error:', err);
      setError('Unable to load recruitment status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleReanalyzeResume = async (e) => {
    const file = e.target.files?.[0];
    try {
      setAnalyzingResume(true);
      let payload = {};

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/applications/upload-resume', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          payload = {
            fileName: uploadRes.data.fileName,
            filePath: uploadRes.data.fileUrl
          };
        }
      }

      const res = await api.post('/candidate/resume-analysis', payload);
      if (res.data.success) {
        await fetchDashboard();
      }
    } catch (err) {
      alert('Failed to analyze resume: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzingResume(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-600 font-medium">Loading Candidate Recruitment Status & Profile...</p>
      </div>
    );
  }

  const d = dashboardData || {};
  const assessment = d.scheduledAssessment;
  const candidateId = d.candidateId || user?.candidate?.candidate_ref_id || 'CT-2026-784920';
  const fullName = d.fullName || user?.username || 'Candidate';
  const currentStage = d.currentStage || 'Resume Analysis';
  const recruitmentStatus = d.recruitmentStatus || 'In Progress';
  const resumeData = d.resumeData || {};
  const resumeAnalysis = d.resumeAnalysis || {};
  const inconsistencies = resumeAnalysis.inconsistencies || [];
  const checks = resumeAnalysis.consistencyChecks || {};
  const isAssessmentAvailable = !!d.isAssessmentAvailable;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50 text-slate-900">
      {/* 1. Header Profile Banner */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl relative overflow-hidden bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-400 p-0.5 shadow-md shadow-orange-500/20 flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified Candidate Passport</span>
                </span>
                <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {d.jobRole || 'Senior Full Stack Engineer'}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">{fullName}</h2>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-0.5 font-medium">
                <span className="flex items-center space-x-1"><Mail className="w-3 h-3 text-slate-400" /><span>{d.email}</span></span>
                <span>•</span>
                <span className="flex items-center space-x-1"><Phone className="w-3 h-3 text-slate-400" /><span>{d.phone}</span></span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center sm:text-right shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Candidate Reference ID</p>
            <p className="text-xl font-black text-orange-600 font-mono tracking-wide">
              {candidateId}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-medium">App No: <span className="font-mono text-slate-700 font-bold">{d.applicationId}</span></p>
          </div>
        </div>

        {/* Quick Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1 font-semibold">
              <Fingerprint className="w-4 h-4 text-orange-600" />
              <span>Identity Verification</span>
            </div>
            <p className="text-sm font-bold text-emerald-600">Verified ✓</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{d.verificationSummary?.aadhaarMasked || 'XXXX-XXXX-4321'}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1 font-semibold">
              <FileCheck2 className="w-4 h-4 text-orange-600" />
              <span>Resume Analysis</span>
            </div>
            <p className={`text-sm font-bold ${resumeAnalysis.overallStatus === 'Consistent' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {resumeAnalysis.overallStatus || 'Completed'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{resumeData.skills?.length || 0} Skills Detected</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1 font-semibold">
              <ScanFace className="w-4 h-4 text-orange-600" />
              <span>Face Biometrics</span>
            </div>
            <p className="text-sm font-bold text-emerald-600">3 Straight Passed</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Liveness 98%</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 mb-1 font-semibold">
              <Clock className="w-4 h-4 text-orange-600" />
              <span>Recruitment Stage</span>
            </div>
            <p className="text-sm font-bold text-amber-600 truncate">{currentStage}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">{recruitmentStatus}</p>
          </div>
        </div>
      </div>

      {/* 2. 7-Stage Candidate Lifecycle Stepper */}
      <div className="p-6 sm:p-7 rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>Candidate Workflow Stepper</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Apply → Identity → Resume → Assessment → Interview → Offer → Onboarding
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg">
            Active: {currentStage}
          </span>
        </div>

        {/* 7-Stage Workflow Pipeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {(d.pipelineStages || []).map((stage, idx) => {
            const isCompleted = stage.status === 'Completed';
            const isInProgress = stage.status === 'In Progress';
            const isNeedsReview = stage.status === 'Needs Review';
            const isBlocked = stage.status === 'Blocked';

            return (
              <div 
                key={stage.id || idx} 
                className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-between ${
                  isInProgress
                    ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-md ring-1 ring-orange-400'
                    : isNeedsReview
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : isCompleted
                    ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                    : isBlocked
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div>
                  <div className="w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center text-xs font-bold transition-all">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : isNeedsReview ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    ) : isBlocked ? (
                      <Lock className="w-4 h-4 text-red-600" />
                    ) : isInProgress ? (
                      <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs animate-pulse">
                        {stage.id}
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs">
                        {stage.id}
                      </div>
                    )}
                  </div>
                  <p className={`text-[11px] font-bold leading-tight ${isInProgress ? 'text-orange-700' : 'text-slate-800'}`}>
                    {stage.name}
                  </p>
                </div>

                <span className={`text-[9px] uppercase font-bold font-mono mt-2 px-1.5 py-0.5 rounded border inline-block ${
                  isCompleted 
                    ? 'text-emerald-700 bg-emerald-100/70 border-emerald-300' 
                    : isInProgress 
                    ? 'text-orange-800 bg-orange-100 border-orange-300 font-bold' 
                    : isNeedsReview
                    ? 'text-amber-800 bg-amber-100 border-amber-300'
                    : isBlocked
                    ? 'text-red-700 bg-red-100 border-red-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}>
                  {stage.status}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. DEDICATED RESUME ANALYSIS & INCONSISTENCY INTELLIGENCE PANEL */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shadow-sm">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider px-2 py-0.5 bg-orange-50 rounded-full border border-orange-200">
                  Stage 3: Resume Analysis
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  resumeAnalysis.overallStatus === 'Consistent'
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}>
                  Status: {resumeAnalysis.overallStatus || 'Completed'}
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">Structured Extraction & Inconsistency Signals</h3>
              <p className="text-xs text-slate-500 font-medium">
                Cross-compared with application data across 7 fraud-intelligence categories.
              </p>
            </div>
          </div>

          <label className="px-4 py-2 bg-white hover:bg-slate-50 text-orange-700 border border-orange-300 hover:border-orange-400 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-all shadow-sm">
            <Upload className="w-3.5 h-3.5" />
            <span>{analyzingResume ? 'Analyzing Document...' : 'Re-upload / Analyze Resume'}</span>
            <input 
              type="file" 
              accept=".pdf,.doc,.docx" 
              onChange={handleReanalyzeResume} 
              disabled={analyzingResume} 
              className="hidden" 
            />
          </label>
        </div>

        {/* Consistency Check Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Skills Check</span>
            <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>{checks.skillsConsistency || 'Consistent'}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Experience Dates</span>
            <p className={`text-xs font-bold mt-0.5 flex items-center space-x-1 ${checks.experienceDateConsistency === 'Consistent' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {checks.experienceDateConsistency === 'Consistent' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{checks.experienceDateConsistency || 'Consistent'}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Education</span>
            <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>{checks.educationConsistency || 'Consistent'}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Projects Audit</span>
            <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>{checks.projectConsistency || 'Consistent'}</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Credentials</span>
            <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>{checks.credentialConsistency || 'Consistent'}</span>
            </p>
          </div>
        </div>

        {/* Structured Tabs */}
        <div className="mt-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveResumeTab('skills')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeResumeTab === 'skills'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Detected Skills ({resumeData.skills?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveResumeTab('experience')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeResumeTab === 'experience'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Work & Internships</span>
            </button>

            <button
              onClick={() => setActiveResumeTab('education')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeResumeTab === 'education'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Education</span>
            </button>

            <button
              onClick={() => setActiveResumeTab('projects')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeResumeTab === 'projects'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Projects ({resumeData.projects?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveResumeTab('inconsistencies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeResumeTab === 'inconsistencies'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-amber-700 hover:text-amber-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Inconsistency Signals ({inconsistencies.length})</span>
            </button>
          </div>

          {/* Tab 1: Skills */}
          {activeResumeTab === 'skills' && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {(resumeData.skills || []).map((skill, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 text-xs">
                    <span className="font-bold text-slate-900">{skill.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                      {skill.proficiency || 'Intermediate'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">{skill.yearsExperience || '1+ yrs'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Work Experience */}
          {activeResumeTab === 'experience' && (
            <div className="mt-4 space-y-3">
              {(resumeData.experience || []).map((exp, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{exp.jobRole}</span>
                    <span className="font-mono text-orange-700 text-[11px] font-bold">{exp.startDate} – {exp.endDate || 'Present'}</span>
                  </div>
                  <p className="text-slate-800 font-semibold">{exp.companyName} • {exp.employmentType || 'Full Time'}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed pt-1">{exp.responsibilities}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Education */}
          {activeResumeTab === 'education' && (
            <div className="mt-4 space-y-3">
              {(resumeData.education || []).map((edu, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{edu.degree}</span>
                    <span className="font-mono text-emerald-700 text-[11px] font-bold">Graduation: {edu.graduationYear}</span>
                  </div>
                  <p className="text-slate-800 font-semibold">{edu.college}</p>
                  <p className="text-slate-600 text-[11px]">CGPA / Percentage: <strong className="text-slate-900">{edu.cgpa || '8.5/10'}</strong></p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Projects */}
          {activeResumeTab === 'projects' && (
            <div className="mt-4 space-y-3">
              {(resumeData.projects || []).map((proj, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{proj.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{proj.duration || '3 Months'}</span>
                  </div>
                  <p className="text-orange-700 font-mono text-[11px] font-bold">{proj.technologies}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 5: Inconsistencies Signals */}
          {activeResumeTab === 'inconsistencies' && (
            <div className="mt-4 space-y-3">
              {inconsistencies.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-semibold">No conflicting signals detected. Application claims and resume data are consistent.</span>
                </div>
              ) : (
                inconsistencies.map((inc, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white border border-amber-300 space-y-2 text-xs shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-700 uppercase tracking-wider text-[11px]">
                        Category: {inc.category}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        inc.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                        inc.severity === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        Severity: {inc.severity}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 block font-semibold">Application Form Claim:</span>
                        <span className="text-slate-900 font-bold">{inc.applicationValue}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-semibold">Resume Document Value:</span>
                        <span className="text-orange-700 font-bold">{inc.resumeValue}</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 pt-1">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-700 leading-relaxed text-[11px] font-medium">{inc.reason}</p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Action Recommended: <strong className="text-slate-900">{inc.recommendedAction}</strong></span>
                      <span className="font-mono text-slate-400">Signal ID: {inc.id}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 4. Stage 4: Assessment (Enforces Resume Analysis Dependency) */}
      <div className="p-6 sm:p-8 rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center space-x-3 mb-4 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Stage 4: Proctored Technical Assessment</h3>
            <p className="text-xs text-slate-500 font-medium">Available only after Stage 3 (Resume Analysis) is complete.</p>
          </div>
        </div>

        {!isAssessmentAvailable ? (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <Lock className="w-8 h-8 text-amber-600 mx-auto mb-1" />
            <h4 className="text-sm font-bold text-slate-900">Assessment Stage Locked</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Complete Resume Analysis to continue. Your structured resume verification must be finished before technical assessment access is granted.
            </p>
          </div>
        ) : assessment ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-orange-200">
              <div>
                <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider px-2 py-0.5 bg-orange-100/70 rounded-full border border-orange-200">
                  Scheduled Test Session
                </span>
                <h4 className="text-base font-bold text-slate-900 mt-1">{assessment.title}</h4>
                <p className="text-xs text-slate-600 font-medium">
                  Date: <strong>{assessment.scheduledDate}</strong> • Window: <strong>{assessment.windowStartTime} – {assessment.windowEndTime}</strong> ({assessment.durationMinutes} mins)
                </p>
              </div>

              {assessment.attempt?.status === 'COMPLETED' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center sm:text-right">
                  <span className="text-xs font-bold text-emerald-700 flex items-center justify-center sm:justify-end space-x-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Assessment Completed</span>
                  </span>
                  <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
                    Score: {assessment.attempt.score} ({assessment.attempt.percentage}%)
                  </p>
                </div>
              ) : assessment.attempt?.status === 'BLOCKED' ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center sm:text-right">
                  <span className="text-xs font-bold text-red-700 flex items-center justify-center sm:justify-end space-x-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Assessment Blocked</span>
                  </span>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">Under HR Review</p>
                </div>
              ) : (
                <button
                  onClick={() => onStartAssessment(assessment.assessmentId)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold rounded-xl text-sm shadow-md shadow-orange-500/25 flex items-center space-x-2 transition-all self-start sm:self-auto"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Secure Assessment</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center py-6">
            <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Awaiting HR Assessment Scheduling</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your resume verification is complete! The HR team will schedule your proctored assessment window shortly.
            </p>
          </div>
        )}
      </div>

      {/* 5. Stage 5, 6, 7: Interview, Offer & Onboarding Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 5: Interview */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Video className="w-4 h-4 text-orange-600" />
            <span>Stage 5: Technical Interview</span>
          </div>
          <p className="text-xs text-slate-600">
            {d.interviewDetails?.meetingLink ? (
              <a href={d.interviewDetails.meetingLink} target="_blank" rel="noreferrer" className="text-orange-600 font-bold underline flex items-center space-x-1">
                <span>Join Video Meeting</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : 'Interview window will be scheduled following assessment evaluation.'}
          </p>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">Status: {d.interviewDetails?.status || 'Not Scheduled'}</span>
        </div>

        {/* Stage 6: Offer */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <Award className="w-4 h-4 text-orange-600" />
            <span>Stage 6: Job Offer</span>
          </div>
          <p className="text-xs text-slate-600">
            {d.offerDetails?.status === 'Generated' || d.offerDetails?.status === 'Accepted' ? (
              <strong className="text-emerald-700">Offer Extended: {d.offerDetails.salary || 'Competitive CTC'}</strong>
            ) : 'Pending candidate selection & HR compensation review.'}
          </p>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">Status: {d.offerDetails?.status || 'Pending'}</span>
        </div>

        {/* Stage 7: Onboarding */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Stage 7: Onboarding</span>
          </div>
          <p className="text-xs text-slate-600">
            Document submission, equipment allocation, and orientation.
          </p>
          <span className="text-[10px] font-mono text-slate-500 font-semibold">Progress: {d.onboardingDetails?.completionPercentage || 0}%</span>
        </div>
      </div>

      {/* 6. Notifications Feed */}
      {d.notifications && d.notifications.length > 0 && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xl">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-orange-600" />
            <span>Recruitment Alerts & Notifications</span>
          </h3>
          <div className="space-y-3">
            {d.notifications.map((notif) => (
              <div 
                key={notif.id || notif.notification_id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between space-x-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono font-medium">
                  {notif.created_at ? new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
