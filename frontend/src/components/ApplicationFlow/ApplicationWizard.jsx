import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Fingerprint, 
  ScanFace, 
  ShieldCheck, 
  UserCheck, 
  Save, 
  ArrowLeft 
} from 'lucide-react';
import api from '../../api/client';
import { Step1_PersonalDetails } from './Step1_PersonalDetails';
import { Step2_JobExperience } from './Step2_JobExperience';
import { Step3_EducationSkills } from './Step3_EducationSkills';
import { Step4_IdentityVerification } from './Step4_IdentityVerification';
import { Step5_FaceVerification } from './Step5_FaceVerification';
import { Step6_VerificationSummary } from './Step6_VerificationSummary';
import { Step7_AccountActivation } from './Step7_AccountActivation';

export const ApplicationWizard = ({ initialApp, onExit, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(initialApp?.currentStep || 1);
  const [appData, setAppData] = useState(initialApp || {});
  const [saving, setSaving] = useState(false);
  const applicationId = initialApp?.id || localStorage.getItem('candidate_trust_app_id');

  const steps = [
    { num: 1, title: 'Personal', icon: <User className="w-3.5 h-3.5" /> },
    { num: 2, title: 'Job & Work', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { num: 3, title: 'Education', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { num: 4, title: 'Identity', icon: <Fingerprint className="w-3.5 h-3.5" /> },
    { num: 5, title: 'Face Biometrics', icon: <ScanFace className="w-3.5 h-3.5" /> },
    { num: 6, title: 'Scorecard', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { num: 7, title: 'Activate', icon: <UserCheck className="w-3.5 h-3.5" /> }
  ];

  // Auto-save draft whenever step or data changes
  const updateData = async (key, val) => {
    const updated = { ...appData, [key]: val };
    setAppData(updated);

    if (applicationId) {
      try {
        setSaving(true);
        await api.put(`/applications/${applicationId}/draft`, {
          currentStep,
          [key]: val
        });
      } catch (err) {
        console.warn('Autosave draft failed:', err);
      } finally {
        setSaving(false);
      }
    }
  };

  const nextStep = () => {
    const next = Math.min(currentStep + 1, steps.length);
    setCurrentStep(next);
    if (applicationId) {
      api.put(`/applications/${applicationId}/draft`, { currentStep: next });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Top Application Bar */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
        <button
          onClick={onExit}
          className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Home</span>
        </button>

        <div className="flex items-center space-x-3 text-xs">
          <span className="font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-slate-300">
            Ref: <strong className="text-blue-400">{appData.applicationNo || 'APP-DRAFT'}</strong>
          </span>
          <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
            <Save className={`w-3.5 h-3.5 ${saving ? 'text-blue-400 animate-spin' : 'text-emerald-400'}`} />
            <span>{saving ? 'Auto-saving...' : 'Draft saved'}</span>
          </div>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="mb-8">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {steps.map((s) => {
            const isCompleted = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div
                key={s.num}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-600/20 border border-blue-500/40 text-blue-300'
                    : isCompleted
                    ? 'bg-slate-900/60 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-900/30 text-slate-600 border border-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-center mb-1">
                  {s.icon}
                </div>
                <span className="text-[10px] font-semibold hidden sm:inline truncate max-w-full">
                  {s.title}
                </span>
                <span className="text-[9px] font-mono sm:hidden">
                  #{s.num}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl"
      >
        {currentStep === 1 && (
          <Step1_PersonalDetails
            data={appData}
            updateData={updateData}
            onNext={nextStep}
            applicationId={applicationId}
          />
        )}
        {currentStep === 2 && (
          <Step2_JobExperience
            data={appData}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 3 && (
          <Step3_EducationSkills
            data={appData}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            applicationId={applicationId}
          />
        )}
        {currentStep === 4 && (
          <Step4_IdentityVerification
            data={appData}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            applicationId={applicationId}
          />
        )}
        {currentStep === 5 && (
          <Step5_FaceVerification
            data={appData}
            updateData={updateData}
            onNext={nextStep}
            onPrev={prevStep}
            applicationId={applicationId}
          />
        )}
        {currentStep === 6 && (
          <Step6_VerificationSummary
            data={appData}
            onNext={nextStep}
            onPrev={prevStep}
            applicationId={applicationId}
          />
        )}
        {currentStep === 7 && (
          <Step7_AccountActivation
            data={appData}
            applicationId={applicationId}
            onComplete={onComplete}
          />
        )}
      </motion.div>
    </div>
  );
};

