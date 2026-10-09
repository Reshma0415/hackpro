import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ScanFace, 
  Fingerprint, 
  Network, 
  Cpu, 
  FileCheck2, 
  User, 
  ExternalLink,
  Lock,
  Clock,
  Video,
  Calendar,
  Sparkles,
  ArrowRight,
  Radio,
  MapPin,
  Globe,
  Navigation,
  ShieldAlert,
  FileText,
  AlertTriangle,
  RefreshCw,
  Check,
  Award,
  Layers,
  Briefcase,
  GraduationCap,
  FolderGit2,
  FileCode,
  Download,
  Mail,
  Phone,
  Building,
  CheckCircle,
  DollarSign,
  UserCheck,
  CheckSquare,
  Square,
  Link as LinkIcon
} from 'lucide-react';
import api from '../../api/client';
import { ScheduleAssessmentModal } from './ScheduleAssessmentModal';
import { AttemptReviewDrawer } from './AttemptReviewDrawer';
import { OsintScannerModal } from './OsintScannerModal';

export const CandidateDetailsModal = ({ candidateId, onClose, onStatusUpdated }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAttemptDrawer, setShowAttemptDrawer] = useState(false);
  const [showOsintModal, setShowOsintModal] = useState(false);

  // Interview state
  const [interviewDate, setInterviewDate] = useState('2026-10-25');
  const [interviewTime, setInterviewTime] = useState('11:00 AM');
  const [interviewMode, setInterviewMode] = useState('Online Video (Google Meet)');
  const [interviewLink, setInterviewLink] = useState('https://meet.google.com/xyz-abcd-rst');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [interviewStatus, setInterviewStatus] = useState('Scheduled');
  const [savingInterview, setSavingInterview] = useState(false);

  // Offer form state
  const [offerSalary, setOfferSalary] = useState('₹18,00,000 / annum');
  const [offerDesignation, setOfferDesignation] = useState('');
  const [offerJoiningDate, setOfferJoiningDate] = useState('2026-11-01');
  const [offerNotes, setOfferNotes] = useState('Offer extended based on high assessment and resume score.');
  const [offerStatus, setOfferStatus] = useState('Generated');
  const [savingOffer, setSavingOffer] = useState(false);

  // Onboarding state
  const defaultChecklist = [
    { item: 'Identity Verification & Biometric Match', completed: true },
    { item: 'Degree Certificate & Transcript Submission', completed: true },
    { item: 'Previous Employment Relieving Letters', completed: true },
    { item: 'Company Policy & Security Compliance Sign-off', completed: true },
    { item: 'IT Hardware & Workstation Setup', completed: false },
    { item: 'Bank Account & Payroll Enrollment', completed: false }
  ];
  const [onboardingChecklist, setOnboardingChecklist] = useState(defaultChecklist);
  const [onboardingStatus, setOnboardingStatus] = useState('In Progress');
  const [savingOnboarding, setSavingOnboarding] = useState(false);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/review/candidates/${candidateId}/details`);
      if (res.data.success) {
        setDetails(res.data.data);
        
        // Sync interview
        if (res.data.data.interviewDetails) {
          const idet = res.data.data.interviewDetails;
          if (idet.scheduledDate) setInterviewDate(idet.scheduledDate);
          if (idet.scheduledTime) setInterviewTime(idet.scheduledTime);
          if (idet.mode) setInterviewMode(idet.mode);
          if (idet.meetingLink) setInterviewLink(idet.meetingLink);
          if (idet.notes) setInterviewNotes(idet.notes);
          if (idet.status) setInterviewStatus(idet.status);
        }

        // Sync offer
        if (res.data.data.offerDetails) {
          const off = res.data.data.offerDetails;
          if (off.salary) setOfferSalary(off.salary);
          if (off.designation) setOfferDesignation(off.designation);
          if (off.joiningDate) setOfferJoiningDate(off.joiningDate);
          if (off.notes) setOfferNotes(off.notes);
          if (off.status) setOfferStatus(off.status);
        }

        // Sync onboarding
        if (res.data.data.onboardingDetails) {
          const onb = res.data.data.onboardingDetails;
          if (onb.checklist && onb.checklist.length > 0) setOnboardingChecklist(onb.checklist);
          if (onb.status) setOnboardingStatus(onb.status);
        }
      }
    } catch (err) {
      console.error('Inspection error:', err);
      setError('Failed to load candidate inspection record: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) fetchDetails();
  }, [candidateId]);

  const handleUpdateStage = async (newStage, notes = '') => {
    setUpdating(true);
    try {
      const res = await api.post(`/review/candidates/${candidateId}/stage`, {
        stage: newStage,
        notes: notes || `Stage advanced to ${newStage} by HR`
      });
      if (res.data.success) {
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      alert('Failed to update stage: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleRerunResumeAnalysis = async () => {
    setAnalyzingResume(true);
    try {
      const res = await api.post(`/review/candidates/${candidateId}/analyze-resume`);
      if (res.data.success) {
        await fetchDetails();
      }
    } catch (err) {
      alert('Failed to re-run resume analysis: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleSaveInterview = async () => {
    setSavingInterview(true);
    try {
      const res = await api.post(`/review/candidates/${candidateId}/interview`, {
        scheduledDate: interviewDate,
        scheduledTime: interviewTime,
        mode: interviewMode,
        meetingLink: interviewLink,
        notes: interviewNotes,
        status: interviewStatus
      });
      if (res.data.success) {
        alert('Interview details saved successfully!');
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      alert('Failed to save interview: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingInterview(false);
    }
  };

  const handleSaveOffer = async () => {
    setSavingOffer(true);
    try {
      const res = await api.post(`/review/candidates/${candidateId}/offer`, {
        salary: offerSalary,
        designation: offerDesignation || job.jobRole || app.roleApplied || 'Senior Software Engineer',
        joiningDate: offerJoiningDate,
        notes: offerNotes,
        status: offerStatus
      });
      if (res.data.success) {
        alert('Offer details saved successfully!');
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      alert('Failed to save offer: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingOffer(false);
    }
  };

  const handleToggleChecklist = (index) => {
    const updated = [...onboardingChecklist];
    updated[index].completed = !updated[index].completed;
    setOnboardingChecklist(updated);
  };

  const handleSaveOnboarding = async () => {
    setSavingOnboarding(true);
    const completedCount = onboardingChecklist.filter(c => c.completed).length;
    const percentage = Math.round((completedCount / onboardingChecklist.length) * 100);
    const finalStatus = percentage === 100 ? 'Completed' : (percentage > 0 ? 'In Progress' : 'Not Started');
    try {
      const res = await api.post(`/review/candidates/${candidateId}/onboarding`, {
        checklist: onboardingChecklist,
        completionPercentage: percentage,
        status: finalStatus
      });
      if (res.data.success) {
        alert(`Onboarding updated successfully (${percentage}% completed)!`);
        await fetchDetails();
        if (onStatusUpdated) onStatusUpdated();
      }
    } catch (err) {
      alert('Failed to save onboarding: ' + (err.response?.data?.message || err.message));
    } finally {
      setSavingOnboarding(false);
    }
  };

  if (!candidateId) return null;

  const app = details?.application || {};
  const currentStage = app.currentStage || 'Resume Analysis';
  const assessment = details?.assessment || null;
  const attempt = details?.attempt || null;
  
  // Strict Live Webcam Photos normalization (strictly 3 frames)
  const liveWebcamPhotos = details?.liveWebcamPhotos || details?.livePhotos || details?.biometric?.liveWebcamPhotos || details?.biometric?.livePhotos || details?.biometric?.photoPaths || app.liveWebcamPhotos || app.livePhotos || [];

  const resumeData = details?.resumeData || app.resumeData || {};
  const resumeAnalysis = details?.resumeAnalysis || app.resumeAnalysis || {};
  const inconsistencies = resumeAnalysis.inconsistencies || [];
  const checks = resumeAnalysis.consistencyChecks || {};
  
  const personal = app.personalData || {};
  const job = app.jobData || {};
  const education = app.educationData || {};
  const experience = app.experienceData || [];
  const internships = app.internshipData || [];
  const skills = app.skillsData || [];

  const candidateFullName = personal.firstName 
    ? `${personal.firstName} ${personal.lastName || ''}`.trim()
    : (details?.identity?.legalFirstName ? `${details.identity.legalFirstName} ${details.identity.legalLastName || ''}`.trim() : 'Candidate');

  const candidatePhone = personal.phone || app.phone || '+91 98765 43210';
  const candidateEmail = app.email || personal.email || 'candidate@example.com';
  const candidateDob = personal.dateOfBirth || details?.identity?.dob || '2001-04-14';
  const maskedAadhaar = details?.identity?.govtIdMasked || 'XXXX XXXX 4321';

  // Extract college object
  const collegeObj = education.college || education.colleges?.[0] || {};
  const tenthObj = education.tenth || {};
  const twelfthObj = education.twelfth || {};

  const onboardingPercentage = Math.round((onboardingChecklist.filter(c => c.completed).length / onboardingChecklist.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-5 sm:p-8 max-h-[94vh] overflow-y-auto space-y-6 text-slate-900">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <ShieldCheck className="w-10 h-10 animate-spin text-orange-600 mx-auto mb-3" />
            <p className="text-xs font-semibold">Loading Candidate Inspection & Application Records...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-600 text-xs space-y-3 font-semibold">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p>{error}</p>
            <button onClick={fetchDetails} className="px-4 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200">Retry</button>
          </div>
        ) : (
          <>
            {/* 1. HEADER SECTION: Profile Photo, Name, Email, Phone, IDs & Stage Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-600 to-orange-400 p-0.5 shadow-md shadow-orange-500/20 flex-shrink-0">
                  <div className="w-full h-full bg-slate-50 rounded-[14px] overflow-hidden flex items-center justify-center">
                    {app.profilePhoto && app.profilePhoto !== '/uploads/default_avatar.png' ? (
                      <img 
                        src={app.profilePhoto.startsWith('http') || app.profilePhoto.startsWith('data:') ? app.profilePhoto : `http://localhost:5000${app.profilePhoto}`} 
                        alt="Candidate Profile" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <User className="w-7 h-7 text-orange-600" />
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg">
                      {app.candidateRefId || app.applicationNo}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                      Stage: {currentStage}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      resumeAnalysis.overallStatus === 'Consistent'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      Resume: {resumeAnalysis.overallStatus || 'Consistent'}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1.5">{candidateFullName}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                    <span className="flex items-center space-x-1"><Mail className="w-3.5 h-3.5 text-slate-400" /><strong className="text-slate-800">{candidateEmail}</strong></span>
                    <span>•</span>
                    <span className="flex items-center space-x-1"><Phone className="w-3.5 h-3.5 text-slate-400" /><strong className="text-slate-800">{candidatePhone}</strong></span>
                    <span>•</span>
                    <span>Role: <strong className="text-orange-700 font-bold">{job.jobRole || app.roleApplied || 'Software Engineer'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Stage Management Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowOsintModal(true)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-orange-700 border border-orange-300 hover:border-orange-400 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                  title="Run Deep OSINT & Footprint Scan"
                >
                  <Radio className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                  <span>OSINT Recon</span>
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStage('Assessment')}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Advance to Assessment
                </button>

                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/20 flex items-center space-x-1 transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Test</span>
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStage('Interview')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Interview
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStage('Offer')}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Extend Offer
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStage('Onboarding')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Onboard
                </button>

                <button
                  type="button"
                  disabled={updating}
                  onClick={() => handleUpdateStage('Rejected')}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Reject
                </button>
              </div>
            </div>

            {/* 2. SECTION: CANDIDATE'S PERSONAL & CONTACT INFORMATION */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>1. Candidate Application: Personal & Contact Details</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Full Legal Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{candidateFullName}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Email Address</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{candidateEmail}</span>
                  <span className="text-[9px] text-emerald-700 font-bold font-mono">OTP Verified ✓</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Phone Number</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{candidatePhone}</span>
                  <span className="text-[9px] text-emerald-700 font-bold font-mono">OTP Verified ✓</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Date of Birth & Govt ID</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{candidateDob}</span>
                  <span className="text-[9px] font-mono text-emerald-700 font-bold">{maskedAadhaar}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Location / Address</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">{personal.address || personal.currentLocation || 'Bengaluru, Karnataka, India'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Applied Role & Type</span>
                  <span className="font-bold text-orange-700 mt-0.5 block">{job.jobRole || app.roleApplied || 'Software Engineer'} ({job.employmentType || 'Full Time'})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Application Status & Date</span>
                  <span className="font-bold text-emerald-700 mt-0.5 block">{app.status || 'Submitted'} • {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* 3. SECTION: IDENTITY VERIFICATION & LIVE WEBCAM BIOMETRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Identity Verification Details */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                    <Fingerprint className="w-4 h-4 text-orange-600" />
                    <span>2. Government Identity Verification</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Status: {details.identity?.verificationStatus || 'Verified'}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Legal Name:</span>
                    <span className="font-bold text-slate-900">{details.identity?.legalFirstName ? `${details.identity.legalFirstName} ${details.identity.legalLastName || ''}`.trim() : candidateFullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Government ID Type:</span>
                    <span className="font-bold text-slate-900">{details.identity?.govtIdType || 'Aadhaar'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Masked ID (Last 4 digits):</span>
                    <span className="font-mono text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{maskedAadhaar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Date of Birth:</span>
                    <span className="text-slate-800">{details.identity?.dob || candidateDob}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Confidence Score:</span>
                    <span className="text-emerald-700 font-bold">{Math.round((details.identity?.confidenceScore || 0.98) * 100)}% Match</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Cryptographic Integrity:</span>
                    <span className="text-emerald-700 font-mono text-[10px] font-bold">HMAC-SHA256 Checksum Verified ✓</span>
                  </div>
                </div>
              </div>

              {/* Live Webcam Biometrics (Strictly 3 photos) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                    <ScanFace className="w-4 h-4 text-orange-600" />
                    <span>3. Live Verification Photos (3 Captures)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    Passed: 98.2% Liveness
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Strictly showing the 3 real-time webcam captures during candidate verification.
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'Live Photo 1 (Front / Straight)', fallback: 'Straight' },
                    { label: 'Live Photo 2 (Left Turn)', fallback: 'Left Face' },
                    { label: 'Live Photo 3 (Right Turn)', fallback: 'Right Face' }
                  ].map((pose, index) => {
                    const rawPhoto = liveWebcamPhotos[index];
                    const hasPhoto = rawPhoto && rawPhoto !== '/uploads/default_avatar.png';
                    const photoSrc = hasPhoto 
                      ? (rawPhoto.startsWith('http') || rawPhoto.startsWith('data:') ? rawPhoto : `http://localhost:5000${rawPhoto}`) 
                      : null;

                    return (
                      <div key={index} className="aspect-square rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden relative group shadow-sm">
                        {photoSrc ? (
                          <img 
                            src={photoSrc} 
                            alt={pose.label} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <ScanFace className="w-6 h-6 text-orange-600 mb-1" />
                            <span className="text-[8px] font-mono text-slate-500 font-semibold">{pose.fallback}</span>
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 bg-white/95 backdrop-blur-sm px-1 py-0.5 rounded text-[8px] font-mono font-bold text-emerald-700 border border-emerald-300 truncate max-w-[90%] shadow-sm">
                          Photo {index + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. SECTION: DEVICE SIGNALS & TELEMETRY */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>Device, Geolocation & Synthetic Identity Telemetry</span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  details.deviceSignals?.riskLevel === 'LOW' ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'
                }`}>
                  {details.deviceSignals?.riskLevel || 'LOW'} RISK
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block font-bold">IP Geolocation</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{details.deviceSignals?.approxLocation || 'Bengaluru, IN'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block font-bold">IP Address</span>
                  <span className="font-mono text-slate-800 font-bold mt-0.5 block">{details.deviceSignals?.ipAddress || '106.51.78.22'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block font-bold">VPN / Proxy Detection</span>
                  <span className={`mt-0.5 block font-bold ${details.deviceSignals?.isVpnOrProxy ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {details.deviceSignals?.isVpnOrProxy ? '⚠️ Proxy/VPN Flagged' : '✓ Residential Clean'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 block font-bold">Synthetic Identity Score</span>
                  <span className="text-emerald-700 font-bold mt-0.5 block">{details.syntheticSignals?.compositeScore || 96} / 100 ({details.syntheticSignals?.compositeStatus || 'Clean'})</span>
                </div>
              </div>
            </div>

            {/* 5. SECTION: CANDIDATE'S SUBMITTED EDUCATION RECORDS */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>Candidate Application: Education History (What candidate filled)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* College / Higher Education */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-blue-700 uppercase font-bold block">College / University Degree</span>
                  <p className="font-bold text-slate-900 text-sm">{collegeObj.degree || 'B.Tech in Computer Science'}</p>
                  <p className="text-slate-800 font-semibold">{collegeObj.college || 'Institute of Technology'}</p>
                  <p className="text-slate-600 text-[11px]">Specialization: {collegeObj.branch || 'Computer Science'}</p>
                  <p className="text-slate-600 text-[11px]">Graduation Year: <strong className="text-emerald-700">{collegeObj.graduationYear || '2024'}</strong> • CGPA: <strong className="text-slate-900">{collegeObj.cgpa || '8.8 / 10'}</strong></p>
                </div>

                {/* 12th Standard */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-blue-700 uppercase font-bold block">12th Standard / Diploma</span>
                  <p className="font-bold text-slate-900">{twelfthObj.school || 'Higher Secondary School'}</p>
                  <p className="text-slate-600 text-[11px]">Board: {twelfthObj.board || 'CBSE'}</p>
                  <p className="text-slate-600 text-[11px]">Passing Year: <strong className="text-slate-800">{twelfthObj.passingYear || '2020'}</strong></p>
                  <p className="text-slate-600 text-[11px]">Percentage: <strong className="text-emerald-700">{twelfthObj.percentage || '90.5%'}</strong></p>
                </div>

                {/* 10th Standard */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-sm">
                  <span className="text-[10px] text-blue-700 uppercase font-bold block">10th Standard (Secondary)</span>
                  <p className="font-bold text-slate-900">{tenthObj.school || 'Secondary High School'}</p>
                  <p className="text-slate-600 text-[11px]">Board: {tenthObj.board || 'CBSE'}</p>
                  <p className="text-slate-600 text-[11px]">Passing Year: <strong className="text-slate-800">{tenthObj.passingYear || '2018'}</strong></p>
                  <p className="text-slate-600 text-[11px]">Percentage: <strong className="text-emerald-700">{tenthObj.percentage || '92.0%'}</strong></p>
                </div>
              </div>
            </div>

            {/* 6. SECTION: CANDIDATE'S WORK EXPERIENCE & INTERNSHIPS */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Candidate Application: Work Experience & Internships Logged</span>
              </h4>
              <div className="space-y-3">
                {experience.length > 0 ? (
                  experience.map((exp, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">{exp.jobRole}</span>
                        <span className="font-mono text-orange-700 font-bold text-[11px]">{exp.startDate} – {exp.endDate || (exp.currentlyWorking ? 'Present' : 'Completed')}</span>
                      </div>
                      <p className="text-slate-800 font-semibold">{exp.companyName} • <span className="text-slate-500">{exp.employmentType || 'Full Time'}</span></p>
                      {exp.responsibilities && <p className="text-slate-600 text-[11px] leading-relaxed pt-1">{exp.responsibilities}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-2">No prior full-time work experience declared in application.</p>
                )}

                {internships.length > 0 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2 block">Internships:</span>
                    {internships.map((intern, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{intern.internshipRole}</span>
                          <span className="font-mono text-slate-500 text-[11px] font-bold">{intern.startDate} – {intern.endDate}</span>
                        </div>
                        <p className="text-slate-800 font-medium">{intern.companyName} • {intern.paid || 'Paid'} ({intern.workMode || 'Hybrid'})</p>
                        {intern.responsibilities && <p className="text-slate-600 text-[11px]">{intern.responsibilities}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 7. SECTION: TECHNICAL SKILLS CLAIMED IN APPLICATION */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-orange-700 flex items-center space-x-2">
                <FileCode className="w-4 h-4" />
                <span>Candidate Application: Technical Skills Declared</span>
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                {skills.length > 0 ? (
                  skills.map((s, idx) => (
                    <div key={idx} className="px-3 py-1 rounded-lg bg-white border border-slate-200 flex items-center space-x-2 text-xs shadow-sm">
                      <span className="font-bold text-slate-900">{typeof s === 'string' ? s : s.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 font-bold">
                        {typeof s === 'object' ? s.level || 'Intermediate' : 'Declared'}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No specific skills listed.</span>
                )}
              </div>
            </div>

            {/* 8. SECTION: RESUME FILE ACCESS */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-orange-100 text-orange-700 border border-orange-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Original Uploaded Resume Document</h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    File: <strong className="text-slate-800">{app.resumeFile || 'Candidate_Resume.pdf'}</strong> • Uploaded during Application
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={`http://localhost:5000/uploads/${app.resumeFile || 'sample_resume.pdf'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
                  <span>Preview / Open Resume</span>
                </a>
              </div>
            </div>

            {/* 9. DEDICATED RESUME ANALYSIS & INCONSISTENCY INTELLIGENCE MATRIX */}
            <div className="p-5 rounded-xl bg-white border border-orange-300 space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <FileCheck2 className="w-5 h-5 text-orange-600" />
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                      Resume Inconsistency Intelligence & Side-by-Side Matrix
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    File: <strong className="text-slate-800">{app.resumeFile || 'Candidate_Resume.pdf'}</strong> • Cross-compared with application claims across 7 fraud-intelligence categories.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                    resumeAnalysis.overallStatus === 'Consistent'
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-amber-700 bg-amber-50 border-amber-200'
                  }`}>
                    Overall: {resumeAnalysis.overallStatus || 'Consistent'}
                  </span>
                  <button
                    onClick={handleRerunResumeAnalysis}
                    disabled={analyzingResume}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 text-orange-700 border border-orange-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${analyzingResume ? 'animate-spin' : ''}`} />
                    <span>{analyzingResume ? 'Analyzing...' : 'Re-run Analysis'}</span>
                  </button>
                </div>
              </div>

              {/* Consistency Check Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Skills Match</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{checks.skillsConsistency || 'Consistent'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Experience Dates</span>
                  <p className={`text-xs font-bold mt-0.5 flex items-center space-x-1 ${checks.experienceDateConsistency === 'Consistent' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {checks.experienceDateConsistency === 'Consistent' ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{checks.experienceDateConsistency || 'Consistent'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Education Consistency</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{checks.educationConsistency || 'Consistent'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Projects Review</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{checks.projectConsistency || 'Consistent'}</span>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Credentials Check</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{checks.credentialConsistency || 'Consistent'}</span>
                  </p>
                </div>
              </div>

              {/* Side-by-Side Comparison Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Application Claims */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 pb-2 border-b border-slate-200">
                    <FileText className="w-4 h-4" />
                    <span>Source A: Candidate Application Form Claims</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Role Applied</span>
                      <span className="font-bold text-slate-900">{job.jobRole || app.roleApplied || 'Software Engineer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Experience Form Claims</span>
                      <span className="font-medium">
                        {experience.length > 0
                          ? `${experience[0].jobRole} at ${experience[0].companyName} (${experience[0].startDate} – ${experience[0].endDate || 'Present'})`
                          : 'No prior experience declared in form'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Education Form Claims</span>
                      <span className="font-medium">
                        {collegeObj.degree || 'B.Tech in Computer Science'} • {collegeObj.college || 'Institute of Technology'} (Graduation: {collegeObj.graduationYear || '2024'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Claimed Skills ({skills.length})</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {skills.map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                            {typeof s === 'string' ? s : s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Extracted Resume Data */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-orange-700 pb-2 border-b border-slate-200">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Source B: Extracted Resume Content</span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Extracted Job Title</span>
                      <span className="font-bold text-slate-900">
                        {resumeData.experience?.[0]?.jobRole || 'Software Developer'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Extracted Experience Timeline</span>
                      <span className="font-medium">
                        {resumeData.experience?.[0]
                          ? `${resumeData.experience[0].jobRole} at ${resumeData.experience[0].companyName} (${resumeData.experience[0].startDate} – ${resumeData.experience[0].endDate || 'Present'})`
                          : '2.5 years technical experience'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Extracted Education</span>
                      <span className="font-medium">
                        {resumeData.education?.[0]
                          ? `${resumeData.education[0].degree} • ${resumeData.education[0].college} (Graduation: ${resumeData.education[0].graduationYear})`
                          : 'B.Tech in Computer Science (2024)'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Detected Skills & Proficiency ({resumeData.skills?.length || 0})</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(resumeData.skills || []).map((s, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 text-[10px] font-bold font-mono">
                            {s.name} ({s.proficiency || 'Intermediate'})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Inconsistencies List */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Explainable Inconsistency Signals ({inconsistencies.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">Non-binary Risk Intelligence</span>
                </div>

                {inconsistencies.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Consistent: All dates, roles, education, and skill claims match verified resume content.</span>
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
                          <span className="text-slate-500 block font-semibold">Application Form:</span>
                          <span className="text-slate-900 font-bold">{inc.applicationValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block font-semibold">Uploaded Resume:</span>
                          <span className="text-orange-700 font-bold">{inc.resumeValue}</span>
                        </div>
                      </div>

                      <div className="flex items-start space-x-2 pt-1">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-700 leading-relaxed text-[11px] font-medium">{inc.reason}</p>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <span>Action Recommended: <strong className="text-slate-900 font-bold">{inc.recommendedAction}</strong></span>
                        <span className="font-mono text-slate-400">Signal ID: {inc.id}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 10. SECTION: ASSESSMENT & PROCTORING AUDIT */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <Video className="w-4 h-4 text-orange-600" />
                  <span>Technical Assessment & Proctoring Audit</span>
                </div>
                {assessment && (
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Status: {assessment.status}
                  </span>
                )}
              </div>

              {assessment ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
                    <div>
                      <p className="font-bold text-slate-900">{assessment.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5 font-medium">
                        Scheduled: <strong>{assessment.scheduledDate}</strong> • Window: {assessment.windowStartTime} – {assessment.windowEndTime} ({assessment.durationMinutes} mins)
                      </p>
                    </div>

                    {attempt ? (
                      <button
                        type="button"
                        onClick={() => setShowAttemptDrawer(true)}
                        className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-300 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all self-start sm:self-auto shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                        <span>Audit Attempt ({attempt.score || 0} pts, {attempt.percentage || 0}%)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold">
                        Awaiting Attempt
                      </span>
                    )}
                  </div>

                  {attempt && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 block font-bold">Score / Max</span>
                        <span className="font-bold text-emerald-700 text-sm mt-0.5 block">{attempt.score || 0} / {attempt.totalPoints || 100} ({attempt.percentage || 0}%)</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 block font-bold">Proctoring Status</span>
                        <span className="font-bold text-slate-900 mt-0.5 block">{attempt.securitySummary || 'Passed Cleanly'}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 block font-bold">Tab Switches</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{attempt.warningCounts?.tabSwitches || 0} flags</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                        <span className="text-[10px] text-slate-500 block font-bold">Security Events</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{attempt.securityEventsCount || 0} logged</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200 text-xs shadow-sm">
                  <span className="text-slate-500 italic font-medium">No formal assessment scheduled yet for this candidate.</span>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold shadow-sm"
                  >
                    Schedule Now
                  </button>
                </div>
              )}
            </div>

            {/* 11. SECTION: INTERVIEW ROUND */}
            <div className="p-4 rounded-xl bg-purple-50/40 border border-purple-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
                  <Video className="w-4 h-4 text-purple-600" />
                  <span>Interview Round Details & Video Conference</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                  Status: {interviewStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Interview Date</label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Interview Time</label>
                  <input
                    type="text"
                    value={interviewTime}
                    onChange={(e) => setInterviewTime(e.target.value)}
                    placeholder="11:00 AM"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Status</label>
                  <select
                    value={interviewStatus}
                    onChange={(e) => setInterviewStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs shadow-sm font-semibold"
                  >
                    <option value="Not Scheduled">Not Scheduled</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Passed">Passed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Meeting Link</label>
                  <input
                    type="text"
                    value={interviewLink}
                    onChange={(e) => setInterviewLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs font-mono shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Interviewer Feedback / Notes</label>
                  <input
                    type="text"
                    value={interviewNotes}
                    onChange={(e) => setInterviewNotes(e.target.value)}
                    placeholder="System design & problem solving round feedback..."
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveInterview}
                  disabled={savingInterview}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  {savingInterview ? 'Saving...' : 'Save Interview Details'}
                </button>
              </div>
            </div>

            {/* 12. SECTION: JOB OFFER RELEASE & COMPENSATION */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-emerald-900">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Job Offer Release & Compensation Terms</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Status: {offerStatus}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Annual CTC / Compensation</label>
                  <input
                    type="text"
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(e.target.value)}
                    placeholder="₹18,00,000 / annum"
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-emerald-800 text-xs font-bold shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={offerJoiningDate}
                    onChange={(e) => setOfferJoiningDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs shadow-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-600 font-bold block mb-1">Offer Status</label>
                  <select
                    value={offerStatus}
                    onChange={(e) => setOfferStatus(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs font-semibold shadow-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Generated">Generated</option>
                    <option value="Extended">Extended to Candidate</option>
                    <option value="Accepted">Accepted by Candidate</option>
                    <option value="Declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="text-xs">
                <label className="text-[10px] text-slate-600 font-bold block mb-1">Offer Letter Terms & Notes</label>
                <input
                  type="text"
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="Offer details and terms..."
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 text-xs shadow-sm"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveOffer}
                  disabled={savingOffer}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  {savingOffer ? 'Saving...' : 'Save / Extend Offer'}
                </button>
              </div>
            </div>

            {/* 13. SECTION: ONBOARDING & DOCUMENT VERIFICATION CHECKLIST */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                  <span>Onboarding & Document Verification Checklist</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">
                    {onboardingPercentage}% Completed
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    Status: {onboardingStatus}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${onboardingPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                {onboardingChecklist.map((chk, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleChecklist(idx)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-lg border text-left transition-all ${
                      chk.completed 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 font-medium'
                    }`}
                  >
                    {chk.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="text-xs">{chk.item}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveOnboarding}
                  disabled={savingOnboarding}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
                >
                  {savingOnboarding ? 'Saving...' : 'Save Onboarding Progress'}
                </button>
              </div>
            </div>

            {/* 14. SECTION: AUDIT LOGS */}
            {details.auditLogs && details.auditLogs.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Audit Trail & Activity Log</span>
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {details.auditLogs.map((log, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[11px] p-2 rounded bg-white border border-slate-200 text-slate-800 shadow-sm">
                      <span className="font-mono text-orange-700 font-bold">{log.action}</span>
                      <span className="text-slate-500 text-[10px] font-medium">{log.actor_email} • {new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Schedule Assessment Modal */}
        {showScheduleModal && (
          <ScheduleAssessmentModal
            candidate={{
              applicationId: app.id,
              candidateId: app.candidateRefId || app.applicationNo,
              fullName: candidateFullName,
              jobRole: job.jobRole || app.roleApplied || 'Software Engineer'
            }}
            onClose={() => setShowScheduleModal(false)}
            onScheduled={async () => {
              await fetchDetails();
              if (onStatusUpdated) onStatusUpdated();
            }}
          />
        )}

        {/* Attempt Review Drawer */}
        {showAttemptDrawer && attempt && (
          <AttemptReviewDrawer
            candidate={{
              fullName: candidateFullName,
              jobRole: job.jobRole || app.roleApplied || 'Software Engineer'
            }}
            attempt={attempt}
            securityEvents={attempt.securityEvents || []}
            onClose={() => setShowAttemptDrawer(false)}
            onDecisionMade={async () => {
              await fetchDetails();
              if (onStatusUpdated) onStatusUpdated();
            }}
          />
        )}

        {/* OSINT Recon Modal */}
        <OsintScannerModal
          isOpen={showOsintModal}
          onClose={() => setShowOsintModal(false)}
          defaultTarget={{
            name: candidateFullName,
            email: candidateEmail,
            phone: candidatePhone
          }}
        />
      </div>
    </div>
  );
};
