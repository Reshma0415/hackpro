import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { CommonLogin } from './components/CommonLogin';
import { ApplicationFlowContainer } from './components/ApplicationFlow/ApplicationFlowContainer';
import { HRReviewDashboard } from './components/HRAdminReview/HRReviewDashboard';
import { AdminDashboard } from './components/HRAdminReview/AdminDashboard';
import { CandidatePortal } from './components/CandidatePortal/CandidatePortal';
import { SecureAssessment } from './components/Assessment/SecureAssessment';

function MainApp() {
  const { user, role, isHR, isAdmin, isCandidate } = useAuth();
  const [view, setView] = useState('landing'); // 'landing' | 'login' | 'apply' | 'hr_review' | 'admin_dashboard' | 'candidate_portal' | 'secure_assessment'
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

  // When clicking "Apply for Job": Open the application flow directly
  const handleStartApplication = () => {
    setView('apply');
  };

  // After common login successful
  const handleLoginSuccess = (userRole) => {
    if (userRole === 'ADMIN') {
      setView('admin_dashboard');
    } else if (userRole === 'HR') {
      setView('hr_review');
    } else {
      setView('candidate_portal');
    }
  };

  const handleStartAssessment = (assessmentId) => {
    setSelectedAssessmentId(assessmentId);
    setView('secure_assessment');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-orange-600 selection:text-white">
      {/* Header - hide during full proctored assessment session for maximum focus */}
      {view !== 'secure_assessment' && (
        <Navbar
          currentView={view}
          setView={setView}
          onStartApplication={handleStartApplication}
        />
      )}

      {/* Main Views */}
      <main className="flex-1">
        {view === 'landing' && (
          <LandingPage
            onApplyClick={handleStartApplication}
            onLoginClick={() => setView('login')}
          />
        )}

        {view === 'login' && (
          <CommonLogin
            onSuccess={handleLoginSuccess}
            onApplyClick={handleStartApplication}
          />
        )}

        {view === 'apply' && (
          <ApplicationFlowContainer
            onExit={() => setView('landing')}
            onGoToLogin={() => setView('login')}
            onGoToCandidatePortal={() => setView('login')}
            onGoToHRReview={() => setView('hr_review')}
          />
        )}

        {view === 'admin_dashboard' && (
          <AdminDashboard />
        )}

        {view === 'hr_review' && (
          <HRReviewDashboard />
        )}

        {view === 'candidate_portal' && (
          <CandidatePortal
            onApplyNew={handleStartApplication}
            onStartAssessment={handleStartAssessment}
          />
        )}

        {view === 'secure_assessment' && (
          <SecureAssessment
            assessmentId={selectedAssessmentId || 'ASM-2026-784920'}
            onComplete={() => setView('candidate_portal')}
            onExit={() => setView('candidate_portal')}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
