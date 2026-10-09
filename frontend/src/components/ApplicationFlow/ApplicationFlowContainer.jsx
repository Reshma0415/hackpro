import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Fingerprint, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { ApplicationForm } from './ApplicationForm';
import { IdentityVerification } from './IdentityVerification';
import { VerificationSummary } from './VerificationSummary';
import { ApplicationSuccess } from './ApplicationSuccess';

export const ApplicationFlowContainer = ({ 
  onExit, 
  onGoToLogin,
  onGoToCandidatePortal,
  onGoToHRReview
}) => {
  // Stages: 'FORM' -> 'IDENTITY' -> 'SUMMARY' -> 'SUCCESS'
  const [stage, setStage] = useState('FORM');
  const [applicationData, setApplicationData] = useState({
    jobRole: 'Senior Full Stack Engineer',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    emailVerified: false,
    education: {
      tenth: { school: '', board: 'CBSE', year: '2018', percentage: '', marksheet: '' },
      twelfth: { school: '', board: 'CBSE', year: '2020', percentage: '', marksheet: '' },
      college: { collegeName: '', degree: 'B.Tech in Computer Science', branch: 'Computer Science & Engineering', university: '', cgpa: '', graduationYear: '2024', marksheet: '' }
    },
    hasWorkExperience: false,
    experience: [],
    hasInternship: false,
    internships: [],
    skills: [
      { name: 'React.js', level: 'Advanced' },
      { name: 'Node.js', level: 'Intermediate' },
      { name: 'TypeScript', level: 'Intermediate' }
    ],
    resume: { fileName: '', fileUrl: '' },
    profilePhoto: '',
    dateOfBirth: '2001-04-14',
    livePhotos: [],
    aadhaarLast4: '',
    aadhaarMasked: '',
    identityVerification: null
  });

  const [submissionResult, setSubmissionResult] = useState(null);

  // Stepper Items
  const steps = [
    { id: 'FORM', num: 1, label: 'Application Form', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'IDENTITY', num: 2, label: 'Identity & Biometrics', icon: <Fingerprint className="w-3.5 h-3.5" /> },
    { id: 'SUMMARY', num: 3, label: 'Verification Summary', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'SUCCESS', num: 4, label: 'Complete', icon: <CheckCircle2 className="w-3.5 h-3.5" /> }
  ];

  const getActiveStepNumber = () => {
    switch (stage) {
      case 'FORM': return 1;
      case 'IDENTITY': return 2;
      case 'SUMMARY': return 3;
      case 'SUCCESS': return 4;
      default: return 1;
    }
  };

  const handleFormComplete = (formData) => {
    setApplicationData(prev => ({ ...prev, ...formData }));
    setStage('IDENTITY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleIdentityComplete = (identityData) => {
    setApplicationData(prev => ({ ...prev, ...identityData }));
    setStage('SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmitSuccess = (res) => {
    setSubmissionResult(res);
    setStage('SUCCESS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Header Bar */}
      {stage !== 'SUCCESS' && (
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
          <button
            onClick={onExit}
            className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel & Back to Home</span>
          </button>

          <div className="flex items-center space-x-2 text-xs text-orange-600 font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span>Live Candidate Registration</span>
          </div>
        </div>
      )}

      {/* Progress Stepper */}
      {stage !== 'SUCCESS' && (
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2">
            {steps.slice(0, 3).map((s) => {
              const activeNum = getActiveStepNumber();
              const isCurrent = activeNum === s.num;
              const isDone = activeNum > s.num;

              return (
                <div
                  key={s.id}
                  className={`flex flex-col sm:flex-row items-center justify-center p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-orange-50 border-orange-400 text-orange-800 shadow-sm'
                      : isDone
                      ? 'bg-slate-50 border-orange-300 text-orange-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone ? 'bg-orange-500 text-white' : isCurrent ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isDone ? '✓' : s.num}
                    </div>
                    <span className="text-xs font-bold truncate">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Stage View */}
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl bg-white"
      >
        {stage === 'FORM' && (
          <ApplicationForm
            initialData={applicationData}
            onComplete={handleFormComplete}
            onCancel={onExit}
          />
        )}

        {stage === 'IDENTITY' && (
          <IdentityVerification
            initialData={applicationData}
            onComplete={handleIdentityComplete}
            onPrev={() => setStage('FORM')}
          />
        )}

        {stage === 'SUMMARY' && (
          <VerificationSummary
            data={applicationData}
            onPrev={() => setStage('IDENTITY')}
            onSubmitSuccess={handleFinalSubmitSuccess}
          />
        )}

        {stage === 'SUCCESS' && (
          <ApplicationSuccess
            result={submissionResult}
            onHomeClick={onExit}
            onLoginClick={onGoToLogin || onExit}
            onGoToCandidatePortal={onGoToCandidatePortal || onGoToLogin || onExit}
            onGoToHRReview={onGoToHRReview}
          />
        )}
      </motion.div>
    </div>
  );
};

